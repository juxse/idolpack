import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RAW_GROUPS } from './src/game/data.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, '.idol-selca-cache-v9.json');
let imageCache: Record<string, string> = {};

// Build group -> member list lookup from RAW_GROUPS so we never mix up members of the same group
const GROUP_MEMBERS_MAP: Record<string, string[]> = {};
for (const [groupName, , , , , membersCsv] of RAW_GROUPS) {
  GROUP_MEMBERS_MAP[groupName] = membersCsv.split(',').map((m) => m.trim());
}

// Specific stage-name / full-name aliases on K-Pop Wiki & Wikimedia Commons
const NAME_ALIASES: Record<string, string[]> = {
  'Yujin|IVE': ['An Yujin', 'An Yu-jin', 'Yujin'],
  'Wonyoung|IVE': ['Jang Wonyoung', 'Jang Won-young', 'Wonyoung'],
  'Leeseo|IVE': ['Leeseo', 'Lee Hyun-seo'],
  'Gaeul|IVE': ['Gaeul', 'Kim Ga-eul'],
  'Rei|IVE': ['Rei', 'Naoi Rei'],
  'Liz|IVE': ['Liz', 'Kim Ji-won'],
  'Yujin|Kep1er': ['Choi Yujin', 'Yujin'],
  'Coco|izna': ['Koko', 'Coco'],
  'Hu’e|BADVILLAIN': ["Hu'e", 'Hue'],
  'Rosé|BLACKPINK': ['Rosé', 'Rose'],
  'J-Hope|BTS': ['J-Hope', 'J Hope'],
  'S.Coups|SEVENTEEN': ['S.Coups', 'S Coups'],
  'The8|SEVENTEEN': ['The8', 'The 8'],
  'D.O.|EXO': ['D.O.', 'D.O', 'Doh Kyung-soo'],
  'I.N|Stray Kids': ['I.N', 'Yang Jeong-in'],
  'I.M|MONSTA X': ['I.M', 'Im Chang-kyun'],
  'A-na|Hearts2Hearts': ['A-na', 'Ana'],
  'Ye-on|Hearts2Hearts': ['Ye-on', 'Yeon'],
  'V|BTS': ['V', 'Kim Tae-hyung'],
  'J|STAYC': ['J', 'Jang Ye-eun'],
  'Nakyeon|tripleS': ['Nakyoung', 'Kim Nakyoung', 'Nakyeon'],
};

const GROUP_SEARCH_ALIASES: Record<string, string> = {
  '(G)I-DLE': 'I-DLE',
};

try {
  if (fs.existsSync(CACHE_FILE)) {
    imageCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  }
} catch {
  imageCache = {};
}

function saveImageCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(imageCache, null, 2), 'utf-8');
  } catch {
    // ignore write errors
  }
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesMemberName(title: string, alias: string): boolean {
  const cleanTitle = title.replace(/^file:/i, '').replace(/[_-]/g, ' ');
  const escaped = escapeRegex(alias.replace(/[_-]/g, ' '));
  const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
  return re.test(cleanTitle);
}

const BANNED_FILE_TERMS =
  /group|all_members|all_concept|lineup|logo|album_cover|tracklist|schedule|poster|banner|packaging|lightstick|teaser_image_group|signature|discography|concert_tour/i;

function toProxiedUrl(upstreamUrl: string): string {
  if (!upstreamUrl) return '';
  if (upstreamUrl.startsWith('/api/idol-proxy')) return upstreamUrl;
  return `/api/idol-proxy?u=${encodeURIComponent(upstreamUrl)}`;
}

/**
 * Resolves a verified, vertical solo portrait / selca photo for a specific K-Pop idol
 * while strictly filtering out group photos and other members from the same group.
 */
async function resolveIdolSelcaUrl(name: string, group: string): Promise<string> {
  const key = `${name}|${group}`;
  if (imageCache[key] && imageCache[key].startsWith('/api/idol-proxy')) {
    return imageCache[key];
  }

  const aliases = NAME_ALIASES[key] || [name];
  const groupMembers = GROUP_MEMBERS_MAP[group] || [];
  const otherMembers = groupMembers.filter(
    (m) => m.toLowerCase() !== name.toLowerCase()
  );
  const searchGroup = GROUP_SEARCH_ALIASES[group] || group;

  // 1. Primary Source: K-Pop Wiki File Search (gsrnamespace=6) with strict member & vertical dimension verification
  const fileQueries = [
    `${searchGroup} ${aliases[0]} concept photo`,
    `${searchGroup} ${aliases[0]} profile photo`,
    `${searchGroup} ${aliases[0]} photo`,
  ];

  for (const q of fileQueries) {
    try {
      const apiUrl = `https://kpop.fandom.com/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
        q
      )}&gsrlimit=15&prop=imageinfo&iiprop=url|dimensions&iiurlwidth=500`;
      const res = await fetch(apiUrl, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(4500),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          query?: {
            pages?: Record<
              string,
              {
                title?: string;
                imageinfo?: Array<{
                  url?: string;
                  thumburl?: string;
                  width?: number;
                  height?: number;
                }>;
              }
            >;
          };
        };
        const pages = Object.values(data.query?.pages || {});

        for (const p of pages) {
          const rawTitle = p.title || '';
          const info = p.imageinfo?.[0];
          if (!info) continue;
          const w = info.width || 0;
          const h = info.height || 0;

          // Must be vertical portrait orientation (prevents horizontal group/stage shots)
          if (h < w * 0.92) continue;

          // Must not contain group/poster/logo keywords
          if (BANNED_FILE_TERMS.test(rawTitle)) continue;

          // Must match at least one alias of this specific member
          if (!aliases.some((alias) => matchesMemberName(rawTitle, alias))) {
            continue;
          }

          // Must NOT mention any other member of the same group
          const mentionsOtherMember = otherMembers.some((other) => {
            if (name.toLowerCase().includes(other.toLowerCase())) return false;
            return matchesMemberName(rawTitle, other);
          });
          if (mentionsOtherMember) continue;

          const upstream = info.thumburl || info.url;
          if (upstream) {
            const proxied = toProxiedUrl(upstream);
            imageCache[key] = proxied;
            saveImageCache();
            return proxied;
          }
        }
      }
    } catch {
      // Proceed to next query
    }
  }

  // 2. Secondary Source: K-Pop Wiki Member Article / Gallery Page (gsrnamespace=0), strictly matching member title
  try {
    const pageUrl = `https://kpop.fandom.com/api.php?action=query&format=json&generator=search&gsrnamespace=0&gsrsearch=${encodeURIComponent(
      `${aliases[0]} ${searchGroup}`
    )}&gsrlimit=6&prop=pageimages&piprop=thumbnail&pithumbsize=500`;
    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        query?: {
          pages?: Record<
            string,
            { title?: string; index?: number; thumbnail?: { source?: string } }
          >;
        };
      };
      const pages = Object.values(data.query?.pages || {}).sort(
        (a, b) => (a.index || 0) - (b.index || 0)
      );
      for (const p of pages) {
        const pageTitle = p.title || '';
        const src = p.thumbnail?.source || '';
        if (!src) continue;
        // Reject group article pages
        if (pageTitle.toLowerCase() === group.toLowerCase()) continue;
        if (pageTitle.toLowerCase().startsWith(`${group.toLowerCase()}/`)) continue;
        if (BANNED_FILE_TERMS.test(src)) continue;
        if (!aliases.some((alias) => matchesMemberName(pageTitle, alias))) continue;

        const proxied = toProxiedUrl(src);
        imageCache[key] = proxied;
        saveImageCache();
        return proxied;
      }
    }
  } catch {
    // Proceed to Wikimedia Commons fallback
  }

  // 3. Tertiary Source: Wikimedia Commons vertical solo portrait search
  try {
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      `${aliases[0]} ${group}`
    )}&gsrlimit=6&prop=imageinfo&iiprop=url|dimensions&iiurlwidth=500`;
    const res = await fetch(commonsUrl, {
      headers: { 'User-Agent': 'IdolPocket3D/1.0 (https://aistudio.google.com)' },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              title?: string;
              imageinfo?: Array<{
                thumburl?: string;
                url?: string;
                width?: number;
                height?: number;
              }>;
            }
          >;
        };
      };
      const pages = Object.values(data.query?.pages || {});
      for (const p of pages) {
        const rawTitle = p.title || '';
        const info = p.imageinfo?.[0];
        if (!info || !info.thumburl) continue;
        if ((info.height || 0) < (info.width || 0)) continue;
        if (/signature|logo|svg/i.test(rawTitle)) continue;
        if (!aliases.some((alias) => matchesMemberName(rawTitle, alias))) continue;

        const proxied = toProxiedUrl(info.thumburl);
        imageCache[key] = proxied;
        saveImageCache();
        return proxied;
      }
    }
  } catch {
    // Ignore
  }

  return '';
}

// In-memory LRU binary cache for proxied idol portraits (up to 180 images in RAM)
const binaryImageCache = new Map<string, { buffer: Buffer; contentType: string }>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy route that attaches required Referer headers for Wikia/Wikimedia and caches binary image buffers
  app.get('/api/idol-proxy', async (req, res) => {
    const upstream = String(req.query.u || '').trim();
    if (
      !upstream ||
      (!upstream.startsWith('https://static.wikia.nocookie.net/') &&
        !upstream.startsWith('https://upload.wikimedia.org/') &&
        !upstream.startsWith('https://thumb.wikimedia.org/'))
    ) {
      res.status(400).end();
      return;
    }

    const cached = binaryImageCache.get(upstream);
    if (cached) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.send(cached.buffer);
      return;
    }

    try {
      const isWikia = upstream.includes('wikia.nocookie.net');
      const upstreamRes = await fetch(upstream, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          ...(isWikia ? { Referer: 'https://kpop.fandom.com/' } : {}),
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!upstreamRes.ok) {
        res.status(upstreamRes.status).end();
        return;
      }

      const contentType = upstreamRes.headers.get('content-type') || 'image/webp';
      const arrayBuf = await upstreamRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      if (binaryImageCache.size >= 180) {
        const oldestKey = binaryImageCache.keys().next().value;
        if (oldestKey) binaryImageCache.delete(oldestKey);
      }
      binaryImageCache.set(upstream, { buffer, contentType });

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.send(buffer);
    } catch {
      res.status(502).end();
    }
  });

  // Single idol selca lookup
  app.get('/api/idol-image', async (req, res) => {
    const name = String(req.query.name || '').trim();
    const group = String(req.query.group || '').trim();
    if (!name || !group) {
      res.status(400).json({ error: 'Missing name or group' });
      return;
    }
    const url = await resolveIdolSelcaUrl(name, group);
    res.json({ key: `${name}|${group}`, url });
  });

  // Batch idol selca lookup (up to 20 cards at once)
  app.post('/api/idol-images-batch', async (req, res) => {
    const items: Array<{ name: string; group: string }> = Array.isArray(req.body?.items)
      ? req.body.items.slice(0, 20)
      : [];
    const results: Record<string, string> = {};
    await Promise.all(
      items.map(async ({ name, group }) => {
        if (name && group) {
          const url = await resolveIdolSelcaUrl(name, group);
          if (url) {
            results[`${name}|${group}`] = url;
          }
        }
      })
    );
    res.json({ results, totalCached: Object.keys(imageCache).length });
  });

  // Return all currently cached image mappings on startup
  app.get('/api/idol-images-cached', (_req, res) => {
    res.json({ cache: imageCache });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IDOL POCKET 3D server running on http://localhost:${PORT}`);
  });
}

startServer();

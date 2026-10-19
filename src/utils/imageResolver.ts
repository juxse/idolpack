import { IdolCard } from '../game/data';

const LOCAL_STORAGE_KEY = 'idol_pocket_selca_v9';

let memoryCache: Record<string, string> = {};
const inflightRequests: Record<string, Promise<string> | undefined> = {};
const listeners = new Set<() => void>();

export let imageStats = {
  loaded: 0,
  pending: 0,
};

function isValidCachedUrl(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith('/api/idol-proxy?u=');
}

/**
 * Upgrades any cached 333px/500px Wikia thumbnail URL to crisp 800px HD width
 * so cards in Formation, Binder, and Full-Screen Clean Art Preview look razor-sharp.
 */
function upgradeToHdProxiedUrl(url: string): string {
  if (!url) return '';
  return url
    .replace(/scale-to-width-down%2F(333|500)/gi, 'scale-to-width-down%2F800')
    .replace(/scale-to-width-down\/(333|500)/gi, 'scale-to-width-down/800');
}

try {
  // Purge old legacy localStorage keys so outdated/wrong member photos are never reused
  ['idol_pocket_selca_v3', 'idol_pocket_selca_v4', 'idol_pocket_selca_v5'].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  });

  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (isValidCachedUrl(v)) {
        clean[k] = upgradeToHdProxiedUrl(v);
      }
    }
    memoryCache = clean;
    imageStats.loaded = Object.keys(memoryCache).length;
  }
} catch {
  memoryCache = {};
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persistCache() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(memoryCache));
    } catch {
      // ignore quota errors
    }
  }, 300);
}

let notifyScheduled = false;
function notifyListeners() {
  imageStats.loaded = Object.keys(memoryCache).length;
  if (notifyScheduled) return;
  notifyScheduled = true;
  requestAnimationFrame(() => {
    notifyScheduled = false;
    listeners.forEach((fn) => fn());
  });
}

export function subscribeImageUpdates(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Generates a stylized SVG Full-Art studio portrait data URI as an instant zero-latency placeholder
 * while the verified solo selca loads.
 */
export function getStylizedPortraitFallback(card: IdolCard): string {
  const hue = (card.id * 47) % 360;
  const secHue = (hue + 50) % 360;
  const initials = card.name.slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 520" width="360" height="520">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${card.accentColor}" />
        <stop offset="50%" stop-color="hsl(${hue}, 68%, 22%)" />
        <stop offset="100%" stop-color="#070912" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="32%" r="55%">
        <stop offset="0%" stop-color="hsl(${secHue}, 95%, 75%)" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="360" height="520" fill="url(#bg)" />
    <circle cx="180" cy="175" r="165" fill="url(#glow)" />
    <circle cx="180" cy="160" r="54" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.35)" stroke-width="2" />
    <path d="M80 365 C80 260 280 260 280 365 Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.28)" stroke-width="2" />
    <text x="180" y="176" text-anchor="middle" fill="#ffffff" font-family="Outfit, sans-serif" font-weight="800" font-size="40" letter-spacing="2">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getCachedIdolImage(card: IdolCard): string {
  const val = memoryCache[card.key];
  return isValidCachedUrl(val) ? val : '';
}

/**
 * Resolves a verified solo portrait for an idol card via backend /api/idol-image
 */
export async function resolveIdolImage(card: IdolCard): Promise<string> {
  const existing = getCachedIdolImage(card);
  if (existing) {
    return existing;
  }
  const inflight = inflightRequests[card.key];
  if (inflight) {
    return inflight;
  }

  imageStats.pending++;
  const promise = (async () => {
    try {
      const res = await fetch(
        `/api/idol-image?name=${encodeURIComponent(card.name)}&group=${encodeURIComponent(card.group)}`
      );
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (isValidCachedUrl(data.url)) {
          const hdUrl = upgradeToHdProxiedUrl(data.url);
          memoryCache[card.key] = hdUrl;
          persistCache();
          notifyListeners();
          return hdUrl;
        }
      }
    } catch {
      // Ignore network errors
    }
    return '';
  })().finally(() => {
    imageStats.pending = Math.max(0, imageStats.pending - 1);
    delete inflightRequests[card.key];
  });

  inflightRequests[card.key] = promise;
  return promise;
}

export async function prefetchIdolBatch(cards: IdolCard[]) {
  const missing = cards.filter((c) => !getCachedIdolImage(c)).slice(0, 20);
  if (missing.length === 0) return;

  try {
    const res = await fetch('/api/idol-images-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: missing.map((c) => ({ name: c.name, group: c.group })),
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { results?: Record<string, string> };
      if (data.results) {
        for (const [k, v] of Object.entries(data.results)) {
          if (isValidCachedUrl(v)) {
            memoryCache[k] = upgradeToHdProxiedUrl(v);
          }
        }
        persistCache();
        notifyListeners();
      }
    }
  } catch {
    missing.forEach((c) => resolveIdolImage(c));
  }
}

export async function syncServerImageCache() {
  try {
    const res = await fetch('/api/idol-images-cached');
    if (res.ok) {
      const data = (await res.json()) as { cache?: Record<string, string> };
      if (data.cache && Object.keys(data.cache).length > 0) {
        for (const [k, v] of Object.entries(data.cache)) {
          if (isValidCachedUrl(v)) {
            memoryCache[k] = upgradeToHdProxiedUrl(v);
          }
        }
        persistCache();
        notifyListeners();
      }
    }
  } catch {
    // ignore
  }
}

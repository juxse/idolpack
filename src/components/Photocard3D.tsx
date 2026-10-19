import React, { useEffect, useState, useRef } from 'react';
import {
  ABILITIES,
  ALL_CARDS,
  IdolCard,
  RARITY_CODES,
  RARITY_LABELS,
  ROLES,
} from '../game/data';
import {
  CardGradeTier,
  DecoFrameId,
  getCardGradeInfo,
  getCardStats,
} from '../game/rules';
import {
  getCachedIdolImage,
  getStylizedPortraitFallback,
  resolveIdolImage,
  subscribeImageUpdates,
} from '../utils/imageResolver';

export interface Photocard3DProps {
  card: IdolCard;
  level?: number;
  awakeningStars?: number;
  synergyBonus?: number;
  gradeTier?: CardGradeTier;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isSelected?: boolean;
  isNew?: boolean;
  inDeck?: boolean;
  isBias?: boolean;
  decoFrame?: DecoFrameId;
  duplicateCoins?: number;
  onClick?: () => void;
  interactive3D?: boolean;
}

export const RARITY_STYLES: Record<
  number,
  {
    outerBorder: string;
    badgeBg: string;
    badgeText: string;
    foilGradient: string;
    glowColor: string;
    innerFrame: string;
  }
> = {
  0: {
    outerBorder: 'border-slate-500/80 shadow-[0_6px_16px_rgba(0,0,0,0.65)]',
    badgeBg: 'bg-slate-700/90 border border-slate-400/50',
    badgeText: 'text-slate-100',
    foilGradient:
      'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 45%, rgba(255,255,255,0.12) 100%)',
    glowColor: 'rgba(148,163,184,0.35)',
    innerFrame: 'border-white/25',
  },
  1: {
    outerBorder: 'border-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.45)]',
    badgeBg: 'bg-sky-500/95 border border-sky-200/80',
    badgeText: 'text-white',
    foilGradient:
      'linear-gradient(125deg, rgba(56,189,248,0.28) 0%, rgba(168,85,247,0.22) 50%, rgba(56,189,248,0.32) 100%)',
    glowColor: 'rgba(56,189,248,0.55)',
    innerFrame: 'border-sky-200/45',
  },
  2: {
    outerBorder: 'border-purple-400 shadow-[0_0_22px_rgba(168,85,247,0.55)]',
    badgeBg: 'bg-purple-600/95 border border-purple-200/80',
    badgeText: 'text-white',
    foilGradient:
      'linear-gradient(125deg, rgba(192,132,252,0.35) 0%, rgba(244,114,182,0.3) 50%, rgba(56,189,248,0.35) 100%)',
    glowColor: 'rgba(168,85,247,0.65)',
    innerFrame: 'border-purple-200/55',
  },
  3: {
    outerBorder: 'border-amber-300 shadow-[0_0_26px_rgba(251,191,36,0.65)]',
    badgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-300 border border-white',
    badgeText: 'text-black',
    foilGradient:
      'linear-gradient(125deg, rgba(251,191,36,0.42) 0%, rgba(244,63,94,0.32) 50%, rgba(56,189,248,0.4) 100%)',
    glowColor: 'rgba(251,191,36,0.8)',
    innerFrame: 'border-amber-200/70',
  },
  4: {
    outerBorder: 'border-[#FF4FA3] shadow-[0_0_32px_rgba(255,79,163,0.8)]',
    badgeBg: 'bg-gradient-to-r from-[#FF4FA3] via-purple-500 to-cyan-400 border border-white',
    badgeText: 'text-white',
    foilGradient:
      'conic-gradient(from 45deg at 50% 50%, rgba(255,79,163,0.42), rgba(56,189,248,0.42), rgba(251,191,36,0.42), rgba(168,85,247,0.42), rgba(255,79,163,0.42))',
    glowColor: 'rgba(255,79,163,0.95)',
    innerFrame: 'border-pink-200/80',
  },
};

function renderDecoOverlay(decoFrame?: DecoFrameId) {
  if (!decoFrame || decoFrame === 'none') return null;

  if (decoFrame === 'starlight') {
    return (
      <svg
        viewBox="0 0 100 150"
        className="pointer-events-none absolute inset-0 w-full h-full z-20"
        aria-hidden="true"
      >
        <path
          d="M12 8 L14 13 L19 15 L14 17 L12 22 L10 17 L5 15 L10 13 Z"
          fill="#38BDF8"
          opacity="0.9"
        />
        <path
          d="M88 18 L89.5 22 L93.5 23.5 L89.5 25 L88 29 L86.5 25 L82.5 23.5 L86.5 22 Z"
          fill="#FBBF24"
          opacity="0.9"
        />
        <path
          d="M14 95 L15.5 99 L19.5 100.5 L15.5 102 L14 106 L12.5 102 L8.5 100.5 L12.5 99 Z"
          fill="#FF78C4"
          opacity="0.85"
        />
        <circle cx="86" cy="88" r="2.2" fill="#38BDF8" />
        <circle cx="20" cy="30" r="1.6" fill="#FDE047" />
      </svg>
    );
  }

  if (decoFrame === 'ribbon') {
    return (
      <svg
        viewBox="0 0 100 150"
        className="pointer-events-none absolute inset-0 w-full h-full z-20"
        aria-hidden="true"
      >
        <path
          d="M50 8 C42 2, 34 6, 38 12 C42 15, 47 11, 50 9 C53 11, 58 15, 62 12 C66 6, 58 2, 50 8 Z"
          fill="#FF4FA3"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        <circle cx="50" cy="9" r="2.4" fill="#FDE047" />
        <rect
          x="4"
          y="4"
          width="92"
          height="142"
          rx="10"
          fill="none"
          stroke="#FF4FA3"
          strokeWidth="1.2"
          strokeDasharray="4 3"
          opacity="0.75"
        />
      </svg>
    );
  }

  if (decoFrame === 'heart') {
    return (
      <svg
        viewBox="0 0 100 150"
        className="pointer-events-none absolute inset-0 w-full h-full z-20"
        aria-hidden="true"
      >
        <path
          d="M85 16 C83 13, 79 13, 79 17 C79 20, 85 24, 85 26 C85 24, 91 20, 91 17 C91 13, 87 13, 85 16 Z"
          fill="#F43F5E"
          stroke="#FFE4E6"
          strokeWidth="0.8"
        />
        <path
          d="M15 88 C13.5 86, 10.5 86, 10.5 89 C10.5 91.5, 15 94.5, 15 96 C15 94.5, 19.5 91.5, 19.5 89 C19.5 86, 16.5 86, 15 88 Z"
          fill="#FF78C4"
          stroke="#FFFFFF"
          strokeWidth="0.8"
        />
      </svg>
    );
  }

  if (decoFrame === 'crown') {
    return (
      <svg
        viewBox="0 0 100 150"
        className="pointer-events-none absolute inset-0 w-full h-full z-20"
        aria-hidden="true"
      >
        <polygon
          points="41,11 44,5 50,9 56,5 59,11"
          fill="#FBBF24"
          stroke="#FEF08A"
          strokeWidth="0.9"
        />
        <rect
          x="3.5"
          y="3.5"
          width="93"
          height="143"
          rx="10"
          fill="none"
          stroke="#FBBF24"
          strokeWidth="1.4"
          opacity="0.7"
        />
      </svg>
    );
  }

  return null;
}

/**
 * 3D Foil Card Back for interactive Tap/Flip to Reveal Ceremony & Wonder Pick
 */
export const PhotocardBack3D: React.FC<{
  rarity?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  label?: string;
}> = ({ rarity = 0, size = 'md', onClick, label = 'TAP UNTUK BUKA' }) => {
  const rStyle = RARITY_STYLES[rarity] || RARITY_STYLES[0];
  const sizeClasses = {
    xs: 'w-[62px] h-[94px] sm:w-44 sm:h-64 shrink-0 rounded-[12px] sm:rounded-[18px]',
    sm: 'w-40 h-58 sm:w-44 sm:h-64 shrink-0 rounded-[18px]',
    md: 'w-36 h-52 sm:w-52 sm:h-[304px] shrink-0 rounded-[18px] sm:rounded-[20px]',
    lg: 'w-48 h-72 sm:w-64 sm:h-[372px] shrink-0 rounded-[22px] sm:rounded-[24px]',
  }[size];

  const isResponsiveXs = size === 'xs';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{
        boxShadow: `0 12px 28px -6px ${rStyle.glowColor}`,
      }}
      className={`group relative select-none overflow-hidden border-2 ${rStyle.outerBorder} bg-[#0B0F1D] flex flex-col items-center justify-between p-2 sm:p-4 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${sizeClasses}`}
    >
      {/* Animated Prismatic Back Pattern */}
      <div
        style={{ background: rStyle.foilGradient }}
        className="pointer-events-none absolute inset-0 opacity-65 group-hover:opacity-95 transition-opacity"
      />
      <div
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.22) 0%, transparent 60%)',
        }}
        className="pointer-events-none absolute inset-0"
      />

      {/* Inner Collectors Frame */}
      <div
        className={`pointer-events-none absolute inset-1.5 sm:inset-2 rounded-[10px] sm:rounded-[14px] border ${rStyle.innerFrame}`}
      />

      <div className="relative z-10 text-[8px] sm:text-[9px] font-mono font-extrabold tracking-widest text-white/80 uppercase truncate max-w-full">
        <span className={isResponsiveXs ? 'sm:hidden' : 'hidden'}>POCKET</span>
        <span className={isResponsiveXs ? 'hidden sm:inline' : 'inline'}>IDOL POCKET</span>
      </div>

      {/* Center Emblem */}
      <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-2 my-auto">
        <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.35)] group-hover:rotate-12 transition-transform">
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 sm:w-7 sm:h-7 text-amber-300 fill-current"
            aria-hidden="true"
          >
            <path d="M12 2L14.8 8.5L22 9.3L16.5 14L18.2 21L12 17.3L5.8 21L7.5 14L2 9.3L9.2 8.5L12 2Z" />
          </svg>
        </div>
        <div
          className={`${
            isResponsiveXs ? 'hidden sm:block' : 'block'
          } px-2.5 py-1 rounded-full bg-black/75 border border-white/25 text-[10px] font-display font-black tracking-wider text-amber-300 shadow animate-pulse`}
        >
          {label}
        </div>
      </div>

      <div className="relative z-10 text-[8px] sm:text-[9px] font-mono font-bold text-white/75">
        <span className={isResponsiveXs ? 'sm:hidden' : 'hidden'}>{RARITY_CODES[rarity]}</span>
        <span className={isResponsiveXs ? 'hidden sm:inline' : 'inline'}>
          {RARITY_LABELS[rarity]} AURA
        </span>
      </div>
    </div>
  );
};

export interface ElementTheme {
  typeName: string;
  frameBg: string;
  outerRim: string;
  windowBorder: string;
  orbBg: string;
  accentText: string;
  moveBoxBg: string;
  svgPath: string;
}

export const ROLE_ELEMENT_THEMES: Record<number, ElementTheme> = {
  // 0: Main Vocal -> Water / Crystal Cyan
  0: {
    typeName: 'WATER',
    frameBg: 'linear-gradient(155deg, #0E3A5D 0%, #09233A 55%, #061524 100%)',
    outerRim: 'border-[#38BDF8]/80',
    windowBorder: 'border-[#7DD3FC]/70 shadow-[inset_0_0_12px_rgba(56,189,248,0.35)]',
    orbBg: 'bg-gradient-to-br from-[#38BDF8] to-[#0284C7] border-white/70 text-white',
    accentText: 'text-sky-300',
    moveBoxBg: 'bg-[#061320]/85 border-sky-400/30',
    svgPath: 'M12 2.5C12 2.5 6 9.2 6 13.5C6 16.8 8.7 19.5 12 19.5C15.3 19.5 18 16.8 18 13.5C18 9.2 12 2.5 12 2.5Z',
  },
  // 1: Main Dancer -> Lightning / Volt Gold
  1: {
    typeName: 'VOLT',
    frameBg: 'linear-gradient(155deg, #523607 0%, #301F04 55%, #1B1102 100%)',
    outerRim: 'border-[#FBBF24]/85',
    windowBorder: 'border-[#FDE047]/75 shadow-[inset_0_0_12px_rgba(251,191,36,0.35)]',
    orbBg: 'bg-gradient-to-br from-[#FDE047] to-[#D97706] border-white/80 text-black',
    accentText: 'text-amber-300',
    moveBoxBg: 'bg-[#1B1103]/85 border-amber-400/30',
    svgPath: 'M13 2L4.5 12.5H11L10 21.5L19.5 11H13L13 2Z',
  },
  // 2: Main Rapper -> Fire / Blaze Crimson
  2: {
    typeName: 'FIRE',
    frameBg: 'linear-gradient(155deg, #591423 0%, #350B15 55%, #1D050B 100%)',
    outerRim: 'border-[#FB7185]/85',
    windowBorder: 'border-[#FDA4AF]/70 shadow-[inset_0_0_12px_rgba(244,63,94,0.35)]',
    orbBg: 'bg-gradient-to-br from-[#FB7185] to-[#E11D48] border-white/70 text-white',
    accentText: 'text-rose-300',
    moveBoxBg: 'bg-[#1F060C]/85 border-rose-400/30',
    svgPath: 'M12 2C9.5 6 7 8.5 7 13C7 16.3 9.2 19.5 12 19.5C14.8 19.5 17 16.3 17 13C17 10 15.2 7.2 12 2ZM12 17C10.6 17 9.5 15.8 9.5 14.2C9.5 12.5 11 11.2 12 9.8C13 11.2 14.5 12.5 14.5 14.2C14.5 15.8 13.4 17 12 17Z',
  },
  // 3: Center Visual -> Psychic / Starlight Prism
  3: {
    typeName: 'PRISM',
    frameBg: 'linear-gradient(155deg, #3F1966 0%, #240E3B 55%, #140722 100%)',
    outerRim: 'border-[#C084FC]/85',
    windowBorder: 'border-[#E9D5FF]/75 shadow-[inset_0_0_12px_rgba(192,132,252,0.35)]',
    orbBg: 'bg-gradient-to-br from-[#C084FC] to-[#7E22CE] border-white/75 text-white',
    accentText: 'text-purple-300',
    moveBoxBg: 'bg-[#150723]/85 border-purple-400/30',
    svgPath: 'M12 2L14.6 8.8L21.5 11.5L14.6 14.2L12 21L9.4 14.2L2.5 11.5L9.4 8.8L12 2Z',
  },
};

function renderElementOrb(role: number, size: 'xs' | 'sm' | 'md') {
  const elem = ROLE_ELEMENT_THEMES[role] || ROLE_ELEMENT_THEMES[0];
  const dim =
    size === 'xs'
      ? 'w-3 h-3 sm:w-4 sm:h-4'
      : size === 'sm'
      ? 'w-3.5 h-3.5'
      : 'w-4 h-4 sm:w-4.5 sm:h-4.5';
  const iconDim = size === 'xs' ? 'w-2 h-2 sm:w-2.5 sm:h-2.5' : 'w-2.5 h-2.5';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border shadow-sm shrink-0 ${elem.orbBg} ${dim}`}
      title={elem.typeName}
    >
      <svg viewBox="0 0 24 24" className={`${iconDim} fill-current`} aria-hidden="true">
        <path d={elem.svgPath} />
      </svg>
    </span>
  );
}

function renderGradeSlabPlaque(gradeTier?: CardGradeTier, isResponsiveXs?: boolean) {
  if (!gradeTier || gradeTier <= 0) return null;
  const info = getCardGradeInfo(gradeTier);

  const slabStyle =
    gradeTier === 10
      ? 'bg-gradient-to-r from-[#09090B] via-[#18181B] to-[#09090B] border-[#FBBF24] text-[#FDE047] shadow-[0_0_12px_rgba(251,191,36,0.55)]'
      : gradeTier === 95
      ? 'bg-gradient-to-r from-amber-950/95 via-amber-900/90 to-amber-950/95 border-amber-300/80 text-amber-200'
      : gradeTier === 9
      ? 'bg-gradient-to-r from-sky-950/95 via-slate-900/90 to-sky-950/95 border-sky-300/75 text-sky-200'
      : 'bg-slate-900/95 border-slate-400/70 text-slate-200';

  return (
    <div
      data-testid={`card-grade-badge-${gradeTier}`}
      className={`${
        isResponsiveXs ? 'hidden sm:flex' : 'flex'
      } relative z-20 items-center justify-between px-1.5 py-0.5 rounded-[5px] border text-[8px] font-mono font-black tracking-tight mb-0.5 ${slabStyle}`}
    >
      <span className="truncate">{info.shortLabel}</span>
      <span className="ml-1 shrink-0 opacity-90">+{Math.round(info.statBonus * 100)}%</span>
    </div>
  );
}

/**
 * Dual-Tier Pokémon TCG Photocard Engine (Desktop-First Un-Truncated Edition):
 * - Common, Rare, Epic (0..2): Classic Pokémon TCG Elemental Framed Card with Beveled Portrait Window, Clean Idol Name + HP Header & Full Move Box
 * - Legendary, Mythic (3..4): Pokémon TCG Pocket Full-Art EX / Crown Card with 100% Full-Bleed Art, Stacked Group + Idol Name & Translucent EX Attack Box
 */
export const Photocard3D: React.FC<Photocard3DProps> = ({
  card,
  level = 1,
  awakeningStars = 0,
  synergyBonus = 0,
  gradeTier = 0,
  size = 'md',
  isSelected = false,
  isNew = false,
  inDeck = false,
  isBias = false,
  decoFrame = 'none',
  duplicateCoins = 0,
  onClick,
  interactive3D = true,
}) => {
  const fallbackSrc = getStylizedPortraitFallback(card);
  const [imgSrc, setImgSrc] = useState<string>(
    () => getCachedIdolImage(card) || fallbackSrc
  );
  const [tilt, setTilt] = useState<{ rx: number; ry: number; gx: number; gy: number }>({
    rx: 0,
    ry: 0,
    gx: 50,
    gy: 50,
  });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const cached = getCachedIdolImage(card);
    if (cached) {
      setImgSrc(cached);
    } else {
      resolveIdolImage(card).then((url) => {
        if (active && url) setImgSrc(url);
      });
    }

    const unsub = subscribeImageUpdates(() => {
      const updated = getCachedIdolImage(card);
      if (active && updated) setImgSrc(updated);
    });

    return () => {
      active = false;
      unsub();
    };
  }, [card]);

  const stats = getCardStats(card, level, awakeningStars, synergyBonus, gradeTier);
  const rStyle = RARITY_STYLES[card.rarity] || RARITY_STYLES[0];
  const roleInfo = ROLES[card.role] || ROLES[0];
  const elemTheme = ROLE_ELEMENT_THEMES[card.role] || ROLE_ELEMENT_THEMES[0];
  const ability = ABILITIES[card.abilityId];
  const isFullArtEx = card.rarity >= 3; // Legendary (3) and Mythic (4) are Full-Art EX / Crown cards!
  const collectorNo = `#${String(card.id + 1).padStart(3, '0')}/${ALL_CARDS.length}`;
  const exBadgeLabel = card.rarity === 4 ? 'CROWN EX' : 'EX';

  // Enlarged Desktop 2:3 Photocard proportions so names & skills have generous horizontal room
  const sizeClasses = {
    xs: 'w-[62px] h-[94px] sm:w-[136px] sm:h-[204px] xl:w-[148px] xl:h-[222px] shrink-0 rounded-[10px] sm:rounded-[16px]',
    sm: 'w-36 h-52 sm:w-44 sm:h-64 shrink-0 rounded-[16px] sm:rounded-[18px]',
    md: 'w-36 h-52 sm:w-52 sm:h-[304px] shrink-0 rounded-[16px] sm:rounded-[20px]',
    lg: 'w-48 h-72 sm:w-64 sm:h-[372px] shrink-0 rounded-[20px] sm:rounded-[22px]',
    xl: 'w-64 h-96 shrink-0 rounded-[24px]',
  }[size];

  const isResponsiveXs = size === 'xs';

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive3D || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const ry = (x - 0.5) * 20;
    const rx = (0.5 - y) * 20;
    setTilt({ rx, ry, gx: Math.round(x * 100), gy: Math.round(y * 100) });
  };

  const handlePointerLeave = () => {
    if (!interactive3D) return;
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
  };

  // ============================================================================
  // TIER A: COMMON, RARE, EPIC (0..2) -> CLASSIC POKÉMON TCG ELEMENTAL FRAMED CARD
  // ============================================================================
  if (!isFullArtEx) {
    const outerMetallicBorder =
      gradeTier === 10
        ? 'border-[#FBBF24] shadow-[0_0_24px_rgba(251,191,36,0.55)]'
        : card.rarity === 2
        ? 'border-[#C084FC] shadow-[0_0_20px_rgba(168,85,247,0.5)]'
        : card.rarity === 1
        ? 'border-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.4)]'
        : 'border-[#94A3B8]/80 shadow-[0_6px_16px_rgba(0,0,0,0.65)]';

    return (
      <div
        ref={cardRef}
        onClick={onClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        data-card-tier="tcg-framed"
        style={{
          background: elemTheme.frameBg,
          transform: interactive3D
            ? `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            : undefined,
          transition:
            tilt.rx === 0 && tilt.ry === 0
              ? 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
              : 'none',
        }}
        className={`group relative select-none overflow-hidden border-[2.5px] sm:border-[3.5px] ${outerMetallicBorder} flex flex-col justify-between p-1 sm:p-2 transition-shadow ${sizeClasses} ${
          onClick ? 'cursor-pointer' : ''
        } ${isSelected ? 'ring-2 ring-white scale-[1.03]' : ''}`}
      >
        {/* Subtle Foil Sheen for Rare & Epic Framed Cards */}
        {card.rarity >= 1 && (
          <div
            style={{
              background: rStyle.foilGradient,
              backgroundPosition: `${tilt.gx}% ${tilt.gy}%`,
            }}
            className="pointer-events-none absolute inset-0 mix-blend-color-dodge opacity-25 group-hover:opacity-55 transition-opacity"
          />
        )}

        {/* Custom Polco Deco Top-Loader Frame Overlay */}
        {renderDecoOverlay(decoFrame)}

        {/* Optional PSA Grading Slab Plaque at very top */}
        {renderGradeSlabPlaque(gradeTier, isResponsiveXs)}

        {/* 1. POKÉMON TCG HEADER: Clean Idol Name on Left (No Stage clutter!) + HP & Elemental Orb on Right */}
        <div className="relative z-10 flex items-center justify-between gap-1 px-0.5">
          <span
            className={`font-display font-black text-white leading-tight min-w-0 ${
              isResponsiveXs
                ? 'text-[8px] sm:text-[13px] truncate sm:whitespace-normal'
                : size === 'xl'
                ? 'text-base'
                : 'text-xs sm:text-[13px]'
            }`}
          >
            {card.name}
          </span>

          <div className="flex items-center gap-0.5 shrink-0">
            <span
              className={`font-mono font-black tabular-nums leading-none ${elemTheme.accentText} ${
                isResponsiveXs ? 'text-[7px] sm:text-[11px]' : 'text-[10px] sm:text-xs'
              }`}
            >
              <span className={`${isResponsiveXs ? 'hidden sm:inline' : 'inline'} text-[7px] opacity-80 mr-0.5`}>
                HP
              </span>
              {stats.hp}
            </span>
            {renderElementOrb(card.role, isResponsiveXs ? 'xs' : 'sm')}
          </div>
        </div>

        {/* 2. BEVELED POKÉMON TCG ILLUSTRATION WINDOW */}
        <div
          className={`relative z-10 w-full flex-1 my-0.5 sm:my-1 rounded-[5px] sm:rounded-[8px] overflow-hidden border-[1.5px] sm:border-2 ${elemTheme.windowBorder} bg-[#060810]`}
        >
          {/* Permanent stylized studio backdrop while high-res selca downloads */}
          <img
            src={fallbackSrc}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full object-cover object-top"
          />
          {imgSrc !== fallbackSrc && (
            <img
              src={imgSrc}
              alt={`${card.name} (${card.group})`}
              onError={() => {
                setImgSrc(fallbackSrc);
              }}
              className="pointer-events-none absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.06]"
            />
          )}

          {/* Holo Window Shimmer on Epic/Rare */}
          {card.rarity >= 1 && (
            <div
              style={{
                background:
                  'linear-gradient(125deg, transparent 25%, rgba(255,255,255,0.22) 50%, transparent 75%)',
              }}
              className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-50"
            />
          )}

          {/* Top-Left Rarity + Level Tag inside Portrait Window */}
          <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 flex items-center gap-0.5">
            <span
              className={`px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-mono font-black shadow ${rStyle.badgeBg} ${rStyle.badgeText}`}
            >
              {RARITY_CODES[card.rarity]}
            </span>
            <span className="px-1 py-0.2 rounded bg-black/70 text-[7px] sm:text-[8px] font-mono font-bold text-white tabular-nums">
              L{level}
            </span>
          </div>

          {/* Top-Right Status Badges (BIAS / NEW / UNIT / +COINS) */}
          <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex items-center gap-0.5">
            {isBias && (
              <span className="px-1 py-0.2 rounded bg-rose-500/95 text-white text-[6px] sm:text-[8px] font-mono font-black shadow">
                BIAS
              </span>
            )}
            {isNew && (
              <span className="px-1 py-0.2 rounded bg-amber-400 text-black text-[6px] sm:text-[8px] font-mono font-black shadow">
                NEW
              </span>
            )}
            {inDeck && !isNew && (
              <span
                className={`${
                  isResponsiveXs ? 'hidden sm:inline-block' : 'inline-block'
                } px-1 py-0.2 rounded bg-emerald-400 text-black text-[7px] font-mono font-black shadow`}
              >
                UNIT
              </span>
            )}
            {duplicateCoins > 0 && (
              <span className="px-1 py-0.2 rounded bg-sky-400 text-black text-[6px] sm:text-[8px] font-mono font-black shadow tabular-nums">
                +{duplicateCoins}
              </span>
            )}
          </div>

          {/* Bottom Portrait Strip: Dedicated Group Name Row & Awakening Stars */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-1.5 py-0.5 flex items-center justify-between gap-1">
            <span className="text-[7px] sm:text-[9.5px] font-mono font-bold text-white/95 truncate">
              {card.group}
            </span>
            <div className="flex items-center gap-0.2 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${
                    i < awakeningStars ? 'text-amber-300 fill-current' : 'text-white/25 fill-current'
                  }`}
                >
                  <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.51L10 14.12l-4.94 2.6.94-5.51-4-3.9 5.53-.8L10 1.5z" />
                </svg>
              ))}
            </div>
          </div>
        </div>

        {/* 3. POKÉMON TCG ATTACK MOVE BOX + COLLECTOR FOOTER */}
        <div
          className={`relative z-10 rounded-[5px] sm:rounded-[7px] border px-1 py-0.5 sm:px-1.5 sm:py-1 ${elemTheme.moveBoxBg} flex flex-col gap-0.5`}
        >
          {/* Attack Move Line: Single Energy Orb + Un-truncated Move Name + ATK Damage */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              {renderElementOrb(card.role, 'xs')}
              <span
                className={`font-display font-bold text-white leading-tight ${
                  isResponsiveXs
                    ? 'text-[7px] sm:text-[9.5px] truncate'
                    : 'text-[9px] sm:text-[10.5px] whitespace-nowrap'
                }`}
              >
                {ability ? ability.name : roleInfo.name}
              </span>
            </div>
            <span
              className={`font-mono font-black tabular-nums text-amber-300 shrink-0 ${
                isResponsiveXs ? 'text-[8px] sm:text-[11px]' : 'text-[10px] sm:text-xs'
              }`}
            >
              {stats.atk}
            </span>
          </div>

          {/* Bottom Collector Metadata Line (Desktop / Larger Cards) */}
          <div
            className={`${
              isResponsiveXs ? 'hidden sm:flex' : 'flex'
            } items-center justify-between text-[7px] font-mono text-slate-300/80 border-t border-white/10 pt-0.5 tabular-nums`}
          >
            <span>
              {card.era} · {elemTheme.typeName}
            </span>
            <span>{collectorNo}</span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // TIER B: LEGENDARY & MYTHIC (3..4) -> POKÉMON TCG POCKET FULL-ART EX / CROWN
  // ============================================================================
  const exOuterBorder =
    gradeTier === 10
      ? 'border-[#FBBF24] shadow-[0_0_28px_rgba(251,191,36,0.65)]'
      : rStyle.outerBorder;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-card-tier="tcg-fullart-ex"
      style={{
        transform: interactive3D
          ? `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
          : undefined,
        transition:
          tilt.rx === 0 && tilt.ry === 0
            ? 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'none',
      }}
      className={`group relative select-none overflow-hidden border-[2.5px] sm:border-[3px] ${exOuterBorder} bg-[#0B0E18] flex flex-col justify-between transition-shadow ${sizeClasses} ${
        onClick ? 'cursor-pointer' : ''
      } ${isSelected ? 'ring-2 ring-white scale-[1.03]' : ''}`}
    >
      {/* 100% Full-Bleed Idol Selca Portrait (Pokémon TCG EX / Crown Full-Art) */}
      <img
        src={fallbackSrc}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full object-cover object-top"
      />
      {imgSrc !== fallbackSrc && (
        <img
          src={imgSrc}
          alt={`${card.name} (${card.group})`}
          onError={() => {
            setImgSrc(fallbackSrc);
          }}
          className="pointer-events-none absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.06]"
        />
      )}

      {/* Prismatic Diagonal EX Holographic Foil Layer */}
      <div
        style={{
          background: rStyle.foilGradient,
          backgroundPosition: `${tilt.gx}% ${tilt.gy}%`,
        }}
        className="pointer-events-none absolute inset-0 mix-blend-color-dodge opacity-42 group-hover:opacity-75 transition-opacity"
      />

      {/* Interactive 3D Specular Light Glare */}
      {interactive3D && (
        <div
          style={{
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.36) 0%, transparent 55%)`,
          }}
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}

      {/* Top & Bottom Full-Art EX Vignette */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(6,8,16,0.72) 0%, rgba(6,8,16,0.0) 28%, rgba(6,8,16,0.12) 52%, rgba(6,8,16,0.90) 78%, rgba(6,8,16,0.98) 100%)',
        }}
        className="pointer-events-none absolute inset-0"
      />

      {/* Inner Double-Bezel Metallic EX Frame */}
      <div
        className={`pointer-events-none absolute inset-[3px] sm:inset-[5px] rounded-[8px] sm:rounded-[13px] border ${rStyle.innerFrame}`}
      />

      {/* Custom Polco Deco Top-Loader Frame Overlay */}
      {renderDecoOverlay(decoFrame)}

      {/* TOP POKÉMON EX HEADER + OPTIONAL PSA GRADING SLAB PLAQUE (SINGLE CLEAN ROW SO PORTRAIT IS UNOBSTRUCTED) */}
      <div className="relative z-10 px-1 pt-1 sm:px-2.5 sm:pt-2 flex flex-col gap-0.5">
        {renderGradeSlabPlaque(gradeTier, isResponsiveXs)}

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
            <span
              className={`px-1 sm:px-1.5 py-0.2 rounded text-[7px] sm:text-[9px] font-mono font-black tracking-tight shadow shrink-0 ${rStyle.badgeBg} ${rStyle.badgeText}`}
            >
              {exBadgeLabel}
            </span>
            <span className="px-1 py-0.2 rounded bg-black/70 backdrop-blur-md text-[7px] sm:text-[9px] font-mono font-bold text-white border border-white/15 tabular-nums shrink-0">
              L{level}
            </span>
            {isBias && (
              <span className="px-1 py-0.2 rounded bg-rose-500/95 text-white text-[6px] sm:text-[8px] font-mono font-black shadow shrink-0">
                BIAS
              </span>
            )}
            {isNew && (
              <span className="px-1 py-0.2 rounded bg-amber-400 text-black text-[6px] sm:text-[8px] font-mono font-black shadow shrink-0">
                NEW
              </span>
            )}
            {duplicateCoins > 0 && (
              <span className="px-1 py-0.2 rounded bg-sky-400 text-black text-[6px] sm:text-[8px] font-mono font-black shadow tabular-nums shrink-0">
                +{duplicateCoins}
              </span>
            )}
          </div>

          <div
            title={`Stamina HP: ${stats.hp} · Elemen: ${elemTheme.typeName} (${roleInfo.name})`}
            className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/20 shrink-0"
          >
            <span className="text-[7px] sm:text-[10px] font-mono font-black text-amber-300 tabular-nums">
              <span className={`${isResponsiveXs ? 'hidden sm:inline' : 'inline'} text-[7px] text-white/80 mr-0.5`}>
                HP
              </span>
              {stats.hp}
            </span>
            {renderElementOrb(card.role, isResponsiveXs ? 'xs' : 'sm')}
          </div>
        </div>
      </div>

      {/* Center Full-Art Showcase Spacer */}
      <div className="flex-1" />

      {/* BOTTOM POKÉMON EX TRANSLUCENT MOVE BOX (SEPARATE GROUP & NAME ROWS SO NAMES NEVER TRUNCATE) */}
      <div className="relative z-10 px-1.5 pb-1.5 pt-2 sm:px-2.5 sm:pb-2 sm:pt-3 flex flex-col gap-0.5">
        {/* Row 1: Dedicated Group Name + Awakening Stars + Era Strip */}
        <div
          className={`${
            isResponsiveXs ? 'hidden sm:flex' : 'flex'
          } items-center justify-between text-[8px] sm:text-[9.5px] font-mono font-bold text-amber-200/95 leading-none`}
        >
          <span className="truncate">{card.group}</span>
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className={`w-2 h-2 ${
                    i < awakeningStars ? 'text-amber-300 fill-current' : 'text-white/25 fill-current'
                  }`}
                >
                  <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.51L10 14.12l-4.94 2.6.94-5.51-4-3.9 5.53-.8L10 1.5z" />
                </svg>
              ))}
            </div>
            <span className="text-[7.5px] text-white/75">{card.era}</span>
          </div>
        </div>

        {/* Row 2: Full-Width Idol Name + ex Badge (Never collides with Group Name!) */}
        <div
          className={`font-display font-black text-white leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${
            isResponsiveXs
              ? 'text-[9px] sm:text-[15px] truncate sm:whitespace-normal'
              : size === 'xl'
              ? 'text-xl'
              : 'text-sm sm:text-base'
          }`}
        >
          <span>{card.name}</span>{' '}
          <span className="text-[8px] sm:text-[10px] font-mono font-black text-amber-300 italic">
            ex
          </span>
        </div>

        {/* Row 3: Translucent EX Attack Strip (Single Energy Orb + Full Skill Name + ATK) */}
        <div className="mt-0.5 px-1 py-0.5 sm:px-1.5 sm:py-1 rounded sm:rounded-lg bg-black/80 backdrop-blur-md border border-amber-300/35 flex items-center justify-between gap-1 text-[8px] sm:text-[9.5px]">
          <div className="flex items-center gap-1 min-w-0">
            {renderElementOrb(card.role, 'xs')}
            <span
              className={`font-display font-bold text-white/95 leading-tight ${
                isResponsiveXs
                  ? 'truncate'
                  : 'whitespace-nowrap'
              }`}
            >
              {ability ? ability.name : roleInfo.name}
            </span>
          </div>
          <span className="text-amber-300 font-mono font-black tabular-nums shrink-0">{stats.atk}</span>
        </div>

        <div
          className={`${
            isResponsiveXs ? 'hidden sm:flex' : 'flex'
          } items-center justify-between text-[7px] font-mono text-white/70 px-0.5 tabular-nums`}
        >
          <span>EX RULE · FULL-ART HOLO</span>
          <span>{collectorNo}</span>
        </div>
      </div>
    </div>
  );
};


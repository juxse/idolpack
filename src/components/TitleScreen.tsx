import React, { useEffect } from 'react';
import { ALL_CARDS, RAW_GROUPS, WORLD_TOUR_CITIES } from '../game/data';

interface TitleScreenProps {
  onStartGame: () => void;
  totalCollected: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame, totalCollected }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-5 md:p-12 select-none bg-gradient-to-r from-[#090A0F]/95 via-[#090A0F]/65 to-transparent">
      {/* Top Studio Info Line */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] md:text-xs font-mono tracking-widest text-slate-300">
          SEASON 2026 · {RAW_GROUPS.length} GROUPS · {ALL_CARDS.length} SELCA PHOTOCARDS · {WORLD_TOUR_CITIES.length * 5} STAGES
        </div>
        {totalCollected > 0 && (
          <div className="text-[11px] md:text-xs font-mono text-slate-300 tabular-nums">
            BINDER PROGRESS: {totalCollected}/{ALL_CARDS.length}
          </div>
        )}
      </div>

      {/* Left-Third Asymmetric Negative Space Lockup */}
      <div className="my-auto max-w-lg pointer-events-auto bg-[#090A0F]/80 md:bg-transparent p-5 md:p-0 rounded-2xl border border-white/10 md:border-none">
        {/* Custom Inline SVG Title Emblem Lockup */}
        <svg
          viewBox="0 0 520 155"
          className="w-full max-w-[440px] h-auto drop-shadow-[0_10px_28px_rgba(0,0,0,0.85)]"
          role="img"
          aria-label="IDOL POCKET 3D — K-Pop Photocard Trading Card Game"
        >
          <defs>
            <linearGradient id="crestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF4FA3" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="metalText" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>

          {/* Diegetic 3D Starlight Crest Icon */}
          <g transform="translate(8, 12)">
            <polygon
              points="42,0 54,28 84,30 60,49 68,78 42,62 16,78 24,49 0,30 30,28"
              fill="url(#crestGrad)"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            <circle cx="42" cy="41" r="12" fill="#090A0F" />
            <circle cx="42" cy="41" r="5" fill="#FBBF24" />
          </g>

          {/* Main Display Title Lockup */}
          <text
            x="108"
            y="62"
            fill="url(#metalText)"
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
            fontSize="54"
            letterSpacing="2"
          >
            IDOL POCKET
          </text>

          {/* 3D Emblem Tag */}
          <rect x="110" y="78" width="92" height="34" rx="8" fill="url(#crestGrad)" />
          <text
            x="156"
            y="102"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
            fontSize="22"
            letterSpacing="1.5"
          >
            3D TCG
          </text>

          <text
            x="216"
            y="101"
            fill="#E2E8F0"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="700"
            fontSize="18"
            letterSpacing="3"
          >
            WORLD TOUR EDITION
          </text>

          <line
            x1="110"
            y1="128"
            x2="495"
            y2="128"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5"
          />
          <text
            x="110"
            y="147"
            fill="#94A3B8"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
            fontSize="11.5"
            letterSpacing="1.8"
          >
            HOLOGRAPHIC SELCA COLLECTOR · LIVE 5V5 STAGE ARENA
          </text>
        </svg>

        <p className="mt-4 text-sm md:text-base text-slate-200 max-w-md leading-relaxed">
          Sobek kemasan foil 3D untuk mengoleksi selca asli idol dari 41 grup K-Pop (BTS, BLACKPINK, TWICE, IVE, aespa, NewJeans, KiiiKiii, RESCENE, izna, dan lainnya), bangun kombinasi Synergy Unit, lalu taklukkan 90 panggung World Tour!
        </p>

        {/* Primary Action Handshake */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartGame();
            }}
            className="px-8 py-4 rounded-xl bg-[#FF4FA3] hover:bg-[#ff3395] active:scale-95 text-white font-display font-extrabold text-lg tracking-wider shadow-[0_12px_32px_rgba(255,79,163,0.45)] transition-transform cursor-pointer whitespace-nowrap shrink-0"
          >
            MASUK STUDIO 3D
          </button>
        </div>
      </div>

      {/* Bottom Safe Margin Flat Inline Control Hint */}
      <div className="text-center md:text-left text-[11px] md:text-xs font-mono text-slate-400">
        Klik Kemasan 3D untuk Sobek Foil · Tombol 1–4 Navigasi Studio · P Jeda · H Mode Sinema · Enter Mulai
      </div>
    </div>
  );
};

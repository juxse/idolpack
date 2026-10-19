import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  Scissors,
  Sparkles,
  Target,
  Ticket,
} from 'lucide-react';
import { BOOSTER_BANNERS, RARITY_LABELS } from '../game/data';
import type { BoosterPackBanner, IdolCard } from '../game/data';
import {
  FATE_POINT_PITY_MAX,
  getBannerCollectionStats,
  PITY_EXOTIC_MAX,
  PITY_LEGEND_MAX,
  PITY_MYTHIC_MAX,
} from '../game/rules';
import type { PullOutcomeItem, SaveState } from '../game/rules';
import { Photocard3D, PhotocardBack3D } from './Photocard3D';
import { sound } from '../utils/sound';

const RARITY_HEX_COLORS = [
  '#94A3B8',
  '#38BDF8',
  '#A855F7',
  '#F59E0B',
  '#FF4FA3',
  '#67E8F9',
] as const;

interface PackRipViewProps {
  saveState: SaveState;
  activeBanner: BoosterPackBanner;
  onSelectBanner: (banner: BoosterPackBanner) => void;
  onSelectFocusGroup: (groupName: string | null) => void;
  packRipState: 'idle' | 'ripping' | 'opened';
  pulledItems: PullOutcomeItem[];
  onTriggerPull: (count: 1 | 5 | 10) => void;
  onResetPackStage: () => void;
  onInspectCard: (card: IdolCard) => void;
}

export const PackRipView: React.FC<PackRipViewProps> = ({
  saveState,
  activeBanner,
  onSelectBanner,
  onSelectFocusGroup,
  packRipState,
  pulledItems,
  onTriggerPull,
  onResetPackStage,
  onInspectCard,
}) => {
  const [swipeProgress, setSwipeProgress] = useState<number>(0);
  const [flippedIndices, setFlippedIndices] = useState<Record<number, boolean>>({});
  const [packTilt, setPackTilt] = useState({ rx: 0, ry: 0 });
  const isDraggingTearRef = useRef(false);
  const tearStartXRef = useRef(0);

  // Reset flipped indices when a new pack is opened
  useEffect(() => {
    if (packRipState === 'opened') {
      setFlippedIndices({});
    } else if (packRipState === 'idle') {
      setSwipeProgress(0);
      setFlippedIndices({});
    }
  }, [packRipState, pulledItems]);

  const availableGroupsForBanner = activeBanner.featuredGroups;
  const activeFocusGroup =
    saveState.focusGroup && availableGroupsForBanner.includes(saveState.focusGroup)
      ? saveState.focusGroup
      : null;

  const canPull5 = saveState.freePacks > 0 || saveState.coins >= activeBanner.costPack5;
  const canPull1 = saveState.coins >= activeBanner.costSingle;
  const bannerDexStats = getBannerCollectionStats(saveState, activeBanner.id);

  const handleFlipCard = (idx: number) => {
    if (flippedIndices[idx]) {
      onInspectCard(pulledItems[idx].card);
      return;
    }
    const item = pulledItems[idx];
    const r = item.pulledRarity ?? item.card.rarity;
    if (r === 5) {
      sound.playVictory();
    } else {
      sound.playCardReveal(r);
    }
    setFlippedIndices((prev) => ({ ...prev, [idx]: true }));
  };

  const handleFlipAll = () => {
    const next: Record<number, boolean> = {};
    let highestRarity = 0;
    pulledItems.forEach((it, idx) => {
      next[idx] = true;
      const r = it.pulledRarity ?? it.card.rarity;
      if (r > highestRarity) highestRarity = r;
    });
    if (highestRarity === 5) {
      sound.playVictory();
    } else {
      sound.playCardReveal(highestRarity);
    }
    setFlippedIndices(next);
  };

  const allFlipped =
    pulledItems.length > 0 &&
    pulledItems.every((_, idx) => Boolean(flippedIndices[idx]));

  return (
    <div className="relative z-10 h-full w-full overflow-y-auto lg:overflow-hidden px-3 sm:px-6 pt-16 pb-20 flex flex-col items-center justify-center select-none">
      {/* IDLE / RIPPING PHASE: STRICT SINGLE-VIEWPORT STUDIO CONSOLE */}
      {packRipState !== 'opened' && (
        <div
          data-testid="pack-studio-control-bar"
          className="w-full max-w-6xl mx-auto flex flex-col gap-3"
        >
          {/* Compact Top Banner & Pity Header */}
          <div className="rounded-3xl bg-[#0D1120]/90 border border-white/15 p-3.5 sm:p-4 shadow-2xl flex flex-col gap-2.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              {/* 4 Booster Edition Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                {BOOSTER_BANNERS.map((b) => {
                  const active = b.id === activeBanner.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onSelectBanner(b)}
                      style={{
                        borderColor: active ? b.accentHex : 'rgba(255,255,255,0.1)',
                        background: active
                          ? `linear-gradient(135deg, ${b.accentHex}30, rgba(15,18,34,0.95))`
                          : 'rgba(13,16,30,0.75)',
                      }}
                      className="px-3 py-2 rounded-2xl border text-left transition-all cursor-pointer hover:scale-[1.01]"
                    >
                      <div
                        style={{ color: b.accentHex }}
                        className="text-[9px] font-mono font-extrabold uppercase tracking-wider truncate"
                      >
                        {b.badge}
                      </div>
                      <div className="text-xs sm:text-sm font-display font-extrabold text-white truncate mt-0.5">
                        {b.title}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Pokémon TCG Pocket Pack Dex & Pity Counter Capsule */}
              <div
                data-testid="pack-dex-pity-capsule"
                className="flex flex-wrap items-center justify-between lg:justify-end gap-2 shrink-0"
              >
                <div className="flex items-center gap-2.5 bg-[#070A14] px-3 py-1.5 rounded-xl border border-white/12 text-[11px] font-mono tabular-nums">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-sans font-semibold text-[10px]">
                        Pack Dex
                      </span>
                      <strong className="text-sky-300">
                        {bannerDexStats.ownedInBanner}/{bannerDexStats.totalInBanner} ({bannerDexStats.pct}%)
                      </strong>
                    </div>
                    <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        style={{ width: `${bannerDexStats.pct}%` }}
                        className="h-full bg-gradient-to-r from-sky-400 to-[#FF4FA3]"
                      />
                    </div>
                  </div>

                  <span className="h-6 w-[1px] bg-white/10" />

                  <div className="flex items-center gap-2 text-slate-300">
                    <span title={`Jaminan kartu Legendary dalam ${bannerDexStats.pullsUntilLegend} pull lagi`}>
                      Legend:{' '}
                      <strong className="text-amber-300">
                        {bannerDexStats.legendPityProgress}/{PITY_LEGEND_MAX}
                      </strong>
                    </span>
                    <span className="text-white/20">·</span>
                    <span title={`Jaminan kartu Mythic dalam ${bannerDexStats.pullsUntilMythic} pull lagi`}>
                      Mythic:{' '}
                      <strong className="text-[#FF4FA3]">
                        {bannerDexStats.mythicPityProgress}/{PITY_MYTHIC_MAX}
                      </strong>
                    </span>
                    <span className="text-white/20">·</span>
                    <span
                      title={`Jaminan kartu 🌈 EXOTIC dalam ${bannerDexStats.pullsUntilExotic} pull lagi`}
                      className="bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 bg-clip-text text-transparent font-black"
                    >
                      Exotic: {bannerDexStats.exoticPityProgress}/{PITY_EXOTIC_MAX}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinpoint Group Rate-Up Selector + Fate Point Pity Bar */}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Target className="w-3.5 h-3.5 text-sky-400" />
                  <span>Target Grup Rate-Up:</span>
                  <span className="text-sky-300 font-mono text-[11px]">
                    {activeFocusGroup
                      ? `${activeFocusGroup} (18% Rate-Up + Fate Pity)`
                      : 'Semua Grup Merata'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-slate-400">Fate Points:</span>
                  <div className="w-24 h-2 rounded-full bg-black/60 overflow-hidden border border-white/15">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          ((saveState.fatePoints || 0) / FATE_POINT_PITY_MAX) * 100
                        )}%`,
                      }}
                      className="h-full bg-gradient-to-r from-sky-400 to-[#FF4FA3] transition-all duration-300"
                    />
                  </div>
                  <strong className="text-amber-300 tabular-nums">
                    {saveState.fatePoints || 0}/{FATE_POINT_PITY_MAX}
                  </strong>
                </div>
              </div>

              {/* Single-row horizontal group chip selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => onSelectFocusGroup(null)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
                    !activeFocusGroup
                      ? 'bg-sky-400 text-slate-950 shadow'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  Semua Grup
                </button>
                {availableGroupsForBanner.map((grp) => {
                  const isFocused = activeFocusGroup === grp;
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => onSelectFocusGroup(isFocused ? null : grp)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
                        isFocused
                          ? 'bg-[#FF4FA3] text-white shadow-[0_0_12px_rgba(255,79,163,0.45)]'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      🎯 {grp}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Single-Viewport 2-Column Pack Foil Stage (Left: 3D Foil Pack, Right: Actions & Tear Bar) */}
          <div className="rounded-3xl bg-[#0D1120]/90 border border-white/15 p-4 sm:p-5 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Left 5 Columns: Interactive 3D Foil Booster Pack */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div
                onPointerMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const nx = (e.clientX - rect.left) / rect.width - 0.5;
                  const ny = (e.clientY - rect.top) / rect.height - 0.5;
                  setPackTilt({ rx: -ny * 16, ry: nx * 20 });
                }}
                onPointerLeave={() => setPackTilt({ rx: 0, ry: 0 })}
                style={{
                  transform: `perspective(1000px) rotateX(${packTilt.rx}deg) rotateY(${packTilt.ry}deg)`,
                }}
                className="relative w-48 h-68 sm:w-52 sm:h-72 select-none transition-transform duration-150"
              >
                {/* Top Tear Strip */}
                <div
                  style={{
                    transform:
                      packRipState === 'ripping'
                        ? 'translateY(-48px) rotate(-14deg) scale(0.95)'
                        : `translateX(${swipeProgress * 0.25}px) rotate(${swipeProgress * -0.05}deg)`,
                    opacity: packRipState === 'ripping' ? 0 : 1,
                    background: `linear-gradient(90deg, ${activeBanner.accentHex}, #38BDF8, #FDE047)`,
                  }}
                  className="absolute -top-1 inset-x-0 h-8 rounded-t-2xl border-2 border-white/40 z-20 flex items-center justify-between px-3 shadow-lg transition-all duration-300"
                >
                  <span className="text-[9px] font-mono font-extrabold text-slate-950 tracking-widest uppercase">
                    ✂ SOBEK SEGEL HOLOGRAM
                  </span>
                  <Scissors className="w-3.5 h-3.5 text-slate-950" />
                </div>

                {/* Main Foil Pack Body */}
                <div
                  onClick={() => {
                    if (canPull5) onTriggerPull(5);
                    else if (canPull1) onTriggerPull(1);
                  }}
                  style={{
                    borderColor: activeBanner.accentHex,
                    boxShadow: `0 20px 55px -12px ${activeBanner.accentHex}66`,
                    background: `radial-gradient(circle at 30% 25%, ${activeBanner.accentHex}44, transparent 60%), linear-gradient(155deg, #1E1538 0%, #0D1021 55%, #190D2C 100%)`,
                  }}
                  className="w-full h-full rounded-3xl border-2 p-4 flex flex-col justify-between relative overflow-hidden cursor-pointer group"
                >
                  <div
                    style={{
                      background:
                        'linear-gradient(125deg, transparent 20%, rgba(255,79,163,0.22) 40%, rgba(56,189,248,0.26) 50%, rgba(253,224,71,0.2) 60%, transparent 80%)',
                    }}
                    className="pointer-events-none absolute inset-0 mix-blend-screen"
                  />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[9px] font-mono font-bold text-white">
                      5 PHOTOCARD
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>

                  <div className="relative z-10 my-auto text-center space-y-1.5">
                    <div
                      style={{ color: activeBanner.accentHex }}
                      className="text-[10px] font-mono font-extrabold tracking-[0.2em] uppercase"
                    >
                      {activeBanner.badge}
                    </div>
                    <h2 className="text-lg sm:text-xl font-display font-black text-white leading-tight drop-shadow">
                      {activeBanner.title}
                    </h2>
                    {activeFocusGroup && (
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#FF4FA3]/25 border border-[#FF4FA3] text-[10px] font-mono font-bold text-pink-200">
                        🎯 Fokus: {activeFocusGroup}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono text-amber-200">
                      <span>Klik Kemasan atau Geser Segel</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7 Columns: Pack Description, Interactive Tear Track & Pull Buttons */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-3.5">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300 uppercase mb-1.5">
                  <span>EDISI BOOSTER PACK RESMI</span>
                  <span>·</span>
                  <span className="text-amber-300 font-bold">Jaminan 1+ Kartu Rare/Epic/Mythic</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-black text-white">
                  {activeBanner.title} — {activeBanner.badge}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {activeBanner.subtitle} · Menampilkan:{' '}
                  <strong className="text-white">
                    {activeBanner.featuredGroups.slice(0, 8).join(', ')}
                  </strong>
                  .
                </p>
              </div>

              {/* Interactive Tear Slider */}
              <div className="p-3 rounded-2xl bg-black/45 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>Geser Segel Kemasan untuk Membuka 5 Kartu:</span>
                  <span className="text-amber-300 font-bold">{swipeProgress}%</span>
                </div>
                <div
                  onPointerDown={(e) => {
                    isDraggingTearRef.current = true;
                    tearStartXRef.current = e.clientX;
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingTearRef.current) return;
                    const delta = Math.max(0, e.clientX - tearStartXRef.current);
                    const pct = Math.min(100, Math.round((delta / 220) * 100));
                    setSwipeProgress(pct);
                    if (pct >= 85) {
                      isDraggingTearRef.current = false;
                      if (canPull5) onTriggerPull(5);
                      else if (canPull1) onTriggerPull(1);
                      else setSwipeProgress(0);
                    }
                  }}
                  onPointerUp={() => {
                    isDraggingTearRef.current = false;
                    if (swipeProgress < 85) setSwipeProgress(0);
                  }}
                  className="w-full h-10 rounded-xl bg-[#13182B] border border-white/15 relative overflow-hidden flex items-center px-3 cursor-ew-resize"
                >
                  <div
                    style={{ width: `${swipeProgress}%` }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FF4FA3]/55 to-sky-400/55 transition-all"
                  />
                  <span className="relative z-10 text-xs font-mono font-bold text-slate-200 mx-auto">
                    ➔ Geser Segel ke Kanan untuk Sobek Pack 3D
                  </span>
                </div>
              </div>

              {/* Direct Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid="open-5pack-btn"
                  disabled={!canPull5 || packRipState === 'ripping'}
                  onClick={() => onTriggerPull(5)}
                  className={`flex-1 min-w-[210px] min-h-[48px] px-5 py-3 rounded-2xl font-display font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-transform cursor-pointer ${
                    canPull5 && packRipState !== 'ripping'
                      ? 'bg-gradient-to-r from-[#FF4FA3] via-purple-500 to-sky-500 text-white shadow-[0_10px_28px_rgba(255,79,163,0.45)] hover:scale-[1.01] active:scale-95'
                      : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  {saveState.freePacks > 0 ? (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>BUKA 5-PACK GRATIS ({saveState.freePacks} TIKET)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>SOBEK 5-PACK ({activeBanner.costPack5} 🪙)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  data-testid="open-1pack-btn"
                  disabled={!canPull1 || packRipState === 'ripping'}
                  onClick={() => onTriggerPull(1)}
                  className={`min-h-[48px] px-5 py-3 rounded-2xl font-display font-bold text-xs sm:text-sm border transition-transform cursor-pointer ${
                    canPull1 && packRipState !== 'ripping'
                      ? 'bg-[#151B30] hover:bg-[#1E2642] text-white border-white/20 active:scale-95'
                      : 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'
                  }`}
                >
                  Buka 1 Kartu ({activeBanner.costSingle} 🪙)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPENED PHASE: SINGLE-VIEWPORT 5-COLUMN THEATER STAGE */}
      {packRipState === 'opened' && (
        <div
          data-testid="pack-theater-reveal-stage"
          className="w-full max-w-7xl mx-auto flex flex-col items-center justify-between gap-3 rounded-3xl bg-[#0B0F1E]/92 border border-white/15 px-4 py-4 sm:px-6 sm:py-5 shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
        >
          {/* Top Theater Header + Action Controls */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-white/10">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300 font-bold">
                ✨ BOOSTER PACK REVEAL THEATER · {activeBanner.title.toUpperCase()}
              </div>
              <h3 className="text-base sm:text-xl font-display font-black text-white">
                {allFlipped
                  ? 'Semua Photocard Terbuka! Klik Kartu untuk Inspeksi & PSA Grading'
                  : 'Ketuk Masing-Masing Photocard untuk Membuka Segel Hologram'}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!allFlipped && (
                <button
                  type="button"
                  data-testid="flip-all-cards-btn"
                  onClick={handleFlipAll}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-display font-extrabold text-xs sm:text-sm shadow-lg cursor-pointer"
                >
                  ✨ Balik Semua Sekaligus
                </button>
              )}

              {allFlipped && (
                <>
                  <button
                    type="button"
                    disabled={!canPull5}
                    onClick={() => onTriggerPull(5)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl font-display font-extrabold text-xs sm:text-sm cursor-pointer ${
                      canPull5
                        ? 'bg-gradient-to-r from-[#FF4FA3] to-sky-500 text-white shadow-lg'
                        : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                    }`}
                  >
                    {saveState.freePacks > 0
                      ? `Buka 5-Pack Lagi (Gratis · ${saveState.freePacks})`
                      : `Buka 5-Pack Lagi (${activeBanner.costPack5} 🪙)`}
                  </button>

                  <button
                    type="button"
                    onClick={onResetPackStage}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Ganti Pack</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 5-Column Side-by-Side Card Reveal Row (Fits 100% in Single Desktop Viewport) */}
          <div
            data-testid="pack-reveal-5col-grid"
            className={`w-full grid ${
              pulledItems.length === 1
                ? 'grid-cols-1 max-w-xs mx-auto'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
            } gap-3 sm:gap-4 justify-items-center py-2`}
          >
            {pulledItems.map((item, idx) => {
              const isFlipped = Boolean(flippedIndices[idx]);
              const pulledRarity = item.pulledRarity !== undefined ? item.pulledRarity : item.card.rarity;
              const rColor = RARITY_HEX_COLORS[pulledRarity] || '#38BDF8';
              const isExotic = pulledRarity === 5;

              return (
                <div key={`${item.card.id}-${idx}`} className="flex flex-col items-center gap-1.5">
                  {!isFlipped ? (
                    <div className="relative">
                      {pulledRarity >= 2 && (
                        <div
                          style={{
                            boxShadow: isExotic
                              ? '0 0 34px 8px rgba(56,189,248,0.95), 0 0 55px 14px rgba(255,79,163,0.8)'
                              : `0 0 28px 4px ${rColor}`,
                            borderColor: isExotic ? '#67E8F9' : rColor,
                          }}
                          className="pointer-events-none absolute -inset-1 rounded-[22px] border-2 animate-pulse"
                        />
                      )}
                      <PhotocardBack3D
                        size="md"
                        accentColor={isExotic ? '#67E8F9' : pulledRarity >= 2 ? rColor : activeBanner.accentHex}
                        label={isExotic ? '🌈 EXOTIC!' : 'KETUK BUKA'}
                        onClick={() => handleFlipCard(idx)}
                      />
                    </div>
                  ) : (
                    <Photocard3D
                      card={item.card}
                      effectiveRarity={pulledRarity}
                      rarityMask={saveState.cardRarityMask?.[item.card.id]}
                      level={saveState.lv[item.card.id] || 1}
                      awakeningStars={saveState.stars[item.card.id] || 0}
                      isBias={saveState.biasCardId === item.card.id}
                      decoFrame={saveState.cardDeco?.[item.card.id]}
                      gradeTier={saveState.cardGrades?.[item.card.id] || 0}
                      size="md"
                      onClick={() => onInspectCard(item.card)}
                    />
                  )}

                  {/* Pull Status Pill */}
                  <div className="h-6 flex items-center justify-center">
                    {isFlipped ? (
                      item.isFatePity ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-pink-500/25 border border-pink-400/60 text-[10px] font-mono font-extrabold text-pink-200">
                          🎯 FATE PITY ENCORE!
                        </span>
                      ) : item.isTierUpgrade ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/30 via-pink-500/30 to-amber-500/30 border border-cyan-400/80 text-[10px] font-mono font-extrabold text-white animate-pulse">
                          ⬆️ NAIK KASTA KE {RARITY_LABELS[pulledRarity].toUpperCase()}!
                        </span>
                      ) : isExotic ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 text-slate-950 text-[10px] font-mono font-black shadow-[0_0_12px_rgba(56,189,248,0.8)]">
                          🌈 JACKPOT EXOTIC!
                        </span>
                      ) : item.isNew ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-mono font-extrabold text-emerald-300">
                          ★ BARU · {RARITY_LABELS[pulledRarity]}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[10px] font-mono font-bold text-amber-300">
                          Duplikat +{item.duplicateCoins} 🪙
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        Segel #{idx + 1}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

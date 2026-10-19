import React from 'react';
import {
  Award,
  Check,
  Flame,
  Gem,
  Heart,
  Shield,
  Sparkles,
  Swords,
  X,
  Zap,
} from 'lucide-react';
import { ABILITIES, ALL_CARDS, IdolCard, RARITY_LABELS, ROLES } from '../game/data';
import {
  CardGradeTier,
  DECO_FRAMES,
  DecoFrameId,
  getAwakenDuplicateRequirement,
  getBiasBondInfo,
  getCardGradeInfo,
  getCardStats,
  getUpgradeCost,
  GRADING_BLACK_LABEL_PITY,
  GRADING_COIN_COST,
  GRADING_DIAMOND_COST,
} from '../game/rules';
import { Photocard3D } from './Photocard3D';

interface CardInspectorModalProps {
  card: IdolCard;
  level: number;
  awakeningStars: number;
  copiesOwned: number;
  inDeck: boolean;
  isBias: boolean;
  bondXp: number;
  decoFrame: DecoFrameId;
  gradeTier?: CardGradeTier;
  gradeAttempts?: number;
  coins: number;
  diamonds?: number;
  synergyBonus: number;
  onUpgrade: (cardId: number) => void;
  onAwaken: (cardId: number) => void;
  onGradeCard?: (cardId: number) => void;
  onToggleDeck: (cardId: number) => void;
  onSetBias: (cardId: number) => void;
  onSetDecoFrame: (cardId: number, deco: DecoFrameId) => void;
  onClose: () => void;
}

const RARITY_ACCENT_COLORS: Record<number, { text: string; bg: string; border: string; glow: string }> = {
  0: {
    text: 'text-slate-200',
    bg: 'bg-slate-500/15',
    border: 'border-slate-400/35',
    glow: 'radial-gradient(circle, rgba(148,163,184,0.22) 0%, transparent 70%)',
  },
  1: {
    text: 'text-sky-300',
    bg: 'bg-sky-500/15',
    border: 'border-sky-400/40',
    glow: 'radial-gradient(circle, rgba(56,189,248,0.28) 0%, transparent 70%)',
  },
  2: {
    text: 'text-purple-300',
    bg: 'bg-purple-500/15',
    border: 'border-purple-400/40',
    glow: 'radial-gradient(circle, rgba(168,85,247,0.32) 0%, transparent 70%)',
  },
  3: {
    text: 'text-amber-300',
    bg: 'bg-amber-500/15',
    border: 'border-amber-400/45',
    glow: 'radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)',
  },
  4: {
    text: 'text-[#FF4FA3]',
    bg: 'bg-[#FF4FA3]/15',
    border: 'border-[#FF4FA3]/50',
    glow: 'radial-gradient(circle, rgba(255,79,163,0.4) 0%, transparent 70%)',
  },
};

export const CardInspectorModal: React.FC<CardInspectorModalProps> = ({
  card,
  level,
  awakeningStars,
  copiesOwned,
  inDeck,
  isBias,
  bondXp,
  decoFrame,
  gradeTier = 0,
  gradeAttempts = 0,
  coins,
  diamonds = 0,
  synergyBonus,
  onUpgrade,
  onAwaken,
  onGradeCard,
  onToggleDeck,
  onSetBias,
  onSetDecoFrame,
  onClose,
}) => {
  const currentStats = getCardStats(card, level, awakeningStars, synergyBonus, gradeTier);
  const nextStats = getCardStats(
    card,
    Math.min(15, level + 1),
    awakeningStars,
    synergyBonus,
    gradeTier
  );
  const upCost = getUpgradeCost(card, level);
  const canUpgrade = level < 15 && coins >= upCost;

  const reqCopiesForNextStar = getAwakenDuplicateRequirement(awakeningStars);
  const canAwaken = awakeningStars < 5 && copiesOwned >= reqCopiesForNextStar;

  const gradeInfo = getCardGradeInfo(gradeTier);
  const isMaxBlackLabel = gradeTier === 10;
  const canGrade =
    copiesOwned > 0 &&
    !isMaxBlackLabel &&
    diamonds >= GRADING_DIAMOND_COST &&
    coins >= GRADING_COIN_COST;

  const subScores =
    gradeTier === 10
      ? { c: '10.0', co: '10.0', e: '10.0', s: '10.0' }
      : gradeTier === 95
      ? { c: '10.0', co: '9.5', e: '9.5', s: '9.5' }
      : gradeTier === 9
      ? { c: '9.5', co: '9.0', e: '9.0', s: '9.0' }
      : gradeTier === 8
      ? { c: '8.5', co: '8.0', e: '8.0', s: '8.0' }
      : { c: '—', co: '—', e: '—', s: '—' };

  const roleInfo = ROLES[card.role] || ROLES[0];
  const ability = ABILITIES[card.abilityId];
  const bondInfo = getBiasBondInfo(bondXp);
  const rarityTheme = RARITY_ACCENT_COLORS[card.rarity] || RARITY_ACCENT_COLORS[0];
  const pityProgressPct = Math.min(
    100,
    Math.round((Math.min(GRADING_BLACK_LABEL_PITY, gradeAttempts) / GRADING_BLACK_LABEL_PITY) * 100)
  );
  const bondProgressPct = Math.min(
    100,
    Math.round((bondInfo.currentXp / Math.max(1, bondInfo.nextLevelXp)) * 100)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detail Kartu ${card.name} ${card.group}`}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl rounded-3xl bg-[#0D1224]/95 border border-white/15 p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex flex-col md:flex-row gap-6 items-stretch my-auto max-h-[94dvh] overflow-y-auto">
        {/* LEFT COLUMN: 3D HOLOGRAPHIC STAGE PEDESTAL & QUICK DECK ACTIONS */}
        <div className="w-full md:w-[295px] shrink-0 rounded-2xl bg-gradient-to-b from-[#151C36]/90 via-[#0E1326]/95 to-[#090C18] border border-white/12 p-4 flex flex-col items-center justify-between gap-3 relative overflow-hidden">
          {/* Ambient Rarity Spotlight Glow */}
          <div
            style={{ background: rarityTheme.glow }}
            className="pointer-events-none absolute -top-10 inset-x-0 h-64 opacity-90"
          />

          {/* Top Pedestal Tag */}
          <div className="relative z-10 w-full flex items-center justify-between text-xs font-sans font-semibold text-slate-300">
            <span className={`px-2.5 py-0.5 rounded-lg border ${rarityTheme.bg} ${rarityTheme.border} ${rarityTheme.text} font-display font-bold`}>
              {RARITY_LABELS[card.rarity]}
            </span>
            <span className="font-mono text-slate-400 tabular-nums">
              #{String(card.id + 1).padStart(3, '0')} / {ALL_CARDS.length}
            </span>
          </div>

          {/* Interactive 3D Photocard */}
          <div className="relative z-10 flex flex-col items-center gap-2 my-1">
            <Photocard3D
              card={card}
              level={level}
              awakeningStars={awakeningStars}
              synergyBonus={synergyBonus}
              gradeTier={gradeTier}
              size="lg"
              inDeck={inDeck}
              isBias={isBias}
              decoFrame={decoFrame}
              interactive3D={true}
            />
            <span className="text-[11px] font-sans text-slate-400">
              Geser kursor di kartu untuk efek 3D Hologram
            </span>
          </div>

          {/* 3-Pill Card Progression Summary */}
          <div className="relative z-10 w-full grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded-xl bg-black/45 border border-white/10 py-1.5 px-2">
              <div className="text-[10px] font-sans text-slate-400 font-medium">Level</div>
              <div className="text-xs font-mono font-bold text-white tabular-nums">
                {level}/15
              </div>
            </div>
            <div className="rounded-xl bg-black/45 border border-white/10 py-1.5 px-2">
              <div className="text-[10px] font-sans text-slate-400 font-medium">Awaken</div>
              <div className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                {awakeningStars}/5 ⭐
              </div>
            </div>
            <div className="rounded-xl bg-black/45 border border-white/10 py-1.5 px-2">
              <div className="text-[10px] font-sans text-slate-400 font-medium">Salinan</div>
              <div className="text-xs font-mono font-bold text-sky-300 tabular-nums">
                ×{copiesOwned}
              </div>
            </div>
          </div>

          {/* Direct Unit & Center Bias Toggle Buttons */}
          <div className="relative z-10 w-full flex flex-col gap-2 pt-1">
            <button
              type="button"
              data-testid="set-bias-btn"
              onClick={() => onSetBias(card.id)}
              className={`w-full min-h-[38px] px-3 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isBias
                  ? 'bg-gradient-to-r from-rose-500 to-[#FF4FA3] text-white shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                  : 'bg-white/8 hover:bg-rose-500/25 text-rose-200 border border-rose-400/30'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isBias ? 'fill-white' : ''}`} />
              <span>{isBias ? 'Center Bias Aktif' : 'Jadikan Center Bias'}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleDeck(card.id)}
              className={`w-full min-h-[38px] px-3 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                inDeck
                  ? 'bg-emerald-500/20 hover:bg-rose-500/25 text-emerald-300 hover:text-rose-200 border border-emerald-400/40'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_4px_16px_rgba(56,189,248,0.35)]'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>{inDeck ? '✓ Terpasang di Stage Unit (Lepas)' : '+ Pasang ke Stage Unit'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: MODERN GAME STUDIO INSPECTOR (STATS, UPGRADE, PSA LAB, SKILL & DECO) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4 text-left">
          {/* 1. HERO IDOL HEADER & CURRENCY BAR */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-white/12">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-sans font-semibold text-slate-300">
                <span className="text-sky-300 font-bold">{card.group}</span>
                <span className="text-slate-600">•</span>
                <span>Debut {card.debutYear}</span>
                <span className="text-slate-600">•</span>
                <span>{card.era}</span>
                <span className="text-slate-600">•</span>
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <span>{roleInfo.icon}</span>
                  <span>{roleInfo.name}</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight mt-0.5">
                {card.name}
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-3 text-xs font-mono tabular-nums bg-black/55 px-3.5 py-2 rounded-xl border border-white/12">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <span>🪙</span>
                  <span>{coins.toLocaleString()}</span>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-[#38BDF8] font-bold flex items-center gap-1">
                  <span>💎</span>
                  <span>{diamonds.toLocaleString()}</span>
                </span>
              </div>

              <button
                type="button"
                aria-label="Tutup Inspector"
                onClick={onClose}
                className="min-w-[38px] min-h-[38px] rounded-xl bg-white/8 hover:bg-white/15 border border-white/12 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. THREE VISUAL STAT CARDS + LEVEL UP / AWAKEN CONSOLE */}
          <div className="rounded-2xl bg-[#131A31]/90 border border-white/12 p-3.5 sm:p-4 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* Stage Power */}
              <div className="rounded-xl bg-black/45 border border-amber-400/25 p-2.5 sm:p-3">
                <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-amber-300/90">
                  <span>Stage Power</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div
                  data-testid="inspector-card-power"
                  className="text-lg sm:text-2xl font-mono font-extrabold text-amber-300 tabular-nums mt-0.5"
                >
                  {currentStats.power.toLocaleString()}
                </div>
                <div className="text-[11px] font-sans text-slate-400 mt-0.5">
                  {gradeTier > 0 ? `Termasuk Bonus ${gradeInfo.shortLabel}` : 'Total Performa Panggung'}
                </div>
              </div>

              {/* Attack */}
              <div className="rounded-xl bg-black/45 border border-rose-400/25 p-2.5 sm:p-3">
                <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-rose-300/90">
                  <span>Vocal / Dance ATK</span>
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-lg sm:text-2xl font-mono font-extrabold text-rose-400 tabular-nums mt-0.5 flex items-baseline gap-1.5">
                  <span>{currentStats.atk}</span>
                  {level < 15 && (
                    <span className="text-xs font-bold text-emerald-400">
                      +{nextStats.atk - currentStats.atk}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-sans text-slate-400 mt-0.5">
                  Daya Serang Elemen
                </div>
              </div>

              {/* Vitality HP */}
              <div className="rounded-xl bg-black/45 border border-emerald-400/25 p-2.5 sm:p-3">
                <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-emerald-300/90">
                  <span>Stamina HP</span>
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-lg sm:text-2xl font-mono font-extrabold text-emerald-400 tabular-nums mt-0.5 flex items-baseline gap-1.5">
                  <span>{currentStats.hp}</span>
                  {level < 15 && (
                    <span className="text-xs font-bold text-emerald-300">
                      +{nextStats.hp - currentStats.hp}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-sans text-slate-400 mt-0.5">
                  Ketahanan Konser
                </div>
              </div>
            </div>

            {/* Instant Level Up & Awakening Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={!canUpgrade}
                onClick={() => onUpgrade(card.id)}
                className={`min-h-[42px] px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  level >= 15
                    ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 cursor-default'
                    : canUpgrade
                    ? 'bg-gradient-to-r from-[#0066FF] to-[#38BDF8] hover:brightness-110 text-white shadow-[0_6px_20px_rgba(56,189,248,0.35)]'
                    : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>{level >= 15 ? '✓ Level Maksimal Tercapai' : `Latih ke Level ${level + 1}`}</span>
                <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg bg-black/35 tabular-nums">
                  {level >= 15 ? 'MAX LV.15' : `${upCost} 🪙`}
                </span>
              </button>

              <button
                type="button"
                disabled={!canAwaken}
                onClick={() => onAwaken(card.id)}
                className={`min-h-[42px] px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  awakeningStars >= 5
                    ? 'bg-amber-500/15 border border-amber-400/30 text-amber-300 cursor-default'
                    : canAwaken
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300 hover:brightness-105 text-slate-950 shadow-[0_6px_20px_rgba(251,191,36,0.35)]'
                    : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>
                  {awakeningStars >= 5 ? '✓ Awaken Bintang Maksimal' : `Awaken Bintang ⭐${awakeningStars + 1}`}
                </span>
                <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg bg-black/25 tabular-nums">
                  {awakeningStars >= 5 ? '5/5 ⭐' : `Salinan ${copiesOwned}/${reqCopiesForNextStar}`}
                </span>
              </button>
            </div>
          </div>

          {/* 3. TWO-COLUMN BENTO GRID: PSA GRADING SLAB LAB + SKILL & POLCO DECO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* LEFT BENTO (7 cols): PSA 10 BLACK LABEL CARD GRADING LAB */}
            <div
              data-testid="psa-grading-lab-panel"
              className={`lg:col-span-7 rounded-2xl p-4 border flex flex-col justify-between gap-3 transition-all ${
                isMaxBlackLabel
                  ? 'bg-gradient-to-br from-[#12100E] via-[#1F1912] to-[#09090B] border-[#FBBF24]/80 shadow-[0_0_28px_rgba(251,191,36,0.22)]'
                  : 'bg-[#131A31]/90 border-white/12'
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/35 flex items-center justify-center">
                      <Award
                        className={`w-4 h-4 ${
                          isMaxBlackLabel ? 'text-[#FBBF24]' : 'text-[#38BDF8]'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-display font-bold text-white leading-tight">
                        PSA Card Grading Lab
                      </div>
                      <div className="text-[11px] font-sans text-slate-400">
                        Sertifikasi Slab Permanen & Lipat Gandakan Stat
                      </div>
                    </div>
                  </div>

                  <span
                    data-testid="inspector-grade-label"
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${
                      isMaxBlackLabel
                        ? 'bg-black border-[#FBBF24] text-[#FDE047]'
                        : gradeTier > 0
                        ? 'bg-sky-950/90 border-sky-400/50 text-sky-200'
                        : 'bg-white/8 border-white/15 text-slate-300'
                    }`}
                  >
                    {gradeInfo.fullLabel}
                  </span>
                </div>

                {/* 4 Sub-Grades Readout (Centering, Corners, Edges, Surface) */}
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-black/45 border border-white/10">
                    <div className="text-[10px] font-sans font-medium text-slate-400">Centering</div>
                    <div className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums mt-0.5">
                      {subScores.c}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/45 border border-white/10">
                    <div className="text-[10px] font-sans font-medium text-slate-400">Corners</div>
                    <div className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums mt-0.5">
                      {subScores.co}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/45 border border-white/10">
                    <div className="text-[10px] font-sans font-medium text-slate-400">Edges</div>
                    <div className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums mt-0.5">
                      {subScores.e}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/45 border border-white/10">
                    <div className="text-[10px] font-sans font-medium text-slate-400">Surface</div>
                    <div className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums mt-0.5">
                      {subScores.s}
                    </div>
                  </div>
                </div>

                {/* Pity Progress Bar & Tier Multipliers */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-sans">
                    <span className="text-slate-300 font-medium">
                      Jaminan Pity PSA 10 Black Label (+28% All-Stat):
                    </span>
                    <span className="font-mono font-bold text-amber-300 tabular-nums">
                      {Math.min(GRADING_BLACK_LABEL_PITY, gradeAttempts)} / {GRADING_BLACK_LABEL_PITY} Polish
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
                    <div
                      style={{ width: `${pityProgressPct}%` }}
                      className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-[#FF4FA3] transition-all duration-300"
                    />
                  </div>
                  <div className="text-[11px] font-sans text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
                    <span>PSA 8 (+6%)</span>
                    <span>•</span>
                    <span>PSA 9 (+12%)</span>
                    <span>•</span>
                    <span>PSA 9.5 (+18%)</span>
                    <span>•</span>
                    <strong className="text-amber-300">PSA 10 Black Label (+28%)</strong>
                  </div>
                </div>
              </div>

              {onGradeCard && (
                <button
                  type="button"
                  data-testid="grade-card-btn"
                  disabled={!canGrade}
                  onClick={() => onGradeCard(card.id)}
                  className={`w-full min-h-[42px] px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isMaxBlackLabel
                      ? 'bg-amber-400/20 border border-amber-400/50 text-amber-300 cursor-default'
                      : canGrade
                      ? 'bg-gradient-to-r from-[#FF4FA3] via-purple-500 to-[#38BDF8] hover:brightness-110 text-white shadow-[0_6px_20px_rgba(255,79,163,0.35)]'
                      : 'bg-white/[0.06] text-slate-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  <Gem className="w-4 h-4" />
                  <span>
                    {isMaxBlackLabel
                      ? '★ SERTIFIKASI MAX PSA 10 BLACK LABEL'
                      : gradeTier > 0
                      ? `Re-Polish Slab (${GRADING_DIAMOND_COST} 💎 + ${GRADING_COIN_COST} 🪙)`
                      : `Grade Photocard (${GRADING_DIAMOND_COST} 💎 + ${GRADING_COIN_COST} 🪙)`}
                  </span>
                </button>
              )}
            </div>

            {/* RIGHT BENTO (5 cols): STAGE SKILL, AFFINITY BOND & POLCO DECO */}
            <div className="lg:col-span-5 rounded-2xl bg-[#131A31]/90 border border-white/12 p-4 flex flex-col justify-between gap-3">
              {/* Active & Ultimate Skill */}
              <div className="space-y-2">
                <div className="text-xs font-display font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#38BDF8]" />
                  <span>Jurus Panggung & Pasif Role</span>
                </div>

                {ability && (
                  <div className="p-2.5 rounded-xl bg-black/45 border border-sky-400/25 space-y-1">
                    <div className="text-xs font-display font-bold text-sky-300">
                      {ability.name}{' '}
                      <span className="text-amber-300 font-semibold">
                        · Ult: {ability.ultimateName}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
                      {ability.desc}
                    </p>
                  </div>
                )}

                <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] font-sans text-slate-300">
                  <strong className="text-white">
                    {roleInfo.icon} {roleInfo.name}:
                  </strong>{' '}
                  {roleInfo.bonusDesc}
                </div>
              </div>

              {/* Affinity Bond Progress */}
              <div className="p-2.5 rounded-xl bg-rose-950/35 border border-rose-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-rose-300 font-bold">
                    💖 Affinity Bond Lv.{bondInfo.level} (+{Math.round(bondInfo.statBonus * 100)}% Aura)
                  </span>
                  <span className="font-mono text-[11px] text-rose-200 font-bold tabular-nums">
                    {bondInfo.currentXp}/{bondInfo.nextLevelXp} XP
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden">
                  <div
                    style={{ width: `${bondProgressPct}%` }}
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-400"
                  />
                </div>
              </div>

              {/* Polco Deco Top-Loader Frame Swatches */}
              <div>
                <div className="text-[11px] font-sans font-semibold text-slate-300 mb-1.5">
                  Bingkai Polco Deco Top-Loader:
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {DECO_FRAMES.map((df) => {
                    const active = decoFrame === df.id;
                    return (
                      <button
                        key={df.id}
                        type="button"
                        data-testid={`deco-btn-${df.id}`}
                        onClick={() => onSetDecoFrame(card.id, df.id)}
                        style={
                          active
                            ? { backgroundColor: df.badgeColor, color: '#090A0F' }
                            : undefined
                        }
                        className={`min-h-[30px] px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          active
                            ? 'shadow-md scale-[1.02]'
                            : 'bg-white/[0.06] text-slate-300 hover:text-white border border-white/10'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{df.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

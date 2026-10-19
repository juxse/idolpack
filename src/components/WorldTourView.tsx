import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Compass,
  Crown,
  Flame,
  Gift,
  Lock,
  Play,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Zap,
} from 'lucide-react';
import { ALL_CARDS, ROLES, STAGE_ROLES_INFO, WORLD_TOUR_CITIES } from '../game/data';
import {
  calculateUnitSynergy,
  generateStageEnemies,
  generateTowerFloorEnemies,
  getCardStats,
  getTowerFloorInfo,
} from '../game/rules';
import type { SaveState } from '../game/rules';
import { Photocard3D } from './Photocard3D';

interface WorldTourViewProps {
  saveState: SaveState;
  onStartStageBattle: (stageIndex: number) => void;
  onClaimTowerPatrol: () => void;
}

export const WorldTourView: React.FC<WorldTourViewProps> = ({
  saveState,
  onStartStageBattle,
  onClaimTowerPatrol,
}) => {
  const [arenaMode, setArenaMode] = useState<'world_tour' | 'queendom_tower'>('world_tour');
  const currentCityIndex = Math.min(
    WORLD_TOUR_CITIES.length - 1,
    Math.floor(saveState.prog / 5)
  );
  const [selectedCityIdx, setSelectedCityIdx] = useState<number>(currentCityIndex);
  const [selectedSubStage, setSelectedSubStage] = useState<number>(
    Math.min(4, saveState.prog % 5)
  );

  const currentTowerFloor = Math.max(1, saveState.towerFloor || 1);
  const [selectedTowerFloor, setSelectedTowerFloor] = useState<number>(currentTowerFloor);

  const selectedStageIndex = selectedCityIdx * 5 + selectedSubStage;
  const isUnlocked = selectedStageIndex <= saveState.prog;
  const city = WORLD_TOUR_CITIES[selectedCityIdx] || WORLD_TOUR_CITIES[0];
  const stageMeta = STAGE_ROLES_INFO[selectedSubStage] || STAGE_ROLES_INFO[0];
  const isBossStage = selectedSubStage === 4;
  const baseCoinReward = 55 + selectedStageIndex * 11 + (isBossStage ? 85 : 0);

  const enemies = useMemo(
    () => generateStageEnemies(selectedStageIndex),
    [selectedStageIndex]
  );

  const enemyTeamPower = useMemo(() => {
    return enemies.reduce((sum, e) => {
      const st = getCardStats(e.card, e.level, e.awakeningStars);
      return sum + Math.round(st.power * e.statMultiplier);
    }, 0);
  }, [enemies]);

  const towerInfo = useMemo(
    () => getTowerFloorInfo(selectedTowerFloor),
    [selectedTowerFloor]
  );

  const towerEnemies = useMemo(
    () => generateTowerFloorEnemies(selectedTowerFloor),
    [selectedTowerFloor]
  );

  const towerEnemyPower = useMemo(() => {
    return towerEnemies.reduce((sum, e) => {
      const st = getCardStats(e.card, e.level, e.awakeningStars);
      return sum + Math.round(st.power * e.statMultiplier);
    }, 0);
  }, [towerEnemies]);

  const deckCards = useMemo(
    () => saveState.deck.map((id) => ALL_CARDS[id]).filter(Boolean),
    [saveState.deck]
  );

  const synergy = useMemo(
    () => calculateUnitSynergy(deckCards, saveState.biasCardId, saveState.biasBondXp),
    [deckCards, saveState.biasCardId, saveState.biasBondXp]
  );

  const playerPower = useMemo(() => {
    return deckCards.reduce((sum, c) => {
      const lv = saveState.lv[c.id] || 1;
      const st = saveState.stars[c.id] || 0;
      const grade = saveState.cardGrades?.[c.id] || 0;
      const effRarity = saveState.cardRarity?.[c.id] ?? c.rarity;
      return sum + getCardStats(c, lv, st, synergy.totalBonus, grade, effRarity).power;
    }, 0);
  }, [deckCards, saveState.lv, saveState.stars, saveState.cardGrades, saveState.cardRarity, synergy.totalBonus]);

  const totalStarsEarned = useMemo(
    () => Object.values(saveState.stageStars).reduce((a, b) => a + b, 0),
    [saveState.stageStars]
  );

  const isPatrolClaimedToday =
    saveState.towerPatrolDate === saveState.dailyDate && Boolean(saveState.dailyDate);
  const clearedTowerFloors = Math.max(0, currentTowerFloor - 1);
  const patrolCoinsPreview = 140 + clearedTowerFloors * 30;
  const patrolGrantsPack = clearedTowerFloors >= 5;

  // Visible 10-floor window around selectedTowerFloor
  const towerFloorWindow = useMemo(() => {
    const startFloor = Math.max(1, Math.floor((selectedTowerFloor - 1) / 10) * 10 + 1);
    return Array.from({ length: 10 }, (_, i) => startFloor + i);
  }, [selectedTowerFloor]);

  return (
    <div className="fixed inset-0 z-10 pointer-events-auto pt-16 pb-20 px-3 sm:px-6 overflow-y-auto lg:overflow-hidden select-none flex flex-col">
      <div className="w-full max-w-[1380px] mx-auto flex-1 min-h-0 flex flex-col gap-3">
        {/* Top Mode Switcher Header: World Tour vs. Queendom Survival Tower */}
        <div className="shrink-0 rounded-2xl bg-[#0D1224]/92 border border-white/15 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="mode-world-tour-btn"
              onClick={() => setArenaMode('world_tour')}
              className={`min-h-[40px] px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                arenaMode === 'world_tour'
                  ? 'bg-gradient-to-r from-[#FF4FA3] to-purple-500 text-white shadow-[0_0_20px_rgba(255,79,163,0.45)]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Tur Konser Dunia (90 Stage)</span>
            </button>

            <button
              type="button"
              data-testid="mode-queendom-tower-btn"
              onClick={() => {
                setArenaMode('queendom_tower');
                setSelectedTowerFloor(currentTowerFloor);
              }}
              className={`min-h-[40px] px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                arenaMode === 'queendom_tower'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.45)]'
                  : 'bg-white/5 hover:bg-white/10 text-amber-200 border border-amber-400/25'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Queendom Survival Tower</span>
              <span className="px-2 py-0.5 rounded-md bg-black/25 text-[11px] font-mono font-bold tabular-nums">
                FL.{currentTowerFloor}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 font-sans font-semibold flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Bintang Tur:</span>
              <strong className="font-mono font-bold tabular-nums">{totalStarsEarned}/270</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 font-sans font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Power Unit Kamu:</span>
              <strong className="font-mono font-bold tabular-nums">{playerPower.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {arenaMode === 'queendom_tower' ? (
          /* QUEENDOM SURVIVAL TOWER: FULL-HEIGHT SINGLE-VIEWPORT 12-COL SPLIT */
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left 4 Columns: Full-Height 2x5 Floor Ladder + Daily Patrol */}
            <div className="lg:col-span-4 rounded-3xl bg-[#0D1224]/92 border border-amber-400/25 p-4 shadow-2xl flex flex-col justify-between gap-3 min-h-0">
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                  <div>
                    <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-amber-400">
                      Survival Stage Ladder
                    </div>
                    <h2 className="text-base sm:text-lg font-display font-extrabold text-white">
                      Pilih Lantai Queendom
                    </h2>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedTowerFloor((f) => Math.max(1, f - 10))}
                      className="px-2 py-1 rounded-lg bg-white/8 hover:bg-white/15 text-xs font-mono font-bold text-slate-300 cursor-pointer"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTowerFloor((f) => Math.min(50, f + 10))}
                      className="px-2 py-1 rounded-lg bg-white/8 hover:bg-white/15 text-xs font-mono font-bold text-slate-300 cursor-pointer"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTowerFloor(currentTowerFloor)}
                      className="px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 text-xs font-sans font-bold text-amber-300 cursor-pointer"
                    >
                      Aktif (FL.{currentTowerFloor})
                    </button>
                  </div>
                </div>

                {/* 2x5 Floor Grid stretched across available vertical space */}
                <div className="flex-1 grid grid-cols-2 gap-2 content-stretch">
                  {towerFloorWindow.map((fl) => {
                    const info = getTowerFloorInfo(fl);
                    const isCleared = fl < currentTowerFloor;
                    const isCurrent = fl === currentTowerFloor;
                    const isSelected = fl === selectedTowerFloor;
                    const roleMeta = ROLES[info.benefitedRole];

                    return (
                      <button
                        key={fl}
                        type="button"
                        data-testid={`tower-floor-btn-${fl}`}
                        onClick={() => setSelectedTowerFloor(fl)}
                        className={`px-3 py-2.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400/20 border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.28)]'
                            : isCurrent
                            ? 'bg-white/10 border-amber-400/50 text-white'
                            : isCleared
                            ? 'bg-emerald-500/10 border-emerald-400/25 text-slate-200'
                            : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 opacity-70'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-extrabold text-amber-300 tabular-nums">
                              FL.{fl}
                            </span>
                            {info.isBossFloor && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/35 border border-rose-400/40 text-[9px] font-display font-bold text-rose-200">
                                BOSS
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-sans text-slate-300 truncate flex items-center gap-1 mt-0.5">
                            <span>{roleMeta.icon}</span>
                            <span className="truncate">{roleMeta.short}</span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isCleared ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isCurrent ? (
                            <Flame className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Tower Patrol Box */}
              <div className="shrink-0 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-pink-500/10 to-purple-500/15 border border-amber-300/35">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-display font-bold text-amber-300">
                    <Gift className="w-4 h-4" />
                    <span>Patroli Harian Tower</span>
                  </div>
                  <span className="text-xs font-mono text-slate-300 tabular-nums">
                    Lantai Bersih: {clearedTowerFloors}
                  </span>
                </div>
                <div className="text-xs font-sans text-slate-300 mb-2.5">
                  Klaim <strong className="font-mono text-amber-300">+{patrolCoinsPreview} 🪙</strong>
                  {patrolGrantsPack ? (
                    <span className="text-emerald-300 font-bold"> + 1 Tiket Pack 🎫</span>
                  ) : (
                    <span className="text-slate-400"> (Capai FL.5+ untuk bonus Tiket Pack)</span>
                  )}
                </div>
                <button
                  type="button"
                  data-testid="claim-tower-patrol-btn"
                  disabled={isPatrolClaimedToday}
                  onClick={onClaimTowerPatrol}
                  className={`w-full min-h-[40px] py-2 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    isPatrolClaimedToday
                      ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg'
                  }`}
                >
                  {isPatrolClaimedToday
                    ? '✓ Patroli Hari Ini Sudah Diklaim'
                    : `🎁 Klaim Patroli (+${patrolCoinsPreview} 🪙)`}
                </button>
              </div>
            </div>

            {/* Right 8 Columns: Full-Height Tower Stage Showcase */}
            <div className="lg:col-span-8 rounded-3xl bg-[#0D1224]/92 border border-white/15 p-5 shadow-2xl flex flex-col justify-between gap-4 min-h-0">
              {/* Top Header with Immediate Play CTA */}
              <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/12">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-amber-400/20 border border-amber-300/40 text-xs font-display font-bold text-amber-300">
                      QUEENDOM TOWER · LANTAI {selectedTowerFloor}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-sky-500/15 border border-sky-400/30 text-xs font-sans font-semibold text-sky-300">
                      {ROLES[towerInfo.benefitedRole].icon} Buff Panggung: {towerInfo.roleBuffLabel}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white mt-1.5">
                    {towerInfo.title}
                  </h2>
                </div>

                {/* Primary Play CTA Right at the Top */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="px-3.5 py-2 rounded-xl bg-black/55 border border-white/12 text-right">
                    <div className="text-[10px] font-sans font-semibold text-slate-400">
                      Power Kamu vs Lawan
                    </div>
                    <div className="text-sm font-mono font-extrabold tabular-nums">
                      <span
                        className={
                          playerPower >= towerEnemyPower ? 'text-emerald-400' : 'text-amber-300'
                        }
                      >
                        {playerPower.toLocaleString()}
                      </span>{' '}
                      <span className="text-slate-500">/</span>{' '}
                      <span className="text-rose-400">{towerEnemyPower.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="start-tower-battle-btn"
                    disabled={selectedTowerFloor > currentTowerFloor || saveState.deck.length === 0}
                    onClick={() => onStartStageBattle(1000 + selectedTowerFloor)}
                    className={`min-h-[48px] px-5 py-3 rounded-2xl font-display font-extrabold text-xs sm:text-sm tracking-wide flex items-center gap-2 transition-transform cursor-pointer ${
                      selectedTowerFloor <= currentTowerFloor && saveState.deck.length > 0
                        ? 'bg-gradient-to-r from-amber-400 via-[#FF4FA3] to-purple-500 text-white shadow-[0_10px_28px_rgba(255,79,163,0.45)] hover:scale-[1.02] active:scale-95'
                        : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                    }`}
                  >
                    <Swords className="w-4 h-4" />
                    <span>
                      {selectedTowerFloor > currentTowerFloor
                        ? `Selesaikan FL.${currentTowerFloor} Dulu`
                        : `⚔️ TANTANG LANTAI ${selectedTowerFloor}`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Center Expanded 5-in-a-Row Rival Formation Stage */}
              <div className="flex-1 min-h-0 flex flex-col justify-center">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-sans font-bold text-slate-300">
                    Formasi Penjaga Lantai {selectedTowerFloor} ({towerEnemies.length} Unit Sejajar):
                  </span>
                  <div className="flex items-center gap-2.5 text-xs font-mono font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300">
                      Hadiah: +{towerInfo.rewardCoins} 🪙
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-400/15 border border-cyan-400/30 text-cyan-300">
                      +{towerInfo.rewardDiamonds} 💎
                    </span>
                    {towerInfo.grantsFreePack && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-400/15 border border-emerald-400/30 text-emerald-300">
                        +1 Tiket Pack 🎫
                      </span>
                    )}
                  </div>
                </div>

                <div
                  data-testid="tower-rival-5col-grid"
                  className="flex-1 w-full flex flex-wrap md:flex-nowrap items-center justify-center gap-2 xl:gap-3 py-4 px-3 rounded-2xl bg-gradient-to-b from-[#141B35]/90 via-[#0B0F1E]/95 to-black/80 border border-white/12"
                >
                  {towerEnemies.map((enemy, idx) => {
                    const st = getCardStats(enemy.card, enemy.level, enemy.awakeningStars);
                    const effPower = Math.round(st.power * enemy.statMultiplier);
                    const rInfo = ROLES[enemy.card.role] || ROLES[0];
                    return (
                      <div
                        key={`${enemy.card.id}-${idx}`}
                        className="relative flex flex-col items-center gap-1.5"
                      >
                        {enemy.isBoss ? (
                          <div className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-display font-extrabold text-[10px] uppercase tracking-wider shadow">
                            👑 FLOOR BOSS
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-full bg-white/8 text-slate-300 font-sans font-semibold text-[10px]">
                            Unit #{idx + 1}
                          </div>
                        )}
                        <Photocard3D
                          card={enemy.card}
                          level={enemy.level}
                          awakeningStars={enemy.awakeningStars}
                          size="xs"
                          interactive3D={false}
                        />
                        <div className="px-2.5 py-1 rounded-lg bg-black/65 border border-white/10 text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5 tabular-nums">
                          <span>{rInfo.icon}</span>
                          <span className="text-amber-300">⚡ {effPower}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Tactical & Stage Info Footer */}
              <div className="shrink-0 rounded-2xl bg-black/45 border border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-sans text-slate-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-white">Tips Strategi Lantai {selectedTowerFloor}:</strong>{' '}
                    Pasang idol dengan role <strong className="text-sky-300">{ROLES[towerInfo.benefitedRole].name}</strong> di Stage Unit untuk memicu buff panggung!
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-300 font-semibold">
                  Sinergi Unit Aktif: +{ Math.round(synergy.totalBonus * 100) }% All-Stat
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* WORLD TOUR CAMPAIGN: FULL-HEIGHT SINGLE-VIEWPORT 12-COL SPLIT */
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left 4 Columns: Full-Height 18 City Selector List + Milestone Footer */}
            <div className="lg:col-span-4 rounded-3xl bg-[#0D1224]/92 border border-white/15 p-4 shadow-2xl flex flex-col justify-between gap-3 min-h-0">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#FF4FA3]">
                    World Tour Schedule
                  </div>
                  <h2 className="text-base sm:text-lg font-display font-extrabold text-white">
                    18 Kota Konser Dunia
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-[#FF4FA3]/15 border border-[#FF4FA3]/35 text-xs font-mono text-pink-300 font-bold tabular-nums">
                  Stage Aktif: {Math.floor(saveState.prog / 5) + 1}-{(saveState.prog % 5) + 1}
                </span>
              </div>

              <div className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 overflow-y-auto pr-1 content-start">
                {WORLD_TOUR_CITIES.map((c, cIdx) => {
                  const firstStageOfCity = cIdx * 5;
                  const cityUnlocked = firstStageOfCity <= saveState.prog;
                  const isCurrentSelected = cIdx === selectedCityIdx;
                  const cityStars = [0, 1, 2, 3, 4].reduce(
                    (acc, s) => acc + (saveState.stageStars[firstStageOfCity + s] || 0),
                    0
                  );

                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={!cityUnlocked}
                      onClick={() => {
                        setSelectedCityIdx(cIdx);
                        setSelectedSubStage(0);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isCurrentSelected
                          ? 'bg-gradient-to-r from-[#FF4FA3]/25 to-purple-500/20 border-[#FF4FA3] shadow-[0_0_16px_rgba(255,79,163,0.28)]'
                          : cityUnlocked
                          ? 'bg-white/[0.05] hover:bg-white/10 border-white/10'
                          : 'bg-white/[0.02] border-white/5 opacity-45 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{c.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-display font-bold text-white truncate">
                            {cIdx + 1}. {c.name}
                          </div>
                          <div className="text-[11px] font-mono text-amber-300 font-semibold tabular-nums mt-0.5">
                            ⭐ {cityStars}/15
                          </div>
                        </div>
                      </div>
                      {!cityUnlocked && <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Left Panel Bottom Summary Card */}
              <div className="shrink-0 p-3 rounded-2xl bg-black/45 border border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FF4FA3]/15 border border-[#FF4FA3]/35 flex items-center justify-center text-[#FF4FA3]">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-display font-bold text-white">
                      Hadiah First-Clear Stage
                    </div>
                    <div className="text-[11px] font-sans text-slate-400">
                      +8 💎 per Stage · +18 💎 & Tiket Pack di Boss!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 8 Columns: Full-Height Stage Arena Details + Top Play CTA + Large 5-in-a-Row Rival Preview */}
            <div className="lg:col-span-8 rounded-3xl bg-[#0D1224]/92 border border-white/15 p-5 shadow-2xl flex flex-col justify-between gap-3.5 min-h-0">
              {/* Top City Header + Immediate Start Concert CTA */}
              <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/12">
                <div className="flex items-center gap-3.5">
                  <div
                    style={{
                      backgroundColor: `${city.primaryColor}22`,
                      borderColor: `${city.primaryColor}66`,
                    }}
                    className="w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl shrink-0 shadow-lg"
                  >
                    {city.icon}
                  </div>
                  <div>
                    <div className="text-xs font-sans font-bold uppercase tracking-wider text-sky-400">
                      World Tour Stop #{selectedCityIdx + 1} · {city.country}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">
                      {city.name} — {city.arenaName}
                    </h2>
                  </div>
                </div>

                {/* Immediate Play CTA in Top Right */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="px-3.5 py-2 rounded-xl bg-black/55 border border-white/12 text-right">
                    <div className="text-[10px] font-sans font-semibold text-slate-400">
                      Power Kamu vs Lawan
                    </div>
                    <div className="text-sm font-mono font-extrabold tabular-nums">
                      <span
                        className={
                          playerPower >= enemyTeamPower ? 'text-emerald-400' : 'text-amber-300'
                        }
                      >
                        {playerPower.toLocaleString()}
                      </span>{' '}
                      <span className="text-slate-500">/</span>{' '}
                      <span className="text-rose-400">{enemyTeamPower.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="start-battle-btn"
                    disabled={!isUnlocked || saveState.deck.length === 0}
                    onClick={() => onStartStageBattle(selectedStageIndex)}
                    className={`min-h-[48px] px-5 py-3 rounded-2xl font-display font-extrabold text-xs sm:text-sm tracking-wide flex items-center gap-2 transition-transform cursor-pointer ${
                      isUnlocked && saveState.deck.length > 0
                        ? 'bg-gradient-to-r from-[#FF4FA3] via-purple-500 to-sky-500 text-white shadow-[0_10px_28px_rgba(255,79,163,0.45)] hover:scale-[1.02] active:scale-95'
                        : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {!isUnlocked
                        ? 'Stage Terkunci'
                        : `MULAI KONSER ${selectedCityIdx + 1}-${selectedSubStage + 1}`}
                    </span>
                  </button>
                </div>
              </div>

              {/* 5 Sub-Stage Tabs in Current City */}
              <div className="shrink-0 grid grid-cols-5 gap-2.5">
                {[0, 1, 2, 3, 4].map((sub) => {
                  const stIdx = selectedCityIdx * 5 + sub;
                  const unlocked = stIdx <= saveState.prog;
                  const stars = saveState.stageStars[stIdx] || 0;
                  const isBoss = sub === 4;
                  const active = selectedSubStage === sub;

                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubStage(sub)}
                      className={`py-2.5 px-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        active
                          ? 'bg-gradient-to-b from-[#FF4FA3]/25 to-purple-500/20 border-[#FF4FA3] text-white shadow-lg'
                          : unlocked
                          ? 'bg-white/[0.05] hover:bg-white/10 border-white/10 text-slate-300'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-slate-400 opacity-75'
                      }`}
                    >
                      <div className="text-xs font-display font-bold">
                        {isBoss ? '👑 BOSS FINALE' : `Stage ${selectedCityIdx + 1}-${sub + 1}`}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Expanded Center 5-in-a-Row Rival Lineup Showcase */}
              <div className="flex-1 min-h-0 flex flex-col justify-center">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-sans font-bold text-slate-300">
                    {stageMeta.title} · Formasi Idol Lawan ({enemies.length} Member Sejajar):
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300">
                      Hadiah: +{baseCoinReward} 🪙
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-400/15 border border-cyan-400/30 text-cyan-300">
                      +{selectedSubStage === 4 ? 18 : 8} 💎 (First Clear)
                    </span>
                    {selectedSubStage === 4 && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> +1 Tiket Pack Boss
                      </span>
                    )}
                  </div>
                </div>

                <div
                  data-testid="world-tour-rival-5col-grid"
                  className="flex-1 w-full flex flex-wrap md:flex-nowrap items-center justify-center gap-2 xl:gap-3 py-4 px-3 rounded-2xl bg-gradient-to-b from-[#141B35]/90 via-[#0B0F1E]/95 to-black/80 border border-white/12"
                >
                  {enemies.map((enemy, idx) => {
                    const st = getCardStats(enemy.card, enemy.level, enemy.awakeningStars);
                    const effPower = Math.round(st.power * enemy.statMultiplier);
                    const rInfo = ROLES[enemy.card.role] || ROLES[0];
                    return (
                      <div
                        key={`${enemy.card.id}-${idx}`}
                        className="relative flex flex-col items-center gap-1.5"
                      >
                        {enemy.isBoss ? (
                          <div className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-display font-extrabold text-[10px] uppercase tracking-wider shadow">
                            👑 HEADLINER
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-full bg-white/8 text-slate-300 font-sans font-semibold text-[10px]">
                            Rival #{idx + 1}
                          </div>
                        )}
                        <Photocard3D
                          card={enemy.card}
                          level={enemy.level}
                          awakeningStars={enemy.awakeningStars}
                          size="xs"
                          interactive3D={false}
                        />
                        <div className="px-2.5 py-1 rounded-lg bg-black/65 border border-white/10 text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5 tabular-nums">
                          <span>{rInfo.icon}</span>
                          <span className="text-amber-300">⚡ {effPower}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Concert Stage Tips & Synergy Bar */}
              <div className="shrink-0 rounded-2xl bg-black/45 border border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-sans text-slate-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF4FA3] shrink-0" />
                  <span>
                    <strong className="text-white">Panduan Konser:</strong> Tekan{' '}
                    <strong className="text-amber-300">Lightstick Boost [SPACE]</strong> saat pertarungan berlangsung untuk memicu +15% ATK & Hype Meter!
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-300 font-semibold">
                  Sinergi Stage Unit: +{Math.round(synergy.totalBonus * 100)}% Stat
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

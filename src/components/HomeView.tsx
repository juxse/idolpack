import React, { useMemo } from 'react';
import {
  BookOpen,
  ChevronRight,
  Compass,
  Gift,
  Heart,
  MessageCircleHeart,
  PackageOpen,
  Shuffle,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { ALL_CARDS, BOOSTER_BANNERS, IdolCard, WORLD_TOUR_CITIES } from '../game/data';
import {
  getBiasBondInfo,
  getCardStats,
  getDailyFanChat,
  getGroupDexList,
  SaveState,
} from '../game/rules';
import { Photocard3D } from './Photocard3D';

interface HomeViewProps {
  saveState: SaveState;
  centerBiasCard: IdolCard;
  unitSynergyBonus: number;
  onNavigateTab: (tab: 'home' | 'pack' | 'wonder' | 'binder' | 'tour' | 'quests') => void;
  onJumpToPackWithFocus: (groupName: string | null, bannerId?: string) => void;
  onOpenGroupDex: () => void;
  onReplyFanChat: (replyIndex: number) => void;
  onClaimDailyBonusCoins: () => void;
  onInspectCard: (card: IdolCard) => void;
}

const SPOTLIGHT_ROOKIE_GROUPS = [
  'Hearts2Hearts',
  'ILLIT',
  'MEOVV',
  'KiiiKiii',
  'BABYMONSTER',
  'izna',
];

export const HomeView: React.FC<HomeViewProps> = ({
  saveState,
  centerBiasCard,
  unitSynergyBonus,
  onNavigateTab,
  onJumpToPackWithFocus,
  onOpenGroupDex,
  onReplyFanChat,
  onClaimDailyBonusCoins,
  onInspectCard,
}) => {
  const bondXp = saveState.biasBondXp?.[centerBiasCard.id] || 0;
  const bondInfo = getBiasBondInfo(bondXp);
  const fanChat = useMemo(() => getDailyFanChat(saveState), [saveState]);
  const groupDexList = useMemo(() => getGroupDexList(saveState), [saveState]);

  const completedGroupsCount = useMemo(
    () => groupDexList.filter((g) => g.isComplete).length,
    [groupDexList]
  );
  const claimableDexCount = useMemo(
    () => groupDexList.filter((g) => g.isComplete && !g.isClaimed).length,
    [groupDexList]
  );

  // Highlight progress for Hearts2Hearts, ILLIT, MEOVV or closest group
  const featuredDexPreview = useMemo(() => {
    const priorityNames = ['Hearts2Hearts', 'ILLIT', 'MEOVV', 'IVE', 'KiiiKiii'];
    return priorityNames
      .map((name) => groupDexList.find((g) => g.group === name))
      .filter((g): g is NonNullable<typeof g> => Boolean(g))
      .slice(0, 3);
  }, [groupDexList]);

  const activeDeckPower = useMemo(() => {
    return saveState.deck.reduce((sum, cid) => {
      const c = ALL_CARDS[cid];
      if (!c) return sum;
      return (
        sum +
        getCardStats(
          c,
          saveState.lv[cid] || 1,
          saveState.stars[cid] || 0,
          unitSynergyBonus,
          saveState.cardGrades?.[cid] || 0
        ).power
      );
    }, 0);
  }, [saveState.deck, saveState.lv, saveState.stars, unitSynergyBonus, saveState.cardGrades]);

  const currentCity =
    WORLD_TOUR_CITIES[Math.min(WORLD_TOUR_CITIES.length - 1, Math.floor(saveState.prog / 5))];
  const uniqueOwnedCount = Object.keys(saveState.inv).length;

  return (
    <div
      data-testid="home-view"
      className="fixed inset-0 z-10 pt-14 sm:pt-16 pb-24 sm:pb-24 px-3 sm:px-6 md:px-8 overflow-y-auto pointer-events-auto"
    >
      <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-3.5">
        {/* SECTION 1: SPLIT-SCREEN HERO (Left: Center Bias 3D Showcase, Right: Daily Idol Fan-Chat & Rate-Up Spotlight) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
          {/* Left Column: Center Bias Interactive 3D Showcase */}
          <div className="lg:col-span-5 liquid-glass-elevated rounded-3xl p-4 sm:p-4.5 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle Iridescent Ambient Refraction */}
            <div
              className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full blur-3xl opacity-25"
              style={{
                background:
                  'radial-gradient(circle, rgba(0,102,255,0.65) 0%, rgba(168,85,247,0.35) 60%, transparent 100%)',
              }}
            />

            <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
              <div>
                <div className="text-[11px] font-medium text-zinc-400">
                  Center Bias Agensi · Lv.{bondInfo.level} Bond
                </div>
                <h1 className="text-lg sm:text-xl font-display font-semibold text-[#F5F5F7] tracking-tight">
                  {centerBiasCard.name} · {centerBiasCard.group}
                </h1>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('binder')}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs font-medium text-[#F5F5F7] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Ganti Bias
              </button>
            </div>

            {/* Interactive 3D Photocard Centerpiece */}
            <div className="relative z-10 my-1 flex items-center justify-center">
              <Photocard3D
                card={centerBiasCard}
                level={saveState.lv[centerBiasCard.id] || 1}
                awakeningStars={saveState.stars[centerBiasCard.id] || 0}
                gradeTier={saveState.cardGrades?.[centerBiasCard.id] || 0}
                size="md"
                isBias={true}
                decoFrame={saveState.cardDeco?.[centerBiasCard.id] || 'starlight'}
                onClick={() => onInspectCard(centerBiasCard)}
              />
            </div>

            {/* Affinity Bond Bar & Daily Check-in Action */}
            <div className="relative z-10 mt-2.5 pt-2.5 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#0066FF]" />
                  Affinity Bond Lv.{bondInfo.level}
                </span>
                <span className="font-mono text-zinc-300 tabular-nums">
                  {bondInfo.currentXp}/{bondInfo.nextLevelXp} XP · +
                  {Math.round(bondInfo.statBonus * 100)}% All-Unit Stat
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#38BDF8] transition-all duration-300"
                  style={{ width: `${Math.min(100, bondInfo.currentXp)}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  data-testid="home-inspect-bias-btn"
                  onClick={() => onInspectCard(centerBiasCard)}
                  className="min-h-[40px] flex-1 px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/12 text-xs font-medium text-[#F5F5F7] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Inspeksi & PSA Grading
                </button>
                <button
                  type="button"
                  onClick={onClaimDailyBonusCoins}
                  disabled={saveState.dailyBonusClaimed}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    saveState.dailyBonusClaimed
                      ? 'bg-white/[0.04] text-zinc-500 border border-white/8 cursor-not-allowed'
                      : 'bg-[#0066FF] hover:bg-[#0052CC] text-white cursor-pointer shadow-sm'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  {saveState.dailyBonusClaimed ? 'Bonus Harian Selesai' : 'Klaim +180 Koin'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Daily Idol Fan-Chat + Featured Rookie Rate-Up Spotlight */}
          <div className="lg:col-span-7 flex flex-col gap-3.5 sm:gap-4 justify-between">
            {/* Card A: Daily Idol Fan-Chat (Bubble / Weverse Style) */}
            <div
              data-testid="daily-fan-chat-card"
              className="liquid-glass-elevated rounded-3xl p-4 sm:p-4.5 flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0066FF]/20 border border-[#0066FF]/40 flex items-center justify-center text-[#38BDF8]">
                      <MessageCircleHeart className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-display font-semibold text-[#F5F5F7]">
                        Daily Idol Fan-Chat · {fanChat.card.name} ({fanChat.card.group})
                      </h2>
                      <div className="text-[11px] text-zinc-400">
                        {fanChat.timeLabel} · Hadiah balas pesan: +80 Koin & +25 Bond XP
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-400 tabular-nums shrink-0">
                    {fanChat.claimedToday ? 'Dibalas Hari Ini' : '1 Pesan Baru'}
                  </span>
                </div>

                {/* Incoming Idol Message Bubble */}
                <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3.5 text-xs sm:text-sm text-[#F5F5F7] leading-relaxed">
                  “{fanChat.idolMessage}”
                </div>
              </div>

              {/* Interactive Reply Choices or Sent Reply */}
              <div className="mt-3 pt-3 border-t border-white/10">
                {!fanChat.claimedToday ? (
                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-zinc-400">
                      Pilih balasan untuk {fanChat.card.name}:
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {fanChat.options.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          data-testid={`fanchat-reply-${idx}`}
                          onClick={() => onReplyFanChat(idx)}
                          className="min-h-[40px] w-full text-left px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-[#0066FF]/25 border border-white/12 hover:border-[#0066FF]/60 text-xs font-medium text-[#F5F5F7] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <span className="truncate">{opt}</span>
                          <span className="text-[11px] font-mono text-[#38BDF8] shrink-0">
                            Balas (+80 Koin)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <div className="rounded-2xl bg-[#0066FF]/25 border border-[#0066FF]/45 px-3.5 py-2 text-xs text-white max-w-[90%]">
                        “{fanChat.options[fanChat.chosenReplyIndex ?? 0]}”
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.05] border border-white/10 px-3.5 py-2 text-xs text-emerald-300">
                      <strong className="text-white">{fanChat.card.name}:</strong> “
                      {fanChat.idolReply}”
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card B: Featured Pack Rate-Up & Pinpoint Group Target (Hearts2Hearts, ILLIT, MEOVV) */}
            <div className="liquid-glass-elevated rounded-3xl p-4 sm:p-4.5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <div className="text-[11px] font-medium text-[#38BDF8]">
                    Featured Booster Rate-Up · Semua 41 Grup Tercampur + Peluang Grup Utama Diperbesar
                  </div>
                  <h2 className="text-base sm:text-lg font-display font-semibold text-[#F5F5F7]">
                    {BOOSTER_BANNERS[0].title}
                  </h2>
                </div>

                <button
                  type="button"
                  data-testid="home-open-pack-cta"
                  onClick={() => onNavigateTab('pack')}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-md"
                >
                  <PackageOpen className="w-4 h-4" />
                  {saveState.freePacks > 0
                    ? `Buka Pack 3D (Gratis ×${saveState.freePacks})`
                    : 'Buka Studio Pack 3D'}
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-2">
                Klik grup untuk mengaktifkan{' '}
                <strong className="text-zinc-200">Pinpoint Rate-Up (18% Peluang + Fate Pity {saveState.fatePoints || 0}/15)</strong>:
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                {SPOTLIGHT_ROOKIE_GROUPS.map((groupName) => {
                  const isFocused = saveState.focusGroup === groupName;
                  const entry = groupDexList.find((g) => g.group === groupName);
                  return (
                    <button
                      key={groupName}
                      type="button"
                      data-testid={`home-focus-${groupName}`}
                      onClick={() => onJumpToPackWithFocus(groupName, 'rookie_wave')}
                      className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isFocused
                          ? 'bg-[#0066FF] text-white border border-[#38BDF8]'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 border border-white/12'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>{groupName}</span>
                      {entry && (
                        <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                          {entry.ownedCount}/{entry.totalCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: BENTO GRID QUICK ACCESS (4 Liquid Glass Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {/* Bento 1: 3D Booster Pack Studio */}
          <button
            type="button"
            onClick={() => onNavigateTab('pack')}
            className="liquid-glass rounded-2xl p-3.5 text-left hover:border-white/30 transition-colors flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                <span className="font-medium text-[#38BDF8] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Studio Pack 3D
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-sm sm:text-base font-display font-semibold text-[#F5F5F7]">
                Sobek Foil Pack
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                Target:{' '}
                <strong className="text-zinc-200">
                  {saveState.focusGroup
                    ? `${saveState.focusGroup} (Fate ${saveState.fatePoints || 0}/15)`
                    : 'Semua Grup Featured'}
                </strong>
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-300 tabular-nums">
              <span>Pity L+: {saveState.pityLegend}/70</span>
              <span className="text-[#38BDF8]">
                {saveState.freePacks > 0 ? `Gratis ×${saveState.freePacks}` : '360 Koin / ×5'}
              </span>
            </div>
          </button>

          {/* Bento 2: Group Photobook Dex */}
          <button
            type="button"
            data-testid="bento-group-dex"
            onClick={onOpenGroupDex}
            className="liquid-glass rounded-2xl p-3.5 text-left hover:border-white/30 transition-colors flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Photobook Dex
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-sm sm:text-base font-display font-semibold text-[#F5F5F7]">
                Koleksi 41 Grup K-Pop
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-400 font-mono tabular-nums">
                {featuredDexPreview.map((g) => (
                  <span key={g.group}>
                    {g.group}: <strong className="text-zinc-200">{g.ownedCount}/{g.totalCount}</strong>
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-zinc-300">
                Lengkap: {completedGroupsCount}/{groupDexList.length}
              </span>
              <span className={claimableDexCount > 0 ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                {claimableDexCount > 0 ? `${claimableDexCount} Hadiah Siap!` : '+350 Koin / Grup'}
              </span>
            </div>
          </button>

          {/* Bento 3: Wonder Pick 5-Card Mystery (Balanced 3/day Quota) */}
          <button
            type="button"
            onClick={() => onNavigateTab('wonder')}
            className="liquid-glass rounded-2xl p-3.5 text-left hover:border-white/30 transition-colors flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                <span className="font-medium text-violet-400 flex items-center gap-1.5">
                  <Shuffle className="w-4 h-4" />
                  Wonder Pick
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-sm sm:text-base font-display font-semibold text-[#F5F5F7]">
                5 Kartu Acak TCG
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                Kuota Harian {Math.max(0, 3 - (saveState.wonderPickDailyCount || 0))}/3 · Mythic 12%
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-zinc-300">
                Sisa: {Math.max(0, 3 - (saveState.wonderPickDailyCount || 0))}/3
              </span>
              <span className={!saveState.wonderPickFreeUsedToday ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                {!saveState.wonderPickFreeUsedToday ? 'Gratis 1× Hari Ini' : '150–850 Koin'}
              </span>
            </div>
          </button>

          {/* Bento 4: Queendom Survival Tower & World Tour 5v5 */}
          <button
            type="button"
            data-testid="bento-queendom-tower"
            onClick={() => onNavigateTab('tour')}
            className="liquid-glass rounded-2xl p-3.5 text-left hover:border-white/30 transition-colors flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                <span className="font-medium text-amber-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  Queendom Tower & Tour
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-sm sm:text-base font-display font-semibold text-[#F5F5F7]">
                Survival Lantai #{saveState.towerFloor || 1}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                Hadiah Tiket Pack ×5 tiap Boss · Tour {currentCity.name}
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-zinc-300 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                PWR {activeDeckPower.toLocaleString()}
              </span>
              <span className="text-emerald-300">
                {saveState.towerPatrolDate !== saveState.dailyDate
                  ? 'Patroli Siap!'
                  : `Lantai ${saveState.towerFloor || 1}`}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};


import React, { useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Gem,
  Heart,
  Layers,
  Search,
  Sparkles,
  Swords,
  Wand2,
  Zap,
} from 'lucide-react';
import { ALL_CARDS, RARITY_LABELS, ROLES } from '../game/data';
import type { IdolCard } from '../game/data';
import {
  AGENCY_SCHEDULES,
  calculateUnitSynergy,
  getBiasBondInfo,
  getCardGradeInfo,
  getCardStats,
  getEligibleAgencyCards,
} from '../game/rules';
import type { AgencyScheduleDef, SaveState } from '../game/rules';
import { Photocard3D } from './Photocard3D';

interface BinderDeckViewProps {
  saveState: SaveState;
  onToggleDeckCard: (cardId: number) => void;
  onInspectCard: (card: IdolCard) => void;
  onAutoBestDeck: () => void;
  onOpenGroupDex: () => void;
  onDispatchAgencySchedule: (scheduleId: AgencyScheduleDef['id']) => void;
}

type BinderSubSection = 'binder' | 'formation' | 'agency';
type BinderSortMode = 'power' | 'rarity' | 'grade' | 'group';

const ERA_FILTERS: Array<{ id: 'GEN3' | 'GEN4' | 'GEN5'; label: string }> = [
  { id: 'GEN3', label: 'Gen 3' },
  { id: 'GEN4', label: 'Gen 4' },
  { id: 'GEN5', label: 'Gen 5' },
];

export const BinderDeckView: React.FC<BinderDeckViewProps> = ({
  saveState,
  onToggleDeckCard,
  onInspectCard,
  onAutoBestDeck,
  onOpenGroupDex,
  onDispatchAgencySchedule,
}) => {
  const [subSection, setSubSection] = useState<BinderSubSection>('binder');
  const [searchQuery, setSearchQuery] = useState('');
  const [eraFilter, setEraFilter] = useState<'GEN3' | 'GEN4' | 'GEN5' | null>(null);
  const [rarityFilter, setRarityFilter] = useState<number | null>(null);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [specialFilter, setSpecialFilter] = useState<'all' | 'unit' | 'graded'>('all');
  const [sortBy, setSortBy] = useState<BinderSortMode>('power');

  const deckCards = useMemo(
    () => saveState.deck.map((id) => ALL_CARDS[id]).filter(Boolean),
    [saveState.deck]
  );

  const synergy = useMemo(
    () => calculateUnitSynergy(deckCards, saveState.biasCardId, saveState.biasBondXp),
    [deckCards, saveState.biasCardId, saveState.biasBondXp]
  );

  const totalPower = useMemo(() => {
    return deckCards.reduce((sum, c) => {
      const lv = saveState.lv[c.id] || 1;
      const st = saveState.stars[c.id] || 0;
      const grade = saveState.cardGrades?.[c.id] || 0;
      return sum + getCardStats(c, lv, st, synergy.totalBonus, grade).power;
    }, 0);
  }, [deckCards, saveState.lv, saveState.stars, saveState.cardGrades, synergy.totalBonus]);

  const uniqueOwnedCount = useMemo(
    () => Object.keys(saveState.inv).filter((k) => saveState.inv[Number(k)] > 0).length,
    [saveState.inv]
  );

  const gradedCardsCount = useMemo(
    () =>
      Object.values(saveState.cardGrades || {}).filter((grade) => Number(grade) > 0).length,
    [saveState.cardGrades]
  );

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = ALL_CARDS.filter((c) => {
      const copies = saveState.inv[c.id] || 0;
      if (ownedOnly && copies <= 0) return false;
      if (specialFilter === 'unit' && !saveState.deck.includes(c.id)) return false;
      if (specialFilter === 'graded' && !(saveState.cardGrades?.[c.id] > 0)) return false;
      if (eraFilter !== null && c.era !== eraFilter) return false;
      if (rarityFilter !== null && c.rarity !== rarityFilter) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.group.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    list.sort((a, b) => {
      const ownA = (saveState.inv[a.id] || 0) > 0 ? 1 : 0;
      const ownB = (saveState.inv[b.id] || 0) > 0 ? 1 : 0;
      if (ownA !== ownB) return ownB - ownA;

      const gradeA = saveState.cardGrades?.[a.id] || 0;
      const gradeB = saveState.cardGrades?.[b.id] || 0;
      const lvA = saveState.lv[a.id] || 1;
      const lvB = saveState.lv[b.id] || 1;
      const stA = saveState.stars[a.id] || 0;
      const stB = saveState.stars[b.id] || 0;
      const pwrA = getCardStats(a, lvA, stA, synergy.totalBonus, gradeA).power;
      const pwrB = getCardStats(b, lvB, stB, synergy.totalBonus, gradeB).power;

      if (sortBy === 'power' && pwrA !== pwrB) return pwrB - pwrA;
      if (sortBy === 'grade' && gradeA !== gradeB) return gradeB - gradeA;
      if (sortBy === 'rarity' && a.rarity !== b.rarity) return b.rarity - a.rarity;
      if (sortBy === 'group' && a.group !== b.group) return a.group.localeCompare(b.group);

      if (b.rarity !== a.rarity) return b.rarity - a.rarity;
      if (pwrB !== pwrA) return pwrB - pwrA;
      return a.id - b.id;
    });

    return list;
  }, [
    saveState.inv,
    saveState.lv,
    saveState.stars,
    saveState.deck,
    saveState.cardGrades,
    synergy.totalBonus,
    searchQuery,
    eraFilter,
    rarityFilter,
    ownedOnly,
    specialFilter,
    sortBy,
  ]);

  const biasCard: IdolCard | null =
    saveState.biasCardId !== null && saveState.biasCardId !== undefined
      ? ALL_CARDS[saveState.biasCardId] || null
      : null;
  const biasBond = getBiasBondInfo(
    biasCard ? saveState.biasBondXp?.[biasCard.id] || 0 : 0
  );

  const uncompletedSchedulesCount = useMemo(
    () =>
      AGENCY_SCHEDULES.filter((s) => !saveState.agencyScheduleClaimed?.[s.id]).length,
    [saveState.agencyScheduleClaimed]
  );

  const collectionPct = Math.round((uniqueOwnedCount / ALL_CARDS.length) * 100);

  return (
    <div className="fixed inset-0 z-10 pointer-events-auto pt-16 pb-24 px-3 sm:px-6 overflow-y-auto select-none">
      <div className="w-full max-w-[1380px] mx-auto flex flex-col gap-3.5">
        {/* Top Studio Sub-Section Switcher Bar */}
        <div className="rounded-2xl bg-[#0D1224]/92 border border-white/15 px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3">
          {/* 3-Tab Segmented Control */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              data-testid="binder-subtab-binder"
              onClick={() => setSubSection('binder')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                subSection === 'binder'
                  ? 'bg-gradient-to-r from-[#FF4FA3] to-purple-500 text-white shadow-[0_0_18px_rgba(255,79,163,0.45)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Koleksi 3D Binder</span>
              <span className="px-2 py-0.5 rounded-md bg-black/35 text-[11px] font-mono font-bold tabular-nums">
                {uniqueOwnedCount}/{ALL_CARDS.length}
              </span>
            </button>

            <button
              type="button"
              data-testid="binder-subtab-formation"
              onClick={() => setSubSection('formation')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                subSection === 'formation'
                  ? 'bg-sky-400 text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.45)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Formasi 5v5 Stage Unit</span>
              <span className="px-2 py-0.5 rounded-md bg-black/35 text-[11px] font-mono text-amber-300 font-bold tabular-nums">
                {saveState.deck.length}/5 · {totalPower.toLocaleString()} PWR
              </span>
            </button>

            <button
              type="button"
              data-testid="binder-subtab-agency"
              onClick={() => setSubSection('agency')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                subSection === 'agency'
                  ? 'bg-emerald-400 text-slate-950 shadow-[0_0_18px_rgba(52,211,153,0.45)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Jadwal Agensi (Farm 💎)</span>
              {uncompletedSchedulesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-mono font-extrabold tabular-nums">
                  {uncompletedSchedulesCount} Siap
                </span>
              )}
            </button>
          </div>

          {/* Right Quick Actions: Photobook Dex & Auto-Best Deck */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenGroupDex}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FF4FA3]/15 hover:bg-[#FF4FA3]/25 border border-[#FF4FA3]/40 text-xs font-display font-bold text-[#FF4FA3] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Photobook Dex (+350 🪙 +25 💎)</span>
            </button>
            <button
              type="button"
              onClick={onAutoBestDeck}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-xs font-display font-bold text-sky-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Susun Unit Terkuat</span>
            </button>
          </div>
        </div>

        {/* SUB-SECTION 1: TRUE SCROLLING 5-COLUMN COLLECTOR'S BINDER */}
        {subSection === 'binder' && (
          <section
            data-testid="binder-section-collection"
            className="rounded-3xl bg-[#0D1224]/92 border border-white/15 p-4 sm:p-5 shadow-2xl flex flex-col gap-4"
          >
            {/* Binder Collector Overview Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#131A32]/90 border border-white/10">
              <div className="flex flex-col justify-center gap-1">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-slate-300 font-semibold">Kelengkapan Koleksi Binder</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {uniqueOwnedCount} / {ALL_CARDS.length} ({collectionPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
                  <div
                    style={{ width: `${collectionPct}%` }}
                    className="h-full bg-gradient-to-r from-[#FF4FA3] via-purple-500 to-sky-400 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <div className="text-[11px] font-sans text-slate-400 font-medium">
                    Koleksi Slab PSA Graded
                  </div>
                  <div className="text-sm font-mono font-extrabold text-sky-300 tabular-nums">
                    💎 {gradedCardsCount} Photocard Tersertifikasi
                  </div>
                </div>
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
              </div>

              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <div className="text-[11px] font-sans text-slate-400 font-medium">
                    Kekuatan 5v5 Stage Unit Aktif
                  </div>
                  <div className="text-sm font-mono font-extrabold text-amber-300 tabular-nums">
                    ⚡ {totalPower.toLocaleString()} Stage Power
                  </div>
                </div>
                <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              </div>
            </div>

            {/* Filter & Sorting Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-white/10">
              {/* Search + Ownership / Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-60 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari idol atau grup (ILLIT, IVE, aespa)..."
                    className="w-full min-h-[38px] pl-9 pr-3 py-1.5 rounded-xl bg-[#131A32] border border-white/15 text-xs font-sans text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400"
                  />
                </div>

                {/* Owned vs Full Binder Toggle */}
                <div className="flex items-center gap-1 bg-black/45 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setOwnedOnly(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-sans font-bold transition-colors cursor-pointer ${
                      !ownedOnly
                        ? 'bg-[#FF4FA3] text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Semua Slot ({ALL_CARDS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwnedOnly(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-sans font-bold transition-colors cursor-pointer ${
                      ownedOnly
                        ? 'bg-[#FF4FA3] text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Milikku ({uniqueOwnedCount})
                  </button>
                </div>

                {/* Quick Category Filter: Semua / Di Unit / PSA Graded */}
                <div className="flex items-center gap-1 bg-black/45 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setSpecialFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-sans font-semibold cursor-pointer ${
                      specialFilter === 'all'
                        ? 'bg-white text-slate-950 font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpecialFilter('unit')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-sans font-semibold cursor-pointer ${
                      specialFilter === 'unit'
                        ? 'bg-emerald-400 text-slate-950 font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Di Unit ({saveState.deck.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpecialFilter('graded')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-sans font-semibold cursor-pointer ${
                      specialFilter === 'graded'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    PSA Slab ({gradedCardsCount})
                  </button>
                </div>

                {/* Era Filter Buttons */}
                <div className="flex items-center gap-1">
                  {ERA_FILTERS.map((era) => (
                    <button
                      key={era.id}
                      type="button"
                      onClick={() => setEraFilter(eraFilter === era.id ? null : era.id)}
                      className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-sans font-bold cursor-pointer border ${
                        eraFilter === era.id
                          ? 'bg-purple-500 border-purple-300 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {era.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rarity Filter + Sort Order */}
              <div className="flex flex-wrap items-center justify-between xl:justify-end gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {RARITY_LABELS.map((rName, rIdx) => (
                    <button
                      key={rName}
                      type="button"
                      onClick={() => setRarityFilter(rarityFilter === rIdx ? null : rIdx)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-xl text-xs font-sans font-bold cursor-pointer border ${
                        rarityFilter === rIdx
                          ? 'bg-sky-400 border-sky-200 text-slate-950'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {rName}
                    </button>
                  ))}
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 bg-black/45 px-2.5 py-1 rounded-xl border border-white/10 text-xs font-sans">
                  <span className="text-slate-400 font-medium">Urutkan:</span>
                  {(['power', 'rarity', 'grade', 'group'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSortBy(mode)}
                      className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer ${
                        sortBy === mode
                          ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode === 'power'
                        ? 'Power'
                        : mode === 'rarity'
                        ? 'Rarity'
                        : mode === 'grade'
                        ? 'PSA'
                        : 'Grup'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5-Column Collector's Photocard Binder Sleeve Grid (Smooth Vertical Scrolling!) */}
            {filteredCards.length === 0 ? (
              <div className="py-16 text-center text-slate-300 font-sans text-sm space-y-2">
                <div>Tidak ada photocard yang cocok dengan filter pencarianmu.</div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setEraFilter(null);
                    setRarityFilter(null);
                    setSpecialFilter('all');
                    setOwnedOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-500/20 border border-sky-400/40 text-xs font-bold text-sky-300 cursor-pointer"
                >
                  Reset Filter Binder
                </button>
              </div>
            ) : (
              <div
                data-testid="binder-5col-grid"
                className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 justify-items-center py-1"
              >
                {filteredCards.map((card) => {
                  const copies = saveState.inv[card.id] || 0;
                  const isOwned = copies > 0;
                  const isInDeck = saveState.deck.includes(card.id);
                  const lv = saveState.lv[card.id] || 1;
                  const st = saveState.stars[card.id] || 0;
                  const gradeTier = saveState.cardGrades?.[card.id] || 0;
                  const cardStats = getCardStats(
                    card,
                    lv,
                    st,
                    synergy.totalBonus,
                    gradeTier
                  );
                  const gradeInfo = getCardGradeInfo(gradeTier);

                  return (
                    <div
                      key={card.id}
                      className={`w-full flex flex-col items-center justify-between p-2.5 rounded-2xl border transition-all ${
                        isOwned
                          ? isInDeck
                            ? 'bg-gradient-to-b from-emerald-950/35 via-[#131A32]/90 to-[#0C1021] border-emerald-400/45 shadow-[0_8px_24px_rgba(16,185,129,0.12)]'
                            : 'bg-gradient-to-b from-[#161E3A]/85 to-[#0C1021]/90 border-white/12 hover:border-white/25 shadow-lg'
                          : 'bg-black/35 border-white/5 opacity-60 hover:opacity-85'
                      }`}
                    >
                      {/* Top Acrylic Sleeve Header (No duplicate PSA badge; explicit Role & PWR label) */}
                      <div className="w-full flex items-center justify-between gap-1 px-1 mb-1.5 text-[11px] font-mono tabular-nums">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-400 font-semibold">
                            #{String(card.id + 1).padStart(3, '0')}
                          </span>
                          <span className="text-[10px] font-sans font-semibold text-slate-300 truncate">
                            {ROLES[card.role]?.icon} {ROLES[card.role]?.short}
                          </span>
                        </div>
                        {isOwned ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              title="Total Stage Power (ATK + HP + Bonus)"
                              className="px-1.5 py-0.2 rounded bg-amber-400/15 border border-amber-400/30 text-[10px] text-amber-300 font-bold"
                            >
                              PWR {cardStats.power.toLocaleString()}
                            </span>
                            <span
                              title="Jumlah Salinan Kartu"
                              className="px-1.5 py-0.2 rounded bg-sky-400/15 border border-sky-400/30 text-[10px] text-sky-300 font-bold"
                            >
                              ×{copies}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-sans text-slate-500 font-semibold">
                            Belum Dimiliki
                          </span>
                        )}
                      </div>

                      {/* 3D Photocard inside Sleeve */}
                      <div
                        className={
                          isOwned ? '' : 'grayscale contrast-75 opacity-65 pointer-events-none'
                        }
                      >
                        <Photocard3D
                          card={card}
                          level={lv}
                          awakeningStars={st}
                          synergyBonus={synergy.totalBonus}
                          inDeck={isInDeck}
                          isSelected={isInDeck}
                          isBias={saveState.biasCardId === card.id}
                          decoFrame={saveState.cardDeco?.[card.id]}
                          gradeTier={gradeTier}
                          size="md"
                          onClick={() => {
                            if (isOwned) {
                              onInspectCard(card);
                            }
                          }}
                        />
                      </div>

                      {/* Bottom Pocket Action Buttons */}
                      {isOwned ? (
                        <div className="w-full mt-2.5 grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleDeckCard(card.id)}
                            className={`min-h-[32px] px-2 py-1 rounded-xl text-[11px] font-display font-bold transition-colors cursor-pointer truncate ${
                              isInDeck
                                ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-300'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                            }`}
                          >
                            {isInDeck ? '✓ Di Unit' : '+ Unit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onInspectCard(card)}
                            className="min-h-[32px] px-2 py-1 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 text-[11px] font-display font-bold text-amber-300 cursor-pointer truncate"
                          >
                            💎 Detail
                          </button>
                        </div>
                      ) : (
                        <div className="w-full mt-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-center text-[11px] font-sans text-slate-400">
                          {card.group} · {RARITY_LABELS[card.rarity]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SUB-SECTION 2: 5V5 STAGE UNIT FORMATION */}
        {subSection === 'formation' && (
          <section
            data-testid="binder-section-formation"
            className="rounded-3xl bg-[#0D1224]/92 border border-white/15 p-5 sm:p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/12 pb-3.5">
              <div>
                <div className="text-xs font-sans font-bold uppercase tracking-wider text-sky-400">
                  Formasi Konser Utama · 5 Slot Aktif
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white mt-0.5">
                  5v5 Stage Unit ({saveState.deck.length}/5 Member)
                </h2>
                <p className="text-xs font-sans text-slate-300 mt-0.5">
                  Klik photocard untuk melatih Level, memilih Bingkai Polco Deco, Center Bias, atau sertifikasi PSA 10 Black Label.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-2xl bg-black/55 border border-amber-400/35 text-right">
                  <div className="text-[11px] font-sans font-semibold text-slate-400">
                    Total Stage Power Unit
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-300 tabular-nums">
                    ⚡ {totalPower.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Column Full-Width Stage Unit Cards */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center py-2">
              {Array.from({ length: 5 }).map((_, slotIdx) => {
                const cardId = saveState.deck[slotIdx];
                const card = cardId !== undefined ? ALL_CARDS[cardId] : null;
                if (!card) {
                  return (
                    <button
                      key={`empty-${slotIdx}`}
                      type="button"
                      onClick={() => setSubSection('binder')}
                      className="w-36 h-52 sm:w-52 sm:h-[304px] rounded-[20px] border-2 border-dashed border-white/20 hover:border-sky-400/50 bg-white/5 flex flex-col items-center justify-center p-4 text-center transition-colors cursor-pointer"
                    >
                      <span className="text-3xl mb-1 text-slate-400">+</span>
                      <span className="text-sm font-display font-bold text-white">
                        Slot Unit #{slotIdx + 1}
                      </span>
                      <span className="text-xs font-sans text-sky-300 mt-1">
                        Pilih dari Koleksi Binder
                      </span>
                    </button>
                  );
                }

                const lv = saveState.lv[card.id] || 1;
                const st = saveState.stars[card.id] || 0;
                const grade = saveState.cardGrades?.[card.id] || 0;
                const cStats = getCardStats(card, lv, st, synergy.totalBonus, grade);
                const roleMeta = ROLES[card.role] || ROLES[0];

                return (
                  <div
                    key={card.id}
                    className="w-full flex flex-col items-center gap-2.5 p-2.5 rounded-2xl bg-[#141B35]/85 border border-white/12"
                  >
                    <div className="w-full flex items-center justify-between text-xs font-sans font-bold text-slate-200 px-1">
                      <span className="truncate">
                        {roleMeta.icon} {roleMeta.short}
                      </span>
                      <span className="font-mono text-amber-300 tabular-nums">
                        ⚡ {cStats.power}
                      </span>
                    </div>
                    <Photocard3D
                      card={card}
                      level={lv}
                      awakeningStars={st}
                      synergyBonus={synergy.totalBonus}
                      size="md"
                      inDeck
                      isSelected
                      isBias={saveState.biasCardId === card.id}
                      decoFrame={saveState.cardDeco?.[card.id]}
                      gradeTier={grade}
                      onClick={() => onInspectCard(card)}
                    />
                    <div className="w-full grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspectCard(card)}
                        className="min-h-[32px] px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/35 text-xs font-display font-bold text-sky-200 cursor-pointer"
                      >
                        Upgrade
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleDeckCard(card.id)}
                        className="min-h-[32px] px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/30 text-xs font-display font-bold text-rose-300 cursor-pointer"
                      >
                        Lepas
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Synergy & Center Bias Bond Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-white/12">
              <div className="rounded-2xl bg-black/45 border border-white/10 p-3.5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-display font-bold text-slate-300">
                  Sinergi Unit Aktif:
                </span>
                {synergy.activeBadges.length === 0 ? (
                  <span className="text-xs font-sans text-slate-400">
                    Pasang minimal 2 member dari grup yang sama atau 3+ role berbeda untuk bonus stat!
                  </span>
                ) : (
                  synergy.activeBadges.map((s) => (
                    <span
                      key={s.label}
                      className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-xs font-sans font-bold text-emerald-300"
                    >
                      ✨ {s.label} (+{s.bonusPct}% Stat)
                    </span>
                  ))
                )}
              </div>

              {biasCard && (
                <div className="rounded-2xl bg-pink-500/10 border border-pink-400/30 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs font-sans text-pink-200 font-bold">
                    <Heart className="w-4 h-4 text-pink-400 fill-pink-400 shrink-0" />
                    <div>
                      <div>
                        Center Bias: <span className="text-white">{biasCard.name}</span> (
                        {biasCard.group})
                      </div>
                      <div className="text-[11px] font-mono text-pink-300">
                        Bond Lv.{biasBond.level} (+{Math.round(biasBond.statBonus * 100)}% All-Stat)
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInspectCard(biasCard)}
                    className="px-3.5 py-2 rounded-xl bg-pink-500/25 hover:bg-pink-500/35 border border-pink-300/40 text-xs font-display font-bold text-white cursor-pointer"
                  >
                    Kelola Bias
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SUB-SECTION 3: IDOL AGENCY SCHEDULE (FARM STAR DIAMONDS & COINS WITH SPARE CARDS) */}
        {subSection === 'agency' && (
          <section
            data-testid="binder-section-agency"
            className="rounded-3xl bg-[#0D1224]/92 border border-white/15 p-5 sm:p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/12 pb-3.5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider text-emerald-400 font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Idol Agency Schedule · Ekspedisi Kartu Cadangan</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white mt-0.5">
                  Jadwal Agensi Harian (+31 💎 & +680 🪙 / Hari)
                </h2>
                <p className="text-xs font-sans text-slate-300 mt-0.5">
                  Utus photocard idol dari Binder ke aktivitas siaran TV & pemotretan majalah untuk memanen Star Diamonds (💎) dan Star Coins (🪙) setiap hari!
                </p>
              </div>

              <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-300/30">
                <Gem className="w-4 h-4 text-cyan-300" />
                <div>
                  <div className="text-[11px] font-sans text-slate-400 font-medium">
                    Saldo Star Diamonds
                  </div>
                  <div className="text-base font-mono font-extrabold text-cyan-300 tabular-nums">
                    {saveState.diamonds || 0} 💎
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Agency Schedule Cards in a 3-Column Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {AGENCY_SCHEDULES.map((schedule) => {
                const isClaimed = Boolean(saveState.agencyScheduleClaimed?.[schedule.id]);
                const eligiblePool = getEligibleAgencyCards(saveState, schedule);
                const hasCount = eligiblePool.length >= schedule.requiredCount;
                const hasRarity = eligiblePool.some((c) => c.rarity >= schedule.minRarity);
                const canDispatch = !isClaimed && hasCount && hasRarity;
                const previewCards = eligiblePool.slice(0, schedule.requiredCount);

                return (
                  <div
                    key={schedule.id}
                    data-testid={`agency-schedule-${schedule.id}`}
                    className={`rounded-2xl p-4 sm:p-5 border flex flex-col justify-between gap-4 transition-all ${
                      isClaimed
                        ? 'bg-emerald-950/20 border-emerald-400/30'
                        : 'bg-[#141B35]/90 border-white/15 hover:border-white/25'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          style={{
                            color: schedule.accentColor,
                            borderColor: `${schedule.accentColor}55`,
                            backgroundColor: `${schedule.accentColor}18`,
                          }}
                          className="px-2.5 py-0.5 rounded-lg border text-[11px] font-display font-bold uppercase tracking-wider"
                        >
                          {schedule.badge}
                        </span>
                        {isClaimed && (
                          <span className="inline-flex items-center gap-1 text-xs font-sans font-bold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai Hari Ini
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-display font-extrabold text-white">
                        {schedule.title}
                      </h3>
                      <p className="text-xs font-sans text-slate-300 mt-1 leading-relaxed">
                        {schedule.subtitle}
                      </p>

                      <div className="mt-3 px-3 py-2 rounded-xl bg-black/45 border border-white/10 text-xs font-sans text-slate-300">
                        Syarat: <strong className="text-white">{schedule.minRarityLabel}</strong>
                      </div>
                    </div>

                    {/* Preview Auto-Selected Bench Idols */}
                    <div className="rounded-xl bg-black/40 border border-white/10 p-3">
                      <div className="text-[11px] font-sans font-semibold text-slate-400 mb-2">
                        {isClaimed
                          ? 'Idol yang Bertugas Hari Ini:'
                          : `Idol Siap Utus (${previewCards.length}/${schedule.requiredCount}):`}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {previewCards.map((c) => (
                          <span
                            key={c.id}
                            className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-sans font-bold text-white flex items-center gap-1.5"
                          >
                            <span
                              style={{ backgroundColor: c.accentColor }}
                              className="w-2 h-2 rounded-full"
                            />
                            <span>{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({c.group})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Rewards & Action Button */}
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="text-slate-400 font-medium">Hadiah Jadwal:</span>
                        <div className="flex items-center gap-2 font-mono font-bold">
                          <span className="text-amber-300">+{schedule.rewardCoins} 🪙</span>
                          <span className="text-cyan-300">+{schedule.rewardDiamonds} 💎</span>
                          <span className="text-pink-300">+{schedule.rewardBondXp} Bond</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        data-testid={`agency-dispatch-btn-${schedule.id}`}
                        disabled={!canDispatch}
                        onClick={() => onDispatchAgencySchedule(schedule.id)}
                        className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl font-display font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
                          isClaimed
                            ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 cursor-default'
                            : canDispatch
                            ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                            : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isClaimed
                          ? '✓ Hadiah Sudah Diklaim Hari Ini'
                          : canDispatch
                          ? `🚀 Utus Idol & Klaim +${schedule.rewardDiamonds} 💎`
                          : 'Syarat Kartu Belum Terpenuhi'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

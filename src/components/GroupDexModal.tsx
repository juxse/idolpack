import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Gift, Search, Target, X } from 'lucide-react';
import { IdolCard, RARITY_LABELS } from '../game/data';
import { getGroupDexList, SaveState } from '../game/rules';

interface GroupDexModalProps {
  saveState: SaveState;
  onClose: () => void;
  onClaimGroupReward: (groupName: string) => void;
  onTargetGroupInPack: (groupName: string, bannerId: string) => void;
  onInspectCard: (card: IdolCard) => void;
}

export const GroupDexModal: React.FC<GroupDexModalProps> = ({
  saveState,
  onClose,
  onClaimGroupReward,
  onTargetGroupInPack,
  onInspectCard,
}) => {
  const [eraFilter, setEraFilter] = useState<'ALL' | 'GEN5' | 'GEN4' | 'GEN3' | 'COMPLETE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const dexList = useMemo(() => getGroupDexList(saveState), [saveState]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dexList
      .filter((entry) => {
        if (eraFilter === 'GEN5' && entry.era !== 'GEN5') return false;
        if (eraFilter === 'GEN4' && entry.era !== 'GEN4') return false;
        if (eraFilter === 'GEN3' && entry.era !== 'GEN3') return false;
        if (eraFilter === 'COMPLETE' && !entry.isComplete) return false;
        if (q) {
          const matchGroup = entry.group.toLowerCase().includes(q);
          const matchMember = entry.members.some((m) => m.name.toLowerCase().includes(q));
          return matchGroup || matchMember;
        }
        return true;
      })
      .sort((a, b) => {
        const aReady = a.isComplete && !a.isClaimed ? 1 : 0;
        const bReady = b.isComplete && !b.isClaimed ? 1 : 0;
        if (aReady !== bReady) return bReady - aReady;
        if (b.completionPct !== a.completionPct) return b.completionPct - a.completionPct;
        const priorityGroups = ['Hearts2Hearts', 'ILLIT', 'MEOVV', 'KiiiKiii', 'BABYMONSTER', 'izna', 'RESCENE', 'IVE', 'aespa', 'NewJeans'];
        const idxA = priorityGroups.indexOf(a.group);
        const idxB = priorityGroups.indexOf(b.group);
        if (idxA !== -1 || idxB !== -1) {
          return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        }
        return b.debutYear - a.debutYear;
      });
  }, [dexList, eraFilter, searchQuery]);

  const completedCount = dexList.filter((d) => d.isComplete).length;

  return (
    <div
      data-testid="group-dex-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 pointer-events-auto"
    >
      <div className="w-full max-w-5xl max-h-[88dvh] liquid-glass-elevated rounded-3xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0066FF]/20 border border-[#0066FF]/40 flex items-center justify-center text-[#38BDF8]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-display font-semibold text-[#F5F5F7]">
                Group Photobook Dex · {completedCount}/{dexList.length} Grup Lengkap
              </h2>
              <p className="text-xs text-zinc-400">
                Lengkapi seluruh member 1 grup (contoh ILLIT, MEOVV, Hearts2Hearts) untuk klaim +350
                Koin, <strong className="text-[#38BDF8]">+25 💎</strong> & +50 Bond XP!
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-group-dex-btn"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/12 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="px-5 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5 bg-white/[0.02]">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 overflow-x-auto max-w-full">
            {(
              [
                ['ALL', 'Semua Grup (41)'],
                ['GEN5', 'Next Wave 2023–2026'],
                ['GEN4', 'Gen 4 Icons'],
                ['GEN3', 'Gen 3 Legends'],
                ['COMPLETE', 'Lengkap / Klaim'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setEraFilter(key)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  eraFilter === key
                    ? 'bg-[#0066FF] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Hearts2Hearts, ILLIT, MEOVV..."
              className="w-full min-h-[36px] pl-8 pr-3 py-1.5 rounded-xl bg-black/45 border border-white/12 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0066FF]"
            />
          </div>
        </div>

        {/* Group Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredList.map((entry) => {
            const isFocused = saveState.focusGroup === entry.group;
            return (
              <div
                key={entry.group}
                data-testid={`dex-group-${entry.group}`}
                className="liquid-glass rounded-2xl p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                        Debut {entry.debutYear} · {entry.era} · Hadiah +350 🪙 & +25 💎
                      </div>
                      <h3 className="text-base font-display font-semibold text-[#F5F5F7]">
                        {entry.group}
                      </h3>
                    </div>

                    <span className="text-xs font-mono font-semibold text-[#38BDF8] tabular-nums">
                      {entry.ownedCount}/{entry.totalCount} Member ({entry.completionPct}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden my-2.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#38BDF8] transition-all duration-300"
                      style={{ width: `${entry.completionPct}%` }}
                    />
                  </div>

                  {/* Member Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {entry.members.map((m) => {
                      const owned = (saveState.inv[m.id] || 0) > 0;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => owned && onInspectCard(m)}
                          disabled={!owned}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                            owned
                              ? 'bg-[#0066FF]/20 border border-[#0066FF]/45 text-white hover:bg-[#0066FF]/35 cursor-pointer'
                              : 'bg-white/[0.03] border border-white/8 text-zinc-500 cursor-default'
                          }`}
                        >
                          <span>{m.name}</span>
                          <span className="text-[10px] font-mono opacity-75">
                            · {RARITY_LABELS[m.rarity][0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Group Footer Actions */}
                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onTargetGroupInPack(entry.group, entry.bannerId)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      isFocused
                        ? 'bg-[#0066FF] text-white'
                        : 'bg-white/[0.07] hover:bg-white/[0.14] text-zinc-200 border border-white/12'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 text-[#38BDF8]" />
                    {isFocused ? 'Target Aktif di Pack' : 'Target di Pack 3D'}
                  </button>

                  {entry.isComplete && !entry.isClaimed ? (
                    <button
                      type="button"
                      data-testid={`claim-dex-${entry.group}`}
                      onClick={() => onClaimGroupReward(entry.group)}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      Klaim +350 🪙 · +25 💎
                    </button>
                  ) : entry.isClaimed ? (
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Hadiah Diklaim
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
                      Kurang {entry.totalCount - entry.ownedCount} member
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

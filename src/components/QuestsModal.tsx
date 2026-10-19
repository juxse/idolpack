import React from 'react';
import {
  ALL_CARDS,
  CAREER_MILESTONES,
  DAILY_QUESTS,
  QuestDef,
} from '../game/data';
import { SaveState } from '../game/rules';

interface QuestsModalProps {
  saveState: SaveState;
  onClaimQuest: (quest: QuestDef) => void;
  onClaimDailyBonusCoins: () => void;
  onResetProgress: () => void;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({
  saveState,
  onClaimQuest,
  onClaimDailyBonusCoins,
  onResetProgress,
}) => {
  const uniqueOwned = Object.keys(saveState.inv).length;
  const bonusAlreadyClaimed = !!saveState.dailyBonusClaimed;

  const getQuestProgress = (q: QuestDef): number => {
    if (q.type === 'collect') {
      return uniqueOwned;
    }
    const source = q.isMilestone ? saveState.milestoneCounts : saveState.dailyCounts;
    return source[q.type] || 0;
  };

  const isQuestClaimed = (q: QuestDef): boolean => {
    const map = q.isMilestone ? saveState.milestoneClaimed : saveState.dailyClaimed;
    return !!map[q.id];
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-auto pt-20 pb-28 px-4 md:px-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Agency Pass & Daily 1x Bonus Coin Banner (No Stamina, Strict 1x/Day Limit) */}
        <section className="rounded-2xl bg-[#0D101B]/95 border border-white/12 p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              IDOL AGENCY PASS · LEVEL PRODUSER {Math.floor(saveState.xp / 200) + 1} · XP {saveState.xp}
            </div>
            <h2 className="text-xl font-display font-extrabold text-white mt-0.5">
              MISI HARIAN & PENCAPAIAN AGENSI
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Selesaikan jadwal harian & tur dunia untuk mengumpulkan Star Coins (🪙) dan <strong className="text-[#38BDF8]">Star Diamonds (💎)</strong> untuk PSA Card Grading Lab!
            </p>
          </div>

          <button
            type="button"
            disabled={bonusAlreadyClaimed}
            onClick={onClaimDailyBonusCoins}
            className={`px-5 py-3 rounded-xl font-mono font-extrabold text-xs whitespace-nowrap shrink-0 tabular-nums transition-colors ${
              bonusAlreadyClaimed
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 opacity-75 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer'
            }`}
          >
            {bonusAlreadyClaimed
              ? '✅ BONUS HARIAN TERKLAIM (1×/HARI)'
              : 'Klaim Bonus Koin Harian (+180 🪙)'}
          </button>
        </section>

        {/* Daily Quests Grid */}
        <section className="rounded-2xl bg-[#0D101B]/95 border border-white/12 p-5 shadow-2xl">
          <h3 className="text-base font-display font-extrabold text-white mb-4">
            JADWAL MISI HARIAN (RESET TIAP HARI)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DAILY_QUESTS.map((q) => {
              const prog = Math.min(q.target, getQuestProgress(q));
              const claimed = isQuestClaimed(q);
              const ready = prog >= q.target && !claimed;

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-[#14192B] border border-white/10 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-white truncate">{q.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{q.desc}</div>
                    <div className="mt-2 flex items-center gap-2 font-mono text-xs tabular-nums">
                      <div className="flex-1 h-2 rounded-full bg-black/60 overflow-hidden">
                        <div
                          style={{ transform: `scaleX(${prog / q.target})` }}
                          className="h-full w-full origin-left bg-[#FF4FA3] transition-transform duration-300"
                        />
                      </div>
                      <span className="text-slate-300 font-bold">
                        {prog}/{q.target}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => onClaimQuest(q)}
                    className={`px-4 py-2.5 rounded-xl font-mono font-extrabold text-xs whitespace-nowrap shrink-0 tabular-nums ${
                      claimed
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : ready
                        ? 'bg-[#FF4FA3] hover:bg-[#ff3395] text-white shadow-lg cursor-pointer'
                        : 'bg-[#1D243B] text-slate-500 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {claimed
                      ? '✅ SELESAI'
                      : `KLAIM +${q.rewardCoins} 🪙${q.rewardDiamonds ? ` · +${q.rewardDiamonds} 💎` : ''}`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Career Milestones Grid */}
        <section className="rounded-2xl bg-[#0D101B]/95 border border-white/12 p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-display font-extrabold text-white">
              MILESTONE KARIER PRODUSER ({uniqueOwned}/{ALL_CARDS.length} IDOL)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CAREER_MILESTONES.map((q) => {
              const prog = Math.min(q.target, getQuestProgress(q));
              const claimed = isQuestClaimed(q);
              const ready = prog >= q.target && !claimed;

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-[#14192B] border border-white/10 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-amber-300 truncate">{q.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{q.desc}</div>
                    <div className="mt-2 flex items-center gap-2 font-mono text-xs tabular-nums">
                      <div className="flex-1 h-2 rounded-full bg-black/60 overflow-hidden">
                        <div
                          style={{ transform: `scaleX(${prog / q.target})` }}
                          className="h-full w-full origin-left bg-amber-400 transition-transform duration-300"
                        />
                      </div>
                      <span className="text-slate-300 font-bold">
                        {prog}/{q.target}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => onClaimQuest(q)}
                    className={`px-4 py-2.5 rounded-xl font-mono font-extrabold text-xs whitespace-nowrap shrink-0 tabular-nums ${
                      claimed
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : ready
                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg cursor-pointer'
                        : 'bg-[#1D243B] text-slate-500 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {claimed
                      ? '✅ TERKLAIM'
                      : `KLAIM +${q.rewardCoins} 🪙${q.rewardDiamonds ? ` · +${q.rewardDiamonds} 💎` : ''}`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Data Management */}
        <section className="rounded-2xl bg-[#0D101B]/95 border border-white/12 p-4 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Ingin mengulang progres koleksi dan tur dari awal?
          </div>
          <button
            type="button"
            onClick={onResetProgress}
            className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/30 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            Reset Data Permainan
          </button>
        </section>
      </div>
    </div>
  );
};

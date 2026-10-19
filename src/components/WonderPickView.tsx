import React, { useEffect, useState } from 'react';
import { Coins, RefreshCw, Shuffle, Sparkles } from 'lucide-react';
import { IdolCard, RARITY_LABELS } from '../game/data';
import {
  PullOutcomeItem,
  SaveState,
  WONDER_PICK_DAILY_LIMIT,
  WONDER_PICK_REFRESH_COST,
  WonderPickBoard,
} from '../game/rules';
import { prefetchIdolBatch } from '../utils/imageResolver';
import { sound } from '../utils/sound';
import { Photocard3D, PhotocardBack3D } from './Photocard3D';

interface WonderPickViewProps {
  saveState: SaveState;
  boards: WonderPickBoard[];
  onRefreshBoards: () => void;
  onExecutePick: (
    board: WonderPickBoard,
    slotIndex: number
  ) => {
    ok: boolean;
    reason?: string;
    chosenIndex: number;
    shuffledCards: IdolCard[];
    pickedItem: PullOutcomeItem | null;
  };
  onInspectCard: (card: IdolCard) => void;
}

type PickStagePhase = 'browsing' | 'shuffling' | 'picking' | 'revealed';

export const WonderPickView: React.FC<WonderPickViewProps> = ({
  saveState,
  boards,
  onRefreshBoards,
  onExecutePick,
  onInspectCard,
}) => {
  const [activeBoard, setActiveBoard] = useState<WonderPickBoard | null>(null);
  const [phase, setPhase] = useState<PickStagePhase>('browsing');
  const [shuffleStep, setShuffleStep] = useState<number>(0);
  const [chosenSlot, setChosenSlot] = useState<number | null>(null);
  const [shuffledResult, setShuffledResult] = useState<IdolCard[]>([]);
  const [pickedOutcome, setPickedOutcome] = useState<PullOutcomeItem | null>(null);
  const [revealOthers, setRevealOthers] = useState<boolean>(false);

  const usedDaily = saveState.wonderPickDailyCount || 0;
  const remainingQuota = Math.max(0, WONDER_PICK_DAILY_LIMIT - usedDaily);

  useEffect(() => {
    const allCards = boards.flatMap((b) => b.cards);
    prefetchIdolBatch(allCards);
  }, [boards]);

  const handleStartTable = (board: WonderPickBoard) => {
    if (remainingQuota <= 0) {
      sound.playClick();
      onExecutePick(board, 0);
      return;
    }

    const isFree = board.allowFreeDaily && !saveState.wonderPickFreeUsedToday;
    const cost = isFree ? 0 : board.cost;
    if (saveState.coins < cost) {
      sound.playClick();
      onExecutePick(board, 0);
      return;
    }

    sound.playPackSlice();
    setActiveBoard(board);
    setChosenSlot(null);
    setPickedOutcome(null);
    setRevealOthers(false);
    setPhase('shuffling');
    setShuffleStep(0);

    setTimeout(() => setShuffleStep(1), 220);
    setTimeout(() => setShuffleStep(2), 480);
    setTimeout(() => setShuffleStep(3), 720);
    setTimeout(() => {
      setPhase('picking');
      setShuffleStep(0);
    }, 950);
  };

  const handleSelectMysterySlot = (slotIdx: number) => {
    if (!activeBoard || phase !== 'picking') return;
    const res = onExecutePick(activeBoard, slotIdx);
    if (!res.ok || !res.pickedItem) {
      setPhase('browsing');
      setActiveBoard(null);
      return;
    }

    sound.playCardReveal(res.pickedItem.card.rarity);
    setChosenSlot(res.chosenIndex);
    setShuffledResult(res.shuffledCards);
    setPickedOutcome(res.pickedItem);
    setPhase('revealed');

    setTimeout(() => {
      setRevealOthers(true);
    }, 650);
  };

  const shuffleOffsets = [
    [0, 0, 0, 0, 0],
    [40, -35, 30, -40, 5],
    [-30, 45, -25, 35, -25],
    [20, -20, 15, -15, 0],
  ][shuffleStep] || [0, 0, 0, 0, 0];

  return (
    <div className="fixed inset-0 z-10 pointer-events-auto pt-16 pb-24 px-3 sm:px-6 md:px-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header Bar */}
        <div className="rounded-3xl liquid-glass-elevated p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#38BDF8] font-medium">
              <span className="inline-flex items-center gap-1">
                <Shuffle className="w-3.5 h-3.5" />
                Wonder Pick · Pilih 1 dari 5 Kartu Acak
              </span>
              <span aria-hidden="true">·</span>
              <span
                data-testid="wonder-daily-quota"
                className={`font-mono font-semibold tabular-nums ${
                  remainingQuota > 0 ? 'text-emerald-300' : 'text-rose-400'
                }`}
              >
                Kuota Harian: {remainingQuota}/{WONDER_PICK_DAILY_LIMIT}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-zinc-400 font-mono">
                Meja Mythic Daesang: 12% Peluang Langka
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-semibold text-white mt-0.5 tracking-tight">
              Etalase Tarikan Produser Lain
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!saveState.wonderPickFreeUsedToday && remainingQuota > 0 && (
              <span className="text-xs font-mono font-semibold text-emerald-300 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
                1× Gratis Reguler Tersedia
              </span>
            )}
            <button
              type="button"
              data-testid="wonder-refresh-btn"
              onClick={() => {
                sound.playClick();
                setPhase('browsing');
                setActiveBoard(null);
                onRefreshBoards();
              }}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs font-semibold text-white cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 font-mono tabular-nums"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
              Acak Etalase ({WONDER_PICK_REFRESH_COST} Koin)
            </button>
          </div>
        </div>

        {/* Active 3D Shuffle & Mystery Pick Arena */}
        {activeBoard && phase !== 'browsing' ? (
          <div className="rounded-3xl liquid-glass-elevated border border-[#38BDF8]/50 p-4 sm:p-6 space-y-5 text-center">
            <div className="space-y-1">
              <div className="text-xs font-mono font-semibold text-amber-300 tracking-wide">
                {activeBoard.producerName} · {activeBoard.title}
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-semibold text-white">
                {phase === 'shuffling' && 'Mengacak Posisi 5 Photocard...'}
                {phase === 'picking' && 'Ketuk 1 dari 5 Kartu Misterius Pilihanmu!'}
                {phase === 'revealed' &&
                  pickedOutcome &&
                  `Kamu Mendapatkan ${pickedOutcome.card.name} (${pickedOutcome.card.group})!`}
              </h3>
              <p className="text-xs text-zinc-300">
                {phase === 'picking'
                  ? 'Semua 5 kartu dari meja tadi telah dibalik dan diacak. Pilih insting terbaikmu!'
                  : phase === 'revealed'
                  ? `Rarity: ${RARITY_LABELS[pickedOutcome?.card.rarity || 0]} · ${
                      pickedOutcome?.isNew
                        ? 'KARTU BARU DI BINDER!'
                        : `Salinan Duplikat (+${pickedOutcome?.duplicateCoins} Koin)`
                    } · Sisa Kuota Hari Ini: ${remainingQuota}/${WONDER_PICK_DAILY_LIMIT}`
                  : 'Perhatikan gerakan kartu hologram...'}
              </p>
            </div>

            {/* 5 Mystery Cards Row */}
            <div
              data-testid="wonder-pick-stage-slots"
              className="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 py-3 max-w-5xl mx-auto"
            >
              {[0, 1, 2, 3, 4].map((slotIdx) => {
                const isChosen = chosenSlot === slotIdx;
                const isCardRevealed =
                  phase === 'revealed' && (isChosen || revealOthers);
                const cardToShow =
                  shuffledResult[slotIdx] || activeBoard.cards[slotIdx];

                return (
                  <div
                    key={slotIdx}
                    style={{
                      transform:
                        phase === 'shuffling'
                          ? `translateX(${shuffleOffsets[slotIdx]}px) scale(0.95)`
                          : isChosen
                          ? 'translateY(-8px) scale(1.06)'
                          : undefined,
                      transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                    className={`relative flex flex-col items-center ${
                      phase === 'revealed' && !isChosen ? 'opacity-65' : ''
                    }`}
                  >
                    {isChosen && (
                      <div className="mb-1 px-1.5 py-0.5 rounded bg-amber-400 text-black text-[8px] sm:text-[10px] font-mono font-black whitespace-nowrap shadow flex items-center gap-0.5">
                        <span>PILIHANMU</span>
                      </div>
                    )}

                    {isCardRevealed ? (
                      <Photocard3D
                        card={cardToShow}
                        level={saveState.lv[cardToShow.id] || 1}
                        awakeningStars={saveState.stars[cardToShow.id] || 0}
                        size="xs"
                        isNew={isChosen && pickedOutcome?.isNew}
                        isSelected={isChosen}
                        isBias={saveState.biasCardId === cardToShow.id}
                        decoFrame={saveState.cardDeco?.[cardToShow.id]}
                        onClick={() => onInspectCard(cardToShow)}
                      />
                    ) : (
                      <PhotocardBack3D
                        rarity={3}
                        size="xs"
                        label="PILIH"
                        onClick={() => handleSelectMysterySlot(slotIdx)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {phase === 'revealed' && pickedOutcome && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onInspectCard(pickedOutcome.card)}
                  className="min-h-[42px] px-5 py-2.5 rounded-xl bg-white/[0.12] hover:bg-white/[0.18] text-white font-semibold text-xs cursor-pointer"
                >
                  Inspeksi 3D & Set Bias
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhase('browsing');
                    setActiveBoard(null);
                  }}
                  className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs cursor-pointer"
                >
                  Kembali ke Etalase Wonder Pick
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 3 Producer Wonder Pick Tables */
          <div className="space-y-4">
            {boards.map((board, bIdx) => {
              const isFree =
                board.allowFreeDaily &&
                !saveState.wonderPickFreeUsedToday &&
                remainingQuota > 0;
              return (
                <div
                  key={board.id}
                  data-testid={`wonder-board-${bIdx}`}
                  className={`rounded-3xl liquid-glass p-3.5 sm:p-5 space-y-3 ${
                    board.isExoticTable
                      ? 'border-2 border-cyan-400/80 shadow-[0_0_32px_rgba(56,189,248,0.3)] bg-gradient-to-r from-[#0C1A30] via-[#1A0E2E] to-[#1F1706]'
                      : board.isMythicTable
                      ? 'border border-[#FF4FA3]/60'
                      : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-300">
                        <span
                          style={{ color: board.accentColor }}
                          className="font-semibold"
                        >
                          {board.producerName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{board.subtitle}</span>
                        {board.isExoticTable ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="bg-gradient-to-r from-cyan-300 via-pink-400 to-amber-300 bg-clip-text text-transparent font-black animate-pulse">
                              🌈 JACKPOT COSMIC EXOTIC
                            </span>
                          </>
                        ) : board.isMythicTable ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#FF4FA3] font-bold">
                              JACKPOT MYTHIC EX
                            </span>
                          </>
                        ) : null}
                      </div>
                      <h3 className="text-base sm:text-lg font-display font-semibold text-white">
                        {board.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      data-testid={`wonder-start-btn-${bIdx}`}
                      disabled={remainingQuota <= 0}
                      onClick={() => handleStartTable(board)}
                      style={{
                        backgroundColor:
                          remainingQuota <= 0 ? 'rgba(255,255,255,0.08)' : board.accentColor,
                      }}
                      className="min-h-[42px] px-4 py-2 rounded-xl text-white font-display font-semibold text-xs sm:text-sm tracking-tight shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-95 transition-transform inline-flex items-center gap-1.5 font-mono tabular-nums"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {remainingQuota <= 0
                        ? `Kuota Habis (0/${WONDER_PICK_DAILY_LIMIT})`
                        : isFree
                        ? 'Mulai Wonder Pick (GRATIS)'
                        : `Mulai · ${board.cost} Koin`}
                    </button>
                  </div>

                  {/* 5 Preview Cards in a 5-column row on Mobile & Desktop */}
                  <div className="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:justify-start sm:gap-3 pt-1">
                    {board.cards.map((card, cIdx) => (
                      <div key={`${board.id}-${card.id}-${cIdx}`} className="flex justify-center">
                        <Photocard3D
                          card={card}
                          effectiveRarity={board.boardRarities?.[cIdx] ?? card.rarity}
                          rarityMask={saveState.cardRarityMask?.[card.id]}
                          level={saveState.lv[card.id] || 1}
                          awakeningStars={saveState.stars[card.id] || 0}
                          size="xs"
                          isBias={saveState.biasCardId === card.id}
                          decoFrame={saveState.cardDeco?.[card.id]}
                          interactive3D={false}
                          onClick={() => onInspectCard(card)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


import React, { useEffect, useState } from 'react';
import { Crown, Sparkles, Ticket, Wand2, Zap } from 'lucide-react';
import { ABILITIES, IdolCard, ROLES } from '../game/data';
import { getCardStats } from '../game/rules';
import { prefetchIdolBatch } from '../utils/imageResolver';
import { sound } from '../utils/sound';
import { Photocard3D } from './Photocard3D';

interface StarterMythicDraftModalProps {
  draftCards: IdolCard[];
  onConfirmSelect: (card: IdolCard) => void;
}

export const StarterMythicDraftModal: React.FC<StarterMythicDraftModalProps> = ({
  draftCards,
  onConfirmSelect,
}) => {
  const [revealedIds, setRevealedIds] = useState<Record<number, boolean>>({});
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isRevealingAll, setIsRevealingAll] = useState(false);

  // Immediately prefetch all 5 Mythic selca portraits in HD
  useEffect(() => {
    if (draftCards.length > 0) {
      prefetchIdolBatch(draftCards);
    }
  }, [draftCards]);

  const revealedCount = draftCards.filter((c) => revealedIds[c.id]).length;
  const allRevealed = revealedCount === draftCards.length && draftCards.length > 0;
  const selectedCard =
    draftCards.find((c) => c.id === selectedCardId) ||
    (allRevealed ? draftCards[0] : null);

  const handleFlipCard = (card: IdolCard) => {
    if (!revealedIds[card.id]) {
      if (card.rarity === 5) {
        sound.playVictory();
      } else {
        sound.playCardReveal(4);
      }
      setRevealedIds((prev) => ({ ...prev, [card.id]: true }));
      setSelectedCardId(card.id);
    } else {
      sound.playClick();
      setSelectedCardId(card.id);
    }
  };

  const handleRevealAll = () => {
    if (isRevealingAll || allRevealed) return;
    setIsRevealingAll(true);
    sound.playPackSlice();

    draftCards.forEach((card, idx) => {
      setTimeout(() => {
        if (card.rarity === 5) {
          sound.playVictory();
        } else {
          sound.playCardReveal(4);
        }
        setRevealedIds((prev) => ({ ...prev, [card.id]: true }));
        if (idx === 0 && selectedCardId === null) {
          setSelectedCardId(card.id);
        }
        if (idx === draftCards.length - 1) {
          setIsRevealingAll(false);
        }
      }, idx * 140);
    });
  };

  const selectedStats = selectedCard ? getCardStats(selectedCard, 1, 0, 0, 0) : null;
  const selectedRole = selectedCard ? ROLES[selectedCard.role] || ROLES[0] : null;
  const selectedAbility = selectedCard ? ABILITIES[selectedCard.abilityId] : null;

  return (
    <div
      data-testid="starter-mythic-draft-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto pointer-events-auto bg-[#050814]/92 backdrop-blur-xl select-none"
    >
      {/* Ambient Aurora Glow behind Draft Stage */}
      <div
        className="pointer-events-none fixed inset-0 opacity-65"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(255,79,163,0.22) 0%, transparent 45%), radial-gradient(circle at 80% 25%, rgba(56,189,248,0.22) 0%, transparent 48%), radial-gradient(circle at 50% 80%, rgba(251,191,36,0.18) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[1260px] rounded-3xl bg-[#0B1022]/95 border border-white/15 shadow-[0_28px_90px_rgba(0,0,0,0.85)] p-4 sm:p-6 flex flex-col gap-4">
        {/* Top Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/35 text-amber-300 text-[11px] font-display font-bold tracking-wider uppercase">
              <Crown className="w-3.5 h-3.5" />
              <span>Producer Debut Draft · Peluang Jackpot 🌈 EXOTIC</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-extrabold text-white tracking-tight mt-1">
              Pilih 1 dari 5 Kartu Starter Pertamamu
            </h1>
            <p className="text-xs sm:text-sm font-sans text-slate-300 mt-0.5">
              Buka kelima kartu misteri di bawah, lalu pilih <strong>1 Center Bias Mythic / 🌈 EXOTIC</strong> untuk memulai agensimu bersama <strong>+1 Tiket Pack Gratis</strong>!
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-2xl bg-white/[0.05] border border-white/12 flex items-center gap-2 text-xs font-sans text-slate-200">
              <Ticket className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Bonus Debut</div>
                <div className="font-mono font-bold text-sky-300">+1 Pack Gratis & 680 Koin</div>
              </div>
            </div>

            {!allRevealed && (
              <button
                type="button"
                data-testid="starter-draft-reveal-all-btn"
                onClick={handleRevealAll}
                disabled={isRevealingAll}
                className="min-h-[42px] px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 via-[#FF4FA3] to-sky-400 hover:brightness-110 text-slate-950 font-display font-extrabold text-xs sm:text-sm shadow-[0_0_24px_rgba(251,191,36,0.45)] flex items-center gap-2 transition-all cursor-pointer"
              >
                <Wand2 className="w-4 h-4" />
                <span>Buka Semua 5 Kartu</span>
              </button>
            )}
          </div>
        </div>

        {/* 5-in-a-Row Mythic Draft Stage (Zero Horizontal Clipping) */}
        <div
          data-testid="starter-draft-5col-grid"
          className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 justify-items-center py-2"
        >
          {draftCards.map((card, idx) => {
            const isRevealed = Boolean(revealedIds[card.id]);
            const isChosen = selectedCard?.id === card.id && isRevealed;
            const isExotic = card.rarity === 5;
            const cStats = getCardStats(card, 1, 0, 0, 0, card.rarity);
            const rMeta = ROLES[card.role] || ROLES[0];

            return (
              <div
                key={card.id}
                data-testid={`starter-draft-slot-${idx}`}
                className={`w-full flex flex-col items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 ${
                  isChosen
                    ? isExotic
                      ? 'bg-gradient-to-b from-sky-400/25 via-[#FF4FA3]/20 to-[#0B1022] border-cyan-300 shadow-[0_0_35px_rgba(56,189,248,0.55)] ring-2 ring-cyan-300'
                      : 'bg-gradient-to-b from-amber-400/20 via-[#151D3B] to-[#0B1022] border-amber-300 shadow-[0_0_28px_rgba(251,191,36,0.35)]'
                    : isRevealed
                    ? isExotic
                      ? 'bg-[#121933]/90 border-cyan-400/50 shadow-[0_0_18px_rgba(56,189,248,0.35)]'
                      : 'bg-[#121933]/90 border-white/15 hover:border-sky-400/50'
                    : isExotic
                    ? 'bg-[#0E1428]/90 border-cyan-400/60 shadow-[0_0_14px_rgba(56,189,248,0.25)]'
                    : 'bg-[#0E1428]/90 border-amber-400/30 hover:border-amber-300/65'
                }`}
              >
                {/* Slot Header */}
                <div className="w-full flex items-center justify-between text-[11px] font-mono mb-2 px-1">
                  <span
                    className={
                      isExotic
                        ? 'bg-gradient-to-r from-cyan-300 via-pink-400 to-amber-300 bg-clip-text text-transparent font-black animate-pulse'
                        : 'text-amber-300 font-bold'
                    }
                  >
                    {isExotic ? `🌈 EXOTIC #${idx + 1}` : `MYTHIC #${idx + 1}`}
                  </span>
                  {isRevealed ? (
                    <span className="text-sky-300 font-bold tabular-nums">
                      PWR {cStats.power.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-sans">Tertutup</span>
                  )}
                </div>

                {/* Card Back or Flipped 3D Mythic/Exotic Photocard */}
                {!isRevealed ? (
                  <button
                    type="button"
                    data-testid={`starter-flip-btn-${idx}`}
                    onClick={() => handleFlipCard(card)}
                    className={`group relative w-36 h-52 sm:w-44 sm:h-64 rounded-[18px] border-2 ${
                      isExotic ? 'border-cyan-300/80' : 'border-amber-300/60'
                    } bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#3B0764] shadow-[0_10px_30px_rgba(0,0,0,0.65)] flex flex-col items-center justify-center p-4 text-center overflow-hidden transition-transform duration-300 hover:-translate-y-1 cursor-pointer`}
                  >
                    {/* Holographic Aurora Sheen on Card Back */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-40 group-hover:opacity-75 transition-opacity"
                      style={{
                        background: isExotic
                          ? 'conic-gradient(from 0deg at 50% 50%, rgba(56,189,248,0.4), rgba(255,79,163,0.4), rgba(251,191,36,0.4), rgba(56,189,248,0.4))'
                          : 'linear-gradient(135deg, rgba(251,191,36,0.35) 0%, rgba(255,79,163,0.35) 50%, rgba(56,189,248,0.35) 100%)',
                      }}
                    />
                    <div
                      className={`pointer-events-none absolute inset-2 rounded-[13px] border ${
                        isExotic ? 'border-cyan-300/50' : 'border-amber-300/35'
                      }`}
                    />
                    <div
                      className={`relative z-10 w-12 h-12 rounded-2xl ${
                        isExotic
                          ? 'bg-gradient-to-tr from-cyan-400/25 to-pink-400/25 border border-cyan-300/60 text-cyan-300'
                          : 'bg-amber-400/20 border border-amber-300/50 text-amber-300'
                      } flex items-center justify-center mb-2.5 shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      {isExotic ? <Sparkles className="w-6 h-6 animate-spin" /> : <Crown className="w-6 h-6" />}
                    </div>
                    <div
                      className={`relative z-10 text-xs font-display font-black tracking-wider uppercase ${
                        isExotic
                          ? 'bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent'
                          : 'text-amber-200'
                      }`}
                    >
                      {isExotic ? '🌈 EXOTIC CHANCE' : 'CROWN EX'}
                    </div>
                    <div className="relative z-10 text-[11px] font-sans text-slate-300 mt-1">
                      Klik untuk Buka Kartu
                    </div>
                  </button>
                ) : (
                  <div className="animate-[fadeIn_0.28s_ease-out]">
                    <Photocard3D
                      card={card}
                      level={1}
                      awakeningStars={0}
                      effectiveRarity={card.rarity}
                      size="sm"
                      isSelected={isChosen}
                      isBias={false}
                      decoFrame={isExotic ? 'starlight' : 'crown'}
                      onClick={() => handleFlipCard(card)}
                    />
                  </div>
                )}

                {/* Bottom Select Button inside Slot */}
                <div className="w-full mt-2.5">
                  {!isRevealed ? (
                    <button
                      type="button"
                      onClick={() => handleFlipCard(card)}
                      className="w-full min-h-[34px] py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-300/40 text-xs font-display font-bold text-amber-200 transition-colors cursor-pointer"
                    >
                      ✨ Buka Kartu
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid={`starter-choose-card-${idx}`}
                      onClick={() => {
                        sound.playClick();
                        setSelectedCardId(card.id);
                      }}
                      className={`w-full min-h-[34px] py-1.5 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
                        isChosen
                          ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                      }`}
                    >
                      {isChosen ? '✓ Dipilih' : `${rMeta.icon} Pilih ${card.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Selected Idol Confirmation Bar */}
        <div className="rounded-2xl bg-[#121936]/95 border border-white/15 p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {selectedCard && selectedStats && selectedRole ? (
            <div className="flex flex-wrap items-center gap-3 text-left">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-amber-300 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-sans text-amber-300 font-semibold">
                  Pilihan Center Bias Debutmu:
                </div>
                <div className="text-base sm:text-lg font-display font-extrabold text-white">
                  {selectedCard.name} <span className="text-sky-300">({selectedCard.group})</span> ·{' '}
                  <span className="text-xs font-mono text-amber-300">
                    {selectedRole.icon} {selectedRole.name} · PWR {selectedStats.power.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs font-sans text-slate-300">
                  Signature Skill:{' '}
                  <strong className="text-white">
                    {selectedAbility ? selectedAbility.name : selectedRole.name}
                  </strong>{' '}
                  — {selectedAbility?.desc}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-sans text-slate-300">
              Buka minimal 1 kartu Mythic di atas untuk memilih Center Bias pertamamu!
            </div>
          )}

          <button
            type="button"
            data-testid="starter-confirm-debut-btn"
            disabled={!selectedCard}
            onClick={() => {
              if (!selectedCard) return;
              sound.playVictory();
              onConfirmSelect(selectedCard);
            }}
            className={`min-h-[46px] px-6 py-2.5 rounded-2xl font-display font-extrabold text-sm flex items-center gap-2 transition-all shrink-0 ${
              selectedCard
                ? 'bg-gradient-to-r from-amber-400 via-[#FF4FA3] to-sky-400 hover:brightness-110 text-slate-950 shadow-[0_0_28px_rgba(255,79,163,0.5)] cursor-pointer'
                : 'bg-white/10 text-slate-500 border border-white/10 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>
              {selectedCard
                ? `Mulai Debut Bersama ${selectedCard.name} (+1 Pack Gratis)`
                : 'Buka & Pilih 1 Kartu Mythic Dulu'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

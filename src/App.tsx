import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckSquare,
  Coins,
  Compass,
  Gem,
  Home,
  Layers,
  PackageOpen,
  Pause,
  Sparkles,
  Ticket,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ALL_CARDS,
  BOOSTER_BANNERS,
  BoosterPackBanner,
  CAREER_MILESTONES,
  DAILY_QUESTS,
  IdolCard,
  QuestDef,
} from './game/data';
import {
  AgencyScheduleDef,
  calculateUnitSynergy,
  claimDailyBonusCoins,
  claimDailyFanChat,
  claimDailyTowerPatrol,
  claimGroupDexReward,
  createInitialSaveState,
  DecoFrameId,
  executeAgencySchedule,
  executeBannerPull,
  executeCardGrading,
  executeWonderPick,
  generateWonderPickBoards,
  getAwakenDuplicateRequirement,
  getCardGradeInfo,
  getCardStats,
  getGroupDexList,
  getUpgradeCost,
  PullOutcomeItem,
  refreshWonderPickBoardsPaid,
  SaveState,
  WonderPickBoard,
} from './game/rules';
import {
  prefetchIdolBatch,
  syncServerImageCache,
} from './utils/imageResolver';
import { sound } from './utils/sound';
import { BattleArenaModal, BattleResultPayload } from './components/BattleArenaModal';
import { BinderDeckView } from './components/BinderDeckView';
import { CardInspectorModal } from './components/CardInspectorModal';
import { GroupDexModal } from './components/GroupDexModal';
import { HomeView } from './components/HomeView';
import { PackRipView } from './components/PackRipView';
import { QuestsModal } from './components/QuestsModal';
import { ThreeStage, StageSceneMode, BattleCameraPhase } from './components/ThreeStage';
import { TitleScreen } from './components/TitleScreen';
import { WonderPickView } from './components/WonderPickView';
import { WorldTourView } from './components/WorldTourView';

const SAVE_STORAGE_KEY = 'idol_pocket_3d_save_v1';

function loadSaveState(): SaveState {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveState>;
      const base = createInitialSaveState();
      const merged: SaveState = {
        ...base,
        ...parsed,
        inv: { ...base.inv, ...(parsed.inv || {}) },
        lv: { ...base.lv, ...(parsed.lv || {}) },
        stars: { ...base.stars, ...(parsed.stars || {}) },
        biasBondXp: { ...base.biasBondXp, ...(parsed.biasBondXp || {}) },
        cardDeco: { ...base.cardDeco, ...(parsed.cardDeco || {}) },
        cardGrades: { ...base.cardGrades, ...(parsed.cardGrades || {}) },
        cardGradeAttempts: { ...base.cardGradeAttempts, ...(parsed.cardGradeAttempts || {}) },
        diamonds: typeof parsed.diamonds === 'number' ? parsed.diamonds : base.diamonds,
        deck: Array.isArray(parsed.deck) && parsed.deck.length > 0 ? parsed.deck : base.deck,
        dailyCounts: { ...base.dailyCounts, ...(parsed.dailyCounts || {}) },
        dailyClaimed: { ...(parsed.dailyClaimed || {}) },
        milestoneCounts: { ...base.milestoneCounts, ...(parsed.milestoneCounts || {}) },
        milestoneClaimed: { ...(parsed.milestoneClaimed || {}) },
        claimedGroupDex: { ...(parsed.claimedGroupDex || {}) },
        agencyScheduleClaimed: { ...(parsed.agencyScheduleClaimed || {}) },
        agencyScheduleAssigned: { ...(parsed.agencyScheduleAssigned || {}) },
      };

      // Check daily reset
      const today = new Date().toDateString();
      if (merged.dailyDate !== today) {
        merged.dailyDate = today;
        merged.dailyBonusClaimed = false;
        merged.wonderPickFreeUsedToday = false;
        merged.wonderPickDailyCount = 0;
        merged.dailyCounts = { roll: 0, win: 0, upgrade: 0, ultimate: 0, pack5: 0 };
        merged.dailyClaimed = {};
        merged.agencyScheduleClaimed = {};
        merged.agencyScheduleAssigned = {};
        merged.coins += 120; // Daily Login Bonus
      }
      return merged;
    }
  } catch {
    // ignore
  }
  return createInitialSaveState();
}

export default function App() {
  const [saveState, setSaveState] = useState<SaveState>(() => loadSaveState());
  const [shellState, setShellState] = useState<'title' | 'playing' | 'paused' | 'gameover'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('title') === '1') return 'title';
    }
    return 'playing';
  });

  const [activeTab, setActiveTab] = useState<'home' | 'pack' | 'wonder' | 'binder' | 'tour' | 'quests'>('home');
  const [activeBanner, setActiveBanner] = useState<BoosterPackBanner>(BOOSTER_BANNERS[0]);
  const [packRipState, setPackRipState] = useState<'idle' | 'ripping' | 'opened'>('idle');
  const [pulledItems, setPulledItems] = useState<PullOutcomeItem[]>([]);
  const [wonderBoards, setWonderBoards] = useState<WonderPickBoard[]>(() =>
    generateWonderPickBoards(Date.now())
  );
  const [inspectedCard, setInspectedCard] = useState<IdolCard | null>(null);
  const [groupDexOpen, setGroupDexOpen] = useState<boolean>(false);
  const [activeBattleStage, setActiveBattleStage] = useState<number | null>(null);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [cameraTrauma, setCameraTrauma] = useState<number>(0);
  const [battleCameraPhase, setBattleCameraPhase] = useState<BattleCameraPhase>('idle');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Persist SaveState
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveState));
    } catch {
      // ignore
    }
  }, [saveState]);

  // Sync document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  // Decay camera trauma smoothly
  useEffect(() => {
    if (cameraTrauma <= 0) return;
    const id = setInterval(() => {
      setCameraTrauma((prev) => (prev <= 0.05 ? 0 : Number((prev * 0.78).toFixed(2))));
    }, 50);
    return () => clearInterval(id);
  }, [cameraTrauma]);

  // Initial image cache sync & starter card prefetch
  useEffect(() => {
    syncServerImageCache().then(() => {
      const deckCards = saveState.deck.map((id) => ALL_CARDS[id]).filter(Boolean);
      const featured = ALL_CARDS.slice(0, 10);
      prefetchIdolBatch([...deckCards, ...featured]);
    });
  }, []);

  // Global keyboard shortcuts (1-5 tabs, P/Esc Pause, M Mute, H Hide HUD)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }

      if (e.code === 'KeyM') {
        setMuted((m) => {
          sound.muted = !m;
          return !m;
        });
      } else if (e.code === 'KeyH' && shellState === 'playing') {
        setHudCollapsed((c) => !c);
      } else if ((e.code === 'KeyP' || e.code === 'Escape') && activeBattleStage === null) {
        if (inspectedCard) {
          setInspectedCard(null);
          return;
        }
        if (groupDexOpen) {
          setGroupDexOpen(false);
          return;
        }
        setShellState((s) => (s === 'playing' ? 'paused' : s === 'paused' ? 'playing' : s));
      } else if (shellState === 'playing' && activeBattleStage === null) {
        if (e.code === 'Digit1') setActiveTab('home');
        if (e.code === 'Digit2') setActiveTab('pack');
        if (e.code === 'Digit3') setActiveTab('wonder');
        if (e.code === 'Digit4') setActiveTab('binder');
        if (e.code === 'Digit5') setActiveTab('tour');
        if (e.code === 'Digit6') setActiveTab('quests');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shellState, activeBattleStage, inspectedCard, groupDexOpen]);

  const handleStartGame = useCallback(() => {
    sound.playClick();
    setShellState('playing');
    setActiveTab('home');
  }, []);

  const handleTriggerPull = useCallback(
    (count: 1 | 5 | 10) => {
      if (packRipState === 'ripping') return;

      const nextState: SaveState = {
        ...saveState,
        inv: { ...saveState.inv },
        lv: { ...saveState.lv },
        stars: { ...saveState.stars },
        biasBondXp: { ...saveState.biasBondXp },
        cardDeco: { ...saveState.cardDeco },
        deck: [...saveState.deck],
        dailyCounts: { ...saveState.dailyCounts },
        milestoneCounts: { ...saveState.milestoneCounts },
      };

      const outcome = executeBannerPull(nextState, activeBanner.id, count);
      if (!outcome.ok) {
        showToast(outcome.reason || 'Koin tidak cukup!');
        return;
      }

      sound.playPackSlice();
      setPackRipState('ripping');
      setCameraTrauma(0.6);

      // Prefetch pulled idol selca photos immediately
      prefetchIdolBatch(outcome.items.map((x) => x.card));

      setTimeout(() => {
        setSaveState(nextState);
        setPulledItems(outcome.items);
        setPackRipState('opened');
        sound.playCardReveal(outcome.highestRarity);
        if (outcome.fateTriggeredCount > 0 && nextState.focusGroup) {
          showToast(
            `Fate Point Pity 15/15 Aktif! Member ${nextState.focusGroup} berhasil didapatkan!`
          );
        } else if (outcome.totalDuplicateCoins > 0) {
          showToast(`Kartu duplikat dikonversi menjadi +${outcome.totalDuplicateCoins} Koin!`);
        }
      }, 480);
    },
    [packRipState, saveState, activeBanner.id, showToast]
  );

  const handleRefreshWonderBoards = useCallback(() => {
    const nextState: SaveState = { ...saveState };
    const res = refreshWonderPickBoardsPaid(nextState, Date.now());
    if (!res.ok) {
      showToast(res.reason || 'Koin tidak cukup untuk mengacak etalase!');
      return;
    }
    setSaveState(nextState);
    setWonderBoards(res.boards);
    const hasMythic = res.boards.some((b) => b.isMythicTable);
    showToast(
      hasMythic
        ? `JACKPOT! Meja All-Star Daesang (Mythic EX) muncul di etalase! (-${res.costPaid} Koin)`
        : `Etalase Wonder Pick diacak ulang (-${res.costPaid} Koin).`
    );
  }, [saveState, showToast]);

  const handleExecuteWonderPick = useCallback(
    (board: WonderPickBoard, slotIndex: number) => {
      const nextState: SaveState = {
        ...saveState,
        inv: { ...saveState.inv },
        lv: { ...saveState.lv },
        stars: { ...saveState.stars },
        biasBondXp: { ...saveState.biasBondXp },
        cardDeco: { ...saveState.cardDeco },
        deck: [...saveState.deck],
        dailyCounts: { ...saveState.dailyCounts },
        milestoneCounts: { ...saveState.milestoneCounts },
      };

      const res = executeWonderPick(nextState, board, slotIndex);
      if (!res.ok) {
        showToast(res.reason || 'Koin atau kuota harian tidak cukup untuk Wonder Pick!');
        return res;
      }

      setSaveState(nextState);
      setCameraTrauma(0.45);
      if (res.pickedItem) {
        showToast(
          `Wonder Pick: Dapat ${res.pickedItem.card.name} (${res.pickedItem.card.group})${
            res.pickedItem.duplicateCoins > 0 ? ` +${res.pickedItem.duplicateCoins} Koin` : '!'
          }`
        );
      }
      return res;
    },
    [saveState, showToast]
  );

  const handleSetBias = useCallback(
    (cardId: number) => {
      const card = ALL_CARDS[cardId];
      if (!card) return;
      sound.playCardReveal(3);
      setSaveState((prev) => ({
        ...prev,
        biasCardId: cardId,
        biasBondXp: {
          ...prev.biasBondXp,
          [cardId]: Math.max(20, prev.biasBondXp?.[cardId] || 0),
        },
      }));
      showToast(`💖 ${card.name} (${card.group}) ditetapkan sebagai Center Bias!`);
    },
    [showToast]
  );

  const handleSetDecoFrame = useCallback(
    (cardId: number, deco: DecoFrameId) => {
      sound.playClick();
      setSaveState((prev) => ({
        ...prev,
        cardDeco: {
          ...prev.cardDeco,
          [cardId]: deco,
        },
      }));
      showToast('Bingkai Polco Deco Top-Loader diperbarui!');
    },
    [showToast]
  );

  const handleUpgradeCard = useCallback(
    (cardId: number) => {
      const card = ALL_CARDS[cardId];
      if (!card) return;
      const curLv = saveState.lv[cardId] || 1;
      if (curLv >= 15) return;
      const cost = getUpgradeCost(card, curLv);
      if (saveState.coins < cost) {
        showToast('Star Coins tidak cukup untuk latihan level!');
        return;
      }

      sound.playCardReveal(2);
      setSaveState((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        xp: prev.xp + 25,
        lv: { ...prev.lv, [cardId]: curLv + 1 },
        biasBondXp: {
          ...prev.biasBondXp,
          [cardId]: (prev.biasBondXp?.[cardId] || 0) + 20,
        },
        dailyCounts: {
          ...prev.dailyCounts,
          upgrade: (prev.dailyCounts.upgrade || 0) + 1,
        },
        milestoneCounts: {
          ...prev.milestoneCounts,
          upgrade: (prev.milestoneCounts.upgrade || 0) + 1,
        },
      }));
      showToast(`${card.name} naik ke Level ${curLv + 1} (+20 Bond XP)!`);
    },
    [saveState, showToast]
  );

  const handleAwakenCard = useCallback(
    (cardId: number) => {
      const card = ALL_CARDS[cardId];
      if (!card) return;
      const curStars = saveState.stars[cardId] || 0;
      const copies = saveState.inv[cardId] || 0;
      const req = getAwakenDuplicateRequirement(curStars);
      if (curStars >= 5 || copies < req) {
        showToast(`Butuh minimal ${req} salinan kartu untuk Awaken bintang berikutnya!`);
        return;
      }

      sound.playUltimate();
      setSaveState((prev) => ({
        ...prev,
        xp: prev.xp + 60,
        stars: { ...prev.stars, [cardId]: curStars + 1 },
        biasBondXp: {
          ...prev.biasBondXp,
          [cardId]: (prev.biasBondXp?.[cardId] || 0) + 45,
        },
      }));
      showToast(`✨ ${card.name} Awaken ke ★${curStars + 1} (+45 Bond XP)!`);
    },
    [saveState, showToast]
  );

  const handleGradeCard = useCallback(
    (cardId: number) => {
      const card = ALL_CARDS[cardId];
      if (!card) return;

      const nextState: SaveState = {
        ...saveState,
        cardGrades: { ...(saveState.cardGrades || {}) },
        cardGradeAttempts: { ...(saveState.cardGradeAttempts || {}) },
        biasBondXp: { ...saveState.biasBondXp },
        dailyCounts: { ...saveState.dailyCounts },
        milestoneCounts: { ...saveState.milestoneCounts },
      };

      const res = executeCardGrading(nextState, cardId);
      if (!res.ok) {
        showToast(res.reason || 'Star Diamonds atau Star Coins tidak cukup untuk PSA Grading!');
        return;
      }

      const gradeMeta = getCardGradeInfo(res.finalGrade);
      if (res.finalGrade === 10) {
        sound.playUltimate();
        setCameraTrauma(0.65);
      } else if (res.isUpgrade) {
        sound.playCardReveal(3);
      } else {
        sound.playCardReveal(2);
      }

      setSaveState(nextState);
      if (res.finalGrade === 10) {
        showToast(
          `🏆 JACKPOT! ${card.name} lulus sertifikasi PSA 10 BLACK LABEL (+28% All-Stat)${
            res.triggeredPity ? ' via Polish Pity 8/8!' : '!'
          }`
        );
      } else if (res.isUpgrade) {
        showToast(`💎 PSA Grading Naik! ${card.name} meraih ${gradeMeta.fullLabel}!`);
      } else {
        const rolledMeta = getCardGradeInfo(res.rolledGrade);
        showToast(
          `Hasil Polish: ${rolledMeta.shortLabel} — Skor Terbaik ${gradeMeta.shortLabel} tetap terjaga (Pity ${res.attemptsUsed}/8)`
        );
      }
    },
    [saveState, showToast]
  );

  const handleToggleDeckCard = useCallback(
    (cardId: number) => {
      if (cardId < 0) {
        showToast('Sobek Booster Pack atau mainkan Wonder Pick untuk merekrut Idol ini!');
        return;
      }
      sound.playClick();
      setSaveState((prev) => {
        const exists = prev.deck.includes(cardId);
        if (exists) {
          if (prev.deck.length <= 1) {
            showToast('Minimal harus ada 1 Idol di dalam Stage Unit!');
            return prev;
          }
          return { ...prev, deck: prev.deck.filter((id) => id !== cardId) };
        } else {
          if (prev.deck.length >= 5) {
            showToast('Stage Unit penuh (Maksimal 5 Idol). Lepas 1 kartu terlebih dahulu.');
            return prev;
          }
          return { ...prev, deck: [...prev.deck, cardId] };
        }
      });
    },
    [showToast]
  );

  const handleAutoBestDeck = useCallback(() => {
    sound.playCardReveal(3);
    setSaveState((prev) => {
      const ownedIds = Object.keys(prev.inv).map(Number);
      ownedIds.sort((a, b) => {
        const cA = ALL_CARDS[a];
        const cB = ALL_CARDS[b];
        const pA = getCardStats(
          cA,
          prev.lv[a] || 1,
          prev.stars[a] || 0,
          0,
          prev.cardGrades?.[a] || 0
        ).power;
        const pB = getCardStats(
          cB,
          prev.lv[b] || 1,
          prev.stars[b] || 0,
          0,
          prev.cardGrades?.[b] || 0
        ).power;
        return pB - pA;
      });
      const best5 = ownedIds.slice(0, 5);
      return { ...prev, deck: best5 };
    });
    showToast('Stage Unit otomatis disusun dengan 5 Idol terkuat!');
  }, [showToast]);

  const handleBattleFinished = useCallback((result: BattleResultPayload) => {
    setShellState('gameover');
    setSaveState((prev) => {
      const isTower = result.stageIndex >= 1000;
      const towerFloorCleared = isTower ? result.stageIndex - 1000 : 0;

      const nextStageProg =
        !isTower && result.won && result.stageIndex === prev.prog
          ? Math.min(89, prev.prog + 1)
          : prev.prog;
      const nextTowerFloor =
        isTower && result.won
          ? Math.max(prev.towerFloor || 1, towerFloorCleared + 1)
          : prev.towerFloor || 1;
      const prevBestStars = prev.stageStars[result.stageIndex] || 0;

      // Award Affinity Bond XP to all active deck cards (+30 for Center Bias, +15 for unit members)
      const nextBondXp = { ...prev.biasBondXp };
      prev.deck.forEach((cid) => {
        const gain = cid === prev.biasCardId ? 30 : 15;
        nextBondXp[cid] = (nextBondXp[cid] || 0) + gain;
      });

      return {
        ...prev,
        coins: prev.coins + result.coinsEarned,
        diamonds: (prev.diamonds || 0) + (result.diamondsEarned || 0),
        xp: prev.xp + result.xpEarned,
        freePacks: prev.freePacks + (result.bonusPackGranted ? 1 : 0),
        prog: nextStageProg,
        towerFloor: nextTowerFloor,
        totalWins: prev.totalWins + (result.won ? 1 : 0),
        biasBondXp: nextBondXp,
        stageStars:
          !isTower && result.won
            ? {
                ...prev.stageStars,
                [result.stageIndex]: Math.max(prevBestStars, result.stars),
              }
            : prev.stageStars,
        dailyCounts: {
          ...prev.dailyCounts,
          win: (prev.dailyCounts.win || 0) + (result.won ? 1 : 0),
          ultimate: (prev.dailyCounts.ultimate || 0) + result.ultimatesUsed,
        },
        milestoneCounts: {
          ...prev.milestoneCounts,
          win: (prev.milestoneCounts.win || 0) + (result.won ? 1 : 0),
          ultimate: (prev.milestoneCounts.ultimate || 0) + result.ultimatesUsed,
        },
      };
    });
  }, []);

  const handleClaimTowerPatrol = useCallback(() => {
    const nextState: SaveState = {
      ...saveState,
      biasBondXp: { ...saveState.biasBondXp },
    };
    const res = claimDailyTowerPatrol(nextState);
    if (!res.ok) {
      showToast(res.reason || 'Patroli harian sudah diklaim!');
      return;
    }
    sound.playVictory();
    setSaveState(nextState);
    showToast(
      `Patroli Queendom Tower diklaim! +${res.coinsGranted} Koin, +${res.bondXpGranted} Bond XP${
        res.freePacksGranted > 0 ? ' & +1 Tiket Pack ×5!' : ''
      }`
    );
  }, [saveState, showToast]);

  const handleDispatchAgencySchedule = useCallback(
    (scheduleId: AgencyScheduleDef['id']) => {
      const nextState: SaveState = {
        ...saveState,
        agencyScheduleClaimed: { ...(saveState.agencyScheduleClaimed || {}) },
        agencyScheduleAssigned: { ...(saveState.agencyScheduleAssigned || {}) },
        biasBondXp: { ...saveState.biasBondXp },
      };

      const res = executeAgencySchedule(nextState, scheduleId);
      if (!res.ok) {
        showToast(res.reason || 'Syarat jadwal agensi belum terpenuhi!');
        return;
      }

      sound.playVictory();
      setSaveState(nextState);
      showToast(
        `📅 Jadwal Agensi Selesai! +${res.coinsGranted} 🪙, +${res.diamondsGranted} 💎 & +${res.bondXpGranted} Bond XP!`
      );
    },
    [saveState, showToast]
  );

  const handleClaimQuest = useCallback(
    (quest: QuestDef) => {
      sound.playVictory();
      const dReward = quest.rewardDiamonds || 0;
      setSaveState((prev) => {
        if (quest.isMilestone) {
          if (prev.milestoneClaimed[quest.id]) return prev;
          return {
            ...prev,
            coins: prev.coins + quest.rewardCoins,
            diamonds: (prev.diamonds || 0) + dReward,
            xp: prev.xp + quest.rewardXp,
            milestoneClaimed: { ...prev.milestoneClaimed, [quest.id]: true },
          };
        } else {
          if (prev.dailyClaimed[quest.id]) return prev;
          return {
            ...prev,
            coins: prev.coins + quest.rewardCoins,
            diamonds: (prev.diamonds || 0) + dReward,
            xp: prev.xp + quest.rewardXp,
            dailyClaimed: { ...prev.dailyClaimed, [quest.id]: true },
          };
        }
      });
      showToast(
        `Misi "${quest.title}" selesai! +${quest.rewardCoins} 🪙${
          dReward > 0 ? ` & +${dReward} 💎` : ''
        }`
      );
    },
    [showToast]
  );

  const handleClaimDailyBonusCoins = useCallback(() => {
    if (saveState.dailyBonusClaimed) {
      showToast('Bonus Koin Harian sudah diklaim hari ini! Kembali lagi besok.');
      return;
    }
    const nextState: SaveState = { ...saveState };
    const res = claimDailyBonusCoins(nextState);
    if (!res.ok) {
      showToast(res.reason || 'Bonus Koin Harian sudah diklaim hari ini!');
      return;
    }
    sound.playCardReveal(3);
    setSaveState(nextState);
    showToast(`Bonus Koin Harian diklaim: +${res.coinsGranted} Koin!`);
  }, [saveState, showToast]);

  const handleReplyFanChat = useCallback(
    (replyIndex: number) => {
      const nextState: SaveState = {
        ...saveState,
        biasBondXp: { ...saveState.biasBondXp },
      };
      const res = claimDailyFanChat(nextState, replyIndex);
      if (!res.ok) {
        showToast(res.reason || 'Pesan harian sudah dibalas hari ini!');
        return;
      }
      sound.playCardReveal(3);
      setSaveState(nextState);
      showToast(`Balasan terkirim! +${res.coinsGranted} Koin & +${res.bondXpGranted} Bond XP`);
    },
    [saveState, showToast]
  );

  const handleClaimGroupDexReward = useCallback(
    (groupName: string) => {
      const nextState: SaveState = {
        ...saveState,
        claimedGroupDex: { ...(saveState.claimedGroupDex || {}) },
        biasBondXp: { ...saveState.biasBondXp },
      };
      const res = claimGroupDexReward(nextState, groupName);
      if (!res.ok) {
        showToast(res.reason || 'Koleksi grup belum lengkap!');
        return;
      }
      sound.playVictory();
      setSaveState(nextState);
      showToast(
        `Photobook Dex ${groupName} Selesai! +${res.coinsGranted} 🪙, +${res.diamondsGranted} 💎 & +${res.bondXpGranted} Bond XP`
      );
    },
    [saveState, showToast]
  );

  const handleSelectFocusGroup = useCallback(
    (groupName: string | null) => {
      sound.playClick();
      setSaveState((prev) => ({
        ...prev,
        focusGroup: groupName,
      }));
      if (groupName) {
        showToast(`Pinpoint Rate-Up aktif: ${groupName} (18% Peluang + Fate Pity 15 Tarikan)`);
      } else {
        showToast('Rate-Up dikembalikan ke Semua Grup Featured.');
      }
    },
    [showToast]
  );

  const handleJumpToPackWithFocus = useCallback(
    (groupName: string | null, bannerId?: string) => {
      sound.playClick();
      if (bannerId) {
        const found = BOOSTER_BANNERS.find((b) => b.id === bannerId);
        if (found) setActiveBanner(found);
      }
      setSaveState((prev) => ({
        ...prev,
        focusGroup: groupName,
      }));
      setGroupDexOpen(false);
      setPackRipState('idle');
      setActiveTab('pack');
      if (groupName) {
        showToast(`Target Pack 3D diatur ke ${groupName}!`);
      }
    },
    [showToast]
  );

  const claimableQuestCount = useMemo(() => {
    const uniqueOwned = Object.keys(saveState.inv).length;
    let readyCount = saveState.dailyBonusClaimed ? 0 : 1;
    DAILY_QUESTS.forEach((q) => {
      const p = q.type === 'collect' ? uniqueOwned : saveState.dailyCounts[q.type] || 0;
      if (p >= q.target && !saveState.dailyClaimed[q.id]) readyCount++;
    });
    CAREER_MILESTONES.forEach((q) => {
      const p = q.type === 'collect' ? uniqueOwned : saveState.milestoneCounts[q.type] || 0;
      if (p >= q.target && !saveState.milestoneClaimed[q.id]) readyCount++;
    });
    return readyCount;
  }, [saveState]);

  const claimableDexCount = useMemo(() => {
    return getGroupDexList(saveState).filter((g) => g.isComplete && !g.isClaimed).length;
  }, [saveState]);

  const activeUnitSynergy = useMemo(() => {
    const deckCards = saveState.deck.map((id) => ALL_CARDS[id]).filter(Boolean);
    return calculateUnitSynergy(deckCards, saveState.biasCardId, saveState.biasBondXp);
  }, [saveState.deck, saveState.biasCardId, saveState.biasBondXp]);

  const threeMode: StageSceneMode =
    shellState === 'title'
      ? 'title'
      : activeBattleStage !== null
      ? 'battle'
      : activeTab === 'pack'
      ? 'pack'
      : activeTab === 'home' || activeTab === 'binder' || activeTab === 'wonder'
      ? 'binder'
      : 'tour';

  const producerLevel = Math.floor(saveState.xp / 200) + 1;
  const centerBiasCard =
    (saveState.biasCardId != null ? ALL_CARDS[saveState.biasCardId] : null) ||
    ALL_CARDS[saveState.deck[0]] ||
    ALL_CARDS[0];

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-[#141518] select-none">
      {/* Persistent Full-Viewport Three.js 3D Stage */}
      <ThreeStage
        mode={threeMode}
        bannerTitle={activeBanner.title}
        bannerColor={activeBanner.primaryColor}
        secondaryColor={activeBanner.secondaryColor}
        packRipState={packRipState}
        cameraTrauma={cameraTrauma}
        battleCameraPhase={battleCameraPhase}
        onPackClicked={() => handleTriggerPull(5)}
      />

      {/* 1. TITLE SCREEN STATE */}
      {shellState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          totalCollected={Object.keys(saveState.inv).length}
        />
      )}

      {/* 2. PLAYING HUD & GAME SHELL */}
      {shellState !== 'title' && (
        <>
          {/* Compact Liquid Glass Top App Bar */}
          {!hudCollapsed && activeBattleStage === null && (
            <div className="fixed top-2 sm:top-3 inset-x-3 sm:inset-x-6 md:inset-x-8 z-30 pointer-events-none flex items-center justify-between gap-2">
              {/* Top-Left Currency, Producer & Center Bias Readout */}
              <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-4 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl liquid-glass-elevated">
                <div>
                  <div className="text-[10px] font-sans font-semibold text-slate-400">
                    Produser
                  </div>
                  <div className="text-xs sm:text-sm font-display font-bold text-white tabular-nums">
                    Lv.{producerLevel}
                  </div>
                </div>

                <div className="h-5 w-[1px] bg-white/12" />

                <div>
                  <div className="text-[10px] font-sans font-semibold text-slate-400">
                    Star Coins
                  </div>
                  <div
                    data-testid="hud-coins"
                    className="text-xs sm:text-sm font-mono font-bold text-amber-400 flex items-center gap-1 tabular-nums"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>{saveState.coins}</span>
                  </div>
                </div>

                <div className="h-5 w-[1px] bg-white/12" />

                <div>
                  <div className="text-[10px] font-sans font-semibold text-slate-400">
                    Diamonds
                  </div>
                  <div
                    data-testid="hud-diamonds"
                    className="text-xs sm:text-sm font-mono font-bold text-[#38BDF8] flex items-center gap-1 tabular-nums"
                  >
                    <Gem className="w-3.5 h-3.5" />
                    <span>{saveState.diamonds ?? 0}</span>
                  </div>
                </div>

                <div className="h-5 w-[1px] bg-white/12" />

                <div>
                  <div className="text-[10px] font-sans font-semibold text-slate-400">
                    Tiket Pack
                  </div>
                  <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400 flex items-center gap-1 tabular-nums">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{saveState.freePacks}</span>
                  </div>
                </div>

                {centerBiasCard && (
                  <>
                    <div className="hidden sm:block h-5 w-[1px] bg-white/12" />
                    <button
                      type="button"
                      onClick={() => setInspectedCard(centerBiasCard)}
                      className="hidden sm:flex flex-col text-left cursor-pointer hover:opacity-85"
                    >
                      <span className="text-[10px] font-sans font-semibold text-[#38BDF8]">
                        Center Bias
                      </span>
                      <span className="text-xs font-display font-bold text-white">
                        {centerBiasCard.name} · {centerBiasCard.group}
                      </span>
                    </button>
                  </>
                )}
              </div>

              {/* Top-Right Compact Utility Buttons (Photobook Dex, Cinema 3D [H], Mute [M], Pause [P]) */}
              <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  data-testid="topbar-dex-btn"
                  onClick={() => {
                    sound.playClick();
                    setGroupDexOpen(true);
                  }}
                  className="relative min-h-[40px] px-3 rounded-xl liquid-glass-elevated hover:border-white/30 text-xs font-medium text-white cursor-pointer flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span className="hidden sm:inline">Photobook Dex</span>
                  {claimableDexCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-black font-mono text-[10px] font-bold tabular-nums">
                      {claimableDexCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  aria-label="Mode Sinema 3D [H]"
                  title="Mode Sinema 3D [H]"
                  onClick={() => setHudCollapsed((c) => !c)}
                  className="min-h-[40px] px-2.5 rounded-xl liquid-glass-elevated hover:border-white/30 text-[11px] font-medium text-zinc-200 cursor-pointer hidden md:flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Sinema 3D</span>
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={muted ? 'Nyalakan Suara [M]' : 'Bisukan Suara [M]'}
                  title="Suara [M]"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setMuted((m) => {
                      sound.muted = !m;
                      return !m;
                    });
                  }}
                  className="min-w-[40px] min-h-[40px] rounded-xl liquid-glass-elevated hover:border-white/30 flex items-center justify-center text-white cursor-pointer"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Jeda Permainan [P]"
                  title="Jeda Permainan [P]"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setShellState('paused');
                  }}
                  className="min-w-[40px] min-h-[40px] rounded-xl liquid-glass-elevated hover:border-white/30 flex items-center justify-center text-white cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Restore HUD Pill when in Cinema 3D Mode */}
          {hudCollapsed && activeBattleStage === null && (
            <button
              type="button"
              onClick={() => setHudCollapsed(false)}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto min-h-[44px] px-5 py-2 rounded-full liquid-glass-elevated text-xs font-semibold text-white cursor-pointer"
            >
              Tampilkan HUD Studio [H]
            </button>
          )}

          {/* Active Studio View */}
          {!hudCollapsed && activeBattleStage === null && (
            <main className="relative z-10 w-full h-full">
              {activeTab === 'home' && (
                <HomeView
                  saveState={saveState}
                  centerBiasCard={centerBiasCard}
                  unitSynergyBonus={activeUnitSynergy.totalBonus}
                  onNavigateTab={(t) => {
                    sound.playClick();
                    setActiveTab(t);
                  }}
                  onJumpToPackWithFocus={handleJumpToPackWithFocus}
                  onOpenGroupDex={() => {
                    sound.playClick();
                    setGroupDexOpen(true);
                  }}
                  onReplyFanChat={handleReplyFanChat}
                  onClaimDailyBonusCoins={handleClaimDailyBonusCoins}
                  onInspectCard={(c) => setInspectedCard(c)}
                />
              )}

              {activeTab === 'pack' && (
                <PackRipView
                  saveState={saveState}
                  activeBanner={activeBanner}
                  onSelectBanner={(b) => setActiveBanner(b)}
                  onSelectFocusGroup={handleSelectFocusGroup}
                  packRipState={packRipState}
                  pulledItems={pulledItems}
                  onTriggerPull={handleTriggerPull}
                  onResetPackStage={() => setPackRipState('idle')}
                  onInspectCard={(c) => setInspectedCard(c)}
                />
              )}

              {activeTab === 'wonder' && (
                <WonderPickView
                  saveState={saveState}
                  boards={wonderBoards}
                  onRefreshBoards={handleRefreshWonderBoards}
                  onExecutePick={handleExecuteWonderPick}
                  onInspectCard={(c) => setInspectedCard(c)}
                />
              )}

              {activeTab === 'binder' && (
                <BinderDeckView
                  saveState={saveState}
                  onInspectCard={(c) => setInspectedCard(c)}
                  onAutoBestDeck={handleAutoBestDeck}
                  onToggleDeckCard={handleToggleDeckCard}
                  onDispatchAgencySchedule={handleDispatchAgencySchedule}
                  onOpenGroupDex={() => {
                    sound.playClick();
                    setGroupDexOpen(true);
                  }}
                />
              )}

              {activeTab === 'tour' && (
                <WorldTourView
                  saveState={saveState}
                  onClaimTowerPatrol={handleClaimTowerPatrol}
                  onStartStageBattle={(stageIdx) => {
                    if (saveState.deck.length === 0) {
                      showToast('Pasang minimal 1 Idol di Stage Unit terlebih dahulu!');
                      return;
                    }
                    sound.playClick();
                    setActiveBattleStage(stageIdx);
                  }}
                />
              )}

              {activeTab === 'quests' && (
                <QuestsModal
                  saveState={saveState}
                  onClaimQuest={handleClaimQuest}
                  onClaimDailyBonusCoins={handleClaimDailyBonusCoins}
                  onResetProgress={() => setConfirmResetOpen(true)}
                />
              )}
            </main>
          )}

          {/* Ergonomic Liquid Glass 6-Tab Bottom Navigation Dock (Min 44x44px Touch Hitboxes) */}
          {!hudCollapsed && activeBattleStage === null && (
            <div className="fixed bottom-0 sm:bottom-2.5 left-0 right-0 z-30 pointer-events-auto flex justify-center px-0 sm:px-4">
              <nav
                aria-label="Navigasi Studio Game"
                className="w-full max-w-3xl p-1 sm:p-1.5 sm:rounded-2xl liquid-glass-elevated grid grid-cols-6 gap-1"
              >
                {/* Tab 1: Beranda (Home) */}
                <button
                  type="button"
                  data-testid="nav-tab-home"
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('home');
                  }}
                  className={`min-h-[48px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                    activeTab === 'home'
                      ? 'bg-[#0066FF] text-white shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-white/6'
                  }`}
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] sm:text-xs font-display font-semibold tracking-tight truncate">
                    Beranda
                  </span>
                </button>

                {/* Tab 2: Pack 3D */}
                <button
                  type="button"
                  data-testid="nav-tab-pack"
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('pack');
                  }}
                  className={`min-h-[48px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                    activeTab === 'pack'
                      ? 'bg-[#0066FF] text-white shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-white/6'
                  }`}
                >
                  <PackageOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] sm:text-xs font-display font-semibold tracking-tight truncate">
                    Pack 3D
                  </span>
                </button>

                {/* Tab 3: Wonder Pick */}
                <button
                  type="button"
                  data-testid="nav-tab-wonder"
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('wonder');
                  }}
                  className={`relative min-h-[48px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                    activeTab === 'wonder'
                      ? 'bg-[#0066FF] text-white shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-white/6'
                  }`}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] sm:text-xs font-display font-semibold tracking-tight truncate">
                    Wonder Pick
                  </span>
                  {!saveState.wonderPickFreeUsedToday && (
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>

                {/* Tab 4: Binder & Bias */}
                <button
                  type="button"
                  data-testid="nav-tab-binder"
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('binder');
                  }}
                  className={`min-h-[48px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                    activeTab === 'binder'
                      ? 'bg-[#0066FF] text-white shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-white/6'
                  }`}
                >
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] sm:text-xs font-display font-semibold tracking-tight truncate">
                    Binder
                  </span>
                </button>

                {/* Tab 5: World Tour */}
                <button
                  type="button"
                  data-testid="nav-tab-tour"
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('tour');
                  }}
                  className={`min-h-[48px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                    activeTab === 'tour'
                      ? 'bg-[#0066FF] text-white shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-white/6'
                  }`}
                >
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] sm:text-xs font-display font-semibold tracking-tight truncate">
                    World Tour
                  </span>
                </button>

                {/* Tab 6: Misi & Karir */}
                <button
                  type="button"
                  data-testid="nav-tab-quests"
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('quests');
                  }}
                  className={`relative min-h-[48px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                    activeTab === 'quests'
                      ? 'bg-[#0066FF] text-white shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-white/6'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] sm:text-xs font-display font-semibold tracking-tight truncate">
                    Misi
                  </span>
                  {claimableQuestCount > 0 && (
                    <span className="absolute top-1 right-2 px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-mono text-[9px] font-bold tabular-nums">
                      {claimableQuestCount}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* 3. GROUP PHOTOBOOK DEX MODAL */}
      {groupDexOpen && (
        <GroupDexModal
          saveState={saveState}
          onClose={() => setGroupDexOpen(false)}
          onClaimGroupReward={handleClaimGroupDexReward}
          onTargetGroupInPack={(groupName, bannerId) =>
            handleJumpToPackWithFocus(groupName, bannerId)
          }
          onInspectCard={(c) => setInspectedCard(c)}
        />
      )}

      {/* 3. ACTIVE 3D STAGE BATTLE ARENA */}
      {activeBattleStage !== null && (
        <BattleArenaModal
          stageIndex={activeBattleStage}
          saveState={saveState}
          onCameraTrauma={(t) => setCameraTrauma(t)}
          onCameraPhaseChange={(phase) => setBattleCameraPhase(phase)}
          onBattleFinished={handleBattleFinished}
          onCloseToTour={() => {
            setActiveBattleStage(null);
            setBattleCameraPhase('idle');
            setShellState('playing');
          }}
          onNextStage={(nextIdx) => {
            setShellState('playing');
            setActiveBattleStage(nextIdx);
          }}
          onRetryStage={(retryIdx) => {
            setShellState('playing');
            setActiveBattleStage(null);
            setTimeout(() => setActiveBattleStage(retryIdx), 30);
          }}
        />
      )}

      {/* 4. 3D CARD INSPECTOR MODAL */}
      {inspectedCard && (
        <CardInspectorModal
          card={inspectedCard}
          level={saveState.lv[inspectedCard.id] || 1}
          awakeningStars={saveState.stars[inspectedCard.id] || 0}
          copiesOwned={saveState.inv[inspectedCard.id] || 1}
          inDeck={saveState.deck.includes(inspectedCard.id)}
          isBias={saveState.biasCardId === inspectedCard.id}
          bondXp={saveState.biasBondXp?.[inspectedCard.id] || 0}
          decoFrame={saveState.cardDeco?.[inspectedCard.id] || 'none'}
          gradeTier={saveState.cardGrades?.[inspectedCard.id] || 0}
          gradeAttempts={saveState.cardGradeAttempts?.[inspectedCard.id] || 0}
          coins={saveState.coins}
          diamonds={saveState.diamonds ?? 0}
          synergyBonus={activeUnitSynergy.totalBonus}
          onUpgrade={handleUpgradeCard}
          onAwaken={handleAwakenCard}
          onGradeCard={handleGradeCard}
          onToggleDeck={handleToggleDeckCard}
          onSetBias={handleSetBias}
          onSetDecoFrame={handleSetDecoFrame}
          onClose={() => setInspectedCard(null)}
        />
      )}

      {/* 5. PAUSE MODAL ('paused' state) */}
      {shellState === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Permainan Dijeda"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#111524] border border-white/15 p-6 text-center shadow-2xl">
            <div className="text-xs font-mono text-slate-400">GAME SHELL PAUSED</div>
            <h2 className="text-2xl font-display font-extrabold text-white mt-1">
              JEDA KONSER
            </h2>

            <div className="my-4 grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#090A0F] border border-white/10 font-mono tabular-nums text-xs">
              <div>
                <div className="text-slate-400">KOLEKSI BINDER</div>
                <div className="text-base font-extrabold text-sky-400">
                  {Object.keys(saveState.inv).length}/{ALL_CARDS.length}
                </div>
              </div>
              <div>
                <div className="text-slate-400">STAGE PROGRESS</div>
                <div className="text-base font-extrabold text-amber-400">
                  {saveState.prog + 1}/90
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setShellState('playing')}
                className="min-h-[44px] w-full py-3 rounded-xl bg-[#FF4FA3] hover:bg-[#ff3395] text-white font-display font-extrabold text-sm cursor-pointer"
              >
                LANJUTKAN BERMAIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveBattleStage(null);
                  setShellState('title');
                }}
                className="min-h-[44px] w-full py-3 rounded-xl bg-[#1E253D] hover:bg-[#283150] text-slate-200 font-bold text-xs cursor-pointer"
              >
                Kembali ke Layar Judul
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONFIRM RESET MODAL */}
      {confirmResetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi Reset Data"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#111524] border border-white/15 p-6 text-center shadow-2xl">
            <h3 className="text-lg font-display font-extrabold text-white">
              Reset Semua Progres?
            </h3>
            <p className="text-xs text-slate-300 mt-2">
              Seluruh koleksi Photocard, level, dan progres World Tour akan direset ke awal.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const fresh = createInitialSaveState();
                  setSaveState(fresh);
                  setConfirmResetOpen(false);
                  showToast('Progres berhasil direset ke awal.');
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Ya, Reset Data
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1E253D] hover:bg-[#283150] text-slate-200 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-Blocking Toast Banner */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl liquid-glass-elevated border border-[#38BDF8]/50 text-white font-semibold text-xs shadow-2xl pointer-events-none max-w-[90vw] text-center"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}

import {
  ALL_CARDS,
  BOOSTER_BANNERS,
  CARDS_BY_RARITY,
  DUPLICATE_COIN_REWARD,
  RARITY_WEIGHTS,
  RAW_GROUPS,
} from './data.ts';
import type {
  IdolCard,
  RarityIndex,
  RoleIndex,
} from './data.ts';

export type DecoFrameId = 'none' | 'starlight' | 'ribbon' | 'heart' | 'crown';

export interface DecoFrameDef {
  id: DecoFrameId;
  label: string;
  badgeColor: string;
}

export const DECO_FRAMES: DecoFrameDef[] = [
  { id: 'none', label: 'Tanpa Deco', badgeColor: '#64748B' },
  { id: 'starlight', label: 'Starlight Polco', badgeColor: '#38BDF8' },
  { id: 'ribbon', label: 'Cyber Ribbon', badgeColor: '#FF4FA3' },
  { id: 'heart', label: 'Heart Decal', badgeColor: '#F43F5E' },
  { id: 'crown', label: 'Royal Crown', badgeColor: '#FBBF24' },
];

export type CardGradeTier = 0 | 8 | 9 | 95 | 10;

export interface CardGradeMeta {
  tier: CardGradeTier;
  scoreText: string;
  shortLabel: string;
  fullLabel: string;
  statBonus: number; // e.g. 0.28 for +28%
  isBlackLabel: boolean;
}

export const CARD_GRADE_META: Record<CardGradeTier, CardGradeMeta> = {
  0: {
    tier: 0,
    scoreText: 'RAW',
    shortLabel: 'Belum Di-Grade',
    fullLabel: 'Raw Un-Graded Photocard',
    statBonus: 0,
    isBlackLabel: false,
  },
  8: {
    tier: 8,
    scoreText: '8',
    shortLabel: 'PSA 8 · NM-MT',
    fullLabel: 'PSA 8 Near Mint-Mint (+6% Stat)',
    statBonus: 0.06,
    isBlackLabel: false,
  },
  9: {
    tier: 9,
    scoreText: '9',
    shortLabel: 'PSA 9 · MINT',
    fullLabel: 'PSA 9 Mint Condition (+12% Stat)',
    statBonus: 0.12,
    isBlackLabel: false,
  },
  95: {
    tier: 95,
    scoreText: '9.5',
    shortLabel: 'PSA 9.5 · GEM MT',
    fullLabel: 'PSA 9.5 Gem Mint (+18% Stat)',
    statBonus: 0.18,
    isBlackLabel: false,
  },
  10: {
    tier: 10,
    scoreText: '10',
    shortLabel: '★ PSA 10 · BLACK LABEL',
    fullLabel: 'PSA 10 Pristine Black Label (+28% Stat)',
    statBonus: 0.28,
    isBlackLabel: true,
  },
};

export function getCardGradeInfo(tier?: CardGradeTier): CardGradeMeta {
  return CARD_GRADE_META[tier || 0] || CARD_GRADE_META[0];
}

export interface SaveState {
  inv: Record<number, number>; // cardId -> total copies pulled
  lv: Record<number, number>; // cardId -> level (1..15)
  stars: Record<number, number>; // cardId -> awakening stars (0..5)
  deck: number[]; // up to 5 cardIds
  biasCardId: number | null; // Center Bias idol cardId
  biasBondXp: Record<number, number>; // cardId -> Bond XP
  cardDeco: Record<number, DecoFrameId>; // cardId -> Deco Top-Loader style
  cardGrades: Record<number, CardGradeTier>; // cardId -> PSA Slab Grade (0, 8, 9, 95, 10)
  cardGradeAttempts: Record<number, number>; // cardId -> number of grading polishes (8 = guaranteed Black Label)
  wonderPickFreeUsedToday: boolean; // 1x free Wonder Pick per day
  prog: number; // highest unlocked stage index (0..89)
  stageStars: Record<number, number>; // stageIndex -> 1..3 stars
  rolls: number;
  totalWins: number;
  coins: number;
  diamonds: number; // Star Diamonds (💎) used for PSA Card Grading Lab
  xp: number;
  freePacks: number; // free starter / hourglass packs
  lastFreeClaim: number; // timestamp ms
  dailyBonusClaimed: boolean; // strictly 1x per day bonus coin claim
  pityLegend: number; // 0..80
  pityMythic: number; // 0..200
  dailyDate: string;
  dailyCounts: Record<string, number>;
  dailyClaimed: Record<string, boolean>;
  milestoneCounts: Record<string, number>;
  milestoneClaimed: Record<string, boolean>;
  claimedGroupDex: Record<string, boolean>; // groupName -> reward claimed
  fanChatClaimedDate: string; // date string when Daily Fan-Chat was answered
  fanChatReplyIndex: number | null; // chosen reply index for today's Fan-Chat
  focusGroup: string | null; // optional pinpoint group rate-up focus in Booster Pack
  fatePoints: number; // 0..15 Fate Point Pity counter for focusGroup
  wonderPickDailyCount: number; // 0..3 daily Wonder Pick play counter
  towerFloor: number; // current Queendom Survival Tower floor (1..50+)
  towerPatrolDate: string; // date string when Daily Tower Patrol was claimed
  agencyScheduleClaimed: Record<string, boolean>; // scheduleId -> claimed today
  agencyScheduleAssigned: Record<string, number[]>; // scheduleId -> dispatched cardIds today
}

export const FATE_POINT_PITY_MAX = 15;
export const WONDER_PICK_DAILY_LIMIT = 3;
export const WONDER_PICK_REFRESH_COST = 100;
export const GRADING_DIAMOND_COST = 25;
export const GRADING_COIN_COST = 150;
export const GRADING_BLACK_LABEL_PITY = 8;

export function getBiasBondInfo(xp = 0): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  statBonus: number;
} {
  const safeXp = Math.max(0, xp || 0);
  const level = Math.min(10, 1 + Math.floor(safeXp / 100));
  const currentXp = level >= 10 ? 100 : safeXp % 100;
  const nextLevelXp = 100;
  // Lv.1 gives +4% stat bonus, up to +22% at Lv.10
  const statBonus = Number((0.04 + (level - 1) * 0.02).toFixed(2));
  return { level, currentXp, nextLevelXp, statBonus };
}

export function claimDailyBonusCoins(state: SaveState): {
  ok: boolean;
  coinsGranted: number;
  reason?: string;
} {
  if (state.dailyBonusClaimed) {
    return {
      ok: false,
      coinsGranted: 0,
      reason: 'Bonus Koin Harian sudah diklaim hari ini! Kembali lagi besok atau selesaikan Misi & World Tour.',
    };
  }
  state.dailyBonusClaimed = true;
  state.lastFreeClaim = Date.now();
  state.coins += 180;
  return {
    ok: true,
    coinsGranted: 180,
  };
}

export function createInitialSaveState(): SaveState {
  // Give player 3 iconic starter cards so they can immediately inspect or battle, plus 1 free pack & 680 coins!
  const starterIds = [
    ALL_CARDS.find((c) => c.name === 'Yujin' && c.group === 'IVE')?.id ?? 0,
    ALL_CARDS.find((c) => c.name === 'Jiyu' && c.group === 'KiiiKiii')?.id ?? 1,
    ALL_CARDS.find((c) => c.name === 'Woni' && c.group === 'RESCENE')?.id ?? 2,
  ];
  const inv: Record<number, number> = {};
  const lv: Record<number, number> = {};
  const stars: Record<number, number> = {};
  const biasBondXp: Record<number, number> = {};
  starterIds.forEach((id) => {
    inv[id] = 1;
    lv[id] = 1;
    stars[id] = 0;
    biasBondXp[id] = 20;
  });

  return {
    inv,
    lv,
    stars,
    deck: [...starterIds],
    biasCardId: starterIds[0],
    biasBondXp,
    cardDeco: {
      [starterIds[0]]: 'starlight',
    },
    cardGrades: {},
    cardGradeAttempts: {},
    wonderPickFreeUsedToday: false,
    prog: 0,
    stageStars: {},
    rolls: 0,
    totalWins: 0,
    coins: 680,
    diamonds: 30,
    xp: 0,
    freePacks: 1,
    lastFreeClaim: 0,
    dailyBonusClaimed: false,
    pityLegend: 0,
    pityMythic: 0,
    dailyDate: new Date().toDateString(),
    dailyCounts: { roll: 0, win: 0, upgrade: 0, ultimate: 0, pack5: 0 },
    dailyClaimed: {},
    milestoneCounts: { roll: 0, win: 0, upgrade: 0, ultimate: 0, pack5: 0 },
    milestoneClaimed: {},
    claimedGroupDex: {},
    fanChatClaimedDate: '',
    fanChatReplyIndex: null,
    focusGroup: null,
    fatePoints: 0,
    wonderPickDailyCount: 0,
    towerFloor: 1,
    towerPatrolDate: '',
    agencyScheduleClaimed: {},
    agencyScheduleAssigned: {},
  };
}

export function getLevelMultiplier(level: number, awakeningStars = 0): number {
  const safeLv = Math.max(1, Math.min(15, level || 1));
  const safeStar = Math.max(0, Math.min(5, awakeningStars || 0));
  return 1 + (safeLv - 1) * 0.16 + safeStar * 0.22;
}

export function getCardStats(
  card: IdolCard,
  level = 1,
  awakeningStars = 0,
  synergyBonus = 0,
  gradeTier: CardGradeTier = 0
) {
  const gradeBonus = getCardGradeInfo(gradeTier).statBonus;
  const mult = getLevelMultiplier(level, awakeningStars) * (1 + synergyBonus) * (1 + gradeBonus);
  const atk = Math.round(card.baseAtk * mult);
  const hp = Math.round(card.baseHp * mult);
  const power = Math.round(atk * 4.2 + hp);
  return { atk, hp, power, mult, gradeBonus };
}

export interface CardGradingResult {
  ok: boolean;
  reason?: string;
  previousGrade: CardGradeTier;
  rolledGrade: CardGradeTier;
  finalGrade: CardGradeTier;
  isUpgrade: boolean;
  triggeredPity: boolean;
  attemptsUsed: number;
  subGrades: {
    centering: string;
    corners: string;
    edges: string;
    surface: string;
  };
}

/**
 * PSA Card Grading Lab:
 * Costs 25 Star Diamonds (💎) + 150 Star Coins (🪙).
 * Probabilities:
 *  - PSA 8 (NM-MT): 45% (+6% Stat)
 *  - PSA 9 (MINT):  35% (+12% Stat)
 *  - PSA 9.5 (GEM): 15% (+18% Stat)
 *  - PSA 10 (BLACK LABEL): 5% (+28% Stat)
 * High-Watermark Protection: Grade never drops below existing grade!
 * Polish Pity: 8th attempt on the same card guarantees PSA 10 Pristine Black Label!
 */
export function executeCardGrading(
  state: SaveState,
  cardId: number,
  rng: () => number = Math.random
): CardGradingResult {
  const emptySub = { centering: '-', corners: '-', edges: '-', surface: '-' };
  const prevGrade = (state.cardGrades?.[cardId] || 0) as CardGradeTier;

  if (!state.inv[cardId] || state.inv[cardId] <= 0) {
    return {
      ok: false,
      reason: 'Kamu belum memiliki photocard ini di dalam Binder.',
      previousGrade: prevGrade,
      rolledGrade: 0,
      finalGrade: prevGrade,
      isUpgrade: false,
      triggeredPity: false,
      attemptsUsed: state.cardGradeAttempts?.[cardId] || 0,
      subGrades: emptySub,
    };
  }

  if (prevGrade === 10) {
    return {
      ok: false,
      reason: 'Kartu ini sudah mencapai predikat tertinggi ★ PSA 10 PRISTINE BLACK LABEL!',
      previousGrade: 10,
      rolledGrade: 10,
      finalGrade: 10,
      isUpgrade: false,
      triggeredPity: false,
      attemptsUsed: state.cardGradeAttempts?.[cardId] || 0,
      subGrades: { centering: '10.0', corners: '10.0', edges: '10.0', surface: '10.0' },
    };
  }

  const currentDiamonds = state.diamonds || 0;
  if (currentDiamonds < GRADING_DIAMOND_COST) {
    return {
      ok: false,
      reason: `Star Diamonds tidak cukup! Butuh ${GRADING_DIAMOND_COST} 💎 (Selesaikan Misi Harian atau First-Clear Stage/Tower).`,
      previousGrade: prevGrade,
      rolledGrade: 0,
      finalGrade: prevGrade,
      isUpgrade: false,
      triggeredPity: false,
      attemptsUsed: state.cardGradeAttempts?.[cardId] || 0,
      subGrades: emptySub,
    };
  }

  if (state.coins < GRADING_COIN_COST) {
    return {
      ok: false,
      reason: `Star Coins tidak cukup untuk biaya enkapsulasi slab (${GRADING_COIN_COST} 🪙).`,
      previousGrade: prevGrade,
      rolledGrade: 0,
      finalGrade: prevGrade,
      isUpgrade: false,
      triggeredPity: false,
      attemptsUsed: state.cardGradeAttempts?.[cardId] || 0,
      subGrades: emptySub,
    };
  }

  // Deduct costs
  state.diamonds = currentDiamonds - GRADING_DIAMOND_COST;
  state.coins -= GRADING_COIN_COST;

  const attempts = (state.cardGradeAttempts?.[cardId] || 0) + 1;
  state.cardGradeAttempts = {
    ...(state.cardGradeAttempts || {}),
    [cardId]: attempts,
  };

  let rolledGrade: CardGradeTier = 8;
  let triggeredPity = false;

  if (attempts >= GRADING_BLACK_LABEL_PITY) {
    rolledGrade = 10;
    triggeredPity = true;
  } else {
    const roll = rng() * 100;
    if (roll < 5) {
      rolledGrade = 10; // 5% Pristine Black Label
    } else if (roll < 20) {
      rolledGrade = 95; // 15% Gem Mint 9.5
    } else if (roll < 55) {
      rolledGrade = 9; // 35% Mint 9
    } else {
      rolledGrade = 8; // 45% NM-MT 8
    }
  }

  const gradeRank: Record<CardGradeTier, number> = {
    0: 0,
    8: 1,
    9: 2,
    95: 3,
    10: 4,
  };
  const isUpgrade = gradeRank[rolledGrade] > gradeRank[prevGrade];
  const finalGrade: CardGradeTier = isUpgrade ? rolledGrade : prevGrade;
  state.cardGrades = {
    ...(state.cardGrades || {}),
    [cardId]: finalGrade,
  };

  const subGradesByTier: Record<CardGradeTier, { centering: string; corners: string; edges: string; surface: string }> = {
    0: emptySub,
    8: { centering: '8.5', corners: '8.0', edges: '8.0', surface: '8.0' },
    9: { centering: '9.5', corners: '9.0', edges: '9.0', surface: '9.0' },
    95: { centering: '10.0', corners: '9.5', edges: '9.5', surface: '9.5' },
    10: { centering: '10.0', corners: '10.0', edges: '10.0', surface: '10.0' },
  };

  return {
    ok: true,
    previousGrade: prevGrade,
    rolledGrade,
    finalGrade,
    isUpgrade,
    triggeredPity,
    attemptsUsed: attempts,
    subGrades: subGradesByTier[finalGrade],
  };
}

export function getUpgradeCost(card: IdolCard, currentLevel: number): number {
  const lv = Math.max(1, currentLevel);
  return Math.round(35 * lv * (1 + card.rarity * 0.65));
}

export function getAwakenDuplicateRequirement(currentStars: number): number {
  // Needs 2 total copies for ★1, 3 for ★2, 4 for ★3, etc.
  return currentStars + 2;
}

export interface SynergySummary {
  totalBonus: number; // e.g., 0.26 for +26%
  activeBadges: Array<{ label: string; bonusPct: number; color: string }>;
  groupCounts: Record<string, number>;
}

export function calculateUnitSynergy(
  cards: IdolCard[],
  biasCardId?: number | null,
  biasBondXp?: Record<number, number>
): SynergySummary {
  if (!cards.length) {
    return { totalBonus: 0, activeBadges: [], groupCounts: {} };
  }

  const groupCounts: Record<string, number> = {};
  const eraCounts: Record<string, number> = {};
  const rolesPresent = new Set<number>();

  for (const c of cards) {
    groupCounts[c.group] = (groupCounts[c.group] || 0) + 1;
    eraCounts[c.era] = (eraCounts[c.era] || 0) + 1;
    rolesPresent.add(c.role);
  }

  let totalBonus = 0;
  const activeBadges: Array<{ label: string; bonusPct: number; color: string }> = [];

  // 1. Same-Group Synergy
  Object.entries(groupCounts).forEach(([group, count]) => {
    if (count >= 5) {
      totalBonus += 0.35;
      activeBadges.push({ label: `${group} Full Unit ×5`, bonusPct: 35, color: '#FF4FA3' });
    } else if (count >= 3) {
      totalBonus += 0.2;
      activeBadges.push({ label: `${group} Trio ×${count}`, bonusPct: 20, color: '#A855F7' });
    } else if (count === 2) {
      totalBonus += 0.1;
      activeBadges.push({ label: `${group} Duo ×2`, bonusPct: 10, color: '#38BDF8' });
    }
  });

  // 2. Same-Era Resonance (if 4+ members share an Era)
  Object.entries(eraCounts).forEach(([era, count]) => {
    if (count >= 4) {
      totalBonus += 0.12;
      activeBadges.push({ label: `${era} Wave ×${count}`, bonusPct: 12, color: '#F59E0B' });
    }
  });

  // 3. All-Round Formation (if at least 3 distinct roles are in the unit)
  if (rolesPresent.size >= 3) {
    const roleBonus = rolesPresent.size === 4 ? 0.15 : 0.08;
    totalBonus += roleBonus;
    activeBadges.push({
      label: rolesPresent.size === 4 ? 'Perfect 4-Role Harmony' : '3-Role Stage Balance',
      bonusPct: Math.round(roleBonus * 100),
      color: '#10B981',
    });
  }

  // 4. Center Bias Bond Aura (if player's Center Bias is in the active Stage Unit)
  if (biasCardId != null && cards.some((c) => c.id === biasCardId)) {
    const biasCard = cards.find((c) => c.id === biasCardId);
    const bondInfo = getBiasBondInfo(biasBondXp?.[biasCardId] || 0);
    totalBonus += bondInfo.statBonus;
    activeBadges.push({
      label: `Bias ${biasCard?.name || ''} Lv.${bondInfo.level}`,
      bonusPct: Math.round(bondInfo.statBonus * 100),
      color: '#F43F5E',
    });
  }

  return {
    totalBonus: Number(totalBonus.toFixed(2)),
    activeBadges,
    groupCounts,
  };
}

export function getRoleAdvantageMultiplier(attackerRole: RoleIndex, defenderRole: RoleIndex): {
  multiplier: number;
  relation: 'advantage' | 'disadvantage' | 'neutral' | 'visual_aura';
} {
  // Role 3 is Center Visual: universal +12% harmony aura
  if (attackerRole === 3) {
    return { multiplier: 1.12, relation: 'visual_aura' };
  }
  if (defenderRole === 3) {
    return { multiplier: 1.0, relation: 'neutral' };
  }
  // 0 (Vocal) > 1 (Dancer) > 2 (Rapper) > 0 (Vocal)
  if ((attackerRole + 1) % 3 === defenderRole) {
    return { multiplier: 1.25, relation: 'advantage' };
  }
  if ((defenderRole + 1) % 3 === attackerRole) {
    return { multiplier: 0.82, relation: 'disadvantage' };
  }
  return { multiplier: 1.0, relation: 'neutral' };
}

export function getPackCost(bannerId: string, count: 1 | 5 | 10, freePacksAvailable: number): number {
  if (count === 5 && freePacksAvailable > 0) {
    return 0;
  }
  const banner = BOOSTER_BANNERS.find((b) => b.id === bannerId) || BOOSTER_BANNERS[0];
  if (count === 1) return banner.costSingle;
  if (count === 5) return banner.costPack5;
  return banner.costBox10;
}

export function pickSingleCardFromBanner(
  bannerId: string,
  minRarity: RarityIndex,
  pityLegend: number,
  pityMythic: number,
  randomFn: () => number = Math.random,
  focusGroup: string | null = null,
  forceGroup: string | null = null
): { card: IdolCard; nextPityLegend: number; nextPityMythic: number } {
  const banner = BOOSTER_BANNERS.find((b) => b.id === bannerId) || BOOSTER_BANNERS[0];

  let nextL = pityLegend + 1;
  let nextM = pityMythic + 1;

  let roll = randomFn() * 100;
  let rarity: RarityIndex = 0;
  for (let r = 0 as RarityIndex; r < 4; r = (r + 1) as RarityIndex) {
    if (roll < RARITY_WEIGHTS[r]) {
      rarity = r;
      break;
    }
    roll -= RARITY_WEIGHTS[r];
    if (r === 3) rarity = 4;
  }

  // Hard Pity guarantees
  if (nextL >= 70) rarity = Math.max(rarity, 3) as RarityIndex;
  if (nextM >= 180) rarity = 4;
  rarity = Math.max(rarity, minRarity) as RarityIndex;

  if (rarity >= 3) nextL = 0;
  if (rarity === 4) nextM = 0;

  // Step 1: Select the candidate group pool FIRST so featured & focus groups (e.g., Hearts2Hearts, ILLIT, MEOVV)
  // are never dropped due to rarity filtering, while keeping all 41 groups mixed in every pack.
  let candidatePool: IdolCard[] = ALL_CARDS;

  if (forceGroup) {
    const forced = ALL_CARDS.filter((c) => c.group === forceGroup);
    if (forced.length > 0) candidatePool = forced;
  } else {
    const groupRoll = randomFn();
    const activeFocusCards = focusGroup
      ? ALL_CARDS.filter((c) => c.group === focusGroup)
      : [];

    if (activeFocusCards.length > 0 && groupRoll < 0.18) {
      // Balanced 18% pure pinpoint rate-up when user selects a Focus Group
      candidatePool = activeFocusCards;
    } else if (
      banner.featuredGroups.length > 0 &&
      groupRoll < (activeFocusCards.length > 0 ? 0.68 : 0.65)
    ) {
      // Featured Banner Groups Rate-Up (with priority boost for headline subtitle groups)
      const headlineGroups = banner.featuredGroups.slice(0, 8);
      if (headlineGroups.length > 0 && randomFn() < 0.62) {
        const headlinePool = ALL_CARDS.filter((c) => headlineGroups.includes(c.group));
        if (headlinePool.length > 0) {
          candidatePool = headlinePool;
        }
      } else {
        const featuredPool = ALL_CARDS.filter((c) => banner.featuredGroups.includes(c.group));
        if (featuredPool.length > 0) {
          candidatePool = featuredPool;
        }
      }
    }
  }

  // Step 2: Filter candidatePool by rolled rarity; if no exact match in that group pool,
  // pick a member from that group pool with >= minRarity so the group rate-up is always honored.
  let rarityMatches = candidatePool.filter((c) => c.rarity === rarity);
  if (rarityMatches.length === 0) {
    rarityMatches = candidatePool.filter((c) => c.rarity >= minRarity);
  }
  if (rarityMatches.length === 0) {
    rarityMatches = candidatePool;
  }

  const picked = rarityMatches[Math.floor(randomFn() * rarityMatches.length)];
  return { card: picked, nextPityLegend: nextL, nextPityMythic: nextM };
}

export interface PullOutcomeItem {
  card: IdolCard;
  isNew: boolean;
  duplicateCoins: number;
  copyNumber: number;
  isFatePity?: boolean;
}

export function executeBannerPull(
  state: SaveState,
  bannerId: string,
  count: 1 | 5 | 10,
  randomFn: () => number = Math.random
): {
  ok: boolean;
  reason?: string;
  costPaid: number;
  usedFreePack: boolean;
  items: PullOutcomeItem[];
  totalDuplicateCoins: number;
  highestRarity: RarityIndex;
  fateTriggeredCount: number;
} {
  const cost = getPackCost(bannerId, count, state.freePacks);
  if (state.coins < cost) {
    return {
      ok: false,
      reason: `Koin tidak cukup! Butuh ${cost} Koin (Klaim misi harian, Photobook Dex, atau Survival Tower).`,
      costPaid: 0,
      usedFreePack: false,
      items: [],
      totalDuplicateCoins: 0,
      highestRarity: 0,
      fateTriggeredCount: 0,
    };
  }

  const usedFreePack = count === 5 && state.freePacks > 0;
  if (usedFreePack) {
    state.freePacks -= 1;
  } else {
    state.coins -= cost;
  }

  const items: PullOutcomeItem[] = [];
  let totalDuplicateCoins = 0;
  let highestRarity: RarityIndex = 0;
  let fateTriggeredCount = 0;
  const activeFocusGroup = state.focusGroup || null;
  if (typeof state.fatePoints !== 'number') {
    state.fatePoints = 0;
  }

  for (let i = 0; i < count; i++) {
    // Guarantee Rare+ on last card of 5-pack, or Epic+ on last card of 10-box
    let minRarity: RarityIndex = 0;
    if (count === 5 && i === 4 && !items.some((x) => x.card.rarity >= 1)) {
      minRarity = 1;
    } else if (count === 10 && i === 9 && !items.some((x) => x.card.rarity >= 2)) {
      minRarity = 2;
    }

    let isFatePity = false;
    let forcedGroup: string | null = null;
    if (activeFocusGroup) {
      state.fatePoints += 1;
      if (state.fatePoints >= FATE_POINT_PITY_MAX) {
        state.fatePoints = 0;
        forcedGroup = activeFocusGroup;
        isFatePity = true;
        fateTriggeredCount += 1;
      }
    }

    let { card, nextPityLegend, nextPityMythic } = pickSingleCardFromBanner(
      bannerId,
      minRarity,
      state.pityLegend,
      state.pityMythic,
      randomFn,
      activeFocusGroup,
      forcedGroup
    );

    // If Fate Point Pity triggered, prioritize an unowned member of the focusGroup if any exist!
    if (isFatePity && activeFocusGroup) {
      const unownedFocusMembers = ALL_CARDS.filter(
        (c) => c.group === activeFocusGroup && (state.inv[c.id] || 0) === 0
      );
      if (unownedFocusMembers.length > 0) {
        card = unownedFocusMembers[Math.floor(randomFn() * unownedFocusMembers.length)];
      }
    }

    // Reset Fate Points early if the player naturally rolled a member of their Focus Group?
    // Keeping Fate Points as a steady 15-pull counter (or resetting on hit) — let's keep it accumulating up to 15 so players always see predictable progress toward their 15/15 Encore!
    state.pityLegend = nextPityLegend;
    state.pityMythic = nextPityMythic;

    const prevCopies = state.inv[card.id] || 0;
    const isNew = prevCopies === 0;
    let duplicateCoins = 0;

    if (isNew) {
      state.lv[card.id] = 1;
      state.stars[card.id] = 0;
      if (state.deck.length < 5 && !state.deck.includes(card.id)) {
        state.deck.push(card.id);
      }
    } else {
      duplicateCoins = DUPLICATE_COIN_REWARD[card.rarity];
      state.coins += duplicateCoins;
      totalDuplicateCoins += duplicateCoins;
    }

    state.inv[card.id] = prevCopies + 1;
    state.rolls += 1;
    if (card.rarity > highestRarity) {
      highestRarity = card.rarity;
    }

    items.push({
      card,
      isNew,
      duplicateCoins,
      copyNumber: prevCopies + 1,
      isFatePity,
    });
  }

  state.dailyCounts.roll = (state.dailyCounts.roll || 0) + count;
  state.milestoneCounts.roll = (state.milestoneCounts.roll || 0) + count;
  if (count >= 5) {
    state.dailyCounts.pack5 = (state.dailyCounts.pack5 || 0) + 1;
    state.milestoneCounts.pack5 = (state.milestoneCounts.pack5 || 0) + 1;
  }

  return {
    ok: true,
    costPaid: cost,
    usedFreePack,
    items,
    totalDuplicateCoins,
    highestRarity,
    fateTriggeredCount,
  };
}

export interface WonderPickBoard {
  id: string;
  producerName: string;
  title: string;
  subtitle: string;
  cost: number;
  allowFreeDaily: boolean;
  accentColor: string;
  isMythicTable?: boolean;
  cards: IdolCard[]; // exactly 5 cards
}

export function generateWonderPickBoards(seed = Date.now()): WonderPickBoard[] {
  const rng = seededRng(seed);

  const pickByRarity = (r: RarityIndex): IdolCard => {
    let pool = CARDS_BY_RARITY[r];
    while (!pool || pool.length === 0) {
      r = Math.max(0, r - 1) as RarityIndex;
      pool = CARDS_BY_RARITY[r];
    }
    return pool[Math.floor(rng() * pool.length)];
  };

  // Mythic table only spawns rarely (12% chance) so Mythic cards remain prestigious and cannot be farmed easily
  const spawnMythicJackpot = rng() < 0.12;

  return [
    {
      id: `wp-rookie-${seed}`,
      producerName: 'Produser Minji_KR',
      title: 'Meja Fan-Sign Reguler',
      subtitle: 'Peluang 1/5 dapat Epic (Gratis 1×/Hari)',
      cost: 150,
      allowFreeDaily: true,
      accentColor: '#38BDF8',
      isMythicTable: false,
      cards: [
        pickByRarity(2), // Epic
        pickByRarity(1), // Rare
        pickByRarity(1), // Rare
        pickByRarity(0), // Common
        pickByRarity(0), // Common
      ],
    },
    {
      id: `wp-encore-${seed}`,
      producerName: 'Produser HypeBoy_99',
      title: 'Meja Comeback Spotlight',
      subtitle: '1 Kartu Legendary + 2 Kartu Epic Pilihan',
      cost: 380,
      allowFreeDaily: false,
      accentColor: '#A855F7',
      isMythicTable: false,
      cards: [
        pickByRarity(3), // Legendary
        pickByRarity(2), // Epic
        pickByRarity(2), // Epic
        pickByRarity(1), // Rare
        pickByRarity(0), // Common
      ],
    },
    spawnMythicJackpot
      ? {
          id: `wp-vip-mythic-${seed}`,
          producerName: 'Produser Daesang_VIP',
          title: 'Meja Jackpot Daesang (LANGKA 12%)',
          subtitle: '1 Kartu MYTHIC EX + 1 Legendary + 2 Epic!',
          cost: 850,
          allowFreeDaily: false,
          accentColor: '#FF4FA3',
          isMythicTable: true,
          cards: [
            pickByRarity(4), // Mythic
            pickByRarity(3), // Legendary
            pickByRarity(2), // Epic
            pickByRarity(2), // Epic
            pickByRarity(1), // Rare
          ],
        }
      : {
          id: `wp-vip-standard-${seed}`,
          producerName: 'Produser Inkigayo_Stage',
          title: 'Meja Headliner All-Star',
          subtitle: '2 Kartu Legendary EX + 2 Epic + 1 Rare',
          cost: 520,
          allowFreeDaily: false,
          accentColor: '#F59E0B',
          isMythicTable: false,
          cards: [
            pickByRarity(3), // Legendary
            pickByRarity(3), // Legendary
            pickByRarity(2), // Epic
            pickByRarity(2), // Epic
            pickByRarity(1), // Rare
          ],
        },
  ];
}

export function refreshWonderPickBoardsPaid(
  state: SaveState,
  seed = Date.now()
): {
  ok: boolean;
  costPaid: number;
  boards: WonderPickBoard[];
  reason?: string;
} {
  if (state.coins < WONDER_PICK_REFRESH_COST) {
    return {
      ok: false,
      costPaid: 0,
      boards: [],
      reason: `Butuh ${WONDER_PICK_REFRESH_COST} Koin untuk mengacak etalase Wonder Pick baru!`,
    };
  }
  state.coins -= WONDER_PICK_REFRESH_COST;
  return {
    ok: true,
    costPaid: WONDER_PICK_REFRESH_COST,
    boards: generateWonderPickBoards(seed),
  };
}

export function executeWonderPick(
  state: SaveState,
  board: WonderPickBoard,
  chosenSlotIndex: number,
  randomFn: () => number = Math.random
): {
  ok: boolean;
  reason?: string;
  usedFreeDaily: boolean;
  costPaid: number;
  chosenIndex: number;
  shuffledCards: IdolCard[];
  pickedItem: PullOutcomeItem | null;
} {
  const usedCount = state.wonderPickDailyCount || 0;
  if (usedCount >= WONDER_PICK_DAILY_LIMIT) {
    return {
      ok: false,
      reason: `Kuota Wonder Pick harian sudah mencapai batas maksimal (${WONDER_PICK_DAILY_LIMIT}/${WONDER_PICK_DAILY_LIMIT})! Kembali lagi besok.`,
      usedFreeDaily: false,
      costPaid: 0,
      chosenIndex: chosenSlotIndex,
      shuffledCards: board.cards,
      pickedItem: null,
    };
  }

  const isFree = board.allowFreeDaily && !state.wonderPickFreeUsedToday;
  const cost = isFree ? 0 : board.cost;

  if (state.coins < cost) {
    return {
      ok: false,
      reason: `Koin tidak cukup untuk Wonder Pick ini! Butuh ${cost} Koin.`,
      usedFreeDaily: false,
      costPaid: 0,
      chosenIndex: chosenSlotIndex,
      shuffledCards: board.cards,
      pickedItem: null,
    };
  }

  if (isFree) {
    state.wonderPickFreeUsedToday = true;
  } else {
    state.coins -= cost;
  }
  state.wonderPickDailyCount = usedCount + 1;

  // Fisher-Yates shuffle of the 5 cards
  const shuffled = [...board.cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  const safeSlot = Math.max(0, Math.min(shuffled.length - 1, chosenSlotIndex));
  const card = shuffled[safeSlot];

  const prevCopies = state.inv[card.id] || 0;
  const isNew = prevCopies === 0;
  let duplicateCoins = 0;

  if (isNew) {
    state.lv[card.id] = 1;
    state.stars[card.id] = 0;
    if (state.deck.length < 5 && !state.deck.includes(card.id)) {
      state.deck.push(card.id);
    }
  } else {
    duplicateCoins = DUPLICATE_COIN_REWARD[card.rarity];
    state.coins += duplicateCoins;
  }

  state.inv[card.id] = prevCopies + 1;
  state.rolls += 1;
  state.dailyCounts.roll = (state.dailyCounts.roll || 0) + 1;
  state.milestoneCounts.roll = (state.milestoneCounts.roll || 0) + 1;

  return {
    ok: true,
    usedFreeDaily: isFree,
    costPaid: cost,
    chosenIndex: safeSlot,
    shuffledCards: shuffled,
    pickedItem: {
      card,
      isNew,
      duplicateCoins,
      copyNumber: prevCopies + 1,
    },
  };
}

export function seededRng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface EnemyUnitSlot {
  card: IdolCard;
  level: number;
  awakeningStars: number;
  statMultiplier: number;
  isBoss: boolean;
}

export function generateStageEnemies(stageIndex: number): EnemyUnitSlot[] {
  const r = seededRng(stageIndex * 131 + 47);
  const subStage = stageIndex % 5; // 0..4 (4 is City Headliner Boss)
  const cityIndex = Math.floor(stageIndex / 5); // 0..17

  const unitCount = Math.min(5, 2 + (subStage >= 1 ? 1 : 0) + (subStage >= 3 ? 1 : 0) + (cityIndex >= 2 || subStage === 4 ? 1 : 0));
  const maxRarity = Math.min(4, Math.floor(cityIndex / 3) + (subStage === 4 ? 1 : 0)) as RarityIndex;
  const baseStatMult = 0.68 + stageIndex * 0.055 + (subStage === 4 ? 0.14 : 0);

  const enemies: EnemyUnitSlot[] = [];
  for (let i = 0; i < unitCount; i++) {
    const isBossSlot = subStage === 4 && i === 0;
    let rarity = Math.min(
      maxRarity,
      Math.floor(r() * (maxRarity + 1)) + (isBossSlot ? 1 : 0)
    ) as RarityIndex;
    rarity = Math.min(4, Math.max(0, rarity)) as RarityIndex;

    let pool = CARDS_BY_RARITY[rarity];
    while (!pool || pool.length === 0) {
      rarity = Math.max(0, rarity - 1) as RarityIndex;
      pool = CARDS_BY_RARITY[rarity];
    }

    const card = pool[Math.floor(r() * pool.length)];
    const level = Math.min(15, 1 + Math.floor(stageIndex / 6) + (isBossSlot ? 1 : 0));
    const awakeningStars = Math.min(5, Math.floor(stageIndex / 20));

    enemies.push({
      card,
      level,
      awakeningStars,
      statMultiplier: Number((baseStatMult * (isBossSlot ? 1.18 : 1.0)).toFixed(2)),
      isBoss: isBossSlot,
    });
  }

  return enemies;
}

export function calculateBattleOutcomeRewards(
  stageIndex: number,
  startingAllies: number,
  survivingAllies: number,
  isFirstClear: boolean
): {
  stars: 1 | 2 | 3;
  coinsEarned: number;
  diamondsEarned: number;
  xpEarned: number;
  bonusPackGranted: boolean;
} {
  const casualties = Math.max(0, startingAllies - survivingAllies);
  const stars: 1 | 2 | 3 = casualties === 0 ? 3 : casualties === 1 ? 2 : 1;
  const isBossStage = stageIndex % 5 === 4;

  const baseCoin = 55 + stageIndex * 11 + (isBossStage ? 85 : 0);
  const starMult = stars === 3 ? 1.35 : stars === 2 ? 1.15 : 1.0;
  const repeatFactor = isFirstClear ? 1.0 : 0.55;

  const coinsEarned = Math.round(baseCoin * starMult * repeatFactor);
  // Balanced Star Diamonds: only granted on First-Clear so stages cannot be endlessly farmed
  const diamondsEarned = isFirstClear ? (isBossStage ? 18 : 8) : 0;
  const xpEarned = Math.round((25 + stageIndex * 4) * (isFirstClear ? 1.2 : 0.6));
  const bonusPackGranted = isFirstClear && isBossStage;

  return { stars, coinsEarned, diamondsEarned, xpEarned, bonusPackGranted };
}

export interface GroupDexEntry {
  group: string;
  debutYear: number;
  era: 'GEN3' | 'GEN4' | 'GEN5';
  accentColor: string;
  bannerId: string;
  members: IdolCard[];
  ownedCount: number;
  totalCount: number;
  completionPct: number;
  isComplete: boolean;
  isClaimed: boolean;
  rewardCoins: number;
  rewardDiamonds: number;
  rewardBondXp: number;
}

export function getGroupDexList(state: SaveState): GroupDexEntry[] {
  return RAW_GROUPS.map(([group, debutYear, era, accentColor]) => {
    const members = ALL_CARDS.filter((c) => c.group === group);
    const ownedCount = members.filter((c) => (state.inv[c.id] || 0) > 0).length;
    const totalCount = members.length;
    const completionPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;
    const isComplete = totalCount > 0 && ownedCount >= totalCount;
    const isClaimed = Boolean(state.claimedGroupDex?.[group]);
    const matchingBanner =
      BOOSTER_BANNERS.find((b) => b.featuredGroups.includes(group)) || BOOSTER_BANNERS[0];

    return {
      group,
      debutYear,
      era,
      accentColor,
      bannerId: matchingBanner.id,
      members,
      ownedCount,
      totalCount,
      completionPct,
      isComplete,
      isClaimed,
      rewardCoins: 350,
      rewardDiamonds: 25,
      rewardBondXp: 50,
    };
  });
}

export function claimGroupDexReward(
  state: SaveState,
  groupName: string
): {
  ok: boolean;
  coinsGranted: number;
  diamondsGranted: number;
  bondXpGranted: number;
  reason?: string;
} {
  const entry = getGroupDexList(state).find((g) => g.group === groupName);
  if (!entry) {
    return {
      ok: false,
      coinsGranted: 0,
      diamondsGranted: 0,
      bondXpGranted: 0,
      reason: 'Grup tidak ditemukan.',
    };
  }
  if (!entry.isComplete) {
    return {
      ok: false,
      coinsGranted: 0,
      diamondsGranted: 0,
      bondXpGranted: 0,
      reason: `Koleksi member ${groupName} belum lengkap (${entry.ownedCount}/${entry.totalCount}).`,
    };
  }
  if (entry.isClaimed) {
    return {
      ok: false,
      coinsGranted: 0,
      diamondsGranted: 0,
      bondXpGranted: 0,
      reason: `Hadiah Photobook Dex ${groupName} sudah diklaim!`,
    };
  }

  state.claimedGroupDex = {
    ...(state.claimedGroupDex || {}),
    [groupName]: true,
  };
  state.coins += entry.rewardCoins;
  state.diamonds = (state.diamonds || 0) + entry.rewardDiamonds;
  state.xp += 100;
  const targetBiasId = state.biasCardId ?? state.deck[0] ?? 0;
  state.biasBondXp = {
    ...(state.biasBondXp || {}),
    [targetBiasId]: (state.biasBondXp?.[targetBiasId] || 0) + entry.rewardBondXp,
  };

  return {
    ok: true,
    coinsGranted: entry.rewardCoins,
    diamondsGranted: entry.rewardDiamonds,
    bondXpGranted: entry.rewardBondXp,
  };
}

export interface DailyFanChatSession {
  card: IdolCard;
  idolMessage: string;
  timeLabel: string;
  options: string[];
  idolReply: string;
  claimedToday: boolean;
  chosenReplyIndex: number | null;
  rewardCoins: number;
  rewardBondXp: number;
}

const FAN_CHAT_TEMPLATES = [
  {
    msg: (name: string, group: string) =>
      `Halo Produser! Latihan koreografi ${group} baru saja selesai. Aku sempat ambil selca baru buat binder kamu, menurutmu gimana?`,
    options: [
      'Selca terbaik minggu ini! Langsung kupasang di Center!',
      'Jangan lupa istirahat dan minum air yang cukup ya!',
      'Semangat terus! Formasi 5v5 kita makin kompak!',
    ],
    replies: [
      (name: string) => `Hehe makasih! ${name} janji bakal tampil all-out di panggung utama!`,
      (name: string) => `Siap Produser! Perhatianmu bikin energi ${name} langsung penuh lagi!`,
      (_name: string) => `Setuju! Ayo kita sapu bersih trofi World Tour hari ini!`,
    ],
  },
  {
    msg: (_name: string, group: string) =>
      `Hari ini jadwal rekaman lagu comeback ${group} seru banget! Kalau kita menang Encore nanti malam, kamu mau hadiah apa?`,
    options: [
      'Cukup lihat penampilan terbaikmu di Center Stage!',
      'Bawa pulang trofi Daesang dan photocard edisi hologram!',
      'Ayo rayakan bareng semua member setelah konser!',
    ],
    replies: [
      (name: string) => `Jawaban paling manis! Tunggu penampilan spesial dari ${name} ya!`,
      (_name: string) => `Deal! Kartu hologram langka pasti segera mampir ke koleksimu!`,
      (_name: string) => `Asyik! Semua member sudah tidak sabar tampil di depanmu!`,
    ],
  },
  {
    msg: (name: string, group: string) =>
      `Selamat pagi dari ruang tunggu ${group}! ${name} lagi pemanasan vokal sambil cek urutan panggung kita hari ini.`,
    options: [
      'Suaramu selalu jadi moodbooster nomor satu di agensi!',
      'Aku sudah siapkan formasi unit terbaik untuk mendukungmu!',
      'Tampil rileks dan nikmati sorakan penggemar di arena ya!',
    ],
    replies: [
      (name: string) => `Wah, dengar itu bikin gugupku langsung hilang. Terima kasih dari ${name}!`,
      (_name: string) => `Produser terbaik! Dengan strategi kamu, kita pasti menang telak!`,
      (_name: string) => `Pasti! Sampai ketemu di bawah sorot lampu panggung ya!`,
    ],
  },
];

export function getDailyFanChat(state: SaveState): DailyFanChatSession {
  const biasId = state.biasCardId ?? state.deck[0] ?? 0;
  const card = ALL_CARDS[biasId] || ALL_CARDS[0];
  const dateSeed = (state.dailyDate || 'today')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const tplIdx = (card.id + dateSeed) % FAN_CHAT_TEMPLATES.length;
  const tpl = FAN_CHAT_TEMPLATES[tplIdx];
  const claimedToday = state.fanChatClaimedDate === state.dailyDate && Boolean(state.dailyDate);
  const chosenIdx =
    claimedToday && state.fanChatReplyIndex !== null && state.fanChatReplyIndex !== undefined
      ? state.fanChatReplyIndex
      : 0;

  return {
    card,
    idolMessage: tpl.msg(card.name, card.group),
    timeLabel: 'Hari ini · Pribadi',
    options: tpl.options,
    idolReply: tpl.replies[chosenIdx % tpl.replies.length](card.name),
    claimedToday,
    chosenReplyIndex: claimedToday ? chosenIdx : null,
    rewardCoins: 80,
    rewardBondXp: 25,
  };
}

export function claimDailyFanChat(
  state: SaveState,
  replyIndex: number
): {
  ok: boolean;
  coinsGranted: number;
  bondXpGranted: number;
  reason?: string;
} {
  if (state.fanChatClaimedDate === state.dailyDate) {
    return {
      ok: false,
      coinsGranted: 0,
      bondXpGranted: 0,
      reason: 'Pesan harian dari Center Bias sudah kamu balas hari ini!',
    };
  }

  const targetBiasId = state.biasCardId ?? state.deck[0] ?? 0;
  state.fanChatClaimedDate = state.dailyDate;
  state.fanChatReplyIndex = Math.max(0, Math.min(2, replyIndex));
  state.coins += 80;
  state.xp += 35;
  state.biasBondXp = {
    ...(state.biasBondXp || {}),
    [targetBiasId]: (state.biasBondXp?.[targetBiasId] || 0) + 25,
  };

  return {
    ok: true,
    coinsGranted: 80,
    bondXpGranted: 25,
  };
}

export interface TowerFloorInfo {
  floor: number;
  title: string;
  subtitle: string;
  benefitedRole: RoleIndex;
  roleBuffLabel: string;
  isBossFloor: boolean;
  rewardCoins: number;
  rewardDiamonds: number;
  rewardXp: number;
  grantsFreePack: boolean;
}

const TOWER_ROLE_BUFFS: Record<RoleIndex, { name: string; element: string; buff: string }> = {
  0: {
    name: 'Crystal Vocal Live',
    element: 'WATER / VOCAL',
    buff: 'Idol Main Vocal mendapat +25% ATK & pemulihan harmonis',
  },
  1: {
    name: 'Volt Dance Break',
    element: 'LIGHTNING / DANCE',
    buff: 'Idol Main Dancer mendapat +25% ATK & akselerasi tempo',
  },
  2: {
    name: 'Blaze Rap Cypher',
    element: 'FIRE / RAP',
    buff: 'Idol Main Rapper mendapat +25% ATK & penetrasi ritme',
  },
  3: {
    name: 'Starlight Visual Encore',
    element: 'PSYCHIC / VISUAL',
    buff: 'Idol Center Visual mendapat +25% ATK & perisai panggung',
  },
};

export function getTowerFloorInfo(floor: number): TowerFloorInfo {
  const safeFloor = Math.max(1, floor || 1);
  const isBossFloor = safeFloor % 5 === 0;
  const benefitedRole = ((safeFloor - 1) % 4) as RoleIndex;
  const buffMeta = TOWER_ROLE_BUFFS[benefitedRole];

  const tierNames = [
    'Rookie Audition Hall',
    'Music Show Comeback',
    'Queendom Royal Dome',
    'Daesang Sky Citadel',
    'All-Kill Hall of Fame',
  ];
  const tierName = tierNames[Math.min(tierNames.length - 1, Math.floor((safeFloor - 1) / 10))];

  return {
    floor: safeFloor,
    title: isBossFloor
      ? `LANTAI ${safeFloor} BOSS · ${tierName.toUpperCase()}`
      : `LANTAI ${safeFloor} · ${buffMeta.name}`,
    subtitle: `${buffMeta.element} · ${buffMeta.buff}`,
    benefitedRole,
    roleBuffLabel: buffMeta.buff,
    isBossFloor,
    rewardCoins: 110 + safeFloor * 24 + (isBossFloor ? 160 : 0),
    rewardDiamonds: isBossFloor ? 20 : 8,
    rewardXp: 45 + safeFloor * 10,
    grantsFreePack: isBossFloor,
  };
}

export function generateTowerFloorEnemies(floor: number): EnemyUnitSlot[] {
  const safeFloor = Math.max(1, floor || 1);
  const r = seededRng(safeFloor * 293 + 911);
  const isBossFloor = safeFloor % 5 === 0;
  const unitCount = Math.min(5, 3 + (safeFloor >= 3 ? 1 : 0) + (safeFloor >= 6 || isBossFloor ? 1 : 0));
  const maxRarity = Math.min(4, 1 + Math.floor(safeFloor / 4) + (isBossFloor ? 1 : 0)) as RarityIndex;
  const baseStatMult = 0.72 + safeFloor * 0.075 + (isBossFloor ? 0.16 : 0);

  const enemies: EnemyUnitSlot[] = [];
  for (let i = 0; i < unitCount; i++) {
    const isBossSlot = isBossFloor && i === 0;
    let rarity = Math.min(
      maxRarity,
      Math.floor(r() * (maxRarity + 1)) + (isBossSlot ? 1 : 0)
    ) as RarityIndex;
    rarity = Math.min(4, Math.max(0, rarity)) as RarityIndex;

    let pool = CARDS_BY_RARITY[rarity];
    while (!pool || pool.length === 0) {
      rarity = Math.max(0, rarity - 1) as RarityIndex;
      pool = CARDS_BY_RARITY[rarity];
    }

    const card = pool[Math.floor(r() * pool.length)];
    const level = Math.min(15, 1 + Math.floor(safeFloor / 3) + (isBossSlot ? 1 : 0));
    const awakeningStars = Math.min(5, Math.floor(safeFloor / 8));

    enemies.push({
      card,
      level,
      awakeningStars,
      statMultiplier: Number((baseStatMult * (isBossSlot ? 1.2 : 1.0)).toFixed(2)),
      isBoss: isBossSlot,
    });
  }

  return enemies;
}

export function claimDailyTowerPatrol(state: SaveState): {
  ok: boolean;
  coinsGranted: number;
  bondXpGranted: number;
  freePacksGranted: number;
  reason?: string;
} {
  if (state.towerPatrolDate === state.dailyDate && Boolean(state.dailyDate)) {
    return {
      ok: false,
      coinsGranted: 0,
      bondXpGranted: 0,
      freePacksGranted: 0,
      reason: 'Hadiah Patroli Queendom Tower hari ini sudah diklaim! Naikkan lantai untuk besok.',
    };
  }

  const clearedFloors = Math.max(0, (state.towerFloor || 1) - 1);
  const coinsGranted = 140 + clearedFloors * 30;
  const bondXpGranted = 25 + Math.min(50, clearedFloors * 3);
  const freePacksGranted = clearedFloors >= 5 ? 1 : 0;

  state.towerPatrolDate = state.dailyDate;
  state.coins += coinsGranted;
  state.xp += 40;
  state.freePacks += freePacksGranted;

  const targetBiasId = state.biasCardId ?? state.deck[0] ?? 0;
  state.biasBondXp = {
    ...(state.biasBondXp || {}),
    [targetBiasId]: (state.biasBondXp?.[targetBiasId] || 0) + bondXpGranted,
  };

  return {
    ok: true,
    coinsGranted,
    bondXpGranted,
    freePacksGranted,
  };
}

export interface AgencyScheduleDef {
  id: 'variety_show' | 'brand_shoot' | 'music_bank';
  title: string;
  subtitle: string;
  badge: string;
  requiredCount: number;
  minRarity: RarityIndex;
  minRarityLabel: string;
  rewardCoins: number;
  rewardDiamonds: number;
  rewardBondXp: number;
  accentColor: string;
}

export const AGENCY_SCHEDULES: AgencyScheduleDef[] = [
  {
    id: 'variety_show',
    title: 'Idol Variety Show',
    subtitle: 'Syuting reality show komedi & tantangan musik bersama MC nasional',
    badge: 'BROADCAST TV',
    requiredCount: 1,
    minRarity: 0,
    minRarityLabel: 'Minimal 1 Kartu (Bebas / Cadangan)',
    rewardCoins: 140,
    rewardDiamonds: 6,
    rewardBondXp: 20,
    accentColor: '#38BDF8',
  },
  {
    id: 'brand_shoot',
    title: 'Luxury Brand Ambassador',
    subtitle: 'Pemotretan majalah fashion & iklan kosmetik eksklusif di Seoul',
    badge: 'FASHION PICTORIAL',
    requiredCount: 2,
    minRarity: 1,
    minRarityLabel: 'Minimal 2 Kartu (1+ Rare/Epic/Legend/Mythic)',
    rewardCoins: 220,
    rewardDiamonds: 10,
    rewardBondXp: 30,
    accentColor: '#FF4FA3',
  },
  {
    id: 'music_bank',
    title: 'Music Show Special MC & Encore',
    subtitle: 'Penampilan kolaborasi spesial & wawancara eksklusif panggung utama',
    badge: 'PRIME TIME STAGE',
    requiredCount: 3,
    minRarity: 2,
    minRarityLabel: 'Minimal 3 Kartu (1+ Epic/Legend/Mythic)',
    rewardCoins: 320,
    rewardDiamonds: 15,
    rewardBondXp: 45,
    accentColor: '#FBBF24',
  },
];

export interface AgencyScheduleResult {
  ok: boolean;
  scheduleId: string;
  dispatchedCards: IdolCard[];
  coinsGranted: number;
  diamondsGranted: number;
  bondXpGranted: number;
  reason?: string;
}

export function getEligibleAgencyCards(
  state: SaveState,
  schedule: AgencyScheduleDef
): IdolCard[] {
  const ownedCards = ALL_CARDS.filter((c) => (state.inv[c.id] || 0) > 0);
  // Prioritize spare/bench cards not in the active 5v5 deck first, then fallback to owned cards if needed
  const benchCards = ownedCards.filter((c) => !state.deck.includes(c.id));
  const pool =
    benchCards.length >= schedule.requiredCount
      ? [...benchCards]
      : [
          ...benchCards,
          ...ownedCards.filter((c) => state.deck.includes(c.id)),
        ];

  pool.sort((a, b) => b.rarity - a.rarity || b.id - a.id);
  return pool;
}

export function executeAgencySchedule(
  state: SaveState,
  scheduleId: AgencyScheduleDef['id']
): AgencyScheduleResult {
  const schedule = AGENCY_SCHEDULES.find((s) => s.id === scheduleId);
  if (!schedule) {
    return {
      ok: false,
      scheduleId,
      dispatchedCards: [],
      coinsGranted: 0,
      diamondsGranted: 0,
      bondXpGranted: 0,
      reason: 'Jadwal agensi tidak ditemukan.',
    };
  }

  if (state.agencyScheduleClaimed?.[scheduleId]) {
    return {
      ok: false,
      scheduleId,
      dispatchedCards: [],
      coinsGranted: 0,
      diamondsGranted: 0,
      bondXpGranted: 0,
      reason: 'Jadwal agensi ini sudah diselesaikan hari ini! Reset kembali besok.',
    };
  }

  const pool = getEligibleAgencyCards(state, schedule);
  if (pool.length < schedule.requiredCount) {
    return {
      ok: false,
      scheduleId,
      dispatchedCards: [],
      coinsGranted: 0,
      diamondsGranted: 0,
      bondXpGranted: 0,
      reason: `Kamu butuh minimal ${schedule.requiredCount} kartu idol di Binder untuk jadwal ini! Buka Pack 3D terlebih dahulu.`,
    };
  }

  const hasMinRarity = pool.some((c) => c.rarity >= schedule.minRarity);
  if (!hasMinRarity) {
    return {
      ok: false,
      scheduleId,
      dispatchedCards: [],
      coinsGranted: 0,
      diamondsGranted: 0,
      bondXpGranted: 0,
      reason: `Syarat jadwal belum terpenuhi: ${schedule.minRarityLabel}.`,
    };
  }

  const dispatched = pool.slice(0, schedule.requiredCount);

  state.agencyScheduleClaimed = {
    ...(state.agencyScheduleClaimed || {}),
    [scheduleId]: true,
  };
  state.agencyScheduleAssigned = {
    ...(state.agencyScheduleAssigned || {}),
    [scheduleId]: dispatched.map((c) => c.id),
  };

  state.coins += schedule.rewardCoins;
  state.diamonds = (state.diamonds || 0) + schedule.rewardDiamonds;
  state.xp += 35;

  const targetBiasId = state.biasCardId ?? dispatched[0]?.id ?? state.deck[0] ?? 0;
  state.biasBondXp = {
    ...(state.biasBondXp || {}),
    [targetBiasId]: (state.biasBondXp?.[targetBiasId] || 0) + schedule.rewardBondXp,
  };

  return {
    ok: true,
    scheduleId,
    dispatchedCards: dispatched,
    coinsGranted: schedule.rewardCoins,
    diamondsGranted: schedule.rewardDiamonds,
    bondXpGranted: schedule.rewardBondXp,
  };
}




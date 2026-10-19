import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_CARDS, WORLD_TOUR_CITIES } from './data.ts';
import {
  AGENCY_SCHEDULES,
  calculateBattleOutcomeRewards,
  calculateUnitSynergy,
  claimDailyBonusCoins,
  claimDailyFanChat,
  claimDailyTowerPatrol,
  claimGroupDexReward,
  createInitialSaveState,
  executeAgencySchedule,
  executeBannerPull,
  executeCardGrading,
  executeWonderPick,
  FATE_POINT_PITY_MAX,
  generateStageEnemies,
  generateStarterMythicDraft,
  generateTowerFloorEnemies,
  generateWonderPickBoards,
  getBannerCollectionStats,
  getBiasBondInfo,
  getCardStats,
  getDailyFanChat,
  getGroupDexList,
  getRoleAdvantageMultiplier,
  getTowerFloorInfo,
  GRADING_BLACK_LABEL_PITY,
  GRADING_COIN_COST,
  GRADING_DIAMOND_COST,
  PITY_LEGEND_MAX,
  PITY_MYTHIC_MAX,
  refreshWonderPickBoardsPaid,
  seededRng,
  selectStarterMythicCard,
  WONDER_PICK_DAILY_LIMIT,
  WONDER_PICK_REFRESH_COST,
} from './rules.ts';

test('database includes Gen 3-5 groups including KiiiKiii, RESCENE, izna, BTS, BLACKPINK, TWICE, Stray Kids', () => {
  const groups = new Set(ALL_CARDS.map((c) => c.group));
  assert.equal(groups.has('KiiiKiii'), true);
  assert.equal(groups.has('RESCENE'), true);
  assert.equal(groups.has('izna'), true);
  assert.equal(groups.has('Hearts2Hearts'), true);
  assert.equal(groups.has('ILLIT'), true);
  assert.equal(groups.has('MEOVV'), true);
  assert.equal(groups.has('BTS'), true);
  assert.equal(groups.has('BLACKPINK'), true);
  assert.equal(groups.has('TWICE'), true);
  assert.equal(groups.has('Stray Kids'), true);
  assert.equal(ALL_CARDS.length > 220, true);
  assert.equal(WORLD_TOUR_CITIES.length, 18); // 90 stages total
});

test('unit synergy calculates same-group and role harmony bonuses accurately', () => {
  const iveCards = ALL_CARDS.filter((c) => c.group === 'IVE').slice(0, 5);
  const syn = calculateUnitSynergy(iveCards);
  assert.equal(syn.groupCounts['IVE'], 5);
  assert.equal(syn.totalBonus >= 0.35, true);
});

test('pack pull economy consumes free pack first, then coins, and guarantees Rare+ on 5-pack', () => {
  const state = createInitialSaveState();
  assert.equal(state.freePacks, 1);
  const initialCoins = state.coins;

  // First 5-pack uses the free starter pack
  const res1 = executeBannerPull(state, 'rookie_wave', 5, () => 0.01);
  assert.equal(res1.ok, true);
  assert.equal(res1.usedFreePack, true);
  assert.equal(state.coins >= initialCoins, true);
  assert.equal(res1.items.length, 5);
  assert.equal(res1.items.some((item) => item.card.rarity >= 1), true);

  // Second 5-pack costs 360 coins
  const coinsBeforeSecond = state.coins;
  const res2 = executeBannerPull(state, 'rookie_wave', 5, () => 0.5);
  assert.equal(res2.ok, true);
  assert.equal(res2.usedFreePack, false);
  assert.equal(res2.costPaid, 360);
  assert.equal(state.coins, coinsBeforeSecond - 360 + res2.totalDuplicateCoins);
});

test('balanced 18% focusGroup rate-up and 15-pull Fate Point Pity guarantee', () => {
  const state = createInitialSaveState();
  state.coins = 10000;
  state.freePacks = 0;
  state.focusGroup = 'Hearts2Hearts';
  state.fatePoints = 0;

  // With rng = 0.92 (outside the 18% pure focus roll), a single 5-pack does NOT auto-force Hearts2Hearts,
  // but increments fatePoints from 0 -> 5!
  const pull1 = executeBannerPull(state, 'rookie_wave', 5, () => 0.92);
  assert.equal(pull1.ok, true);
  assert.equal(state.fatePoints, 5);
  assert.equal(pull1.fateTriggeredCount, 0);

  // Second 5-pack increments fatePoints from 5 -> 10
  const pull2 = executeBannerPull(state, 'rookie_wave', 5, () => 0.92);
  assert.equal(pull2.ok, true);
  assert.equal(state.fatePoints, 10);

  // Third 5-pack reaches 15/15 Fate Points on the 5th card, triggering Fate Pity Encore and resetting fatePoints to 0!
  const pull3 = executeBannerPull(state, 'rookie_wave', 5, () => 0.92);
  assert.equal(pull3.ok, true);
  assert.equal(state.fatePoints, 0);
  assert.equal(pull3.fateTriggeredCount, 1);
  assert.equal(pull3.items[4].card.group, 'Hearts2Hearts');
  assert.equal(pull3.items[4].isFatePity, true);
  assert.equal(FATE_POINT_PITY_MAX, 15);
});

test('group photobook dex tracks group completion and grants +350 coins & +50 bond XP once', () => {
  const state = createInitialSaveState();
  const illitCards = ALL_CARDS.filter((c) => c.group === 'ILLIT');
  assert.equal(illitCards.length, 5);

  const earlyClaim = claimGroupDexReward(state, 'ILLIT');
  assert.equal(earlyClaim.ok, false);

  illitCards.forEach((c) => {
    state.inv[c.id] = 1;
  });

  const dexEntry = getGroupDexList(state).find((g) => g.group === 'ILLIT');
  assert.equal(dexEntry?.isComplete, true);
  assert.equal(dexEntry?.isClaimed, false);

  const coinsBefore = state.coins;
  const claimRes = claimGroupDexReward(state, 'ILLIT');
  assert.equal(claimRes.ok, true);
  assert.equal(claimRes.coinsGranted, 350);
  assert.equal(state.coins, coinsBefore + 350);

  const duplicateClaim = claimGroupDexReward(state, 'ILLIT');
  assert.equal(duplicateClaim.ok, false);
});

test('daily idol fan-chat grants +80 coins and +25 bond XP once per day', () => {
  const state = createInitialSaveState();
  const starterChoices = generateStarterMythicDraft(777);
  selectStarterMythicCard(state, starterChoices[0].id);

  const sessionBefore = getDailyFanChat(state);
  assert.equal(sessionBefore.claimedToday, false);
  assert.equal(sessionBefore.options.length, 3);

  const coinsBefore = state.coins;
  const biasId = state.biasCardId!;
  const bondBefore = state.biasBondXp[biasId] || 0;

  const res1 = claimDailyFanChat(state, 1);
  assert.equal(res1.ok, true);
  assert.equal(state.coins, coinsBefore + 80);
  assert.equal(state.biasBondXp[biasId], bondBefore + 25);

  const sessionAfter = getDailyFanChat(state);
  assert.equal(sessionAfter.claimedToday, true);
  assert.equal(sessionAfter.chosenReplyIndex, 1);

  const res2 = claimDailyFanChat(state, 0);
  assert.equal(res2.ok, false);
});

test('role advantage multiplier follows Vocal > Dancer > Rapper > Vocal and Center Visual aura', () => {
  assert.equal(getRoleAdvantageMultiplier(0, 1).multiplier, 1.25);
  assert.equal(getRoleAdvantageMultiplier(1, 2).multiplier, 1.25);
  assert.equal(getRoleAdvantageMultiplier(2, 0).multiplier, 1.25);
  assert.equal(getRoleAdvantageMultiplier(1, 0).multiplier, 0.82);
  assert.equal(getRoleAdvantageMultiplier(3, 0).multiplier, 1.12);
});

test('stage enemies scale across 90 stages and battle rewards grant boss pack on first clear', () => {
  const stage0 = generateStageEnemies(0);
  const stage89 = generateStageEnemies(89);
  assert.equal(stage0.length >= 2, true);
  assert.equal(stage89.length, 5);
  assert.equal(stage89[0].isBoss, true);

  const card0Stats = getCardStats(stage0[0].card, stage0[0].level, stage0[0].awakeningStars);
  const card89Stats = getCardStats(stage89[0].card, stage89[0].level, stage89[0].awakeningStars);
  assert.equal(card89Stats.power > card0Stats.power, true);

  const bossReward = calculateBattleOutcomeRewards(4, 5, 5, true);
  assert.equal(bossReward.stars, 3);
  assert.equal(bossReward.bonusPackGranted, true);
});

test('daily bonus coins can only be claimed once per day and cannot be spammed', () => {
  const state = createInitialSaveState();
  const startCoins = state.coins;
  const first = claimDailyBonusCoins(state);
  assert.equal(first.ok, true);
  assert.equal(state.coins, startCoins + 180);
  assert.equal(state.dailyBonusClaimed, true);

  const second = claimDailyBonusCoins(state);
  assert.equal(second.ok, false);
  assert.equal(state.coins, startCoins + 180);
});

test('wonder pick enforces 3/day quota, paid refresh (100 coins), and higher table costs', () => {
  const state = createInitialSaveState();
  state.coins = 2000;
  const boards = generateWonderPickBoards(12345);
  assert.equal(boards.length, 3);
  assert.equal(boards[0].cost, 150);
  assert.equal(boards[1].cost, 380);
  assert.equal(WONDER_PICK_DAILY_LIMIT, 3);

  // Paid refresh deducts 100 coins
  const coinsBeforeRefresh = state.coins;
  const refreshRes = refreshWonderPickBoardsPaid(state, 999);
  assert.equal(refreshRes.ok, true);
  assert.equal(refreshRes.costPaid, WONDER_PICK_REFRESH_COST);
  assert.equal(state.coins, coinsBeforeRefresh - WONDER_PICK_REFRESH_COST);

  // 1st pick is free on board[0], increments wonderPickDailyCount to 1
  const pick1 = executeWonderPick(state, boards[0], 2, () => 0.4);
  assert.equal(pick1.ok, true);
  assert.equal(pick1.usedFreeDaily, true);
  assert.equal(state.wonderPickDailyCount, 1);

  // 2nd pick costs 150 coins, increments wonderPickDailyCount to 2
  const pick2 = executeWonderPick(state, boards[0], 0, () => 0.7);
  assert.equal(pick2.ok, true);
  assert.equal(pick2.costPaid, 150);
  assert.equal(state.wonderPickDailyCount, 2);

  // 3rd pick costs 380 coins, increments wonderPickDailyCount to 3
  const pick3 = executeWonderPick(state, boards[1], 1, () => 0.2);
  assert.equal(pick3.ok, true);
  assert.equal(pick3.costPaid, 380);
  assert.equal(state.wonderPickDailyCount, 3);

  // 4th pick on the same day is blocked by the 3/3 daily anti-abuse limit!
  const pick4 = executeWonderPick(state, boards[0], 1, () => 0.5);
  assert.equal(pick4.ok, false);
});

test('queendom survival tower scales floors, grants boss pack tickets every 5th floor, and claims daily patrol', () => {
  const state = createInitialSaveState();
  assert.equal(state.towerFloor, 1);

  const floor1Info = getTowerFloorInfo(1);
  const floor5Info = getTowerFloorInfo(5);
  assert.equal(floor1Info.isBossFloor, false);
  assert.equal(floor5Info.isBossFloor, true);
  assert.equal(floor5Info.grantsFreePack, true);

  const enemies1 = generateTowerFloorEnemies(1);
  const enemies10 = generateTowerFloorEnemies(10);
  assert.equal(enemies1.length >= 3, true);
  assert.equal(enemies10.length, 5);
  assert.equal(enemies10[0].isBoss, true);

  // Claim daily tower patrol once per day
  state.towerFloor = 6; // 5 floors cleared -> grants 1 free pack ticket + coins!
  const freePacksBefore = state.freePacks;
  const patrol1 = claimDailyTowerPatrol(state);
  assert.equal(patrol1.ok, true);
  assert.equal(patrol1.freePacksGranted, 1);
  assert.equal(state.freePacks, freePacksBefore + 1);

  const patrol2 = claimDailyTowerPatrol(state);
  assert.equal(patrol2.ok, false);
});

test('center bias bond level increases unit synergy bonus when bias card is in deck', () => {
  const state = createInitialSaveState();
  const draft = generateStarterMythicDraft(101);
  selectStarterMythicCard(state, draft[0].id);
  const biasId = state.deck[0];
  state.biasCardId = biasId;
  state.biasBondXp[biasId] = 250; // Lv.3 Bond (+8% stat)

  const bondInfo = getBiasBondInfo(state.biasBondXp[biasId]);
  assert.equal(bondInfo.level, 3);
  assert.equal(bondInfo.statBonus, 0.08);

  const deckCards = state.deck.map((id) => ALL_CARDS[id]).filter(Boolean);
  const synWithoutBias = calculateUnitSynergy(deckCards, null, {});
  const synWithBias = calculateUnitSynergy(deckCards, state.biasCardId, state.biasBondXp);
  assert.equal(synWithBias.totalBonus > synWithoutBias.totalBonus, true);
});

test('PSA Card Grading Lab enforces Diamond + Coin cost, High-Watermark protection, and 8-pull Black Label Pity', () => {
  const state = createInitialSaveState();
  const draft = generateStarterMythicDraft(202);
  selectStarterMythicCard(state, draft[0].id);
  const cardId = state.deck[0];
  const card = ALL_CARDS[cardId];
  state.diamonds = 300;
  state.coins = 3000;

  // Base ungraded stats
  const rawStats = getCardStats(card, 1, 0, 0, 0);

  // 1st grade roll: rng=0.35 -> PSA 9 (Mint, +12% stat)
  const g1 = executeCardGrading(state, cardId, () => 0.35);
  assert.equal(g1.ok, true);
  assert.equal(g1.finalGrade, 9);
  assert.equal(state.diamonds, 300 - GRADING_DIAMOND_COST);
  assert.equal(state.coins, 3000 - GRADING_COIN_COST);

  const mint9Stats = getCardStats(card, 1, 0, 0, state.cardGrades[cardId]);
  assert.equal(mint9Stats.power > rawStats.power, true);

  // 2nd grade roll: rng=0.85 -> rolled PSA 8, but High-Watermark keeps PSA 9!
  const g2 = executeCardGrading(state, cardId, () => 0.85);
  assert.equal(g2.ok, true);
  assert.equal(g2.rolledGrade, 8);
  assert.equal(g2.finalGrade, 9);
  assert.equal(state.cardGrades[cardId], 9);

  // Attempts 3..7 with low rolls keep PSA 9
  for (let i = 3; i <= 7; i++) {
    const res = executeCardGrading(state, cardId, () => 0.9);
    assert.equal(res.ok, true);
    assert.equal(res.attemptsUsed, i);
  }

  // 8th attempt triggers guaranteed PSA 10 Pristine Black Label (+28% stat)!
  const g8 = executeCardGrading(state, cardId, () => 0.99);
  assert.equal(g8.ok, true);
  assert.equal(g8.triggeredPity, true);
  assert.equal(g8.finalGrade, 10);
  assert.equal(g8.attemptsUsed, GRADING_BLACK_LABEL_PITY);
  assert.equal(state.cardGrades[cardId], 10);

  const blackLabelStats = getCardStats(card, 1, 0, 0, 10);
  assert.equal(blackLabelStats.power > mint9Stats.power, true);

  // Further grading on a PSA 10 Black Label card is blocked so player never wastes Diamonds
  const g9 = executeCardGrading(state, cardId, () => 0.5);
  assert.equal(g9.ok, false);
});

test('idol agency schedule dispatches spare cards to earn Star Diamonds, Coins, and Bond XP once per day', () => {
  const state = createInitialSaveState();
  const draft = generateStarterMythicDraft(303);
  selectStarterMythicCard(state, draft[0].id);
  // Give 2 extra cards so 3-card schedules can also run
  state.inv[0] = 1;
  state.inv[1] = 1;
  assert.equal(AGENCY_SCHEDULES.length, 3);

  const coinsBefore = state.coins;
  const diamondsBefore = state.diamonds;

  // Variety Show requires 1 card (rarity 0+)
  const v1 = executeAgencySchedule(state, 'variety_show');
  assert.equal(v1.ok, true);
  assert.equal(v1.coinsGranted, 140);
  assert.equal(v1.diamondsGranted, 6);
  assert.equal(state.coins, coinsBefore + 140);
  assert.equal(state.diamonds, diamondsBefore + 6);
  assert.equal(state.agencyScheduleClaimed['variety_show'], true);

  // Cannot claim same schedule twice on the same day
  const v2 = executeAgencySchedule(state, 'variety_show');
  assert.equal(v2.ok, false);

  // Give player an Epic card so Music Bank schedule is eligible
  const epicCard = ALL_CARDS.find((c) => c.rarity >= 2)!;
  state.inv[epicCard.id] = 1;
  const m1 = executeAgencySchedule(state, 'music_bank');
  assert.equal(m1.ok, true);
  assert.equal(m1.coinsGranted, 320);
  assert.equal(m1.diamondsGranted, 15);
  assert.equal(m1.dispatchedCards.length, 3);
});

test('new game / reset data starts with 0 idols and requires 1-of-5 random Mythic starter draft', () => {
  const state = createInitialSaveState();
  assert.equal(state.starterDraftCompleted, false);
  assert.equal(Object.keys(state.inv).length, 0);
  assert.equal(state.deck.length, 0);
  assert.equal(state.biasCardId, null);
  assert.equal(state.freePacks, 1);

  const draft = generateStarterMythicDraft(42);
  assert.equal(draft.length, 5);
  const uniqueIds = new Set(draft.map((c) => c.id));
  assert.equal(uniqueIds.size, 5);
  assert.equal(draft.every((c) => c.rarity === 4), true);

  // Rejects non-mythic card
  const commonCard = ALL_CARDS.find((c) => c.rarity === 0)!;
  const badPick = selectStarterMythicCard(state, commonCard.id);
  assert.equal(badPick.ok, false);

  // Accepts chosen Mythic card and gives strictly 1 card + 1 free pack ticket
  const chosenMythic = draft[2];
  const goodPick = selectStarterMythicCard(state, chosenMythic.id);
  assert.equal(goodPick.ok, true);
  assert.equal(state.starterDraftCompleted, true);
  assert.equal(Object.keys(state.inv).length, 1);
  assert.equal(state.inv[chosenMythic.id], 1);
  assert.deepEqual(state.deck, [chosenMythic.id]);
  assert.equal(state.biasCardId, chosenMythic.id);
  assert.equal(state.freePacks, 1);

  const bannerStats = getBannerCollectionStats(state, 'omni_allstar');
  assert.equal(bannerStats.ownedInBanner, 1);
  assert.equal(bannerStats.pullsUntilLegend, PITY_LEGEND_MAX);
  assert.equal(bannerStats.pullsUntilMythic, PITY_MYTHIC_MAX);
  assert.equal(bannerStats.pullsUntilExotic, 250);
});

test('Universal Dynamic Rarity supports pulling any idol in Common to Exotic and upgrades card tier', () => {
  const state = createInitialSaveState();
  const yujin = ALL_CARDS.find((c) => c.name === 'Yujin' && c.group === 'IVE')!;

  // 1. Initial getCardStats scales dynamically with effectiveRarity
  const statsCommon = getCardStats(yujin, 1, 0, 0, 0, 0); // Common
  const statsExotic = getCardStats(yujin, 1, 0, 0, 0, 5); // 🌈 EXOTIC
  assert.equal(statsExotic.atk > statsCommon.atk, true);
  assert.equal(statsExotic.hp > statsCommon.hp, true);
  assert.equal(statsExotic.power > statsCommon.power, true);

  // 2. Select starter draft with Exotic jackpot support
  const starterRes = selectStarterMythicCard(state, yujin.id, 5);
  assert.equal(starterRes.ok, true);
  assert.equal(state.cardRarity?.[yujin.id], 5);
  assert.equal((state.cardRarityMask?.[yujin.id] || 0) & (1 << 5), 1 << 5);

  // 3. Banner pull triggers hard Exotic pity at 250
  state.pityExotic = 249;
  const pull = executeBannerPull(state, 'omni_allstar', 1, () => 0.5);
  assert.equal(pull.ok, true);
  assert.equal(pull.items[0].pulledRarity, 5); // Guaranteed Exotic on 250th pull!
  assert.equal(state.pityExotic, 0); // Reset after Exotic pull
});






import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ABILITIES,
  ALL_CARDS,
  IdolCard,
  ROLES,
  STAGE_ROLES_INFO,
  WORLD_TOUR_CITIES,
} from '../game/data';
import {
  calculateBattleOutcomeRewards,
  calculateUnitSynergy,
  generateStageEnemies,
  generateTowerFloorEnemies,
  getCardStats,
  getRoleAdvantageMultiplier,
  getTowerFloorInfo,
  SaveState,
} from '../game/rules';
import {
  getCachedIdolImage,
  getStylizedPortraitFallback,
} from '../utils/imageResolver';
import { sound } from '../utils/sound';
import { Photocard3D } from './Photocard3D';
import { BattleCameraPhase } from './ThreeStage';

interface CombatUnit {
  uid: string;
  card: IdolCard;
  side: 0 | 1; // 0 = Player, 1 = Enemy
  level: number;
  awakeningStars: number;
  hp: number;
  maxHp: number;
  atk: number;
  shield: number;
  energy: number;
  stunTurns: number;
  burnTurns: number;
  rageStacks: number;
  revivedOnce: boolean;
  isBoss: boolean;
  floatingText?: { id: number; text: string; color: string };
  slashVfx?: { id: number; isCrit: boolean; color: string };
  isActing?: boolean;
  isHit?: boolean;
}

export interface BattleResultPayload {
  stageIndex: number;
  won: boolean;
  stars: 0 | 1 | 2 | 3;
  coinsEarned: number;
  diamondsEarned: number;
  xpEarned: number;
  bonusPackGranted: boolean;
  totalDamageDealt: number;
  roundsTaken: number;
  ultimatesUsed: number;
}

interface BattleArenaModalProps {
  stageIndex: number;
  saveState: SaveState;
  onCameraTrauma: (trauma: number) => void;
  onCameraPhaseChange?: (phase: BattleCameraPhase) => void;
  onBattleFinished: (result: BattleResultPayload) => void;
  onCloseToTour: () => void;
  onNextStage: (nextStageIdx: number) => void;
  onRetryStage: (stageIdx: number) => void;
}

export const BattleArenaModal: React.FC<BattleArenaModalProps> = ({
  stageIndex,
  saveState,
  onCameraTrauma,
  onCameraPhaseChange,
  onBattleFinished,
  onCloseToTour,
  onNextStage,
  onRetryStage,
}) => {
  const isTowerBattle = stageIndex >= 1000;
  const towerFloor = isTowerBattle ? stageIndex - 1000 : 1;
  const towerInfo = isTowerBattle ? getTowerFloorInfo(towerFloor) : null;

  const cityIdx = Math.floor(stageIndex / 5);
  const subIdx = stageIndex % 5;
  const city = WORLD_TOUR_CITIES[cityIdx] || WORLD_TOUR_CITIES[0];
  const stageMeta = STAGE_ROLES_INFO[subIdx] || STAGE_ROLES_INFO[0];

  const playerSynergy = useMemo(() => {
    const cards = saveState.deck.map((id) => ALL_CARDS[id]).filter(Boolean);
    return calculateUnitSynergy(cards, saveState.biasCardId, saveState.biasBondXp);
  }, [saveState.deck, saveState.biasCardId, saveState.biasBondXp]);

  const [units, setUnits] = useState<CombatUnit[]>([]);
  const [roundNum, setRoundNum] = useState<number>(1);
  const [battleLog, setBattleLog] = useState<string>(
    isTowerBattle && towerInfo
      ? `${towerInfo.title}: ${towerInfo.roleBuffLabel}!`
      : `STAGE ${cityIdx + 1}-${subIdx + 1}: ${city.name} Live dimulai!`
  );
  // Default Battle Speed is strictly 1x as requested by user!
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const [hypeGauge, setHypeGauge] = useState<number>(40);
  const [focusedEnemyUid, setFocusedEnemyUid] = useState<string | null>(null);
  const [ultimateCutIn, setUltimateCutIn] = useState<{
    card: IdolCard;
    name: string;
    skill: string;
    color: string;
  } | null>(null);
  const [activeProjectile, setActiveProjectile] = useState<{
    id: number;
    fromSide: 0 | 1;
    fromIndex: number;
    toIndex: number;
    role: number;
    color: string;
  } | null>(null);
  const [fanChantCount, setFanChantCount] = useState<number>(0);
  const [fanChantBuffActive, setFanChantBuffActive] = useState<boolean>(false);
  const [lightstickPulses, setLightstickPulses] = useState<
    Array<{ id: number; x: number; text: string }>
  >([]);
  const [outcome, setOutcome] = useState<BattleResultPayload | null>(null);

  const speedRef = useRef<number>(1);
  const skipFastRef = useRef<boolean>(false);
  const focusedEnemyRef = useRef<string | null>(null);
  const pendingEncoreFeverRef = useRef<boolean>(false);
  const fanChantBuffRef = useRef<boolean>(false);
  const ultimatesCountRef = useRef<number>(0);
  const totalDamageRef = useRef<number>(0);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    focusedEnemyRef.current = focusedEnemyUid;
  }, [focusedEnemyUid]);

  const triggerLightstickCheer = () => {
    if (outcome) return;
    sound.playClick();
    onCameraTrauma(0.18);
    setHypeGauge((prev) => Math.min(100, prev + 12));
    setFanChantCount((prev) => {
      const next = prev + 1;
      if (next >= 3 && !fanChantBuffRef.current) {
        fanChantBuffRef.current = true;
        setFanChantBuffActive(true);
      }
      return next;
    });
    const pulseId = Date.now() + Math.random();
    const chants = ['💖 SARANGHAE!', '✨ ENCORE!', '🔥 FIGHTING!', '🌟 ALL-KILL!'];
    setLightstickPulses((prev) => [
      ...prev.slice(-4),
      {
        id: pulseId,
        x: 20 + Math.round(Math.random() * 60),
        text: chants[Math.floor(Math.random() * chants.length)],
      },
    ]);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !outcome) {
        e.preventDefault();
        triggerLightstickCheer();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [outcome]);

  useEffect(() => {
    let cancelled = false;
    skipFastRef.current = false;
    ultimatesCountRef.current = 0;
    totalDamageRef.current = 0;
    fanChantBuffRef.current = false;
    setFanChantBuffActive(false);
    setFanChantCount(0);
    setActiveProjectile(null);
    setOutcome(null);
    setRoundNum(1);
    setHypeGauge(45);
    onCameraPhaseChange?.('idle');

    const playerCards = saveState.deck.map((id) => ALL_CARDS[id]).filter(Boolean);
    const synergy = calculateUnitSynergy(
      playerCards,
      saveState.biasCardId,
      saveState.biasBondXp
    );
    const enemySlots = isTowerBattle
      ? generateTowerFloorEnemies(towerFloor)
      : generateStageEnemies(stageIndex);

    const initialUnits: CombatUnit[] = [];

    // Build Player Units (apply +25% Elemental Role Buff in Queendom Survival Tower)
    playerCards.forEach((c, idx) => {
      const lv = saveState.lv[c.id] || 1;
      const st = saveState.stars[c.id] || 0;
      const gradeTier = saveState.cardGrades?.[c.id] || 0;
      const effRarity = saveState.cardRarity?.[c.id] ?? c.rarity;
      const towerRoleBonus =
        isTowerBattle && towerInfo && c.role === towerInfo.benefitedRole ? 0.25 : 0;
      const stats = getCardStats(
        c,
        lv,
        st,
        synergy.totalBonus + towerRoleBonus,
        gradeTier,
        effRarity
      );
      initialUnits.push({
        uid: `ally-${idx}-${c.id}`,
        card: { ...c, rarity: effRarity },
        side: 0,
        level: lv,
        awakeningStars: st,
        hp: stats.hp,
        maxHp: stats.hp,
        atk: stats.atk,
        shield: c.abilityId === 'shield' ? Math.round(stats.hp * 0.28) : 0,
        energy: 25,
        stunTurns: 0,
        burnTurns: 0,
        rageStacks: 0,
        revivedOnce: false,
        isBoss: false,
      });
    });

    // Build Enemy Units
    enemySlots.forEach((slot, idx) => {
      const stats = getCardStats(
        slot.card,
        slot.level,
        slot.awakeningStars,
        slot.statMultiplier - 1
      );
      initialUnits.push({
        uid: `enemy-${idx}-${slot.card.id}`,
        card: slot.card,
        side: 1,
        level: slot.level,
        awakeningStars: slot.awakeningStars,
        hp: stats.hp,
        maxHp: stats.hp,
        atk: stats.atk,
        shield: slot.card.abilityId === 'shield' ? Math.round(stats.hp * 0.22) : 0,
        energy: 15,
        stunTurns: 0,
        burnTurns: 0,
        rageStacks: 0,
        revivedOnce: false,
        isBoss: slot.isBoss,
      });
    });

    // Apply Leader Charisma ('buff') passive at battle start
    [0, 1].forEach((side) => {
      const hasLeaderBuff = initialUnits.some(
        (u) => u.side === side && u.card.abilityId === 'buff'
      );
      if (hasLeaderBuff) {
        initialUnits
          .filter((u) => u.side === side)
          .forEach((u) => {
            u.atk = Math.round(u.atk * 1.12);
          });
      }
    });

    setUnits([...initialUnits]);

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        if (skipFastRef.current || cancelled) {
          resolve();
          return;
        }
        setTimeout(resolve, Math.max(25, ms / speedRef.current));
      });

    let floatCounter = 1;
    const setFloat = (u: CombatUnit, text: string, color: string) => {
      u.floatingText = { id: floatCounter++, text, color };
    };

    const setSlash = (u: CombatUnit, isCrit: boolean, color: string) => {
      u.slashVfx = { id: floatCounter++, isCrit, color };
    };

    const applyDamage = (
      target: CombatUnit,
      rawDmg: number,
      attacker: CombatUnit | null,
      isCrit = false
    ): number => {
      if (attacker && target.card.abilityId === 'dodge' && Math.random() < 0.26) {
        setFloat(target, 'DODGE 💨', '#38BDF8');
        return 0;
      }

      let dmg = Math.max(1, Math.round(rawDmg));
      if (target.shield > 0) {
        const absorbed = Math.min(target.shield, dmg);
        target.shield -= absorbed;
        dmg -= absorbed;
      }

      target.hp = Math.max(0, target.hp - dmg);
      target.isHit = true;
      setSlash(target, isCrit, attacker?.card.accentColor || '#FF4FA3');

      if (attacker?.side === 0) {
        totalDamageRef.current += dmg;
      }

      setFloat(target, `${isCrit ? '💥 ' : ''}-${dmg}`, isCrit ? '#FBBF24' : '#FB7185');
      if (!skipFastRef.current) {
        sound.playHit(isCrit);
        onCameraTrauma(isCrit ? 0.65 : 0.32);
      }

      if (target.hp <= 0) {
        if (target.card.abilityId === 'revive' && !target.revivedOnce) {
          target.revivedOnce = true;
          target.hp = Math.round(target.maxHp * 0.38);
          target.energy = Math.min(100, target.energy + 50);
          setFloat(target, '✨ COMEBACK!', '#FBBF24');
        } else {
          target.hp = 0;
        }
      } else {
        target.energy = Math.min(100, target.energy + 18);
      }

      return dmg;
    };

    const runBattleLoop = async () => {
      await wait(600);
      let r = 1;

      while (!cancelled && r <= 35) {
        const aliveAllies = initialUnits.filter((u) => u.side === 0 && u.hp > 0);
        const aliveEnemies = initialUnits.filter((u) => u.side === 1 && u.hp > 0);
        if (aliveAllies.length === 0 || aliveEnemies.length === 0) break;

        setRoundNum(r);

        const queue: CombatUnit[] = [];
        for (let i = 0; i < 5; i++) {
          if (aliveAllies[i]) queue.push(aliveAllies[i]);
          if (aliveEnemies[i]) queue.push(aliveEnemies[i]);
        }

        for (const actor of queue) {
          if (cancelled) return;
          if (actor.hp <= 0) continue;

          // Check if Player triggered Interactive Encore Fever!
          if (pendingEncoreFeverRef.current) {
            pendingEncoreFeverRef.current = false;
            ultimatesCountRef.current += 1;
            setHypeGauge(0);
            setBattleLog('🔥 ENCORE FEVER AKTIF! Seluruh Unit mendapat Heal + Serangan Harmoni!');
            if (!skipFastRef.current) {
              onCameraPhaseChange?.('ultimate');
              sound.playUltimate();
              onCameraTrauma(0.85);
            }
            initialUnits
              .filter((u) => u.side === 0 && u.hp > 0)
              .forEach((ally) => {
                const healAmt = Math.round(ally.maxHp * 0.16);
                ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);
                ally.atk = Math.round(ally.atk * 1.15);
                setFloat(ally, `+${healAmt} HP`, '#34D399');
              });
            initialUnits
              .filter((u) => u.side === 1 && u.hp > 0)
              .forEach((foe) => {
                applyDamage(foe, foe.maxHp * 0.16, null, true);
              });
            setUnits([...initialUnits]);
            await wait(620);
            onCameraPhaseChange?.('idle');
          }

          const foes = initialUnits.filter((u) => u.side !== actor.side && u.hp > 0);
          if (foes.length === 0) break;

          // Burn tick
          if (actor.burnTurns > 0) {
            actor.burnTurns -= 1;
            applyDamage(actor, actor.maxHp * 0.07, null, false);
            setUnits([...initialUnits]);
            await wait(260);
            if (actor.hp <= 0) continue;
          }

          // Stun check
          if (actor.stunTurns > 0) {
            actor.stunTurns -= 1;
            setFloat(actor, '💫 TERPAKU', '#FBBF24');
            setUnits([...initialUnits]);
            await wait(300);
            continue;
          }

          actor.isActing = true;
          initialUnits.forEach((u) => {
            if (u !== actor) {
              u.isHit = false;
              u.slashVfx = undefined;
            }
          });

          // Check Ultimate Skill (100% Energy)
          if (actor.energy >= 100) {
            actor.energy = 0;
            if (actor.side === 0) {
              ultimatesCountRef.current += 1;
            }
            const ab = ABILITIES[actor.card.abilityId];
            const ultTitle = ab ? ab.ultimateName : 'Stadium Climax';
            setBattleLog(`⭐ ULTIMATE! ${actor.card.name} (${actor.card.group}) — ${ultTitle}!`);

            if (!skipFastRef.current) {
              onCameraPhaseChange?.('ultimate');
              setUltimateCutIn({
                card: actor.card,
                name: `${actor.card.name} · ${actor.card.group}`,
                skill: ultTitle,
                color: actor.card.accentColor,
              });
              sound.playUltimate();
              onCameraTrauma(0.8);
            }
            setUnits([...initialUnits]);
            await wait(680);
            setUltimateCutIn(null);

            const ultMult = 1.25 + actor.card.rarity * 0.15;
            foes.forEach((t) => {
              applyDamage(t, actor.atk * ultMult, actor, true);
            });

            // Role-specific Ultimate Bonus
            if (actor.card.role === 0) {
              initialUnits
                .filter((u) => u.side === actor.side && u.hp > 0)
                .forEach((ally) => {
                  const h = Math.round(ally.maxHp * 0.12);
                  ally.hp = Math.min(ally.maxHp, ally.hp + h);
                  setFloat(ally, `+${h}`, '#34D399');
                });
            } else if (actor.card.role === 1 && foes[0] && foes[0].hp > 0) {
              foes[0].stunTurns = 1;
              setFloat(foes[0], '💫 STUN', '#FBBF24');
            } else if (actor.card.role === 3) {
              initialUnits
                .filter((u) => u.side === actor.side && u.hp > 0)
                .forEach((ally) => {
                  ally.shield += Math.round(ally.maxHp * 0.12);
                  setFloat(ally, '🛡 SHIELD', '#38BDF8');
                });
            }

            actor.isActing = false;
            setUnits([...initialUnits]);
            await wait(420);
            onCameraPhaseChange?.('idle');
            continue;
          }

          // Standard / Passive Skill Attack with Dynamic 3D Camera Sweep
          if (!skipFastRef.current) {
            onCameraPhaseChange?.(actor.side === 0 ? 'ally_attack' : 'enemy_attack');
          }

          let target = foes[Math.floor(Math.random() * foes.length)];
          if (actor.side === 0 && focusedEnemyRef.current) {
            const focused = foes.find((f) => f.uid === focusedEnemyRef.current);
            if (focused) target = focused;
          } else if (actor.card.abilityId === 'snipe') {
            target = foes.reduce((a, b) => (b.hp < a.hp ? b : a));
          }

          const roleAdv = getRoleAdvantageMultiplier(actor.card.role, target.card.role);
          const isCrit = actor.card.abilityId === 'crit' && Math.random() < 0.35;
          const snipeBonus = actor.card.abilityId === 'snipe' ? 1.15 : 1.0;
          const fanChantBonus = actor.side === 0 && fanChantBuffRef.current ? 1.15 : 1.0;
          let rawDmg =
            actor.atk *
            (0.92 + Math.random() * 0.16) *
            (1 + actor.rageStacks * 0.14) *
            roleAdv.multiplier *
            snipeBonus *
            fanChantBonus;
          if (isCrit) rawDmg *= 2.0;

          if (actor.card.abilityId === 'rage') {
            actor.rageStacks += 1;
          }

          const roleNote =
            roleAdv.relation === 'advantage'
              ? ' (Role Unggul +25%!)'
              : roleAdv.relation === 'visual_aura'
              ? ' (Visual Aura +12%)'
              : '';
          setBattleLog(
            `${ROLES[actor.card.role].icon} ${actor.card.name} menerjang ${target.card.name}${roleNote}`
          );

          // Launch Elemental Projectile Beam & 3D Card Lunge before impact!
          const sideAllies = initialUnits.filter((u) => u.side === 0);
          const sideEnemies = initialUnits.filter((u) => u.side === 1);
          const fromIdx =
            actor.side === 0 ? sideAllies.indexOf(actor) : sideEnemies.indexOf(actor);
          const toIdx =
            target.side === 0 ? sideAllies.indexOf(target) : sideEnemies.indexOf(target);

          if (!skipFastRef.current) {
            setActiveProjectile({
              id: Date.now() + Math.random(),
              fromSide: actor.side,
              fromIndex: Math.max(0, fromIdx),
              toIndex: Math.max(0, toIdx),
              role: actor.card.role,
              color: actor.card.accentColor || '#38BDF8',
            });
            setUnits([...initialUnits]);
            await wait(190);
          }

          const dealt = applyDamage(target, rawDmg, actor, isCrit);
          setActiveProjectile(null);

          if (dealt > 0) {
            if (actor.card.abilityId === 'life') {
              const heal = Math.round(dealt * 0.32);
              actor.hp = Math.min(actor.maxHp, actor.hp + heal);
              setFloat(actor, `+${heal}`, '#34D399');
            }
            if (actor.card.abilityId === 'burn' && target.hp > 0) {
              target.burnTurns = 3;
              setFloat(target, '🔥 BURN', '#FB923C');
            }
            if (actor.card.abilityId === 'stun' && target.hp > 0 && Math.random() < 0.3) {
              target.stunTurns = 1;
              setFloat(target, '⚡ STUN', '#FBBF24');
            }
            if (actor.card.abilityId === 'aoe') {
              foes
                .filter((f) => f !== target)
                .slice(0, 2)
                .forEach((other) => applyDamage(other, rawDmg * 0.45, actor, false));
            }
            if (target.card.abilityId === 'ref' && actor.hp > 0) {
              applyDamage(actor, dealt * 0.28, null, false);
            }
          }

          if (actor.card.abilityId === 'heal') {
            const allies = initialUnits.filter((u) => u.side === actor.side && u.hp > 0);
            if (allies.length > 0) {
              const lowest = allies.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
              const healAmt = Math.round(lowest.maxHp * 0.14);
              lowest.hp = Math.min(lowest.maxHp, lowest.hp + healAmt);
              setFloat(lowest, `+${healAmt} HP`, '#34D399');
            }
          }

          if (actor.card.abilityId === 'battery') {
            actor.energy = Math.min(100, actor.energy + 20);
            const allies = initialUnits.filter(
              (u) => u.side === actor.side && u.hp > 0 && u !== actor
            );
            if (allies.length > 0) {
              const pickAlly = allies[Math.floor(Math.random() * allies.length)];
              pickAlly.energy = Math.min(100, pickAlly.energy + 20);
            }
          }

          actor.energy = Math.min(100, actor.energy + 34);
          if (actor.side === 0) {
            setHypeGauge((prev) => Math.min(100, prev + 16));
          }

          setUnits([...initialUnits]);
          await wait(440);
          actor.isActing = false;
          target.isHit = false;
          setUnits([...initialUnits]);
          if (!skipFastRef.current) {
            onCameraPhaseChange?.('idle');
          }
        }

        r += 1;
      }

      if (cancelled) return;
      onCameraPhaseChange?.('idle');

      // Determine Battle Outcome
      const survivingAllies = initialUnits.filter((u) => u.side === 0 && u.hp > 0);
      const survivingEnemies = initialUnits.filter((u) => u.side === 1 && u.hp > 0);
      const allyRemainingHp = survivingAllies.reduce((s, u) => s + u.hp, 0);
      const enemyRemainingHp = survivingEnemies.reduce((s, u) => s + u.hp, 0);

      const won =
        survivingAllies.length > 0 &&
        (survivingEnemies.length === 0 || allyRemainingHp >= enemyRemainingHp);

      if (won) {
        let starsEarned: 1 | 2 | 3 = 3;
        let coinsEarned = 0;
        let diamondsEarned = 0;
        let xpEarned = 0;
        let bonusPackGranted = false;

        if (isTowerBattle && towerInfo) {
          const isFirstTowerClear = towerFloor >= (saveState.towerFloor || 1);
          const casualties = Math.max(0, playerCards.length - survivingAllies.length);
          starsEarned = casualties === 0 ? 3 : casualties === 1 ? 2 : 1;
          coinsEarned = isFirstTowerClear
            ? towerInfo.rewardCoins
            : Math.round(towerInfo.rewardCoins * 0.5);
          diamondsEarned = isFirstTowerClear
            ? towerInfo.rewardDiamonds
            : Math.max(2, Math.round(towerInfo.rewardDiamonds * 0.25));
          xpEarned = isFirstTowerClear
            ? towerInfo.rewardXp
            : Math.round(towerInfo.rewardXp * 0.5);
          bonusPackGranted = isFirstTowerClear && towerInfo.grantsFreePack;
        } else {
          const isFirstClear = stageIndex === saveState.prog;
          const rewards = calculateBattleOutcomeRewards(
            stageIndex,
            playerCards.length,
            survivingAllies.length,
            isFirstClear
          );
          starsEarned = rewards.stars;
          coinsEarned = rewards.coinsEarned;
          diamondsEarned = rewards.diamondsEarned;
          xpEarned = rewards.xpEarned;
          bonusPackGranted = rewards.bonusPackGranted;
        }

        sound.playVictory();
        const resultPayload: BattleResultPayload = {
          stageIndex,
          won: true,
          stars: starsEarned,
          coinsEarned,
          diamondsEarned,
          xpEarned,
          bonusPackGranted,
          totalDamageDealt: totalDamageRef.current,
          roundsTaken: r,
          ultimatesUsed: ultimatesCountRef.current,
        };
        setOutcome(resultPayload);
        onBattleFinished(resultPayload);
      } else {
        sound.playDefeat();
        const resultPayload: BattleResultPayload = {
          stageIndex,
          won: false,
          stars: 0,
          coinsEarned: 15,
          diamondsEarned: 0,
          xpEarned: 10,
          bonusPackGranted: false,
          totalDamageDealt: totalDamageRef.current,
          roundsTaken: r,
          ultimatesUsed: ultimatesCountRef.current,
        };
        setOutcome(resultPayload);
        onBattleFinished(resultPayload);
      }
    };

    runBattleLoop();

    return () => {
      cancelled = true;
      onCameraPhaseChange?.('idle');
    };
  }, [stageIndex]);

  const allies = units.filter((u) => u.side === 0);
  const enemies = units.filter((u) => u.side === 1);

  const allyTotalHp = allies.reduce((s, u) => s + u.hp, 0);
  const allyMaxHp = Math.max(1, allies.reduce((s, u) => s + u.maxHp, 0));
  const enemyTotalHp = enemies.reduce((s, u) => s + u.hp, 0);
  const enemyMaxHp = Math.max(1, enemies.reduce((s, u) => s + u.maxHp, 0));

  const renderSlashVfx = (vfx?: { id: number; isCrit: boolean; color: string }) => {
    if (!vfx) return null;
    return (
      <div
        key={vfx.id}
        className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-visible"
      >
        <svg viewBox="0 0 120 120" className="w-32 h-32 drop-shadow-[0_0_12px_#FF4FA3] animate-ping">
          <line
            x1="15"
            y1="105"
            x2="105"
            y2="15"
            stroke={vfx.isCrit ? '#FDE047' : '#FF4FA3'}
            strokeWidth={vfx.isCrit ? '8' : '5'}
            strokeLinecap="round"
          />
          {vfx.isCrit && (
            <line
              x1="20"
              y1="25"
              x2="100"
              y2="95"
              stroke="#38BDF8"
              strokeWidth="5"
              strokeLinecap="round"
            />
          )}
          <circle
            cx="60"
            cy="60"
            r="38"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeDasharray="10 6"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-30 pointer-events-auto flex flex-col justify-between p-2 sm:p-4 md:p-6 bg-[#090A0F]/48 backdrop-blur-[2px] overflow-hidden select-none h-[100dvh]">
      {/* Top Arena Scoreboard Header */}
      <div className="w-full max-w-5xl mx-auto rounded-2xl bg-[#0D1120]/92 border border-white/15 px-3 py-2 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-2 shadow-2xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-2xl">{isTowerBattle ? '👑' : city.icon}</span>
          <div>
            <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 tabular-nums">
              {isTowerBattle
                ? `QUEENDOM TOWER · LANTAI ${towerFloor} · RND ${roundNum}`
                : `STAGE ${cityIdx + 1}-{subIdx + 1} · ${city.arenaName.toUpperCase()} · RND ${roundNum}`}
            </div>
            <div className="text-xs sm:text-base font-display font-extrabold text-white">
              {isTowerBattle && towerInfo
                ? towerInfo.title
                : subIdx === 4
                ? `HEADLINER BOSS ${city.name}`
                : stageMeta.title}
            </div>
          </div>
        </div>

        {/* Team Vitality Bars */}
        <div className="flex-1 min-w-[160px] max-w-md mx-auto grid grid-cols-2 gap-2 sm:gap-3 font-mono text-[10px] sm:text-xs tabular-nums">
          <div>
            <div className="flex justify-between text-emerald-400 font-bold mb-0.5">
              <span>UNIT KAMU</span>
              <span>{Math.round((allyTotalHp / allyMaxHp) * 100)}%</span>
            </div>
            <div className="h-2 sm:h-2.5 rounded-full bg-black/60 overflow-hidden border border-white/10">
              <div
                style={{ transform: `scaleX(${allyTotalHp / allyMaxHp})` }}
                className="h-full w-full origin-left bg-emerald-400 transition-transform duration-200"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-rose-400 font-bold mb-0.5">
              <span>RIVAL STAGE</span>
              <span>{Math.round((enemyTotalHp / enemyMaxHp) * 100)}%</span>
            </div>
            <div className="h-2 sm:h-2.5 rounded-full bg-black/60 overflow-hidden border border-white/10">
              <div
                style={{ transform: `scaleX(${enemyTotalHp / enemyMaxHp})` }}
                className="h-full w-full origin-left bg-rose-500 transition-transform duration-200"
              />
            </div>
          </div>
        </div>

        {/* Battle Controls: Speed (Default 1x) & Quick Resolve */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSpeed((s) => (s === 3 ? 1 : ((s + 1) as 1 | 2 | 3)))}
            className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#1A2138] hover:bg-[#232C4B] border border-white/15 font-mono font-bold text-[11px] sm:text-xs text-white cursor-pointer tabular-nums"
          >
            {speed}×
          </button>
          {!outcome && (
            <button
              type="button"
              onClick={() => {
                skipFastRef.current = true;
              }}
              className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] sm:text-xs cursor-pointer whitespace-nowrap"
            >
              ⚡ Cepat
            </button>
          )}
        </div>
      </div>

        {/* Main 5v5 Arena Stage (Fits 100% in 1 Viewport with Elemental Projectile Overlay & Lunge Physics) */}
      <div className="relative my-auto w-full max-w-6xl mx-auto flex flex-col items-center justify-between gap-2 sm:gap-3 py-1">
        {/* SVG Elemental Projectile Beam Overlay */}
        {activeProjectile && (
          <svg
            data-testid="battle-elemental-projectile"
            viewBox="0 0 1000 500"
            className="pointer-events-none absolute inset-0 w-full h-full z-40 overflow-visible"
          >
            <defs>
              <linearGradient id="projBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor={activeProjectile.color} />
                <stop offset="100%" stopColor="#FF4FA3" />
              </linearGradient>
            </defs>
            {(() => {
              const x1 = 120 + activeProjectile.fromIndex * 190;
              const y1 = activeProjectile.fromSide === 0 ? 390 : 110;
              const x2 = 120 + activeProjectile.toIndex * 190;
              const y2 = activeProjectile.fromSide === 0 ? 110 : 390;
              return (
                <g>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={activeProjectile.color}
                    strokeWidth="16"
                    strokeLinecap="round"
                    opacity="0.35"
                  />
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="url(#projBeamGrad)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray="18 8"
                  />
                  <circle cx={x2} cy={y2} r="28" fill={activeProjectile.color} opacity="0.45" />
                  <circle cx={x2} cy={y2} r="14" fill="#FFFFFF" />
                </g>
              );
            })()}
          </svg>
        )}

        {/* Floating Fan-Chant Lightstick Cheers */}
        {lightstickPulses.map((p) => (
          <div
            key={p.id}
            style={{ left: `${p.x}%` }}
            className="pointer-events-none absolute bottom-24 z-40 px-2.5 py-0.5 rounded-full bg-pink-500/30 border border-pink-300/60 text-[10px] font-mono font-black text-pink-200 animate-bounce shadow-lg"
          >
            {p.text}
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] font-mono text-slate-300 bg-black/55 px-3 py-0.5 rounded-full border border-white/10">
          <span>🎯 Ketuk kartu lawan untuk kunci target</span>
          <span className="text-white/25">·</span>
          <span className="text-pink-300 font-bold">
             응원 Tekan [SPACE] atau Tombol Lightstick untuk Boost Hype & +15% ATK!
          </span>
        </div>

        {/* Enemy Stage Row (5-column horizontal row) */}
        <div
          data-testid="battle-enemies-row"
          className="w-full grid grid-cols-5 gap-1.5 sm:gap-3 justify-items-center"
        >
          {enemies.map((u) => {
            const isFocused = focusedEnemyUid === u.uid;
            return (
              <div
                key={u.uid}
                onClick={() => {
                  if (u.hp > 0) setFocusedEnemyUid(u.uid);
                }}
                className={`relative flex flex-col items-center transition-all duration-200 cursor-pointer ${
                  u.hp <= 0
                    ? 'opacity-25 grayscale scale-90'
                    : u.isActing
                    ? 'translate-y-8 sm:translate-y-14 scale-115 sm:scale-125 -rotate-3 z-30 drop-shadow-[0_0_32px_rgba(244,63,94,0.95)]'
                    : u.isHit
                    ? '-translate-y-3 translate-x-2 rotate-6 scale-95 brightness-150'
                    : ''
                }`}
              >
                {isFocused && u.hp > 0 && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-rose-600 text-[8px] sm:text-[10px] font-mono font-extrabold text-white whitespace-nowrap z-30 shadow">
                    🎯 TARGET
                  </div>
                )}
                <Photocard3D
                  card={u.card}
                  level={u.level}
                  awakeningStars={u.awakeningStars}
                  size="xs"
                  isSelected={isFocused}
                  interactive3D={false}
                />
                {renderSlashVfx(u.slashVfx)}
                {/* HP & Energy Bars */}
                <div className="w-[62px] sm:w-40 mt-1 px-0.5 space-y-0.5">
                  <div className="h-1.5 sm:h-2 rounded bg-black/80 overflow-hidden border border-white/10">
                    <div
                      style={{ transform: `scaleX(${u.hp / u.maxHp})` }}
                      className="h-full w-full origin-left bg-rose-500 transition-transform duration-200"
                    />
                  </div>
                  <div className="h-1 sm:h-1.5 rounded bg-black/80 overflow-hidden">
                    <div
                      style={{ transform: `scaleX(${u.energy / 100})` }}
                      className="h-full w-full origin-left bg-amber-400 transition-transform duration-200"
                    />
                  </div>
                </div>
                {u.floatingText && (
                  <div
                    key={u.floatingText.id}
                    style={{ color: u.floatingText.color }}
                    className="pointer-events-none absolute inset-x-0 top-1/3 text-center font-display font-black text-xs sm:text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.98)] animate-bounce z-40"
                  >
                    {u.floatingText.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Center Live Commentary + Interactive Lightstick Boost + Encore Fever Bar */}
        <div className="w-full max-w-4xl my-0.5 px-3 py-2 rounded-2xl bg-[#0B0E1A]/94 border border-white/15 flex flex-wrap items-center justify-between gap-2 shadow-xl">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {fanChantBuffActive && (
              <span className="px-2 py-0.5 rounded-md bg-pink-500/25 border border-pink-400/50 text-[10px] font-mono font-extrabold text-pink-200 shrink-0">
                💖 FAN-CHANT +15% ATK
              </span>
            )}
            <div className="text-[11px] sm:text-sm font-bold text-white truncate">
              {battleLog}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Interactive Lightstick Fan-Chant Button */}
            <button
              type="button"
              data-testid="battle-lightstick-btn"
              disabled={!!outcome}
              onClick={triggerLightstickCheer}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/30 to-purple-500/30 hover:from-pink-500/45 hover:to-purple-500/45 border border-pink-400/50 text-pink-100 font-display font-extrabold text-[10px] sm:text-xs flex items-center gap-1.5 transition-transform active:scale-90 cursor-pointer shadow-[0_0_16px_rgba(255,79,163,0.35)]"
            >
              <span>🪄 Lightstick Boost</span>
              <span className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-[10px] text-amber-300 tabular-nums">
                +12% Hype ({fanChantCount})
              </span>
            </button>

            {/* Encore Fever Climax Button */}
            <button
              type="button"
              data-testid="battle-encore-btn"
              disabled={hypeGauge < 100 || !!outcome}
              onClick={() => {
                if (hypeGauge >= 100) {
                  pendingEncoreFeverRef.current = true;
                }
              }}
              className={`min-h-[38px] px-3 sm:px-4 py-1.5 rounded-xl font-display font-extrabold text-[10px] sm:text-xs tracking-wider transition-transform cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                hypeGauge >= 100
                  ? 'bg-[#FF4FA3] hover:bg-[#ff3395] text-white shadow-[0_0_20px_rgba(255,79,163,0.65)] scale-105'
                  : 'bg-[#171C30] text-slate-400 border border-white/10'
              }`}
            >
              {hypeGauge >= 100
                ? '🔥 ENCORE FEVER!'
                : `ENCORE: ${hypeGauge}%`}
            </button>
          </div>
        </div>

        {/* Player Stage Unit Row (5-column horizontal row with 3D Lunge) */}
        <div
          data-testid="battle-allies-row"
          className="w-full grid grid-cols-5 gap-1.5 sm:gap-3 justify-items-center"
        >
          {allies.map((u) => {
            const towerRoleBonus =
              isTowerBattle && towerInfo && u.card.role === towerInfo.benefitedRole ? 0.25 : 0;
            const allySynergyBonus = playerSynergy.totalBonus + towerRoleBonus;

            return (
              <div
                key={u.uid}
                className={`relative flex flex-col items-center transition-all duration-200 ${
                  u.hp <= 0
                    ? 'opacity-25 grayscale scale-90'
                    : u.isActing
                    ? '-translate-y-8 sm:-translate-y-14 scale-115 sm:scale-125 rotate-2 z-30 drop-shadow-[0_0_32px_rgba(56,189,248,0.95)]'
                    : u.isHit
                    ? 'translate-y-3 -translate-x-2 -rotate-6 scale-95 brightness-150'
                    : ''
                }`}
              >
                <Photocard3D
                  card={u.card}
                  effectiveRarity={saveState.cardRarity?.[u.card.id] ?? u.card.rarity}
                  rarityMask={saveState.cardRarityMask?.[u.card.id]}
                  level={u.level}
                  awakeningStars={u.awakeningStars}
                  synergyBonus={allySynergyBonus}
                  size="xs"
                  isBias={saveState.biasCardId === u.card.id}
                  decoFrame={saveState.cardDeco?.[u.card.id]}
                  gradeTier={saveState.cardGrades?.[u.card.id] || 0}
                  interactive3D={false}
                />
              {renderSlashVfx(u.slashVfx)}
              {/* HP & Energy Bars */}
              <div className="w-[62px] sm:w-40 mt-1 px-0.5 space-y-0.5">
                <div className="h-1.5 sm:h-2 rounded bg-black/80 overflow-hidden border border-white/10">
                  <div
                    style={{ transform: `scaleX(${u.hp / u.maxHp})` }}
                    className="h-full w-full origin-left bg-emerald-400 transition-transform duration-200"
                  />
                </div>
                <div className="h-1 sm:h-1.5 rounded bg-black/80 overflow-hidden">
                  <div
                    style={{ transform: `scaleX(${u.energy / 100})` }}
                    className="h-full w-full origin-left bg-sky-400 transition-transform duration-200"
                  />
                </div>
              </div>
              {u.floatingText && (
                <div
                  key={u.floatingText.id}
                  style={{ color: u.floatingText.color }}
                  className="pointer-events-none absolute inset-x-0 top-1/3 text-center font-display font-black text-xs sm:text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.98)] animate-bounce z-40"
                >
                  {u.floatingText.text}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* Cinematic Idol Portrait Ultimate Skill Cut-in Banner */}
      {ultimateCutIn && (
        <div
          style={{ borderColor: ultimateCutIn.color }}
          className="pointer-events-none fixed inset-x-0 top-1/2 -translate-y-1/2 z-40 py-5 px-6 bg-gradient-to-r from-black/95 via-[#150D2A]/95 to-black/95 border-y-4 shadow-[0_0_60px_rgba(255,79,163,0.7)] flex items-center justify-center gap-6 overflow-hidden"
        >
          {/* Idol Selca Cut-In Portrait */}
          <div
            style={{ borderColor: ultimateCutIn.color }}
            className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 shadow-2xl shrink-0 -rotate-3"
          >
            <img
              src={
                getCachedIdolImage(ultimateCutIn.card) ||
                getStylizedPortraitFallback(ultimateCutIn.card)
              }
              alt={ultimateCutIn.name}
              className="w-full h-full object-cover object-top"
            />
          </div>

          <div className="text-left">
            <div className="inline-block px-2.5 py-0.5 rounded bg-[#FF4FA3] text-[10px] font-mono font-black tracking-widest text-white">
              ⭐ CLIMAX ULTIMATE STAGE ⭐
            </div>
            <div className="text-2xl md:text-4xl font-display font-black text-white mt-1 tracking-tight drop-shadow-[0_2px_10px_rgba(255,79,163,0.9)]">
              {ultimateCutIn.skill}
            </div>
            <div className="text-sm md:text-base font-extrabold text-amber-300 mt-0.5">
              {ultimateCutIn.name}
            </div>
          </div>
        </div>
      )}

      {/* Single Focused Outcome Modal Card (Victory / Defeat) */}
      {outcome && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={outcome.won ? 'Kemenangan Konser' : 'Kekalahan Panggung'}
          className="fixed inset-0 z-50 bg-black/82 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#111524] border border-white/15 p-6 text-center shadow-2xl">
            <div className="text-xs font-mono tracking-widest text-slate-400">
              {isTowerBattle
                ? `QUEENDOM SURVIVAL TOWER · LANTAI ${towerFloor}`
                : `STAGE ${cityIdx + 1}-${subIdx + 1} · ${city.name.toUpperCase()}`}
            </div>
            <h2
              className={`text-3xl font-display font-extrabold mt-1 ${
                outcome.won ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {outcome.won
                ? isTowerBattle
                  ? `🏆 LANTAI ${towerFloor} CLEAR!`
                  : '🏆 STAGE CLEAR!'
                : '💀 DEFEAT'}
            </h2>

            {outcome.won && (
              <div className="text-3xl my-2 tracking-widest text-amber-400">
                {'⭐'.repeat(outcome.stars)}
              </div>
            )}

            {/* 3 Tabular Stat Tiles */}
            <div className="my-4 grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#090A0F] border border-white/10 font-mono tabular-nums">
              <div>
                <div className="text-[10px] text-slate-400">HADIAH STAGE</div>
                <div className="text-sm font-extrabold text-amber-400">
                  +{outcome.coinsEarned} 🪙{outcome.diamondsEarned > 0 ? ` · +${outcome.diamondsEarned} 💎` : ''}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">TOTAL DAMAGE</div>
                <div className="text-base font-extrabold text-sky-400">
                  {outcome.totalDamageDealt}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PUTARAN</div>
                <div className="text-base font-extrabold text-emerald-400">
                  {outcome.roundsTaken} Rnd
                </div>
              </div>
            </div>

            {outcome.bonusPackGranted && (
              <div className="mb-4 p-2.5 rounded-xl bg-[#FF4FA3]/20 border border-[#FF4FA3] text-xs font-bold text-white">
                🎁 BONUS BOSS CLEAR: +1 Tiket Pack ×5 Gratis!
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              {outcome.won &&
              (isTowerBattle || stageIndex + 1 < WORLD_TOUR_CITIES.length * 5) ? (
                <button
                  type="button"
                  data-start="true"
                  onClick={() => onNextStage(stageIndex + 1)}
                  className="px-6 py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-display font-extrabold text-sm cursor-pointer whitespace-nowrap"
                >
                  {isTowerBattle ? `NAIK KE LANTAI ${towerFloor + 1}` : 'STAGE BERIKUTNYA'}
                </button>
              ) : (
                <button
                  type="button"
                  data-start="true"
                  onClick={() => onRetryStage(stageIndex)}
                  className="px-6 py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-display font-extrabold text-sm cursor-pointer whitespace-nowrap"
                >
                  COBA LAGI
                </button>
              )}

              <button
                type="button"
                onClick={onCloseToTour}
                className="px-5 py-3 rounded-xl bg-[#1E253D] hover:bg-[#283150] text-slate-200 font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                {isTowerBattle ? 'Kembali ke Menara' : 'Peta World Tour'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

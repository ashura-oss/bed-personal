// Pure combat helper functions used by combat controllers.
import { findClassDamageRange } from "../constants/combatBalance.js";
import { createError } from "./errorCode.js";

const validPlayerActions = ["attack", "ability", "defend"];

// Resolve one complete round: player action first, then enemy counter if still alive.
export function resolveCombatTurn({
  session,
  character,
  enemy,
  actionType,
  ability = null,
  rng = Math.random
}) {
  validateCombatTurn({ session, actionType, ability });

  const playerAction = resolvePlayerAction({
    session,
    character,
    enemy,
    actionType,
    ability,
    rng
  });
  const playerHpAfterPlayer = Math.min(
    session.maxPlayerHp,
    session.playerHp + playerAction.healing
  );
  const enemyHpAfterPlayer = Math.max(session.enemyHp - playerAction.damage, 0);

  if (enemyHpAfterPlayer <= 0) {
    return {
      sessionUpdates: {
        enemyHp: 0,
        playerHp: playerHpAfterPlayer,
        status: "won",
        turnOwner: "complete",
        roundNumber: session.roundNumber
      },
      turnLogs: [
        {
          ...playerAction,
          playerHpAfter: playerHpAfterPlayer,
          enemyHpAfter: 0
        }
      ]
    };
  }

  const enemyAction = resolveEnemyAction({
    session,
    character,
    enemy,
    enemyHpAfterPlayer,
    damageReduction: playerAction.damageReduction,
    rng
  });
  const playerHpAfterEnemy = Math.max(playerHpAfterPlayer - enemyAction.damage, 0);
  const status = playerHpAfterEnemy <= 0 ? "lost" : "active";

  return {
    sessionUpdates: {
      enemyHp: enemyHpAfterPlayer,
      playerHp: playerHpAfterEnemy,
      status,
      turnOwner: status === "active" ? "player" : "complete",
      roundNumber: session.roundNumber + 1
    },
    turnLogs: [
      {
        ...playerAction,
        playerHpAfter: playerHpAfterPlayer,
        enemyHpAfter: enemyHpAfterPlayer
      },
      {
        ...enemyAction,
        playerHpAfter: playerHpAfterEnemy,
        enemyHpAfter: enemyHpAfterPlayer
      }
    ]
  };
}

// Validate turn input before calculating damage.
function validateCombatTurn({ session, actionType, ability }) {
  if (!session) {
    throw createError(404, "Not Found", "Combat session was not found.");
  }

  if (session.status !== "active") {
    throw createError(400, "Bad Request", "Combat session is already complete.");
  }

  if (!validPlayerActions.includes(actionType)) {
    throw createError(400, "Bad Request", "actionType must be attack, ability, or defend.");
  }

  if (actionType === "ability" && !ability) {
    throw createError(400, "Bad Request", "abilityId is required when actionType is ability.");
  }

  if (actionType !== "ability" && ability) {
    throw createError(400, "Bad Request", "abilityId can only be used with actionType ability.");
  }
}

// Build damage ranges from class, stats, equipment, level, and ability power.
export function buildPlayerDamageRange({ character, ability = null }) {
  const classDamage = findClassDamageRange(character.className);
  const classRange = classDamage?.damageRange || { min: 2, max: 5 };
  const scalingStat = classDamage?.scalingStat || "strength";
  const statValue = Number(character[scalingStat] || character.strength || 0);
  const levelBonus = Math.max(Number(character.level || 1) - 1, 0);
  const weaponRange = character.weaponDamageRange || { min: 0, max: 0 };
  const abilityRange = ability?.damageRange || buildPowerDamageRange(ability);
  const range = {
    min:
      classRange.min +
      Math.floor(statValue / 3) +
      Math.floor(levelBonus / 2) +
      weaponRange.min +
      abilityRange.min,
    max:
      classRange.max +
      Math.floor(statValue / 2) +
      levelBonus +
      weaponRange.max +
      abilityRange.max
  };

  return normalizeRange(range);
}

// Build enemy damage range.
export function buildEnemyDamageRange(enemy) {
  return normalizeRange(
    enemy.damageRange || {
      min: enemy.attackMin,
      max: enemy.attackMax
    }
  );
}

// Convert each possible player action into damage, healing, or defence.
function resolvePlayerAction({ session, character, enemy, actionType, ability, rng }) {
  if (actionType === "defend") {
    return {
      actor: "player",
      actionType,
      abilityId: null,
      damage: 0,
      healing: 0,
      damageReduction: 0.5,
      message: `${character.characterName} holds guard and reduces the next enemy strike.`
    };
  }

  if (actionType === "ability") {
    return resolveAbilityAction({ session, character, enemy, ability, rng });
  }

  const damageRange = buildPlayerDamageRange({ character });
  const damage = Math.max(1, roll(damageRange.min, damageRange.max, rng) - Number(enemy.defense || 0));

  return {
    actor: "player",
    actionType,
    abilityId: null,
    damage,
    healing: 0,
    damageReduction: 0,
    message: `${character.characterName} attacks for ${damage} damage.`
  };
}

// Resolve ability action.
function resolveAbilityAction({ session, character, enemy, ability, rng }) {
  if (ability.abilityType === "heal") {
    const healingRange = normalizeRange(
      ability.healingRange || {
        min: Number(ability.power || 0),
        max: Number(ability.power || 0)
      }
    );
    const healing = Math.min(
      roll(healingRange.min, healingRange.max, rng),
      session.maxPlayerHp - session.playerHp
    );

    return {
      actor: "player",
      actionType: "ability",
      abilityId: ability.abilityId,
      damage: 0,
      healing,
      damageReduction: 0,
      message: `${character.characterName} uses ${ability.name} and restores ${healing} HP.`
    };
  }

  if (ability.abilityType === "defend") {
    return {
      actor: "player",
      actionType: "ability",
      abilityId: ability.abilityId,
      damage: 0,
      healing: 0,
      damageReduction: 0.5,
      message: `${character.characterName} uses ${ability.name} and braces for the enemy turn.`
    };
  }

  if (ability.abilityType === "support" || ability.abilityType === "command") {
    return {
      actor: "player",
      actionType: "ability",
      abilityId: ability.abilityId,
      damage: 0,
      healing: 0,
      damageReduction: 0.25,
      message: `${character.characterName} uses ${ability.name} to strengthen the next exchange.`
    };
  }

  if (ability.abilityType !== "attack" && ability.abilityType !== "ultimate") {
    throw createError(400, "Bad Request", "Ability type cannot be used in combat.");
  }

  const damageRange = buildPlayerDamageRange({ character, ability });
  const damage = Math.max(1, roll(damageRange.min, damageRange.max, rng) - Number(enemy.defense || 0));

  return {
    actor: "player",
    actionType: "ability",
    abilityId: ability.abilityId,
    damage,
    healing: 0,
    damageReduction: 0,
    message: `${character.characterName} uses ${ability.name} for ${damage} damage.`
  };
}

// Resolve the enemy counterattack after the player acts.
function resolveEnemyAction({ character, enemy, enemyHpAfterPlayer, damageReduction, rng }) {
  const enemyDamageRange = buildEnemyDamageRange(enemy);
  const rawDamage = roll(enemyDamageRange.min, enemyDamageRange.max, rng);
  const reducedDamage =
    damageReduction > 0 ? Math.max(1, Math.floor(rawDamage * (1 - damageReduction))) : rawDamage;
  const damage = Math.max(1, reducedDamage - Number(character.defense || 0));

  return {
    actor: "enemy",
    actionType: "attack",
    abilityId: null,
    damage,
    message: `${enemy.name} counters with ${enemyHpAfterPlayer} HP remaining and deals ${damage} damage.`
  };
}

// Build a damage range from an ability power value.
function buildPowerDamageRange(ability) {
  if (!ability) {
    return { min: 0, max: 0 };
  }

  const power = Number(ability.power || 0);

  return {
    min: Math.floor(power / 2),
    max: power
  };
}

// Normalize a damage range so min and max are safe numbers.
function normalizeRange(range) {
  const min = Math.max(0, Number(range?.min || 0));
  const max = Math.max(min, Number(range?.max || min));

  return { min, max };
}

// Random rolls are isolated so tests can pass a predictable rng function.
function roll(min, max, rng) {
  const rollValue = Math.min(Math.max(rng(), 0), 0.999999);

  return Math.floor(rollValue * (max - min + 1)) + min;
}

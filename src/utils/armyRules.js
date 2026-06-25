import { ARMY_UNIT_DAMAGE_RANGES } from "../constants/combatBalance.js";

const strategyModifiers = {
  hold: 1,
  attack: 1.1,
  defend: 0.95,
  flank: 1.15,
  retreat: 0.75
};

const orderPower = {
  attack: 12,
  defend: 6,
  support: 8
};

export function resolveArmyBattle({
  armyState,
  encounter,
  equipmentBonus,
  orders = [],
  rng = Math.random
}) {
  const strategy = armyState.strategy || "hold";
  const strategyModifier = strategyModifiers[strategy] || 1;
  const orderResult = calculateOrderResult(orders);
  const troopDamage = calculateTroopDamage(armyState, rng);
  const basePower =
    troopDamage.total +
    armyState.morale +
    equipmentBonus.commandPower +
    equipmentBonus.morale +
    orderResult.powerBonus;
  const playerPower = Math.floor(basePower * strategyModifier);
  const enemyPower = rollEnemyPower(encounter, rng);
  const isSuccess = playerPower >= enemyPower;
  const baseLossRate = isSuccess ? 0.08 : 0.18;
  const lossRate = Math.max(0.03, baseLossRate - orderResult.lossReduction);
  const soldiersLost = Math.min(armyState.soldiers, Math.ceil(armyState.soldiers * lossRate));
  const archersLost = Math.min(armyState.archers, Math.ceil(armyState.archers * lossRate));
  const cavalryLost = Math.min(armyState.cavalry, Math.ceil(armyState.cavalry * lossRate));
  const moraleChange = isSuccess ? encounter.moraleReward : -12;

  return {
    outcome: isSuccess ? "success" : "failure",
    playerPower,
    enemyPower,
    strategy,
    orders,
    orderResult,
    troopDamage,
    losses: {
      soldiers: soldiersLost,
      archers: archersLost,
      cavalry: cavalryLost
    },
    moraleChange,
    armyUpdates: {
      soldiers: armyState.soldiers - soldiersLost,
      archers: armyState.archers - archersLost,
      cavalry: armyState.cavalry - cavalryLost,
      morale: Math.max(0, Math.min(100, armyState.morale + moraleChange)),
      strategy
    }
  };
}

function calculateTroopDamage(armyState, rng) {
  let total = 0;
  const units = {};

  for (const [unitType, unitDefinition] of Object.entries(ARMY_UNIT_DAMAGE_RANGES)) {
    const count = Number(armyState[unitType] || 0);
    const rollValue = roll(unitDefinition.damageRange.min, unitDefinition.damageRange.max, rng);
    const power = Math.floor((count * rollValue) / unitDefinition.divisor);

    units[unitType] = {
      count,
      roll: rollValue,
      power
    };
    total += power;
  }

  return {
    total,
    units
  };
}

function rollEnemyPower(encounter, rng) {
  const range = encounter.enemyPowerRange || {
    min: encounter.enemyPower,
    max: encounter.enemyPower
  };

  return roll(range.min, range.max, rng);
}

function calculateOrderResult(orders) {
  let powerBonus = 0;
  let lossReduction = 0;
  const orderedUnitTypes = [];

  for (const order of orders) {
    powerBonus += orderPower[order.command] || 0;

    if (order.command === "defend") {
      lossReduction += 0.02;
    }

    if (!orderedUnitTypes.includes(order.unitType)) {
      orderedUnitTypes.push(order.unitType);
    }
  }

  if (orderedUnitTypes.length >= 3) {
    powerBonus += 10;
  }

  return {
    powerBonus,
    lossReduction
  };
}

function roll(min, max, rng) {
  const rollValue = Math.min(Math.max(rng(), 0), 0.999999);

  return Math.floor(rollValue * (max - min + 1)) + min;
}

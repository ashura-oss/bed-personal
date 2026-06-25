import * as armyModel from "../models/armyModel.js";
import * as characterEquipmentModel from "../models/characterEquipmentModel.js";
import * as progressionModel from "../models/progressionModel.js";
import * as storyModel from "../models/storyModel.js";
import { findArmyEncounterById } from "../constants/armyEncounters.js";
import { resolveArmyBattle } from "../utils/armyRules.js";
import { calculateArmyEquipmentBonus } from "../utils/equipmentRules.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

const allowedStrategies = ["hold", "attack", "defend", "flank", "retreat"];
const allowedOrderUnitTypes = ["soldiers", "archers", "cavalry"];
const allowedOrderCommands = ["attack", "defend", "support"];

export async function getCharacterArmyState(req, res, next) {
  try {
    const armyState = await armyModel.findArmyStateByCharacterId(res.locals.character.characterId);

    res.locals.data = armyState || {
      characterId: res.locals.character.characterId,
      isUnlocked: 0,
      commandRank: "none",
      soldiers: 0,
      archers: 0,
      cavalry: 0,
      morale: 50,
      strategy: "hold"
    };
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function putCharacterArmyState(req, res, next) {
  try {
    const strategy = req.body?.strategy;

    if (strategy !== undefined && (typeof strategy !== "string" || !allowedStrategies.includes(strategy))) {
      throw createHttpError(400, "Bad Request", "strategy must be one of the allowed values.", {
        allowedStrategies
      });
    }

    const isUnlocked = req.body?.isUnlocked;
    const commandRank = req.body?.commandRank;
    const soldiers = req.body?.soldiers;
    const archers = req.body?.archers;
    const cavalry = req.body?.cavalry;
    const morale = req.body?.morale;

    if (isUnlocked !== undefined && (!Number.isInteger(isUnlocked) || isUnlocked < 0 || isUnlocked > 1)) {
      throw createHttpError(400, "Bad Request", "isUnlocked must be 0 or 1.");
    }

    if (commandRank !== undefined && (typeof commandRank !== "string" || commandRank.trim().length === 0)) {
      throw createHttpError(400, "Bad Request", "commandRank must be a non-empty string.");
    }

    if (soldiers !== undefined && (!Number.isInteger(soldiers) || soldiers < 0)) {
      throw createHttpError(400, "Bad Request", "soldiers must be a non-negative integer.");
    }

    if (archers !== undefined && (!Number.isInteger(archers) || archers < 0)) {
      throw createHttpError(400, "Bad Request", "archers must be a non-negative integer.");
    }

    if (cavalry !== undefined && (!Number.isInteger(cavalry) || cavalry < 0)) {
      throw createHttpError(400, "Bad Request", "cavalry must be a non-negative integer.");
    }

    if (morale !== undefined && (!Number.isInteger(morale) || morale < 0 || morale > 100)) {
      throw createHttpError(400, "Bad Request", "morale must be an integer from 0 to 100.");
    }

    const armyState = await armyModel.upsertArmyState({
      characterId: res.locals.character.characterId,
      isUnlocked,
      commandRank: commandRank?.trim(),
      soldiers,
      archers,
      cavalry,
      morale,
      strategy
    });

    res.locals.data = armyState;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function postCharacterArmyBattle(req, res, next) {
  try {
    const characterId = res.locals.character.characterId;
    const armyEncounterIdValue = req.body?.armyEncounterId;
    const strategy = req.body?.strategy;

    if (typeof armyEncounterIdValue !== "string" || armyEncounterIdValue.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "armyEncounterId is required.");
    }

    const armyEncounterId = armyEncounterIdValue.trim();

    if (strategy !== undefined && (typeof strategy !== "string" || !allowedStrategies.includes(strategy))) {
      throw createHttpError(400, "Bad Request", "strategy must be one of the allowed values.", {
        allowedStrategies
      });
    }

    const encounter = findArmyEncounterById(armyEncounterId);

    if (!encounter) {
      throw createHttpError(404, "Not Found", "Army encounter was not found.");
    }

    const orders = readArmyOrders(req.body, encounter);
    const armyState = await armyModel.findArmyStateByCharacterId(characterId);

    if (!armyState || armyState.isUnlocked !== 1) {
      throw createHttpError(400, "Bad Request", "Army command is not unlocked for this character.");
    }

    const progression = await progressionModel.findCharacterProgressionById(characterId);

    if (progression?.runState?.storyPhase !== encounter.requiredStoryPhase) {
      throw createHttpError(
        400,
        "Bad Request",
        `Army encounter requires storyPhase ${encounter.requiredStoryPhase}.`
      );
    }

    const equipment = await characterEquipmentModel.findEquipmentByCharacterId(characterId);
    const equipmentBonus = calculateArmyEquipmentBonus(equipment);
    const battleArmyState = {
      ...armyState,
      strategy: strategy || armyState.strategy
    };
    const battleResult = resolveArmyBattle({
      armyState: battleArmyState,
      encounter,
      equipmentBonus,
      orders
    });
    const savedArmyState = await armyModel.saveArmyBattleResult({
      characterId,
      battleResult
    });
    const storyResult =
      battleResult.outcome === "success"
        ? await storyModel.applyArmyVictoryStory({ characterId, encounter })
        : null;

    res.locals.data = {
      encounter,
      battleResult,
      equipmentBonus,
      armyState: savedArmyState,
      storyResult
    };
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

function readArmyOrders(body, encounter) {
  const orders = body?.orders;

  if (orders === undefined) {
    return [];
  }

  if (!Array.isArray(orders)) {
    throw createHttpError(400, "Bad Request", "orders must be an array when provided.");
  }

  if (orders.length > 6) {
    throw createHttpError(400, "Bad Request", "orders cannot contain more than 6 commands.");
  }

  const parsedOrders = [];

  for (const order of orders) {
    if (typeof order !== "object" || order === null) {
      throw createHttpError(400, "Bad Request", "Each army order must be an object.");
    }

    const unitType = order.unitType;
    const command = order.command;
    const target = order.target;

    if (typeof unitType !== "string" || unitType.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "unitType is required.");
    }

    if (typeof command !== "string" || command.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "command is required.");
    }

    if (typeof target !== "string" || target.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "target is required.");
    }

    if (!allowedOrderUnitTypes.includes(unitType)) {
      throw createHttpError(400, "Bad Request", "unitType must be soldiers, archers, or cavalry.");
    }

    if (!allowedOrderCommands.includes(command)) {
      throw createHttpError(400, "Bad Request", "command must be attack, defend, or support.");
    }

    if (!encounter.enemyForces.includes(target)) {
      throw createHttpError(400, "Bad Request", "target must match one of the encounter enemy forces.");
    }

    parsedOrders.push({ unitType, command, target });
  }

  return parsedOrders;
}

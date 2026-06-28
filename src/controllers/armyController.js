// Army controller functions read, save, and resolve army state.
// The controller checks story requirements before army models save battle outcomes.
import { ARMY_ENCOUNTER_DEFINITIONS, findArmyEncounterById } from "../constants/armyEncounters.js";
import * as armyModel from "../models/armyModel.js";
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import * as characterModel from "../models/characterModel.js";
import * as progressionModel from "../models/progressionModel.js";
import * as storyModel from "../models/storyModel.js";
import { resolveArmyBattle } from "../utils/armyRules.js";
import { calculateArmyEquipmentBonus } from "../utils/equipmentRules.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

const allowedStrategies = ["hold", "attack", "defend", "flank", "retreat"];
const allowedOrderUnitTypes = ["soldiers", "archers", "cavalry"];
const allowedOrderCommands = ["attack", "defend", "support"];

// ------------------------------------------------------------
// ARMY LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets all army encounter definitions, optionally filtered by story phase.
export async function getArmyEncounters(_req, res, next) {
  try {
    const { requiredStoryPhase } = res.locals;

    res.locals.data = ARMY_ENCOUNTER_DEFINITIONS.filter((encounter) => {
      if (
        requiredStoryPhase !== undefined &&
        encounter.requiredStoryPhase !== requiredStoryPhase
      ) {
        return false;
      }

      return true;
    }).sort((left, right) => left.name.localeCompare(right.name));
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one army encounter definition by id.
export async function getArmyEncounterById(_req, res, next) {
  try {
    const encounter = findArmyEncounterById(res.locals.armyEncounterId);

    if (!encounter) {
      throw createHttpError(404, "Not Found", "Army encounter definition was not found.");
    }

    res.locals.data = encounter;
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one character's current army state.
export async function getCharacterArmyState(_req, res, next) {
  try {
    const { characterId } = res.locals;

    await findRequiredCharacter(characterId);

    const armyState = await armyModel.findArmyStateByCharacterId(characterId);

    res.locals.data =
      armyState || {
        characterId,
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
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// ARMY BATTLE CONTROLLERS
// ------------------------------------------------------------

// Resolves one army encounter and applies story changes on victory.
export async function postCharacterArmyBattle(_req, res, next) {
  try {
    const { characterId, armyEncounterId, strategy } = res.locals;

    await findRequiredCharacter(characterId);
    validateStrategy(strategy);

    const encounter = findArmyEncounterById(armyEncounterId);

    if (!encounter) {
      throw createHttpError(404, "Not Found", "Army encounter was not found.");
    }

    const orders = readArmyOrders(res.locals.orders, encounter);
    const armyState = await armyModel.findArmyStateByCharacterId(characterId);

    if (!armyState || armyState.isUnlocked !== 1) {
      throw createHttpError(403, "Forbidden", "Army command is not unlocked for this character.");
    }

    const progression = await progressionModel.findCharacterProgressionById(characterId);

    if (progression?.runState?.storyPhase !== encounter.requiredStoryPhase) {
      throw createHttpError(
        403,
        "Forbidden",
        `Army encounter requires storyPhase ${encounter.requiredStoryPhase}.`
      );
    }

    const equipment = await characterInventoryModel.findEquipmentByCharacterId(characterId);
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
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// ARMY STATE CONTROLLERS
// ------------------------------------------------------------

// Saves controlled army state fields.
export async function putCharacterArmyState(_req, res, next) {
  try {
    const { characterId, strategy } = res.locals;

    await findRequiredCharacter(characterId);
    validateStrategy(strategy);

    res.locals.data = await armyModel.upsertArmyState({
      characterId,
      isUnlocked: res.locals.isUnlocked,
      commandRank: res.locals.commandRank,
      soldiers: res.locals.soldiers,
      archers: res.locals.archers,
      cavalry: res.locals.cavalry,
      morale: res.locals.morale,
      strategy
    });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Validates army strategy values when the request provides one.
function validateStrategy(strategy) {
  if (strategy !== undefined && !allowedStrategies.includes(strategy)) {
    throw createHttpError(400, "Bad Request", "strategy must be one of the allowed values.", {
      allowedStrategies
    });
  }
}

// Reads optional army orders and validates unit, command, and target.
function readArmyOrders(orders, encounter) {
  if (orders === undefined) {
    return [];
  }

  if (orders.length > 6) {
    throw createHttpError(400, "Bad Request", "orders cannot contain more than 6 commands.");
  }

  const parsedOrders = [];

  for (const order of orders) {
    if (typeof order !== "object" || order === null) {
      throw createHttpError(400, "Bad Request", "Each army order must be an object.");
    }

    const unitType = readRequiredOrderString(order, "unitType");
    const command = readRequiredOrderString(order, "command");
    const target = readRequiredOrderString(order, "target");

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

// Reads a required string from one nested army order object.
function readRequiredOrderString(order, fieldName) {
  const value = order[fieldName];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw createHttpError(400, "Bad Request", `${fieldName} is required for each army order.`);
  }

  return value.trim();
}

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}

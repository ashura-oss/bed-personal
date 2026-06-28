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
import {
  createHttpError,
  getOptionalInteger,
  getOptionalString,
  getRequiredIdParam,
  getRequiredString,
  sendErrorResponse
} from "../utils/requestHelpers.js";

const allowedStrategies = ["hold", "attack", "defend", "flank", "retreat"];
const allowedOrderUnitTypes = ["soldiers", "archers", "cavalry"];
const allowedOrderCommands = ["attack", "defend", "support"];

// ------------------------------------------------------------
// ARMY LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets all army encounter definitions, optionally filtered by story phase.
export async function getArmyEncounters(req, res) {
  try {
    const requiredStoryPhase = getOptionalString(req.query, "requiredStoryPhase");
    const encounters = ARMY_ENCOUNTER_DEFINITIONS.filter((encounter) => {
      if (
        requiredStoryPhase !== undefined &&
        encounter.requiredStoryPhase !== requiredStoryPhase
      ) {
        return false;
      }

      return true;
    }).sort((left, right) => left.name.localeCompare(right.name));

    return res.status(200).json({
      message: "Army encounters retrieved.",
      data: encounters
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one army encounter definition by id.
export async function getArmyEncounterById(req, res) {
  try {
    const encounter = findArmyEncounterById(req.params.armyEncounterId);

    if (!encounter) {
      throw createHttpError(404, "Not Found", "Army encounter definition was not found.");
    }

    return res.status(200).json({
      message: "Army encounter retrieved.",
      data: encounter
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one character's current army state.
export async function getCharacterArmyState(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");

    await findRequiredCharacter(characterId);

    const armyState = await armyModel.findArmyStateByCharacterId(characterId);

    return res.status(200).json({
      message: "Character army state retrieved.",
      data:
        armyState || {
          characterId,
          isUnlocked: 0,
          commandRank: "none",
          soldiers: 0,
          archers: 0,
          cavalry: 0,
          morale: 50,
          strategy: "hold"
        }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// ARMY BATTLE CONTROLLERS
// ------------------------------------------------------------

// Resolves one army encounter and applies story changes on victory.
export async function postCharacterArmyBattle(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const armyEncounterId = getRequiredString(req.body, "armyEncounterId");
    const strategy = getOptionalString(req.body, "strategy");

    await findRequiredCharacter(characterId);

    if (strategy !== undefined && !allowedStrategies.includes(strategy)) {
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

    return res.status(200).json({
      message: "Army battle resolved.",
      data: {
        encounter,
        battleResult,
        equipmentBonus,
        armyState: savedArmyState,
        storyResult
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// ARMY STATE CONTROLLERS
// ------------------------------------------------------------

// Saves controlled army state fields.
export async function putCharacterArmyState(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const strategy = getOptionalString(req.body, "strategy");

    await findRequiredCharacter(characterId);

    if (strategy !== undefined && !allowedStrategies.includes(strategy)) {
      throw createHttpError(400, "Bad Request", "strategy must be one of the allowed values.", {
        allowedStrategies
      });
    }

    const armyState = await armyModel.upsertArmyState({
      characterId,
      isUnlocked: getOptionalInteger(req.body, "isUnlocked", { min: 0, max: 1 }),
      commandRank: getOptionalString(req.body, "commandRank"),
      soldiers: getOptionalInteger(req.body, "soldiers", { min: 0 }),
      archers: getOptionalInteger(req.body, "archers", { min: 0 }),
      cavalry: getOptionalInteger(req.body, "cavalry", { min: 0 }),
      morale: getOptionalInteger(req.body, "morale", { min: 0, max: 100 }),
      strategy
    });

    return res.status(200).json({
      message: "Character army state saved.",
      data: armyState
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Reads optional army orders and validates unit, command, and target.
// Orders are request-only battle instructions, so they are checked before army math runs.
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

    const unitType = getRequiredString(order, "unitType");
    const command = getRequiredString(order, "command");
    const target = getRequiredString(order, "target");

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

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}

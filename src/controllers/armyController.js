// Army controller functions read, save, and resolve army state.
import * as armyModel from "../models/armyModel.js";
import * as characterEquipmentModel from "../models/characterEquipmentModel.js";
import * as progressionModel from "../models/progressionModel.js";
import * as storyModel from "../models/storyModel.js";
import { ARMY_ENCOUNTER_DEFINITIONS, findArmyEncounterById } from "../constants/armyEncounters.js";
import { resolveArmyBattle } from "../utils/armyRules.js";
import { calculateArmyEquipmentBonus } from "../utils/equipmentRules.js";

const allowedStrategies = ["hold", "attack", "defend", "flank", "retreat"];
const allowedOrderUnitTypes = ["soldiers", "archers", "cavalry"];
const allowedOrderCommands = ["attack", "defend", "support"];

// ------------------------------------------------------------
// ARMY ENCOUNTER READ CONTROLLERS
// ------------------------------------------------------------

// Return all army encounter definitions, optionally filtered by story phase.
export async function getArmyEncounters(req, res, next) {
  try {
    let requiredStoryPhase = req.query.requiredStoryPhase;

    if (requiredStoryPhase !== undefined) {
      if (typeof requiredStoryPhase !== "string" || requiredStoryPhase.trim().length === 0) {
        return res.status(400).json({ message: "requiredStoryPhase must be a non-empty string." });
      }

      requiredStoryPhase = requiredStoryPhase.trim();
    }

    const encounters = ARMY_ENCOUNTER_DEFINITIONS.filter((encounter) => {
      if (requiredStoryPhase !== undefined && encounter.requiredStoryPhase !== requiredStoryPhase) {
        return false;
      }

      return true;
    }).sort((left, right) => left.name.localeCompare(right.name));

    res.locals.data = encounters;
    next();
  } catch (error) {
    next(error);
  }
}

// Read one army encounter definition by id.
export async function getArmyEncounterById(req, res, next) {
  try {
    const encounter = findArmyEncounterById(req.params.armyEncounterId);

    if (!encounter) {
      return res.status(404).json({ message: "Army encounter definition was not found." });
    }

    res.locals.data = encounter;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// ARMY STATE READ CONTROLLERS
// ------------------------------------------------------------

// Read the current army state for one character.
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
    next(error);
  }
}

// ------------------------------------------------------------
// ARMY STATE SAVE CONTROLLERS
// ------------------------------------------------------------

// Save frontend-controlled army state fields.
export async function putCharacterArmyState(req, res, next) {
  try {
    const strategy = req.body?.strategy;

    if (strategy !== undefined && (typeof strategy !== "string" || !allowedStrategies.includes(strategy))) {
      return res.status(400).json({ message: "strategy must be one of the allowed values." });
    }

    const isUnlocked = req.body?.isUnlocked;
    const commandRank = req.body?.commandRank;
    const soldiers = req.body?.soldiers;
    const archers = req.body?.archers;
    const cavalry = req.body?.cavalry;
    const morale = req.body?.morale;

    if (isUnlocked !== undefined && (!Number.isInteger(isUnlocked) || isUnlocked < 0 || isUnlocked > 1)) {
      return res.status(400).json({ message: "isUnlocked must be 0 or 1." });
    }

    if (commandRank !== undefined && (typeof commandRank !== "string" || commandRank.trim().length === 0)) {
      return res.status(400).json({ message: "commandRank must be a non-empty string." });
    }

    if (soldiers !== undefined && (!Number.isInteger(soldiers) || soldiers < 0)) {
      return res.status(400).json({ message: "soldiers must be a non-negative integer." });
    }

    if (archers !== undefined && (!Number.isInteger(archers) || archers < 0)) {
      return res.status(400).json({ message: "archers must be a non-negative integer." });
    }

    if (cavalry !== undefined && (!Number.isInteger(cavalry) || cavalry < 0)) {
      return res.status(400).json({ message: "cavalry must be a non-negative integer." });
    }

    if (morale !== undefined && (!Number.isInteger(morale) || morale < 0 || morale > 100)) {
      return res.status(400).json({ message: "morale must be an integer from 0 to 100." });
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
    next(error);
  }
}

// ------------------------------------------------------------
// ARMY BATTLE ACTION CONTROLLERS
// ------------------------------------------------------------

// Resolve one army encounter and apply story changes on victory.
export async function postCharacterArmyBattle(req, res, next) {
  try {
    const characterId = res.locals.character.characterId;
    const armyEncounterIdValue = req.body?.armyEncounterId;
    const strategy = req.body?.strategy;

    if (typeof armyEncounterIdValue !== "string" || armyEncounterIdValue.trim().length === 0) {
      return res.status(400).json({ message: "armyEncounterId is required." });
    }

    const armyEncounterId = armyEncounterIdValue.trim();

    if (strategy !== undefined && (typeof strategy !== "string" || !allowedStrategies.includes(strategy))) {
      return res.status(400).json({ message: "strategy must be one of the allowed values." });
    }

    const encounter = findArmyEncounterById(armyEncounterId);

    if (!encounter) {
      return res.status(404).json({ message: "Army encounter was not found." });
    }

    const orders = readArmyOrders(req.body, encounter, res);

    if (!orders) {
      return;
    }
    const armyState = await armyModel.findArmyStateByCharacterId(characterId);

    if (!armyState || armyState.isUnlocked !== 1) {
      return res.status(400).json({ message: "Army command is not unlocked for this character." });
    }

    const progression = await progressionModel.findCharacterProgressionById(characterId);

    if (progression?.runState?.storyPhase !== encounter.requiredStoryPhase) {
      return res.status(400).json({ message: `Army encounter requires storyPhase ${encounter.requiredStoryPhase}.` });
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
    next(error);
  }
}

// ------------------------------------------------------------
// PRIVATE HELPERS
// ------------------------------------------------------------

// Validate optional battle orders sent by the frontend.
function readArmyOrders(body, encounter, res) {
  const orders = body?.orders;

  if (orders === undefined) {
    return [];
  }

  if (!Array.isArray(orders)) {
    res.status(400).json({ message: "orders must be an array when provided." });
    return null;
  }

  if (orders.length > 6) {
    res.status(400).json({ message: "orders cannot contain more than 6 commands." });
    return null;
  }

  const parsedOrders = [];

  for (const order of orders) {
    if (typeof order !== "object" || order === null) {
      res.status(400).json({ message: "Each army order must be an object." });
      return null;
    }

    const unitType = order.unitType;
    const command = order.command;
    const target = order.target;

    if (typeof unitType !== "string" || unitType.trim().length === 0) {
      res.status(400).json({ message: "unitType is required." });
      return null;
    }

    if (typeof command !== "string" || command.trim().length === 0) {
      res.status(400).json({ message: "command is required." });
      return null;
    }

    if (typeof target !== "string" || target.trim().length === 0) {
      res.status(400).json({ message: "target is required." });
      return null;
    }

    if (!allowedOrderUnitTypes.includes(unitType)) {
      res.status(400).json({ message: "unitType must be soldiers, archers, or cavalry." });
      return null;
    }

    if (!allowedOrderCommands.includes(command)) {
      res.status(400).json({ message: "command must be attack, defend, or support." });
      return null;
    }

    if (!encounter.enemyForces.includes(target)) {
      res.status(400).json({ message: "target must match one of the encounter enemy forces." });
      return null;
    }

    parsedOrders.push({ unitType, command, target });
  }

  return parsedOrders;
}

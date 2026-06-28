// Map controller functions read map data and move characters between nodes.
// Map definitions are constants; current character location is saved through models.
import { findEnemyDefinitionById } from "../constants/enemies.js";
import { MAP_NODE_DEFINITIONS, findMapNodeDefinitionById } from "../constants/mapNodes.js";
import * as characterModel from "../models/characterModel.js";
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import * as combatModel from "../models/combatModel.js";
import * as mapModel from "../models/mapModel.js";
import { applyEquipmentBonuses } from "../utils/equipmentRules.js";
import {
  createHttpError,
  getOptionalString,
  getRequiredId,
  getRequiredIdParam,
  getRequiredString,
  sendErrorResponse
} from "../utils/requestHelpers.js";

const START_NODE_ID = "node_hearthvale_square";

// ------------------------------------------------------------
// MAP LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets map definitions, optionally filtered by region.
export async function getMapNodes(req, res) {
  try {
    const regionId = getOptionalString(req.query, "regionId");
    let nodes = [...MAP_NODE_DEFINITIONS].sort((left, right) => left.positionX - right.positionX);

    if (regionId !== undefined) {
      nodes = nodes.filter((node) => node.regionId === regionId);
    }

    return res.status(200).json({
      message: "Map nodes retrieved.",
      data: nodes
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one map node definition by id.
export async function getMapNodeById(req, res) {
  try {
    const node = findMapNodeDefinitionById(req.params.nodeId);

    if (!node) {
      throw createHttpError(404, "Not Found", "Map node was not found.");
    }

    return res.status(200).json({
      message: "Map node retrieved.",
      data: node
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one character's current map location.
export async function getCharacterMapLocation(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");

    await findRequiredCharacter(characterId);

    const location = await findOrCreateReadableLocation(characterId);

    return res.status(200).json({
      message: "Character map location retrieved.",
      data: location
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// MAP TRAVEL CONTROLLERS
// ------------------------------------------------------------

// Moves one character only if the target node is connected and unlocked.
export async function postTravelToNode(req, res) {
  try {
    const characterId = getRequiredId(req.body, "characterId");
    const targetNodeId = getRequiredString(req.body, "targetNodeId");
    const character = await findRequiredCharacter(characterId);
    const currentLocation = await findOrCreateReadableLocation(characterId);
    const currentNode = findMapNodeDefinitionById(currentLocation.nodeId);
    const targetNode = findMapNodeDefinitionById(targetNodeId);
    const activeCombatSession = await combatModel.findActiveCombatSessionByCharacterId(characterId);

    if (activeCombatSession) {
      throw createHttpError(
        409,
        "Conflict",
        "Resolve the active combat session before travelling again."
      );
    }

    if (!targetNode) {
      throw createHttpError(404, "Not Found", "Target map node was not found.");
    }

    if (!currentNode.connectedNodeIds.includes(targetNode.nodeId)) {
      throw createHttpError(403, "Forbidden", "Target map node is not connected to the current node.");
    }

    const travelAccess = await mapModel.findNodeTravelAccess({ characterId, targetNode });

    if (!travelAccess.canTravel) {
      throw createHttpError(403, "Forbidden", "Target map node is locked by story progression.");
    }

    const location = await mapModel.moveCharacterToNode({ characterId, currentNode, targetNode });
    const travelEvent = await buildTravelEvent(character, targetNode);

    return res.status(200).json({
      message: "Travel resolved.",
      data: {
        location,
        fromNode: currentNode,
        toNode: targetNode,
        transitionEffect: targetNode.transitionEffect,
        travelEvent
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Creates a missing location at the starting node.
// This gives old or newly-created characters a safe starting map position.
async function findOrCreateReadableLocation(characterId) {
  const existingLocation = await mapModel.findCharacterLocation(characterId);

  if (existingLocation) {
    return existingLocation;
  }

  const startNode = findMapNodeDefinitionById(START_NODE_ID);

  if (!startNode) {
    throw createHttpError(500, "Internal Server Error", "Start map node was not seeded.");
  }

  return mapModel.moveCharacterToNode({ characterId, currentNode: startNode, targetNode: startNode });
}

// Builds the result returned after movement.
// Travel can return a normal movement result or an ambush combat session.
async function buildTravelEvent(character, targetNode) {
  if (targetNode.nodeType === "gathering") {
    const inventoryItem = await mapModel.addTravelInventoryReward({
      characterId: character.characterId,
      itemId: "item_iron_scrap",
      quantity: 2
    });

    return {
      eventType: "materials",
      message: "You recovered iron scrap from a hidden supply cache.",
      reward: inventoryItem
    };
  }

  if (targetNode.enemyId) {
    return {
      eventType: "boss",
      enemyId: targetNode.enemyId,
      questId: targetNode.questId,
      message: "A major enemy controls this area. Start a combat session with this encounter."
    };
  }

  if (targetNode.armyEncounterId) {
    return {
      eventType: "army",
      armyEncounterId: targetNode.armyEncounterId,
      message: "An army encounter blocks this route. Resolve the army battle to continue."
    };
  }

  if (targetNode.encounterEnemyId && shouldTriggerEncounter(targetNode)) {
    return createAmbushTravelEvent({ character, targetNode });
  }

  if (targetNode.travelDanger >= 2) {
    return {
      eventType: "ambush",
      enemyId: "enemy_road_patrol",
      message: "Enemy patrols are active on this route, but no combat started this time."
    };
  }

  return {
    eventType: "arrival",
    message: "The clouds fade and the new area is ready."
  };
}

// Creates an ambush combat session when travel triggers a random encounter.
// Equipment bonuses are applied before enemy HP and player HP are saved.
async function createAmbushTravelEvent({ character, targetNode }) {
  const enemy = findEnemyDefinitionById(targetNode.encounterEnemyId);

  if (!enemy) {
    throw createHttpError(500, "Internal Server Error", "Travel encounter enemy was not found.");
  }

  const equipment = await characterInventoryModel.findEquipmentByCharacterId(character.characterId);
  const combatCharacter = applyEquipmentBonuses(character, equipment);
  const combatSession = await combatModel.createCombatSession({
    characterId: character.characterId,
    enemyId: enemy.enemyId,
    questId: null,
    regionId: enemy.regionId,
    nodeId: targetNode.nodeId,
    playerHp: combatCharacter.hp,
    enemyHp: enemy.maxHp
  });

  return {
    eventType: "ambush",
    enemyId: enemy.enemyId,
    combatSession,
    message: `${enemy.name} intercepts the route. Resolve the combat session before moving on.`
  };
}

// Decides whether travel should trigger a random encounter.
// Nodes without an encounter enemy never trigger combat.
function shouldTriggerEncounter(targetNode) {
  const encounterChance = Number(targetNode.encounterChance || 0);

  if (encounterChance <= 0) {
    return false;
  }

  if (encounterChance >= 100) {
    return true;
  }

  return Math.random() * 100 < encounterChance;
}

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}

// Map controller functions read map data and move characters between nodes.
import * as characterEquipmentModel from "../models/characterEquipmentModel.js";
import * as combatModel from "../models/combatModel.js";
import * as mapModel from "../models/mapModel.js";
import { findEnemyDefinitionById } from "../constants/enemies.js";
import { MAP_NODE_DEFINITIONS, findMapNodeDefinitionById } from "../constants/mapNodes.js";
import { applyEquipmentBonuses } from "../utils/equipmentRules.js";
import { createError, sendError } from "../utils/errorCode.js";

const START_NODE_ID = "node_hearthvale_square";

// Return map definitions, optionally filtered by region.
export async function getMapNodes(req, res, next) {
  try {
    let regionId = req.query.regionId;

    if (regionId !== undefined) {
      if (typeof regionId !== "string" || regionId.trim().length === 0) {
        throw createError(400, "Bad Request", "regionId must be a non-empty string.");
      }

      regionId = regionId.trim();
    }

    let nodes = [...MAP_NODE_DEFINITIONS].sort((left, right) => left.positionX - right.positionX);

    if (regionId !== undefined) {
      nodes = nodes.filter((node) => node.regionId === regionId);
    }

    res.locals.data = nodes;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Read one map node definition by id.
export async function getMapNodeById(req, res, next) {
  try {
    const node = findMapNodeDefinitionById(req.params.nodeId);

    if (!node) {
      throw createError(404, "Not Found", "Map node was not found.");
    }

    res.locals.data = node;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Get character map location.
export async function getCharacterMapLocation(req, res, next) {
  try {
    const characterId = res.locals.character.characterId;
    const location = await findOrCreateReadableLocation(characterId);

    res.locals.data = location;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Move a character only if the target node is connected and unlocked.
export async function postTravelToNode(req, res, next) {
  try {
    const character = res.locals.character;
    const characterId = character.characterId;
    const targetNodeIdValue = req.body?.targetNodeId;

    if (typeof targetNodeIdValue !== "string" || targetNodeIdValue.trim().length === 0) {
      throw createError(400, "Bad Request", "targetNodeId is required.");
    }

    const targetNodeId = targetNodeIdValue.trim();
    const currentLocation = await findOrCreateReadableLocation(characterId);
    const currentNode = findMapNodeDefinitionById(currentLocation.nodeId);
    const targetNode = findMapNodeDefinitionById(targetNodeId);
    const activeCombatSession = await combatModel.findActiveCombatSessionByCharacterId(characterId);

    if (activeCombatSession) {
      throw createError(
        409,
        "Conflict",
        "Resolve the active combat session before travelling again.",
        { combatSessionId: activeCombatSession.combatSessionId }
      );
    }

    if (!targetNode) {
      throw createError(404, "Not Found", "Target map node was not found.");
    }

    if (!currentNode.connectedNodeIds.includes(targetNode.nodeId)) {
      throw createError(400, "Bad Request", "Target map node is not connected to the current node.");
    }

    const travelAccess = await mapModel.findNodeTravelAccess({ characterId, targetNode });

    if (!travelAccess.canTravel) {
      throw createError(
        403,
        "Forbidden",
        "Target map node is locked by story progression."
      );
    }

    const location = await mapModel.moveCharacterToNode({ characterId, currentNode, targetNode });
    const travelEvent = await buildTravelEvent(character, targetNode);

    res.locals.data = {
      location,
      fromNode: currentNode,
      toNode: targetNode,
      transitionEffect: targetNode.transitionEffect,
      travelEvent
    };
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// A missing location is created at the starting node.
async function findOrCreateReadableLocation(characterId) {
  const existingLocation = await mapModel.findCharacterLocation(characterId);

  if (existingLocation) {
    return existingLocation;
  }

  const startNode = findMapNodeDefinitionById(START_NODE_ID);

  if (!startNode) {
    throw createError(500, "Internal Server Error", "Start map node was not seeded.");
  }

  return mapModel.moveCharacterToNode({ characterId, currentNode: startNode, targetNode: startNode });
}

// Build the result shown by the frontend after movement.
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

// Create ambush travel event.
async function createAmbushTravelEvent({ character, targetNode }) {
  const enemy = findEnemyDefinitionById(targetNode.encounterEnemyId);

  if (!enemy) {
    throw createError(500, "Internal Server Error", "Travel encounter enemy was not found.");
  }

  const equipment = await characterEquipmentModel.findEquipmentByCharacterId(character.characterId);
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

// Decide whether travel should trigger a random encounter.
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

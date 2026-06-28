// Map model functions read and save character location rows.
// Map node definitions stay in constants; this file stores the character's current node.
import { and, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterInventory, characterLocations, characterRegionStates } from "../db/schema.js";

// ------------------------------------------------------------
// DATABASE READS
// ------------------------------------------------------------

// Find one character's current map location row.
// Returns null for a new character that has not travelled yet.
export async function findCharacterLocation(characterId) {
  const result = await db
    .select({
      characterLocationId: characterLocations.id,
      characterId: characterLocations.characterId,
      regionId: characterLocations.regionKey,
      nodeId: characterLocations.nodeKey,
      previousNodeId: characterLocations.previousNodeKey,
      updatedAt: characterLocations.updatedAt
    })
    .from(characterLocations)
    .where(eq(characterLocations.characterId, characterId))
    .limit(1);

  return result[0] || null;
}

// Check whether one character can travel to a map node.
// Uses saved region unlock state when the target node is not open by default.
export async function findNodeTravelAccess({ characterId, targetNode }) {
  if (targetNode.isUnlocked === 1) {
    return {
      canTravel: true,
      reason: null
    };
  }

  const regionStateResult = await db
    .select({
      isUnlocked: characterRegionStates.isUnlocked
    })
    .from(characterRegionStates)
    .where(
      and(
        eq(characterRegionStates.characterId, characterId),
        eq(characterRegionStates.regionKey, targetNode.regionId)
      )
    )
    .limit(1);
  const regionState = regionStateResult[0] || null;

  if (regionState?.isUnlocked === 1) {
    return {
      canTravel: true,
      reason: null
    };
  }

  return {
    canTravel: false,
    reason: "locked_region"
  };
}

// ------------------------------------------------------------
// DATABASE WRITES
// ------------------------------------------------------------

// Save one character's current map node after travel.
// Keeps the current and previous node so the game can show where the player moved from.
export async function moveCharacterToNode({ characterId, currentNode, targetNode }) {
  const now = new Date();
  const existingLocation = await findCharacterLocation(characterId);
  let locationResult;

  if (existingLocation) {
    locationResult = await db
      .update(characterLocations)
      .set({
        regionKey: targetNode.regionId,
        nodeKey: targetNode.nodeId,
        previousNodeKey: currentNode.nodeId,
        updatedAt: now
      })
      .where(eq(characterLocations.id, existingLocation.characterLocationId))
      .returning({
        characterLocationId: characterLocations.id,
        characterId: characterLocations.characterId,
        regionId: characterLocations.regionKey,
        nodeId: characterLocations.nodeKey,
        previousNodeId: characterLocations.previousNodeKey,
        updatedAt: characterLocations.updatedAt
      });
  } else {
    locationResult = await db
      .insert(characterLocations)
      .values({
        characterId,
        regionKey: targetNode.regionId,
        nodeKey: targetNode.nodeId,
        previousNodeKey: currentNode.nodeId,
        updatedAt: now
      })
      .returning({
        characterLocationId: characterLocations.id,
        characterId: characterLocations.characterId,
        regionId: characterLocations.regionKey,
        nodeId: characterLocations.nodeKey,
        previousNodeId: characterLocations.previousNodeKey,
        updatedAt: characterLocations.updatedAt
      });
  }

  return locationResult[0];
}

// Add travel reward items into one character's inventory.
// Used when travel grants supplies/materials after a successful move.
export async function addTravelInventoryReward({ characterId, itemId, quantity }) {
  const now = new Date();
  const existing = await findInventoryItem(characterId, itemId);
  const nextQuantity = Number(existing?.quantity || 0) + quantity;
  let result;

  if (existing) {
    result = await db
      .update(characterInventory)
      .set({
        quantity: nextQuantity,
        updatedAt: now
      })
      .where(eq(characterInventory.id, existing.characterInventoryId))
      .returning({
        characterInventoryId: characterInventory.id,
        characterId: characterInventory.characterId,
        itemId: characterInventory.itemKey,
        quantity: characterInventory.quantity,
        acquiredAt: characterInventory.acquiredAt,
        updatedAt: characterInventory.updatedAt
      });
  } else {
    result = await db
      .insert(characterInventory)
      .values({
        characterId,
        itemKey: itemId,
        quantity: nextQuantity,
        acquiredAt: now,
        updatedAt: now
      })
      .returning({
        characterInventoryId: characterInventory.id,
        characterId: characterInventory.characterId,
        itemId: characterInventory.itemKey,
        quantity: characterInventory.quantity,
        acquiredAt: characterInventory.acquiredAt,
        updatedAt: characterInventory.updatedAt
      });
  }

  return result[0];
}

// ------------------------------------------------------------
// PRIVATE HELPERS
// ------------------------------------------------------------

// Find one inventory item helper row by character and item.
// Private helper because it is only needed inside map reward saving.
async function findInventoryItem(characterId, itemId) {
  const result = await db
    .select({
      characterInventoryId: characterInventory.id,
      characterId: characterInventory.characterId,
      itemId: characterInventory.itemKey,
      quantity: characterInventory.quantity,
      acquiredAt: characterInventory.acquiredAt,
      updatedAt: characterInventory.updatedAt
    })
    .from(characterInventory)
    .where(and(eq(characterInventory.characterId, characterId), eq(characterInventory.itemKey, itemId)))
    .limit(1);

  return result[0] || null;
}

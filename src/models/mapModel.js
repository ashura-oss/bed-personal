// Map model functions read and save character location rows.
import { and, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterInventory, characterLocations, characterRegionStates } from "../db/schema.js";

// Find character location.
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

// Find node travel access.
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

// Move a character to a new map node.
export async function moveCharacterToNode({ characterId, currentNode, targetNode }) {
  const now = new Date();
  const existingLocation = await findCharacterLocation(characterId);
  const query = existingLocation
    ? db
        .update(characterLocations)
        .set({
          regionKey: targetNode.regionId,
          nodeKey: targetNode.nodeId,
          previousNodeKey: currentNode.nodeId,
          updatedAt: now
        })
        .where(eq(characterLocations.id, existingLocation.characterLocationId))
    : db.insert(characterLocations).values({
        characterId,
        regionKey: targetNode.regionId,
        nodeKey: targetNode.nodeId,
        previousNodeKey: currentNode.nodeId,
        updatedAt: now
      });
  const locationResult = await query
    .returning({
      characterLocationId: characterLocations.id,
      characterId: characterLocations.characterId,
      regionId: characterLocations.regionKey,
      nodeId: characterLocations.nodeKey,
      previousNodeId: characterLocations.previousNodeKey,
      updatedAt: characterLocations.updatedAt
    });

  return locationResult[0];
}

// Add an inventory reward found during travel.
export async function addTravelInventoryReward({ characterId, itemId, quantity }) {
  const now = new Date();
  const existing = await findInventoryItem(characterId, itemId);
  const nextQuantity = Number(existing?.quantity || 0) + quantity;
  const query = existing
    ? db
        .update(characterInventory)
        .set({
          quantity: nextQuantity,
          updatedAt: now
        })
        .where(eq(characterInventory.id, existing.characterInventoryId))
    : db.insert(characterInventory).values({
        characterId,
        itemKey: itemId,
        quantity: nextQuantity,
        acquiredAt: now,
        updatedAt: now
      });
  const result = await query
    .returning({
      characterInventoryId: characterInventory.id,
      characterId: characterInventory.characterId,
      itemId: characterInventory.itemKey,
      quantity: characterInventory.quantity,
      acquiredAt: characterInventory.acquiredAt,
      updatedAt: characterInventory.updatedAt
    });

  return result[0];
}

// Find inventory item.
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

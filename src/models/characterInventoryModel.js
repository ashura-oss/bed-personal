// Character inventory model functions read and save inventory and equipment rows.
// Item definitions stay in constants; this file stores owned items and equipped slots.
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterEquipment, characterInventory, characterRunStates, characters } from "../db/schema.js";

// ------------------------------------------------------------
// INVENTORY AND EQUIPMENT LOOKUPS
// ------------------------------------------------------------

// Find every inventory item owned by one character.
// Used by inventory endpoints and the full state endpoint.
export function findInventoryByCharacterId(characterId) {
  return db
    .select({
      characterInventoryId: characterInventory.id,
      characterId: characterInventory.characterId,
      itemId: characterInventory.itemKey,
      quantity: characterInventory.quantity,
      acquiredAt: characterInventory.acquiredAt,
      updatedAt: characterInventory.updatedAt
    })
    .from(characterInventory)
    .where(eq(characterInventory.characterId, characterId))
    .orderBy(asc(characterInventory.itemKey));
}

// Find one inventory item row for one character.
// Used before adding, removing, equipping, or consuming an item.
export async function findInventoryItemByCharacterId(characterId, itemId) {
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
    .where(
      and(eq(characterInventory.characterId, characterId), eq(characterInventory.itemKey, itemId))
    )
    .limit(1);

  return result[0] || null;
}

// Find all equipped items for one character.
// Returns only saved equipment slots; item details are added from constants in controllers.
export function findEquipmentByCharacterId(characterId) {
  return db
    .select({
      characterEquipmentId: characterEquipment.id,
      characterId: characterEquipment.characterId,
      equipmentSlot: characterEquipment.equipmentSlot,
      itemId: characterEquipment.itemKey,
      equippedAt: characterEquipment.equippedAt
    })
    .from(characterEquipment)
    .where(eq(characterEquipment.characterId, characterId))
    .orderBy(asc(characterEquipment.equipmentSlot));
}

// ------------------------------------------------------------
// INVENTORY AND EQUIPMENT SAVES
// ------------------------------------------------------------

// Insert or update one inventory item quantity.
// This keeps one row per character and item instead of duplicating the same item.
export async function upsertInventoryItem({ characterId, itemId, quantity }) {
  const now = new Date();
  const existing = await findInventoryItemByCharacterId(characterId, itemId);
  let result;

  if (existing) {
    result = await db
      .update(characterInventory)
      .set({
        quantity,
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
        quantity,
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

// Insert or update one equipped item slot.
// Each slot should point to the latest item equipped in that slot.
export async function upsertEquipment({ characterId, equipmentSlot, itemId }) {
  const now = new Date();
  const existingResult = await db
    .select({
      characterEquipmentId: characterEquipment.id
    })
    .from(characterEquipment)
    .where(
      and(
        eq(characterEquipment.characterId, characterId),
        eq(characterEquipment.equipmentSlot, equipmentSlot)
      )
    )
    .limit(1);
  const existing = existingResult[0] || null;
  let result;

  if (existing) {
    result = await db
      .update(characterEquipment)
      .set({
        itemKey: itemId,
        equippedAt: now
      })
      .where(eq(characterEquipment.id, existing.characterEquipmentId))
      .returning({
        characterEquipmentId: characterEquipment.id,
        characterId: characterEquipment.characterId,
        equipmentSlot: characterEquipment.equipmentSlot,
        itemId: characterEquipment.itemKey,
        equippedAt: characterEquipment.equippedAt
      });
  } else {
    result = await db
      .insert(characterEquipment)
      .values({
        characterId,
        equipmentSlot,
        itemKey: itemId,
        equippedAt: now
      })
      .returning({
        characterEquipmentId: characterEquipment.id,
        characterId: characterEquipment.characterId,
        equipmentSlot: characterEquipment.equipmentSlot,
        itemId: characterEquipment.itemKey,
        equippedAt: characterEquipment.equippedAt
      });
  }

  return result[0];
}

// Consume an item and apply its saved-game effect in one transaction.
// This keeps inventory quantity and character/run-state effects together.
export async function consumeInventoryItem({ characterId, item }) {
  return db.transaction(async (tx) => {
    const inventoryResult = await tx
      .select({
        characterInventoryId: characterInventory.id,
        characterId: characterInventory.characterId,
        itemId: characterInventory.itemKey,
        quantity: characterInventory.quantity,
        acquiredAt: characterInventory.acquiredAt,
        updatedAt: characterInventory.updatedAt
      })
      .from(characterInventory)
      .where(
        and(
          eq(characterInventory.characterId, characterId),
          eq(characterInventory.itemKey, item.itemId)
        )
      )
      .limit(1);
    const inventoryItem = inventoryResult[0] || null;

    if (!inventoryItem || inventoryItem.quantity < 1) {
      return {
        consumed: false,
        reason: "missing_item",
        inventoryItem: null,
        character: null,
        runState: null,
        effects: item.consumeEffect || {}
      };
    }

    const nextQuantity = inventoryItem.quantity - 1;
    let updatedInventoryItem = null;

    if (nextQuantity > 0) {
      const updatedInventoryResult = await tx
        .update(characterInventory)
        .set({
          quantity: nextQuantity,
          updatedAt: new Date()
        })
        .where(eq(characterInventory.id, inventoryItem.characterInventoryId))
        .returning({
          characterInventoryId: characterInventory.id,
          characterId: characterInventory.characterId,
          itemId: characterInventory.itemKey,
          quantity: characterInventory.quantity,
          acquiredAt: characterInventory.acquiredAt,
          updatedAt: characterInventory.updatedAt
        });

      updatedInventoryItem = updatedInventoryResult[0] || null;
    } else {
      await tx
        .delete(characterInventory)
        .where(eq(characterInventory.id, inventoryItem.characterInventoryId));
    }

    let character = null;
    let runState = null;
    const effects = item.consumeEffect || {};

    if (effects.hp !== undefined) {
      const currentCharacterResult = await tx
        .select({
          characterId: characters.id,
          userId: characters.userId,
          characterName: characters.characterName,
          origin: characters.origin,
          className: characters.className,
          affinity: characters.affinity,
          level: characters.level,
          xp: characters.xp,
          hp: characters.hp,
          strength: characters.strength,
          intelligence: characters.intelligence,
          agility: characters.agility,
          faith: characters.faith,
          endurance: characters.endurance,
          charisma: characters.charisma,
          createdAt: characters.createdAt
        })
        .from(characters)
        .where(eq(characters.id, characterId))
        .limit(1);
      const currentCharacter = currentCharacterResult[0] || null;

      if (currentCharacter) {
        const characterResult = await tx
          .update(characters)
          .set({
            hp: currentCharacter.hp + effects.hp
          })
          .where(eq(characters.id, characterId))
          .returning({
            characterId: characters.id,
            userId: characters.userId,
            characterName: characters.characterName,
            origin: characters.origin,
            className: characters.className,
            affinity: characters.affinity,
            level: characters.level,
            xp: characters.xp,
            hp: characters.hp,
            strength: characters.strength,
            intelligence: characters.intelligence,
            agility: characters.agility,
            faith: characters.faith,
            endurance: characters.endurance,
            charisma: characters.charisma,
            createdAt: characters.createdAt
          });

        character = characterResult[0] || null;
      }
    }

    if (effects.supplies !== undefined) {
      const now = new Date();
      const existingRunStateResult = await tx
        .select({
          characterId: characterRunStates.characterId,
          supplies: characterRunStates.supplies,
          morale: characterRunStates.morale,
          storyPhase: characterRunStates.storyPhase,
          commandModeUnlocked: characterRunStates.commandModeUnlocked,
          savedAt: characterRunStates.savedAt
        })
        .from(characterRunStates)
        .where(eq(characterRunStates.characterId, characterId))
        .limit(1);
      const existingRunState = existingRunStateResult[0] || null;
      const nextRunState = {
        characterId,
        supplies: (existingRunState?.supplies ?? 3) + effects.supplies,
        morale: existingRunState?.morale ?? 50,
        storyPhase: existingRunState?.storyPhase ?? "village_rebellion",
        commandModeUnlocked: existingRunState?.commandModeUnlocked ?? 0,
        savedAt: now
      };
      let runStateResult;

      if (existingRunState) {
        runStateResult = await tx
          .update(characterRunStates)
          .set({
            supplies: nextRunState.supplies,
            morale: nextRunState.morale,
            storyPhase: nextRunState.storyPhase,
            commandModeUnlocked: nextRunState.commandModeUnlocked,
            savedAt: now
          })
          .where(eq(characterRunStates.characterId, characterId))
          .returning({
            characterId: characterRunStates.characterId,
            supplies: characterRunStates.supplies,
            morale: characterRunStates.morale,
            storyPhase: characterRunStates.storyPhase,
            commandModeUnlocked: characterRunStates.commandModeUnlocked,
            savedAt: characterRunStates.savedAt
          });
      } else {
        runStateResult = await tx
          .insert(characterRunStates)
          .values(nextRunState)
          .returning({
            characterId: characterRunStates.characterId,
            supplies: characterRunStates.supplies,
            morale: characterRunStates.morale,
            storyPhase: characterRunStates.storyPhase,
            commandModeUnlocked: characterRunStates.commandModeUnlocked,
            savedAt: characterRunStates.savedAt
          });
      }

      runState = runStateResult[0] || null;
    }

    return {
      consumed: true,
      reason: null,
      inventoryItem: updatedInventoryItem,
      character,
      runState,
      effects
    };
  });
}

// ------------------------------------------------------------
// INVENTORY AND EQUIPMENT REMOVALS
// ------------------------------------------------------------

// Delete one inventory item row.
// Used when the player intentionally removes an item from inventory.
export async function removeInventoryItem({ characterId, itemId }) {
  const result = await db
    .delete(characterInventory)
    .where(
      and(eq(characterInventory.characterId, characterId), eq(characterInventory.itemKey, itemId))
    )
    .returning({
      characterInventoryId: characterInventory.id,
      characterId: characterInventory.characterId,
      itemId: characterInventory.itemKey,
      quantity: characterInventory.quantity,
      acquiredAt: characterInventory.acquiredAt,
      updatedAt: characterInventory.updatedAt
    });

  return result[0] || null;
}

// Delete one equipped item slot.
// Used when the player unequips an item from a specific slot.
export async function removeEquipment({ characterId, equipmentSlot }) {
  const result = await db
    .delete(characterEquipment)
    .where(
      and(
        eq(characterEquipment.characterId, characterId),
        eq(characterEquipment.equipmentSlot, equipmentSlot)
      )
    )
    .returning({
      characterEquipmentId: characterEquipment.id,
      characterId: characterEquipment.characterId,
      equipmentSlot: characterEquipment.equipmentSlot,
      itemId: characterEquipment.itemKey,
      equippedAt: characterEquipment.equippedAt
    });

  return result[0] || null;
}

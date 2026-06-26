// Character inventory model functions read and save inventory and equipment rows.
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterEquipment, characterInventory, characterRunStates, characters } from "../db/schema.js";

// ------------------------------------------------------------
// DATABASE READS
// ------------------------------------------------------------

// Find every inventory item owned by one character.
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
// DATABASE WRITES
// ------------------------------------------------------------

// Insert, update, or clear one inventory item quantity.
export async function upsertInventoryItem({ characterId, itemId, quantity }) {
  const now = new Date();
  const existing = await findInventoryItemByCharacterId(characterId, itemId);
  const query = existing
    ? db
        .update(characterInventory)
        .set({
          quantity,
          updatedAt: now
        })
        .where(eq(characterInventory.id, existing.characterInventoryId))
    : db.insert(characterInventory).values({
        characterId,
        itemKey: itemId,
        quantity,
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

// Insert or update one equipped item slot.
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
  const query = existing
    ? db
        .update(characterEquipment)
        .set({
          itemKey: itemId,
          equippedAt: now
        })
        .where(eq(characterEquipment.id, existing.characterEquipmentId))
    : db.insert(characterEquipment).values({
        characterId,
        equipmentSlot,
        itemKey: itemId,
        equippedAt: now
      });
  const result = await query.returning({
    characterEquipmentId: characterEquipment.id,
    characterId: characterEquipment.characterId,
    equipmentSlot: characterEquipment.equipmentSlot,
    itemId: characterEquipment.itemKey,
    equippedAt: characterEquipment.equippedAt
  });

  return result[0];
}

// Consume an item and apply its saved-game effect in one transaction.
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
      const runStateQuery = existingRunState
        ? tx
            .update(characterRunStates)
            .set({
              supplies: nextRunState.supplies,
              morale: nextRunState.morale,
              storyPhase: nextRunState.storyPhase,
              commandModeUnlocked: nextRunState.commandModeUnlocked,
              savedAt: now
            })
            .where(eq(characterRunStates.characterId, characterId))
        : tx.insert(characterRunStates).values(nextRunState);
      const runStateResult = await runStateQuery.returning({
        characterId: characterRunStates.characterId,
        supplies: characterRunStates.supplies,
        morale: characterRunStates.morale,
        storyPhase: characterRunStates.storyPhase,
        commandModeUnlocked: characterRunStates.commandModeUnlocked,
        savedAt: characterRunStates.savedAt
      });

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
// DATABASE DELETES
// ------------------------------------------------------------

// Delete one inventory item row.
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

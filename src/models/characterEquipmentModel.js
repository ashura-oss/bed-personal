// Character equipment model functions read and save equipped items.
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterEquipment } from "../db/schema.js";

// ------------------------------------------------------------
// DATABASE READS
// ------------------------------------------------------------

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
  const result = await query
    .returning({
      characterEquipmentId: characterEquipment.id,
      characterId: characterEquipment.characterId,
      equipmentSlot: characterEquipment.equipmentSlot,
      itemId: characterEquipment.itemKey,
      equippedAt: characterEquipment.equippedAt
    });

  return result[0];
}

// ------------------------------------------------------------
// DATABASE DELETES
// ------------------------------------------------------------

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

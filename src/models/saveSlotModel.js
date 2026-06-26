// Save slot model functions read and save user save slots.
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { saveSlots } from "../db/schema.js";

// ------------------------------------------------------------
// DATABASE READS
// ------------------------------------------------------------

// Find all save slot rows for one user.
export function findSaveSlotsByUserId(userId) {
  return db
    .select({
      saveSlotId: saveSlots.id,
      userId: saveSlots.userId,
      characterId: saveSlots.characterId,
      slotIndex: saveSlots.slotIndex,
      slotName: saveSlots.slotName,
      createdAt: saveSlots.createdAt,
      updatedAt: saveSlots.updatedAt,
      lastPlayedAt: saveSlots.lastPlayedAt
    })
    .from(saveSlots)
    .where(eq(saveSlots.userId, userId))
    .orderBy(asc(saveSlots.slotIndex));
}

// ------------------------------------------------------------
// DATABASE WRITES
// ------------------------------------------------------------

// Insert or update one user save slot row.
export async function upsertSaveSlot({ userId, characterId = null, slotIndex, slotName }) {
  const now = new Date();
  const existingResult = await db
    .select({
      saveSlotId: saveSlots.id
    })
    .from(saveSlots)
    .where(and(eq(saveSlots.userId, userId), eq(saveSlots.slotIndex, slotIndex)))
    .limit(1);
  const existing = existingResult[0] || null;
  const query = existing
    ? db
        .update(saveSlots)
        .set({
          characterId,
          slotName,
          updatedAt: now,
          lastPlayedAt: now
        })
        .where(eq(saveSlots.id, existing.saveSlotId))
    : db.insert(saveSlots).values({
        userId,
        characterId,
        slotIndex,
        slotName,
        createdAt: now,
        updatedAt: now,
        lastPlayedAt: now
      });
  const result = await query
    .returning({
      saveSlotId: saveSlots.id,
      userId: saveSlots.userId,
      characterId: saveSlots.characterId,
      slotIndex: saveSlots.slotIndex,
      slotName: saveSlots.slotName,
      createdAt: saveSlots.createdAt,
      updatedAt: saveSlots.updatedAt,
      lastPlayedAt: saveSlots.lastPlayedAt
    });

  return result[0];
}

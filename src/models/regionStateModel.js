// Region state model functions read and save region progress rows.
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterRegionStates } from "../db/schema.js";

// Find region states by character id.
export function findRegionStatesByCharacterId(characterId) {
  return db
    .select({
      characterRegionStateId: characterRegionStates.id,
      characterId: characterRegionStates.characterId,
      regionId: characterRegionStates.regionKey,
      isUnlocked: characterRegionStates.isUnlocked,
      isDiscovered: characterRegionStates.isDiscovered,
      threatLevel: characterRegionStates.threatLevel,
      worldState: characterRegionStates.worldState,
      updatedAt: characterRegionStates.updatedAt
    })
    .from(characterRegionStates)
    .where(eq(characterRegionStates.characterId, characterId))
    .orderBy(asc(characterRegionStates.regionKey));
}

// Find region state by character id.
export async function findRegionStateByCharacterId(characterId, regionId) {
  return findRegionState(characterId, regionId);
}

// Insert or update region state.
export async function upsertRegionState({
  characterId,
  regionId,
  isUnlocked,
  isDiscovered,
  threatLevel,
  worldState
}) {
  const now = new Date();
  const existing = await findRegionState(characterId, regionId);
  const nextIsUnlocked = isUnlocked ?? existing?.isUnlocked ?? 0;
  const nextIsDiscovered = isDiscovered ?? existing?.isDiscovered ?? 0;
  const nextThreatLevel = threatLevel ?? existing?.threatLevel ?? 0;
  const nextWorldState = worldState ?? existing?.worldState ?? "stable";
  const query = existing
    ? db
        .update(characterRegionStates)
        .set({
          isUnlocked: nextIsUnlocked,
          isDiscovered: nextIsDiscovered,
          threatLevel: nextThreatLevel,
          worldState: nextWorldState,
          updatedAt: now
        })
        .where(eq(characterRegionStates.id, existing.characterRegionStateId))
    : db.insert(characterRegionStates).values({
        characterId,
        regionKey: regionId,
        isUnlocked: nextIsUnlocked,
        isDiscovered: nextIsDiscovered,
        threatLevel: nextThreatLevel,
        worldState: nextWorldState,
        updatedAt: now
      });
  const result = await query
    .returning({
      characterRegionStateId: characterRegionStates.id,
      characterId: characterRegionStates.characterId,
      regionId: characterRegionStates.regionKey,
      isUnlocked: characterRegionStates.isUnlocked,
      isDiscovered: characterRegionStates.isDiscovered,
      threatLevel: characterRegionStates.threatLevel,
      worldState: characterRegionStates.worldState,
      updatedAt: characterRegionStates.updatedAt
    });

  return result[0];
}

// Find region state.
async function findRegionState(characterId, regionId) {
  const result = await db
    .select({
      characterRegionStateId: characterRegionStates.id,
      characterId: characterRegionStates.characterId,
      regionId: characterRegionStates.regionKey,
      isUnlocked: characterRegionStates.isUnlocked,
      isDiscovered: characterRegionStates.isDiscovered,
      threatLevel: characterRegionStates.threatLevel,
      worldState: characterRegionStates.worldState,
      updatedAt: characterRegionStates.updatedAt
    })
    .from(characterRegionStates)
    .where(
      and(
        eq(characterRegionStates.characterId, characterId),
        eq(characterRegionStates.regionKey, regionId)
      )
    )
    .limit(1);

  return result[0] || null;
}

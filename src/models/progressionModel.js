import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { characterRunStates, characters } from "../db/schema.js";

const characterProgressionColumns = {
  id: characters.id,
  characterId: characters.id,
  userId: characters.userId,
  level: characters.level,
  xp: characters.xp,
  hp: characters.hp,
  createdAt: characters.createdAt
};

const characterRunStateColumns = {
  id: characterRunStates.id,
  characterId: characterRunStates.characterId,
  schemaVersion: characterRunStates.schemaVersion,
  embers: characterRunStates.embers,
  flaskCharges: characterRunStates.flaskCharges,
  lastCheckpointX: characterRunStates.lastCheckpointX,
  lastCheckpointY: characterRunStates.lastCheckpointY,
  lastCheckpointZ: characterRunStates.lastCheckpointZ,
  savedAt: characterRunStates.savedAt
};

export async function findCharacterProgressionById(characterId) {
  const characterResult = await db
    .select(characterProgressionColumns)
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);

  if (!characterResult[0]) {
    return null;
  }

  const runStateResult = await db
    .select(characterRunStateColumns)
    .from(characterRunStates)
    .where(eq(characterRunStates.characterId, characterId))
    .limit(1);

  return {
    character: characterResult[0],
    runState: runStateResult[0] || null
  };
}

export async function saveCharacterProgression({
  characterId,
  characterUpdates,
  runStateUpdates
}) {
  return db.transaction(async (tx) => {
    const characterResult =
      Object.keys(characterUpdates).length > 0
        ? await tx
            .update(characters)
            .set(characterUpdates)
            .where(eq(characters.id, characterId))
            .returning(characterProgressionColumns)
        : await tx
            .select(characterProgressionColumns)
            .from(characters)
            .where(eq(characters.id, characterId))
            .limit(1);

    const runStateResult =
      runStateUpdates !== null
        ? await tx
            .insert(characterRunStates)
            .values(runStateUpdates)
            .onConflictDoUpdate({
              target: characterRunStates.characterId,
              set: {
                schemaVersion: runStateUpdates.schemaVersion,
                embers: runStateUpdates.embers,
                flaskCharges: runStateUpdates.flaskCharges,
                lastCheckpointX: runStateUpdates.lastCheckpointX,
                lastCheckpointY: runStateUpdates.lastCheckpointY,
                lastCheckpointZ: runStateUpdates.lastCheckpointZ,
                savedAt: runStateUpdates.savedAt
              }
            })
            .returning(characterRunStateColumns)
        : await tx
            .select(characterRunStateColumns)
            .from(characterRunStates)
            .where(eq(characterRunStates.characterId, characterId))
            .limit(1);

    return {
      character: characterResult[0] || null,
      runState: runStateResult[0] || null
    };
  });
}

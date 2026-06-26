// Progression model functions read and save character progression rows.
import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterRunStates, characters } from "../db/schema.js";

// Find character progression by id.
export async function findCharacterProgressionById(characterId) {
  const characterResult = await db
    .select({
      characterId: characters.id,
      userId: characters.userId,
      level: characters.level,
      xp: characters.xp,
      hp: characters.hp,
      createdAt: characters.createdAt
    })
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);

  if (!characterResult[0]) {
    return null;
  }

  const runStateResult = await db
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

  return {
    character: characterResult[0],
    runState: runStateResult[0] || null
  };
}

// Save character progression.
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
            .returning({
              characterId: characters.id,
              userId: characters.userId,
              level: characters.level,
              xp: characters.xp,
              hp: characters.hp,
              createdAt: characters.createdAt
            })
        : await tx
            .select({
              characterId: characters.id,
              userId: characters.userId,
              level: characters.level,
              xp: characters.xp,
              hp: characters.hp,
              createdAt: characters.createdAt
            })
            .from(characters)
            .where(eq(characters.id, characterId))
            .limit(1);

    let runStateResult;

    if (runStateUpdates !== null) {
      const existingRunStateResult = await tx
        .select({
          characterId: characterRunStates.characterId
        })
        .from(characterRunStates)
        .where(eq(characterRunStates.characterId, characterId))
        .limit(1);
      const existingRunState = existingRunStateResult[0] || null;
      const runStateQuery = existingRunState
        ? tx
            .update(characterRunStates)
            .set({
              supplies: runStateUpdates.supplies,
              morale: runStateUpdates.morale,
              storyPhase: runStateUpdates.storyPhase,
              commandModeUnlocked: runStateUpdates.commandModeUnlocked,
              savedAt: runStateUpdates.savedAt
            })
            .where(eq(characterRunStates.characterId, characterId))
        : tx.insert(characterRunStates).values(runStateUpdates);

      runStateResult = await runStateQuery.returning({
        characterId: characterRunStates.characterId,
        supplies: characterRunStates.supplies,
        morale: characterRunStates.morale,
        storyPhase: characterRunStates.storyPhase,
        commandModeUnlocked: characterRunStates.commandModeUnlocked,
        savedAt: characterRunStates.savedAt
      });
    } else {
      runStateResult = await tx
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
    }

    return {
      character: characterResult[0] || null,
      runState: runStateResult[0] || null
    };
  });
}

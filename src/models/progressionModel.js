// Progression model functions read and save character progression rows.
// Level calculations are done in utils, while this file saves the resulting values.
import { and, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterQuestCompletions, characterRunStates, characters } from "../db/schema.js";
import { buildCharacterProgression } from "../utils/leveling.js";

// ------------------------------------------------------------
// DATABASE READS
// ------------------------------------------------------------

// Find one character with run state and quest completion progress.
// Used by progression endpoints to show the player's saved campaign status.
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

// ------------------------------------------------------------
// DATABASE WRITES
// ------------------------------------------------------------

// Save character stats and run state changes together.
// The transaction keeps character stats and run-state values from drifting apart.
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

      if (existingRunState) {
        runStateResult = await tx
          .update(characterRunStates)
          .set({
            supplies: runStateUpdates.supplies,
            morale: runStateUpdates.morale,
            storyPhase: runStateUpdates.storyPhase,
            commandModeUnlocked: runStateUpdates.commandModeUnlocked,
            savedAt: runStateUpdates.savedAt
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
          .values(runStateUpdates)
          .returning({
            characterId: characterRunStates.characterId,
            supplies: characterRunStates.supplies,
            morale: characterRunStates.morale,
            storyPhase: characterRunStates.storyPhase,
            commandModeUnlocked: characterRunStates.commandModeUnlocked,
            savedAt: characterRunStates.savedAt
          });
      }
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

// Claim a character quest completion inside one transaction.
// Inserts the completion and applies XP once, so the same quest cannot reward repeatedly.
export async function claimCharacterQuestCompletion({ characterId, questReward }) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const existingCompletion = await findQuestCompletionInTransaction(
      tx,
      characterId,
      questReward.questId
    );

    if (existingCompletion) {
      const currentCharacter = await findCharacterInTransaction(tx, characterId);

      return {
        awarded: false,
        awardedXp: 0,
        character: currentCharacter,
        questCompletion: existingCompletion,
        characterProgression: null
      };
    }

    const insertedCompletionResult = await tx
      .insert(characterQuestCompletions)
      .values({
        characterId,
        questKey: questReward.questId,
        rewardXp: questReward.rewardXp,
        awardedAt: now
      })
      .returning({
        characterQuestCompletionId: characterQuestCompletions.id,
        characterId: characterQuestCompletions.characterId,
        questId: characterQuestCompletions.questKey,
        rewardXp: characterQuestCompletions.rewardXp,
        awardedAt: characterQuestCompletions.awardedAt
      });
    const insertedCompletion = insertedCompletionResult[0] || null;

    if (!insertedCompletion) {
      const currentCharacter = await findCharacterInTransaction(tx, characterId);

      return {
        awarded: false,
        awardedXp: 0,
        character: currentCharacter,
        questCompletion: existingCompletion,
        characterProgression: null
      };
    }

    const currentCharacter = await findCharacterInTransaction(tx, characterId);
    const characterProgression = buildCharacterProgression(
      currentCharacter,
      questReward.rewardXp
    );
    const updatedCharacterResult = await tx
      .update(characters)
      .set(characterProgression.updates)
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

    return {
      awarded: true,
      awardedXp: questReward.rewardXp,
      character: updatedCharacterResult[0] || null,
      questCompletion: insertedCompletion,
      characterProgression: characterProgression.summary
    };
  });
}

// ------------------------------------------------------------
// PRIVATE HELPERS
// ------------------------------------------------------------

// Find one character row inside an existing transaction.
// Private helper used when calculating quest reward updates.
async function findCharacterInTransaction(tx, characterId) {
  const result = await tx
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

  return result[0] || null;
}

// Find one quest completion row inside an existing transaction.
// Private helper used to block duplicate quest completion rewards.
async function findQuestCompletionInTransaction(tx, characterId, questId) {
  const result = await tx
    .select({
      characterQuestCompletionId: characterQuestCompletions.id,
      characterId: characterQuestCompletions.characterId,
      questId: characterQuestCompletions.questKey,
      rewardXp: characterQuestCompletions.rewardXp,
      awardedAt: characterQuestCompletions.awardedAt
    })
    .from(characterQuestCompletions)
    .where(
      and(
        eq(characterQuestCompletions.characterId, characterId),
        eq(characterQuestCompletions.questKey, questId)
      )
    )
    .limit(1);

  return result[0] || null;
}

// Quest completion model functions read and save completed quest rows.
import { and, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterQuestCompletions, characters } from "../db/schema.js";
import { buildCharacterProgression } from "../utils/leveling.js";

// Claim a character quest completion inside one transaction.
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
      const currentCharacter = await findCharacterInTransaction(
        tx,
        characterId
      );

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

// Find character in transaction.
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

// Find quest completion in transaction.
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

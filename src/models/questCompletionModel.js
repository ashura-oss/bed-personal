import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { characterQuestCompletions, characters } from "../db/schema.js";
import { generateId } from "../utils/id.js";
import { buildCharacterProgression } from "../utils/leveling.js";

export const HEARTHMERE_LOCAL_QUEST_REWARDS = Object.freeze({
  "hearthmere.tessa_gather": Object.freeze({
    questId: "hearthmere.tessa_gather",
    regionId: "hearthmere",
    title: "Fuel for the Emberwright",
    rewardXp: 35
  }),
  "hearthmere.road_that_still_stands": Object.freeze({
    questId: "hearthmere.road_that_still_stands",
    regionId: "hearthmere",
    title: "The Road That Still Stands",
    rewardXp: 30
  }),
  "hearthmere.aldric_hollow": Object.freeze({
    questId: "hearthmere.aldric_hollow",
    regionId: "hearthmere",
    title: "Thin the Hollow Ranks",
    rewardXp: 45
  }),
  "hearthmere.marn_supply": Object.freeze({
    questId: "hearthmere.marn_supply",
    regionId: "hearthmere",
    title: "Supplies for the Road",
    rewardXp: 40
  }),
  "hearthmere.survivor_rite": Object.freeze({
    questId: "hearthmere.survivor_rite",
    regionId: "hearthmere",
    title: "The Mending Rite",
    rewardXp: 90
  }),
  "hearthmere.brek_mine": Object.freeze({
    questId: "hearthmere.brek_mine",
    regionId: "hearthmere",
    title: "Clear Copperstone Mine",
    rewardXp: 60
  })
});

const characterColumns = {
  characterId: characters.characterId,
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
};

const questCompletionColumns = {
  characterQuestCompletionId: characterQuestCompletions.characterQuestCompletionId,
  characterId: characterQuestCompletions.characterId,
  questId: characterQuestCompletions.questId,
  rewardXp: characterQuestCompletions.rewardXp,
  awardedAt: characterQuestCompletions.awardedAt
};

export function findHearthmereLocalQuestReward(questId) {
  const normalizedQuestId = typeof questId === "string" ? questId.trim() : "";

  return normalizedQuestId ? HEARTHMERE_LOCAL_QUEST_REWARDS[normalizedQuestId] ?? null : null;
}

export async function claimCharacterQuestCompletion({ characterId, questReward }) {
  return db.transaction(async (tx) => {
    const now = new Date().toISOString();
    const insertedCompletionResult = await tx
      .insert(characterQuestCompletions)
      .values({
        characterQuestCompletionId: generateId("char_quest_completion"),
        characterId,
        questId: questReward.questId,
        rewardXp: questReward.rewardXp,
        awardedAt: now
      })
      .onConflictDoNothing()
      .returning(questCompletionColumns);

    const insertedCompletion = insertedCompletionResult[0] || null;

    if (!insertedCompletion) {
      const existingCompletion = await findQuestCompletionInTransaction(
        tx,
        characterId,
        questReward.questId
      );
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
      .where(eq(characters.characterId, characterId))
      .returning(characterColumns);

    return {
      awarded: true,
      awardedXp: questReward.rewardXp,
      character: updatedCharacterResult[0] || null,
      questCompletion: insertedCompletion,
      characterProgression: characterProgression.summary
    };
  });
}

async function findCharacterInTransaction(tx, characterId) {
  const result = await tx
    .select(characterColumns)
    .from(characters)
    .where(eq(characters.characterId, characterId))
    .limit(1);

  return result[0] || null;
}

async function findQuestCompletionInTransaction(tx, characterId, questId) {
  const result = await tx
    .select(questCompletionColumns)
    .from(characterQuestCompletions)
    .where(
      and(
        eq(characterQuestCompletions.characterId, characterId),
        eq(characterQuestCompletions.questId, questId)
      )
    )
    .limit(1);

  return result[0] || null;
}

import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { characterQuestCompletions, characters } from "../db/schema.js";
import { buildCharacterProgression } from "../utils/leveling.js";

export const MORDOR_LOCAL_QUEST_REWARDS = Object.freeze({
  "mordor.war_stock": Object.freeze({
    questId: "mordor.war_stock",
    regionId: "mordor",
    title: "War Stock for the March",
    rewardXp: 35
  }),
  "mordor.black_road_reclamation": Object.freeze({
    questId: "mordor.black_road_reclamation",
    regionId: "mordor",
    title: "Reclaim the Black Road",
    rewardXp: 30
  }),
  "mordor.ring_touched_cull": Object.freeze({
    questId: "mordor.ring_touched_cull",
    regionId: "mordor",
    title: "Cull the Ring-Touched",
    rewardXp: 45
  }),
  "mordor.warforge_supply": Object.freeze({
    questId: "mordor.warforge_supply",
    regionId: "mordor",
    title: "Warforge Supply",
    rewardXp: 40
  }),
  "mordor.first_ring_trace": Object.freeze({
    questId: "mordor.first_ring_trace",
    regionId: "mordor",
    title: "Claim the First Ring-Trace",
    rewardXp: 90
  }),
  "mordor.gorgoroth_mine": Object.freeze({
    questId: "mordor.gorgoroth_mine",
    regionId: "mordor",
    title: "Reclaim Gorgoroth Mine",
    rewardXp: 60
  })
});

const characterColumns = {
  id: characters.id,
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
};

const questCompletionColumns = {
  id: characterQuestCompletions.id,
  characterQuestCompletionId: characterQuestCompletions.id,
  characterId: characterQuestCompletions.characterId,
  questId: characterQuestCompletions.questKey,
  rewardXp: characterQuestCompletions.rewardXp,
  awardedAt: characterQuestCompletions.awardedAt
};

export function findMordorLocalQuestReward(questId) {
  const normalizedQuestId = typeof questId === "string" ? questId.trim() : "";

  return normalizedQuestId ? MORDOR_LOCAL_QUEST_REWARDS[normalizedQuestId] ?? null : null;
}

export async function claimCharacterQuestCompletion({ characterId, questReward }) {
  return db.transaction(async (tx) => {
    const now = new Date().toISOString();
    const insertedCompletionResult = await tx
      .insert(characterQuestCompletions)
      .values({
        characterId,
        questKey: questReward.questId,
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
      .where(eq(characters.id, characterId))
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
    .where(eq(characters.id, characterId))
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
        eq(characterQuestCompletions.questKey, questId)
      )
    )
    .limit(1);

  return result[0] || null;
}

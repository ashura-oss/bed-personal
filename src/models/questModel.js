import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { quests } from "../db/schema.js";
import { generateId } from "../utils/id.js";

const questColumns = {
  questId: quests.questId,
  regionId: quests.regionId,
  title: quests.title,
  description: quests.description,
  questType: quests.questType,
  requiredLevel: quests.requiredLevel,
  difficulty: quests.difficulty,
  requiredStat: quests.requiredStat,
  requiredStatValue: quests.requiredStatValue,
  rewardXp: quests.rewardXp,
  rewardGold: quests.rewardGold,
  successText: quests.successText,
  failureText: quests.failureText
};

export async function findQuests(filters = {}) {
  const query = db.select(questColumns).from(quests).orderBy(asc(quests.requiredLevel));

  if (filters.regionId !== undefined) {
    return query.where(eq(quests.regionId, filters.regionId));
  }

  return query;
}

export async function findQuestById(questId) {
  const result = await db
    .select(questColumns)
    .from(quests)
    .where(eq(quests.questId, questId))
    .limit(1);

  return result[0] || null;
}

export async function createQuest(questData) {
  const result = await db
    .insert(quests)
    .values({
      questId: generateId("quest"),
      ...questData
    })
    .returning(questColumns);

  return result[0];
}

export async function updateQuestById(questId, updates) {
  const result = await db
    .update(quests)
    .set(updates)
    .where(eq(quests.questId, questId))
    .returning(questColumns);

  return result[0] || null;
}

export async function deleteQuestById(questId) {
  const result = await db
    .delete(quests)
    .where(eq(quests.questId, questId))
    .returning({ questId: quests.questId });

  return result[0] || null;
}

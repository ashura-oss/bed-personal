import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { quests, regions } from "../db/schema.js";
import { QUEST_DEFINITIONS, findQuestDefinitionById, isAuthoredQuestId } from "../content/index.js";
import { generateId } from "../utils/id.js";

const questColumns = {
  id: quests.id,
  questId: quests.questKey,
  regionId: regions.regionKey,
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
  const authoredQuests = QUEST_DEFINITIONS.filter((quest) =>
    filters.regionId === undefined ? true : quest.regionId === filters.regionId
  );
  const legacyQuestRows = await findLegacyQuests(filters);
  const authoredQuestIds = new Set(authoredQuests.map((quest) => quest.questId));
  const customQuests = legacyQuestRows.filter((quest) => !authoredQuestIds.has(quest.questId));

  return [...authoredQuests, ...customQuests].sort(
    (left, right) => left.requiredLevel - right.requiredLevel
  );
}

export async function findQuestById(questId) {
  const authoredQuest = findQuestDefinitionById(questId);

  if (authoredQuest) {
    return authoredQuest;
  }

  const result = await db
    .select(questColumns)
    .from(quests)
    .innerJoin(regions, eq(quests.regionId, regions.id))
    .where(eq(quests.questKey, questId))
    .limit(1);

  return result[0] || null;
}

export { isAuthoredQuestId };

async function findLegacyQuests(filters = {}) {
  const query = db
    .select(questColumns)
    .from(quests)
    .innerJoin(regions, eq(quests.regionId, regions.id))
    .orderBy(asc(quests.requiredLevel));

  if (filters.regionId !== undefined) {
    return query.where(eq(regions.regionKey, filters.regionId));
  }

  return query;
}

export async function createQuest(questData) {
  const regionRow = await findRegionRowByKey(questData.regionId);
  const questId = generateId("quest");

  await db
    .insert(quests)
    .values({
      questKey: questId,
      ...toQuestDbValues(questData, regionRow.id)
    });

  return findQuestById(questId);
}

export async function updateQuestById(questId, updates) {
  const dbUpdates = { ...updates };

  if (updates.regionId !== undefined) {
    const regionRow = await findRegionRowByKey(updates.regionId);
    dbUpdates.regionId = regionRow.id;
  }

  await db
    .update(quests)
    .set(dbUpdates)
    .where(eq(quests.questKey, questId));

  return findQuestById(questId);
}

export async function deleteQuestById(questId) {
  const result = await db
    .delete(quests)
    .where(eq(quests.questKey, questId))
    .returning({ questId: quests.questKey });

  return result[0] || null;
}

async function findRegionRowByKey(regionId) {
  const result = await db
    .select({ id: regions.id })
    .from(regions)
    .where(eq(regions.regionKey, regionId))
    .limit(1);

  return result[0] || null;
}

function toQuestDbValues(questData, regionId) {
  return {
    regionId,
    title: questData.title,
    description: questData.description,
    questType: questData.questType,
    requiredLevel: questData.requiredLevel,
    difficulty: questData.difficulty,
    requiredStat: questData.requiredStat,
    requiredStatValue: questData.requiredStatValue,
    rewardXp: questData.rewardXp,
    rewardGold: questData.rewardGold,
    successText: questData.successText,
    failureText: questData.failureText
  };
}

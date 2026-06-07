import {
  HEARTHMERE_QUEST_DEFINITIONS
} from "./HearthmereQuestDefinitions.js";
import {
  QUEST_STATUS,
  deserializeQuestLog
} from "./QuestLog.js";

export const QUEST_REWARD_SNAPSHOT_VERSION = 1;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeIdList(ids) {
  if (!Array.isArray(ids)) return null;

  const seen = new Set();
  const normalized = [];

  for (const id of ids) {
    const normalizedId = normalizeString(id);
    if (!normalizedId || seen.has(normalizedId)) continue;

    seen.add(normalizedId);
    normalized.push(normalizedId);
  }

  return Object.freeze(normalized);
}

function getClaimedIdsInput(snapshotOrIds) {
  if (Array.isArray(snapshotOrIds)) return snapshotOrIds;
  if (!snapshotOrIds || typeof snapshotOrIds !== "object") return null;

  return snapshotOrIds.claimedRewardIds ??
    snapshotOrIds.claimedQuestRewardIds ??
    snapshotOrIds.claimedIds ??
    null;
}

export function normalizeQuestRewardSnapshot(snapshot) {
  const claimedRewardIds = normalizeIdList(getClaimedIdsInput(snapshot));
  if (!claimedRewardIds) return null;

  return Object.freeze({
    version: QUEST_REWARD_SNAPSHOT_VERSION,
    claimedRewardIds
  });
}

export function getClaimedQuestRewardIds(snapshotOrIds) {
  return normalizeQuestRewardSnapshot(snapshotOrIds)?.claimedRewardIds ?? Object.freeze([]);
}

function getRewardId(definition) {
  return normalizeString(definition?.rewardMetadata?.id) || normalizeString(definition?.id);
}

function isComplete(questLog, questId) {
  return questLog.quests[questId]?.status === QUEST_STATUS.COMPLETED;
}

function freezeQuestRewardClaim(definition) {
  return Object.freeze({
    questId: definition.id,
    rewardId: getRewardId(definition),
    rewardMetadata: definition.rewardMetadata
  });
}

export function detectNewlyCompletedQuestRewards({
  previousQuestLog,
  nextQuestLog,
  claimedRewardIds = [],
  definitions = HEARTHMERE_QUEST_DEFINITIONS
}) {
  const previousLog = deserializeQuestLog(previousQuestLog, definitions);
  const nextLog = deserializeQuestLog(nextQuestLog, definitions);
  const claimedIds = new Set(getClaimedQuestRewardIds(claimedRewardIds));
  const claims = [];

  for (const definition of definitions) {
    const rewardId = getRewardId(definition);
    if (!rewardId || claimedIds.has(rewardId)) continue;
    if (isComplete(previousLog, definition.id) || !isComplete(nextLog, definition.id)) continue;

    claims.push(freezeQuestRewardClaim(definition));
  }

  return Object.freeze(claims);
}

export function listCompletedUnclaimedQuestRewards({
  questLog,
  claimedRewardIds = [],
  definitions = HEARTHMERE_QUEST_DEFINITIONS
}) {
  const normalizedLog = deserializeQuestLog(questLog, definitions);
  const claimedIds = new Set(getClaimedQuestRewardIds(claimedRewardIds));
  const claims = [];

  for (const definition of definitions) {
    const rewardId = getRewardId(definition);
    if (!rewardId || claimedIds.has(rewardId) || !isComplete(normalizedLog, definition.id)) {
      continue;
    }

    claims.push(freezeQuestRewardClaim(definition));
  }

  return Object.freeze(claims);
}

export function addClaimedQuestRewardIds(snapshot, rewardIds) {
  const currentIds = getClaimedQuestRewardIds(snapshot);
  const nextIds = normalizeIdList([
    ...currentIds,
    ...(Array.isArray(rewardIds) ? rewardIds : [])
  ]);

  return Object.freeze({
    version: QUEST_REWARD_SNAPSHOT_VERSION,
    claimedRewardIds: nextIds ?? Object.freeze([])
  });
}

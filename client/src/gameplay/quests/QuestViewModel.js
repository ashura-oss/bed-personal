import { HEARTHMERE_QUEST_DEFINITIONS } from "./HearthmereQuestDefinitions.js";
import { QUEST_STATUS, deserializeQuestLog } from "./QuestLog.js";
import { getClaimedQuestRewardIds } from "./QuestCompletionService.js";

const STATUS_LABELS = Object.freeze({
  [QUEST_STATUS.ACTIVE]: "In Progress",
  [QUEST_STATUS.COMPLETED]: "Completed",
  [QUEST_STATUS.INACTIVE]: "Undiscovered"
});

const REWARD_LABELS = Object.freeze({
  available: "Reward Available",
  claimed: "Reward Claimed",
  locked: "Reward Locked",
  unknown: "Reward State Unknown"
});

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function indexRawQuestState(serialized) {
  if (!serialized || typeof serialized !== "object") return new Map();

  const rawQuests = serialized.quests;
  if (Array.isArray(rawQuests)) {
    return new Map(
      rawQuests
        .filter((entry) => typeof entry?.id === "string")
        .map((entry) => [entry.id, entry])
    );
  }

  if (rawQuests && typeof rawQuests === "object") {
    return new Map(Object.entries(rawQuests));
  }

  return new Map();
}

function clampObjectiveCount(value, requiredCount) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(requiredCount, Math.floor(value)));
}

function buildObjectiveView(objectiveDefinition, objectiveState) {
  const requiredCount = Number.isInteger(objectiveDefinition.requiredCount) && objectiveDefinition.requiredCount > 0
    ? objectiveDefinition.requiredCount
    : 1;
  const current = clampObjectiveCount(objectiveState?.current, requiredCount);

  return Object.freeze({
    id: objectiveDefinition.id,
    label: objectiveDefinition.label,
    current,
    requiredCount,
    progressText: `${current}/${requiredCount}`,
    complete: current >= requiredCount
  });
}

function buildObjectiveViews(definition, questState) {
  return Object.freeze(definition.objectives.map((objectiveDefinition) => {
    return buildObjectiveView(
      objectiveDefinition,
      questState.objectives[objectiveDefinition.id]
    );
  }));
}

function buildQuestView(definition, questState, status) {
  const nextObjectiveDefinition = definition.objectives.find((objectiveDefinition) => {
    return !questState.objectives[objectiveDefinition.id]?.complete;
  }) ?? definition.objectives[0] ?? null;

  return Object.freeze({
    questId: definition.id,
    regionId: definition.regionId,
    regionTitle: "Hearthmere",
    title: definition.title,
    summary: definition.summary,
    status,
    state: STATUS_LABELS[status] ?? status,
    text: status === QUEST_STATUS.COMPLETED ? definition.completionText : definition.summary,
    objective: nextObjectiveDefinition
      ? buildObjectiveView(nextObjectiveDefinition, questState.objectives[nextObjectiveDefinition.id])
      : null
  });
}

function normalizeRewards(definition) {
  const rawRewards = definition?.rewards ?? definition?.reward;
  const rewardMetadata = definition?.rewardMetadata ?? null;
  if (!rawRewards) return Object.freeze([]);

  const rewardList = Array.isArray(rawRewards) ? rawRewards : [rawRewards];
  return Object.freeze(rewardList.map((reward, index) => {
    if (typeof reward === "string") {
      return Object.freeze({
        id: reward,
        rewardId: reward,
        label: reward,
        count: 1,
        countText: "",
        rewardMetadata,
        state: "unknown"
      });
    }

    const rewardId = normalizeText(reward?.id)
      || normalizeText(reward?.itemId)
      || normalizeText(reward?.rewardId)
      || `reward-${index + 1}`;
    const label = normalizeText(reward?.label)
      || normalizeText(reward?.name)
      || normalizeText(reward?.title)
      || rewardId;
    const count = Number.isFinite(reward?.count ?? reward?.quantity ?? reward?.amount)
      ? Math.max(0, Math.floor(reward.count ?? reward.quantity ?? reward.amount))
      : 1;

    return Object.freeze({
      id: rewardId,
      rewardId,
      itemId: normalizeText(reward?.itemId),
      label,
      count,
      countText: count > 1 ? `x${count}` : "",
      rewardMetadata,
      state: normalizeText(reward?.state) || "unknown"
    });
  }));
}

function normalizeRewardMetadata(definition) {
  const rewardMetadata = definition?.rewardMetadata;
  if (!rewardMetadata || typeof rewardMetadata !== "object") {
    return null;
  }

  const rewardId = normalizeText(rewardMetadata.id);
  const rewardType = normalizeText(rewardMetadata.type);
  const xp = Number.isFinite(rewardMetadata.xp)
    ? Math.max(0, Math.floor(rewardMetadata.xp))
    : 0;

  if (!rewardId && !rewardType && xp <= 0) {
    return null;
  }

  return Object.freeze({
    ...rewardMetadata,
    id: rewardId,
    type: rewardType,
    xp
  });
}

function buildRewardMetadataItem(rewardMetadata, fallbackId) {
  const rewardId = normalizeText(rewardMetadata?.id) || fallbackId;
  const rewardType = normalizeText(rewardMetadata?.type);
  const xp = Number.isFinite(rewardMetadata?.xp)
    ? Math.max(0, Math.floor(rewardMetadata.xp))
    : 0;
  const label = rewardType === "xp" ? "Experience" : rewardType || rewardId;

  return Object.freeze({
    id: rewardId,
    rewardId,
    itemId: "",
    type: rewardType,
    xp,
    label,
    count: xp > 0 ? xp : 1,
    countText: rewardType === "xp" && xp > 0 ? `${xp} XP` : "",
    rewardMetadata,
    state: "unknown"
  });
}

function getRewardId(definition, rewardMetadata, rewards) {
  return normalizeText(rewardMetadata?.id)
    || normalizeText(rewards[0]?.rewardId)
    || normalizeText(rewards[0]?.id)
    || normalizeText(definition?.id);
}

function buildRewardItems(definition, rewardMetadata) {
  const rewards = normalizeRewards(definition);
  if (rewards.length > 0) {
    return rewards;
  }

  if (!rewardMetadata) {
    return Object.freeze([]);
  }

  const rewardId = getRewardId(definition, rewardMetadata, rewards);
  if (!rewardId) {
    return Object.freeze([]);
  }

  return Object.freeze([buildRewardMetadataItem(rewardMetadata, rewardId)]);
}

function readRewardState(questState, status, rewards, rewardId, claimedRewardIds) {
  if (rewards.length === 0) {
    return null;
  }

  if (rewardId && claimedRewardIds.has(rewardId)) {
    return "claimed";
  }

  const explicitState = normalizeText(questState?.rewardState)
    || normalizeText(questState?.rewardsState)
    || normalizeText(questState?.reward?.state);
  if (explicitState) {
    return explicitState.toLowerCase();
  }

  if (questState?.rewardClaimed === true || questState?.rewardsClaimed === true) {
    return "claimed";
  }

  if (status === QUEST_STATUS.COMPLETED) {
    return "available";
  }

  return "locked";
}

function buildRewardView(definition, questState, rawQuestState, status, claimedRewardIds) {
  const rewardMetadata = normalizeRewardMetadata(definition);
  const rewards = buildRewardItems(definition, rewardMetadata);
  const rewardId = getRewardId(definition, rewardMetadata, rewards);
  const state = readRewardState(
    rawQuestState ?? questState,
    status,
    rewards,
    rewardId,
    claimedRewardIds
  );

  if (!state) {
    return null;
  }

  return Object.freeze({
    rewardId,
    rewardMetadata,
    state,
    label: REWARD_LABELS[state] ?? REWARD_LABELS.unknown,
    claimed: state === "claimed",
    claimable: state === "available",
    rewards
  });
}

function buildQuestLogQuestView(definition, questState, rawQuestState, claimedRewardIds) {
  const status = questState?.status ?? QUEST_STATUS.INACTIVE;
  const objectives = buildObjectiveViews(definition, questState);
  const completedObjectives = objectives.filter((objective) => objective.complete).length;
  const totalObjectives = objectives.length;
  const reward = buildRewardView(definition, questState, rawQuestState, status, claimedRewardIds);

  return Object.freeze({
    questId: definition.id,
    regionId: definition.regionId,
    regionTitle: "Hearthmere",
    title: definition.title,
    summary: definition.summary,
    completionText: definition.completionText,
    status,
    state: STATUS_LABELS[status] ?? status,
    text: status === QUEST_STATUS.COMPLETED ? definition.completionText : definition.summary,
    objectives,
    completedObjectives,
    totalObjectives,
    progressText: `${completedObjectives}/${totalObjectives} objectives`,
    reward,
    hasReward: Boolean(reward)
  });
}

function summarizeQuestLog(questViews) {
  return Object.freeze({
    activeCount: questViews.filter((quest) => quest.status === QUEST_STATUS.ACTIVE).length,
    completedCount: questViews.filter((quest) => quest.status === QUEST_STATUS.COMPLETED).length,
    inactiveCount: questViews.filter((quest) => quest.status === QUEST_STATUS.INACTIVE).length,
    totalCount: questViews.length
  });
}

function resolveBuildArgs(definitionsOrOptions, options) {
  if (Array.isArray(definitionsOrOptions)) {
    return {
      definitions: definitionsOrOptions,
      options: options ?? {}
    };
  }

  return {
    definitions: HEARTHMERE_QUEST_DEFINITIONS,
    options: definitionsOrOptions ?? options ?? {}
  };
}

function readClaimedRewardInput(questLog, options) {
  if (Array.isArray(options)) return options;

  if (options && typeof options === "object") {
    return options.claimedRewardIds
      ?? options.claimedQuestRewardIds
      ?? options.claimedIds
      ?? options.questRewardSnapshot
      ?? options.rewardSnapshot
      ?? null;
  }

  if (questLog && typeof questLog === "object") {
    return questLog.claimedRewardIds
      ?? questLog.claimedQuestRewardIds
      ?? questLog.claimedIds
      ?? questLog.questRewardSnapshot
      ?? questLog.rewardSnapshot
      ?? null;
  }

  return null;
}

export function buildQuestObjectiveView(
  questLog,
  definitions = HEARTHMERE_QUEST_DEFINITIONS
) {
  const normalizedLog = deserializeQuestLog(questLog, definitions);

  const activeDefinition = definitions.find((definition) => {
    return normalizedLog.quests[definition.id]?.status === QUEST_STATUS.ACTIVE;
  });
  if (activeDefinition) {
    return buildQuestView(
      activeDefinition,
      normalizedLog.quests[activeDefinition.id],
      QUEST_STATUS.ACTIVE
    );
  }

  const completedDefinition = definitions.find((definition) => {
    return normalizedLog.quests[definition.id]?.status === QUEST_STATUS.COMPLETED;
  });
  if (completedDefinition) {
    return buildQuestView(
      completedDefinition,
      normalizedLog.quests[completedDefinition.id],
      QUEST_STATUS.COMPLETED
    );
  }

  return null;
}

export function buildQuestLogView(
  questLog,
  definitionsOrOptions = HEARTHMERE_QUEST_DEFINITIONS,
  options = {}
) {
  const { definitions, options: buildOptions } = resolveBuildArgs(definitionsOrOptions, options);
  const normalizedLog = deserializeQuestLog(questLog, definitions);
  const rawQuestState = indexRawQuestState(questLog);
  const claimedRewardIds = getClaimedQuestRewardIds(readClaimedRewardInput(questLog, buildOptions));
  const claimedRewardIdSet = new Set(claimedRewardIds);
  const quests = Object.freeze(definitions.map((definition) => {
    return buildQuestLogQuestView(
      definition,
      normalizedLog.quests[definition.id],
      rawQuestState.get(definition.id),
      claimedRewardIdSet
    );
  }));

  return Object.freeze({
    version: normalizedLog.version,
    regionTitle: "Hearthmere",
    claimedRewardIds,
    quests,
    active: Object.freeze(quests.filter((quest) => quest.status === QUEST_STATUS.ACTIVE)),
    completed: Object.freeze(quests.filter((quest) => quest.status === QUEST_STATUS.COMPLETED)),
    inactive: Object.freeze(quests.filter((quest) => quest.status === QUEST_STATUS.INACTIVE)),
    summary: summarizeQuestLog(quests)
  });
}

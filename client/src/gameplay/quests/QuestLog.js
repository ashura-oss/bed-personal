import {
  HEARTHMERE_QUEST_DEFINITIONS,
  QUEST_OBJECTIVE_TYPES,
} from "./HearthmereQuestDefinitions.js";

export const QUEST_LOG_VERSION = 1;

export const QUEST_STATUS = Object.freeze({
  INACTIVE: "inactive",
  ACTIVE: "active",
  COMPLETED: "completed"
});

export const QUEST_EVENT_TYPES = Object.freeze({
  DIALOGUE_EFFECT: "dialogue:effect",
  QUEST_EFFECT: "quest:effect",
  RESOURCE_GATHERED: "resource:gathered",
  GATHERING_HARVESTED: "gathering:harvested",
  ENEMY_KILLED: "enemy:killed",
  ENEMY_DIED: "enemy:died",
  ITEM_CRAFTED: "item:crafted",
  CRAFTING_CRAFTED: "crafting:crafted",
  BOSS_DEFEATED: "boss:defeated",
  BOSS_DIED: "boss:died"
});

const VALID_STATUSES = new Set(Object.values(QUEST_STATUS));

const EFFECT_EVENT_TYPES = new Set([
  QUEST_EVENT_TYPES.DIALOGUE_EFFECT,
  QUEST_EVENT_TYPES.QUEST_EFFECT
]);

const OBJECTIVE_EVENT_TYPES_BY_OBJECTIVE_TYPE = Object.freeze({
  [QUEST_OBJECTIVE_TYPES.GATHER_ITEM]: Object.freeze([
    QUEST_EVENT_TYPES.RESOURCE_GATHERED,
    QUEST_EVENT_TYPES.GATHERING_HARVESTED,
    "quest:resource_gathered"
  ]),
  [QUEST_OBJECTIVE_TYPES.KILL_ENEMY]: Object.freeze([
    QUEST_EVENT_TYPES.ENEMY_KILLED,
    QUEST_EVENT_TYPES.ENEMY_DIED,
    "quest:enemy_killed"
  ]),
  [QUEST_OBJECTIVE_TYPES.CRAFT_ITEM]: Object.freeze([
    QUEST_EVENT_TYPES.ITEM_CRAFTED,
    QUEST_EVENT_TYPES.CRAFTING_CRAFTED,
    "quest:item_crafted"
  ]),
  [QUEST_OBJECTIVE_TYPES.DEFEAT_BOSS]: Object.freeze([
    QUEST_EVENT_TYPES.BOSS_DEFEATED,
    QUEST_EVENT_TYPES.BOSS_DIED,
    "quest:boss_defeated"
  ])
});

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asPositiveInteger(value, fallback = 1) {
  if (!Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : fallback;
}

function clampProgress(value, requiredCount) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(requiredCount, Math.floor(value)));
}

function hasEventTypeForObjective(objective, eventType) {
  return OBJECTIVE_EVENT_TYPES_BY_OBJECTIVE_TYPE[objective.type]?.includes(eventType) ?? false;
}

function indexSerializedQuests(serialized) {
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

function indexSerializedObjectives(serializedQuest) {
  if (!serializedQuest || typeof serializedQuest !== "object") return new Map();

  const rawObjectives = serializedQuest.objectives;
  if (Array.isArray(rawObjectives)) {
    return new Map(
      rawObjectives
        .filter((entry) => typeof entry?.id === "string")
        .map((entry) => [entry.id, entry])
    );
  }

  if (rawObjectives && typeof rawObjectives === "object") {
    return new Map(Object.entries(rawObjectives));
  }

  return new Map();
}

function normalizeStatus(value) {
  const normalized = normalizeString(value);
  return VALID_STATUSES.has(normalized) ? normalized : QUEST_STATUS.INACTIVE;
}

function createObjectiveProgress(definition, serializedObjective, questStatus) {
  const requiredCount = asPositiveInteger(definition.requiredCount);
  const serializedCurrent = serializedObjective?.current ?? serializedObjective?.count ?? serializedObjective?.progress;
  const current = questStatus === QUEST_STATUS.INACTIVE
    ? 0
    : questStatus === QUEST_STATUS.COMPLETED
      ? requiredCount
      : clampProgress(serializedCurrent, requiredCount);

  return Object.freeze({
    id: definition.id,
    current,
    requiredCount,
    complete: current >= requiredCount
  });
}

function normalizeQuestState(definition, serializedQuest) {
  const serializedObjectives = indexSerializedObjectives(serializedQuest);
  const requestedStatus = normalizeStatus(serializedQuest?.status);
  const objectiveEntries = definition.objectives.map((objectiveDefinition) => {
    const objective = createObjectiveProgress(
      objectiveDefinition,
      serializedObjectives.get(objectiveDefinition.id),
      requestedStatus
    );
    return [objective.id, objective];
  });
  const objectives = Object.freeze(Object.fromEntries(objectiveEntries));
  const allComplete = Object.values(objectives).every((objective) => objective.complete);
  const status = requestedStatus === QUEST_STATUS.ACTIVE && allComplete
    ? QUEST_STATUS.COMPLETED
    : requestedStatus;

  return Object.freeze({
    id: definition.id,
    status,
    startEffect: definition.startEffect,
    objectives
  });
}

function normalizeQuestLog(serialized, definitions = HEARTHMERE_QUEST_DEFINITIONS) {
  const serializedQuests = indexSerializedQuests(serialized);
  const questEntries = definitions.map((definition) => {
    const quest = normalizeQuestState(definition, serializedQuests.get(definition.id));
    return [quest.id, quest];
  });

  return Object.freeze({
    version: QUEST_LOG_VERSION,
    quests: Object.freeze(Object.fromEntries(questEntries))
  });
}

function updateQuestInLog(questLog, questId, nextQuest) {
  return Object.freeze({
    version: QUEST_LOG_VERSION,
    quests: Object.freeze({
      ...questLog.quests,
      [questId]: nextQuest
    })
  });
}

function completeQuestIfReady(quest) {
  const allComplete = Object.values(quest.objectives).every((objective) => objective.complete);
  if (!allComplete || quest.status === QUEST_STATUS.COMPLETED) return quest;

  return Object.freeze({
    ...quest,
    status: QUEST_STATUS.COMPLETED
  });
}

function activateQuest(quest) {
  if (!quest || quest.status !== QUEST_STATUS.INACTIVE) return quest;

  return Object.freeze({
    ...quest,
    status: QUEST_STATUS.ACTIVE
  });
}

function updateObjectiveProgress(quest, objective, amount) {
  const current = Math.min(objective.requiredCount, objective.current + amount);
  if (current === objective.current) return quest;

  const nextObjective = Object.freeze({
    ...objective,
    current,
    complete: current >= objective.requiredCount
  });

  const nextQuest = Object.freeze({
    ...quest,
    objectives: Object.freeze({
      ...quest.objectives,
      [objective.id]: nextObjective
    })
  });

  return completeQuestIfReady(nextQuest);
}

function targetMatches(objectiveDefinition, targets) {
  const targetSet = new Set(targets.map(normalizeString).filter(Boolean));
  if (targetSet.size === 0) return false;

  if (targetSet.has(objectiveDefinition.targetId)) return true;
  return objectiveDefinition.targetAliases?.some((alias) => targetSet.has(alias)) ?? false;
}

function getTargetsForEvent(event, objectiveType) {
  if (!event || typeof event !== "object") return [];

  if (objectiveType === QUEST_OBJECTIVE_TYPES.GATHER_ITEM) {
    return [
      event.itemId,
      event.item?.itemId,
      event.yield?.itemId,
      event.nodeDef?.yield?.itemId
    ];
  }

  if (objectiveType === QUEST_OBJECTIVE_TYPES.KILL_ENEMY) {
    return [
      event.enemyTypeId,
      event.enemyId,
      event.id,
      event.enemy?.id,
      event.enemy?.typeId,
      event.definition?.id
    ];
  }

  if (objectiveType === QUEST_OBJECTIVE_TYPES.CRAFT_ITEM) {
    return [
      event.itemId,
      event.output?.itemId,
      event.item?.itemId,
      event.recipeId
    ];
  }

  if (objectiveType === QUEST_OBJECTIVE_TYPES.DEFEAT_BOSS) {
    return [
      event.bossId,
      event.id,
      event.arenaId,
      event.name,
      event.bossName
    ];
  }

  return [];
}

function getAmountForEvent(event, objectiveType) {
  if (!event || typeof event !== "object") return 1;

  if (objectiveType === QUEST_OBJECTIVE_TYPES.CRAFT_ITEM) {
    return asPositiveInteger(event.count ?? event.output?.count ?? event.item?.count, 1);
  }

  return asPositiveInteger(event.count ?? event.quantity ?? event.amount, 1);
}

function reduceObjectiveEvent(questLog, event, definitions) {
  const eventType = normalizeString(event?.type);
  if (!eventType) return questLog;

  let nextLog = questLog;

  for (const definition of definitions) {
    const quest = nextLog.quests[definition.id];
    if (!quest || quest.status !== QUEST_STATUS.ACTIVE) continue;

    let nextQuest = quest;

    for (const objectiveDefinition of definition.objectives) {
      if (!hasEventTypeForObjective(objectiveDefinition, eventType)) continue;
      if (!targetMatches(objectiveDefinition, getTargetsForEvent(event, objectiveDefinition.type))) continue;

      const objective = nextQuest.objectives[objectiveDefinition.id];
      if (!objective || objective.complete) continue;

      nextQuest = updateObjectiveProgress(
        nextQuest,
        objective,
        getAmountForEvent(event, objectiveDefinition.type)
      );
    }

    if (nextQuest !== quest) {
      nextLog = updateQuestInLog(nextLog, definition.id, nextQuest);
    }
  }

  return nextLog;
}

export function createQuestLog(definitions = HEARTHMERE_QUEST_DEFINITIONS) {
  return normalizeQuestLog(null, definitions);
}

export function serializeQuestLog(questLog, definitions = HEARTHMERE_QUEST_DEFINITIONS) {
  return normalizeQuestLog(questLog, definitions);
}

export function deserializeQuestLog(serialized, definitions = HEARTHMERE_QUEST_DEFINITIONS) {
  return normalizeQuestLog(serialized, definitions);
}

export function getQuestState(questLog, questId, definitions = HEARTHMERE_QUEST_DEFINITIONS) {
  const normalizedLog = normalizeQuestLog(questLog, definitions);
  const normalizedId = normalizeString(questId);
  return normalizedId ? normalizedLog.quests[normalizedId] ?? null : null;
}

export function isQuestComplete(questLog, questId, definitions = HEARTHMERE_QUEST_DEFINITIONS) {
  return getQuestState(questLog, questId, definitions)?.status === QUEST_STATUS.COMPLETED;
}

export function reduceQuestEffect(questLog, effect, definitions = HEARTHMERE_QUEST_DEFINITIONS) {
  const normalizedLog = normalizeQuestLog(questLog, definitions);
  const normalizedEffect = normalizeString(effect);
  const definition = definitions.find((questDefinition) => questDefinition.startEffect === normalizedEffect);
  if (!definition || !normalizedLog.quests[definition.id]) return normalizedLog;

  const quest = normalizedLog.quests[definition.id];
  const nextQuest = activateQuest(quest);
  return nextQuest === quest ? normalizedLog : updateQuestInLog(normalizedLog, definition.id, nextQuest);
}

export function reduceQuestEvent(questLog, event, definitions = HEARTHMERE_QUEST_DEFINITIONS) {
  const normalizedLog = normalizeQuestLog(questLog, definitions);

  if (typeof event === "string") {
    return reduceQuestEffect(normalizedLog, event, definitions);
  }

  const eventType = normalizeString(event?.type);
  if (EFFECT_EVENT_TYPES.has(eventType)) {
    return reduceQuestEffect(normalizedLog, event.effect, definitions);
  }

  return reduceObjectiveEvent(normalizedLog, event, definitions);
}

export function reduceQuestEvents(questLog, events, definitions = HEARTHMERE_QUEST_DEFINITIONS) {
  if (!Array.isArray(events)) return normalizeQuestLog(questLog, definitions);

  return events.reduce(
    (nextLog, event) => reduceQuestEvent(nextLog, event, definitions),
    normalizeQuestLog(questLog, definitions)
  );
}

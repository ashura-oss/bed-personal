export const HEARTHMERE_QUEST_EFFECTS = Object.freeze({
  ROAD_STANDS_OFFER: "quest.road_that_still_stands.offer",
  TESSA_GATHER_OFFER: "quest.tessa_gather.offer",
  ALDRIC_HOLLOW_OFFER: "quest.aldric_hollow.offer",
  MARN_SUPPLY_NOTE: "quest.marn_supply.note",
  SURVIVOR_RITE_NOTE: "quest.survivor_rite.note",
  BREK_MINE_OFFER: "quest.brek_mine.offer"
});

export const QUEST_OBJECTIVE_TYPES = Object.freeze({
  GATHER_ITEM: "gather_item",
  KILL_ENEMY: "kill_enemy",
  CRAFT_ITEM: "craft_item",
  DEFEAT_BOSS: "defeat_boss"
});

export const QUEST_REWARD_TYPES = Object.freeze({
  XP: "xp"
});

function freezeObjective({
  id,
  type,
  targetId,
  targetAliases = [],
  requiredCount,
  label
}) {
  return Object.freeze({
    id,
    type,
    targetId,
    targetAliases: Object.freeze(targetAliases.slice()),
    requiredCount,
    label
  });
}

function freezeRewardMetadata({
  id,
  xp
}) {
  const normalizedId = typeof id === "string" ? id.trim() : "";
  const normalizedXp = Number.isInteger(xp) && xp > 0 ? xp : 0;

  return Object.freeze({
    id: normalizedId,
    type: QUEST_REWARD_TYPES.XP,
    xp: normalizedXp
  });
}

function freezeQuestDefinition({
  id,
  regionId,
  title,
  summary,
  startEffect,
  objectives,
  rewardMetadata,
  completionText
}) {
  const frozenObjectives = Object.freeze(objectives.map(freezeObjective));

  return Object.freeze({
    id,
    regionId,
    title,
    summary,
    startEffect,
    objectives: frozenObjectives,
    rewardMetadata: freezeRewardMetadata(rewardMetadata),
    completionText
  });
}

export const HEARTHMERE_QUEST_DEFINITIONS = Object.freeze([
  freezeQuestDefinition({
    id: "hearthmere.road_that_still_stands",
    regionId: "hearthmere",
    title: "The Road That Still Stands",
    summary: "Restore the Ashfall Road from first shard to first boss so Hearthmere can breathe again.",
    startEffect: HEARTHMERE_QUEST_EFFECTS.ROAD_STANDS_OFFER,
    objectives: [
      {
        id: "clear_old_road",
        type: QUEST_OBJECTIVE_TYPES.KILL_ENEMY,
        targetId: "hollow_shambler",
        requiredCount: 3,
        label: "Clear Hollowborn from the old road"
      },
      {
        id: "recover_caravan_timber",
        type: QUEST_OBJECTIVE_TYPES.GATHER_ITEM,
        targetId: "timber",
        requiredCount: 3,
        label: "Recover caravan timber"
      },
      {
        id: "recover_iron_fittings",
        type: QUEST_OBJECTIVE_TYPES.GATHER_ITEM,
        targetId: "iron_ore",
        requiredCount: 2,
        label: "Recover iron fittings"
      },
      {
        id: "forge_hearthlight_hatchet",
        type: QUEST_OBJECTIVE_TYPES.CRAFT_ITEM,
        targetId: "hearthlight_hatchet",
        requiredCount: 1,
        label: "Forge a Hearthlight Hatchet with Tessa"
      },
      {
        id: "defeat_hollowbound_guard",
        type: QUEST_OBJECTIVE_TYPES.DEFEAT_BOSS,
        targetId: "hearthmere.boss.hollowbound_guard",
        targetAliases: ["Hollowbound Caravan Guard"],
        requiredCount: 1,
        label: "Defeat the Hollowbound Caravan Guard"
      }
    ],
    rewardMetadata: {
      id: "hearthmere.road_that_still_stands.reward",
      xp: 30
    },
    completionText: "The Ashfall Road still stands, and Hearthmere's region map opens at last."
  }),
  freezeQuestDefinition({
    id: "hearthmere.tessa_gather",
    regionId: "hearthmere",
    title: "Fuel for the Emberwright",
    summary: "Tessa needs basic forge stock before she can make road-worthy gear.",
    startEffect: HEARTHMERE_QUEST_EFFECTS.TESSA_GATHER_OFFER,
    objectives: [
      {
        id: "gather_timber",
        type: QUEST_OBJECTIVE_TYPES.GATHER_ITEM,
        targetId: "timber",
        requiredCount: 3,
        label: "Gather timber"
      },
      {
        id: "gather_iron_ore",
        type: QUEST_OBJECTIVE_TYPES.GATHER_ITEM,
        targetId: "iron_ore",
        requiredCount: 2,
        label: "Gather iron ore"
      }
    ],
    rewardMetadata: {
      id: "hearthmere.tessa_gather.reward",
      xp: 35
    },
    completionText: "Tessa has enough stock to work the forge."
  }),
  freezeQuestDefinition({
    id: "hearthmere.aldric_hollow",
    regionId: "hearthmere",
    title: "Thin the Hollow Ranks",
    summary: "Warden Aldric wants the hollow east of the mill pushed back.",
    startEffect: HEARTHMERE_QUEST_EFFECTS.ALDRIC_HOLLOW_OFFER,
    objectives: [
      {
        id: "kill_hollow_shamblers",
        type: QUEST_OBJECTIVE_TYPES.KILL_ENEMY,
        targetId: "hollow_shambler",
        requiredCount: 3,
        label: "Defeat hollow shamblers"
      }
    ],
    rewardMetadata: {
      id: "hearthmere.aldric_hollow.reward",
      xp: 45
    },
    completionText: "The nearby hollow pressure has eased."
  }),
  freezeQuestDefinition({
    id: "hearthmere.marn_supply",
    regionId: "hearthmere",
    title: "Supplies for the Road",
    summary: "Marn can restart trade if there are enough field supplies to sell.",
    startEffect: HEARTHMERE_QUEST_EFFECTS.MARN_SUPPLY_NOTE,
    objectives: [
      {
        id: "craft_ashleaf_poultices",
        type: QUEST_OBJECTIVE_TYPES.CRAFT_ITEM,
        targetId: "ashleaf_poultice",
        requiredCount: 2,
        label: "Craft ashleaf poultices"
      }
    ],
    rewardMetadata: {
      id: "hearthmere.marn_supply.reward",
      xp: 40
    },
    completionText: "Marn has enough supplies to draw travellers back to the road."
  }),
  freezeQuestDefinition({
    id: "hearthmere.survivor_rite",
    regionId: "hearthmere",
    title: "The Mending Rite",
    summary: "The hollow survivor believes the old rite begins at the crypt shrine.",
    startEffect: HEARTHMERE_QUEST_EFFECTS.SURVIVOR_RITE_NOTE,
    objectives: [
      {
        id: "defeat_hollowbound_guard",
        type: QUEST_OBJECTIVE_TYPES.DEFEAT_BOSS,
        targetId: "hearthmere.boss.hollowbound_guard",
        targetAliases: ["Hollowbound Caravan Guard"],
        requiredCount: 1,
        label: "Defeat the Hollowbound Caravan Guard"
      }
    ],
    rewardMetadata: {
      id: "hearthmere.survivor_rite.reward",
      xp: 90
    },
    completionText: "The shrine path is clear enough for the rite to begin."
  }),
  freezeQuestDefinition({
    id: "hearthmere.brek_mine",
    regionId: "hearthmere",
    title: "Clear Copperstone Mine",
    summary: "Foreman Brek needs the hollow cleared from the mine before work can resume.",
    startEffect: HEARTHMERE_QUEST_EFFECTS.BREK_MINE_OFFER,
    objectives: [
      {
        id: "clear_mine_hollow",
        type: QUEST_OBJECTIVE_TYPES.KILL_ENEMY,
        targetId: "hollow_shambler",
        requiredCount: 5,
        label: "Defeat hollow in the mine"
      }
    ],
    rewardMetadata: {
      id: "hearthmere.brek_mine.reward",
      xp: 60
    },
    completionText: "Copperstone Mine is safe enough for Brek's crew to return."
  })
]);

const QUEST_DEFINITION_BY_ID = new Map(
  HEARTHMERE_QUEST_DEFINITIONS.map((definition) => [definition.id, definition])
);

const QUEST_DEFINITION_BY_EFFECT = new Map(
  HEARTHMERE_QUEST_DEFINITIONS.map((definition) => [definition.startEffect, definition])
);

export const HEARTHMERE_QUEST_DEFINITIONS_BY_ID = Object.freeze(
  Object.fromEntries(QUEST_DEFINITION_BY_ID)
);

export const HEARTHMERE_QUEST_DEFINITIONS_BY_EFFECT = Object.freeze(
  Object.fromEntries(QUEST_DEFINITION_BY_EFFECT)
);

export function listHearthmereQuestDefinitions() {
  return HEARTHMERE_QUEST_DEFINITIONS;
}

export function getHearthmereQuestDefinition(questId) {
  const normalizedId = typeof questId === "string" ? questId.trim() : "";
  return normalizedId ? QUEST_DEFINITION_BY_ID.get(normalizedId) ?? null : null;
}

export function getHearthmereQuestDefinitionForEffect(effect) {
  const normalizedEffect = typeof effect === "string" ? effect.trim() : "";
  return normalizedEffect ? QUEST_DEFINITION_BY_EFFECT.get(normalizedEffect) ?? null : null;
}

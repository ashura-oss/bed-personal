import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () => integer("id").primaryKey({ autoIncrement: true });

export const users = sqliteTable("users", {
  id: id(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  gold: integer("gold").notNull().default(0),
  createdAt: text("created_at").notNull()
});

export const characters = sqliteTable("characters", {
  id: id(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  characterName: text("character_name").notNull(),
  origin: text("origin").notNull(),
  className: text("class_name").notNull(),
  affinity: text("affinity").notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  hp: integer("hp").notNull().default(100),
  strength: integer("strength").notNull(),
  intelligence: integer("intelligence").notNull(),
  agility: integer("agility").notNull(),
  faith: integer("faith").notNull(),
  endurance: integer("endurance").notNull(),
  charisma: integer("charisma").notNull(),
  createdAt: text("created_at").notNull()
});

export const regions = sqliteTable("regions", {
  id: id(),
  regionKey: text("region_key").notNull().unique(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  dangerLevel: integer("danger_level").notNull(),
  recommendedLevel: integer("recommended_level").notNull(),
  faction: text("faction"),
  shardName: text("shard_name"),
  isUnlocked: integer("is_unlocked").notNull().default(1)
});

export const quests = sqliteTable("quests", {
  id: id(),
  questKey: text("quest_key").notNull().unique(),
  regionId: integer("region_id")
    .notNull()
    .references(() => regions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questType: text("quest_type").notNull(),
  requiredLevel: integer("required_level").notNull(),
  difficulty: integer("difficulty").notNull(),
  requiredStat: text("required_stat").notNull(),
  requiredStatValue: integer("required_stat_value").notNull(),
  rewardXp: integer("reward_xp").notNull(),
  rewardGold: integer("reward_gold").notNull(),
  successText: text("success_text").notNull(),
  failureText: text("failure_text").notNull()
});

export const adventureLogs = sqliteTable("adventure_logs", {
  id: id(),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  questKey: text("quest_key").notNull(),
  outcome: text("outcome").notNull(),
  xpGained: integer("xp_gained").notNull(),
  goldGained: integer("gold_gained").notNull(),
  resultText: text("result_text").notNull(),
  createdAt: text("created_at").notNull()
});

export const abilities = sqliteTable("abilities", {
  id: id(),
  abilityKey: text("ability_key").notNull().unique(),
  name: text("name").notNull(),
  className: text("class_name"),
  affinity: text("affinity"),
  abilityType: text("ability_type").notNull(),
  power: integer("power").notNull(),
  comboTag: text("combo_tag"),
  requiredLevel: integer("required_level").notNull(),
  description: text("description").notNull()
});

export const characterAbilities = sqliteTable(
  "character_abilities",
  {
    id: id(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    abilityId: integer("ability_id")
      .notNull()
      .references(() => abilities.id, { onDelete: "cascade" }),
    unlockedAt: text("unlocked_at").notNull()
  },
  (table) => ({
    characterAbilityUnique: uniqueIndex("character_abilities_character_ability_unique").on(
      table.characterId,
      table.abilityId
    )
  })
);

export const characterRunStates = sqliteTable(
  "character_run_states",
  {
    id: id(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    schemaVersion: integer("schema_version").notNull().default(1),
    embers: integer("embers").notNull().default(0),
    flaskCharges: integer("flask_charges").notNull().default(4),
    lastHearthlightX: real("last_hearthlight_x").notNull().default(-5),
    lastHearthlightY: real("last_hearthlight_y").notNull().default(0),
    lastHearthlightZ: real("last_hearthlight_z").notNull().default(4),
    savedAt: text("saved_at").notNull()
  },
  (table) => ({
    characterRunStateUnique: uniqueIndex("character_run_states_character_unique").on(
      table.characterId
    )
  })
);

export const characterQuestCompletions = sqliteTable(
  "character_quest_completions",
  {
    id: id(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    questKey: text("quest_key").notNull(),
    rewardXp: integer("reward_xp").notNull(),
    awardedAt: text("awarded_at").notNull()
  },
  (table) => ({
    characterQuestCompletionUnique: uniqueIndex(
      "character_quest_completions_character_quest_unique"
    ).on(table.characterId, table.questKey)
  })
);

export const saveSlots = sqliteTable(
  "save_slots",
  {
    id: id(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterId: integer("character_id").references(() => characters.id, {
      onDelete: "set null"
    }),
    slotIndex: integer("slot_index").notNull(),
    slotName: text("slot_name").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    lastPlayedAt: text("last_played_at")
  },
  (table) => ({
    saveSlotUserIndexUnique: uniqueIndex("save_slots_user_slot_index_unique").on(
      table.userId,
      table.slotIndex
    )
  })
);

export const characterInventory = sqliteTable(
  "character_inventory",
  {
    id: id(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    itemKey: text("item_key").notNull(),
    quantity: integer("quantity").notNull().default(1),
    acquiredAt: text("acquired_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    characterInventoryItemUnique: uniqueIndex("character_inventory_character_item_unique").on(
      table.characterId,
      table.itemKey
    )
  })
);

export const characterEquipment = sqliteTable(
  "character_equipment",
  {
    id: id(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    equipmentSlot: text("equipment_slot").notNull(),
    itemKey: text("item_key").notNull(),
    equippedAt: text("equipped_at").notNull()
  },
  (table) => ({
    characterEquipmentSlotUnique: uniqueIndex("character_equipment_character_slot_unique").on(
      table.characterId,
      table.equipmentSlot
    )
  })
);

export const characterDialogueFlags = sqliteTable(
  "character_dialogue_flags",
  {
    id: id(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    flagKey: text("flag_key").notNull(),
    flagValue: text("flag_value").notNull().default("true"),
    setAt: text("set_at").notNull()
  },
  (table) => ({
    characterDialogueFlagUnique: uniqueIndex("character_dialogue_flags_character_flag_unique").on(
      table.characterId,
      table.flagKey
    )
  })
);

export const characterBossStates = sqliteTable(
  "character_boss_states",
  {
    id: id(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    bossKey: text("boss_key").notNull(),
    status: text("status").notNull().default("unknown"),
    attempts: integer("attempts").notNull().default(0),
    defeats: integer("defeats").notNull().default(0),
    bestTimeSeconds: real("best_time_seconds"),
    lastOutcome: text("last_outcome"),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    characterBossStateUnique: uniqueIndex("character_boss_states_character_boss_unique").on(
      table.characterId,
      table.bossKey
    )
  })
);

export const characterCampaignMarkers = sqliteTable(
  "character_campaign_markers",
  {
    id: id(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    markerKey: text("marker_key").notNull(),
    regionKey: text("region_key").notNull(),
    markerType: text("marker_type").notNull(),
    isRevealed: integer("is_revealed").notNull().default(1),
    isCompleted: integer("is_completed").notNull().default(0),
    positionX: real("position_x"),
    positionY: real("position_y"),
    positionZ: real("position_z"),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    characterCampaignMarkerUnique: uniqueIndex(
      "character_campaign_markers_character_marker_unique"
    ).on(table.characterId, table.markerKey)
  })
);

export const characterFactionReputation = sqliteTable(
  "character_faction_reputation",
  {
    id: id(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    factionKey: text("faction_key").notNull(),
    reputation: integer("reputation").notNull().default(0),
    rank: text("rank").notNull().default("neutral"),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    characterFactionReputationUnique: uniqueIndex(
      "character_faction_reputation_character_faction_unique"
    ).on(table.characterId, table.factionKey)
  })
);

export const characterRegionStates = sqliteTable(
  "character_region_states",
  {
    id: id(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    regionKey: text("region_key").notNull(),
    isUnlocked: integer("is_unlocked").notNull().default(0),
    isDiscovered: integer("is_discovered").notNull().default(0),
    threatLevel: integer("threat_level").notNull().default(0),
    worldState: text("world_state").notNull().default("stable"),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    characterRegionStateUnique: uniqueIndex("character_region_states_character_region_unique").on(
      table.characterId,
      table.regionKey
    )
  })
);

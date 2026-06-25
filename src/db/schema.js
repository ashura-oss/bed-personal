import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  gold: integer("gold").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull()
});

export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull()
});

export const adventureLogs = sqliteTable("adventure_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  questKey: text("quest_key").notNull(),
  outcome: text("outcome").notNull(),
  xpGained: integer("xp_gained").notNull(),
  goldGained: integer("gold_gained").notNull(),
  resultText: text("result_text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull()
});

export const characterAbilities = sqliteTable(
  "character_abilities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    abilityKey: text("ability_key").notNull(),
    unlockedAt: integer("unlocked_at", { mode: "timestamp" }).notNull()
  },
  (table) => ({
    characterAbilityUnique: uniqueIndex("character_abilities_character_ability_unique").on(
      table.characterId,
      table.abilityKey
    )
  })
);

export const characterRunStates = sqliteTable(
  "character_run_states",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    supplies: integer("supplies").notNull().default(3),
    morale: integer("morale").notNull().default(50),
    storyPhase: text("story_phase").notNull().default("village_rebellion"),
    commandModeUnlocked: integer("command_mode_unlocked").notNull().default(0),
    savedAt: integer("saved_at", { mode: "timestamp" }).notNull()
  },
  (table) => ({
    characterRunStateUnique: uniqueIndex("character_run_states_character_unique").on(
      table.characterId
    )
  })
);

export const characterLocations = sqliteTable(
  "character_locations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    regionKey: text("region_key").notNull(),
    nodeKey: text("node_key").notNull(),
    previousNodeKey: text("previous_node_key"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
  },
  (table) => ({
    characterLocationUnique: uniqueIndex("character_locations_character_unique").on(
      table.characterId
    )
  })
);

export const combatSessions = sqliteTable("combat_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  enemyKey: text("enemy_key").notNull(),
  questKey: text("quest_key"),
  regionKey: text("region_key").notNull(),
  nodeKey: text("node_key"),
  playerHp: integer("player_hp").notNull(),
  enemyHp: integer("enemy_hp").notNull(),
  maxPlayerHp: integer("max_player_hp").notNull(),
  maxEnemyHp: integer("max_enemy_hp").notNull(),
  turnOwner: text("turn_owner").notNull().default("player"),
  status: text("status").notNull().default("active"),
  roundNumber: integer("round_number").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

export const combatTurnLogs = sqliteTable("combat_turn_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  combatSessionId: integer("combat_session_id")
    .notNull()
    .references(() => combatSessions.id, { onDelete: "cascade" }),
  actor: text("actor").notNull(),
  actionType: text("action_type").notNull(),
  abilityKey: text("ability_key"),
  damage: integer("damage").notNull().default(0),
  playerHpAfter: integer("player_hp_after").notNull(),
  enemyHpAfter: integer("enemy_hp_after").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull()
});

export const characterArmyStates = sqliteTable(
  "character_army_states",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    isUnlocked: integer("is_unlocked").notNull().default(0),
    commandRank: text("command_rank").notNull().default("none"),
    soldiers: integer("soldiers").notNull().default(0),
    archers: integer("archers").notNull().default(0),
    cavalry: integer("cavalry").notNull().default(0),
    morale: integer("morale").notNull().default(50),
    strategy: text("strategy").notNull().default("hold"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
  },
  (table) => ({
    characterArmyStateUnique: uniqueIndex("character_army_states_character_unique").on(
      table.characterId
    )
  })
);

export const characterQuestCompletions = sqliteTable(
  "character_quest_completions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    questKey: text("quest_key").notNull(),
    rewardXp: integer("reward_xp").notNull(),
    awardedAt: integer("awarded_at", { mode: "timestamp" }).notNull()
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
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterId: integer("character_id").references(() => characters.id, {
      onDelete: "set null"
    }),
    slotIndex: integer("slot_index").notNull(),
    slotName: text("slot_name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    lastPlayedAt: integer("last_played_at", { mode: "timestamp" })
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
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    itemKey: text("item_key").notNull(),
    quantity: integer("quantity").notNull().default(1),
    acquiredAt: integer("acquired_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
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
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    equipmentSlot: text("equipment_slot").notNull(),
    itemKey: text("item_key").notNull(),
    equippedAt: integer("equipped_at", { mode: "timestamp" }).notNull()
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
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    flagKey: text("flag_key").notNull(),
    flagValue: integer("flag_value").notNull().default(1),
    setAt: integer("set_at", { mode: "timestamp" }).notNull()
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
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    bossKey: text("boss_key").notNull(),
    status: text("status").notNull().default("unknown"),
    attempts: integer("attempts").notNull().default(0),
    defeats: integer("defeats").notNull().default(0),
    bestTimeSeconds: real("best_time_seconds"),
    lastOutcome: text("last_outcome"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
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
    id: integer("id").primaryKey({ autoIncrement: true }),
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
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
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
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    factionKey: text("faction_key").notNull(),
    reputation: integer("reputation").notNull().default(0),
    rank: text("rank").notNull().default("neutral"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
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
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    regionKey: text("region_key").notNull(),
    isUnlocked: integer("is_unlocked").notNull().default(0),
    isDiscovered: integer("is_discovered").notNull().default(0),
    threatLevel: integer("threat_level").notNull().default(0),
    worldState: text("world_state").notNull().default("stable"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
  },
  (table) => ({
    characterRegionStateUnique: uniqueIndex("character_region_states_character_region_unique").on(
      table.characterId,
      table.regionKey
    )
  })
);

import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  userId: text("user_id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  gold: integer("gold").notNull().default(0),
  createdAt: text("created_at").notNull()
});

export const characters = sqliteTable("characters", {
  characterId: text("character_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
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
  regionId: text("region_id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  dangerLevel: integer("danger_level").notNull(),
  recommendedLevel: integer("recommended_level").notNull(),
  faction: text("faction"),
  shardName: text("shard_name"),
  isUnlocked: integer("is_unlocked").notNull().default(1)
});

export const quests = sqliteTable("quests", {
  questId: text("quest_id").primaryKey(),
  regionId: text("region_id")
    .notNull()
    .references(() => regions.regionId, { onDelete: "cascade" }),
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
  logId: text("log_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.characterId, { onDelete: "cascade" }),
  questId: text("quest_id")
    .notNull()
    .references(() => quests.questId, { onDelete: "cascade" }),
  outcome: text("outcome").notNull(),
  xpGained: integer("xp_gained").notNull(),
  goldGained: integer("gold_gained").notNull(),
  resultText: text("result_text").notNull(),
  createdAt: text("created_at").notNull()
});

export const abilities = sqliteTable("abilities", {
  abilityId: text("ability_id").primaryKey(),
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
    characterAbilityId: text("character_ability_id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.characterId, { onDelete: "cascade" }),
    abilityId: text("ability_id")
      .notNull()
      .references(() => abilities.abilityId, { onDelete: "cascade" }),
    unlockedAt: text("unlocked_at").notNull()
  },
  (table) => ({
    characterAbilityUnique: uniqueIndex("character_abilities_character_ability_unique").on(
      table.characterId,
      table.abilityId
    )
  })
);

export const characterRunStates = sqliteTable("character_run_states", {
  characterId: text("character_id")
    .primaryKey()
    .references(() => characters.characterId, { onDelete: "cascade" }),
  schemaVersion: integer("schema_version").notNull().default(1),
  embers: integer("embers").notNull().default(0),
  flaskCharges: integer("flask_charges").notNull().default(4),
  lastHearthlightX: real("last_hearthlight_x").notNull().default(-5),
  lastHearthlightY: real("last_hearthlight_y").notNull().default(0),
  lastHearthlightZ: real("last_hearthlight_z").notNull().default(4),
  savedAt: text("saved_at").notNull()
});

export const characterQuestCompletions = sqliteTable(
  "character_quest_completions",
  {
    characterQuestCompletionId: text("character_quest_completion_id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.characterId, { onDelete: "cascade" }),
    questId: text("quest_id").notNull(),
    rewardXp: integer("reward_xp").notNull(),
    awardedAt: text("awarded_at").notNull()
  },
  (table) => ({
    characterQuestCompletionUnique: uniqueIndex(
      "character_quest_completions_character_quest_unique"
    ).on(table.characterId, table.questId)
  })
);

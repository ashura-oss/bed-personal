// ------------------------------------------------------------
// DATABASE SCHEMA
// ------------------------------------------------------------
// Drizzle table definitions for user-created and saved game data.
// Constants such as items, quests, regions, enemies, and abilities stay in src/constants.
// The database stores player-owned data, progress, logs, and saved-game state.
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ------------------------------------------------------------
// CORE PLAYER TABLES
// ------------------------------------------------------------

// Stores account-level player data.
// Linked records: characters, save slots.
// Required minimum from CA: user id and username. password stores the basic login password.
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  gold: integer("gold").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull()
});

// Stores each playable character owned by a user.
// userId is a foreign key back to users; user deletion cleanup is handled in the model.
// Stats are saved here because equipment, combat, and progression all read them.
export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
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

// ------------------------------------------------------------
// QUEST AND ADVENTURE HISTORY
// ------------------------------------------------------------

// Stores the history of quest/adventure attempts.
// questKey points to a fixed quest definition in src/constants/quests.js.
// Used for: user adventure logs, character adventure logs, reward history.
export const adventureLogs = sqliteTable("adventure_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  questKey: text("quest_key").notNull(),
  outcome: text("outcome").notNull(),
  xpGained: integer("xp_gained").notNull(),
  goldGained: integer("gold_gained").notNull(),
  resultText: text("result_text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull()
});

// Stores which fixed ability definitions each character has unlocked.
// abilityKey points to src/constants/abilities.js.
// Model logic checks that one character cannot unlock the same ability twice.
export const characterAbilities = sqliteTable("character_abilities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  abilityKey: text("ability_key").notNull(),
  unlockedAt: integer("unlocked_at", { mode: "timestamp" }).notNull()
});

// Stores one persistent story/run state row per character.
// Used by: progression routes, map locks, army unlock flow, and save/load state.
// Model logic keeps one current run state row per character.
export const characterRunStates = sqliteTable("character_run_states", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  supplies: integer("supplies").notNull().default(3),
  morale: integer("morale").notNull().default(50),
  storyPhase: text("story_phase").notNull().default("village_rebellion"),
  commandModeUnlocked: integer("command_mode_unlocked").notNull().default(0),
  savedAt: integer("saved_at", { mode: "timestamp" }).notNull()
});

// ------------------------------------------------------------
// MAP AND TRAVEL STATE
// ------------------------------------------------------------

// Stores one current map location row per character.
// nodeKey and regionKey point to fixed map/region definitions in src/constants.
// Model logic keeps one current location row per character.
export const characterLocations = sqliteTable("character_locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  regionKey: text("region_key").notNull(),
  nodeKey: text("node_key").notNull(),
  previousNodeKey: text("previous_node_key"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

// ------------------------------------------------------------
// COMBAT STATE
// ------------------------------------------------------------

// Stores an active or completed turn-based combat session.
// enemyKey points to src/constants/enemies.js.
// This table keeps HP, turn owner, round number, and combat status between requests.
export const combatSessions = sqliteTable("combat_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
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

// Stores individual combat turn results for a combat session.
// Used by: GET /combat/sessions/:combatSessionId so battle history can be returned.
// Combat turn logs are cleaned by model logic when their session/character is removed.
export const combatTurnLogs = sqliteTable("combat_turn_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  combatSessionId: integer("combat_session_id")
    .notNull()
    .references(() => combatSessions.id),
  actor: text("actor").notNull(),
  actionType: text("action_type").notNull(),
  abilityKey: text("ability_key"),
  damage: integer("damage").notNull().default(0),
  playerHpAfter: integer("player_hp_after").notNull(),
  enemyHpAfter: integer("enemy_hp_after").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull()
});

// ------------------------------------------------------------
// ARMY COMMAND STATE
// ------------------------------------------------------------

// Stores one army state row for a character after command mode is unlocked.
// Used by: army state endpoints and army battle simulation.
// Model logic keeps one current army state row per character.
export const characterArmyStates = sqliteTable("character_army_states", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  isUnlocked: integer("is_unlocked").notNull().default(0),
  commandRank: text("command_rank").notNull().default("none"),
  soldiers: integer("soldiers").notNull().default(0),
  archers: integer("archers").notNull().default(0),
  cavalry: integer("cavalry").notNull().default(0),
  morale: integer("morale").notNull().default(50),
  strategy: text("strategy").notNull().default("hold"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

// ------------------------------------------------------------
// COMPLETION AND SAVE STATE
// ------------------------------------------------------------

// Stores completed quest flags and reward XP for each character.
// questKey points to fixed quest definitions in src/constants/quests.js.
// Model logic checks that one character cannot claim the same quest completion twice.
export const characterQuestCompletions = sqliteTable("character_quest_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  questKey: text("quest_key").notNull(),
  rewardXp: integer("reward_xp").notNull(),
  awardedAt: integer("awarded_at", { mode: "timestamp" }).notNull()
});

// Stores save slot metadata for save/load screens.
// userId owns the slot; characterId can be null if the linked character is deleted.
// Model logic keeps one save slot row per user and slot index.
export const saveSlots = sqliteTable("save_slots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  characterId: integer("character_id").references(() => characters.id),
  slotIndex: integer("slot_index").notNull(),
  slotName: text("slot_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  lastPlayedAt: integer("last_played_at", { mode: "timestamp" })
});

// ------------------------------------------------------------
// INVENTORY AND EQUIPMENT
// ------------------------------------------------------------

// Stores owned item quantities for each character.
// itemKey points to fixed item definitions in src/constants/items.js.
// Model logic keeps one inventory row per character and item type.
export const characterInventory = sqliteTable("character_inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  itemKey: text("item_key").notNull(),
  quantity: integer("quantity").notNull().default(1),
  acquiredAt: integer("acquired_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

// Stores equipped items by character and equipment slot.
// itemKey still points to a fixed item definition; this table only stores ownership state.
// Model logic keeps one equipped item per character and equipment slot.
export const characterEquipment = sqliteTable("character_equipment", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  equipmentSlot: text("equipment_slot").notNull(),
  itemKey: text("item_key").notNull(),
  equippedAt: integer("equipped_at", { mode: "timestamp" }).notNull()
});

// ------------------------------------------------------------
// STORY AND GAME STATE FLAGS
// ------------------------------------------------------------

// Stores dialogue flags so completed conversations are remembered.
// flagKey points to fixed dialogue/story keys from src/constants/dialogues.js.
// Model logic keeps one row per character and dialogue flag.
export const characterDialogueFlags = sqliteTable("character_dialogue_flags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  flagKey: text("flag_key").notNull(),
  flagValue: integer("flag_value").notNull().default(1),
  setAt: integer("set_at", { mode: "timestamp" }).notNull()
});

// Stores boss progress, attempt count, defeat count, and latest outcome.
// bossKey points to boss enemy definitions in src/constants/enemies.js.
// Model logic keeps one boss state row per character and boss.
export const characterBossStates = sqliteTable("character_boss_states", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  bossKey: text("boss_key").notNull(),
  status: text("status").notNull().default("unknown"),
  attempts: integer("attempts").notNull().default(0),
  defeats: integer("defeats").notNull().default(0),
  bestTimeSeconds: real("best_time_seconds"),
  lastOutcome: text("last_outcome"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

// Stores campaign markers shown on the game map.
// markerKey is fixed game content, while reveal/completion state belongs to the player.
// Model logic keeps one campaign marker row per character and marker.
export const characterCampaignMarkers = sqliteTable("character_campaign_markers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  markerKey: text("marker_key").notNull(),
  regionKey: text("region_key").notNull(),
  markerType: text("marker_type").notNull(),
  isRevealed: integer("is_revealed").notNull().default(1),
  isCompleted: integer("is_completed").notNull().default(0),
  positionX: real("position_x"),
  positionY: real("position_y"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

// Stores one character's reputation state with each faction.
// factionKey points to src/constants/factions.js.
// Model logic keeps one faction reputation row per character and faction.
export const characterFactionReputation = sqliteTable("character_faction_reputation", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  factionKey: text("faction_key").notNull(),
  reputation: integer("reputation").notNull().default(0),
  rank: text("rank").notNull().default("neutral"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

// Stores per-region unlock, discovery, threat, and world-state progress.
// regionKey points to fixed region definitions in src/constants/regions.js.
// Model logic keeps one region state row per character and region.
export const characterRegionStates = sqliteTable("character_region_states", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id),
  regionKey: text("region_key").notNull(),
  isUnlocked: integer("is_unlocked").notNull().default(0),
  isDiscovered: integer("is_discovered").notNull().default(0),
  threatLevel: integer("threat_level").notNull().default(0),
  worldState: text("world_state").notNull().default("stable"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

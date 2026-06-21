import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, client, databaseUrl } from "./client.js";
import { abilities, characterAbilities, characters, quests, regions, users } from "./schema.js";
import {
  ABILITY_DEFINITIONS,
  QUEST_DEFINITIONS,
  REGION_DEFINITIONS
} from "../content/index.js";
import { hashPassword } from "../utils/passwords.js";

const now = new Date().toISOString();

const dropTableStatements = [
  "DROP TABLE IF EXISTS character_region_states",
  "DROP TABLE IF EXISTS character_faction_reputation",
  "DROP TABLE IF EXISTS character_campaign_markers",
  "DROP TABLE IF EXISTS character_boss_states",
  "DROP TABLE IF EXISTS character_dialogue_flags",
  "DROP TABLE IF EXISTS character_equipment",
  "DROP TABLE IF EXISTS character_inventory",
  "DROP TABLE IF EXISTS save_slots",
  "DROP TABLE IF EXISTS character_quest_completions",
  "DROP TABLE IF EXISTS character_run_states",
  "DROP TABLE IF EXISTS character_abilities",
  "DROP TABLE IF EXISTS abilities",
  "DROP TABLE IF EXISTS adventure_logs",
  "DROP TABLE IF EXISTS quests",
  "DROP TABLE IF EXISTS regions",
  "DROP TABLE IF EXISTS characters",
  "DROP TABLE IF EXISTS users"
];

const createTableStatements = [
  `CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 0,
    created_at VARCHAR(255) NOT NULL
  )`,
  `CREATE TABLE characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    character_name VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    affinity VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    hp INTEGER NOT NULL DEFAULT 100,
    strength INTEGER NOT NULL,
    intelligence INTEGER NOT NULL,
    agility INTEGER NOT NULL,
    faith INTEGER NOT NULL,
    endurance INTEGER NOT NULL,
    charisma INTEGER NOT NULL,
    created_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region_key VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    danger_level INTEGER NOT NULL,
    recommended_level INTEGER NOT NULL,
    faction VARCHAR(255),
    shard_name VARCHAR(255),
    is_unlocked INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quest_key VARCHAR(255) NOT NULL UNIQUE,
    region_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    quest_type VARCHAR(255) NOT NULL,
    required_level INTEGER NOT NULL,
    difficulty INTEGER NOT NULL,
    required_stat VARCHAR(255) NOT NULL,
    required_stat_value INTEGER NOT NULL,
    reward_xp INTEGER NOT NULL,
    reward_gold INTEGER NOT NULL,
    success_text VARCHAR(255) NOT NULL,
    failure_text VARCHAR(255) NOT NULL,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE adventure_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    quest_key VARCHAR(255) NOT NULL,
    outcome VARCHAR(255) NOT NULL,
    xp_gained INTEGER NOT NULL,
    gold_gained INTEGER NOT NULL,
    result_text VARCHAR(255) NOT NULL,
    created_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE abilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ability_key VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    class_name VARCHAR(255),
    affinity VARCHAR(255),
    ability_type VARCHAR(255) NOT NULL,
    power INTEGER NOT NULL,
    combo_tag VARCHAR(255),
    required_level INTEGER NOT NULL,
    description VARCHAR(255) NOT NULL
  )`,
  `CREATE TABLE character_abilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    ability_id INTEGER NOT NULL,
    unlocked_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (ability_id) REFERENCES abilities(id) ON DELETE CASCADE,
    UNIQUE (character_id, ability_id)
  )`,
  `CREATE TABLE character_run_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL UNIQUE,
    schema_version INTEGER NOT NULL DEFAULT 1,
    embers INTEGER NOT NULL DEFAULT 0,
    flask_charges INTEGER NOT NULL DEFAULT 4,
    last_hearthlight_x REAL NOT NULL DEFAULT -5,
    last_hearthlight_y REAL NOT NULL DEFAULT 0,
    last_hearthlight_z REAL NOT NULL DEFAULT 4,
    saved_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE character_quest_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    quest_key VARCHAR(255) NOT NULL,
    reward_xp INTEGER NOT NULL,
    awarded_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    UNIQUE (character_id, quest_key)
  )`,
  `CREATE TABLE save_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    character_id INTEGER,
    slot_index INTEGER NOT NULL,
    slot_name VARCHAR(255) NOT NULL,
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL,
    last_played_at VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL,
    UNIQUE (user_id, slot_index)
  )`,
  `CREATE TABLE character_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    item_key VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    acquired_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    UNIQUE (character_id, item_key)
  )`,
  `CREATE TABLE character_equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    equipment_slot VARCHAR(255) NOT NULL,
    item_key VARCHAR(255) NOT NULL,
    equipped_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    UNIQUE (character_id, equipment_slot)
  )`,
  `CREATE TABLE character_dialogue_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    flag_key VARCHAR(255) NOT NULL,
    flag_value VARCHAR(255) NOT NULL DEFAULT 'true',
    set_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    UNIQUE (character_id, flag_key)
  )`,
  `CREATE TABLE character_boss_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    boss_key VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'unknown',
    attempts INTEGER NOT NULL DEFAULT 0,
    defeats INTEGER NOT NULL DEFAULT 0,
    best_time_seconds REAL,
    last_outcome VARCHAR(255),
    updated_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    UNIQUE (character_id, boss_key)
  )`,
  `CREATE TABLE character_campaign_markers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    marker_key VARCHAR(255) NOT NULL,
    region_key VARCHAR(255) NOT NULL,
    marker_type VARCHAR(255) NOT NULL,
    is_revealed INTEGER NOT NULL DEFAULT 1,
    is_completed INTEGER NOT NULL DEFAULT 0,
    position_x REAL,
    position_y REAL,
    position_z REAL,
    updated_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    UNIQUE (character_id, marker_key)
  )`,
  `CREATE TABLE character_faction_reputation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    faction_key VARCHAR(255) NOT NULL,
    reputation INTEGER NOT NULL DEFAULT 0,
    rank VARCHAR(255) NOT NULL DEFAULT 'neutral',
    updated_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    UNIQUE (character_id, faction_key)
  )`,
  `CREATE TABLE character_region_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    region_key VARCHAR(255) NOT NULL,
    is_unlocked INTEGER NOT NULL DEFAULT 0,
    is_discovered INTEGER NOT NULL DEFAULT 0,
    threat_level INTEGER NOT NULL DEFAULT 0,
    world_state VARCHAR(255) NOT NULL DEFAULT 'stable',
    updated_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    UNIQUE (character_id, region_key)
  )`
];

async function resetTables() {
  await client.execute("PRAGMA foreign_keys = OFF");

  for (const statement of dropTableStatements) {
    await client.execute(statement);
  }

  await client.execute("PRAGMA foreign_keys = ON");

  for (const statement of createTableStatements) {
    await client.execute(statement);
  }
}

async function seedData() {
  const demoPasswordHash = await hashPassword("demo-password-ca1");

  const [demoUser] = await db
    .insert(users)
    .values({
      username: "demoUnbound",
      password: demoPasswordHash,
      level: 1,
      xp: 0,
      gold: 25,
      createdAt: now
    })
    .returning({ id: users.id });

  const [demoCharacter] = await db
    .insert(characters)
    .values({
      userId: demoUser.id,
      characterName: "Kael",
      origin: "Village Hunter",
      className: "Ranger",
      affinity: "Nature",
      level: 1,
      xp: 0,
      hp: 100,
      strength: 7,
      intelligence: 5,
      agility: 8,
      faith: 6,
      endurance: 7,
      charisma: 5,
      createdAt: now
    })
    .returning({ id: characters.id });

  await db.insert(regions).values(REGION_DEFINITIONS.map(toRegionRow));
  const regionRows = await db
    .select({ id: regions.id, regionKey: regions.regionKey })
    .from(regions);
  const regionIdByKey = new Map(regionRows.map((region) => [region.regionKey, region.id]));

  await db.insert(quests).values(
    QUEST_DEFINITIONS.map((quest) => toQuestRow(quest, regionIdByKey))
  );
  await db.insert(abilities).values(ABILITY_DEFINITIONS.map(toAbilityRow));

  const thornbind = await db
    .select({ id: abilities.id })
    .from(abilities)
    .where(eq(abilities.abilityKey, "ability_thornbind"))
    .limit(1);

  await db.insert(characterAbilities).values({
    characterId: demoCharacter.id,
    abilityId: thornbind[0].id,
    unlockedAt: now
  });
}

function toRegionRow(region) {
  return {
    regionKey: region.regionId,
    name: region.name,
    description: region.description,
    dangerLevel: region.dangerLevel,
    recommendedLevel: region.recommendedLevel,
    faction: region.faction,
    shardName: region.shardName,
    isUnlocked: region.isUnlocked
  };
}

function toQuestRow(quest, regionIdByKey) {
  const regionId = regionIdByKey.get(quest.regionId);

  if (!regionId) {
    throw new Error(`Cannot seed quest ${quest.questId}: region ${quest.regionId} is missing.`);
  }

  return {
    questKey: quest.questId,
    regionId,
    title: quest.title,
    description: quest.description,
    questType: quest.questType,
    requiredLevel: quest.requiredLevel,
    difficulty: quest.difficulty,
    requiredStat: quest.requiredStat,
    requiredStatValue: quest.requiredStatValue,
    rewardXp: quest.rewardXp,
    rewardGold: quest.rewardGold,
    successText: quest.successText,
    failureText: quest.failureText
  };
}

function toAbilityRow(ability) {
  return {
    abilityKey: ability.abilityId,
    name: ability.name,
    className: ability.className,
    affinity: ability.affinity,
    abilityType: ability.abilityType,
    power: ability.power,
    comboTag: ability.comboTag,
    requiredLevel: ability.requiredLevel,
    description: ability.description
  };
}

try {
  await resetTables();
  await seedData();

  console.log("Realmforge database seeded successfully.");
  console.log(`Database: ${databaseUrl}`);
  console.log(`Regions seeded: ${REGION_DEFINITIONS.length}`);
  console.log(`Quests seeded: ${QUEST_DEFINITIONS.length}`);
  console.log(`Abilities seeded: ${ABILITY_DEFINITIONS.length}`);
} catch (error) {
  console.error("Failed to seed Realmforge database.");
  console.error(error);
  process.exit(1);
}

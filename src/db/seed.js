import "dotenv/config";
import { db, client, databaseUrl } from "./client.js";
import { abilities, characterAbilities, characters, quests, regions, users } from "./schema.js";
import { hashPassword } from "../utils/passwords.js";

const now = new Date().toISOString();

const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS characters (
    character_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    character_name TEXT NOT NULL,
    origin TEXT NOT NULL,
    class_name TEXT NOT NULL,
    affinity TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    hp INTEGER NOT NULL DEFAULT 100,
    strength INTEGER NOT NULL,
    intelligence INTEGER NOT NULL,
    agility INTEGER NOT NULL,
    faith INTEGER NOT NULL,
    endurance INTEGER NOT NULL,
    charisma INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS regions (
    region_id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    danger_level INTEGER NOT NULL,
    recommended_level INTEGER NOT NULL,
    faction TEXT,
    shard_name TEXT,
    is_unlocked INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS quests (
    quest_id TEXT PRIMARY KEY,
    region_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    quest_type TEXT NOT NULL,
    required_level INTEGER NOT NULL,
    difficulty INTEGER NOT NULL,
    required_stat TEXT NOT NULL,
    required_stat_value INTEGER NOT NULL,
    reward_xp INTEGER NOT NULL,
    reward_gold INTEGER NOT NULL,
    success_text TEXT NOT NULL,
    failure_text TEXT NOT NULL,
    FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS adventure_logs (
    log_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    outcome TEXT NOT NULL,
    xp_gained INTEGER NOT NULL,
    gold_gained INTEGER NOT NULL,
    result_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES quests(quest_id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS abilities (
    ability_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class_name TEXT,
    affinity TEXT,
    ability_type TEXT NOT NULL,
    power INTEGER NOT NULL,
    combo_tag TEXT,
    required_level INTEGER NOT NULL,
    description TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS character_abilities (
    character_ability_id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    ability_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    FOREIGN KEY (ability_id) REFERENCES abilities(ability_id) ON DELETE CASCADE,
    UNIQUE (character_id, ability_id)
  )`,
  `CREATE TABLE IF NOT EXISTS character_run_states (
    character_id TEXT PRIMARY KEY,
    schema_version INTEGER NOT NULL DEFAULT 1,
    embers INTEGER NOT NULL DEFAULT 0,
    flask_charges INTEGER NOT NULL DEFAULT 4,
    last_hearthlight_x REAL NOT NULL DEFAULT -5,
    last_hearthlight_y REAL NOT NULL DEFAULT 0,
    last_hearthlight_z REAL NOT NULL DEFAULT 4,
    saved_at TEXT NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS character_quest_completions (
    character_quest_completion_id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    reward_xp INTEGER NOT NULL,
    awarded_at TEXT NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    UNIQUE (character_id, quest_id)
  )`
];

const regionSeed = [
  {
    regionId: "region_hearthmere_outpost",
    name: "Hearthmere Outpost",
    description:
      "A fortified starter settlement built from old caravans, broken imperial statues, and repaired stone walls along the Ashfall Road.",
    dangerLevel: 1,
    recommendedLevel: 1,
    faction: "Free Guilds",
    shardName: "Minor Worldheart Shard",
    isUnlocked: 1
  },
  {
    regionId: "region_ironvale_city",
    name: "Ironvale City",
    description:
      "A massive fortress-city where law, class tension, and shard-enhanced discipline shape every street and gate.",
    dangerLevel: 3,
    recommendedLevel: 2,
    faction: "Iron Crown",
    shardName: "Shard of Dominion",
    isUnlocked: 1
  },
  {
    regionId: "region_blackroot_forest",
    name: "Blackroot Forest",
    description:
      "A sacred forest twisted by a Worldheart fragment, where living paths shift and old spirits mistake travellers for invaders.",
    dangerLevel: 3,
    recommendedLevel: 2,
    faction: "Verdant Pact",
    shardName: "Shard of Growth",
    isUnlocked: 1
  },
  {
    regionId: "region_sunken_temple",
    name: "Sunken Temple",
    description:
      "The drowned remains of the Temple of Seven Lamps, where sacred archives hide records about the Worldheart and the Hollow Star.",
    dangerLevel: 4,
    recommendedLevel: 3,
    faction: "Sun Order",
    shardName: "Shard of Memory",
    isUnlocked: 1
  }
];

const questSeed = [
  {
    questId: "quest_road_that_still_stands",
    regionId: "region_hearthmere_outpost",
    title: "The Road That Still Stands",
    description: "Clear Hollowborn from the Ashfall Road so caravans can reach Hearthmere again.",
    questType: "combat",
    requiredLevel: 1,
    difficulty: 1,
    requiredStat: "strength",
    requiredStatValue: 6,
    rewardXp: 30,
    rewardGold: 15,
    successText: "The last Hollowborn falls, and the road breathes again beneath the ash.",
    failureText: "The Hollowborn scatter into the fog, leaving the road unsafe for another night."
  },
  {
    questId: "quest_refugee_gate_dispute",
    regionId: "region_ironvale_city",
    title: "Refugee Gate Dispute",
    description: "Convince Ironvale guards to let exhausted refugees enter before nightfall.",
    questType: "dialogue",
    requiredLevel: 1,
    difficulty: 2,
    requiredStat: "charisma",
    requiredStatValue: 8,
    rewardXp: 35,
    rewardGold: 10,
    successText: "The gate captain relents, and the refugees pass under Ironvale's shadowed arch.",
    failureText: "The guards hold their line, and the refugees are forced to camp outside the walls."
  },
  {
    questId: "quest_living_path",
    regionId: "region_blackroot_forest",
    title: "The Living Path",
    description: "Survive shifting Blackroot paths that move when no one is watching.",
    questType: "exploration",
    requiredLevel: 1,
    difficulty: 2,
    requiredStat: "agility",
    requiredStatValue: 8,
    rewardXp: 35,
    rewardGold: 12,
    successText: "You read the rhythm of the roots and step through the forest before it can close.",
    failureText: "The path twists back on itself, and the forest returns you to where you began."
  },
  {
    questId: "quest_drowned_scripture",
    regionId: "region_sunken_temple",
    title: "Drowned Scripture",
    description: "Recover a damaged scripture from the flooded halls beneath the Sunken Temple.",
    questType: "lore",
    requiredLevel: 2,
    difficulty: 3,
    requiredStat: "intelligence",
    requiredStatValue: 10,
    rewardXp: 45,
    rewardGold: 18,
    successText: "You surface with a scripture whose ink reforms into warnings about the Heart.",
    failureText: "The flooded archive shifts, and the scripture sinks deeper into the black water."
  },
  {
    questId: "quest_hollowbound_guard",
    regionId: "region_hearthmere_outpost",
    title: "Hollowbound Guard",
    description: "Face the corrupted caravan guard who still protects a journey that ended in blood.",
    questType: "boss",
    requiredLevel: 2,
    difficulty: 3,
    requiredStat: "endurance",
    requiredStatValue: 10,
    rewardXp: 60,
    rewardGold: 25,
    successText: "The guard kneels as the corruption fades, remembering at last who they protected.",
    failureText: "The guard's broken oath drives you back from the shrine."
  },
  {
    questId: "quest_iron_oath_trial",
    regionId: "region_ironvale_city",
    title: "Iron Oath Trial",
    description: "Prove yourself in an Iron Crown military challenge watched by Captain Rusk.",
    questType: "combat",
    requiredLevel: 2,
    difficulty: 3,
    requiredStat: "strength",
    requiredStatValue: 11,
    rewardXp: 55,
    rewardGold: 22,
    successText: "Your final strike rings against the training yard, and Ironvale takes notice.",
    failureText: "The drillmaster lowers his blade and tells you discipline is not learned in one day."
  },
  {
    questId: "quest_whispering_roots",
    regionId: "region_blackroot_forest",
    title: "Whispering Roots",
    description: "Resist forest voices calling with the memories of people you have lost.",
    questType: "magic",
    requiredLevel: 2,
    difficulty: 3,
    requiredStat: "faith",
    requiredStatValue: 10,
    rewardXp: 50,
    rewardGold: 16,
    successText: "You answer the voices with your own will, and the roots loosen their hold.",
    failureText: "The forest speaks with a familiar voice, and you lose the trail."
  },
  {
    questId: "quest_oracle_below",
    regionId: "region_sunken_temple",
    title: "The Oracle Below",
    description: "Face a memory echo of the Drowned Oracle beneath the Temple of Seven Lamps.",
    questType: "boss",
    requiredLevel: 3,
    difficulty: 4,
    requiredStat: "intelligence",
    requiredStatValue: 13,
    rewardXp: 75,
    rewardGold: 30,
    successText: "The Oracle's echo parts the water and leaves you with a truth that refuses to sleep.",
    failureText: "The Oracle closes the archive around you, and the truth remains beneath the waves."
  }
];

const abilitySeed = [
  {
    abilityId: "ability_spark",
    name: "Spark",
    className: null,
    affinity: "Fire",
    abilityType: "opener",
    power: 5,
    comboTag: "fire-opener",
    requiredLevel: 1,
    description: "A quick flare of Worldheart fire that starts aggressive combos."
  },
  {
    abilityId: "ability_flame_slash",
    name: "Flame Slash",
    className: "Spellblade",
    affinity: "Fire",
    abilityType: "chain",
    power: 9,
    comboTag: "fire-chain",
    requiredLevel: 1,
    description: "A burning blade strike used by spellblades who fight with ambition and speed."
  },
  {
    abilityId: "ability_ash_step",
    name: "Ash Step",
    className: "Rogue",
    affinity: "Fire",
    abilityType: "utility",
    power: 6,
    comboTag: "movement",
    requiredLevel: 2,
    description: "A short burst through ember and ash that helps avoid enemy pressure."
  },
  {
    abilityId: "ability_vanish",
    name: "Vanish",
    className: "Rogue",
    affinity: "Shadow",
    abilityType: "opener",
    power: 6,
    comboTag: "shadow-opener",
    requiredLevel: 1,
    description: "Slip out of sight long enough to begin a shadow combo."
  },
  {
    abilityId: "ability_shadow_cut",
    name: "Shadow Cut",
    className: "Rogue",
    affinity: "Shadow",
    abilityType: "chain",
    power: 10,
    comboTag: "shadow-chain",
    requiredLevel: 1,
    description: "Strike from an enemy's blind spot with condensed shadow."
  },
  {
    abilityId: "ability_bless",
    name: "Bless",
    className: "Cleric",
    affinity: "Holy",
    abilityType: "defensive",
    power: 7,
    comboTag: "holy-support",
    requiredLevel: 1,
    description: "A small protective prayer that steadies the Unbound in dangerous places."
  },
  {
    abilityId: "ability_smite",
    name: "Smite",
    className: "Paladin",
    affinity: "Holy",
    abilityType: "chain",
    power: 10,
    comboTag: "holy-chain",
    requiredLevel: 1,
    description: "A focused holy strike for warriors who carry faith into battle."
  },
  {
    abilityId: "ability_quickstep",
    name: "Quickstep",
    className: null,
    affinity: "Storm",
    abilityType: "utility",
    power: 5,
    comboTag: "movement",
    requiredLevel: 1,
    description: "Move with storm-touched speed before committing to an attack."
  },
  {
    abilityId: "ability_static_strike",
    name: "Static Strike",
    className: "Warrior",
    affinity: "Storm",
    abilityType: "opener",
    power: 8,
    comboTag: "storm-opener",
    requiredLevel: 1,
    description: "A sharp opening blow charged with restless storm energy."
  },
  {
    abilityId: "ability_life_tap",
    name: "Life Tap",
    className: "Warlock",
    affinity: "Blood",
    abilityType: "opener",
    power: 7,
    comboTag: "blood-opener",
    requiredLevel: 1,
    description: "Trade a small measure of safety for power drawn from blood."
  },
  {
    abilityId: "ability_thornbind",
    name: "Thornbind",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "utility",
    power: 8,
    comboTag: "nature-control",
    requiredLevel: 1,
    description: "Call roots from broken soil to slow an enemy's advance."
  },
  {
    abilityId: "ability_verdant_strike",
    name: "Verdant Strike",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "opener",
    power: 8,
    comboTag: "nature-opener",
    requiredLevel: 1,
    description: "Open a fight with a root-guided weapon strike that marks the target."
  },
  {
    abilityId: "ability_beastcall",
    name: "Beastcall",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "chain",
    power: 11,
    comboTag: "nature-chain",
    requiredLevel: 1,
    description: "Call a spectral beast through the marked path to keep pressure on the enemy."
  },
  {
    abilityId: "ability_heartwood_finish",
    name: "Heartwood Finish",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "finisher",
    power: 15,
    comboTag: "nature-finisher",
    requiredLevel: 2,
    description: "Drive Worldheart growth through the battlefield as a decisive nature finisher."
  },
  {
    abilityId: "ability_arcane_surge",
    name: "Arcane Surge",
    className: "Mage",
    affinity: "Arcane",
    abilityType: "finisher",
    power: 14,
    comboTag: "arcane-finisher",
    requiredLevel: 2,
    description: "Release stored willpower as a decisive burst of raw arcane force."
  }
];

async function createTables() {
  await client.execute("PRAGMA foreign_keys = ON");

  for (const statement of createTableStatements) {
    await client.execute(statement);
  }
}

async function seedData() {
  const demoPasswordHash = await hashPassword("demo-password-ca1");

  await db.insert(users).values({
    userId: "user_demo_unbound",
    username: "demoUnbound",
    password: demoPasswordHash,
    level: 1,
    xp: 0,
    gold: 25,
    createdAt: now
  }).onConflictDoUpdate({
    target: users.userId,
    set: {
      password: demoPasswordHash
    }
  });

  await db.insert(characters).values({
    characterId: "char_demo_kael",
    userId: "user_demo_unbound",
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
  }).onConflictDoNothing();

  await db.insert(regions).values(regionSeed).onConflictDoNothing();
  await db.insert(quests).values(questSeed).onConflictDoNothing();
  await db.insert(abilities).values(abilitySeed).onConflictDoNothing();

  await db.insert(characterAbilities).values({
    characterAbilityId: "char_ability_demo_thornbind",
    characterId: "char_demo_kael",
    abilityId: "ability_thornbind",
    unlockedAt: now
  }).onConflictDoNothing();
}

try {
  await createTables();
  await seedData();

  console.log("Realmforge database seeded successfully.");
  console.log(`Database: ${databaseUrl}`);
  console.log(`Regions seeded: ${regionSeed.length}`);
  console.log(`Quests seeded: ${questSeed.length}`);
  console.log(`Abilities seeded: ${abilitySeed.length}`);
} catch (error) {
  console.error("Failed to seed Realmforge database.");
  console.error(error);
  process.exit(1);
}

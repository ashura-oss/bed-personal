// ------------------------------------------------------------
// DATABASE SEED SCRIPT
// ------------------------------------------------------------
// Inserts safe demo rows so the API can be tested immediately after setup.
// Required before running endpoints: npm run db
// Important: every seed step checks for existing rows first, so repeated runs do not duplicate data.
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "./db.js";
import {
  characterAbilities,
  characterInventory,
  characterLocations,
  characterRunStates,
  characters,
  users
} from "./schema.js";
import { hashPassword } from "../utils/password.js";

const now = new Date();

// ------------------------------------------------------------
// MAIN SEED FLOW
// ------------------------------------------------------------

// Creates the demo user, demo character, and starting saved-game records.
async function seedData() {
  const demoUser = await findOrCreateDemoUser();
  const demoCharacter = await findOrCreateDemoCharacter(demoUser.id);

  await seedStartingAbility(demoCharacter.id);
  await seedStartingRunState(demoCharacter.id);
  await seedStartingLocation(demoCharacter.id);
  await seedStartingInventory(demoCharacter.id);
}

// ------------------------------------------------------------
// DEMO USER AND CHARACTER
// ------------------------------------------------------------

// Finds the demo account by username, or creates it if this is the first seed run.
async function findOrCreateDemoUser() {
  const existingUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, "demoDawn"))
    .limit(1);

  if (existingUsers.length > 0) {
    return existingUsers[0];
  }

  const [demoUser] = await db
    .insert(users)
    .values({
      username: "demoDawn",
      passwordHash: hashPassword("demo123"),
      level: 1,
      xp: 0,
      gold: 25,
      createdAt: now
    })
    .returning({ id: users.id });

  return demoUser;
}

// Finds the starter character for the demo user, or creates the first playable soldier.
async function findOrCreateDemoCharacter(userId) {
  const existingCharacters = await db
    .select({ id: characters.id })
    .from(characters)
    .where(and(eq(characters.userId, userId), eq(characters.characterName, "Aren")))
    .limit(1);

  if (existingCharacters.length > 0) {
    return existingCharacters[0];
  }

  const [demoCharacter] = await db
    .insert(characters)
    .values({
      userId,
      characterName: "Aren",
      origin: "Taxed Village Guard",
      className: "Soldier",
      affinity: "Resolve",
      level: 1,
      xp: 0,
      hp: 115,
      strength: 9,
      intelligence: 5,
      agility: 5,
      faith: 5,
      endurance: 8,
      charisma: 5,
      createdAt: now
    })
    .returning({ id: characters.id });

  return demoCharacter;
}

// ------------------------------------------------------------
// STARTING CHARACTER STATE
// ------------------------------------------------------------

// Gives the demo character one basic combat ability for immediate combat testing.
async function seedStartingAbility(characterId) {
  const existingAbilities = await db
    .select({ id: characterAbilities.id })
    .from(characterAbilities)
    .where(
      and(
        eq(characterAbilities.characterId, characterId),
        eq(characterAbilities.abilityKey, "ability_basic_slash")
      )
    )
    .limit(1);

  if (existingAbilities.length === 0) {
    await db.insert(characterAbilities).values({
      characterId,
      abilityKey: "ability_basic_slash",
      unlockedAt: now
    });
  }
}

// Creates the first story/run state used by map, progression, and save screens.
async function seedStartingRunState(characterId) {
  const existingRunStates = await db
    .select({ id: characterRunStates.id })
    .from(characterRunStates)
    .where(eq(characterRunStates.characterId, characterId))
    .limit(1);

  if (existingRunStates.length === 0) {
    await db.insert(characterRunStates).values({
      characterId,
      supplies: 3,
      morale: 50,
      storyPhase: "village_rebellion",
      commandModeUnlocked: 0,
      savedAt: now
    });
  }
}

// Places the demo character at the first map node in Middle-earth.
async function seedStartingLocation(characterId) {
  const existingLocations = await db
    .select({ id: characterLocations.id })
    .from(characterLocations)
    .where(eq(characterLocations.characterId, characterId))
    .limit(1);

  if (existingLocations.length === 0) {
    await db.insert(characterLocations).values({
      characterId,
      regionKey: "region_middle_earth",
      nodeKey: "node_hearthvale_square",
      previousNodeKey: null,
      updatedAt: now
    });
  }
}

// Gives the demo character basic materials so inventory endpoints have data to read.
async function seedStartingInventory(characterId) {
  await seedInventoryItem(characterId, "item_iron_scrap", 2);
  await seedInventoryItem(characterId, "item_healing_herb", 3);
}

// Inserts one inventory item only if the character does not already own that item.
async function seedInventoryItem(characterId, itemId, quantity) {
  const existingItems = await db
    .select({ id: characterInventory.id })
    .from(characterInventory)
    .where(
      and(
        eq(characterInventory.characterId, characterId),
        eq(characterInventory.itemKey, itemId)
      )
    )
    .limit(1);

  if (existingItems.length === 0) {
    await db.insert(characterInventory).values({
      characterId,
      itemKey: itemId,
      quantity,
      acquiredAt: now,
      updatedAt: now
    });
  }
}

// ------------------------------------------------------------
// SCRIPT EXECUTION
// ------------------------------------------------------------

// Runs the seed flow and prints a clear result for the terminal.
try {
  await seedData();

  console.log("Dawn of Man database seeded successfully.");
  console.log(`Database: ${process.env.DATABASE_URL}`);
  console.log("fixed game definitions are loaded from src/constants.");
} catch (error) {
  console.error("Failed to seed Dawn of Man database.");
  console.error(error);
  process.exit(1);
}

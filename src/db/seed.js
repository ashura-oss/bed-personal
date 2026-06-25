import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db, databaseUrl } from "./db.js";
import {
  characterAbilities,
  characterInventory,
  characterLocations,
  characterRunStates,
  characters,
  users
} from "./schema.js";

const now = new Date();

async function seedData() {
  const demoUser = await findOrCreateDemoUser();
  const demoCharacter = await findOrCreateDemoCharacter(demoUser.id);

  await seedStartingAbility(demoCharacter.id);
  await seedStartingRunState(demoCharacter.id);
  await seedStartingLocation(demoCharacter.id);
  await seedStartingInventory(demoCharacter.id);
}

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
      level: 1,
      xp: 0,
      gold: 25,
      createdAt: now
    })
    .returning({ id: users.id });

  return demoUser;
}

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

async function seedStartingInventory(characterId) {
  await seedInventoryItem(characterId, "item_iron_scrap", 2);
  await seedInventoryItem(characterId, "item_healing_herb", 3);
}

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

try {
  await seedData();

  console.log("Dawn of Man database seeded successfully.");
  console.log(`Database: ${databaseUrl}`);
  console.log("Authored game definitions are loaded from src/constants.");
} catch (error) {
  console.error("Failed to seed Dawn of Man database.");
  console.error(error);
  process.exit(1);
}

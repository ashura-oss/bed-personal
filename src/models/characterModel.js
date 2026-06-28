// Character model functions run Drizzle queries for character rows.
// Related gameplay state is cleaned here when a character is deleted.
import { asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import {
  adventureLogs,
  characterAbilities,
  characterArmyStates,
  characterBossStates,
  characterCampaignMarkers,
  characterDialogueFlags,
  characterEquipment,
  characterFactionReputation,
  characterInventory,
  characterLocations,
  characterQuestCompletions,
  characterRegionStates,
  characterRunStates,
  characters,
  combatSessions,
  combatTurnLogs,
  saveSlots
} from "../db/schema.js";

// ------------------------------------------------------------
// CHARACTER LOOKUPS
// ------------------------------------------------------------

// Find all characters, with optional class filtering.
// Supports the query route without putting SQL logic in the controller.
export async function findCharacters(filters = {}) {
  const query = db.select({
    characterId: characters.id,
    userId: characters.userId,
    characterName: characters.characterName,
    origin: characters.origin,
    className: characters.className,
    affinity: characters.affinity,
    level: characters.level,
    xp: characters.xp,
    hp: characters.hp,
    strength: characters.strength,
    intelligence: characters.intelligence,
    agility: characters.agility,
    faith: characters.faith,
    endurance: characters.endurance,
    charisma: characters.charisma,
    createdAt: characters.createdAt
  }).from(characters).orderBy(asc(characters.createdAt));

  if (filters.className !== undefined) {
    return query.where(eq(characters.className, filters.className));
  }

  return query;
}

// Find one character row by id.
// Returns null when the id does not exist so the controller can send 404.
export async function findCharacterById(characterId) {
  const result = await db
    .select({
      id: characters.id,
      userId: characters.userId,
      characterName: characters.characterName,
      origin: characters.origin,
      className: characters.className,
      affinity: characters.affinity,
      level: characters.level,
      xp: characters.xp,
      hp: characters.hp,
      strength: characters.strength,
      intelligence: characters.intelligence,
      agility: characters.agility,
      faith: characters.faith,
      endurance: characters.endurance,
      charisma: characters.charisma,
      createdAt: characters.createdAt
    })
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);

  return formatCharacter(result[0]);
}

// Find all character rows owned by one user.
// Used by the user route that lists a user's characters.
export async function findCharactersByUserId(userId) {
  return db
    .select({
      characterId: characters.id,
      userId: characters.userId,
      characterName: characters.characterName,
      origin: characters.origin,
      className: characters.className,
      affinity: characters.affinity,
      level: characters.level,
      xp: characters.xp,
      hp: characters.hp,
      strength: characters.strength,
      intelligence: characters.intelligence,
      agility: characters.agility,
      faith: characters.faith,
      endurance: characters.endurance,
      charisma: characters.charisma,
      createdAt: characters.createdAt
    })
    .from(characters)
    .where(eq(characters.userId, userId))
    .orderBy(asc(characters.createdAt));
}

// ------------------------------------------------------------
// CHARACTER CREATION
// ------------------------------------------------------------

// Insert one character row.
// Stats are calculated before this model is called, then saved as columns.
export async function createCharacter({
  userId,
  characterName,
  origin,
  className,
  affinity,
  stats
}) {
  const result = await db
    .insert(characters)
    .values({
      userId,
      characterName,
      origin,
      className,
      affinity,
      level: 1,
      xp: 0,
      hp: stats.hp,
      strength: stats.strength,
      intelligence: stats.intelligence,
      agility: stats.agility,
      faith: stats.faith,
      endurance: stats.endurance,
      charisma: stats.charisma,
      createdAt: new Date()
    })
    .returning();

  return formatCharacter(result[0]);
}

// ------------------------------------------------------------
// CHARACTER UPDATES
// ------------------------------------------------------------

// Update one character row by id.
// The controller decides which fields are allowed to change.
export async function updateCharacterById(characterId, updates) {
  const result = await db
    .update(characters)
    .set(updates)
    .where(eq(characters.id, characterId))
    .returning();

  return formatCharacter(result[0]);
}

// ------------------------------------------------------------
// CHARACTER REMOVALS
// ------------------------------------------------------------

// Delete one character row by id.
// Child rows are deleted first because the schema avoids cascade rules for practical-style clarity.
export async function deleteCharacterById(characterId) {
  await deleteCharacterChildRows(characterId);

  const result = await db
    .delete(characters)
    .where(eq(characters.id, characterId))
    .returning({ characterId: characters.id });

  return result[0] || null;
}

// ------------------------------------------------------------
// MODEL HELPERS
// ------------------------------------------------------------

// Convert a character database row into the API response shape.
function formatCharacter(character) {
  if (!character) {
    return null;
  }

  return {
    characterId: character.id,
    userId: character.userId,
    characterName: character.characterName,
    origin: character.origin,
    className: character.className,
    affinity: character.affinity,
    level: character.level,
    xp: character.xp,
    hp: character.hp,
    strength: character.strength,
    intelligence: character.intelligence,
    agility: character.agility,
    faith: character.faith,
    endurance: character.endurance,
    charisma: character.charisma,
    createdAt: character.createdAt
  };
}

// Delete rows that depend on a character before deleting the character row.
// This replaces database cascade behavior with visible cleanup code that is easier to explain.
async function deleteCharacterChildRows(characterId) {
  const combatSessionResult = await db
    .select({
      combatSessionId: combatSessions.id
    })
    .from(combatSessions)
    .where(eq(combatSessions.characterId, characterId));

  for (const combatSession of combatSessionResult) {
    await db
      .delete(combatTurnLogs)
      .where(eq(combatTurnLogs.combatSessionId, combatSession.combatSessionId));
  }

  await db.delete(combatSessions).where(eq(combatSessions.characterId, characterId));
  await db.delete(adventureLogs).where(eq(adventureLogs.characterId, characterId));
  await db.delete(characterAbilities).where(eq(characterAbilities.characterId, characterId));
  await db.delete(characterArmyStates).where(eq(characterArmyStates.characterId, characterId));
  await db.delete(characterBossStates).where(eq(characterBossStates.characterId, characterId));
  await db.delete(characterCampaignMarkers).where(eq(characterCampaignMarkers.characterId, characterId));
  await db.delete(characterDialogueFlags).where(eq(characterDialogueFlags.characterId, characterId));
  await db.delete(characterEquipment).where(eq(characterEquipment.characterId, characterId));
  await db.delete(characterFactionReputation).where(eq(characterFactionReputation.characterId, characterId));
  await db.delete(characterInventory).where(eq(characterInventory.characterId, characterId));
  await db.delete(characterLocations).where(eq(characterLocations.characterId, characterId));
  await db.delete(characterQuestCompletions).where(eq(characterQuestCompletions.characterId, characterId));
  await db.delete(characterRegionStates).where(eq(characterRegionStates.characterId, characterId));
  await db.delete(characterRunStates).where(eq(characterRunStates.characterId, characterId));

  await db
    .update(saveSlots)
    .set({
      characterId: null,
      updatedAt: new Date()
    })
    .where(eq(saveSlots.characterId, characterId));
}

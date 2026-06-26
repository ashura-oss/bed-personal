// Character model functions run Drizzle queries for character rows.
import { asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characters } from "../db/schema.js";

// Find characters.
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

// Find character by id.
export async function findCharacterById(characterId) {
  const character = await db.query.characters.findFirst({
    columns: {
      id: true,
      userId: true,
      characterName: true,
      origin: true,
      className: true,
      affinity: true,
      level: true,
      xp: true,
      hp: true,
      strength: true,
      intelligence: true,
      agility: true,
      faith: true,
      endurance: true,
      charisma: true,
      createdAt: true
    },
    where: eq(characters.id, characterId)
  });

  return formatCharacter(character);
}

// Find characters by user id.
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

// Create character.
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

// Update character by id.
export async function updateCharacterById(characterId, updates) {
  const result = await db
    .update(characters)
    .set(updates)
    .where(eq(characters.id, characterId))
    .returning();

  return formatCharacter(result[0]);
}

// Delete character by id.
export async function deleteCharacterById(characterId) {
  const result = await db
    .delete(characters)
    .where(eq(characters.id, characterId))
    .returning({ characterId: characters.id });

  return result[0] || null;
}

// Format character for API responses.
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

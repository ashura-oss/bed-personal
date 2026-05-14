import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { characters } from "../db/schema.js";
import { generateId } from "../utils/id.js";

const characterColumns = {
  characterId: characters.characterId,
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
};

export async function findCharacters(filters = {}) {
  const query = db.select(characterColumns).from(characters).orderBy(asc(characters.createdAt));

  if (filters.className !== undefined) {
    return query.where(eq(characters.className, filters.className));
  }

  return query;
}

export async function findCharacterById(characterId) {
  const result = await db
    .select(characterColumns)
    .from(characters)
    .where(eq(characters.characterId, characterId))
    .limit(1);

  return result[0] || null;
}

export async function findCharactersByUserId(userId) {
  return db
    .select(characterColumns)
    .from(characters)
    .where(eq(characters.userId, userId))
    .orderBy(asc(characters.createdAt));
}

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
      characterId: generateId("char"),
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
      createdAt: new Date().toISOString()
    })
    .returning(characterColumns);

  return result[0];
}

export async function updateCharacterById(characterId, updates) {
  const result = await db
    .update(characters)
    .set(updates)
    .where(eq(characters.characterId, characterId))
    .returning(characterColumns);

  return result[0] || null;
}

export async function deleteCharacterById(characterId) {
  const result = await db
    .delete(characters)
    .where(eq(characters.characterId, characterId))
    .returning({ characterId: characters.characterId });

  return result[0] || null;
}

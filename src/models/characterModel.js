import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { characters } from '../db/schema.js';

export const findAllCharacters = () => db.select().from(characters).orderBy(characters.id);

export const findCharacterById = async (id) => {
  const rows = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
  return rows[0] || null;
};

export const findCharactersByUserId = (userId) => (
  db.select().from(characters).where(eq(characters.userId, userId)).orderBy(characters.id)
);

export const createCharacter = async ({ userId, name, archetype }) => {
  const rows = await db.insert(characters).values({ userId, name, archetype }).returning();
  return rows[0];
};

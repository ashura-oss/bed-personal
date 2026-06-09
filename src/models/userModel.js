import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';

export const findAllUsers = () => db.select().from(users).orderBy(users.id);

export const findUserById = async (id) => {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] || null;
};

export const findUserByUsername = async (username) => {
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return rows[0] || null;
};

export const createUser = async ({ username, displayName }) => {
  const rows = await db.insert(users).values({ username, displayName }).returning();
  return rows[0];
};

export const updateUserProfile = async (id, { displayName }) => {
  const rows = await db
    .update(users)
    .set({ displayName })
    .where(eq(users.id, id))
    .returning();

  return rows[0] || null;
};

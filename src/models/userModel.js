import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { generateId } from "../utils/id.js";

const publicUserColumns = {
  userId: users.userId,
  username: users.username,
  level: users.level,
  xp: users.xp,
  gold: users.gold,
  createdAt: users.createdAt
};

const userCredentialColumns = {
  ...publicUserColumns,
  password: users.password
};

export async function findUsers(filters = {}) {
  const query = db.select(publicUserColumns).from(users).orderBy(asc(users.createdAt));

  if (filters.level !== undefined) {
    return query.where(eq(users.level, filters.level));
  }

  return query;
}

export async function findUserById(userId) {
  const result = await db
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  return result[0] || null;
}

export async function findUserByUsername(username) {
  const result = await db
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return result[0] || null;
}

export async function findUserCredentialsByUsername(username) {
  const result = await db
    .select(userCredentialColumns)
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return result[0] || null;
}

export async function createUser({ username, password }) {
  const result = await db
    .insert(users)
    .values({
      userId: generateId("user"),
      username,
      password,
      level: 1,
      xp: 0,
      gold: 0,
      createdAt: new Date().toISOString()
    })
    .returning(publicUserColumns);

  return result[0];
}

export async function updateUserById(userId, updates) {
  const result = await db
    .update(users)
    .set(updates)
    .where(eq(users.userId, userId))
    .returning(publicUserColumns);

  return result[0] || null;
}

export async function updateUserPasswordById(userId, password) {
  const result = await db
    .update(users)
    .set({ password })
    .where(eq(users.userId, userId))
    .returning({ userId: users.userId });

  return result[0] || null;
}

export async function deleteUserById(userId) {
  const result = await db
    .delete(users)
    .where(eq(users.userId, userId))
    .returning({ userId: users.userId });

  return result[0] || null;
}

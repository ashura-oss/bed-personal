// User model functions run Drizzle queries for user rows.
import { asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { users } from "../db/schema.js";

// ------------------------------------------------------------
// DATABASE READS
// ------------------------------------------------------------

// Find all users, with optional level filtering.
export async function findUsers(filters = {}) {
  const query = db.select({
    userId: users.id,
    username: users.username,
    level: users.level,
    xp: users.xp,
    gold: users.gold,
    createdAt: users.createdAt
  }).from(users).orderBy(asc(users.createdAt));

  if (filters.level !== undefined) {
    return query.where(eq(users.level, filters.level));
  }

  return query;
}

// Find one user row by id.
export async function findUserById(userId) {
  const user = await db.query.users.findFirst({
    columns: {
      id: true,
      username: true,
      level: true,
      xp: true,
      gold: true,
      createdAt: true
    },
    where: eq(users.id, userId)
  });

  return formatUser(user);
}

// Find one user row by username.
export async function findUserByUsername(username) {
  const user = await db.query.users.findFirst({
    columns: {
      id: true,
      username: true,
      level: true,
      xp: true,
      gold: true,
      createdAt: true
    },
    where: eq(users.username, username)
  });

  return formatUser(user);
}

// ------------------------------------------------------------
// DATABASE INSERTS
// ------------------------------------------------------------

// Insert one user row.
export async function createUser({ username }) {
  const result = await db
    .insert(users)
    .values({
      username,
      level: 1,
      xp: 0,
      gold: 0,
      createdAt: new Date()
    })
    .returning();

  return formatUser(result[0]);
}

// ------------------------------------------------------------
// DATABASE WRITES
// ------------------------------------------------------------

// Update one user row by id.
export async function updateUserById(userId, updates) {
  const result = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();

  return formatUser(result[0]);
}

// ------------------------------------------------------------
// DATABASE DELETES
// ------------------------------------------------------------

// Delete one user row by id.
export async function deleteUserById(userId) {
  const result = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning({ userId: users.id });

  return result[0] || null;
}

// ------------------------------------------------------------
// PRIVATE HELPERS
// ------------------------------------------------------------

// Convert a user database row into the API response shape.
function formatUser(user) {
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    username: user.username,
    level: user.level,
    xp: user.xp,
    gold: user.gold,
    createdAt: user.createdAt
  };
}

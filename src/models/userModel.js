// User model functions run Drizzle queries for user rows.
// User rows are the parent records for characters and save slots.
import { asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characters, saveSlots, users } from "../db/schema.js";
import { deleteCharacterById } from "./characterModel.js";

// ------------------------------------------------------------
// USER LOOKUPS
// ------------------------------------------------------------

// Find all users, with optional level filtering.
// Supports the query route without putting SQL code inside the controller.
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
// Returns null when the id does not exist so the controller can send 404.
export async function findUserById(userId) {
  const result = await db
    .select({
      id: users.id,
      username: users.username,
      level: users.level,
      xp: users.xp,
      gold: users.gold,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return formatUser(result[0]);
}

// Find one user row by username.
// Used before creating a user so duplicate usernames can be rejected.
export async function findUserByUsername(username) {
  const result = await db
    .select({
      id: users.id,
      username: users.username,
      level: users.level,
      xp: users.xp,
      gold: users.gold,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return formatUser(result[0]);
}

// Find one user row with password hash by username.
// Used only by login so password hashes are not returned in normal API responses.
export async function findUserCredentialsByUsername(username) {
  const result = await db
    .select({
      id: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
      level: users.level,
      xp: users.xp,
      gold: users.gold,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return result[0] || null;
}

// ------------------------------------------------------------
// USER CREATION
// ------------------------------------------------------------

// Insert one user row.
// New users always start with default level, XP, and gold.
export async function createUser({ username, passwordHash }) {
  const result = await db
    .insert(users)
    .values({
      username,
      passwordHash,
      level: 1,
      xp: 0,
      gold: 0,
      createdAt: new Date()
    })
    .returning();

  return formatUser(result[0]);
}

// ------------------------------------------------------------
// USER UPDATES
// ------------------------------------------------------------

// Update one user row by id.
// The controller decides which fields are allowed to change.
export async function updateUserById(userId, updates) {
  const result = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();

  return formatUser(result[0]);
}

// ------------------------------------------------------------
// USER REMOVALS
// ------------------------------------------------------------

// Delete one user row by id.
// Characters are deleted first so their dependent gameplay rows are also cleaned.
export async function deleteUserById(userId) {
  const characterResult = await db
    .select({
      characterId: characters.id
    })
    .from(characters)
    .where(eq(characters.userId, userId));

  for (const character of characterResult) {
    await deleteCharacterById(character.characterId);
  }

  await db.delete(saveSlots).where(eq(saveSlots.userId, userId));

  const result = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning({ userId: users.id });

  return result[0] || null;
}

// ------------------------------------------------------------
// MODEL HELPERS
// ------------------------------------------------------------

// Convert a user database row into the API response shape.
// This keeps database column names separate from API field names.
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

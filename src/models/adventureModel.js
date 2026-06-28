// Adventure model functions store adventure attempts and reward updates.
// Adventures use quest constants for rules, then this file saves the database result.
import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { adventureLogs, characters, users } from "../db/schema.js";

// ------------------------------------------------------------
// DATABASE READS
// ------------------------------------------------------------

// Find adventure logs by user id.
// Joins through characters because adventure logs belong to characters, not directly to users.
export async function findAdventureLogsByUserId(userId) {
  const rows = await db
    .select({
      logId: adventureLogs.id,
      characterId: adventureLogs.characterId,
      questId: adventureLogs.questKey,
      outcome: adventureLogs.outcome,
      xpGained: adventureLogs.xpGained,
      goldGained: adventureLogs.goldGained,
      resultText: adventureLogs.resultText,
      createdAt: adventureLogs.createdAt,
      userId: characters.userId,
      characterName: characters.characterName,
      characterClassName: characters.className,
      characterAffinity: characters.affinity
    })
    .from(adventureLogs)
    .innerJoin(characters, eq(adventureLogs.characterId, characters.id))
    .where(eq(characters.userId, userId))
    .orderBy(desc(adventureLogs.createdAt));

  return rows;
}

// Find adventure logs by character id.
// Used when the API needs one character's past adventure attempts.
export async function findAdventureLogsByCharacterId(characterId) {
  const rows = await db
    .select({
      logId: adventureLogs.id,
      characterId: adventureLogs.characterId,
      questId: adventureLogs.questKey,
      outcome: adventureLogs.outcome,
      xpGained: adventureLogs.xpGained,
      goldGained: adventureLogs.goldGained,
      resultText: adventureLogs.resultText,
      createdAt: adventureLogs.createdAt,
      userId: characters.userId,
      characterName: characters.characterName,
      characterClassName: characters.className,
      characterAffinity: characters.affinity
    })
    .from(adventureLogs)
    .innerJoin(characters, eq(adventureLogs.characterId, characters.id))
    .where(eq(adventureLogs.characterId, characterId))
    .orderBy(desc(adventureLogs.createdAt));

  return rows;
}

// ------------------------------------------------------------
// DATABASE INSERTS
// ------------------------------------------------------------

// Insert one adventure log and apply its user and character rewards.
// The transaction keeps the log, user XP/gold, and character XP/level in sync.
export async function recordAdventureAttempt({
  userId,
  characterId,
  questId,
  outcome,
  xpGained,
  goldGained,
  resultText,
  characterUpdates,
  userUpdates
}) {
  return db.transaction(async (tx) => {
    const updatedCharacterResult = await tx
      .update(characters)
      .set(characterUpdates)
      .where(eq(characters.id, characterId))
      .returning({
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
      });

    const updatedUserResult = await tx
      .update(users)
      .set(userUpdates)
      .where(eq(users.id, userId))
      .returning({
        userId: users.id,
        username: users.username,
        level: users.level,
        xp: users.xp,
        gold: users.gold,
        createdAt: users.createdAt
      });

    const adventureLogResult = await tx
      .insert(adventureLogs)
      .values({
        characterId,
        questKey: questId,
        outcome,
        xpGained,
        goldGained,
        resultText,
        createdAt: new Date()
      })
      .returning({
        logId: adventureLogs.id,
        characterId: adventureLogs.characterId,
        questId: adventureLogs.questKey,
        outcome: adventureLogs.outcome,
        xpGained: adventureLogs.xpGained,
        goldGained: adventureLogs.goldGained,
        resultText: adventureLogs.resultText,
        createdAt: adventureLogs.createdAt
      });

    return {
      character: updatedCharacterResult[0],
      user: updatedUserResult[0],
      adventureLog: {
        userId,
        ...adventureLogResult[0]
      }
    };
  });
}

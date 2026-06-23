import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { adventureLogs, characters, users } from "../db/schema.js";
import { findQuestById } from "./questModel.js";
import { findRegionById } from "./regionModel.js";

const adventureLogColumns = {
  id: adventureLogs.id,
  logId: adventureLogs.id,
  characterId: adventureLogs.characterId,
  questId: adventureLogs.questKey,
  outcome: adventureLogs.outcome,
  xpGained: adventureLogs.xpGained,
  goldGained: adventureLogs.goldGained,
  resultText: adventureLogs.resultText,
  createdAt: adventureLogs.createdAt
};

const adventureLogDetailColumns = {
  ...adventureLogColumns,
  userId: characters.userId,
  characterName: characters.characterName,
  characterClassName: characters.className,
  characterAffinity: characters.affinity
};

const characterColumns = {
  id: characters.id,
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
};

const publicUserColumns = {
  id: users.id,
  userId: users.id,
  username: users.username,
  level: users.level,
  xp: users.xp,
  gold: users.gold,
  createdAt: users.createdAt
};

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
      .returning(characterColumns);

    const updatedUserResult = await tx
      .update(users)
      .set(userUpdates)
      .where(eq(users.id, userId))
      .returning(publicUserColumns);

    const adventureLogResult = await tx
      .insert(adventureLogs)
      .values({
        characterId,
        questKey: questId,
        outcome,
        xpGained,
        goldGained,
        resultText,
        createdAt: new Date().toISOString()
      })
      .returning(adventureLogColumns);

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

export async function findAdventureLogsByUserId(userId) {
  const rows = await db
    .select(adventureLogDetailColumns)
    .from(adventureLogs)
    .innerJoin(characters, eq(adventureLogs.characterId, characters.id))
    .where(eq(characters.userId, userId))
    .orderBy(desc(adventureLogs.createdAt));

  return enrichAdventureLogRows(rows);
}

export async function findAdventureLogsByCharacterId(characterId) {
  const rows = await db
    .select(adventureLogDetailColumns)
    .from(adventureLogs)
    .innerJoin(characters, eq(adventureLogs.characterId, characters.id))
    .where(eq(adventureLogs.characterId, characterId))
    .orderBy(desc(adventureLogs.createdAt));

  return enrichAdventureLogRows(rows);
}

async function enrichAdventureLogRows(rows) {
  return Promise.all(
    rows.map(async (row) => {
      const quest = await findQuestById(row.questId);
      const region = quest ? await findRegionById(quest.regionId) : null;

      return {
        ...row,
        questTitle: quest?.title || row.questId,
        questType: quest?.questType || "unknown",
        regionId: quest?.regionId || null,
        regionName: region?.name || null
      };
    })
  );
}

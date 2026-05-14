import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { adventureLogs, characters, quests, regions, users } from "../db/schema.js";
import { generateId } from "../utils/id.js";

const adventureLogColumns = {
  logId: adventureLogs.logId,
  userId: adventureLogs.userId,
  characterId: adventureLogs.characterId,
  questId: adventureLogs.questId,
  outcome: adventureLogs.outcome,
  xpGained: adventureLogs.xpGained,
  goldGained: adventureLogs.goldGained,
  resultText: adventureLogs.resultText,
  createdAt: adventureLogs.createdAt
};

const adventureLogDetailColumns = {
  ...adventureLogColumns,
  questTitle: quests.title,
  questType: quests.questType,
  regionId: quests.regionId,
  regionName: regions.name,
  characterName: characters.characterName,
  characterClassName: characters.className,
  characterAffinity: characters.affinity
};

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

const publicUserColumns = {
  userId: users.userId,
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
      .where(eq(characters.characterId, characterId))
      .returning(characterColumns);

    const updatedUserResult = await tx
      .update(users)
      .set(userUpdates)
      .where(eq(users.userId, userId))
      .returning(publicUserColumns);

    const adventureLogResult = await tx
      .insert(adventureLogs)
      .values({
        logId: generateId("log"),
        userId,
        characterId,
        questId,
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
      adventureLog: adventureLogResult[0]
    };
  });
}

export async function findAdventureLogsByUserId(userId) {
  return db
    .select(adventureLogDetailColumns)
    .from(adventureLogs)
    .innerJoin(characters, eq(adventureLogs.characterId, characters.characterId))
    .innerJoin(quests, eq(adventureLogs.questId, quests.questId))
    .innerJoin(regions, eq(quests.regionId, regions.regionId))
    .where(eq(adventureLogs.userId, userId))
    .orderBy(desc(adventureLogs.createdAt));
}

export async function findAdventureLogsByCharacterId(characterId) {
  return db
    .select(adventureLogDetailColumns)
    .from(adventureLogs)
    .innerJoin(characters, eq(adventureLogs.characterId, characters.characterId))
    .innerJoin(quests, eq(adventureLogs.questId, quests.questId))
    .innerJoin(regions, eq(quests.regionId, regions.regionId))
    .where(eq(adventureLogs.characterId, characterId))
    .orderBy(desc(adventureLogs.createdAt));
}

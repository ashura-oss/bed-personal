// Army model functions read and save army state and battle logs.
import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterArmyStates, characterRunStates } from "../db/schema.js";

// Find army state by character id.
export async function findArmyStateByCharacterId(characterId) {
  const result = await db
    .select({
      characterArmyStateId: characterArmyStates.id,
      characterId: characterArmyStates.characterId,
      isUnlocked: characterArmyStates.isUnlocked,
      commandRank: characterArmyStates.commandRank,
      soldiers: characterArmyStates.soldiers,
      archers: characterArmyStates.archers,
      cavalry: characterArmyStates.cavalry,
      morale: characterArmyStates.morale,
      strategy: characterArmyStates.strategy,
      updatedAt: characterArmyStates.updatedAt
    })
    .from(characterArmyStates)
    .where(eq(characterArmyStates.characterId, characterId))
    .limit(1);

  return result[0] || null;
}

// Insert or update army state.
export async function upsertArmyState({
  characterId,
  isUnlocked,
  commandRank,
  soldiers,
  archers,
  cavalry,
  morale,
  strategy
}) {
  const existing = await findArmyStateByCharacterId(characterId);
  const now = new Date();
  const nextArmyState = {
    characterId,
    isUnlocked: isUnlocked ?? existing?.isUnlocked ?? 0,
    commandRank: commandRank ?? existing?.commandRank ?? "none",
    soldiers: soldiers ?? existing?.soldiers ?? 0,
    archers: archers ?? existing?.archers ?? 0,
    cavalry: cavalry ?? existing?.cavalry ?? 0,
    morale: morale ?? existing?.morale ?? 50,
    strategy: strategy ?? existing?.strategy ?? "hold",
    updatedAt: now
  };

  const query = existing
    ? db
        .update(characterArmyStates)
        .set({
          isUnlocked: nextArmyState.isUnlocked,
          commandRank: nextArmyState.commandRank,
          soldiers: nextArmyState.soldiers,
          archers: nextArmyState.archers,
          cavalry: nextArmyState.cavalry,
          morale: nextArmyState.morale,
          strategy: nextArmyState.strategy,
          updatedAt: now
        })
        .where(eq(characterArmyStates.id, existing.characterArmyStateId))
    : db.insert(characterArmyStates).values(nextArmyState);
  const result = await query
    .returning({
      characterArmyStateId: characterArmyStates.id,
      characterId: characterArmyStates.characterId,
      isUnlocked: characterArmyStates.isUnlocked,
      commandRank: characterArmyStates.commandRank,
      soldiers: characterArmyStates.soldiers,
      archers: characterArmyStates.archers,
      cavalry: characterArmyStates.cavalry,
      morale: characterArmyStates.morale,
      strategy: characterArmyStates.strategy,
      updatedAt: characterArmyStates.updatedAt
    });

  if (nextArmyState.isUnlocked === 1) {
    const existingRunStateResult = await db
      .select({
        characterId: characterRunStates.characterId
      })
      .from(characterRunStates)
      .where(eq(characterRunStates.characterId, characterId))
      .limit(1);
    const existingRunState = existingRunStateResult[0] || null;

    if (existingRunState) {
      await db
        .update(characterRunStates)
        .set({
          storyPhase: "king_of_mankind",
          commandModeUnlocked: 1,
          morale: nextArmyState.morale,
          savedAt: now
        })
        .where(eq(characterRunStates.characterId, characterId));
    } else {
      await db.insert(characterRunStates).values({
        characterId,
        supplies: 3,
        morale: nextArmyState.morale,
        storyPhase: "king_of_mankind",
        commandModeUnlocked: 1,
        savedAt: now
      });
    }
  }

  return result[0];
}

// Save army battle result.
export async function saveArmyBattleResult({ characterId, battleResult }) {
  const result = await db
    .update(characterArmyStates)
    .set({
      soldiers: battleResult.armyUpdates.soldiers,
      archers: battleResult.armyUpdates.archers,
      cavalry: battleResult.armyUpdates.cavalry,
      morale: battleResult.armyUpdates.morale,
      strategy: battleResult.armyUpdates.strategy,
      updatedAt: new Date()
    })
    .where(eq(characterArmyStates.characterId, characterId))
    .returning({
      characterArmyStateId: characterArmyStates.id,
      characterId: characterArmyStates.characterId,
      isUnlocked: characterArmyStates.isUnlocked,
      commandRank: characterArmyStates.commandRank,
      soldiers: characterArmyStates.soldiers,
      archers: characterArmyStates.archers,
      cavalry: characterArmyStates.cavalry,
      morale: characterArmyStates.morale,
      strategy: characterArmyStates.strategy,
      updatedAt: characterArmyStates.updatedAt
    });

  return result[0] || null;
}

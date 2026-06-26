// Combat model functions store combat sessions and turn logs.
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { combatSessions, combatTurnLogs } from "../db/schema.js";

// ------------------------------------------------------------
// DATABASE INSERTS
// ------------------------------------------------------------

// Create one combat session row for a character and enemy.
export async function createCombatSession({
  characterId,
  enemyId,
  questId = null,
  regionId,
  nodeId = null,
  playerHp,
  enemyHp
}) {
  const now = new Date();
  const result = await db
    .insert(combatSessions)
    .values({
      characterId,
      enemyKey: enemyId,
      questKey: questId,
      regionKey: regionId,
      nodeKey: nodeId,
      playerHp,
      enemyHp,
      maxPlayerHp: playerHp,
      maxEnemyHp: enemyHp,
      turnOwner: "player",
      status: "active",
      roundNumber: 1,
      createdAt: now,
      updatedAt: now
    })
    .returning({
      combatSessionId: combatSessions.id,
      characterId: combatSessions.characterId,
      enemyId: combatSessions.enemyKey,
      questId: combatSessions.questKey,
      regionId: combatSessions.regionKey,
      nodeId: combatSessions.nodeKey,
      playerHp: combatSessions.playerHp,
      enemyHp: combatSessions.enemyHp,
      maxPlayerHp: combatSessions.maxPlayerHp,
      maxEnemyHp: combatSessions.maxEnemyHp,
      turnOwner: combatSessions.turnOwner,
      status: combatSessions.status,
      roundNumber: combatSessions.roundNumber,
      createdAt: combatSessions.createdAt,
      updatedAt: combatSessions.updatedAt
    });

  return result[0];
}

// ------------------------------------------------------------
// DATABASE READS
// ------------------------------------------------------------

// Find combat session by id.
export async function findCombatSessionById(combatSessionId) {
  const result = await db
    .select({
      combatSessionId: combatSessions.id,
      characterId: combatSessions.characterId,
      enemyId: combatSessions.enemyKey,
      questId: combatSessions.questKey,
      regionId: combatSessions.regionKey,
      nodeId: combatSessions.nodeKey,
      playerHp: combatSessions.playerHp,
      enemyHp: combatSessions.enemyHp,
      maxPlayerHp: combatSessions.maxPlayerHp,
      maxEnemyHp: combatSessions.maxEnemyHp,
      turnOwner: combatSessions.turnOwner,
      status: combatSessions.status,
      roundNumber: combatSessions.roundNumber,
      createdAt: combatSessions.createdAt,
      updatedAt: combatSessions.updatedAt
    })
    .from(combatSessions)
    .where(eq(combatSessions.id, combatSessionId))
    .limit(1);

  return result[0] || null;
}

// Find active combat session by character id.
export async function findActiveCombatSessionByCharacterId(characterId) {
  const result = await db
    .select({
      combatSessionId: combatSessions.id,
      characterId: combatSessions.characterId,
      enemyId: combatSessions.enemyKey,
      questId: combatSessions.questKey,
      regionId: combatSessions.regionKey,
      nodeId: combatSessions.nodeKey,
      playerHp: combatSessions.playerHp,
      enemyHp: combatSessions.enemyHp,
      maxPlayerHp: combatSessions.maxPlayerHp,
      maxEnemyHp: combatSessions.maxEnemyHp,
      turnOwner: combatSessions.turnOwner,
      status: combatSessions.status,
      roundNumber: combatSessions.roundNumber,
      createdAt: combatSessions.createdAt,
      updatedAt: combatSessions.updatedAt
    })
    .from(combatSessions)
    .where(and(eq(combatSessions.characterId, characterId), eq(combatSessions.status, "active")))
    .limit(1);

  return result[0] || null;
}

// Find combat logs by session id.
export async function findCombatLogsBySessionId(combatSessionId) {
  return db
    .select({
      combatTurnLogId: combatTurnLogs.id,
      combatSessionId: combatTurnLogs.combatSessionId,
      actor: combatTurnLogs.actor,
      actionType: combatTurnLogs.actionType,
      abilityId: combatTurnLogs.abilityKey,
      damage: combatTurnLogs.damage,
      playerHpAfter: combatTurnLogs.playerHpAfter,
      enemyHpAfter: combatTurnLogs.enemyHpAfter,
      message: combatTurnLogs.message,
      createdAt: combatTurnLogs.createdAt
    })
    .from(combatTurnLogs)
    .where(eq(combatTurnLogs.combatSessionId, combatSessionId))
    .orderBy(asc(combatTurnLogs.id));
}

// ------------------------------------------------------------
// DATABASE WRITES
// ------------------------------------------------------------

// Save the updated session and turn logs together.
export async function saveCombatTurn({ combatSessionId, sessionUpdates, turnLogs }) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const sessionResult = await tx
      .update(combatSessions)
      .set({
        ...sessionUpdates,
        updatedAt: now
      })
      .where(eq(combatSessions.id, combatSessionId))
      .returning({
        combatSessionId: combatSessions.id,
        characterId: combatSessions.characterId,
        enemyId: combatSessions.enemyKey,
        questId: combatSessions.questKey,
        regionId: combatSessions.regionKey,
        nodeId: combatSessions.nodeKey,
        playerHp: combatSessions.playerHp,
        enemyHp: combatSessions.enemyHp,
        maxPlayerHp: combatSessions.maxPlayerHp,
        maxEnemyHp: combatSessions.maxEnemyHp,
        turnOwner: combatSessions.turnOwner,
        status: combatSessions.status,
        roundNumber: combatSessions.roundNumber,
        createdAt: combatSessions.createdAt,
        updatedAt: combatSessions.updatedAt
      });

    const savedLogs = [];

    for (const turnLog of turnLogs) {
      const logResult = await tx
        .insert(combatTurnLogs)
        .values({
          combatSessionId,
          actor: turnLog.actor,
          actionType: turnLog.actionType,
          abilityKey: turnLog.abilityId ?? null,
          damage: turnLog.damage,
          playerHpAfter: turnLog.playerHpAfter,
          enemyHpAfter: turnLog.enemyHpAfter,
          message: turnLog.message,
          createdAt: now
        })
        .returning({
          combatTurnLogId: combatTurnLogs.id,
          combatSessionId: combatTurnLogs.combatSessionId,
          actor: combatTurnLogs.actor,
          actionType: combatTurnLogs.actionType,
          abilityId: combatTurnLogs.abilityKey,
          damage: combatTurnLogs.damage,
          playerHpAfter: combatTurnLogs.playerHpAfter,
          enemyHpAfter: combatTurnLogs.enemyHpAfter,
          message: combatTurnLogs.message,
          createdAt: combatTurnLogs.createdAt
        });

      savedLogs.push(logResult[0]);
    }

    return {
      session: sessionResult[0],
      turnLogs: savedLogs
    };
  });
}

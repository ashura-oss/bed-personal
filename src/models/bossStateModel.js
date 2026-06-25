import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterBossStates } from "../db/schema.js";

export function findBossStatesByCharacterId(characterId) {
  return db
    .select({
      characterBossStateId: characterBossStates.id,
      characterId: characterBossStates.characterId,
      bossId: characterBossStates.bossKey,
      status: characterBossStates.status,
      attempts: characterBossStates.attempts,
      defeats: characterBossStates.defeats,
      bestTimeSeconds: characterBossStates.bestTimeSeconds,
      lastOutcome: characterBossStates.lastOutcome,
      updatedAt: characterBossStates.updatedAt
    })
    .from(characterBossStates)
    .where(eq(characterBossStates.characterId, characterId))
    .orderBy(asc(characterBossStates.bossKey));
}

export async function findBossStateByCharacterId(characterId, bossId) {
  return findBossState(characterId, bossId);
}

export async function upsertBossState({
  characterId,
  bossId,
  status,
  attempts,
  defeats,
  bestTimeSeconds,
  lastOutcome
}) {
  const now = new Date();
  const existing = await findBossState(characterId, bossId);
  const nextStatus = status ?? existing?.status ?? "unknown";
  const nextAttempts = attempts ?? existing?.attempts ?? 0;
  const nextDefeats = defeats ?? existing?.defeats ?? 0;
  const nextBestTimeSeconds =
    bestTimeSeconds !== undefined ? bestTimeSeconds : existing?.bestTimeSeconds ?? null;
  const nextLastOutcome = lastOutcome !== undefined ? lastOutcome : existing?.lastOutcome ?? null;
  const query = existing
    ? db
        .update(characterBossStates)
        .set({
          status: nextStatus,
          attempts: nextAttempts,
          defeats: nextDefeats,
          bestTimeSeconds: nextBestTimeSeconds,
          lastOutcome: nextLastOutcome,
          updatedAt: now
        })
        .where(eq(characterBossStates.id, existing.characterBossStateId))
    : db.insert(characterBossStates).values({
        characterId,
        bossKey: bossId,
        status: nextStatus,
        attempts: nextAttempts,
        defeats: nextDefeats,
        bestTimeSeconds: nextBestTimeSeconds,
        lastOutcome: nextLastOutcome,
        updatedAt: now
      });
  const result = await query
    .returning({
      characterBossStateId: characterBossStates.id,
      characterId: characterBossStates.characterId,
      bossId: characterBossStates.bossKey,
      status: characterBossStates.status,
      attempts: characterBossStates.attempts,
      defeats: characterBossStates.defeats,
      bestTimeSeconds: characterBossStates.bestTimeSeconds,
      lastOutcome: characterBossStates.lastOutcome,
      updatedAt: characterBossStates.updatedAt
    });

  return result[0];
}

async function findBossState(characterId, bossId) {
  const result = await db
    .select({
      characterBossStateId: characterBossStates.id,
      characterId: characterBossStates.characterId,
      bossId: characterBossStates.bossKey,
      status: characterBossStates.status,
      attempts: characterBossStates.attempts,
      defeats: characterBossStates.defeats,
      bestTimeSeconds: characterBossStates.bestTimeSeconds,
      lastOutcome: characterBossStates.lastOutcome,
      updatedAt: characterBossStates.updatedAt
    })
    .from(characterBossStates)
    .where(
      and(
        eq(characterBossStates.characterId, characterId),
        eq(characterBossStates.bossKey, bossId)
      )
    )
    .limit(1);

  return result[0] || null;
}

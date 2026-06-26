// Saved state model functions read and save frontend state rows.
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterBossStates, characterCampaignMarkers, characterDialogueFlags, characterFactionReputation, characterRegionStates, saveSlots } from "../db/schema.js";
import { findEquipmentByCharacterId, findInventoryByCharacterId } from "./characterInventoryModel.js";

// ------------------------------------------------------------
// FULL STATE READS
// ------------------------------------------------------------

// Combine separate state tables into one frontend-friendly payload.
export async function findFullCharacterState(characterId) {
  const inventory = await findInventoryByCharacterId(characterId);
  const equipment = await findEquipmentByCharacterId(characterId);
  const dialogueFlags = await findDialogueFlagsByCharacterId(characterId);
  const bossStates = await findBossStatesByCharacterId(characterId);
  const campaignMarkers = await findCampaignMarkersByCharacterId(characterId);
  const factionReputation = await findFactionReputationByCharacterId(characterId);
  const regionStates = await findRegionStatesByCharacterId(characterId);

  return {
    inventory,
    equipment,
    dialogueFlags,
    bossStates,
    campaignMarkers,
    factionReputation,
    regionStates
  };
}

// ------------------------------------------------------------
// SAVE SLOT READS AND WRITES
// ------------------------------------------------------------

// Find all save slot rows for one user.
export function findSaveSlotsByUserId(userId) {
  return db
    .select({
      saveSlotId: saveSlots.id,
      userId: saveSlots.userId,
      characterId: saveSlots.characterId,
      slotIndex: saveSlots.slotIndex,
      slotName: saveSlots.slotName,
      createdAt: saveSlots.createdAt,
      updatedAt: saveSlots.updatedAt,
      lastPlayedAt: saveSlots.lastPlayedAt
    })
    .from(saveSlots)
    .where(eq(saveSlots.userId, userId))
    .orderBy(asc(saveSlots.slotIndex));
}

// Insert or update one user save slot row.
export async function upsertSaveSlot({ userId, characterId = null, slotIndex, slotName }) {
  const now = new Date();
  const existingResult = await db
    .select({
      saveSlotId: saveSlots.id
    })
    .from(saveSlots)
    .where(and(eq(saveSlots.userId, userId), eq(saveSlots.slotIndex, slotIndex)))
    .limit(1);
  const existing = existingResult[0] || null;
  const query = existing
    ? db
        .update(saveSlots)
        .set({
          characterId,
          slotName,
          updatedAt: now,
          lastPlayedAt: now
        })
        .where(eq(saveSlots.id, existing.saveSlotId))
    : db.insert(saveSlots).values({
        userId,
        characterId,
        slotIndex,
        slotName,
        createdAt: now,
        updatedAt: now,
        lastPlayedAt: now
      });
  const result = await query.returning({
    saveSlotId: saveSlots.id,
    userId: saveSlots.userId,
    characterId: saveSlots.characterId,
    slotIndex: saveSlots.slotIndex,
    slotName: saveSlots.slotName,
    createdAt: saveSlots.createdAt,
    updatedAt: saveSlots.updatedAt,
    lastPlayedAt: saveSlots.lastPlayedAt
  });

  return result[0];
}

// ------------------------------------------------------------
// DIALOGUE FLAG READS AND WRITES
// ------------------------------------------------------------

// Find dialogue flags by character id.
export function findDialogueFlagsByCharacterId(characterId) {
  return db
    .select({
      characterDialogueFlagId: characterDialogueFlags.id,
      characterId: characterDialogueFlags.characterId,
      flagId: characterDialogueFlags.flagKey,
      flagValue: characterDialogueFlags.flagValue,
      setAt: characterDialogueFlags.setAt
    })
    .from(characterDialogueFlags)
    .where(eq(characterDialogueFlags.characterId, characterId))
    .orderBy(asc(characterDialogueFlags.flagKey));
}

// Insert or update dialogue flag.
export async function upsertDialogueFlag({ characterId, flagId, flagValue }) {
  const now = new Date();
  const existingResult = await db
    .select({
      characterDialogueFlagId: characterDialogueFlags.id
    })
    .from(characterDialogueFlags)
    .where(
      and(
        eq(characterDialogueFlags.characterId, characterId),
        eq(characterDialogueFlags.flagKey, flagId)
      )
    )
    .limit(1);
  const existing = existingResult[0] || null;
  const query = existing
    ? db
        .update(characterDialogueFlags)
        .set({
          flagValue,
          setAt: now
        })
        .where(eq(characterDialogueFlags.id, existing.characterDialogueFlagId))
    : db.insert(characterDialogueFlags).values({
        characterId,
        flagKey: flagId,
        flagValue,
        setAt: now
      });
  const result = await query.returning({
    characterDialogueFlagId: characterDialogueFlags.id,
    characterId: characterDialogueFlags.characterId,
    flagId: characterDialogueFlags.flagKey,
    flagValue: characterDialogueFlags.flagValue,
    setAt: characterDialogueFlags.setAt
  });

  return result[0];
}

// ------------------------------------------------------------
// BOSS STATE READS AND WRITES
// ------------------------------------------------------------

// Find all boss state rows for one character.
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

// Find one boss state row for one character.
export async function findBossStateByCharacterId(characterId, bossId) {
  return findBossState(characterId, bossId);
}

// Insert or update one boss state row.
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
  const result = await query.returning({
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

// ------------------------------------------------------------
// CAMPAIGN MARKER READS AND WRITES
// ------------------------------------------------------------

// Find all campaign marker rows for one character.
export function findCampaignMarkersByCharacterId(characterId) {
  return db
    .select({
      characterCampaignMarkerId: characterCampaignMarkers.id,
      characterId: characterCampaignMarkers.characterId,
      markerId: characterCampaignMarkers.markerKey,
      regionId: characterCampaignMarkers.regionKey,
      markerType: characterCampaignMarkers.markerType,
      isRevealed: characterCampaignMarkers.isRevealed,
      isCompleted: characterCampaignMarkers.isCompleted,
      positionX: characterCampaignMarkers.positionX,
      positionY: characterCampaignMarkers.positionY,
      updatedAt: characterCampaignMarkers.updatedAt
    })
    .from(characterCampaignMarkers)
    .where(eq(characterCampaignMarkers.characterId, characterId))
    .orderBy(asc(characterCampaignMarkers.markerKey));
}

// Insert or update one campaign marker row.
export async function upsertCampaignMarker({
  characterId,
  markerId,
  regionId,
  markerType,
  isRevealed,
  isCompleted,
  positionX,
  positionY
}) {
  const now = new Date();
  const existing = await findCampaignMarker(characterId, markerId);
  const nextRegionId = regionId ?? existing?.regionId;
  const nextMarkerType = markerType ?? existing?.markerType;
  const nextIsRevealed = isRevealed ?? existing?.isRevealed ?? 1;
  const nextIsCompleted = isCompleted ?? existing?.isCompleted ?? 0;
  const nextPositionX = positionX !== undefined ? positionX : existing?.positionX ?? null;
  const nextPositionY = positionY !== undefined ? positionY : existing?.positionY ?? null;
  const query = existing
    ? db
        .update(characterCampaignMarkers)
        .set({
          regionKey: nextRegionId,
          markerType: nextMarkerType,
          isRevealed: nextIsRevealed,
          isCompleted: nextIsCompleted,
          positionX: nextPositionX,
          positionY: nextPositionY,
          updatedAt: now
        })
        .where(eq(characterCampaignMarkers.id, existing.characterCampaignMarkerId))
    : db.insert(characterCampaignMarkers).values({
        characterId,
        markerKey: markerId,
        regionKey: nextRegionId,
        markerType: nextMarkerType,
        isRevealed: nextIsRevealed,
        isCompleted: nextIsCompleted,
        positionX: nextPositionX,
        positionY: nextPositionY,
        updatedAt: now
      });
  const result = await query.returning({
    characterCampaignMarkerId: characterCampaignMarkers.id,
    characterId: characterCampaignMarkers.characterId,
    markerId: characterCampaignMarkers.markerKey,
    regionId: characterCampaignMarkers.regionKey,
    markerType: characterCampaignMarkers.markerType,
    isRevealed: characterCampaignMarkers.isRevealed,
    isCompleted: characterCampaignMarkers.isCompleted,
    positionX: characterCampaignMarkers.positionX,
    positionY: characterCampaignMarkers.positionY,
    updatedAt: characterCampaignMarkers.updatedAt
  });

  return result[0];
}

// ------------------------------------------------------------
// FACTION REPUTATION READS AND WRITES
// ------------------------------------------------------------

// Find all faction reputation rows for one character.
export function findFactionReputationByCharacterId(characterId) {
  return db
    .select({
      characterFactionReputationId: characterFactionReputation.id,
      characterId: characterFactionReputation.characterId,
      factionId: characterFactionReputation.factionKey,
      reputation: characterFactionReputation.reputation,
      rank: characterFactionReputation.rank,
      updatedAt: characterFactionReputation.updatedAt
    })
    .from(characterFactionReputation)
    .where(eq(characterFactionReputation.characterId, characterId))
    .orderBy(asc(characterFactionReputation.factionKey));
}

// Insert or update one faction reputation row.
export async function upsertFactionReputation({ characterId, factionId, reputation, rank }) {
  const now = new Date();
  const existing = await findFactionReputation(characterId, factionId);
  const nextReputation = reputation ?? existing?.reputation ?? 0;
  const nextRank = rank ?? existing?.rank ?? "neutral";
  const query = existing
    ? db
        .update(characterFactionReputation)
        .set({
          reputation: nextReputation,
          rank: nextRank,
          updatedAt: now
        })
        .where(eq(characterFactionReputation.id, existing.characterFactionReputationId))
    : db.insert(characterFactionReputation).values({
        characterId,
        factionKey: factionId,
        reputation: nextReputation,
        rank: nextRank,
        updatedAt: now
      });
  const result = await query.returning({
    characterFactionReputationId: characterFactionReputation.id,
    characterId: characterFactionReputation.characterId,
    factionId: characterFactionReputation.factionKey,
    reputation: characterFactionReputation.reputation,
    rank: characterFactionReputation.rank,
    updatedAt: characterFactionReputation.updatedAt
  });

  return result[0];
}

// ------------------------------------------------------------
// REGION STATE READS AND WRITES
// ------------------------------------------------------------

// Find all region state rows for one character.
export function findRegionStatesByCharacterId(characterId) {
  return db
    .select({
      characterRegionStateId: characterRegionStates.id,
      characterId: characterRegionStates.characterId,
      regionId: characterRegionStates.regionKey,
      isUnlocked: characterRegionStates.isUnlocked,
      isDiscovered: characterRegionStates.isDiscovered,
      threatLevel: characterRegionStates.threatLevel,
      worldState: characterRegionStates.worldState,
      updatedAt: characterRegionStates.updatedAt
    })
    .from(characterRegionStates)
    .where(eq(characterRegionStates.characterId, characterId))
    .orderBy(asc(characterRegionStates.regionKey));
}

// Find one region state row for one character.
export async function findRegionStateByCharacterId(characterId, regionId) {
  return findRegionState(characterId, regionId);
}

// Insert or update one region state row.
export async function upsertRegionState({
  characterId,
  regionId,
  isUnlocked,
  isDiscovered,
  threatLevel,
  worldState
}) {
  const now = new Date();
  const existing = await findRegionState(characterId, regionId);
  const nextIsUnlocked = isUnlocked ?? existing?.isUnlocked ?? 0;
  const nextIsDiscovered = isDiscovered ?? existing?.isDiscovered ?? 0;
  const nextThreatLevel = threatLevel ?? existing?.threatLevel ?? 0;
  const nextWorldState = worldState ?? existing?.worldState ?? "stable";
  const query = existing
    ? db
        .update(characterRegionStates)
        .set({
          isUnlocked: nextIsUnlocked,
          isDiscovered: nextIsDiscovered,
          threatLevel: nextThreatLevel,
          worldState: nextWorldState,
          updatedAt: now
        })
        .where(eq(characterRegionStates.id, existing.characterRegionStateId))
    : db.insert(characterRegionStates).values({
        characterId,
        regionKey: regionId,
        isUnlocked: nextIsUnlocked,
        isDiscovered: nextIsDiscovered,
        threatLevel: nextThreatLevel,
        worldState: nextWorldState,
        updatedAt: now
      });
  const result = await query.returning({
    characterRegionStateId: characterRegionStates.id,
    characterId: characterRegionStates.characterId,
    regionId: characterRegionStates.regionKey,
    isUnlocked: characterRegionStates.isUnlocked,
    isDiscovered: characterRegionStates.isDiscovered,
    threatLevel: characterRegionStates.threatLevel,
    worldState: characterRegionStates.worldState,
    updatedAt: characterRegionStates.updatedAt
  });

  return result[0];
}

// ------------------------------------------------------------
// PRIVATE HELPERS
// ------------------------------------------------------------

// Find one boss state helper row by character and boss.
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

// Find one campaign marker helper row by character and marker.
async function findCampaignMarker(characterId, markerId) {
  const result = await db
    .select({
      characterCampaignMarkerId: characterCampaignMarkers.id,
      characterId: characterCampaignMarkers.characterId,
      markerId: characterCampaignMarkers.markerKey,
      regionId: characterCampaignMarkers.regionKey,
      markerType: characterCampaignMarkers.markerType,
      isRevealed: characterCampaignMarkers.isRevealed,
      isCompleted: characterCampaignMarkers.isCompleted,
      positionX: characterCampaignMarkers.positionX,
      positionY: characterCampaignMarkers.positionY,
      updatedAt: characterCampaignMarkers.updatedAt
    })
    .from(characterCampaignMarkers)
    .where(
      and(
        eq(characterCampaignMarkers.characterId, characterId),
        eq(characterCampaignMarkers.markerKey, markerId)
      )
    )
    .limit(1);

  return result[0] || null;
}

// Find one faction reputation helper row by character and faction.
async function findFactionReputation(characterId, factionId) {
  const result = await db
    .select({
      characterFactionReputationId: characterFactionReputation.id,
      characterId: characterFactionReputation.characterId,
      factionId: characterFactionReputation.factionKey,
      reputation: characterFactionReputation.reputation,
      rank: characterFactionReputation.rank,
      updatedAt: characterFactionReputation.updatedAt
    })
    .from(characterFactionReputation)
    .where(
      and(
        eq(characterFactionReputation.characterId, characterId),
        eq(characterFactionReputation.factionKey, factionId)
      )
    )
    .limit(1);

  return result[0] || null;
}

// Find one region state helper row by character and region.
async function findRegionState(characterId, regionId) {
  const result = await db
    .select({
      characterRegionStateId: characterRegionStates.id,
      characterId: characterRegionStates.characterId,
      regionId: characterRegionStates.regionKey,
      isUnlocked: characterRegionStates.isUnlocked,
      isDiscovered: characterRegionStates.isDiscovered,
      threatLevel: characterRegionStates.threatLevel,
      worldState: characterRegionStates.worldState,
      updatedAt: characterRegionStates.updatedAt
    })
    .from(characterRegionStates)
    .where(
      and(
        eq(characterRegionStates.characterId, characterId),
        eq(characterRegionStates.regionKey, regionId)
      )
    )
    .limit(1);

  return result[0] || null;
}

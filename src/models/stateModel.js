// Saved state model functions read and save persistent game state rows.
// These tables store campaign state that changes while the player plays.
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import {
  characterBossStates,
  characterCampaignMarkers,
  characterDialogueFlags,
  characterFactionReputation,
  characterRegionStates,
  saveSlots
} from "../db/schema.js";
import { findEquipmentByCharacterId, findInventoryByCharacterId } from "./characterInventoryModel.js";

// ------------------------------------------------------------
// FULL STATE LOOKUPS
// ------------------------------------------------------------

// Combines separate state tables into one payload for full state loading.
// This keeps the API convenient while the database stays normalized into separate tables.
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
// SAVE SLOT STATE
// ------------------------------------------------------------

// Find all save slot rows for one user.
// Used by the save menu to show every slot owned by the user.
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
// Keeps one save slot per user and slot index.
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
  let result;

  if (existing) {
    result = await db
      .update(saveSlots)
      .set({
        characterId,
        slotName,
        updatedAt: now,
        lastPlayedAt: now
      })
      .where(eq(saveSlots.id, existing.saveSlotId))
      .returning({
        saveSlotId: saveSlots.id,
        userId: saveSlots.userId,
        characterId: saveSlots.characterId,
        slotIndex: saveSlots.slotIndex,
        slotName: saveSlots.slotName,
        createdAt: saveSlots.createdAt,
        updatedAt: saveSlots.updatedAt,
        lastPlayedAt: saveSlots.lastPlayedAt
      });
  } else {
    result = await db
      .insert(saveSlots)
      .values({
        userId,
        characterId,
        slotIndex,
        slotName,
        createdAt: now,
        updatedAt: now,
        lastPlayedAt: now
      })
      .returning({
        saveSlotId: saveSlots.id,
        userId: saveSlots.userId,
        characterId: saveSlots.characterId,
        slotIndex: saveSlots.slotIndex,
        slotName: saveSlots.slotName,
        createdAt: saveSlots.createdAt,
        updatedAt: saveSlots.updatedAt,
        lastPlayedAt: saveSlots.lastPlayedAt
      });
  }

  return result[0];
}

// ------------------------------------------------------------
// DIALOGUE FLAG STATE
// ------------------------------------------------------------

// Find dialogue flags by character id.
// Flags record completed conversations or choices as simple 0/1 saved values.
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

// Insert or update one dialogue flag.
// Used when a conversation choice needs to be remembered.
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
  let result;

  if (existing) {
    result = await db
      .update(characterDialogueFlags)
      .set({
        flagValue,
        setAt: now
      })
      .where(eq(characterDialogueFlags.id, existing.characterDialogueFlagId))
      .returning({
        characterDialogueFlagId: characterDialogueFlags.id,
        characterId: characterDialogueFlags.characterId,
        flagId: characterDialogueFlags.flagKey,
        flagValue: characterDialogueFlags.flagValue,
        setAt: characterDialogueFlags.setAt
      });
  } else {
    result = await db
      .insert(characterDialogueFlags)
      .values({
        characterId,
        flagKey: flagId,
        flagValue,
        setAt: now
      })
      .returning({
        characterDialogueFlagId: characterDialogueFlags.id,
        characterId: characterDialogueFlags.characterId,
        flagId: characterDialogueFlags.flagKey,
        flagValue: characterDialogueFlags.flagValue,
        setAt: characterDialogueFlags.setAt
      });
  }

  return result[0];
}

// ------------------------------------------------------------
// BOSS STATE
// ------------------------------------------------------------

// Find all boss state rows for one character.
// Shows which bosses are unknown, active, attempted, or defeated.
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
// Used before updating a single boss progress record.
export async function findBossStateByCharacterId(characterId, bossId) {
  return findBossState(characterId, bossId);
}

// Insert or update one boss state row.
// Attempts, defeats, and latest outcome are stored on the same row.
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
  let result;

  if (existing) {
    result = await db
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
  } else {
    result = await db
      .insert(characterBossStates)
      .values({
        characterId,
        bossKey: bossId,
        status: nextStatus,
        attempts: nextAttempts,
        defeats: nextDefeats,
        bestTimeSeconds: nextBestTimeSeconds,
        lastOutcome: nextLastOutcome,
        updatedAt: now
      })
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
  }

  return result[0];
}

// ------------------------------------------------------------
// CAMPAIGN MARKER STATE
// ------------------------------------------------------------

// Find all campaign marker rows for one character.
// Campaign markers control which map/story markers have been revealed or completed.
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
// Used when story progression reveals or completes a map marker.
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
  let result;

  if (existing) {
    result = await db
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
      .returning({
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
  } else {
    result = await db
      .insert(characterCampaignMarkers)
      .values({
        characterId,
        markerKey: markerId,
        regionKey: nextRegionId,
        markerType: nextMarkerType,
        isRevealed: nextIsRevealed,
        isCompleted: nextIsCompleted,
        positionX: nextPositionX,
        positionY: nextPositionY,
        updatedAt: now
      })
      .returning({
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
  }

  return result[0];
}

// ------------------------------------------------------------
// FACTION REPUTATION STATE
// ------------------------------------------------------------

// Find all faction reputation rows for one character.
// Reputation is saved per character and faction.
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
// Stores the latest reputation number and readable rank.
export async function upsertFactionReputation({ characterId, factionId, reputation, rank }) {
  const now = new Date();
  const existing = await findFactionReputation(characterId, factionId);
  const nextReputation = reputation ?? existing?.reputation ?? 0;
  const nextRank = rank ?? existing?.rank ?? "neutral";
  let result;

  if (existing) {
    result = await db
      .update(characterFactionReputation)
      .set({
        reputation: nextReputation,
        rank: nextRank,
        updatedAt: now
      })
      .where(eq(characterFactionReputation.id, existing.characterFactionReputationId))
      .returning({
        characterFactionReputationId: characterFactionReputation.id,
        characterId: characterFactionReputation.characterId,
        factionId: characterFactionReputation.factionKey,
        reputation: characterFactionReputation.reputation,
        rank: characterFactionReputation.rank,
        updatedAt: characterFactionReputation.updatedAt
      });
  } else {
    result = await db
      .insert(characterFactionReputation)
      .values({
        characterId,
        factionKey: factionId,
        reputation: nextReputation,
        rank: nextRank,
        updatedAt: now
      })
      .returning({
        characterFactionReputationId: characterFactionReputation.id,
        characterId: characterFactionReputation.characterId,
        factionId: characterFactionReputation.factionKey,
        reputation: characterFactionReputation.reputation,
        rank: characterFactionReputation.rank,
        updatedAt: characterFactionReputation.updatedAt
      });
  }

  return result[0];
}

// ------------------------------------------------------------
// REGION STATE
// ------------------------------------------------------------

// Find all region state rows for one character.
// Region state stores unlock/discovery values that are different for each character.
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
// Used before updating a single region's saved progress.
export async function findRegionStateByCharacterId(characterId, regionId) {
  return findRegionState(characterId, regionId);
}

// Insert or update one region state row.
// Keeps one saved state row per character and region.
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
  let result;

  if (existing) {
    result = await db
      .update(characterRegionStates)
      .set({
        isUnlocked: nextIsUnlocked,
        isDiscovered: nextIsDiscovered,
        threatLevel: nextThreatLevel,
        worldState: nextWorldState,
        updatedAt: now
      })
      .where(eq(characterRegionStates.id, existing.characterRegionStateId))
      .returning({
        characterRegionStateId: characterRegionStates.id,
        characterId: characterRegionStates.characterId,
        regionId: characterRegionStates.regionKey,
        isUnlocked: characterRegionStates.isUnlocked,
        isDiscovered: characterRegionStates.isDiscovered,
        threatLevel: characterRegionStates.threatLevel,
        worldState: characterRegionStates.worldState,
        updatedAt: characterRegionStates.updatedAt
      });
  } else {
    result = await db
      .insert(characterRegionStates)
      .values({
        characterId,
        regionKey: regionId,
        isUnlocked: nextIsUnlocked,
        isDiscovered: nextIsDiscovered,
        threatLevel: nextThreatLevel,
        worldState: nextWorldState,
        updatedAt: now
      })
      .returning({
        characterRegionStateId: characterRegionStates.id,
        characterId: characterRegionStates.characterId,
        regionId: characterRegionStates.regionKey,
        isUnlocked: characterRegionStates.isUnlocked,
        isDiscovered: characterRegionStates.isDiscovered,
        threatLevel: characterRegionStates.threatLevel,
        worldState: characterRegionStates.worldState,
        updatedAt: characterRegionStates.updatedAt
      });
  }

  return result[0];
}

// ------------------------------------------------------------
// MODEL HELPERS
// ------------------------------------------------------------

// Find one boss state helper row by character and boss.
// Private helper used by boss state insert/update functions.
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
// Private helper used by campaign marker insert/update functions.
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
// Private helper used by faction reputation insert/update functions.
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
// Private helper used by region state insert/update functions.
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

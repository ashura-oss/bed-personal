import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  characterBossStates,
  characterCampaignMarkers,
  characterDialogueFlags,
  characterEquipment,
  characterFactionReputation,
  characterInventory,
  characterRegionStates,
  saveSlots
} from "../db/schema.js";

const saveSlotColumns = {
  id: saveSlots.id,
  saveSlotId: saveSlots.id,
  userId: saveSlots.userId,
  characterId: saveSlots.characterId,
  slotIndex: saveSlots.slotIndex,
  slotName: saveSlots.slotName,
  createdAt: saveSlots.createdAt,
  updatedAt: saveSlots.updatedAt,
  lastPlayedAt: saveSlots.lastPlayedAt
};

const inventoryColumns = {
  id: characterInventory.id,
  characterInventoryId: characterInventory.id,
  characterId: characterInventory.characterId,
  itemId: characterInventory.itemKey,
  quantity: characterInventory.quantity,
  acquiredAt: characterInventory.acquiredAt,
  updatedAt: characterInventory.updatedAt
};

const equipmentColumns = {
  id: characterEquipment.id,
  characterEquipmentId: characterEquipment.id,
  characterId: characterEquipment.characterId,
  equipmentSlot: characterEquipment.equipmentSlot,
  itemId: characterEquipment.itemKey,
  equippedAt: characterEquipment.equippedAt
};

const dialogueFlagColumns = {
  id: characterDialogueFlags.id,
  characterDialogueFlagId: characterDialogueFlags.id,
  characterId: characterDialogueFlags.characterId,
  flagId: characterDialogueFlags.flagKey,
  flagValue: characterDialogueFlags.flagValue,
  setAt: characterDialogueFlags.setAt
};

const bossStateColumns = {
  id: characterBossStates.id,
  characterBossStateId: characterBossStates.id,
  characterId: characterBossStates.characterId,
  bossId: characterBossStates.bossKey,
  status: characterBossStates.status,
  attempts: characterBossStates.attempts,
  defeats: characterBossStates.defeats,
  bestTimeSeconds: characterBossStates.bestTimeSeconds,
  lastOutcome: characterBossStates.lastOutcome,
  updatedAt: characterBossStates.updatedAt
};

const campaignMarkerColumns = {
  id: characterCampaignMarkers.id,
  characterCampaignMarkerId: characterCampaignMarkers.id,
  characterId: characterCampaignMarkers.characterId,
  markerId: characterCampaignMarkers.markerKey,
  regionId: characterCampaignMarkers.regionKey,
  markerType: characterCampaignMarkers.markerType,
  isRevealed: characterCampaignMarkers.isRevealed,
  isCompleted: characterCampaignMarkers.isCompleted,
  positionX: characterCampaignMarkers.positionX,
  positionY: characterCampaignMarkers.positionY,
  positionZ: characterCampaignMarkers.positionZ,
  updatedAt: characterCampaignMarkers.updatedAt
};

const factionReputationColumns = {
  id: characterFactionReputation.id,
  characterFactionReputationId: characterFactionReputation.id,
  characterId: characterFactionReputation.characterId,
  factionId: characterFactionReputation.factionKey,
  reputation: characterFactionReputation.reputation,
  rank: characterFactionReputation.rank,
  updatedAt: characterFactionReputation.updatedAt
};

const regionStateColumns = {
  id: characterRegionStates.id,
  characterRegionStateId: characterRegionStates.id,
  characterId: characterRegionStates.characterId,
  regionId: characterRegionStates.regionKey,
  isUnlocked: characterRegionStates.isUnlocked,
  isDiscovered: characterRegionStates.isDiscovered,
  threatLevel: characterRegionStates.threatLevel,
  worldState: characterRegionStates.worldState,
  updatedAt: characterRegionStates.updatedAt
};

export async function findSaveSlotsByUserId(userId) {
  return db
    .select(saveSlotColumns)
    .from(saveSlots)
    .where(eq(saveSlots.userId, userId))
    .orderBy(asc(saveSlots.slotIndex));
}

export async function upsertSaveSlot({ userId, characterId = null, slotIndex, slotName }) {
  const now = new Date().toISOString();
  const result = await db
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
    .onConflictDoUpdate({
      target: [saveSlots.userId, saveSlots.slotIndex],
      set: {
        characterId,
        slotName,
        updatedAt: now,
        lastPlayedAt: now
      }
    })
    .returning(saveSlotColumns);

  return result[0];
}

export async function findFullCharacterState(characterId) {
  const [
    inventory,
    equipment,
    dialogueFlags,
    bossStates,
    campaignMarkers,
    factionReputation,
    regionStates
  ] = await Promise.all([
    findInventoryByCharacterId(characterId),
    findEquipmentByCharacterId(characterId),
    findDialogueFlagsByCharacterId(characterId),
    findBossStatesByCharacterId(characterId),
    findCampaignMarkersByCharacterId(characterId),
    findFactionReputationByCharacterId(characterId),
    findRegionStatesByCharacterId(characterId)
  ]);

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

export async function upsertInventoryItem({ characterId, itemId, quantity }) {
  const now = new Date().toISOString();
  const result = await db
    .insert(characterInventory)
    .values({
      characterId,
      itemKey: itemId,
      quantity,
      acquiredAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [characterInventory.characterId, characterInventory.itemKey],
      set: {
        quantity,
        updatedAt: now
      }
    })
    .returning(inventoryColumns);

  return result[0];
}

export async function removeInventoryItem({ characterId, itemId }) {
  const result = await db
    .delete(characterInventory)
    .where(
      and(eq(characterInventory.characterId, characterId), eq(characterInventory.itemKey, itemId))
    )
    .returning(inventoryColumns);

  return result[0] || null;
}

export async function upsertEquipment({ characterId, equipmentSlot, itemId }) {
  const now = new Date().toISOString();
  const result = await db
    .insert(characterEquipment)
    .values({
      characterId,
      equipmentSlot,
      itemKey: itemId,
      equippedAt: now
    })
    .onConflictDoUpdate({
      target: [characterEquipment.characterId, characterEquipment.equipmentSlot],
      set: {
        itemKey: itemId,
        equippedAt: now
      }
    })
    .returning(equipmentColumns);

  return result[0];
}

export async function removeEquipment({ characterId, equipmentSlot }) {
  const result = await db
    .delete(characterEquipment)
    .where(
      and(
        eq(characterEquipment.characterId, characterId),
        eq(characterEquipment.equipmentSlot, equipmentSlot)
      )
    )
    .returning(equipmentColumns);

  return result[0] || null;
}

export async function upsertDialogueFlag({ characterId, flagId, flagValue }) {
  const now = new Date().toISOString();
  const result = await db
    .insert(characterDialogueFlags)
    .values({
      characterId,
      flagKey: flagId,
      flagValue,
      setAt: now
    })
    .onConflictDoUpdate({
      target: [characterDialogueFlags.characterId, characterDialogueFlags.flagKey],
      set: {
        flagValue,
        setAt: now
      }
    })
    .returning(dialogueFlagColumns);

  return result[0];
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
  const now = new Date().toISOString();
  const existing = await findBossState(characterId, bossId);
  const nextStatus = status ?? existing?.status ?? "unknown";
  const nextAttempts = attempts ?? existing?.attempts ?? 0;
  const nextDefeats = defeats ?? existing?.defeats ?? 0;
  const nextBestTimeSeconds =
    bestTimeSeconds !== undefined ? bestTimeSeconds : existing?.bestTimeSeconds ?? null;
  const nextLastOutcome = lastOutcome !== undefined ? lastOutcome : existing?.lastOutcome ?? null;
  const result = await db
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
    .onConflictDoUpdate({
      target: [characterBossStates.characterId, characterBossStates.bossKey],
      set: {
        status: nextStatus,
        attempts: nextAttempts,
        defeats: nextDefeats,
        bestTimeSeconds: nextBestTimeSeconds,
        lastOutcome: nextLastOutcome,
        updatedAt: now
      }
    })
    .returning(bossStateColumns);

  return result[0];
}

export async function upsertCampaignMarker({
  characterId,
  markerId,
  regionId,
  markerType,
  isRevealed,
  isCompleted,
  positionX,
  positionY,
  positionZ
}) {
  const now = new Date().toISOString();
  const existing = await findCampaignMarker(characterId, markerId);
  const nextRegionId = regionId ?? existing?.regionId;
  const nextMarkerType = markerType ?? existing?.markerType;
  const nextIsRevealed = isRevealed ?? existing?.isRevealed ?? 1;
  const nextIsCompleted = isCompleted ?? existing?.isCompleted ?? 0;
  const nextPositionX = positionX !== undefined ? positionX : existing?.positionX ?? null;
  const nextPositionY = positionY !== undefined ? positionY : existing?.positionY ?? null;
  const nextPositionZ = positionZ !== undefined ? positionZ : existing?.positionZ ?? null;

  const result = await db
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
      positionZ: nextPositionZ,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [characterCampaignMarkers.characterId, characterCampaignMarkers.markerKey],
      set: {
        regionKey: nextRegionId,
        markerType: nextMarkerType,
        isRevealed: nextIsRevealed,
        isCompleted: nextIsCompleted,
        positionX: nextPositionX,
        positionY: nextPositionY,
        positionZ: nextPositionZ,
        updatedAt: now
      }
    })
    .returning(campaignMarkerColumns);

  return result[0];
}

export async function upsertFactionReputation({ characterId, factionId, reputation, rank }) {
  const now = new Date().toISOString();
  const existing = await findFactionReputation(characterId, factionId);
  const nextReputation = reputation ?? existing?.reputation ?? 0;
  const nextRank = rank ?? existing?.rank ?? "neutral";
  const result = await db
    .insert(characterFactionReputation)
    .values({
      characterId,
      factionKey: factionId,
      reputation: nextReputation,
      rank: nextRank,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [characterFactionReputation.characterId, characterFactionReputation.factionKey],
      set: {
        reputation: nextReputation,
        rank: nextRank,
        updatedAt: now
      }
    })
    .returning(factionReputationColumns);

  return result[0];
}

export async function upsertRegionState({
  characterId,
  regionId,
  isUnlocked,
  isDiscovered,
  threatLevel,
  worldState
}) {
  const now = new Date().toISOString();
  const existing = await findRegionState(characterId, regionId);
  const nextIsUnlocked = isUnlocked ?? existing?.isUnlocked ?? 0;
  const nextIsDiscovered = isDiscovered ?? existing?.isDiscovered ?? 0;
  const nextThreatLevel = threatLevel ?? existing?.threatLevel ?? 0;
  const nextWorldState = worldState ?? existing?.worldState ?? "stable";
  const result = await db
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
    .onConflictDoUpdate({
      target: [characterRegionStates.characterId, characterRegionStates.regionKey],
      set: {
        isUnlocked: nextIsUnlocked,
        isDiscovered: nextIsDiscovered,
        threatLevel: nextThreatLevel,
        worldState: nextWorldState,
        updatedAt: now
      }
    })
    .returning(regionStateColumns);

  return result[0];
}

function findInventoryByCharacterId(characterId) {
  return db
    .select(inventoryColumns)
    .from(characterInventory)
    .where(eq(characterInventory.characterId, characterId))
    .orderBy(asc(characterInventory.itemKey));
}

function findEquipmentByCharacterId(characterId) {
  return db
    .select(equipmentColumns)
    .from(characterEquipment)
    .where(eq(characterEquipment.characterId, characterId))
    .orderBy(asc(characterEquipment.equipmentSlot));
}

function findDialogueFlagsByCharacterId(characterId) {
  return db
    .select(dialogueFlagColumns)
    .from(characterDialogueFlags)
    .where(eq(characterDialogueFlags.characterId, characterId))
    .orderBy(asc(characterDialogueFlags.flagKey));
}

function findBossStatesByCharacterId(characterId) {
  return db
    .select(bossStateColumns)
    .from(characterBossStates)
    .where(eq(characterBossStates.characterId, characterId))
    .orderBy(asc(characterBossStates.bossKey));
}

async function findBossState(characterId, bossId) {
  const result = await db
    .select(bossStateColumns)
    .from(characterBossStates)
    .where(and(eq(characterBossStates.characterId, characterId), eq(characterBossStates.bossKey, bossId)))
    .limit(1);

  return result[0] || null;
}

function findCampaignMarkersByCharacterId(characterId) {
  return db
    .select(campaignMarkerColumns)
    .from(characterCampaignMarkers)
    .where(eq(characterCampaignMarkers.characterId, characterId))
    .orderBy(asc(characterCampaignMarkers.markerKey));
}

async function findCampaignMarker(characterId, markerId) {
  const result = await db
    .select(campaignMarkerColumns)
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

function findFactionReputationByCharacterId(characterId) {
  return db
    .select(factionReputationColumns)
    .from(characterFactionReputation)
    .where(eq(characterFactionReputation.characterId, characterId))
    .orderBy(asc(characterFactionReputation.factionKey));
}

async function findFactionReputation(characterId, factionId) {
  const result = await db
    .select(factionReputationColumns)
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

function findRegionStatesByCharacterId(characterId) {
  return db
    .select(regionStateColumns)
    .from(characterRegionStates)
    .where(eq(characterRegionStates.characterId, characterId))
    .orderBy(asc(characterRegionStates.regionKey));
}

async function findRegionState(characterId, regionId) {
  const result = await db
    .select(regionStateColumns)
    .from(characterRegionStates)
    .where(
      and(eq(characterRegionStates.characterId, characterId), eq(characterRegionStates.regionKey, regionId))
    )
    .limit(1);

  return result[0] || null;
}

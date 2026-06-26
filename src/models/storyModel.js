// Story model functions apply campaign changes after major story events.
import { and, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterArmyStates, characterBossStates, characterCampaignMarkers, characterFactionReputation, characterInventory, characterQuestCompletions, characterRegionStates, characterRunStates } from "../db/schema.js";

// Apply all campaign changes caused by defeating a boss.
export async function applyCombatVictoryStory({ characterId, enemy, questId, milestone }) {
  if (!milestone) {
    return null;
  }

  return db.transaction(async (tx) => {
    const now = new Date();

    await markBossDefeated(tx, {
      characterId,
      bossId: enemy.enemyId,
      now
    });
    await recordQuestCompletion(tx, {
      characterId,
      questId: questId || milestone.questId,
      rewardXp: Number(enemy.xpReward || 0),
      now
    });
    await upsertRunState(tx, {
      characterId,
      storyPhase: milestone.storyPhase,
      moraleChange: milestone.moraleChange,
      commandModeUnlocked: milestone.commandModeUnlocked,
      now
    });

    for (const regionId of milestone.unlockRegions || []) {
      await unlockRegion(tx, { characterId, regionId, worldState: milestone.storyPhase, now });
    }

    for (const marker of milestone.revealMarkers || []) {
      await revealCampaignMarker(tx, { characterId, marker, now });
    }

    for (const factionChange of milestone.factionChanges || []) {
      await applyFactionChange(tx, { characterId, factionChange, now });
    }

    for (const itemReward of milestone.grantItems || []) {
      await addInventoryReward(tx, { characterId, itemReward, now });
    }

    if (milestone.unlockArmy) {
      await unlockArmyState(tx, { characterId, armyState: milestone.unlockArmy, now });
    }

    return {
      enemyId: enemy.enemyId,
      questId: questId || milestone.questId,
      storyPhase: milestone.storyPhase,
      unlockedRegions: milestone.unlockRegions || [],
      revealedMarkers: milestone.revealMarkers || [],
      factionChanges: milestone.factionChanges || [],
      grantedItems: milestone.grantItems || [],
      armyUnlocked: Boolean(milestone.unlockArmy)
    };
  });
}

// Apply campaign changes caused by winning an army encounter.
export async function applyArmyVictoryStory({ characterId, encounter }) {
  return db.transaction(async (tx) => {
    const now = new Date();

    await upsertRunState(tx, {
      characterId,
      storyPhase: encounter.storyPhase,
      moraleChange: encounter.moraleReward,
      commandModeUnlocked: 1,
      now
    });

    for (const regionId of encounter.unlockRegions || []) {
      await unlockRegion(tx, { characterId, regionId, worldState: encounter.storyPhase, now });
    }

    for (const marker of encounter.revealMarkers || []) {
      await revealCampaignMarker(tx, { characterId, marker, now });
    }

    for (const factionChange of encounter.factionChanges || []) {
      await applyFactionChange(tx, { characterId, factionChange, now });
    }

    return {
      armyEncounterId: encounter.armyEncounterId,
      storyPhase: encounter.storyPhase,
      unlockedRegions: encounter.unlockRegions || [],
      revealedMarkers: encounter.revealMarkers || [],
      factionChanges: encounter.factionChanges || []
    };
  });
}

// Story helpers below are kept private because they are only used inside transactions.
async function markBossDefeated(tx, { characterId, bossId, now }) {
  const existingResult = await tx
    .select({
      characterBossStateId: characterBossStates.id,
      attempts: characterBossStates.attempts,
      defeats: characterBossStates.defeats
    })
    .from(characterBossStates)
    .where(
      and(eq(characterBossStates.characterId, characterId), eq(characterBossStates.bossKey, bossId))
    )
    .limit(1);
  const existing = existingResult[0] || null;

  if (existing) {
    await tx
      .update(characterBossStates)
      .set({
        status: "defeated",
        attempts: Math.max(existing.attempts || 0, 1),
        defeats: (existing.defeats || 0) + 1,
        lastOutcome: "success",
        updatedAt: now
      })
      .where(eq(characterBossStates.id, existing.characterBossStateId));
  } else {
    await tx.insert(characterBossStates).values({
      characterId,
      bossKey: bossId,
      status: "defeated",
      attempts: 1,
      defeats: 1,
      bestTimeSeconds: null,
      lastOutcome: "success",
      updatedAt: now
    });
  }
}

// Insert quest completion only once so rewards cannot be duplicated.
async function recordQuestCompletion(tx, { characterId, questId, rewardXp, now }) {
  const existingResult = await tx
    .select({
      characterQuestCompletionId: characterQuestCompletions.id
    })
    .from(characterQuestCompletions)
    .where(
      and(
        eq(characterQuestCompletions.characterId, characterId),
        eq(characterQuestCompletions.questKey, questId)
      )
    )
    .limit(1);
  const existing = existingResult[0] || null;

  if (!existing) {
    await tx.insert(characterQuestCompletions).values({
      characterId,
      questKey: questId,
      rewardXp,
      awardedAt: now
    });
  }
}

// Insert or update run state.
async function upsertRunState(
  tx,
  { characterId, storyPhase, moraleChange, commandModeUnlocked, now }
) {
  const existingResult = await tx
    .select({
      supplies: characterRunStates.supplies,
      morale: characterRunStates.morale,
      commandModeUnlocked: characterRunStates.commandModeUnlocked
    })
    .from(characterRunStates)
    .where(eq(characterRunStates.characterId, characterId))
    .limit(1);
  const existing = existingResult[0] || null;
  const nextRunState = {
    characterId,
    supplies: existing?.supplies ?? 3,
    morale: Math.max(0, Math.min(100, (existing?.morale ?? 50) + moraleChange)),
    storyPhase,
    commandModeUnlocked: Math.max(existing?.commandModeUnlocked ?? 0, commandModeUnlocked),
    savedAt: now
  };

  if (existing) {
    await tx
      .update(characterRunStates)
      .set({
        supplies: nextRunState.supplies,
        morale: nextRunState.morale,
        storyPhase: nextRunState.storyPhase,
        commandModeUnlocked: nextRunState.commandModeUnlocked,
        savedAt: now
      })
      .where(eq(characterRunStates.characterId, characterId));
  } else {
    await tx.insert(characterRunStates).values(nextRunState);
  }
}

// Unlock region.
async function unlockRegion(tx, { characterId, regionId, worldState, now }) {
  const existingResult = await tx
    .select({
      characterRegionStateId: characterRegionStates.id
    })
    .from(characterRegionStates)
    .where(
      and(
        eq(characterRegionStates.characterId, characterId),
        eq(characterRegionStates.regionKey, regionId)
      )
    )
    .limit(1);
  const existing = existingResult[0] || null;

  if (existing) {
    await tx
      .update(characterRegionStates)
      .set({
        isUnlocked: 1,
        isDiscovered: 1,
        worldState,
        updatedAt: now
      })
      .where(eq(characterRegionStates.id, existing.characterRegionStateId));
  } else {
    await tx.insert(characterRegionStates).values({
      characterId,
      regionKey: regionId,
      isUnlocked: 1,
      isDiscovered: 1,
      threatLevel: 0,
      worldState,
      updatedAt: now
    });
  }
}

// Reveal campaign marker.
async function revealCampaignMarker(tx, { characterId, marker, now }) {
  const existingResult = await tx
    .select({
      characterCampaignMarkerId: characterCampaignMarkers.id
    })
    .from(characterCampaignMarkers)
    .where(
      and(
        eq(characterCampaignMarkers.characterId, characterId),
        eq(characterCampaignMarkers.markerKey, marker.markerId)
      )
    )
    .limit(1);
  const existing = existingResult[0] || null;

  if (existing) {
    await tx
      .update(characterCampaignMarkers)
      .set({
        regionKey: marker.regionId,
        markerType: marker.markerType,
        isRevealed: 1,
        positionX: marker.positionX,
        positionY: marker.positionY,
        updatedAt: now
      })
      .where(eq(characterCampaignMarkers.id, existing.characterCampaignMarkerId));
  } else {
    await tx.insert(characterCampaignMarkers).values({
      characterId,
      markerKey: marker.markerId,
      regionKey: marker.regionId,
      markerType: marker.markerType,
      isRevealed: 1,
      isCompleted: 0,
      positionX: marker.positionX,
      positionY: marker.positionY,
      updatedAt: now
    });
  }
}

// Apply faction change.
async function applyFactionChange(tx, { characterId, factionChange, now }) {
  const existingResult = await tx
    .select({
      characterFactionReputationId: characterFactionReputation.id,
      reputation: characterFactionReputation.reputation
    })
    .from(characterFactionReputation)
    .where(
      and(
        eq(characterFactionReputation.characterId, characterId),
        eq(characterFactionReputation.factionKey, factionChange.factionId)
      )
    )
    .limit(1);
  const existing = existingResult[0] || null;
  const nextReputation = (existing?.reputation || 0) + factionChange.reputation;

  if (existing) {
    await tx
      .update(characterFactionReputation)
      .set({
        reputation: nextReputation,
        rank: factionChange.rank,
        updatedAt: now
      })
      .where(eq(characterFactionReputation.id, existing.characterFactionReputationId));
  } else {
    await tx.insert(characterFactionReputation).values({
      characterId,
      factionKey: factionChange.factionId,
      reputation: nextReputation,
      rank: factionChange.rank,
      updatedAt: now
    });
  }
}

// Add an item reward during a story update.
async function addInventoryReward(tx, { characterId, itemReward, now }) {
  const existingResult = await tx
    .select({
      characterInventoryId: characterInventory.id,
      quantity: characterInventory.quantity
    })
    .from(characterInventory)
    .where(
      and(
        eq(characterInventory.characterId, characterId),
        eq(characterInventory.itemKey, itemReward.itemId)
      )
    )
    .limit(1);
  const existing = existingResult[0] || null;
  const nextQuantity = (existing?.quantity || 0) + itemReward.quantity;

  if (existing) {
    await tx
      .update(characterInventory)
      .set({
        quantity: nextQuantity,
        updatedAt: now
      })
      .where(eq(characterInventory.id, existing.characterInventoryId));
  } else {
    await tx.insert(characterInventory).values({
      characterId,
      itemKey: itemReward.itemId,
      quantity: nextQuantity,
      acquiredAt: now,
      updatedAt: now
    });
  }
}

// Unlock army state.
async function unlockArmyState(tx, { characterId, armyState, now }) {
  const existingResult = await tx
    .select({
      characterArmyStateId: characterArmyStates.id
    })
    .from(characterArmyStates)
    .where(eq(characterArmyStates.characterId, characterId))
    .limit(1);
  const existing = existingResult[0] || null;

  if (existing) {
    await tx
      .update(characterArmyStates)
      .set({
        isUnlocked: 1,
        commandRank: armyState.commandRank,
        soldiers: armyState.soldiers,
        archers: armyState.archers,
        cavalry: armyState.cavalry,
        morale: armyState.morale,
        strategy: armyState.strategy,
        updatedAt: now
      })
      .where(eq(characterArmyStates.id, existing.characterArmyStateId));
  } else {
    await tx.insert(characterArmyStates).values({
      characterId,
      isUnlocked: 1,
      commandRank: armyState.commandRank,
      soldiers: armyState.soldiers,
      archers: armyState.archers,
      cavalry: armyState.cavalry,
      morale: armyState.morale,
      strategy: armyState.strategy,
      updatedAt: now
    });
  }
}

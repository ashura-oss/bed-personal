// Campaign marker model functions read and save map marker rows.
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterCampaignMarkers } from "../db/schema.js";

// Find campaign markers by character id.
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

// Insert or update campaign marker.
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
  const result = await query
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

  return result[0];
}

// Find campaign marker.
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

// Campaign marker controller functions save frontend map marker state.
import * as campaignMarkerModel from "../models/campaignMarkerModel.js";
import { hasRegionDefinition } from "../constants/regions.js";

// Update campaign marker.
export async function putCampaignMarker(req, res, next) {
  try {
    const character = res.locals.character;
    const regionIdValue = req.body?.regionId;
    const markerTypeValue = req.body?.markerType;
    const isRevealedValue = req.body?.isRevealed;
    const isCompletedValue = req.body?.isCompleted;
    const positionX = req.body?.positionX;
    const positionY = req.body?.positionY;

    if (typeof regionIdValue !== "string" || regionIdValue.trim().length === 0) {
      return res.status(400).json({ message: "regionId is required." });
    }

    const regionId = regionIdValue.trim();

    if (!hasRegionDefinition(regionId)) {
      return res.status(404).json({ message: "Region definition was not found." });
    }

    if (typeof markerTypeValue !== "string" || markerTypeValue.trim().length === 0) {
      return res.status(400).json({ message: "markerType is required." });
    }

    if (
      isRevealedValue !== undefined &&
      typeof isRevealedValue !== "boolean" &&
      isRevealedValue !== 0 &&
      isRevealedValue !== 1
    ) {
      return res.status(400).json({ message: "isRevealed must be a boolean or 0/1." });
    }

    if (
      isCompletedValue !== undefined &&
      typeof isCompletedValue !== "boolean" &&
      isCompletedValue !== 0 &&
      isCompletedValue !== 1
    ) {
      return res.status(400).json({ message: "isCompleted must be a boolean or 0/1." });
    }

    if (
      positionX !== undefined &&
      positionX !== null &&
      (typeof positionX !== "number" || Number.isNaN(positionX) || !Number.isFinite(positionX))
    ) {
      return res.status(400).json({ message: "positionX must be a finite number." });
    }

    if (
      positionY !== undefined &&
      positionY !== null &&
      (typeof positionY !== "number" || Number.isNaN(positionY) || !Number.isFinite(positionY))
    ) {
      return res.status(400).json({ message: "positionY must be a finite number." });
    }

    const marker = await campaignMarkerModel.upsertCampaignMarker({
      characterId: character.characterId,
      markerId: req.params.markerId,
      regionId,
      markerType: markerTypeValue.trim(),
      isRevealed: typeof isRevealedValue === "boolean" ? Number(isRevealedValue) : isRevealedValue,
      isCompleted: typeof isCompletedValue === "boolean" ? Number(isCompletedValue) : isCompletedValue,
      positionX,
      positionY
    });

    res.locals.data = marker;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

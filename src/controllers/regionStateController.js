import * as regionStateModel from "../models/regionStateModel.js";
import { hasRegionDefinition } from "../constants/regions.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

export async function putRegionState(req, res, next) {
  try {
    const character = res.locals.character;
    const isUnlockedValue = req.body?.isUnlocked;
    const isDiscoveredValue = req.body?.isDiscovered;
    const threatLevel = req.body?.threatLevel;
    const worldState = req.body?.worldState;

    if (!hasRegionDefinition(req.params.regionId)) {
      throw createHttpError(404, "Not Found", "Region definition was not found.");
    }

    if (
      isUnlockedValue !== undefined &&
      typeof isUnlockedValue !== "boolean" &&
      isUnlockedValue !== 0 &&
      isUnlockedValue !== 1
    ) {
      throw createHttpError(400, "Bad Request", "isUnlocked must be a boolean or 0/1.");
    }

    if (
      isDiscoveredValue !== undefined &&
      typeof isDiscoveredValue !== "boolean" &&
      isDiscoveredValue !== 0 &&
      isDiscoveredValue !== 1
    ) {
      throw createHttpError(400, "Bad Request", "isDiscovered must be a boolean or 0/1.");
    }

    if (threatLevel !== undefined && (!Number.isInteger(threatLevel) || threatLevel < 0)) {
      throw createHttpError(400, "Bad Request", "threatLevel must be a non-negative integer.");
    }

    if (worldState !== undefined && (typeof worldState !== "string" || worldState.trim().length === 0)) {
      throw createHttpError(400, "Bad Request", "worldState must be a non-empty string.");
    }

    const regionState = await regionStateModel.upsertRegionState({
      characterId: character.characterId,
      regionId: req.params.regionId,
      isUnlocked: typeof isUnlockedValue === "boolean" ? Number(isUnlockedValue) : isUnlockedValue,
      isDiscovered: typeof isDiscoveredValue === "boolean" ? Number(isDiscoveredValue) : isDiscoveredValue,
      threatLevel,
      worldState: worldState?.trim()
    });

    res.locals.data = regionState;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

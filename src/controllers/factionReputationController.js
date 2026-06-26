// Faction reputation controller functions save character reputation records.
import * as factionReputationModel from "../models/factionReputationModel.js";
import { hasFactionDefinition } from "../constants/factions.js";
import { createError, sendError } from "../utils/errorCode.js";

// Update faction reputation.
export async function putFactionReputation(req, res, next) {
  try {
    const character = res.locals.character;
    const reputationValue = req.body?.reputation;
    const rankValue = req.body?.rank;

    if (!hasFactionDefinition(req.params.factionId)) {
      throw createError(404, "Not Found", "Faction definition was not found.");
    }

    if (reputationValue !== undefined && !Number.isInteger(reputationValue)) {
      throw createError(400, "Bad Request", "reputation must be an integer.");
    }

    if (rankValue !== undefined && (typeof rankValue !== "string" || rankValue.trim().length === 0)) {
      throw createError(400, "Bad Request", "rank must be a non-empty string.");
    }

    const reputation = await factionReputationModel.upsertFactionReputation({
      characterId: character.characterId,
      factionId: req.params.factionId,
      reputation: reputationValue,
      rank: rankValue?.trim()
    });

    res.locals.data = reputation;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

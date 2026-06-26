// Faction reputation controller functions save character reputation records.
import * as factionReputationModel from "../models/factionReputationModel.js";
import { hasFactionDefinition } from "../constants/factions.js";

// ------------------------------------------------------------
// SAVE CONTROLLERS
// ------------------------------------------------------------

// Save one character's reputation with a faction.
export async function putFactionReputation(req, res, next) {
  try {
    const character = res.locals.character;
    const reputationValue = req.body?.reputation;
    const rankValue = req.body?.rank;

    if (!hasFactionDefinition(req.params.factionId)) {
      return res.status(404).json({ message: "Faction definition was not found." });
    }

    if (reputationValue !== undefined && !Number.isInteger(reputationValue)) {
      return res.status(400).json({ message: "reputation must be an integer." });
    }

    if (rankValue !== undefined && (typeof rankValue !== "string" || rankValue.trim().length === 0)) {
      return res.status(400).json({ message: "rank must be a non-empty string." });
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
    next(error);
  }
}

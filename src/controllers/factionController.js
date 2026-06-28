// Faction controller functions return fixed faction data.
// Factions are fixed constants; saved reputation is handled by state controllers/models.
import { FACTION_DEFINITIONS, findFactionDefinitionById } from "../constants/factions.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// FACTION LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets all faction definitions.
export async function getFactions(_req, res) {
  try {
    const factions = [...FACTION_DEFINITIONS].sort((left, right) =>
      left.name.localeCompare(right.name)
    );

    return res.status(200).json({
      message: "Factions retrieved.",
      data: factions
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one faction definition by id.
export async function getFactionById(req, res) {
  try {
    const faction = findFactionDefinitionById(req.params.factionId);

    if (!faction) {
      throw createHttpError(404, "Not Found", "Faction definition was not found.");
    }

    return res.status(200).json({
      message: "Faction retrieved.",
      data: faction
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

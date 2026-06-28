// Faction controller functions return fixed faction data.
// Factions are fixed constants; saved reputation is handled by state controllers/models.
import { FACTION_DEFINITIONS, findFactionDefinitionById } from "../constants/factions.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// FACTION LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets all faction definitions.
export async function getFactions(_req, res, next) {
  try {
    res.locals.data = [...FACTION_DEFINITIONS].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one faction definition by id.
export async function getFactionById(_req, res, next) {
  try {
    const faction = findFactionDefinitionById(res.locals.factionId);

    if (!faction) {
      throw createHttpError(404, "Not Found", "Faction definition was not found.");
    }

    res.locals.data = faction;
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

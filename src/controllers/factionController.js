// Faction controller functions return fixed faction data.
import { FACTION_DEFINITIONS, findFactionDefinitionById } from "../constants/factions.js";
import { createError, sendError } from "../utils/errorCode.js";

// Get factions.
export async function getFactions(req, res, next) {
  try {
    const factions = [...FACTION_DEFINITIONS].sort((left, right) =>
      left.name.localeCompare(right.name)
    );

    res.locals.data = factions;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Read one faction definition by id.
export async function getFactionById(req, res, next) {
  try {
    const faction = findFactionDefinitionById(req.params.factionId);

    if (!faction) {
      throw createError(404, "Not Found", "Faction definition was not found.");
    }

    res.locals.data = faction;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

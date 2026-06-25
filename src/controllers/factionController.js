import { FACTION_DEFINITIONS, findFactionDefinitionById } from "../constants/factions.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

export async function getFactions(req, res, next) {
  try {
    const factions = [...FACTION_DEFINITIONS].sort((left, right) =>
      left.name.localeCompare(right.name)
    );

    res.locals.data = factions;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getFactionById(req, res, next) {
  try {
    const faction = findFactionDefinitionById(req.params.factionId);

    if (!faction) {
      throw createHttpError(404, "Not Found", "Faction definition was not found.");
    }

    res.locals.data = faction;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

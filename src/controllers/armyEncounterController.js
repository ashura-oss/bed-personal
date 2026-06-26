import { ARMY_ENCOUNTER_DEFINITIONS, findArmyEncounterById as findArmyEncounterDefinitionById } from "../constants/armyEncounters.js";
import { createError, sendError } from "../utils/errorCode.js";

export async function getArmyEncounters(req, res, next) {
  try {
    let requiredStoryPhase = req.query.requiredStoryPhase;

    if (requiredStoryPhase !== undefined) {
      if (typeof requiredStoryPhase !== "string" || requiredStoryPhase.trim().length === 0) {
        throw createError(400, "Bad Request", "requiredStoryPhase must be a non-empty string.");
      }

      requiredStoryPhase = requiredStoryPhase.trim();
    }

    const encounters = ARMY_ENCOUNTER_DEFINITIONS.filter((encounter) => {
      if (
        requiredStoryPhase !== undefined &&
        encounter.requiredStoryPhase !== requiredStoryPhase
      ) {
        return false;
      }

      return true;
    }).sort((left, right) => left.name.localeCompare(right.name));

    res.locals.data = encounters;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

export async function getArmyEncounterById(req, res, next) {
  try {
    const encounter = findArmyEncounterDefinitionById(req.params.armyEncounterId);

    if (!encounter) {
      throw createError(404, "Not Found", "Army encounter definition was not found.");
    }

    res.locals.data = encounter;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

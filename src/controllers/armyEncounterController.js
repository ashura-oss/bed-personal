// Army encounter controller functions return fixed army encounter data.
import { ARMY_ENCOUNTER_DEFINITIONS, findArmyEncounterById as findArmyEncounterDefinitionById } from "../constants/armyEncounters.js";

// Get army encounters.
export async function getArmyEncounters(req, res, next) {
  try {
    let requiredStoryPhase = req.query.requiredStoryPhase;

    if (requiredStoryPhase !== undefined) {
      if (typeof requiredStoryPhase !== "string" || requiredStoryPhase.trim().length === 0) {
        return res.status(400).json({ message: "requiredStoryPhase must be a non-empty string." });
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
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Read one army encounter definition by id.
export async function getArmyEncounterById(req, res, next) {
  try {
    const encounter = findArmyEncounterDefinitionById(req.params.armyEncounterId);

    if (!encounter) {
      return res.status(404).json({ message: "Army encounter definition was not found." });
    }

    res.locals.data = encounter;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

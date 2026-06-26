// Faction controller functions return fixed faction data.
import { FACTION_DEFINITIONS, findFactionDefinitionById } from "../constants/factions.js";

// Get factions.
export async function getFactions(req, res, next) {
  try {
    const factions = [...FACTION_DEFINITIONS].sort((left, right) =>
      left.name.localeCompare(right.name)
    );

    res.locals.data = factions;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Read one faction definition by id.
export async function getFactionById(req, res, next) {
  try {
    const faction = findFactionDefinitionById(req.params.factionId);

    if (!faction) {
      return res.status(404).json({ message: "Faction definition was not found." });
    }

    res.locals.data = faction;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

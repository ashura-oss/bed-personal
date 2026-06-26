// Quest controller functions return quest definitions and validate quest references.
import { QUEST_DEFINITIONS, findQuestDefinitionById } from "../constants/quests.js";
import { findRegionDefinitionById } from "../constants/regions.js";

// ------------------------------------------------------------
// RESOURCE LOADERS
// ------------------------------------------------------------

// Load quest from body for the next controller.
export async function loadQuestFromBody(req, res, next) {
  try {
    const value = req.body?.questId;

    if (typeof value !== "string" || value.trim().length === 0) {
      return res.status(400).json({ message: "questId is required." });
    }

    const quest = findQuestDefinitionById(value.trim());

    if (!quest) {
      return res.status(404).json({ message: "Quest was not found." });
    }

    res.locals.quest = quest;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// READ CONTROLLERS
// ------------------------------------------------------------

// Return all quest definitions, optionally filtered by region.
export async function getQuests(req, res, next) {
  try {
    const questList = [...QUEST_DEFINITIONS].sort(
      (left, right) => left.requiredLevel - right.requiredLevel
    );

    res.locals.data = questList;
    next();
  } catch (error) {
    next(error);
  }
}

// Read one quest definition by id.
export async function getQuestById(req, res, next) {
  try {
    const quest = findQuestDefinitionById(req.params.id);

    if (!quest) {
      return res.status(404).json({ message: "Quest was not found." });
    }

    res.locals.data = quest;
    next();
  } catch (error) {
    next(error);
  }
}

// Get quests by region id.
export async function getQuestsByRegionId(req, res, next) {
  try {
    const region = findRegionDefinitionById(req.params.regionId);

    if (!region) {
      return res.status(404).json({ message: "Region was not found." });
    }

    const questList = QUEST_DEFINITIONS.filter(
      (quest) => quest.regionId === req.params.regionId
    ).sort((left, right) => left.requiredLevel - right.requiredLevel);

    res.locals.data = questList;
    next();
  } catch (error) {
    next(error);
  }
}

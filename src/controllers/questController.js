// Quest controller functions return quest definitions.
// Quest definitions are fixed constants; completion and reward state are saved elsewhere.
import { QUEST_DEFINITIONS, findQuestDefinitionById } from "../constants/quests.js";
import { findRegionDefinitionById } from "../constants/regions.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// QUEST LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets all quest definitions.
export async function getQuests(_req, res) {
  try {
    const questList = [...QUEST_DEFINITIONS].sort(
      (left, right) => left.requiredLevel - right.requiredLevel
    );

    return res.status(200).json({
      message: "Quests retrieved.",
      data: questList
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one quest definition by id.
export async function getQuestById(req, res) {
  try {
    const quest = findQuestDefinitionById(req.params.id);

    if (!quest) {
      throw createHttpError(404, "Not Found", "Quest was not found.");
    }

    return res.status(200).json({
      message: "Quest retrieved.",
      data: quest
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets all quests inside one region.
// Region ids are validated against fixed region definitions before filtering quests.
export async function getQuestsByRegionId(req, res) {
  try {
    const region = findRegionDefinitionById(req.params.regionId);

    if (!region) {
      throw createHttpError(404, "Not Found", "Region was not found.");
    }

    const questList = QUEST_DEFINITIONS.filter(
      (quest) => quest.regionId === req.params.regionId
    ).sort((left, right) => left.requiredLevel - right.requiredLevel);

    return res.status(200).json({
      message: "Region quests retrieved.",
      data: questList
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

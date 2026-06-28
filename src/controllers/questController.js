// Quest controller functions return quest definitions.
// Quest definitions are fixed constants; completion and reward state are saved elsewhere.
import { QUEST_DEFINITIONS, findQuestDefinitionById } from "../constants/quests.js";
import { findRegionDefinitionById } from "../constants/regions.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// QUEST LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets all quest definitions.
export async function getQuests(_req, res, next) {
  try {
    res.locals.data = [...QUEST_DEFINITIONS].sort(
      (left, right) => left.requiredLevel - right.requiredLevel
    );
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one quest definition by id.
export async function getQuestById(_req, res, next) {
  try {
    const quest = findQuestDefinitionById(res.locals.id);

    if (!quest) {
      throw createHttpError(404, "Not Found", "Quest was not found.");
    }

    res.locals.data = quest;
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets all quests inside one region.
export async function getQuestsByRegionId(_req, res, next) {
  try {
    const { regionId } = res.locals;
    const region = findRegionDefinitionById(regionId);

    if (!region) {
      throw createHttpError(404, "Not Found", "Region was not found.");
    }

    res.locals.data = QUEST_DEFINITIONS.filter(
      (quest) => quest.regionId === regionId
    ).sort((left, right) => left.requiredLevel - right.requiredLevel);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

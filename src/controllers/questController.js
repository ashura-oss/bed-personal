import { QUEST_DEFINITIONS, findQuestDefinitionById } from "../constants/quests.js";
import { findRegionDefinitionById } from "../constants/regions.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

export async function getQuests(req, res, next) {
  try {
    const questList = [...QUEST_DEFINITIONS].sort(
      (left, right) => left.requiredLevel - right.requiredLevel
    );

    res.locals.data = questList;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getQuestById(req, res, next) {
  try {
    const quest = findQuestDefinitionById(req.params.id);

    if (!quest) {
      throw createHttpError(404, "Not Found", "Quest was not found.");
    }

    res.locals.data = quest;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getQuestsByRegionId(req, res, next) {
  try {
    const region = findRegionDefinitionById(req.params.regionId);

    if (!region) {
      throw createHttpError(404, "Not Found", "Region was not found.");
    }

    const questList = QUEST_DEFINITIONS.filter(
      (quest) => quest.regionId === req.params.regionId
    ).sort((left, right) => left.requiredLevel - right.requiredLevel);

    res.locals.data = questList;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

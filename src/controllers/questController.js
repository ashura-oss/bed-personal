import { QUEST_DEFINITIONS, findQuestDefinitionById } from "../constants/quests.js";
import { findRegionDefinitionById } from "../constants/regions.js";
import { createError, sendError } from "../utils/errorCode.js";

export async function loadQuestFromBody(req, res, next) {
  try {
    const value = req.body?.questId;

    if (typeof value !== "string" || value.trim().length === 0) {
      throw createError(400, "Bad Request", "questId is required.");
    }

    const quest = findQuestDefinitionById(value.trim());

    if (!quest) {
      throw createError(404, "Not Found", "Quest was not found.");
    }

    res.locals.quest = quest;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

export async function getQuests(req, res, next) {
  try {
    const questList = [...QUEST_DEFINITIONS].sort(
      (left, right) => left.requiredLevel - right.requiredLevel
    );

    res.locals.data = questList;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

export async function getQuestById(req, res, next) {
  try {
    const quest = findQuestDefinitionById(req.params.id);

    if (!quest) {
      throw createError(404, "Not Found", "Quest was not found.");
    }

    res.locals.data = quest;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

export async function getQuestsByRegionId(req, res, next) {
  try {
    const region = findRegionDefinitionById(req.params.regionId);

    if (!region) {
      throw createError(404, "Not Found", "Region was not found.");
    }

    const questList = QUEST_DEFINITIONS.filter(
      (quest) => quest.regionId === req.params.regionId
    ).sort((left, right) => left.requiredLevel - right.requiredLevel);

    res.locals.data = questList;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

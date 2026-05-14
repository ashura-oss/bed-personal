import { findRegionById } from "../models/regionModel.js";
import {
  createQuest,
  deleteQuestById,
  findQuestById,
  findQuests,
  updateQuestById
} from "../models/questModel.js";
import { validateQuestType, validateRequiredStat } from "../utils/gameRules.js";
import { createHttpError } from "../utils/httpError.js";
import {
  getOptionalInteger,
  getOptionalString,
  getRequiredInteger,
  getRequiredString
} from "../utils/validate.js";

export async function getQuests(req, res, next) {
  try {
    const questList = await findQuests();

    res.status(200).json(questList);
  } catch (error) {
    next(error);
  }
}

export async function getQuestById(req, res, next) {
  try {
    const quest = await findQuestById(req.params.id);

    if (!quest) {
      throw createHttpError(404, "Not Found", "Quest was not found.");
    }

    res.status(200).json(quest);
  } catch (error) {
    next(error);
  }
}

export async function getQuestsByRegionId(req, res, next) {
  try {
    const region = await findRegionById(req.params.regionId);

    if (!region) {
      throw createHttpError(404, "Not Found", "Region was not found.");
    }

    const questList = await findQuests({ regionId: req.params.regionId });

    res.status(200).json(questList);
  } catch (error) {
    next(error);
  }
}

export async function postQuest(req, res, next) {
  try {
    const questData = buildRequiredQuestData(req.body);
    const region = await findRegionById(questData.regionId);

    if (!region) {
      throw createHttpError(404, "Not Found", "Region was not found.");
    }

    const quest = await createQuest(questData);

    res.status(201).json(quest);
  } catch (error) {
    next(error);
  }
}

export async function putQuestById(req, res, next) {
  try {
    const existingQuest = await findQuestById(req.params.id);

    if (!existingQuest) {
      throw createHttpError(404, "Not Found", "Quest was not found.");
    }

    const updates = buildQuestUpdates(req.body);

    if (updates.regionId !== undefined) {
      const region = await findRegionById(updates.regionId);

      if (!region) {
        throw createHttpError(404, "Not Found", "Region was not found.");
      }
    }

    const quest = await updateQuestById(req.params.id, updates);

    res.status(200).json(quest);
  } catch (error) {
    next(error);
  }
}

export async function deleteQuest(req, res, next) {
  try {
    const deletedQuest = await deleteQuestById(req.params.id);

    if (!deletedQuest) {
      throw createHttpError(404, "Not Found", "Quest was not found.");
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

function buildRequiredQuestData(body) {
  const questType = getRequiredString(body, "questType");
  const requiredStat = getRequiredString(body, "requiredStat");

  validateQuestType(questType);
  validateRequiredStat(requiredStat);

  return {
    regionId: getRequiredString(body, "regionId"),
    title: getRequiredString(body, "title"),
    description: getRequiredString(body, "description"),
    questType,
    requiredLevel: getRequiredInteger(body, "requiredLevel", { min: 1 }),
    difficulty: getRequiredInteger(body, "difficulty", { min: 1 }),
    requiredStat,
    requiredStatValue: getRequiredInteger(body, "requiredStatValue", { min: 1 }),
    rewardXp: getRequiredInteger(body, "rewardXp", { min: 0 }),
    rewardGold: getRequiredInteger(body, "rewardGold", { min: 0 }),
    successText: getRequiredString(body, "successText"),
    failureText: getRequiredString(body, "failureText")
  };
}

function buildQuestUpdates(body) {
  const updates = {};
  const regionId = getOptionalString(body, "regionId");
  const title = getOptionalString(body, "title");
  const description = getOptionalString(body, "description");
  const questType = getOptionalString(body, "questType");
  const requiredStat = getOptionalString(body, "requiredStat");
  const successText = getOptionalString(body, "successText");
  const failureText = getOptionalString(body, "failureText");
  const requiredLevel = getOptionalInteger(body, "requiredLevel", { min: 1 });
  const difficulty = getOptionalInteger(body, "difficulty", { min: 1 });
  const requiredStatValue = getOptionalInteger(body, "requiredStatValue", { min: 1 });
  const rewardXp = getOptionalInteger(body, "rewardXp", { min: 0 });
  const rewardGold = getOptionalInteger(body, "rewardGold", { min: 0 });

  if (questType !== undefined) {
    validateQuestType(questType);
    updates.questType = questType;
  }

  if (requiredStat !== undefined) {
    validateRequiredStat(requiredStat);
    updates.requiredStat = requiredStat;
  }

  assignIfDefined(updates, "regionId", regionId);
  assignIfDefined(updates, "title", title);
  assignIfDefined(updates, "description", description);
  assignIfDefined(updates, "requiredLevel", requiredLevel);
  assignIfDefined(updates, "difficulty", difficulty);
  assignIfDefined(updates, "requiredStatValue", requiredStatValue);
  assignIfDefined(updates, "rewardXp", rewardXp);
  assignIfDefined(updates, "rewardGold", rewardGold);
  assignIfDefined(updates, "successText", successText);
  assignIfDefined(updates, "failureText", failureText);

  if (Object.keys(updates).length === 0) {
    throw createHttpError(
      400,
      "Bad Request",
      "Provide at least one updatable quest field."
    );
  }

  return updates;
}

function assignIfDefined(target, key, value) {
  if (value !== undefined) {
    target[key] = value;
  }
}

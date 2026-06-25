import * as characterModel from "../models/characterModel.js";
import * as userModel from "../models/userModel.js";
import { findQuestDefinitionById } from "../constants/quests.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

export async function loadUserFromUserIdParam(req, res, next) {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId < 1) {
      throw createHttpError(400, "Bad Request", "userId must be a positive integer id.");
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    res.locals.user = user;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function loadUserFromIdParam(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId < 1) {
      throw createHttpError(400, "Bad Request", "id must be a positive integer id.");
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    res.locals.user = user;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function loadUserFromBody(req, res, next) {
  try {
    const value = req.body?.userId;
    const userId = typeof value === "string" ? Number(value) : value;

    if (!Number.isInteger(userId) || userId < 1) {
      throw createHttpError(400, "Bad Request", "userId must be a positive integer id.");
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    res.locals.user = user;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function loadCharacterFromCharacterIdParam(req, res, next) {
  try {
    const characterId = Number(req.params.characterId);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createHttpError(400, "Bad Request", "characterId must be a positive integer id.");
    }

    const character = await characterModel.findCharacterById(characterId);

    if (!character) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    res.locals.character = character;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function loadCharacterFromIdParam(req, res, next) {
  try {
    const characterId = Number(req.params.id);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createHttpError(400, "Bad Request", "id must be a positive integer id.");
    }

    const character = await characterModel.findCharacterById(characterId);

    if (!character) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    res.locals.character = character;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function loadCharacterFromBody(req, res, next) {
  try {
    const value = req.body?.characterId;
    const characterId = typeof value === "string" ? Number(value) : value;

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createHttpError(400, "Bad Request", "characterId must be a positive integer id.");
    }

    const character = await characterModel.findCharacterById(characterId);

    if (!character) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    res.locals.character = character;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function loadQuestFromBody(req, res, next) {
  try {
    const value = req.body?.questId;

    if (typeof value !== "string" || value.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "questId is required.");
    }

    const quest = findQuestDefinitionById(value.trim());

    if (!quest) {
      throw createHttpError(404, "Not Found", "Quest was not found.");
    }

    res.locals.quest = quest;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

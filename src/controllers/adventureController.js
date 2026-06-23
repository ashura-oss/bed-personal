import {
  findAdventureLogsByCharacterId,
  findAdventureLogsByUserId,
  recordAdventureAttempt
} from "../models/adventureModel.js";
import { findCharacterById } from "../models/characterModel.js";
import { findQuestById } from "../models/questModel.js";
import { findUserById } from "../models/userModel.js";
import { assertOwnsUserResource } from "../middlewares/authMiddleware.js";
import { resolveQuestAttempt } from "../utils/gameRules.js";
import { createHttpError } from "../utils/httpError.js";
import { buildCharacterProgression, buildUserProgression } from "../utils/leveling.js";
import { getRequiredId, getRequiredIdParam, getRequiredString } from "../utils/validate.js";

export async function postAdventureAttempt(req, res, next) {
  try {
    const userId = getRequiredId(req.body, "userId");
    const characterId = getRequiredId(req.body, "characterId");
    const questId = getRequiredString(req.body, "questId");
    const user = await findUserById(userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    assertOwnsUserResource(req, userId);

    const character = await findCharacterById(characterId);

    if (!character) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    if (character.userId !== userId) {
      throw createHttpError(400, "Bad Request", "Character does not belong to the provided user.");
    }

    const quest = await findQuestById(questId);

    if (!quest) {
      throw createHttpError(404, "Not Found", "Quest was not found.");
    }

    if (character.level < quest.requiredLevel) {
      throw createHttpError(
        400,
        "Bad Request",
        `Character level ${character.level} is too low for this quest. Required level is ${quest.requiredLevel}.`
      );
    }

    const attemptResult = resolveQuestAttempt(character, quest);
    const characterProgression = buildCharacterProgression(character, attemptResult.xpGained);
    const userProgression = buildUserProgression(
      user,
      attemptResult.xpGained,
      attemptResult.goldGained
    );
    const savedAttempt = await recordAdventureAttempt({
      userId,
      characterId,
      questId,
      outcome: attemptResult.outcome,
      xpGained: attemptResult.xpGained,
      goldGained: attemptResult.goldGained,
      resultText: attemptResult.resultText,
      characterUpdates: characterProgression.updates,
      userUpdates: userProgression.updates
    });

    res.locals.data = {
      outcome: attemptResult.outcome,
      resultText: attemptResult.resultText,
      rewards: {
        xp: attemptResult.xpGained,
        gold: attemptResult.goldGained
      },
      challenge: attemptResult.challenge,
      quest: {
        questId: quest.questId,
        title: quest.title,
        questType: quest.questType,
        requiredLevel: quest.requiredLevel,
        difficulty: quest.difficulty
      },
      characterProgression: characterProgression.summary,
      userProgression: userProgression.summary,
      character: savedAttempt.character,
      user: savedAttempt.user,
      adventureLog: savedAttempt.adventureLog
    };
    next();
  } catch (error) {
    next(error);
  }
}

export async function getAdventureLogsByUserId(req, res, next) {
  try {
    const userId = getRequiredIdParam(req.params, "userId");
    const user = await findUserById(userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    assertOwnsUserResource(req, userId);

    const adventureLogList = await findAdventureLogsByUserId(userId);

    res.locals.data = adventureLogList;
    next();
  } catch (error) {
    next(error);
  }
}

export async function getAdventureLogsByCharacterId(req, res, next) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const character = await findCharacterById(characterId);

    if (!character) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, character.userId);

    const adventureLogList = await findAdventureLogsByCharacterId(characterId);

    res.locals.data = adventureLogList;
    next();
  } catch (error) {
    next(error);
  }
}

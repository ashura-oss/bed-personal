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
import { getRequiredString } from "../utils/validate.js";

export async function postAdventureAttempt(req, res, next) {
  try {
    const userId = getRequiredString(req.body, "userId");
    const characterId = getRequiredString(req.body, "characterId");
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

    res.status(200).json({
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
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdventureLogsByUserId(req, res, next) {
  try {
    const user = await findUserById(req.params.userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    assertOwnsUserResource(req, req.params.userId);

    const adventureLogList = await findAdventureLogsByUserId(req.params.userId);

    res.status(200).json(adventureLogList);
  } catch (error) {
    next(error);
  }
}

export async function getAdventureLogsByCharacterId(req, res, next) {
  try {
    const character = await findCharacterById(req.params.characterId);

    if (!character) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, character.userId);

    const adventureLogList = await findAdventureLogsByCharacterId(req.params.characterId);

    res.status(200).json(adventureLogList);
  } catch (error) {
    next(error);
  }
}

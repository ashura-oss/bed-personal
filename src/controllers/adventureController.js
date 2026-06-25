import * as adventureModel from "../models/adventureModel.js";
import { findQuestDefinitionById } from "../constants/quests.js";
import { findRegionDefinitionById } from "../constants/regions.js";
import { resolveQuestAttempt } from "../utils/gameRules.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";
import { buildCharacterProgression, buildUserProgression } from "../utils/leveling.js";

export async function postAdventureAttempt(req, res, next) {
  try {
    const userId = typeof req.body?.userId === "string" ? Number(req.body.userId) : req.body?.userId;
    const characterId =
      typeof req.body?.characterId === "string" ? Number(req.body.characterId) : req.body?.characterId;

    if (!Number.isInteger(userId) || userId < 1) {
      throw createHttpError(400, "Bad Request", "userId must be a positive integer id.");
    }

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createHttpError(400, "Bad Request", "characterId must be a positive integer id.");
    }

    if (typeof req.body?.questId !== "string" || req.body.questId.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "questId is required.");
    }

    const questId = req.body.questId.trim();
    const user = res.locals.user;
    const character = res.locals.character;
    const quest = res.locals.quest;

    if (character.userId !== userId) {
      throw createHttpError(400, "Bad Request", "Character does not belong to the provided user.");
    }

    if (character.level < quest.requiredLevel) {
      throw createHttpError(
        400,
        "Bad Request",
        `Character level ${character.level} is too low for this quest. Required level is ${quest.requiredLevel}.`
      );
    }

    if (["combat", "boss", "strategy"].includes(quest.questType)) {
      throw createHttpError(
        400,
        "Bad Request",
        "This quest type must be resolved through its gameplay route."
      );
    }

    const attemptResult = resolveQuestAttempt(character, quest);
    const characterProgression = buildCharacterProgression(character, attemptResult.xpGained);
    const userProgression = buildUserProgression(
      user,
      attemptResult.xpGained,
      attemptResult.goldGained
    );
    const savedAttempt = await adventureModel.recordAdventureAttempt({
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
    sendHttpError(res, error);
  }
}

export async function getAdventureLogsByUserId(req, res, next) {
  try {
    const adventureLogList = await adventureModel.findAdventureLogsByUserId(res.locals.user.userId);

    res.locals.data = enrichAdventureLogRows(adventureLogList);
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getAdventureLogsByCharacterId(req, res, next) {
  try {
    const adventureLogList = await adventureModel.findAdventureLogsByCharacterId(
      res.locals.character.characterId
    );

    res.locals.data = enrichAdventureLogRows(adventureLogList);
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

function enrichAdventureLogRows(rows) {
  return rows.map((row) => {
    const quest = findQuestDefinitionById(row.questId);
    const region = quest ? findRegionDefinitionById(quest.regionId) : null;

    return {
      ...row,
      questTitle: quest?.title || row.questId,
      questType: quest?.questType || "unknown",
      regionId: quest?.regionId || null,
      regionName: region?.name || null
    };
  });
}

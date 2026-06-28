// Adventure controller functions resolve non-combat quest attempts and pass reward data forward.
// The controller validates ownership and quest type before the model saves logs and rewards.
import { findQuestDefinitionById } from "../constants/quests.js";
import { findRegionDefinitionById } from "../constants/regions.js";
import * as adventureModel from "../models/adventureModel.js";
import * as characterModel from "../models/characterModel.js";
import * as userModel from "../models/userModel.js";
import { resolveQuestAttempt } from "../utils/gameRules.js";
import { buildCharacterProgression, buildUserProgression } from "../utils/leveling.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// ADVENTURE LOG CONTROLLERS
// ------------------------------------------------------------

// Gets adventure logs owned by one user.
export async function getAdventureLogsByUserId(_req, res, next) {
  try {
    const { userId } = res.locals;

    await findRequiredUser(userId);

    const adventureLogList = await adventureModel.findAdventureLogsByUserId(userId);

    res.locals.data = enrichAdventureLogRows(adventureLogList);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets adventure logs for one character.
export async function getAdventureLogsByCharacterId(_req, res, next) {
  try {
    const { characterId } = res.locals;

    await findRequiredCharacter(characterId);

    const adventureLogList = await adventureModel.findAdventureLogsByCharacterId(characterId);

    res.locals.data = enrichAdventureLogRows(adventureLogList);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// ADVENTURE ATTEMPT CONTROLLERS
// ------------------------------------------------------------

// Resolves one non-combat quest attempt and applies rewards.
export async function postAdventureAttempt(_req, res, next) {
  try {
    const { userId, characterId, questId } = res.locals;
    const user = await findRequiredUser(userId);
    const character = await findRequiredCharacter(characterId);
    const quest = findQuestDefinitionById(questId);

    if (!quest) {
      throw createHttpError(404, "Not Found", "Quest was not found.");
    }

    if (character.userId !== userId) {
      throw createHttpError(403, "Forbidden", "Character does not belong to the provided user.");
    }

    if (character.level < quest.requiredLevel) {
      throw createHttpError(
        403,
        "Forbidden",
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

    if (attemptResult.error) {
      throw createHttpError(
        attemptResult.error.status,
        "Bad Request",
        attemptResult.error.message
      );
    }

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
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Adds fixed quest and region details to adventure log rows.
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

// Finds one user or raises a 404 controller error.
async function findRequiredUser(userId) {
  const user = await userModel.findUserById(userId);

  if (!user) {
    throw createHttpError(404, "Not Found", "User was not found.");
  }

  return user;
}

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}

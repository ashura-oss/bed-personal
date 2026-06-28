// Adventure controller functions resolve non-combat quest attempts and return rewards.
// The controller validates ownership and quest type before the model saves logs and rewards.
import { findQuestDefinitionById } from "../constants/quests.js";
import { findRegionDefinitionById } from "../constants/regions.js";
import * as adventureModel from "../models/adventureModel.js";
import * as characterModel from "../models/characterModel.js";
import * as userModel from "../models/userModel.js";
import { resolveQuestAttempt } from "../utils/gameRules.js";
import { buildCharacterProgression, buildUserProgression } from "../utils/leveling.js";
import {
  createHttpError,
  getRequiredId,
  getRequiredIdParam,
  getRequiredString,
  sendErrorResponse
} from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Gets adventure logs owned by one user.
export async function getAdventureLogsByUserId(req, res) {
  try {
    const userId = getRequiredIdParam(req.params, "userId");

    await findRequiredUser(userId);

    const adventureLogList = await adventureModel.findAdventureLogsByUserId(userId);

    return res.status(200).json({
      message: "User adventure logs retrieved.",
      data: enrichAdventureLogRows(adventureLogList)
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets adventure logs for one character.
export async function getAdventureLogsByCharacterId(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");

    await findRequiredCharacter(characterId);

    const adventureLogList = await adventureModel.findAdventureLogsByCharacterId(characterId);

    return res.status(200).json({
      message: "Character adventure logs retrieved.",
      data: enrichAdventureLogRows(adventureLogList)
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Resolves one non-combat quest attempt and applies rewards.
export async function postAdventureAttempt(req, res) {
  try {
    const userId = getRequiredId(req.body, "userId");
    const characterId = getRequiredId(req.body, "characterId");
    const questId = getRequiredString(req.body, "questId");
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

    return res.status(200).json({
      message: "Adventure attempt resolved.",
      data: {
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
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// Adds fixed quest and region details to adventure log rows.
// Log rows store ids, so this attaches readable names for API responses.
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

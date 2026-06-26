// Adventure controller functions resolve quest attempts and return rewards.
import * as adventureModel from "../models/adventureModel.js";
import { findQuestDefinitionById } from "../constants/quests.js";
import { findRegionDefinitionById } from "../constants/regions.js";
import { resolveQuestAttempt } from "../utils/gameRules.js";
import { buildCharacterProgression, buildUserProgression } from "../utils/leveling.js";

// ------------------------------------------------------------
// CREATE AND ACTION CONTROLLERS
// ------------------------------------------------------------

// Resolve one adventure attempt and prepare its reward response.
export async function postAdventureAttempt(req, res, next) {
  try {
    const userId = typeof req.body?.userId === "string" ? Number(req.body.userId) : req.body?.userId;
    const characterId =
      typeof req.body?.characterId === "string" ? Number(req.body.characterId) : req.body?.characterId;

    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: "userId must be a positive integer id." });
    }

    if (!Number.isInteger(characterId) || characterId < 1) {
      return res.status(400).json({ message: "characterId must be a positive integer id." });
    }

    if (typeof req.body?.questId !== "string" || req.body.questId.trim().length === 0) {
      return res.status(400).json({ message: "questId is required." });
    }

    const questId = req.body.questId.trim();
    const user = res.locals.user;
    const character = res.locals.character;
    const quest = res.locals.quest;

    if (character.userId !== userId) {
      return res.status(400).json({ message: "Character does not belong to the provided user." });
    }

    if (character.level < quest.requiredLevel) {
      return res.status(400).json({ message: `Character level ${character.level} is too low for this quest. Required level is ${quest.requiredLevel}.` });
    }

    if (["combat", "boss", "strategy"].includes(quest.questType)) {
      return res.status(400).json({ message: "This quest type must be resolved through its gameplay route." });
    }

    const attemptResult = resolveQuestAttempt(character, quest);

    if (attemptResult.error) {
      return res.status(attemptResult.error.status).json({ message: attemptResult.error.message });
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
    next(error);
  }
}

// ------------------------------------------------------------
// READ CONTROLLERS
// ------------------------------------------------------------

// Get adventure logs by user id.
export async function getAdventureLogsByUserId(req, res, next) {
  try {
    const adventureLogList = await adventureModel.findAdventureLogsByUserId(res.locals.user.userId);

    res.locals.data = enrichAdventureLogRows(adventureLogList);
    next();
  } catch (error) {
    next(error);
  }
}

// Get adventure logs by character id.
export async function getAdventureLogsByCharacterId(req, res, next) {
  try {
    const adventureLogList = await adventureModel.findAdventureLogsByCharacterId(
      res.locals.character.characterId
    );

    res.locals.data = enrichAdventureLogRows(adventureLogList);
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// PRIVATE HELPERS
// ------------------------------------------------------------

// Enrich adventure log rows with related details.
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

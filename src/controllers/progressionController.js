// Progression controller functions read and save story and quest progression.
import * as progressionModel from "../models/progressionModel.js";
import { findQuestDefinitionById } from "../constants/quests.js";

const DEFAULT_RUN_STATE = {
  supplies: 3,
  morale: 50,
  storyPhase: "village_rebellion",
  commandModeUnlocked: 0
};

// ------------------------------------------------------------
// READ CONTROLLERS
// ------------------------------------------------------------

// Read the current story, run, and quest progression.
export async function getCharacterProgression(req, res, next) {
  try {
    const progression = await progressionModel.findCharacterProgressionById(
      res.locals.character.characterId
    );

    res.locals.data = progression;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// SAVE CONTROLLERS
// ------------------------------------------------------------

// Save editable progression fields for frontend state updates.
export async function putCharacterProgression(req, res, next) {
  try {
    const characterId = Number(req.params.characterId);

    if (!Number.isInteger(characterId) || characterId < 1) {
      return res.status(400).json({ message: "characterId must be a positive integer id." });
    }

    const characterUpdates = buildCharacterProgressionUpdates(req.body, res);

    if (!characterUpdates) {
      return;
    }

    const runStateChanges = buildRunStateChanges(req.body, res);

    if (runStateChanges === false) {
      return;
    }

    if (Object.keys(characterUpdates).length === 0 && runStateChanges === null) {
      return res.status(400).json({ message: "Provide at least one updatable field: level, xp, hp, supplies, morale, storyPhase, or commandModeUnlocked." });
    }

    let runStateUpdates = null;

    if (runStateChanges !== null) {
      const existingProgression = await progressionModel.findCharacterProgressionById(characterId);
      const currentRunState = existingProgression?.runState;

      runStateUpdates = {
        characterId,
        supplies: runStateChanges.supplies ?? currentRunState?.supplies ?? DEFAULT_RUN_STATE.supplies,
        morale: runStateChanges.morale ?? currentRunState?.morale ?? DEFAULT_RUN_STATE.morale,
        storyPhase:
          runStateChanges.storyPhase ??
          currentRunState?.storyPhase ??
          DEFAULT_RUN_STATE.storyPhase,
        commandModeUnlocked:
          runStateChanges.commandModeUnlocked ??
          currentRunState?.commandModeUnlocked ??
          DEFAULT_RUN_STATE.commandModeUnlocked,
        savedAt: new Date()
      };
    }

    const savedProgression = await progressionModel.saveCharacterProgression({
      characterId,
      characterUpdates,
      runStateUpdates
    });

    res.locals.data = savedProgression;
    next();
  } catch (error) {
    next(error);
  }
}

// Claim dialogue quest rewards that are not handled by combat.
export async function putCharacterQuestCompletion(req, res, next) {
  try {
    const characterId = Number(req.params.characterId);

    if (!Number.isInteger(characterId) || characterId < 1) {
      return res.status(400).json({ message: "characterId must be a positive integer id." });
    }

    const quest = findQuestDefinitionById(req.params.questId);
    const questReward = quest
      ? {
          questId: quest.questId,
          regionId: quest.regionId,
          title: quest.title,
          questType: quest.questType,
          rewardXp: quest.rewardXp
        }
      : null;

    if (!questReward) {
      return res.status(404).json({ message: "Quest completion reward was not found." });
    }

    if (questReward.questType !== "dialogue") {
      return res.status(400).json({ message: "Only dialogue story milestones can be claimed directly." });
    }

    const claimResult = await progressionModel.claimCharacterQuestCompletion({
      characterId,
      questReward
    });

    res.locals.data = {
      awarded: claimResult.awarded,
      rewards: {
        xp: claimResult.awardedXp
      },
      quest: questReward,
      characterProgression: claimResult.characterProgression,
      character: claimResult.character,
      questCompletion: claimResult.questCompletion
    };
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// PRIVATE HELPERS
// ------------------------------------------------------------

// Build valid character progression updates from the request body.
function buildCharacterProgressionUpdates(body, res) {
  const updates = {};

  if (body.level !== undefined) {
    if (!Number.isInteger(body.level)) {
      res.status(400).json({ message: "level must be an integer." });
      return null;
    }

    if (body.level < 1) {
      res.status(400).json({ message: "level must be at least 1." });
      return null;
    }

    updates.level = body.level;
  }

  if (body.xp !== undefined) {
    if (!Number.isInteger(body.xp)) {
      res.status(400).json({ message: "xp must be an integer." });
      return null;
    }

    if (body.xp < 0) {
      res.status(400).json({ message: "xp must be at least 0." });
      return null;
    }

    updates.xp = body.xp;
  }

  if (body.hp !== undefined) {
    if (!Number.isInteger(body.hp)) {
      res.status(400).json({ message: "hp must be an integer." });
      return null;
    }

    if (body.hp < 0) {
      res.status(400).json({ message: "hp must be at least 0." });
      return null;
    }

    updates.hp = body.hp;
  }

  return updates;
}

// Build run state changes.
function buildRunStateChanges(body, res) {
  const updates = {};

  if (body.supplies !== undefined) {
    if (!Number.isInteger(body.supplies)) {
      res.status(400).json({ message: "supplies must be an integer." });
      return false;
    }

    if (body.supplies < 0) {
      res.status(400).json({ message: "supplies must be at least 0." });
      return false;
    }

    updates.supplies = body.supplies;
  }

  if (body.morale !== undefined) {
    if (!Number.isInteger(body.morale)) {
      res.status(400).json({ message: "morale must be an integer." });
      return false;
    }

    if (body.morale < 0) {
      res.status(400).json({ message: "morale must be at least 0." });
      return false;
    }

    if (body.morale > 100) {
      res.status(400).json({ message: "morale must be at most 100." });
      return false;
    }

    updates.morale = body.morale;
  }

  if (body.storyPhase !== undefined) {
    if (typeof body.storyPhase !== "string" || body.storyPhase.trim().length === 0) {
      res.status(400).json({ message: "storyPhase must be a non-empty string when provided." });
      return false;
    }

    updates.storyPhase = body.storyPhase.trim();
  }

  if (body.commandModeUnlocked !== undefined) {
    if (!Number.isInteger(body.commandModeUnlocked)) {
      res.status(400).json({ message: "commandModeUnlocked must be an integer." });
      return false;
    }

    if (body.commandModeUnlocked < 0) {
      res.status(400).json({ message: "commandModeUnlocked must be at least 0." });
      return false;
    }

    if (body.commandModeUnlocked > 1) {
      res.status(400).json({ message: "commandModeUnlocked must be at most 1." });
      return false;
    }

    updates.commandModeUnlocked = body.commandModeUnlocked;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

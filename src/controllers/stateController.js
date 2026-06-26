// Saved state controller functions read and save frontend game state.
import * as characterModel from "../models/characterModel.js";
import * as stateModel from "../models/stateModel.js";
import { hasEnemyDefinition } from "../constants/enemies.js";
import { hasFactionDefinition } from "../constants/factions.js";
import { hasRegionDefinition } from "../constants/regions.js";

// ------------------------------------------------------------
// FULL STATE READ CONTROLLERS
// ------------------------------------------------------------

// Return one character's full saved-game state.
export async function getCharacterFullState(req, res, next) {
  try {
    const character = res.locals.character;
    const state = await stateModel.findFullCharacterState(character.characterId);

    res.locals.data = {
      characterId: character.characterId,
      ...state
    };
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// SAVE SLOT READ CONTROLLERS
// ------------------------------------------------------------

// Return all save slots owned by one user.
export async function getSaveSlotsForUser(req, res, next) {
  try {
    res.locals.data = await stateModel.findSaveSlotsByUserId(res.locals.user.userId);
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// SAVE SLOT WRITE CONTROLLERS
// ------------------------------------------------------------

// Save one save slot for one user.
export async function putSaveSlotForUser(req, res, next) {
  try {
    const userId = res.locals.user.userId;
    const slotIndex = Number(req.params.slotIndex);

    if (!Number.isInteger(slotIndex) || slotIndex < 1) {
      return res.status(400).json({ message: "slotIndex must be a positive integer." });
    }

    let characterId = null;
    let slotName = `Save Slot ${slotIndex}`;

    if (req.body.characterId !== undefined && req.body.characterId !== null) {
      characterId = Number(req.body.characterId);

      if (!Number.isInteger(characterId) || characterId < 1) {
        return res.status(400).json({ message: "characterId must be a positive integer id." });
      }
    }

    if (req.body.slotName !== undefined) {
      if (typeof req.body.slotName !== "string" || req.body.slotName.trim().length === 0) {
        return res.status(400).json({ message: "slotName must be a non-empty string when provided." });
      }

      slotName = req.body.slotName.trim();
    }

    if (characterId !== null) {
      const character = await characterModel.findCharacterById(characterId);

      if (!character) {
        return res.status(404).json({ message: "Character was not found." });
      }

      if (character.userId !== userId) {
        return res.status(400).json({ message: "Character does not belong to this user." });
      }
    }

    const saveSlot = await stateModel.upsertSaveSlot({ userId, characterId, slotIndex, slotName });

    res.locals.data = saveSlot;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// DIALOGUE FLAG WRITE CONTROLLERS
// ------------------------------------------------------------

// Save one character's dialogue flag state.
export async function putDialogueFlag(req, res, next) {
  try {
    const character = res.locals.character;
    const value = req.body?.value;

    if (value === undefined) {
      return res.status(400).json({ message: "value is required." });
    }

    if (typeof value !== "boolean" && value !== 0 && value !== 1) {
      return res.status(400).json({ message: "value must be a boolean or 0/1." });
    }

    const flagValue = typeof value === "boolean" ? Number(value) : value;
    const dialogueFlag = await stateModel.upsertDialogueFlag({
      characterId: character.characterId,
      flagId: req.params.flagId,
      flagValue
    });

    res.locals.data = dialogueFlag;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// BOSS STATE WRITE CONTROLLERS
// ------------------------------------------------------------

// Save one character's progress against a boss.
export async function putBossState(req, res, next) {
  try {
    const character = res.locals.character;
    const status = req.body?.status;
    const attempts = req.body?.attempts;
    const defeats = req.body?.defeats;
    const bestTimeSeconds = req.body?.bestTimeSeconds;
    const lastOutcome = req.body?.lastOutcome;

    if (!hasEnemyDefinition(req.params.bossId)) {
      return res.status(404).json({ message: "Enemy or boss definition was not found." });
    }

    if (status !== undefined && (typeof status !== "string" || status.trim().length === 0)) {
      return res.status(400).json({ message: "status must be a non-empty string." });
    }

    if (attempts !== undefined && (!Number.isInteger(attempts) || attempts < 0)) {
      return res.status(400).json({ message: "attempts must be a non-negative integer." });
    }

    if (defeats !== undefined && (!Number.isInteger(defeats) || defeats < 0)) {
      return res.status(400).json({ message: "defeats must be a non-negative integer." });
    }

    if (
      bestTimeSeconds !== undefined &&
      bestTimeSeconds !== null &&
      (typeof bestTimeSeconds !== "number" ||
        Number.isNaN(bestTimeSeconds) ||
        !Number.isFinite(bestTimeSeconds))
    ) {
      return res.status(400).json({ message: "bestTimeSeconds must be a finite number." });
    }

    if (lastOutcome !== undefined && (typeof lastOutcome !== "string" || lastOutcome.trim().length === 0)) {
      return res.status(400).json({ message: "lastOutcome must be a non-empty string." });
    }

    const bossState = await stateModel.upsertBossState({
      characterId: character.characterId,
      bossId: req.params.bossId,
      status: status?.trim(),
      attempts,
      defeats,
      bestTimeSeconds,
      lastOutcome: lastOutcome?.trim()
    });

    res.locals.data = bossState;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// CAMPAIGN MARKER WRITE CONTROLLERS
// ------------------------------------------------------------

// Save one character's campaign marker state.
export async function putCampaignMarker(req, res, next) {
  try {
    const character = res.locals.character;
    const regionIdValue = req.body?.regionId;
    const markerTypeValue = req.body?.markerType;
    const isRevealedValue = req.body?.isRevealed;
    const isCompletedValue = req.body?.isCompleted;
    const positionX = req.body?.positionX;
    const positionY = req.body?.positionY;

    if (typeof regionIdValue !== "string" || regionIdValue.trim().length === 0) {
      return res.status(400).json({ message: "regionId is required." });
    }

    const regionId = regionIdValue.trim();

    if (!hasRegionDefinition(regionId)) {
      return res.status(404).json({ message: "Region definition was not found." });
    }

    if (typeof markerTypeValue !== "string" || markerTypeValue.trim().length === 0) {
      return res.status(400).json({ message: "markerType is required." });
    }

    if (
      isRevealedValue !== undefined &&
      typeof isRevealedValue !== "boolean" &&
      isRevealedValue !== 0 &&
      isRevealedValue !== 1
    ) {
      return res.status(400).json({ message: "isRevealed must be a boolean or 0/1." });
    }

    if (
      isCompletedValue !== undefined &&
      typeof isCompletedValue !== "boolean" &&
      isCompletedValue !== 0 &&
      isCompletedValue !== 1
    ) {
      return res.status(400).json({ message: "isCompleted must be a boolean or 0/1." });
    }

    if (
      positionX !== undefined &&
      positionX !== null &&
      (typeof positionX !== "number" || Number.isNaN(positionX) || !Number.isFinite(positionX))
    ) {
      return res.status(400).json({ message: "positionX must be a finite number." });
    }

    if (
      positionY !== undefined &&
      positionY !== null &&
      (typeof positionY !== "number" || Number.isNaN(positionY) || !Number.isFinite(positionY))
    ) {
      return res.status(400).json({ message: "positionY must be a finite number." });
    }

    const marker = await stateModel.upsertCampaignMarker({
      characterId: character.characterId,
      markerId: req.params.markerId,
      regionId,
      markerType: markerTypeValue.trim(),
      isRevealed: typeof isRevealedValue === "boolean" ? Number(isRevealedValue) : isRevealedValue,
      isCompleted: typeof isCompletedValue === "boolean" ? Number(isCompletedValue) : isCompletedValue,
      positionX,
      positionY
    });

    res.locals.data = marker;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// FACTION REPUTATION WRITE CONTROLLERS
// ------------------------------------------------------------

// Save one character's reputation with a faction.
export async function putFactionReputation(req, res, next) {
  try {
    const character = res.locals.character;
    const reputationValue = req.body?.reputation;
    const rankValue = req.body?.rank;

    if (!hasFactionDefinition(req.params.factionId)) {
      return res.status(404).json({ message: "Faction definition was not found." });
    }

    if (reputationValue !== undefined && !Number.isInteger(reputationValue)) {
      return res.status(400).json({ message: "reputation must be an integer." });
    }

    if (rankValue !== undefined && (typeof rankValue !== "string" || rankValue.trim().length === 0)) {
      return res.status(400).json({ message: "rank must be a non-empty string." });
    }

    const reputation = await stateModel.upsertFactionReputation({
      characterId: character.characterId,
      factionId: req.params.factionId,
      reputation: reputationValue,
      rank: rankValue?.trim()
    });

    res.locals.data = reputation;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// REGION STATE WRITE CONTROLLERS
// ------------------------------------------------------------

// Save one character's progress inside a region.
export async function putRegionState(req, res, next) {
  try {
    const character = res.locals.character;
    const isUnlockedValue = req.body?.isUnlocked;
    const isDiscoveredValue = req.body?.isDiscovered;
    const threatLevel = req.body?.threatLevel;
    const worldState = req.body?.worldState;

    if (!hasRegionDefinition(req.params.regionId)) {
      return res.status(404).json({ message: "Region definition was not found." });
    }

    if (
      isUnlockedValue !== undefined &&
      typeof isUnlockedValue !== "boolean" &&
      isUnlockedValue !== 0 &&
      isUnlockedValue !== 1
    ) {
      return res.status(400).json({ message: "isUnlocked must be a boolean or 0/1." });
    }

    if (
      isDiscoveredValue !== undefined &&
      typeof isDiscoveredValue !== "boolean" &&
      isDiscoveredValue !== 0 &&
      isDiscoveredValue !== 1
    ) {
      return res.status(400).json({ message: "isDiscovered must be a boolean or 0/1." });
    }

    if (threatLevel !== undefined && (!Number.isInteger(threatLevel) || threatLevel < 0)) {
      return res.status(400).json({ message: "threatLevel must be a non-negative integer." });
    }

    if (worldState !== undefined && (typeof worldState !== "string" || worldState.trim().length === 0)) {
      return res.status(400).json({ message: "worldState must be a non-empty string." });
    }

    const regionState = await stateModel.upsertRegionState({
      characterId: character.characterId,
      regionId: req.params.regionId,
      isUnlocked: typeof isUnlockedValue === "boolean" ? Number(isUnlockedValue) : isUnlockedValue,
      isDiscovered: typeof isDiscoveredValue === "boolean" ? Number(isDiscoveredValue) : isDiscoveredValue,
      threatLevel,
      worldState: worldState?.trim()
    });

    res.locals.data = regionState;
    next();
  } catch (error) {
    next(error);
  }
}

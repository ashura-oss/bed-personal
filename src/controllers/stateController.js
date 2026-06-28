// Saved state controller functions read and save game state rows.
// These endpoints store persistent state such as save slots, flags, markers, and reputation.
import { hasEnemyDefinition } from "../constants/enemies.js";
import { hasFactionDefinition } from "../constants/factions.js";
import { hasRegionDefinition } from "../constants/regions.js";
import * as characterModel from "../models/characterModel.js";
import * as stateModel from "../models/stateModel.js";
import * as userModel from "../models/userModel.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// SAVED STATE LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets one character's full saved state.
export async function getCharacterFullState(_req, res, next) {
  try {
    const { characterId } = res.locals;

    await findRequiredCharacter(characterId);

    const state = await stateModel.findFullCharacterState(characterId);

    res.locals.data = {
      characterId,
      ...state
    };
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets all save slots owned by one user.
export async function getSaveSlotsForUser(_req, res, next) {
  try {
    const { userId } = res.locals;

    await findRequiredUser(userId);

    res.locals.data = await stateModel.findSaveSlotsByUserId(userId);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// SAVED STATE SAVE CONTROLLERS
// ------------------------------------------------------------

// Saves one save slot for one user.
export async function putSaveSlotForUser(_req, res, next) {
  try {
    const { userId, slotIndex } = res.locals;
    const slotName = res.locals.slotName || `Save Slot ${slotIndex}`;
    const characterId = res.locals.characterId ?? null;

    await findRequiredUser(userId);

    if (characterId !== null) {
      const character = await findRequiredCharacter(characterId);

      if (character.userId !== userId) {
        throw createHttpError(403, "Forbidden", "Character does not belong to this user.");
      }
    }

    res.locals.data = await stateModel.upsertSaveSlot({
      userId,
      characterId,
      slotIndex,
      slotName
    });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Saves one character's dialogue flag state.
export async function putDialogueFlag(_req, res, next) {
  try {
    const { characterId, flagId, value } = res.locals;

    await findRequiredCharacter(characterId);

    res.locals.data = await stateModel.upsertDialogueFlag({
      characterId,
      flagId,
      flagValue: value
    });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Saves one character's progress against a boss.
export async function putBossState(_req, res, next) {
  try {
    const { characterId, bossId } = res.locals;

    await findRequiredCharacter(characterId);

    if (!hasEnemyDefinition(bossId)) {
      throw createHttpError(404, "Not Found", "Enemy or boss definition was not found.");
    }

    res.locals.data = await stateModel.upsertBossState({
      characterId,
      bossId,
      status: res.locals.status,
      attempts: res.locals.attempts,
      defeats: res.locals.defeats,
      bestTimeSeconds: res.locals.bestTimeSeconds,
      lastOutcome: res.locals.lastOutcome
    });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Saves one character's campaign marker state.
export async function putCampaignMarker(_req, res, next) {
  try {
    const { characterId, markerId, regionId, markerType } = res.locals;

    await findRequiredCharacter(characterId);

    if (!hasRegionDefinition(regionId)) {
      throw createHttpError(404, "Not Found", "Region definition was not found.");
    }

    res.locals.data = await stateModel.upsertCampaignMarker({
      characterId,
      markerId,
      regionId,
      markerType,
      isRevealed: res.locals.isRevealed,
      isCompleted: res.locals.isCompleted,
      positionX: res.locals.positionX,
      positionY: res.locals.positionY
    });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Saves one character's reputation with a faction.
export async function putFactionReputation(_req, res, next) {
  try {
    const { characterId, factionId } = res.locals;

    await findRequiredCharacter(characterId);

    if (!hasFactionDefinition(factionId)) {
      throw createHttpError(404, "Not Found", "Faction definition was not found.");
    }

    res.locals.data = await stateModel.upsertFactionReputation({
      characterId,
      factionId,
      reputation: res.locals.reputation,
      rank: res.locals.rank
    });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Saves one character's progress inside a region.
export async function putRegionState(_req, res, next) {
  try {
    const { characterId, regionId } = res.locals;

    await findRequiredCharacter(characterId);

    if (!hasRegionDefinition(regionId)) {
      throw createHttpError(404, "Not Found", "Region definition was not found.");
    }

    res.locals.data = await stateModel.upsertRegionState({
      characterId,
      regionId,
      isUnlocked: res.locals.isUnlocked,
      isDiscovered: res.locals.isDiscovered,
      threatLevel: res.locals.threatLevel,
      worldState: res.locals.worldState
    });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

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

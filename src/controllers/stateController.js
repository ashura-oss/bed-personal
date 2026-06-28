// Saved state controller functions read and save game state rows.
// These endpoints store persistent state such as save slots, flags, markers, and reputation.
import { hasEnemyDefinition } from "../constants/enemies.js";
import { hasFactionDefinition } from "../constants/factions.js";
import { hasRegionDefinition } from "../constants/regions.js";
import * as characterModel from "../models/characterModel.js";
import * as stateModel from "../models/stateModel.js";
import * as userModel from "../models/userModel.js";
import {
  createHttpError,
  getOptionalInteger,
  getOptionalString,
  getRequiredIdParam,
  getRequiredString,
  sendErrorResponse
} from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// SAVED STATE LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets one character's full saved state.
export async function getCharacterFullState(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");

    await findRequiredCharacter(characterId);

    const state = await stateModel.findFullCharacterState(characterId);

    return res.status(200).json({
      message: "Character state retrieved.",
      data: {
        characterId,
        ...state
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets all save slots owned by one user.
export async function getSaveSlotsForUser(req, res) {
  try {
    const userId = getRequiredIdParam(req.params, "userId");

    await findRequiredUser(userId);

    const saveSlots = await stateModel.findSaveSlotsByUserId(userId);

    return res.status(200).json({
      message: "Save slots retrieved.",
      data: saveSlots
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// SAVED STATE SAVE CONTROLLERS
// ------------------------------------------------------------

// Saves one save slot for one user.
// If a character is linked, ownership is checked before the slot is saved.
export async function putSaveSlotForUser(req, res) {
  try {
    const userId = getRequiredIdParam(req.params, "userId");
    const slotIndex = getRequiredIdParam(req.params, "slotIndex");
    const slotName = getOptionalString(req.body, "slotName") || `Save Slot ${slotIndex}`;
    let characterId = null;

    await findRequiredUser(userId);

    if (req.body.characterId !== undefined && req.body.characterId !== null) {
      characterId = Number(req.body.characterId);

      if (!Number.isInteger(characterId) || characterId < 1) {
        throw createHttpError(400, "Bad Request", "characterId must be a positive integer id.");
      }
    }

    if (characterId !== null) {
      const character = await findRequiredCharacter(characterId);

      if (character.userId !== userId) {
        throw createHttpError(403, "Forbidden", "Character does not belong to this user.");
      }
    }

    const saveSlot = await stateModel.upsertSaveSlot({
      userId,
      characterId,
      slotIndex,
      slotName
    });

    return res.status(200).json({
      message: "Save slot saved.",
      data: saveSlot
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Saves one character's dialogue flag state.
export async function putDialogueFlag(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const flagId = getRequiredString(req.params, "flagId");
    const flagValue = readRequiredBit(req.body.value, "value");

    await findRequiredCharacter(characterId);

    const dialogueFlag = await stateModel.upsertDialogueFlag({
      characterId,
      flagId,
      flagValue
    });

    return res.status(200).json({
      message: "Dialogue flag saved.",
      data: dialogueFlag
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Saves one character's progress against a boss.
export async function putBossState(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const bossId = getRequiredString(req.params, "bossId");
    const status = getOptionalString(req.body, "status");
    const attempts = getOptionalInteger(req.body, "attempts", { min: 0 });
    const defeats = getOptionalInteger(req.body, "defeats", { min: 0 });
    const bestTimeSeconds = readOptionalFiniteNumber(req.body, "bestTimeSeconds");
    const lastOutcome = getOptionalString(req.body, "lastOutcome");

    await findRequiredCharacter(characterId);

    if (!hasEnemyDefinition(bossId)) {
      throw createHttpError(404, "Not Found", "Enemy or boss definition was not found.");
    }

    const bossState = await stateModel.upsertBossState({
      characterId,
      bossId,
      status,
      attempts,
      defeats,
      bestTimeSeconds,
      lastOutcome
    });

    return res.status(200).json({
      message: "Boss state saved.",
      data: bossState
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Saves one character's campaign marker state.
// Marker position and reveal/completion flags are stored per character.
export async function putCampaignMarker(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const markerId = getRequiredString(req.params, "markerId");
    const regionId = getRequiredString(req.body, "regionId");
    const markerType = getRequiredString(req.body, "markerType");
    const isRevealed = readOptionalBit(req.body, "isRevealed");
    const isCompleted = readOptionalBit(req.body, "isCompleted");
    const positionX = readOptionalFiniteNumber(req.body, "positionX");
    const positionY = readOptionalFiniteNumber(req.body, "positionY");

    await findRequiredCharacter(characterId);

    if (!hasRegionDefinition(regionId)) {
      throw createHttpError(404, "Not Found", "Region definition was not found.");
    }

    const marker = await stateModel.upsertCampaignMarker({
      characterId,
      markerId,
      regionId,
      markerType,
      isRevealed,
      isCompleted,
      positionX,
      positionY
    });

    return res.status(200).json({
      message: "Campaign marker saved.",
      data: marker
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Saves one character's reputation with a faction.
export async function putFactionReputation(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const factionId = getRequiredString(req.params, "factionId");
    const reputation = getOptionalInteger(req.body, "reputation");
    const rank = getOptionalString(req.body, "rank");

    await findRequiredCharacter(characterId);

    if (!hasFactionDefinition(factionId)) {
      throw createHttpError(404, "Not Found", "Faction definition was not found.");
    }

    const factionReputation = await stateModel.upsertFactionReputation({
      characterId,
      factionId,
      reputation,
      rank
    });

    return res.status(200).json({
      message: "Faction reputation saved.",
      data: factionReputation
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Saves one character's progress inside a region.
export async function putRegionState(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const regionId = getRequiredString(req.params, "regionId");
    const isUnlocked = readOptionalBit(req.body, "isUnlocked");
    const isDiscovered = readOptionalBit(req.body, "isDiscovered");
    const threatLevel = getOptionalInteger(req.body, "threatLevel", { min: 0 });
    const worldState = getOptionalString(req.body, "worldState");

    await findRequiredCharacter(characterId);

    if (!hasRegionDefinition(regionId)) {
      throw createHttpError(404, "Not Found", "Region definition was not found.");
    }

    const regionState = await stateModel.upsertRegionState({
      characterId,
      regionId,
      isUnlocked,
      isDiscovered,
      threatLevel,
      worldState
    });

    return res.status(200).json({
      message: "Region state saved.",
      data: regionState
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Reads a required boolean or 0/1 value as a database integer flag.
// The database stores flags as integers, while requests may send booleans.
function readRequiredBit(value, fieldName) {
  if (!isBooleanOrBit(value)) {
    throw createHttpError(400, "Bad Request", `${fieldName} must be a boolean or 0/1.`);
  }

  return typeof value === "boolean" ? Number(value) : value;
}

// Reads an optional boolean or 0/1 value as a database integer flag.
// Undefined means the existing value should be kept by the model.
function readOptionalBit(body, fieldName) {
  const value = body?.[fieldName];

  if (value === undefined) {
    return undefined;
  }

  return readRequiredBit(value, fieldName);
}

// Checks whether a value can safely become a database integer flag.
function isBooleanOrBit(value) {
  return typeof value === "boolean" || value === 0 || value === 1;
}

// Reads an optional finite number field.
// Null is allowed for optional values such as missing best-time records.
function readOptionalFiniteNumber(body, fieldName) {
  const value = body?.[fieldName];

  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    throw createHttpError(400, "Bad Request", `${fieldName} must be a finite number.`);
  }

  return value;
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

import { findCharacterById } from "../models/characterModel.js";
import { findUserById } from "../models/userModel.js";
import {
  findFullCharacterState,
  findSaveSlotsByUserId,
  removeEquipment,
  removeInventoryItem,
  upsertBossState,
  upsertCampaignMarker,
  upsertDialogueFlag,
  upsertEquipment,
  upsertFactionReputation,
  upsertInventoryItem,
  upsertRegionState,
  upsertSaveSlot
} from "../models/stateModel.js";
import { assertOwnsUserResource } from "../middlewares/authMiddleware.js";
import {
  hasEnemyDefinition,
  hasFactionDefinition,
  hasItemDefinition,
  hasRegionDefinition
} from "../content/index.js";
import { createHttpError } from "../utils/httpError.js";
import {
  getOptionalId,
  getOptionalInteger,
  getOptionalString,
  getRequiredIdParam,
  getRequiredInteger,
  getRequiredString
} from "../utils/validate.js";

export async function getSaveSlotsForUser(req, res, next) {
  try {
    const userId = getRequiredIdParam(req.params, "userId");
    const user = await findUserById(userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    assertOwnsUserResource(req, userId);

    res.locals.data = await findSaveSlotsByUserId(userId);
    next();
  } catch (error) {
    next(error);
  }
}

export async function putSaveSlotForUser(req, res, next) {
  try {
    const userId = getRequiredIdParam(req.params, "userId");
    const slotIndex = Number(req.params.slotIndex);
    const user = await findUserById(userId);

    if (!Number.isInteger(slotIndex) || slotIndex < 1) {
      throw createHttpError(400, "Bad Request", "slotIndex must be a positive integer.");
    }

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    assertOwnsUserResource(req, userId);

    const characterId = getOptionalId(req.body, "characterId") ?? null;
    const slotName = getOptionalString(req.body, "slotName") ?? `Save Slot ${slotIndex}`;

    if (characterId !== null) {
      const character = await findCharacterById(characterId);

      if (!character) {
        throw createHttpError(404, "Not Found", "Character was not found.");
      }

      if (character.userId !== userId) {
        throw createHttpError(400, "Bad Request", "Character does not belong to this user.");
      }
    }

    const saveSlot = await upsertSaveSlot({ userId, characterId, slotIndex, slotName });

    res.locals.data = saveSlot;
    next();
  } catch (error) {
    next(error);
  }
}

export async function getCharacterFullState(req, res, next) {
  try {
    const character = await requireOwnedCharacter(req);
    const state = await findFullCharacterState(character.characterId);

    res.locals.data = {
      characterId: character.characterId,
      ...state
    };
    next();
  } catch (error) {
    next(error);
  }
}

export async function putInventoryItem(req, res, next) {
  try {
    const character = await requireOwnedCharacter(req);
    const itemId = req.params.itemId;
    const quantity = getRequiredInteger(req.body, "quantity", { min: 0 });

    assertAuthoredItem(itemId);

    if (quantity === 0) {
      const removed = await removeInventoryItem({ characterId: character.characterId, itemId });
      res.locals.data = { removed: Boolean(removed), inventoryItem: removed };
      next();
      return;
    }

    const inventoryItem = await upsertInventoryItem({
      characterId: character.characterId,
      itemId,
      quantity
    });

    res.locals.data = inventoryItem;
    next();
  } catch (error) {
    next(error);
  }
}

export async function deleteInventoryItem(req, res, next) {
  try {
    const character = await requireOwnedCharacter(req);
    assertAuthoredItem(req.params.itemId);

    const removed = await removeInventoryItem({
      characterId: character.characterId,
      itemId: req.params.itemId
    });

    res.locals.data = { removed: Boolean(removed), inventoryItem: removed };
    next();
  } catch (error) {
    next(error);
  }
}

export async function putEquipment(req, res, next) {
  try {
    const character = await requireOwnedCharacter(req);
    const itemId = getRequiredString(req.body, "itemId");

    assertAuthoredItem(itemId);

    const equipment = await upsertEquipment({
      characterId: character.characterId,
      equipmentSlot: req.params.equipmentSlot,
      itemId
    });

    res.locals.data = equipment;
    next();
  } catch (error) {
    next(error);
  }
}

export async function deleteEquipment(req, res, next) {
  try {
    const character = await requireOwnedCharacter(req);
    const removed = await removeEquipment({
      characterId: character.characterId,
      equipmentSlot: req.params.equipmentSlot
    });

    res.locals.data = { removed: Boolean(removed), equipment: removed };
    next();
  } catch (error) {
    next(error);
  }
}

export async function putDialogueFlag(req, res, next) {
  try {
    const character = await requireOwnedCharacter(req);
    const flagValue = getOptionalString(req.body, "flagValue") ?? String(readBooleanish(req.body, "value", true));
    const dialogueFlag = await upsertDialogueFlag({
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

export async function putBossState(req, res, next) {
  try {
    const character = await requireOwnedCharacter(req);
    assertAuthoredEnemy(req.params.bossId);

    const bossState = await upsertBossState({
      characterId: character.characterId,
      bossId: req.params.bossId,
      status: getOptionalString(req.body, "status"),
      attempts: getOptionalInteger(req.body, "attempts", { min: 0 }),
      defeats: getOptionalInteger(req.body, "defeats", { min: 0 }),
      bestTimeSeconds: getOptionalFiniteNumber(req.body, "bestTimeSeconds"),
      lastOutcome: getOptionalString(req.body, "lastOutcome")
    });

    res.locals.data = bossState;
    next();
  } catch (error) {
    next(error);
  }
}

export async function putCampaignMarker(req, res, next) {
  try {
    const character = await requireOwnedCharacter(req);
    const regionId = getRequiredString(req.body, "regionId");

    assertAuthoredRegion(regionId);

    const marker = await upsertCampaignMarker({
      characterId: character.characterId,
      markerId: req.params.markerId,
      regionId,
      markerType: getRequiredString(req.body, "markerType"),
      isRevealed: readOptionalBooleanish(req.body, "isRevealed"),
      isCompleted: readOptionalBooleanish(req.body, "isCompleted"),
      positionX: getOptionalFiniteNumber(req.body, "positionX"),
      positionY: getOptionalFiniteNumber(req.body, "positionY"),
      positionZ: getOptionalFiniteNumber(req.body, "positionZ")
    });

    res.locals.data = marker;
    next();
  } catch (error) {
    next(error);
  }
}

export async function putFactionReputation(req, res, next) {
  try {
    const character = await requireOwnedCharacter(req);
    assertAuthoredFaction(req.params.factionId);

    const reputation = await upsertFactionReputation({
      characterId: character.characterId,
      factionId: req.params.factionId,
      reputation: getOptionalInteger(req.body, "reputation"),
      rank: getOptionalString(req.body, "rank")
    });

    res.locals.data = reputation;
    next();
  } catch (error) {
    next(error);
  }
}

export async function putRegionState(req, res, next) {
  try {
    const character = await requireOwnedCharacter(req);
    assertAuthoredRegion(req.params.regionId);

    const regionState = await upsertRegionState({
      characterId: character.characterId,
      regionId: req.params.regionId,
      isUnlocked: readOptionalBooleanish(req.body, "isUnlocked"),
      isDiscovered: readOptionalBooleanish(req.body, "isDiscovered"),
      threatLevel: getOptionalInteger(req.body, "threatLevel", { min: 0 }),
      worldState: getOptionalString(req.body, "worldState")
    });

    res.locals.data = regionState;
    next();
  } catch (error) {
    next(error);
  }
}

async function requireOwnedCharacter(req) {
  const characterId = getRequiredIdParam(req.params, "characterId");
  const character = await findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  assertOwnsUserResource(req, character.userId);

  return character;
}

function readBooleanish(source, fieldName, defaultValue) {
  const value = source?.[fieldName];

  if (value === undefined) {
    return defaultValue ? 1 : 0;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (value === 0 || value === 1) {
    return value;
  }

  throw createHttpError(400, "Bad Request", `${fieldName} must be a boolean or 0/1.`);
}

function getOptionalFiniteNumber(source, fieldName) {
  const value = source?.[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    throw createHttpError(400, "Bad Request", `${fieldName} must be a finite number.`);
  }

  return value;
}

function readOptionalBooleanish(source, fieldName) {
  const value = source?.[fieldName];

  if (value === undefined) {
    return undefined;
  }

  return readBooleanish(source, fieldName, false);
}

function assertAuthoredItem(itemId) {
  if (!hasItemDefinition(itemId)) {
    throw createHttpError(404, "Not Found", "Item definition was not found.");
  }
}

function assertAuthoredEnemy(enemyId) {
  if (!hasEnemyDefinition(enemyId)) {
    throw createHttpError(404, "Not Found", "Enemy or boss definition was not found.");
  }
}

function assertAuthoredRegion(regionId) {
  if (!hasRegionDefinition(regionId)) {
    throw createHttpError(404, "Not Found", "Region definition was not found.");
  }
}

function assertAuthoredFaction(factionId) {
  if (!hasFactionDefinition(factionId)) {
    throw createHttpError(404, "Not Found", "Faction definition was not found.");
  }
}

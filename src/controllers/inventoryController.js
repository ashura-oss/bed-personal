// Inventory controller functions save, consume, equip, and remove inventory items.
// Item definitions come from constants; ownership and equipment state are saved in models.
import { findItemDefinitionById, hasItemDefinition } from "../constants/items.js";
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import * as characterModel from "../models/characterModel.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// INVENTORY ACTION CONTROLLERS
// ------------------------------------------------------------

// Consumes one inventory item and applies its effects.
export async function postConsumeInventoryItem(_req, res, next) {
  try {
    const { characterId, itemId } = res.locals;
    const item = findItemDefinitionById(itemId);

    await findRequiredCharacter(characterId);

    if (!item) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    if (item.itemType !== "consumable" || !item.consumeEffect) {
      throw createHttpError(400, "Bad Request", "Item is not consumable.");
    }

    const consumeResult = await characterInventoryModel.consumeInventoryItem({
      characterId,
      item
    });

    if (!consumeResult.consumed) {
      throw createHttpError(404, "Not Found", "Consumable item was not found in inventory.");
    }

    res.locals.data = consumeResult;
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// INVENTORY SAVE CONTROLLERS
// ------------------------------------------------------------

// Saves one inventory item quantity for a character.
export async function putInventoryItem(_req, res, next) {
  try {
    const { characterId, itemId, quantity } = res.locals;

    await findRequiredCharacter(characterId);

    if (!hasItemDefinition(itemId)) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    if (quantity === 0) {
      const removed = await characterInventoryModel.removeInventoryItem({ characterId, itemId });

      res.locals.data = {
        removed: Boolean(removed),
        inventoryItem: removed
      };
      return next();
    }

    res.locals.data = await characterInventoryModel.upsertInventoryItem({
      characterId,
      itemId,
      quantity
    });
    return next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Equips one owned item into one equipment slot.
export async function putEquipment(_req, res, next) {
  try {
    const { characterId, equipmentSlot, itemId } = res.locals;
    const item = findItemDefinitionById(itemId);

    await findRequiredCharacter(characterId);

    if (!item) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    if (!item.equipmentSlot || item.equipmentSlot !== equipmentSlot) {
      throw createHttpError(400, "Bad Request", `Item cannot be equipped in ${equipmentSlot}.`);
    }

    const inventoryItem = await characterInventoryModel.findInventoryItemByCharacterId(
      characterId,
      itemId
    );

    if (!inventoryItem || inventoryItem.quantity < 1) {
      throw createHttpError(403, "Forbidden", "Character does not own this equipment item.");
    }

    res.locals.data = await characterInventoryModel.upsertEquipment({
      characterId,
      equipmentSlot,
      itemId
    });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// INVENTORY REMOVE CONTROLLERS
// ------------------------------------------------------------

// Removes one inventory item from a character.
export async function deleteInventoryItem(_req, res, next) {
  try {
    const { characterId, itemId } = res.locals;

    await findRequiredCharacter(characterId);

    if (!hasItemDefinition(itemId)) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    const removed = await characterInventoryModel.removeInventoryItem({ characterId, itemId });

    res.locals.data = {
      removed: Boolean(removed),
      inventoryItem: removed
    };
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Removes one equipped item from a slot.
export async function deleteEquipment(_req, res, next) {
  try {
    const { characterId, equipmentSlot } = res.locals;

    await findRequiredCharacter(characterId);

    const removed = await characterInventoryModel.removeEquipment({
      characterId,
      equipmentSlot
    });

    res.locals.data = {
      removed: Boolean(removed),
      equipment: removed
    };
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}

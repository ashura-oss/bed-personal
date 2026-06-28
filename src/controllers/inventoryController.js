// Inventory controller functions save, consume, equip, and remove inventory items.
// Item definitions come from constants; ownership and equipment state are saved in models.
import { findItemDefinitionById, hasItemDefinition } from "../constants/items.js";
import * as characterModel from "../models/characterModel.js";
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import {
  createHttpError,
  getRequiredIdParam,
  getRequiredInteger,
  getRequiredString,
  sendErrorResponse
} from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Consumes one inventory item and applies its effects.
// The model updates inventory and saved character/run state in the same transaction.
export async function postConsumeInventoryItem(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const item = findItemDefinitionById(req.params.itemId);

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

    return res.status(200).json({
      message: "Inventory item consumed.",
      data: consumeResult
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Saves one inventory item quantity for a character.
// Quantity zero is treated as removing the inventory row.
export async function putInventoryItem(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const itemId = req.params.itemId;
    const quantity = getRequiredInteger(req.body, "quantity", { min: 0 });

    await findRequiredCharacter(characterId);

    if (!hasItemDefinition(itemId)) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    if (quantity === 0) {
      const removed = await characterInventoryModel.removeInventoryItem({ characterId, itemId });

      return res.status(200).json({
        message: "Inventory item saved.",
        data: {
          removed: Boolean(removed),
          inventoryItem: removed
        }
      });
    }

    const inventoryItem = await characterInventoryModel.upsertInventoryItem({
      characterId,
      itemId,
      quantity
    });

    return res.status(200).json({
      message: "Inventory item saved.",
      data: inventoryItem
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Equips one owned item into one equipment slot.
// The item must exist, match the slot, and already be owned by the character.
export async function putEquipment(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const itemId = getRequiredString(req.body, "itemId");
    const item = findItemDefinitionById(itemId);

    await findRequiredCharacter(characterId);

    if (!item) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    if (!item.equipmentSlot || item.equipmentSlot !== req.params.equipmentSlot) {
      throw createHttpError(
        400,
        "Bad Request",
        `Item cannot be equipped in ${req.params.equipmentSlot}.`
      );
    }

    const inventoryItem = await characterInventoryModel.findInventoryItemByCharacterId(
      characterId,
      itemId
    );

    if (!inventoryItem || inventoryItem.quantity < 1) {
      throw createHttpError(403, "Forbidden", "Character does not own this equipment item.");
    }

    const equipment = await characterInventoryModel.upsertEquipment({
      characterId,
      equipmentSlot: req.params.equipmentSlot,
      itemId
    });

    return res.status(200).json({
      message: "Equipment saved.",
      data: equipment
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------

// Removes one inventory item from a character.
export async function deleteInventoryItem(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");

    await findRequiredCharacter(characterId);

    if (!hasItemDefinition(req.params.itemId)) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    const removed = await characterInventoryModel.removeInventoryItem({
      characterId,
      itemId: req.params.itemId
    });

    return res.status(200).json({
      message: "Inventory item removed.",
      data: {
        removed: Boolean(removed),
        inventoryItem: removed
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Removes one equipped item from a slot.
export async function deleteEquipment(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");

    await findRequiredCharacter(characterId);

    const removed = await characterInventoryModel.removeEquipment({
      characterId,
      equipmentSlot: req.params.equipmentSlot
    });

    return res.status(200).json({
      message: "Equipment removed.",
      data: {
        removed: Boolean(removed),
        equipment: removed
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}

import * as characterEquipmentModel from "../models/characterEquipmentModel.js";
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import { findItemDefinitionById } from "../constants/items.js";
import { createError, sendError } from "../utils/errorCode.js";

export async function putEquipment(req, res, next) {
  try {
    const character = res.locals.character;
    const itemIdValue = req.body?.itemId;

    if (typeof itemIdValue !== "string" || itemIdValue.trim().length === 0) {
      throw createError(400, "Bad Request", "itemId is required.");
    }

    const itemId = itemIdValue.trim();
    const item = findItemDefinitionById(itemId);

    if (!item) {
      throw createError(404, "Not Found", "Item definition was not found.");
    }

    if (!item.equipmentSlot || item.equipmentSlot !== req.params.equipmentSlot) {
      throw createError(
        400,
        "Bad Request",
        `Item cannot be equipped in ${req.params.equipmentSlot}.`
      );
    }

    const inventoryItem = await characterInventoryModel.findInventoryItemByCharacterId(
      character.characterId,
      itemId
    );

    if (!inventoryItem || inventoryItem.quantity < 1) {
      throw createError(400, "Bad Request", "Character does not own this equipment item.");
    }

    const equipment = await characterEquipmentModel.upsertEquipment({
      characterId: character.characterId,
      equipmentSlot: req.params.equipmentSlot,
      itemId
    });

    res.locals.data = equipment;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteEquipment(req, res, next) {
  try {
    const character = res.locals.character;
    const removed = await characterEquipmentModel.removeEquipment({
      characterId: character.characterId,
      equipmentSlot: req.params.equipmentSlot
    });

    res.locals.data = { removed: Boolean(removed), equipment: removed };
    next();
  } catch (error) {
    sendError(res, error);
  }
}

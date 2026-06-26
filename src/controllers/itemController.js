import { ITEM_DEFINITIONS, findItemDefinitionById } from "../constants/items.js";
import { createError, sendError } from "../utils/errorCode.js";

export async function getItems(req, res, next) {
  try {
    let itemType = req.query.itemType;
    let equipmentSlot = req.query.equipmentSlot;

    if (itemType !== undefined) {
      if (typeof itemType !== "string" || itemType.trim().length === 0) {
        throw createError(400, "Bad Request", "itemType must be a non-empty string.");
      }

      itemType = itemType.trim();
    }

    if (equipmentSlot !== undefined) {
      if (typeof equipmentSlot !== "string" || equipmentSlot.trim().length === 0) {
        throw createError(400, "Bad Request", "equipmentSlot must be a non-empty string.");
      }

      equipmentSlot = equipmentSlot.trim();
    }

    const items = ITEM_DEFINITIONS.filter((item) => {
      if (itemType !== undefined && item.itemType !== itemType) {
        return false;
      }

      if (equipmentSlot !== undefined && item.equipmentSlot !== equipmentSlot) {
        return false;
      }

      return true;
    }).sort((left, right) => left.name.localeCompare(right.name));

    res.locals.data = items;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

export async function getItemById(req, res, next) {
  try {
    const item = findItemDefinitionById(req.params.itemId);

    if (!item) {
      throw createError(404, "Not Found", "Item definition was not found.");
    }

    res.locals.data = item;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

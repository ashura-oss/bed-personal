// Item controller functions return fixed item definitions.
// Inventory state stores item ids; this controller returns the fixed item details.
import { ITEM_DEFINITIONS, findItemDefinitionById } from "../constants/items.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// ITEM LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets item definitions, optionally filtered by type or equipment slot.
export async function getItems(_req, res, next) {
  try {
    const { itemType, equipmentSlot } = res.locals;

    res.locals.data = ITEM_DEFINITIONS.filter((item) => {
      if (itemType !== undefined && item.itemType !== itemType) {
        return false;
      }

      if (equipmentSlot !== undefined && item.equipmentSlot !== equipmentSlot) {
        return false;
      }

      return true;
    }).sort((left, right) => left.name.localeCompare(right.name));
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one item definition by id.
export async function getItemById(_req, res, next) {
  try {
    const item = findItemDefinitionById(res.locals.itemId);

    if (!item) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    res.locals.data = item;
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

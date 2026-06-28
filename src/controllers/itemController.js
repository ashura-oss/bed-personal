// Item controller functions return fixed item definitions.
// Inventory state stores item ids; this controller returns the fixed item details.
import { ITEM_DEFINITIONS, findItemDefinitionById } from "../constants/items.js";
import { createHttpError, getOptionalString, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// ITEM LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets item definitions, optionally filtered by type or equipment slot.
export async function getItems(req, res) {
  try {
    const itemType = getOptionalString(req.query, "itemType");
    const equipmentSlot = getOptionalString(req.query, "equipmentSlot");
    const items = ITEM_DEFINITIONS.filter((item) => {
      if (itemType !== undefined && item.itemType !== itemType) {
        return false;
      }

      if (equipmentSlot !== undefined && item.equipmentSlot !== equipmentSlot) {
        return false;
      }

      return true;
    }).sort((left, right) => left.name.localeCompare(right.name));

    return res.status(200).json({
      message: "Items retrieved.",
      data: items
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one item definition by id.
export async function getItemById(req, res) {
  try {
    const item = findItemDefinitionById(req.params.itemId);

    if (!item) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    return res.status(200).json({
      message: "Item retrieved.",
      data: item
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

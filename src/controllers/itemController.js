// Item controller functions return fixed item definitions.
import { ITEM_DEFINITIONS, findItemDefinitionById } from "../constants/items.js";

// ------------------------------------------------------------
// READ CONTROLLERS
// ------------------------------------------------------------

// Return all item definitions, optionally filtered by type or slot.
export async function getItems(req, res, next) {
  try {
    let itemType = req.query.itemType;
    let equipmentSlot = req.query.equipmentSlot;

    if (itemType !== undefined) {
      if (typeof itemType !== "string" || itemType.trim().length === 0) {
        return res.status(400).json({ message: "itemType must be a non-empty string." });
      }

      itemType = itemType.trim();
    }

    if (equipmentSlot !== undefined) {
      if (typeof equipmentSlot !== "string" || equipmentSlot.trim().length === 0) {
        return res.status(400).json({ message: "equipmentSlot must be a non-empty string." });
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
    next(error);
  }
}

// Read one item definition by id.
export async function getItemById(req, res, next) {
  try {
    const item = findItemDefinitionById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: "Item definition was not found." });
    }

    res.locals.data = item;
    next();
  } catch (error) {
    next(error);
  }
}

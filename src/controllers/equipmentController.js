// Equipment controller functions equip and unequip character items.
import * as characterEquipmentModel from "../models/characterEquipmentModel.js";
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import { findItemDefinitionById } from "../constants/items.js";

// ------------------------------------------------------------
// SAVE CONTROLLERS
// ------------------------------------------------------------

// Equip one owned item into one equipment slot.
export async function putEquipment(req, res, next) {
  try {
    const character = res.locals.character;
    const itemIdValue = req.body?.itemId;

    if (typeof itemIdValue !== "string" || itemIdValue.trim().length === 0) {
      return res.status(400).json({ message: "itemId is required." });
    }

    const itemId = itemIdValue.trim();
    const item = findItemDefinitionById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Item definition was not found." });
    }

    if (!item.equipmentSlot || item.equipmentSlot !== req.params.equipmentSlot) {
      return res.status(400).json({ message: `Item cannot be equipped in ${req.params.equipmentSlot}.` });
    }

    const inventoryItem = await characterInventoryModel.findInventoryItemByCharacterId(
      character.characterId,
      itemId
    );

    if (!inventoryItem || inventoryItem.quantity < 1) {
      return res.status(400).json({ message: "Character does not own this equipment item." });
    }

    const equipment = await characterEquipmentModel.upsertEquipment({
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

// ------------------------------------------------------------
// REMOVE CONTROLLERS
// ------------------------------------------------------------

// Remove one equipped item from a slot.
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
    next(error);
  }
}

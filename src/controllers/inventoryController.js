// Inventory controller functions save, consume, equip, and remove inventory items.
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import { findItemDefinitionById, hasItemDefinition } from "../constants/items.js";

// ------------------------------------------------------------
// SAVE CONTROLLERS
// ------------------------------------------------------------

// Save one inventory item quantity for a character.
export async function putInventoryItem(req, res, next) {
  try {
    const character = res.locals.character;
    const itemId = req.params.itemId;
    const quantity = req.body?.quantity;

    if (!hasItemDefinition(itemId)) {
      return res.status(404).json({ message: "Item definition was not found." });
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ message: "quantity is required and must be a non-negative integer." });
    }

    if (quantity === 0) {
      const removed = await characterInventoryModel.removeInventoryItem({
        characterId: character.characterId,
        itemId
      });

      res.locals.data = { removed: Boolean(removed), inventoryItem: removed };
      next();
      return;
    }

    const inventoryItem = await characterInventoryModel.upsertInventoryItem({
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

    const equipment = await characterInventoryModel.upsertEquipment({
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

// Remove one inventory item from a character.
export async function deleteInventoryItem(req, res, next) {
  try {
    const character = res.locals.character;

    if (!hasItemDefinition(req.params.itemId)) {
      return res.status(404).json({ message: "Item definition was not found." });
    }

    const removed = await characterInventoryModel.removeInventoryItem({
      characterId: character.characterId,
      itemId: req.params.itemId
    });

    res.locals.data = { removed: Boolean(removed), inventoryItem: removed };
    next();
  } catch (error) {
    next(error);
  }
}

// Remove one equipped item from a slot.
export async function deleteEquipment(req, res, next) {
  try {
    const character = res.locals.character;
    const removed = await characterInventoryModel.removeEquipment({
      characterId: character.characterId,
      equipmentSlot: req.params.equipmentSlot
    });

    res.locals.data = { removed: Boolean(removed), equipment: removed };
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// ACTION CONTROLLERS
// ------------------------------------------------------------

// Consume one inventory item and apply its effects.
export async function postConsumeInventoryItem(req, res, next) {
  try {
    const character = res.locals.character;
    const item = findItemDefinitionById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: "Item definition was not found." });
    }

    if (item.itemType !== "consumable" || !item.consumeEffect) {
      return res.status(400).json({ message: "Item is not consumable." });
    }

    const consumeResult = await characterInventoryModel.consumeInventoryItem({
      characterId: character.characterId,
      item
    });

    if (!consumeResult.consumed) {
      return res.status(404).json({ message: "Consumable item was not found in inventory." });
    }

    res.locals.data = consumeResult;
    next();
  } catch (error) {
    next(error);
  }
}

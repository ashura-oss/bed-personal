// Inventory controller functions save, consume, and remove inventory items.
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

// ------------------------------------------------------------
// CREATE AND ACTION CONTROLLERS
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

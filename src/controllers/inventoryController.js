import * as characterInventoryModel from "../models/characterInventoryModel.js";
import { findItemDefinitionById, hasItemDefinition } from "../constants/items.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

export async function putInventoryItem(req, res, next) {
  try {
    const character = res.locals.character;
    const itemId = req.params.itemId;
    const quantity = req.body?.quantity;

    if (!hasItemDefinition(itemId)) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw createHttpError(400, "Bad Request", "quantity is required and must be a non-negative integer.");
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
    sendHttpError(res, error);
  }
}

export async function deleteInventoryItem(req, res, next) {
  try {
    const character = res.locals.character;

    if (!hasItemDefinition(req.params.itemId)) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    const removed = await characterInventoryModel.removeInventoryItem({
      characterId: character.characterId,
      itemId: req.params.itemId
    });

    res.locals.data = { removed: Boolean(removed), inventoryItem: removed };
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function postConsumeInventoryItem(req, res, next) {
  try {
    const character = res.locals.character;
    const item = findItemDefinitionById(req.params.itemId);

    if (!item) {
      throw createHttpError(404, "Not Found", "Item definition was not found.");
    }

    if (item.itemType !== "consumable" || !item.consumeEffect) {
      throw createHttpError(400, "Bad Request", "Item is not consumable.");
    }

    const consumeResult = await characterInventoryModel.consumeInventoryItem({
      characterId: character.characterId,
      item
    });

    if (!consumeResult.consumed) {
      throw createHttpError(404, "Not Found", "Consumable item was not found in inventory.");
    }

    res.locals.data = consumeResult;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

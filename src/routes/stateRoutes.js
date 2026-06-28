// Saved state route definitions.
// These routes save persistent gameplay state such as inventory, slots, flags, and markers.
import { Router } from "express";
import {
  deleteEquipment,
  deleteInventoryItem,
  postConsumeInventoryItem,
  putEquipment,
  putInventoryItem
} from "../controllers/inventoryController.js";
import {
  getCharacterFullState,
  getSaveSlotsForUser,
  putBossState,
  putCampaignMarker,
  putDialogueFlag,
  putFactionReputation,
  putRegionState,
  putSaveSlotForUser
} from "../controllers/stateController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateAnyBody, validateBody, validateParams } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get save slots for one user.
// Required fields: userId parameter
router.get(
  "/users/:userId/save-slots",
  validateParams({ userId: { type: "integer", min: 1 } }),
  getSaveSlotsForUser,
  withMessage("Save slots retrieved."),
  sendResponse
);

// Get full saved state for one character.
// Required fields: characterId parameter
router.get(
  "/characters/:characterId/full",
  validateParams({ characterId: { type: "integer", min: 1 } }),
  getCharacterFullState,
  withMessage("Character state retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Consume one inventory item for a character.
// Required fields: characterId parameter, itemId parameter
router.post(
  "/characters/:characterId/consume/:itemId",
  validateParams({
    characterId: { type: "integer", min: 1 },
    itemId: { type: "string" }
  }),
  postConsumeInventoryItem,
  withMessage("Inventory item consumed."),
  sendResponse
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Save one user save slot.
// Required fields: userId parameter, slotIndex parameter, one save slot field
// Optional fields: characterId, slotName
router.put(
  "/users/:userId/save-slots/:slotIndex",
  validateParams({
    userId: { type: "integer", min: 1 },
    slotIndex: { type: "integer", min: 1 }
  }),
  validateAnyBody({
    characterId: { type: "integer", min: 1, nullable: true },
    slotName: { type: "string" }
  }),
  putSaveSlotForUser,
  withMessage("Save slot saved."),
  sendResponse
);

// Save one inventory item for a character.
// Required fields: characterId parameter, itemId parameter, quantity
router.put(
  "/characters/:characterId/inventory/:itemId",
  validateParams({
    characterId: { type: "integer", min: 1 },
    itemId: { type: "string" }
  }),
  validateBody({ quantity: { type: "integer", min: 0 } }),
  putInventoryItem,
  withMessage("Inventory item saved."),
  sendResponse
);

// Equip one item for a character.
// Required fields: characterId parameter, equipmentSlot parameter, itemId
router.put(
  "/characters/:characterId/equipment/:equipmentSlot",
  validateParams({
    characterId: { type: "integer", min: 1 },
    equipmentSlot: { type: "string" }
  }),
  validateBody({ itemId: { type: "string" } }),
  putEquipment,
  withMessage("Equipment saved."),
  sendResponse
);

// Save one dialogue flag for a character.
// Required fields: characterId parameter, flagId parameter, value
router.put(
  "/characters/:characterId/dialogue-flags/:flagId",
  validateParams({
    characterId: { type: "integer", min: 1 },
    flagId: { type: "string" }
  }),
  validateBody({ value: { type: "bit" } }),
  putDialogueFlag,
  withMessage("Dialogue flag saved."),
  sendResponse
);

// Save one boss state for a character.
// Required fields: characterId parameter, bossId parameter, one boss state field
// Optional fields: status, attempts, defeats, bestTimeSeconds, lastOutcome
router.put(
  "/characters/:characterId/boss-states/:bossId",
  validateParams({
    characterId: { type: "integer", min: 1 },
    bossId: { type: "string" }
  }),
  validateAnyBody({
    status: { type: "string" },
    attempts: { type: "integer", min: 0 },
    defeats: { type: "integer", min: 0 },
    bestTimeSeconds: { type: "number", nullable: true },
    lastOutcome: { type: "string" }
  }),
  putBossState,
  withMessage("Boss state saved."),
  sendResponse
);

// Save one campaign marker for a character.
// Required fields: characterId parameter, markerId parameter, regionId, markerType
// Optional fields: isRevealed, isCompleted, positionX, positionY
router.put(
  "/characters/:characterId/campaign-markers/:markerId",
  validateParams({
    characterId: { type: "integer", min: 1 },
    markerId: { type: "string" }
  }),
  validateBody({
    regionId: { type: "string" },
    markerType: { type: "string" },
    isRevealed: { type: "bit", optional: true },
    isCompleted: { type: "bit", optional: true },
    positionX: { type: "number", optional: true },
    positionY: { type: "number", optional: true }
  }),
  putCampaignMarker,
  withMessage("Campaign marker saved."),
  sendResponse
);

// Save one faction reputation record for a character.
// Required fields: characterId parameter, factionId parameter, one reputation field
// Optional fields: reputation, rank
router.put(
  "/characters/:characterId/faction-reputation/:factionId",
  validateParams({
    characterId: { type: "integer", min: 1 },
    factionId: { type: "string" }
  }),
  validateAnyBody({
    reputation: { type: "integer" },
    rank: { type: "string" }
  }),
  putFactionReputation,
  withMessage("Faction reputation saved."),
  sendResponse
);

// Save one region state for a character.
// Required fields: characterId parameter, regionId parameter, one region state field
// Optional fields: isUnlocked, isDiscovered, threatLevel, worldState
router.put(
  "/characters/:characterId/region-states/:regionId",
  validateParams({
    characterId: { type: "integer", min: 1 },
    regionId: { type: "string" }
  }),
  validateAnyBody({
    isUnlocked: { type: "bit" },
    isDiscovered: { type: "bit" },
    threatLevel: { type: "integer", min: 0 },
    worldState: { type: "string" }
  }),
  putRegionState,
  withMessage("Region state saved."),
  sendResponse
);

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------

// Remove one inventory item from a character.
// Required fields: characterId parameter, itemId parameter
router.delete(
  "/characters/:characterId/inventory/:itemId",
  validateParams({
    characterId: { type: "integer", min: 1 },
    itemId: { type: "string" }
  }),
  deleteInventoryItem,
  withMessage("Inventory item removed."),
  sendResponse
);

// Unequip one item for a character.
// Required fields: characterId parameter, equipmentSlot parameter
router.delete(
  "/characters/:characterId/equipment/:equipmentSlot",
  validateParams({
    characterId: { type: "integer", min: 1 },
    equipmentSlot: { type: "string" }
  }),
  deleteEquipment,
  withMessage("Equipment removed."),
  sendResponse
);

export default router;

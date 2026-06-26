// Saved state route definitions.
import { Router } from "express";
import { putBossState } from "../controllers/bossStateController.js";
import { putCampaignMarker } from "../controllers/campaignMarkerController.js";
import { putDialogueFlag } from "../controllers/dialogueFlagController.js";
import { deleteEquipment, putEquipment } from "../controllers/equipmentController.js";
import { putFactionReputation } from "../controllers/factionReputationController.js";
import { getCharacterFullState } from "../controllers/fullStateController.js";
import { deleteInventoryItem, postConsumeInventoryItem, putInventoryItem } from "../controllers/inventoryController.js";
import { putRegionState } from "../controllers/regionStateController.js";
import { getSaveSlotsForUser, putSaveSlotForUser } from "../controllers/saveSlotController.js";
import { loadCharacterFromCharacterIdParam } from "../controllers/characterController.js";
import { loadUserFromUserIdParam } from "../controllers/userController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List save slots for one user.
router.get(
  "/users/:userId/save-slots",
  loadUserFromUserIdParam,
  getSaveSlotsForUser,
  withMessage("Save slots retrieved."),
  sendResponse
);

// Save one user save slot.
router.put(
  "/users/:userId/save-slots/:slotIndex",
  loadUserFromUserIdParam,
  putSaveSlotForUser,
  withMessage("Save slot saved."),
  sendResponse
);

// Read the full saved state for one character.
router.get(
  "/characters/:characterId/full",
  loadCharacterFromCharacterIdParam,
  getCharacterFullState,
  withMessage("Character state retrieved."),
  sendResponse
);

// Save one inventory item for a character.
router.put(
  "/characters/:characterId/inventory/:itemId",
  loadCharacterFromCharacterIdParam,
  putInventoryItem,
  withMessage("Inventory item saved."),
  sendResponse
);

// Remove one inventory item from a character.
router.delete(
  "/characters/:characterId/inventory/:itemId",
  loadCharacterFromCharacterIdParam,
  deleteInventoryItem,
  withMessage("Inventory item removed.", 204),
  sendResponse
);

// Consume one inventory item for a character.
router.post(
  "/characters/:characterId/consume/:itemId",
  loadCharacterFromCharacterIdParam,
  postConsumeInventoryItem,
  withMessage("Inventory item consumed."),
  sendResponse
);

// Equip one item for a character.
router.put(
  "/characters/:characterId/equipment/:equipmentSlot",
  loadCharacterFromCharacterIdParam,
  putEquipment,
  withMessage("Equipment saved."),
  sendResponse
);

// Unequip one item for a character.
router.delete(
  "/characters/:characterId/equipment/:equipmentSlot",
  loadCharacterFromCharacterIdParam,
  deleteEquipment,
  withMessage("Equipment removed.", 204),
  sendResponse
);

// Save one dialogue flag for a character.
router.put(
  "/characters/:characterId/dialogue-flags/:flagId",
  loadCharacterFromCharacterIdParam,
  putDialogueFlag,
  withMessage("Dialogue flag saved."),
  sendResponse
);

// Save one boss state for a character.
router.put(
  "/characters/:characterId/boss-states/:bossId",
  loadCharacterFromCharacterIdParam,
  putBossState,
  withMessage("Boss state saved."),
  sendResponse
);

// Save one campaign marker for a character.
router.put(
  "/characters/:characterId/campaign-markers/:markerId",
  loadCharacterFromCharacterIdParam,
  putCampaignMarker,
  withMessage("Campaign marker saved."),
  sendResponse
);

// Save one faction reputation record for a character.
router.put(
  "/characters/:characterId/faction-reputation/:factionId",
  loadCharacterFromCharacterIdParam,
  putFactionReputation,
  withMessage("Faction reputation saved."),
  sendResponse
);

// Save one region state for a character.
router.put(
  "/characters/:characterId/region-states/:regionId",
  loadCharacterFromCharacterIdParam,
  putRegionState,
  withMessage("Region state saved."),
  sendResponse
);

export default router;

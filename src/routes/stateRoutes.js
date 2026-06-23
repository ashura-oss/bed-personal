import { Router } from "express";
import {
  deleteEquipment,
  deleteInventoryItem,
  getCharacterFullState,
  getSaveSlotsForUser,
  putBossState,
  putCampaignMarker,
  putDialogueFlag,
  putEquipment,
  putFactionReputation,
  putInventoryItem,
  putRegionState,
  putSaveSlotForUser
} from "../controllers/stateController.js";
import { authenticateToken, requireSelfParam } from "../middlewares/authMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get(
  "/users/:userId/save-slots",
  authenticateToken,
  requireSelfParam("userId"),
  getSaveSlotsForUser,
  withMessage("Save slots retrieved."),
  sendResponse
);
router.put(
  "/users/:userId/save-slots/:slotIndex",
  authenticateToken,
  requireSelfParam("userId"),
  putSaveSlotForUser,
  withMessage("Save slot saved."),
  sendResponse
);
router.get(
  "/characters/:characterId/full",
  authenticateToken,
  getCharacterFullState,
  withMessage("Character state retrieved."),
  sendResponse
);
router.put(
  "/characters/:characterId/inventory/:itemId",
  authenticateToken,
  putInventoryItem,
  withMessage("Inventory item saved."),
  sendResponse
);
router.delete(
  "/characters/:characterId/inventory/:itemId",
  authenticateToken,
  deleteInventoryItem,
  withMessage("Inventory item removed."),
  sendResponse
);
router.put(
  "/characters/:characterId/equipment/:equipmentSlot",
  authenticateToken,
  putEquipment,
  withMessage("Equipment saved."),
  sendResponse
);
router.delete(
  "/characters/:characterId/equipment/:equipmentSlot",
  authenticateToken,
  deleteEquipment,
  withMessage("Equipment removed."),
  sendResponse
);
router.put(
  "/characters/:characterId/dialogue-flags/:flagId",
  authenticateToken,
  putDialogueFlag,
  withMessage("Dialogue flag saved."),
  sendResponse
);
router.put(
  "/characters/:characterId/boss-states/:bossId",
  authenticateToken,
  putBossState,
  withMessage("Boss state saved."),
  sendResponse
);
router.put(
  "/characters/:characterId/campaign-markers/:markerId",
  authenticateToken,
  putCampaignMarker,
  withMessage("Campaign marker saved."),
  sendResponse
);
router.put(
  "/characters/:characterId/faction-reputation/:factionId",
  authenticateToken,
  putFactionReputation,
  withMessage("Faction reputation saved."),
  sendResponse
);
router.put(
  "/characters/:characterId/region-states/:regionId",
  authenticateToken,
  putRegionState,
  withMessage("Region state saved."),
  sendResponse
);

export default router;

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
import { loadCharacterFromCharacterIdParam, loadUserFromUserIdParam } from "../middlewares/resourceMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/users/:userId/save-slots", loadUserFromUserIdParam, getSaveSlotsForUser, withMessage("Save slots retrieved."), sendResponse);

router.put("/users/:userId/save-slots/:slotIndex", loadUserFromUserIdParam, putSaveSlotForUser, withMessage("Save slot saved."), sendResponse);

router.get("/characters/:characterId/full", loadCharacterFromCharacterIdParam, getCharacterFullState, withMessage("Character state retrieved."), sendResponse);

router.put("/characters/:characterId/inventory/:itemId", loadCharacterFromCharacterIdParam, putInventoryItem, withMessage("Inventory item saved."), sendResponse);

router.delete("/characters/:characterId/inventory/:itemId", loadCharacterFromCharacterIdParam, deleteInventoryItem, withMessage("Inventory item removed.", 204), sendResponse);

router.post("/characters/:characterId/consume/:itemId", loadCharacterFromCharacterIdParam, postConsumeInventoryItem, withMessage("Inventory item consumed."), sendResponse);

router.put("/characters/:characterId/equipment/:equipmentSlot", loadCharacterFromCharacterIdParam, putEquipment, withMessage("Equipment saved."), sendResponse);

router.delete("/characters/:characterId/equipment/:equipmentSlot", loadCharacterFromCharacterIdParam, deleteEquipment, withMessage("Equipment removed.", 204), sendResponse);

router.put("/characters/:characterId/dialogue-flags/:flagId", loadCharacterFromCharacterIdParam, putDialogueFlag, withMessage("Dialogue flag saved."), sendResponse);

router.put("/characters/:characterId/boss-states/:bossId", loadCharacterFromCharacterIdParam, putBossState, withMessage("Boss state saved."), sendResponse);

router.put("/characters/:characterId/campaign-markers/:markerId", loadCharacterFromCharacterIdParam, putCampaignMarker, withMessage("Campaign marker saved."), sendResponse);

router.put("/characters/:characterId/faction-reputation/:factionId", loadCharacterFromCharacterIdParam, putFactionReputation, withMessage("Faction reputation saved."), sendResponse);

router.put("/characters/:characterId/region-states/:regionId", loadCharacterFromCharacterIdParam, putRegionState, withMessage("Region state saved."), sendResponse);

export default router;

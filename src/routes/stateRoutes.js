// Saved state route definitions.
// Route order: validate required params/body fields first, then let controllers save game state rows.
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
import { requireAnyBodyField, requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get save slots for one user.
// Required fields: userId parameter
// Optional fields: none
router.get(
  "/users/:userId/save-slots",
  requireParamFields("userId"),
  getSaveSlotsForUser
);

// Get full saved state for one character.
// Required fields: characterId parameter
// Optional fields: none
router.get(
  "/characters/:characterId/full",
  requireParamFields("characterId"),
  getCharacterFullState
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Consume one inventory item for a character.
// Required fields: characterId parameter, itemId parameter
// Optional fields: none
router.post(
  "/characters/:characterId/consume/:itemId",
  requireParamFields("characterId", "itemId"),
  postConsumeInventoryItem
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Save one user save slot.
// Required fields: userId parameter, slotIndex parameter, one save slot field
// Optional fields: characterId, slotName
router.put(
  "/users/:userId/save-slots/:slotIndex",
  requireParamFields("userId", "slotIndex"),
  requireAnyBodyField("characterId", "slotName"),
  putSaveSlotForUser
);

// Save one inventory item for a character.
// Required fields: characterId parameter, itemId parameter, quantity
// Optional fields: none
router.put(
  "/characters/:characterId/inventory/:itemId",
  requireParamFields("characterId", "itemId"),
  requireBodyFields("quantity"),
  putInventoryItem
);

// Equip one item for a character.
// Required fields: characterId parameter, equipmentSlot parameter, itemId
// Optional fields: none
router.put(
  "/characters/:characterId/equipment/:equipmentSlot",
  requireParamFields("characterId", "equipmentSlot"),
  requireBodyFields("itemId"),
  putEquipment
);

// Save one dialogue flag for a character.
// Required fields: characterId parameter, flagId parameter, value
// Optional fields: none
router.put(
  "/characters/:characterId/dialogue-flags/:flagId",
  requireParamFields("characterId", "flagId"),
  requireBodyFields("value"),
  putDialogueFlag
);

// Save one boss state for a character.
// Required fields: characterId parameter, bossId parameter, one boss state field
// Optional fields: status, attempts, defeats, bestTimeSeconds, lastOutcome
router.put(
  "/characters/:characterId/boss-states/:bossId",
  requireParamFields("characterId", "bossId"),
  requireAnyBodyField("status", "attempts", "defeats", "bestTimeSeconds", "lastOutcome"),
  putBossState
);

// Save one campaign marker for a character.
// Required fields: characterId parameter, markerId parameter, regionId, markerType
// Optional fields: isRevealed, isCompleted, positionX, positionY
router.put(
  "/characters/:characterId/campaign-markers/:markerId",
  requireParamFields("characterId", "markerId"),
  requireBodyFields("regionId", "markerType"),
  putCampaignMarker
);

// Save one faction reputation record for a character.
// Required fields: characterId parameter, factionId parameter, one reputation field
// Optional fields: reputation, rank
router.put(
  "/characters/:characterId/faction-reputation/:factionId",
  requireParamFields("characterId", "factionId"),
  requireAnyBodyField("reputation", "rank"),
  putFactionReputation
);

// Save one region state for a character.
// Required fields: characterId parameter, regionId parameter, one region state field
// Optional fields: isUnlocked, isDiscovered, threatLevel, worldState
router.put(
  "/characters/:characterId/region-states/:regionId",
  requireParamFields("characterId", "regionId"),
  requireAnyBodyField("isUnlocked", "isDiscovered", "threatLevel", "worldState"),
  putRegionState
);

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------

// Remove one inventory item from a character.
// Required fields: characterId parameter, itemId parameter
// Optional fields: none
router.delete(
  "/characters/:characterId/inventory/:itemId",
  requireParamFields("characterId", "itemId"),
  deleteInventoryItem
);

// Unequip one item for a character.
// Required fields: characterId parameter, equipmentSlot parameter
// Optional fields: none
router.delete(
  "/characters/:characterId/equipment/:equipmentSlot",
  requireParamFields("characterId", "equipmentSlot"),
  deleteEquipment
);

export default router;

// Map route definitions.
// Route order: validate required params/body fields first, then let the controller handle travel rules.
import { Router } from "express";
import {
  getCharacterMapLocation,
  getMapNodeById,
  getMapNodes,
  postTravelToNode
} from "../controllers/mapController.js";
import { requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all map node definitions.
// Required fields: none
// Optional fields: regionId query
router.get(
  "/nodes",
  getMapNodes
);

// Get one map node definition.
// Required fields: nodeId parameter
// Optional fields: none
router.get(
  "/nodes/:nodeId",
  requireParamFields("nodeId"),
  getMapNodeById
);

// Get one character's current map location.
// Required fields: characterId parameter
// Optional fields: none
router.get(
  "/characters/:characterId/location",
  requireParamFields("characterId"),
  getCharacterMapLocation
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Travel one character to another map node.
// Required fields: characterId, targetNodeId
// Optional fields: none
router.post(
  "/travel",
  requireBodyFields("characterId", "targetNodeId"),
  postTravelToNode
);

export default router;

// Map route definitions.
import { Router } from "express";
import { getCharacterMapLocation, getMapNodeById, getMapNodes, postTravelToNode } from "../controllers/mapController.js";
import { loadCharacterFromBody, loadCharacterFromCharacterIdParam } from "../controllers/characterController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get all map node definitions.
//Required fields: none
//Optional fields: regionId query
router.get(
  "/nodes",
  getMapNodes,
  withMessage("Map nodes retrieved."),
  sendResponse
);

//Get one map node definition.
//Required fields: nodeId parameter
//Optional fields: none
router.get(
  "/nodes/:nodeId",
  requireParamFields("nodeId"),
  getMapNodeById,
  withMessage("Map node retrieved."),
  sendResponse
);

//Get one character's current map location.
//Required fields: characterId parameter
//Optional fields: none
router.get(
  "/characters/:characterId/location",
  requireParamFields("characterId"),
  loadCharacterFromCharacterIdParam,
  getCharacterMapLocation,
  withMessage("Character map location retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

//Travel one character to another map node.
//Required fields: characterId, targetNodeId
//Optional fields: none
router.post(
  "/travel",
  requireBodyFields("characterId", "targetNodeId"),
  loadCharacterFromBody,
  postTravelToNode,
  withMessage("Travel resolved."),
  sendResponse
);

export default router;

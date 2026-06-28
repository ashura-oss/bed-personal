// Map route definitions.
// Each route validates request input before the controller handles map rules.
import { Router } from "express";
import {
  getCharacterMapLocation,
  getMapNodeById,
  getMapNodes,
  postTravelToNode
} from "../controllers/mapController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all map node definitions.
// Optional fields: regionId query
router.get(
  "/nodes",
  validateQuery({ regionId: { type: "string" } }),
  getMapNodes,
  withMessage("Map nodes retrieved."),
  sendResponse
);

// Get one map node definition.
// Required fields: nodeId parameter
router.get(
  "/nodes/:nodeId",
  validateParams({ nodeId: { type: "string" } }),
  getMapNodeById,
  withMessage("Map node retrieved."),
  sendResponse
);

// Get one character's current map location.
// Required fields: characterId parameter
router.get(
  "/characters/:characterId/location",
  validateParams({ characterId: { type: "integer", min: 1 } }),
  getCharacterMapLocation,
  withMessage("Character map location retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Travel one character to another map node.
// Required fields: characterId, targetNodeId
router.post(
  "/travel",
  validateBody({
    characterId: { type: "integer", min: 1 },
    targetNodeId: { type: "string" }
  }),
  postTravelToNode,
  withMessage("Travel resolved."),
  sendResponse
);

export default router;

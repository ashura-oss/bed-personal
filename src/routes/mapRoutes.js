import { Router } from "express";
import { getCharacterMapLocation, getMapNodeById, getMapNodes, postTravelToNode } from "../controllers/mapController.js";
import { loadCharacterFromBody, loadCharacterFromCharacterIdParam } from "../controllers/characterController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List all map node definitions.
router.get(
  "/nodes",
  getMapNodes,
  withMessage("Map nodes retrieved."),
  sendResponse
);

// Read one map node definition.
router.get(
  "/nodes/:nodeId",
  getMapNodeById,
  withMessage("Map node retrieved."),
  sendResponse
);

// Read the current map location for a character.
router.get(
  "/characters/:characterId/location",
  loadCharacterFromCharacterIdParam,
  getCharacterMapLocation,
  withMessage("Character map location retrieved."),
  sendResponse
);

// Travel a character to another map node.
router.post(
  "/travel",
  loadCharacterFromBody,
  postTravelToNode,
  withMessage("Travel resolved."),
  sendResponse
);

export default router;

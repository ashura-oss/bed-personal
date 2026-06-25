import { Router } from "express";
import { getCharacterMapLocation, getMapNodeById, getMapNodes, postTravelToNode } from "../controllers/mapController.js";
import { loadCharacterFromBody, loadCharacterFromCharacterIdParam } from "../middlewares/resourceMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/nodes", getMapNodes, withMessage("Map nodes retrieved."), sendResponse);

router.get("/nodes/:nodeId", getMapNodeById, withMessage("Map node retrieved."), sendResponse);

router.get("/characters/:characterId/location", loadCharacterFromCharacterIdParam, getCharacterMapLocation, withMessage("Character map location retrieved."), sendResponse);

router.post("/travel", loadCharacterFromBody, postTravelToNode, withMessage("Travel resolved."), sendResponse);

export default router;

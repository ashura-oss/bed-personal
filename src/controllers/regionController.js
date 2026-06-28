// Region controller functions return fixed region data.
// Region unlock progress is saved separately in state models.
import { REGION_DEFINITIONS, findRegionDefinitionById } from "../constants/regions.js";
import { createHttpError, getOptionalPositiveIntegerQuery, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// REGION LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets all region definitions, optionally filtered by danger level.
export async function getRegions(req, res) {
  try {
    const dangerLevel = getOptionalPositiveIntegerQuery(req.query, "dangerLevel");
    let regionList = [...REGION_DEFINITIONS].sort(
      (left, right) => left.dangerLevel - right.dangerLevel
    );

    if (dangerLevel !== undefined) {
      regionList = regionList.filter((region) => region.dangerLevel === dangerLevel);
    }

    return res.status(200).json({
      message: "Regions retrieved.",
      data: regionList
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one region definition by id.
export async function getRegionById(req, res) {
  try {
    const region = findRegionDefinitionById(req.params.id);

    if (!region) {
      throw createHttpError(404, "Not Found", "Region was not found.");
    }

    return res.status(200).json({
      message: "Region retrieved.",
      data: region
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

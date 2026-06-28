// Region controller functions return fixed region data.
// Region unlock progress is saved separately in state models.
import { REGION_DEFINITIONS, findRegionDefinitionById } from "../constants/regions.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// REGION LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets all region definitions, optionally filtered by danger level.
export async function getRegions(_req, res, next) {
  try {
    const { dangerLevel } = res.locals;
    let regionList = [...REGION_DEFINITIONS].sort(
      (left, right) => left.dangerLevel - right.dangerLevel
    );

    if (dangerLevel !== undefined) {
      regionList = regionList.filter((region) => region.dangerLevel === dangerLevel);
    }

    res.locals.data = regionList;
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one region definition by id.
export async function getRegionById(_req, res, next) {
  try {
    const region = findRegionDefinitionById(res.locals.id);

    if (!region) {
      throw createHttpError(404, "Not Found", "Region was not found.");
    }

    res.locals.data = region;
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

import { REGION_DEFINITIONS, findRegionDefinitionById } from "../constants/regions.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

export async function getRegions(req, res, next) {
  try {
    let dangerLevel;

    if (req.query.dangerLevel !== undefined) {
      if (Array.isArray(req.query.dangerLevel)) {
        throw createHttpError(400, "Bad Request", "dangerLevel query must be provided once.");
      }

      dangerLevel = Number(req.query.dangerLevel);

      if (!Number.isInteger(dangerLevel) || dangerLevel < 1) {
        throw createHttpError(400, "Bad Request", "dangerLevel query must be a positive integer.");
      }
    }

    let regionList = [...REGION_DEFINITIONS].sort(
      (left, right) => left.dangerLevel - right.dangerLevel
    );

    if (dangerLevel !== undefined) {
      regionList = regionList.filter((region) => region.dangerLevel === dangerLevel);
    }

    res.locals.data = regionList;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getRegionById(req, res, next) {
  try {
    const region = findRegionDefinitionById(req.params.id);

    if (!region) {
      throw createHttpError(404, "Not Found", "Region was not found.");
    }

    res.locals.data = region;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

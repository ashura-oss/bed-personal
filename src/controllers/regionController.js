// Region controller functions return fixed region data.
import { REGION_DEFINITIONS, findRegionDefinitionById } from "../constants/regions.js";

// ------------------------------------------------------------
// READ CONTROLLERS
// ------------------------------------------------------------

// Return all region definitions, optionally filtered by danger level.
export async function getRegions(req, res, next) {
  try {
    let dangerLevel;

    if (req.query.dangerLevel !== undefined) {
      if (Array.isArray(req.query.dangerLevel)) {
        return res.status(400).json({ message: "dangerLevel query must be provided once." });
      }

      dangerLevel = Number(req.query.dangerLevel);

      if (!Number.isInteger(dangerLevel) || dangerLevel < 1) {
        return res.status(400).json({ message: "dangerLevel query must be a positive integer." });
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
    next(error);
  }
}

// Read one region definition by id.
export async function getRegionById(req, res, next) {
  try {
    const region = findRegionDefinitionById(req.params.id);

    if (!region) {
      return res.status(404).json({ message: "Region was not found." });
    }

    res.locals.data = region;
    next();
  } catch (error) {
    next(error);
  }
}

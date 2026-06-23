import { findRegionById, findRegions } from "../models/regionModel.js";
import { createHttpError } from "../utils/httpError.js";
import { getOptionalPositiveIntegerQuery } from "../utils/validate.js";

export async function getRegions(req, res, next) {
  try {
    const dangerLevel = getOptionalPositiveIntegerQuery(req.query, "dangerLevel");
    const regionList = await findRegions({ dangerLevel });

    res.locals.data = regionList;
    next();
  } catch (error) {
    next(error);
  }
}

export async function getRegionById(req, res, next) {
  try {
    const region = await findRegionById(req.params.id);

    if (!region) {
      throw createHttpError(404, "Not Found", "Region was not found.");
    }

    res.locals.data = region;
    next();
  } catch (error) {
    next(error);
  }
}

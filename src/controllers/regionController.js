import { findRegionById, findRegions } from "../models/regionModel.js";
import { createHttpError } from "../utils/httpError.js";
import { getOptionalPositiveIntegerQuery } from "../utils/validate.js";

export async function getRegions(req, res, next) {
  try {
    const dangerLevel = getOptionalPositiveIntegerQuery(req.query, "dangerLevel");
    const regionList = await findRegions({ dangerLevel });

    res.status(200).json(regionList);
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

    res.status(200).json(region);
  } catch (error) {
    next(error);
  }
}

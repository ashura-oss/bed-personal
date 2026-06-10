import { AppError } from '../utils/_errors.js';
import { parsePositiveInteger, requireText } from '../utils/validation.js';
import {
  findAllRegions,
  findRegionByCode,
  findRegionsByDangerLevel,
} from '../models/regionModel.js';

export const listRegions = async (req, res, next) => {
  try {
    if (req.query.dangerLevel !== undefined) {
      const dangerLevel = parsePositiveInteger(req.query.dangerLevel, 'dangerLevel');
      const filteredRegions = await findRegionsByDangerLevel(dangerLevel);

      return res.json({ data: filteredRegions });
    }

    const rows = await findAllRegions();
    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
};

export const getRegion = async (req, res, next) => {
  try {
    const code = requireText(req.params.regionCode, 'regionCode', 40).toLowerCase();
    const region = await findRegionByCode(code);

    if (!region) {
      throw new AppError('NOT_FOUND', 'Region not found');
    }

    return res.json({ data: region });
  } catch (error) {
    return next(error);
  }
};

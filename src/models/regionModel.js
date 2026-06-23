import { REGION_DEFINITIONS, findRegionDefinitionById } from "../content/index.js";

export async function findRegions(filters = {}) {
  const regionList = [...REGION_DEFINITIONS].sort(
    (left, right) => left.dangerLevel - right.dangerLevel
  );

  if (filters.dangerLevel !== undefined) {
    return regionList.filter((region) => region.dangerLevel === filters.dangerLevel);
  }

  return regionList;
}

export async function findRegionById(regionId) {
  return findRegionDefinitionById(regionId);
}

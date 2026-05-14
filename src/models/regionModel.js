import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { regions } from "../db/schema.js";

const regionColumns = {
  regionId: regions.regionId,
  name: regions.name,
  description: regions.description,
  dangerLevel: regions.dangerLevel,
  recommendedLevel: regions.recommendedLevel,
  faction: regions.faction,
  shardName: regions.shardName,
  isUnlocked: regions.isUnlocked
};

export async function findRegions(filters = {}) {
  const query = db.select(regionColumns).from(regions).orderBy(asc(regions.dangerLevel));

  if (filters.dangerLevel !== undefined) {
    return query.where(eq(regions.dangerLevel, filters.dangerLevel));
  }

  return query;
}

export async function findRegionById(regionId) {
  const result = await db
    .select(regionColumns)
    .from(regions)
    .where(eq(regions.regionId, regionId))
    .limit(1);

  return result[0] || null;
}

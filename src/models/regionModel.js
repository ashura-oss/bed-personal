import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { regions } from '../db/schema.js';

export const findAllRegions = () => db.select().from(regions).orderBy(regions.dangerLevel);

export const findRegionsByDangerLevel = (dangerLevel) => (
  db.select().from(regions).where(eq(regions.dangerLevel, dangerLevel)).orderBy(regions.id)
);

export const findRegionByCode = async (code) => {
  const rows = await db.select().from(regions).where(eq(regions.code, code)).limit(1);
  return rows[0] || null;
};

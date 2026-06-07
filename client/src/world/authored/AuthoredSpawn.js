import { HEARTHMERE_SPAWN_POINT } from "../regions/hearthmere/HearthmereRegion.js";

export const DEFAULT_AUTHORED_SPAWN_POINT = HEARTHMERE_SPAWN_POINT;
export const PLAYER_SPAWN_HEIGHT_OFFSET = 1.5;

function isFinitePointXZ(point) {
  return Number.isFinite(point?.x) && Number.isFinite(point?.z);
}

function sampleGroundHeight(heightAt, point) {
  if (typeof heightAt !== "function") return null;

  const height = heightAt(point.x, point.z);
  return Number.isFinite(height) ? height : null;
}

export function resolveAuthoredSpawnPoint({
  authoredMapSource = null,
  regionId = "hearthmere",
  heightAt = null,
  fallback = DEFAULT_AUTHORED_SPAWN_POINT,
  heightOffset = PLAYER_SPAWN_HEIGHT_OFFSET
} = {}) {
  const candidate = authoredMapSource?.getSpawnPoint?.(regionId)
    ?? authoredMapSource?.getSpawnPoint?.()
    ?? fallback;
  const spawn = isFinitePointXZ(candidate) ? candidate : fallback;
  const groundY = sampleGroundHeight(heightAt, spawn);
  const baseY = groundY ?? (Number.isFinite(spawn.y) ? spawn.y : fallback.y);

  return Object.freeze({
    x: spawn.x,
    y: baseY + heightOffset,
    z: spawn.z,
    groundY: baseY
  });
}

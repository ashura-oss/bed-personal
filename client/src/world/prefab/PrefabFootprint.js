import { lerp, smootherstep } from "../gen/Rng.js";

/**
 * Pure prefab footprint helpers.
 *
 * A prefab is fully flat through its inner pad, then smoothly releases back
 * into procedural terrain across the blend band. Everything is sampled in
 * world-space, so terrain chunks agree on shared edges even when generated in
 * different frames.
 */

export function prefabInfluenceAt(worldX, worldZ, prefab) {
  const radius = Math.max(0, prefab.footprintRadius ?? 0);
  const blendRadius = Math.max(0, prefab.blendRadius ?? 0);
  const innerRadius = Math.max(0, radius - blendRadius);
  const dx = worldX - prefab.origin.x;
  const dz = worldZ - prefab.origin.z;
  const distance = Math.hypot(dx, dz);

  if (distance <= innerRadius) return 1;
  if (distance >= radius || blendRadius === 0) return 0;

  const t = (distance - innerRadius) / blendRadius;
  return 1 - smootherstep(t);
}

export function samplePrefabInfluence(worldX, worldZ, prefabSource) {
  const prefabs = getPrefabFootprints(prefabSource);
  let best = null;
  let bestInfluence = 0;

  for (const prefab of prefabs) {
    const influence = prefabInfluenceAt(worldX, worldZ, prefab);
    if (influence > bestInfluence) {
      best = prefab;
      bestInfluence = influence;
    }
  }

  return {
    prefab: best,
    influence: bestInfluence
  };
}

export function applyPrefabHeightBlend(baseHeight, worldX, worldZ, prefabSource) {
  const { prefab, influence } = samplePrefabInfluence(worldX, worldZ, prefabSource);

  if (!prefab || influence <= 0) {
    return baseHeight;
  }

  return lerp(baseHeight, prefab.padHeight, influence);
}

export function getPrefabFootprints(prefabSource) {
  if (!prefabSource) return [];

  if (Array.isArray(prefabSource)) {
    return prefabSource;
  }

  if (typeof prefabSource.getFootprints === "function") {
    return prefabSource.getFootprints();
  }

  if (typeof prefabSource.getPrefabAnchors === "function") {
    return prefabSource.getPrefabAnchors();
  }

  if (typeof prefabSource.prefabs === "function") {
    return prefabSource.prefabs();
  }

  return [];
}

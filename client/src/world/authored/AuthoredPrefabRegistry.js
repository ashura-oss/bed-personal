/**
 * AuthoredPrefabRegistry — WM-06
 *
 * Builds a set of prefab anchors from authored placement data rather than
 * procedural placement. Shares the same interface as PrefabRegistry so
 * PrefabLoader works unchanged.
 *
 * Does NOT import THREE — it is a pure data-lookup layer. The build functions
 * live in PrefabCatalogue.
 */

import { CHUNK_SIZE } from "../gen/WorldConfig.js";
import { getPrefabDef } from "./PrefabCatalogue.js";

export class AuthoredPrefabRegistry {
  constructor({ regionRegistry, heightSource = null, onInvalidPlacement = null, onWarning = console.warn }) {
    if (!regionRegistry || typeof regionRegistry.getRegions !== "function") {
      throw new TypeError("AuthoredPrefabRegistry requires a regionRegistry with getRegions().");
    }

    const reportInvalidPlacement = createInvalidPlacementReporter(onInvalidPlacement, onWarning);
    this.anchors = Object.freeze(buildAnchors(regionRegistry, heightSource, reportInvalidPlacement));
    Object.freeze(this);
  }

  getPrefabAnchors() {
    return this.anchors;
  }

  getFootprints() {
    return this.anchors;
  }

  getAnchorById(id) {
    return this.anchors.find((a) => a.id === id) ?? null;
  }

  getPlacementsOverlappingChunk(cx, cz) {
    return this.anchors.filter((a) => doesOverlapChunk(a, cx, cz));
  }
}

// ── Internals ─────────────────────────────────────────────────────────────────

/**
 * Iterates all regions in the registry, collects prefab-type placements,
 * resolves each against PrefabCatalogue, and returns the assembled anchor array.
 *
 * @param {object} regionRegistry
 * @param {object|null} heightSource - function or object height source
 * @param {Function|null} reportInvalidPlacement
 * @returns {Array<object>}
 */
function buildAnchors(regionRegistry, heightSource, reportInvalidPlacement) {
  const anchors = [];

  for (const region of regionRegistry.getRegions()) {
    const placements = region.placements;
    if (!Array.isArray(placements)) continue;

    for (const placement of placements) {
      if (placement.type !== "prefab") continue;

      const tag = readPrefabTag(placement, reportInvalidPlacement);
      if (!tag) continue;

      const prefabDef = getPrefabDef(tag);
      if (!prefabDef) {
        reportInvalidPrefabPlacement(reportInvalidPlacement, placement, tag, "unknown-prefab-tag");
        continue;
      }

      const ox = placement.origin.x;
      const oz = placement.origin.z;
      const sampledY = sampleHeightAt(heightSource, ox, oz);
      const oy = Number.isFinite(sampledY) ? sampledY : placement.origin.y;

      anchors.push(Object.freeze({
        ...prefabDef,
        placementId: placement.id ?? null,
        placementTags: Object.freeze(Array.isArray(placement.tags) ? placement.tags.slice() : []),
        placement,
        origin: Object.freeze({ x: ox, y: oy, z: oz }),
        padHeight: oy,
        biomeId: region.biome?.id ?? null
      }));
    }
  }

  return anchors;
}

function createInvalidPlacementReporter(onInvalidPlacement, onWarning) {
  if (typeof onInvalidPlacement === "function") {
    return onInvalidPlacement;
  }

  if (typeof onWarning === "function") {
    return (diagnostic) => {
      onWarning(formatInvalidPlacementWarning(diagnostic), diagnostic);
    };
  }

  return null;
}

function readPrefabTag(placement, reportInvalidPlacement) {
  const tags = placement.tags;

  if (!Array.isArray(tags) || tags.length === 0) {
    reportInvalidPrefabPlacement(reportInvalidPlacement, placement, null, "missing-prefab-tag");
    return null;
  }

  const tag = tags[0];
  if (typeof tag !== "string") {
    reportInvalidPrefabPlacement(reportInvalidPlacement, placement, tag, "malformed-prefab-tag");
    return null;
  }

  if (tag.trim().length === 0) {
    reportInvalidPrefabPlacement(reportInvalidPlacement, placement, tag, "empty-prefab-tag");
    return null;
  }

  return tag.trim();
}

function reportInvalidPrefabPlacement(reportInvalidPlacement, placement, tag, reason) {
  if (!reportInvalidPlacement) return;

  reportInvalidPlacement(Object.freeze({
    reason,
    placementId: placement.id ?? null,
    tag,
    placement
  }));
}

function formatInvalidPlacementWarning({ reason, placementId, tag }) {
  const idLabel = formatDiagnosticValue(placementId);
  const tagLabel = formatDiagnosticValue(tag);
  return `[AuthoredPrefabRegistry] Skipping authored prefab placement id="${idLabel}" tag="${tagLabel}": ${reason}`;
}

function formatDiagnosticValue(value) {
  if (value === null || value === undefined) return "<missing>";
  return String(value);
}

function sampleHeightAt(heightSource, worldX, worldZ) {
  if (typeof heightSource === "function") {
    return heightSource(worldX, worldZ);
  }

  if (heightSource && typeof heightSource.getHeightAt === "function") {
    return heightSource.getHeightAt(worldX, worldZ);
  }

  if (heightSource && typeof heightSource.heightAt === "function") {
    return heightSource.heightAt(worldX, worldZ);
  }

  if (heightSource && typeof heightSource.sampleHeight === "function") {
    return heightSource.sampleHeight(worldX, worldZ);
  }

  return null;
}

/**
 * AABB + radius overlap test — identical logic to PrefabRegistry.
 *
 * @param {object} anchor - anchor with origin.x/z and footprintRadius
 * @param {number} cx - chunk X index
 * @param {number} cz - chunk Z index
 * @returns {boolean}
 */
function doesOverlapChunk(anchor, cx, cz) {
  const minX = cx * CHUNK_SIZE;
  const minZ = cz * CHUNK_SIZE;
  const maxX = minX + CHUNK_SIZE;
  const maxZ = minZ + CHUNK_SIZE;
  const closestX = Math.min(maxX, Math.max(minX, anchor.origin.x));
  const closestZ = Math.min(maxZ, Math.max(minZ, anchor.origin.z));
  const dx = closestX - anchor.origin.x;
  const dz = closestZ - anchor.origin.z;
  return dx * dx + dz * dz <= anchor.footprintRadius * anchor.footprintRadius;
}

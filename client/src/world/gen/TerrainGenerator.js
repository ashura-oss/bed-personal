import * as THREE from "three";
import { CHUNK_SEGS, CHUNK_SIZE } from "./WorldConfig.js";
import { resolveBiomeAt, terrainHeightAt, terrainSampleAt } from "./heightField.js";

/**
 * Result of generating one chunk's terrain.
 *
 * `geometry` is the visual mesh (local space, origin at the chunk centre).
 * `colliderVertices` / `colliderIndices` are the SAME triangles, fed to a
 * Rapier trimesh collider — so collision geometry is identical to what the
 * player sees. This is the deliberate choice that eliminates the entire class
 * of "visual terrain and physics terrain disagree" fall-through bugs.
 */

/**
 * TerrainGenerator — turns a seed + chunk coordinate into terrain.
 *
 * `heightAt` is sampled in WORLD space, so two chunks sharing an edge compute
 * identical heights at the shared vertices — seamless, deterministic.
 */
export class TerrainGenerator {
  constructor(seed, options = {}) {
    this.seed = seed;
    this.biomeSource = options.biomeSource ?? null;
    this.prefabSource = options.prefabSource ?? null;
    this.heightSource = options.heightSource ?? null;
  }

  /** World-space terrain height at any point. The single source of truth. */
  heightAt(worldX, worldZ) {
    return terrainHeightAt(worldX, worldZ, this.seed, this.biomeSource, this.prefabSource, this.heightSource);
  }

  biomeAt(worldX, worldZ) {
    return resolveBiomeAt(worldX, worldZ, this.biomeSource);
  }

  /**
   * Build the visual geometry + collider arrays for chunk (cx, cz).
   * Vertices are in local space relative to the chunk centre; the caller
   * positions the mesh and physics body at (centerX, 0, centerZ).
   */
  generateChunk(cx, cz) {
    const segs = CHUNK_SEGS;
    const size = CHUNK_SIZE;
    const vertsPerSide = segs + 1;
    const vertexCount = vertsPerSide * vertsPerSide;
    const centerX = (cx + 0.5) * size;
    const centerZ = (cz + 0.5) * size;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const paletteCache = new Map();
    const vertexColor = new THREE.Color();
    const centerBiome = this.biomeAt(centerX, centerZ);

    // Fill vertices. iz -> z axis, ix -> x axis.
    let pointer = 0;

    for (let iz = 0; iz <= segs; iz += 1) {
      const localZ = (iz / segs - 0.5) * size;
      const worldZ = centerZ + localZ;

      for (let ix = 0; ix <= segs; ix += 1) {
        const localX = (ix / segs - 0.5) * size;
        const worldX = centerX + localX;
        const sample = terrainSampleAt(
          worldX,
          worldZ,
          this.seed,
          this.biomeSource,
          this.prefabSource,
          this.heightSource
        );
        const y = sample.height;

        positions[pointer] = localX;
        positions[pointer + 1] = y;
        positions[pointer + 2] = localZ;
        getTerrainColor(sample, paletteCache, vertexColor);
        colors[pointer] = vertexColor.r;
        colors[pointer + 1] = vertexColor.g;
        colors[pointer + 2] = vertexColor.b;
        pointer += 3;
      }
    }

    // Build indices: two up-facing triangles per cell.
    const cellCount = segs * segs;
    const indices = new Uint32Array(cellCount * 6);
    let triangle = 0;

    for (let iz = 0; iz < segs; iz += 1) {
      for (let ix = 0; ix < segs; ix += 1) {
        const a = iz * vertsPerSide + ix;
        const b = iz * vertsPerSide + (ix + 1);
        const c = (iz + 1) * vertsPerSide + ix;
        const d = (iz + 1) * vertsPerSide + (ix + 1);

        // up-facing winding (normal +Y)
        indices[triangle] = a;
        indices[triangle + 1] = c;
        indices[triangle + 2] = b;
        indices[triangle + 3] = b;
        indices[triangle + 4] = c;
        indices[triangle + 5] = d;
        triangle += 6;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    // Collider uses a copy of the exact same triangles.
    const colliderVertices = positions.slice();
    const colliderIndices = indices.slice();

    return {
      geometry,
      colliderVertices,
      colliderIndices,
      centerX,
      centerZ,
      centerBiome
    };
  }
}

function getTerrainColor(sample, paletteCache, targetColor) {
  const { biome, normalizedHeight } = sample;
  const paletteKey = `${biome.key}:${biome.palette.low}:${biome.palette.high}`;
  let palette = paletteCache.get(paletteKey);

  if (!palette) {
    palette = {
      low: new THREE.Color(biome.palette.low),
      high: new THREE.Color(biome.palette.high)
    };
    paletteCache.set(paletteKey, palette);
  }

  const blend = THREE.MathUtils.smoothstep(normalizedHeight, 0.16, 0.9);
  return targetColor.copy(palette.low).lerp(palette.high, blend);
}

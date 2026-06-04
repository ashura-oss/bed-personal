import * as THREE from "three";
import { CHUNK_SEGS, CHUNK_SIZE } from "./WorldConfig.js";
import { terrainHeightAt } from "./heightField.js";

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
  constructor(seed) {
    this.seed = seed;
  }

  /** World-space terrain height at any point. The single source of truth. */
  heightAt(worldX, worldZ) {
    return terrainHeightAt(worldX, worldZ, this.seed);
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

    // Fill vertices. iz -> z axis, ix -> x axis.
    let pointer = 0;

    for (let iz = 0; iz <= segs; iz += 1) {
      const localZ = (iz / segs - 0.5) * size;
      const worldZ = centerZ + localZ;

      for (let ix = 0; ix <= segs; ix += 1) {
        const localX = (ix / segs - 0.5) * size;
        const worldX = centerX + localX;
        const y = this.heightAt(worldX, worldZ);

        positions[pointer] = localX;
        positions[pointer + 1] = y;
        positions[pointer + 2] = localZ;
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
      centerZ
    };
  }
}

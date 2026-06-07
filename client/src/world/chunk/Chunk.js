import * as THREE from "three";

/** Convert chunk coordinates to a stable map key. */
export function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

/**
 * Chunk — one tile of the procedural world.
 *
 * Owns its visual mesh and a static Rapier trimesh collider built from the
 * exact same triangles. The material is SHARED across chunks (passed in) so
 * it is not disposed here — the ChunkManager owns its lifecycle.
 */
export class Chunk {
  constructor(scene, rapier, generator, material, cx, cz) {
    this.scene = scene;
    this.rapier = rapier;
    this.cx = cx;
    this.cz = cz;
    this.key = chunkKey(cx, cz);

    const terrain = generator.generateChunk(cx, cz);

    // Visual mesh
    this.mesh = new THREE.Mesh(terrain.geometry, material);
    this.mesh.name = `chunk-${this.key}`;
    this.mesh.position.set(terrain.centerX, 0, terrain.centerZ);
    this.mesh.userData.biome = terrain.centerBiome;
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false; // terrain receives but does not cast (perf)
    scene.add(this.mesh);

    // Physics trimesh (same triangles as the mesh)
    const bodyDesc = this.rapier.module.RigidBodyDesc.fixed().setTranslation(terrain.centerX, 0, terrain.centerZ);
    this.body = this.rapier.world.createRigidBody(bodyDesc);
    const colliderDesc = this.rapier.module.ColliderDesc.trimesh(terrain.colliderVertices, terrain.colliderIndices);
    this.rapier.world.createCollider(colliderDesc, this.body);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    // Material is shared and owned by ChunkManager — do not dispose here.
    // Removing the rigid body also removes its attached colliders.
    this.rapier.world.removeRigidBody(this.body);
  }
}

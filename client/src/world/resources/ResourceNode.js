import * as THREE from "three";

/**
 * ResourceNode — a single harvestable node in the world.
 *
 * Greybox: BoxGeometry for wood, SphereGeometry for ore, CylinderGeometry
 * for herb (and all other types). No textures, no loaded assets.
 *
 * Owns its own Rapier fixed-cuboid collider so the player's kinematic character
 * controller is blocked by it (and it can be cleaned up on unload without a
 * separate collider-registry).
 */

const DEPLETED_OPACITY = 0.25;
const INTERACT_HALF_EXTENTS = { x: 0.5, y: 0.8, z: 0.5 };

let _nextNodeId = 1;

function buildGeometry(meshType) {
  switch (meshType) {
    case "box":
      return new THREE.BoxGeometry(0.6, 1.6, 0.6);
    case "sphere":
      return new THREE.SphereGeometry(0.55, 8, 6);
    case "cylinder":
      return new THREE.CylinderGeometry(0.18, 0.22, 0.7, 7);
    default:
      return new THREE.BoxGeometry(0.6, 1.2, 0.6);
  }
}

export class ResourceNode {
  constructor({ scene, rapier, worldX, worldZ, heightAt, definition }) {
    this._id = _nextNodeId;
    _nextNodeId += 1;

    this._scene = scene;
    this._rapier = rapier;
    this._definition = definition;
    this._hitsRemaining = definition.hitPoints;
    this._depleted = false;

    // ── Visual mesh ────────────────────────────────────────────────────────
    const y = heightAt(worldX, worldZ);
    const geometry = buildGeometry(definition.meshType);
    const material = new THREE.MeshStandardMaterial({
      color: definition.meshColor,
      roughness: 0.88,
      metalness: 0.04,
      transparent: true,
      opacity: 1
    });
    this._mesh = new THREE.Mesh(geometry, material);

    // Centre the mesh so its base sits on the terrain surface
    const halfH = geometry.parameters
      ? (geometry.parameters.height ?? geometry.parameters.radius ?? 0.6)
      : 0.6;
    this._mesh.position.set(worldX, y + halfH / 2, worldZ);
    this._mesh.castShadow = true;
    this._mesh.receiveShadow = false;
    scene.add(this._mesh);

    // ── Physics collider ──────────────────────────────────────────────────
    const bodyDesc = rapier.module.RigidBodyDesc.fixed()
      .setTranslation(worldX, y + INTERACT_HALF_EXTENTS.y, worldZ);
    this._body = rapier.world.createRigidBody(bodyDesc);
    const colliderDesc = rapier.module.ColliderDesc.cuboid(
      INTERACT_HALF_EXTENTS.x,
      INTERACT_HALF_EXTENTS.y,
      INTERACT_HALF_EXTENTS.z
    );
    this._collider = rapier.world.createCollider(colliderDesc, this._body);

    this._worldX = worldX;
    this._worldZ = worldZ;
    this._worldY = y;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Apply one harvest hit.
   * Returns `{ itemId, count }` on success, `null` when already depleted.
   */
  harvest() {
    if (this._depleted) return null;

    this._hitsRemaining -= 1;

    if (this._hitsRemaining <= 0) {
      this._hitsRemaining = 0;
      this._depleted = true;
      this._mesh.material.opacity = DEPLETED_OPACITY;
      // Disable the collider so the player can walk through the stump
      this._collider.setSensor(true);
    }

    return { itemId: this._definition.yield.itemId, count: this._definition.yield.count };
  }

  /**
   * Restore the node to its full state (called on Hearthlight rest).
   */
  respawn() {
    this._hitsRemaining = this._definition.hitPoints;
    this._depleted = false;
    this._mesh.material.opacity = 1;
    this._collider.setSensor(false);
  }

  /**
   * Remove the mesh from the scene and free the physics body.
   * Must be called when the owning chunk is unloaded.
   */
  dispose() {
    this._scene.remove(this._mesh);
    this._mesh.geometry.dispose();
    this._mesh.material.dispose();
    this._rapier.world.removeRigidBody(this._body);
  }

  get id() {
    return this._id;
  }

  get position() {
    return { x: this._worldX, y: this._worldY, z: this._worldZ };
  }

  get isDepleted() {
    return this._depleted;
  }

  get definition() {
    return this._definition;
  }
}

import { createResourceNodeVisual, setObjectOpacity } from "../art/HearthmereArtKit.js";

/**
 * ResourceNode — a single harvestable node in the world.
 *
 * Owns its own Rapier fixed-cuboid collider so the player's kinematic character
 * controller is blocked by it (and it can be cleaned up on unload without a
 * separate collider-registry).
 */

const DEPLETED_OPACITY = 0.25;
const INTERACT_HALF_EXTENTS = { x: 0.5, y: 0.8, z: 0.5 };

let _nextNodeId = 1;

export class ResourceNode {
  constructor({ scene, rapier, worldX, worldZ, heightAt, definition }) {
    this._id = _nextNodeId;
    _nextNodeId += 1;

    this._scene = scene;
    this._rapier = rapier;
    this._definition = definition;
    this._hitsRemaining = definition.hitPoints;
    this._depleted = false;

    // ── Generated visual ───────────────────────────────────────────────────
    const y = heightAt(worldX, worldZ);
    this._visual = createResourceNodeVisual(definition);
    this._visualRoot = this._visual.root;
    this._visualRoot.position.set(worldX, y, worldZ);
    scene.add(this._visualRoot);

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
      setObjectOpacity(this._visualRoot, DEPLETED_OPACITY);
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
    setObjectOpacity(this._visualRoot, 1);
    this._collider.setSensor(false);
  }

  /**
   * Remove the mesh from the scene and free the physics body.
   * Must be called when the owning chunk is unloaded.
   */
  dispose() {
    this._scene.remove(this._visualRoot);
    this._visual.dispose();
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

import { ResourceNode } from "../../world/resources/ResourceNode.js";
import { Action } from "../../controls/InputMap.js";

/**
 * GatheringSystem — player interact → harvest loop.
 *
 * Gameplay layer only. Never imports anything from `ui/`.
 * Communicates with the UI exclusively through UIBus events.
 *
 * UIBus events emitted:
 *   "gathering:harvested"   { itemId, count, nodeDef }
 *   "gathering:depleted"    { nodeId }
 *   "gathering:node_nearby" { nodeId, definition }
 *   "gathering:node_left"   { nodeId }
 */

const INTERACT_RADIUS = 3;       // world units
const FACING_DOT_MIN = 0.0;      // player must face within 90° of the node

export class GatheringSystem {
  /**
   * @param {{ scene, rapier, world, resourceScatter, chunkManager, uiBus }} opts
   */
  constructor({ scene, rapier, resourceScatter, chunkManager, uiBus }) {
    this._scene = scene;
    this._rapier = rapier;
    this._scatter = resourceScatter;
    this._chunkManager = chunkManager;
    this._uiBus = uiBus;

    // Map<string chunkKey, ResourceNode[]>
    this._nodesByChunk = new Map();
    // Track the node the player is currently hovering
    this._nearbyNodeId = null;
  }

  // ── Chunk lifecycle ───────────────────────────────────────────────────────

  /**
   * Spawn resource nodes for a freshly-loaded chunk.
   * Called by ChunkManager after a chunk is built.
   *
   * @param {number} chunkX
   * @param {number} chunkZ
   * @param {string} biomeId
   * @param {function} heightAt  — (x,z) => number
   */
  spawnNodesForChunk(chunkX, chunkZ, biomeId, heightAt) {
    const key = `${chunkX},${chunkZ}`;
    if (this._nodesByChunk.has(key)) return; // already spawned

    const placements = this._scatter.getNodesForChunk(chunkX, chunkZ, biomeId, heightAt);
    const nodes = placements.map((placement) =>
      new ResourceNode({
        scene: this._scene,
        rapier: this._rapier,
        worldX: placement.worldX,
        worldZ: placement.worldZ,
        heightAt,
        definition: placement.definition
      })
    );

    this._nodesByChunk.set(key, nodes);
  }

  /**
   * Remove and dispose all nodes for an unloading chunk.
   * Called by ChunkManager before a chunk is removed.
   *
   * @param {number} chunkX
   * @param {number} chunkZ
   */
  despawnNodesForChunk(chunkX, chunkZ) {
    const key = `${chunkX},${chunkZ}`;
    const nodes = this._nodesByChunk.get(key);
    if (!nodes) return;

    for (const node of nodes) {
      node.dispose();
    }

    this._nodesByChunk.delete(key);
  }

  // ── Per-frame update ──────────────────────────────────────────────────────

  /**
   * Scan for the nearest in-front node, emit proximity events, and handle
   * the interact key press.
   *
   * @param {{ x: number, y: number, z: number }} playerPosition
   * @param {{ x: number, y: number, z: number }} playerFacing  — normalised
   * @param {object} inputMap  — InputMap instance (isJustPressed)
   */
  update(playerPosition, playerFacing, inputMap) {
    const px = playerPosition.x;
    const pz = playerPosition.z;
    const r2 = INTERACT_RADIUS * INTERACT_RADIUS;

    let closest = null;
    let closestDist2 = Infinity;

    for (const nodes of this._nodesByChunk.values()) {
      for (const node of nodes) {
        const { x: nx, z: nz } = node.position;
        const dx = nx - px;
        const dz = nz - pz;
        const dist2 = dx * dx + dz * dz;

        if (dist2 > r2) continue;

        // Dot-product facing check (ignore Y component)
        const len = Math.sqrt(dist2) || 1;
        const dot = (dx / len) * playerFacing.x + (dz / len) * playerFacing.z;
        if (dot < FACING_DOT_MIN) continue;

        if (dist2 < closestDist2) {
          closestDist2 = dist2;
          closest = node;
        }
      }
    }

    // Emit proximity change events
    const newNearbyId = closest ? closest.id : null;
    if (newNearbyId !== this._nearbyNodeId) {
      if (this._nearbyNodeId !== null) {
        this._uiBus.emit("gathering:node_left", { nodeId: this._nearbyNodeId });
      }
      if (closest !== null) {
        this._uiBus.emit("gathering:node_nearby", {
          nodeId: closest.id,
          definition: closest.definition
        });
      }
      this._nearbyNodeId = newNearbyId;
    }

    // Handle harvest
    if (closest && inputMap.isJustPressed(Action.Interact)) {
      const result = closest.harvest();
      if (result) {
        this._uiBus.emit("gathering:harvested", {
          itemId: result.itemId,
          count: result.count,
          nodeDef: closest.definition
        });
      }
      if (closest.isDepleted) {
        this._uiBus.emit("gathering:depleted", { nodeId: closest.id });
      }
    }
  }

  // ── Hearthlight rest ──────────────────────────────────────────────────────

  /**
   * Reset all depleted nodes across all loaded chunks.
   * Called by Hearthlight on rest.
   */
  respawnAll() {
    for (const nodes of this._nodesByChunk.values()) {
      for (const node of nodes) {
        if (node.isDepleted) {
          node.respawn();
        }
      }
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  dispose() {
    for (const [key] of this._nodesByChunk.entries()) {
      const [cx, cz] = key.split(",").map(Number);
      this.despawnNodesForChunk(cx, cz);
    }
  }
}

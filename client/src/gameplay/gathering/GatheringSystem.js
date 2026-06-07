import { ResourceNode } from "../../world/resources/ResourceNode.js";
import { getResourceDefinitionForPlacementTags } from "../../world/resources/ResourceDefinitions.js";
import { Action } from "../../controls/InputMap.js";

/**
 * GatheringSystem — player interact → harvest loop.
 *
 * Gameplay layer only. Never imports anything from `ui/`.
 * Communicates with the UI exclusively through UIBus events.
 *
 * UIBus events emitted:
 *   "gathering:harvested"   { itemId, count, nodeDef }
 *   "gathering:depleted"    { nodeId, depletionKey }
 *   "gathering:node_nearby" { nodeId, definition }
 *   "gathering:node_left"   { nodeId }
 */

const INTERACT_RADIUS = 3;       // world units
const FACING_DOT_MIN = 0.0;      // player must face within 90° of the node

function normalizeHarvestYield(definition) {
  const yieldDef = definition?.yield;
  const itemId = typeof yieldDef?.itemId === "string" ? yieldDef.itemId.trim() : "";
  const count = Number.isInteger(yieldDef?.count) ? yieldDef.count : 0;

  if (!itemId || count <= 0) {
    return null;
  }

  return { itemId, count };
}

export class GatheringSystem {
  /**
   * @param {{ scene, rapier, resourceScatter, placementSource?: object, chunkManager?: object, uiBus: object, canAcceptHarvest?: function }} opts
   */
  constructor({
    scene,
    rapier,
    resourceScatter,
    placementSource = null,
    chunkManager = null,
    uiBus,
    canAcceptHarvest = null
  }) {
    this._scene = scene;
    this._rapier = rapier;
    this._scatter = resourceScatter;
    this._placementSource = placementSource;
    this._chunkManager = chunkManager;
    this._uiBus = uiBus;
    this._canAcceptHarvest = typeof canAcceptHarvest === "function"
      ? canAcceptHarvest
      : () => true;

    // Map<string chunkKey, ResourceNode[]>
    this._nodesByChunk = new Map();
    // Map<number nodeId, string depletionKey>
    this._depletionKeysByNodeId = new Map();
    // Set<string depletionKey>
    this._persistedDepletedNodes = new Set();
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

    const placements = this._getNodesForChunk(chunkX, chunkZ, biomeId, heightAt);
    const nodes = placements.map((placement, index) => {
      const node = new ResourceNode({
        scene: this._scene,
        rapier: this._rapier,
        worldX: placement.worldX,
        worldZ: placement.worldZ,
        heightAt,
        definition: placement.definition
      });
      const depletionKey = this._buildDepletionKey(chunkX, chunkZ, placement, index);
      this._depletionKeysByNodeId.set(node.id, depletionKey);
      if (this._persistedDepletedNodes.has(depletionKey)) {
        this._forceDepleteNode(node);
      }
      return node;
    });

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

    let nearbyNodeLeft = null;
    for (const node of nodes) {
      if (node.id === this._nearbyNodeId) nearbyNodeLeft = node.id;
      this._depletionKeysByNodeId.delete(node.id);
      node.dispose();
    }

    this._nodesByChunk.delete(key);

    if (nearbyNodeLeft !== null) {
      this._nearbyNodeId = null;
      this._uiBus.emit("gathering:node_left", { nodeId: nearbyNodeLeft });
    }
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
        if (node.isDepleted) continue;

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
      const pendingYield = normalizeHarvestYield(closest.definition);
      if (!pendingYield) {
        return;
      }

      const pendingHarvest = {
        nodeId: closest.id,
        itemId: pendingYield.itemId,
        count: pendingYield.count,
        nodeDef: closest.definition
      };
      if (!this._canAcceptPendingHarvest(pendingHarvest)) {
        return;
      }

      const result = closest.harvest();
      if (result) {
        this._uiBus.emit("gathering:harvested", {
          itemId: result.itemId,
          count: result.count,
          nodeDef: closest.definition
        });
      }
      if (closest.isDepleted) {
        const depletionKey = this._depletionKeysByNodeId.get(closest.id);
        if (depletionKey) {
          this._persistedDepletedNodes.add(depletionKey);
        }
        this._uiBus.emit("gathering:depleted", { nodeId: closest.id, depletionKey });
        if (this._nearbyNodeId === closest.id) {
          this._nearbyNodeId = null;
          this._uiBus.emit("gathering:node_left", { nodeId: closest.id });
        }
      }
    }
  }

  // ── Resource depletion persistence ───────────────────────────────────────

  serializeDepletionSnapshot() {
    return {
      version: 1,
      depletedKeys: Array.from(this._persistedDepletedNodes).sort()
    };
  }

  restoreDepletionSnapshot(snapshot) {
    const depletedKeys = this._getSnapshotDepletionKeys(snapshot);
    if (depletedKeys === null) return;

    this._persistedDepletedNodes = new Set(depletedKeys);
    this._applyPersistedDepletionToLoadedNodes();
  }

  // ── Hearthlight rest ──────────────────────────────────────────────────────

  /**
   * Reset all depleted nodes across all loaded chunks.
   * Called by Hearthlight on rest.
   */
  respawnAll() {
    this._persistedDepletedNodes.clear();
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

  _buildDepletionKey(chunkX, chunkZ, placement, index) {
    if (placement.id) {
      return `${placement.id}:${placement.definition.id}:${placement.worldX}:${placement.worldZ}`;
    }

    return `${chunkX},${chunkZ}:${index}:${placement.definition.id}:${placement.worldX}:${placement.worldZ}`;
  }

  _canAcceptPendingHarvest(pendingHarvest) {
    try {
      return this._canAcceptHarvest(pendingHarvest) === true;
    } catch {
      return false;
    }
  }

  _forceDepleteNode(node) {
    while (!node.isDepleted) {
      node.harvest();
    }
  }

  _applyPersistedDepletionToLoadedNodes() {
    let nearbyNodeLeft = null;

    for (const nodes of this._nodesByChunk.values()) {
      for (const node of nodes) {
        const depletionKey = this._depletionKeysByNodeId.get(node.id);
        const shouldBeDepleted = depletionKey
          ? this._persistedDepletedNodes.has(depletionKey)
          : false;

        if (shouldBeDepleted) {
          if (!node.isDepleted) {
            this._forceDepleteNode(node);
          }
          if (node.id === this._nearbyNodeId) {
            nearbyNodeLeft = node.id;
          }
        } else if (node.isDepleted) {
          node.respawn();
        }
      }
    }

    if (nearbyNodeLeft !== null) {
      this._nearbyNodeId = null;
      this._uiBus.emit("gathering:node_left", { nodeId: nearbyNodeLeft });
    }
  }

  _getSnapshotDepletionKeys(snapshot) {
    const depletionKeys = Array.isArray(snapshot)
      ? snapshot
      : snapshot?.depletedKeys ?? snapshot?.depletedNodes;

    if (!Array.isArray(depletionKeys)) return null;

    return depletionKeys
      .filter((key) => typeof key === "string")
      .map((key) => key.trim())
      .filter((key) => key.length > 0);
  }

  _getNodesForChunk(chunkX, chunkZ, biomeId, heightAt) {
    if (this._placementSource) {
      return this._getAuthoredNodesForChunk(chunkX, chunkZ);
    }

    return this._scatter.getNodesForChunk(chunkX, chunkZ, biomeId, heightAt);
  }

  _getAuthoredNodesForChunk(chunkX, chunkZ) {
    const placements = this._getAuthoredResourcePlacements(chunkX, chunkZ);

    return placements
      .map((placement) => {
        const definition = getResourceDefinitionForPlacementTags(placement.tags);
        if (!definition) return null;

        return {
          id: placement.id,
          worldX: placement.origin.x,
          worldZ: placement.origin.z,
          definition
        };
      })
      .filter(Boolean);
  }

  _getAuthoredResourcePlacements(chunkX, chunkZ) {
    if (typeof this._placementSource?.getResourcesForChunk === "function") {
      return this._placementSource.getResourcesForChunk(chunkX, chunkZ);
    }

    if (typeof this._placementSource?.getPlacementsForChunk === "function") {
      return this._placementSource
        .getPlacementsForChunk(chunkX, chunkZ)
        .filter((placement) => placement.type === "resource");
    }

    return [];
  }
}

import { Action } from "../../controls/InputMap.js";
import { NpcController } from "./NpcController.js";
import { NpcVisual } from "./NpcVisual.js";
import { getNpcDefinition } from "./NpcDefinitions.js";

/**
 * NpcSpawner — chunk-lifecycle spawner for authored NPC placements.
 *
 * Mirrors GatheringSystem exactly:
 *   - spawnNpcsForChunk / despawnNpcsForChunk map to chunk load/unload.
 *   - Per-frame update() handles proximity scan, facing dot-product, and
 *     interact-key detection.
 *
 * Gameplay layer only. Never imports anything from `ui/`.
 * Communicates with the UI exclusively through UIBus events:
 *
 *   "npc:nearby"   { npcId, name }     — player entered interact range facing NPC
 *   "npc:left"     { npcId }           — player left range or NPC despawned
 *   "npc:interact" { npcId, name, dialogueId } — E pressed while nearby
 */

const INTERACT_RADIUS = 3.5;   // world units
const FACING_DOT_MIN  = 0.0;   // player must face within 90° of the NPC

export class NpcSpawner {
  /**
   * @param {{
   *   scene:           THREE.Scene,
   *   placementSource: { getPlacementsForChunk(cx:number, cz:number): object[] },
   *   uiBus:           { emit(event:string, data:object): void },
   *   heightAt:        (x:number, z:number) => number
   * }} opts
   */
  constructor({ scene, placementSource, uiBus, heightAt }) {
    this._scene = scene;
    this._placementSource = placementSource;
    this._uiBus = uiBus;
    this._heightAt = heightAt;

    // Map<chunkKey, Array<{ controller: NpcController, visual: NpcVisual }>>
    this._npcsByChunk = new Map();

    // Id of the NPC currently showing the "nearby" prompt (or null)
    this._nearbyNpcId = null;

    // Id of the NPC whose dialogue is currently open (set by interact, cleared by onDialogueEnded)
    this._activeDialogueNpcId = null;
  }

  // ── Chunk lifecycle ───────────────────────────────────────────────────────

  /**
   * Spawn NPCs for a freshly-loaded chunk.
   * Called by ChunkManager after a chunk is built.
   *
   * @param {number} cx
   * @param {number} cz
   */
  spawnNpcsForChunk(cx, cz) {
    const key = `${cx},${cz}`;
    if (this._npcsByChunk.has(key)) return;

    const placements = this._placementSource.getPlacementsForChunk(cx, cz);
    const npcs = [];

    for (const placement of placements) {
      if (placement.type !== "npc") continue;

      const tags = Array.isArray(placement.tags) ? placement.tags : [];
      const definition = getNpcDefinition(tags);
      const worldY = this._heightAt(placement.origin.x, placement.origin.z);

      const controller = new NpcController({
        id:         placement.id,
        key:        tags[0] ?? definition.key ?? "traveller",
        definition,
        worldX:     placement.origin.x,
        worldZ:     placement.origin.z,
        worldY
      });

      const visual = new NpcVisual({ scene: this._scene, npc: controller });

      npcs.push({ controller, visual });
    }

    this._npcsByChunk.set(key, npcs);
  }

  /**
   * Remove and dispose all NPCs for an unloading chunk.
   * Called by ChunkManager before a chunk is removed.
   *
   * @param {number} cx
   * @param {number} cz
   */
  despawnNpcsForChunk(cx, cz) {
    const key = `${cx},${cz}`;
    const npcs = this._npcsByChunk.get(key);
    if (!npcs) return;

    for (const { controller, visual } of npcs) {
      if (controller.id === this._nearbyNpcId) {
        this._nearbyNpcId = null;
        this._uiBus.emit("npc:left", { npcId: controller.id });
      }
      if (controller.id === this._activeDialogueNpcId) {
        this._activeDialogueNpcId = null;
        this._uiBus.emit("npc:dialogue_ended", { npcId: controller.id });
      }
      visual.dispose();
    }

    this._npcsByChunk.delete(key);
  }

  // ── Per-frame update ──────────────────────────────────────────────────────

  /**
   * Scan for the nearest in-front NPC, emit proximity events, and handle
   * the interact key press.
   *
   * @param {number} dt
   * @param {{ x: number, y: number, z: number }} playerPosition
   * @param {{ x: number, y: number, z: number }} playerFacing  — normalised
   * @param {object} inputMap  — InputMap instance
   */
  update(dt, playerPosition, playerFacing, inputMap) {
    const px = playerPosition.x;
    const pz = playerPosition.z;
    const r2 = INTERACT_RADIUS * INTERACT_RADIUS;

    let closest = null;
    let closestDist2 = Infinity;

    // Update all controllers + visuals, then proximity-scan
    for (const npcs of this._npcsByChunk.values()) {
      for (const { controller, visual } of npcs) {
        controller.update(dt, playerPosition);
        visual.update(dt);

        const dx = controller.position.x - px;
        const dz = controller.position.z - pz;
        const dist2 = dx * dx + dz * dz;

        if (dist2 > r2) continue;

        // Dot-product facing check
        const len = Math.sqrt(dist2) || 1;
        const dot = (dx / len) * playerFacing.x + (dz / len) * playerFacing.z;
        if (dot < FACING_DOT_MIN) continue;

        if (dist2 < closestDist2) {
          closestDist2 = dist2;
          closest = { controller, visual };
        }
      }
    }

    // Proximity change events + highlight
    const newNearbyId = closest ? closest.controller.id : null;

    if (newNearbyId !== this._nearbyNpcId) {
      // Un-highlight the previous nearby NPC
      if (this._nearbyNpcId !== null) {
        this._setHighlight(this._nearbyNpcId, false);
        this._uiBus.emit("npc:left", { npcId: this._nearbyNpcId });
      }

      if (closest !== null) {
        closest.visual.setHighlighted(true);
        this._uiBus.emit("npc:nearby", {
          npcId: closest.controller.id,
          name:  closest.controller.definition.name
        });
      }

      this._nearbyNpcId = newNearbyId;
    }

    // Interact key — only when nearby and no dialogue is active
    if (
      closest &&
      this._activeDialogueNpcId === null &&
      inputMap.isJustPressed(Action.Interact)
    ) {
      const def = closest.controller.definition;
      this._activeDialogueNpcId = closest.controller.id;
      this._uiBus.emit("npc:interact", {
        npcId:      closest.controller.id,
        name:       def.name,
        dialogueId: def.dialogueId
      });
    }
  }

  // ── Dialogue lifecycle ────────────────────────────────────────────────────

  /**
   * Clear the active dialogue lock so the NPC can be talked to again.
   * Called by the UI (Module 2) via the UIBus 'npc:dialogue_ended' event or
   * directly from main.js when the DialogueEngine completes.
   *
   * @param {string} npcId
   */
  onDialogueEnded(npcId) {
    if (this._activeDialogueNpcId === npcId) {
      this._activeDialogueNpcId = null;
    }
  }

  /** @returns {string|null} */
  get activeDialogueNpcId() {
    return this._activeDialogueNpcId;
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  dispose() {
    for (const [key] of this._npcsByChunk.entries()) {
      const [cx, cz] = key.split(",").map(Number);
      this.despawnNpcsForChunk(cx, cz);
    }
    this._npcsByChunk.clear();
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /** Find an NpcVisual by npcId across all chunks and toggle its highlight. */
  _setHighlight(npcId, on) {
    for (const npcs of this._npcsByChunk.values()) {
      for (const { controller, visual } of npcs) {
        if (controller.id === npcId) {
          visual.setHighlighted(on);
          return;
        }
      }
    }
  }
}

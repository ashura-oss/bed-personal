/**
 * NpcController — pure logic for a single NPC.
 *
 * No Three.js imports. Handles position and facing-toward-player behaviour.
 * The paired NpcVisual mirrors this controller's state each frame.
 */

/** World-unit radius within which the NPC turns to face the player. */
const FACE_RADIUS = 6;

export class NpcController {
  /**
   * @param {{
   *   id:         string,
   *   key:        string,
   *   definition: object,
   *   worldX:     number,
   *   worldZ:     number,
   *   worldY?:    number
   * }} opts
   */
  constructor({ id, key, definition, worldX, worldZ, worldY = 0 }) {
    this._id = id;
    this._key = key;
    this._definition = definition;
    this._position = { x: worldX, y: worldY, z: worldZ };
    this._facingAngle = 0; // radians, world-space Y-axis rotation
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** @returns {{ x: number, y: number, z: number }} */
  get position() {
    return this._position;
  }

  /** @returns {object} NPC definition from NpcDefinitions */
  get definition() {
    return this._definition;
  }

  /** @returns {string} */
  get id() {
    return this._id;
  }

  /** @returns {string} */
  get key() {
    return this._key;
  }

  /** Current Y-axis facing angle in radians. */
  get facingAngle() {
    return this._facingAngle;
  }

  /**
   * Per-frame update. If the player is within FACE_RADIUS, rotate to face them.
   *
   * @param {number} _dt - delta time (accepted for API consistency)
   * @param {{ x: number, y: number, z: number }} playerPosition
   */
  update(_dt, playerPosition) {
    const dx = playerPosition.x - this._position.x;
    const dz = playerPosition.z - this._position.z;
    const dist2 = dx * dx + dz * dz;

    if (dist2 <= FACE_RADIUS * FACE_RADIUS) {
      // atan2 gives the angle from +Z toward +X; Three.js Y-rotation convention
      this._facingAngle = Math.atan2(dx, dz);
    }
  }
}

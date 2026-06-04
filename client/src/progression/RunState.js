/**
 * RunState — lightweight run persistence via localStorage.
 *
 * Stores the minimal in-session state that must survive a page reload:
 * carried Embers, last Hearthlight position, flask charges, character id.
 *
 * Full character progression (XP, level, abilities) lives in the backend.
 * This layer only covers the transient "between reloads" state.
 *
 * Schema is versioned so future fields can be added safely.
 */
const STORAGE_KEY = "rf_run_v1";
const SCHEMA_VER = 1;
const DEFAULTS = {
  schemaVersion: SCHEMA_VER,
  embers: 0,
  flaskCharges: 4,
  lastHearthlightX: -5,
  lastHearthlightY: 0,
  lastHearthlightZ: 4
};

export class RunState {
  constructor() {
    this.data = null;
  }

  /** Load saved run state for `characterId`, or null if none / wrong schema. */
  load(characterId) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.data = null;
        return null;
      }

      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== SCHEMA_VER || parsed.characterId !== characterId) {
        this.data = null;
        return null;
      }

      this.data = parsed;
      return this.data;
    } catch {
      this.data = null;
      return null;
    }
  }

  /** Save current run state. */
  save(characterId, embers, flaskCharges, hearthlightPos) {
    this.data = {
      ...DEFAULTS,
      characterId,
      embers,
      flaskCharges,
      lastHearthlightX: hearthlightPos.x,
      lastHearthlightY: hearthlightPos.y,
      lastHearthlightZ: hearthlightPos.z,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  /** Clear run state (on logout or fresh start). */
  clear() {
    this.data = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  get current() {
    return this.data;
  }
}

export const runState = new RunState();

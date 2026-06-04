import { AppMode } from "./AppMode.js";

/**
 * Called after every legal transition.
 * `from` is the previous mode; `to` is the new current mode.
 */

/**
 * Legal transition map.
 * Only paths listed here are allowed; everything else throws TypeError.
 *
 * Boot      → Exploration          (startup complete)
 * Explore   → Combat|Cutscene|Menu|Loading
 * Combat    → Exploration          (encounter ends)
 * Cutscene  → Exploration          (cinematic ends)
 * Menu      → Exploration          (menu closed)
 * Loading   → Exploration          (zone ready)
 */
const LEGAL_TRANSITIONS = {
  [AppMode.Boot]: [AppMode.Exploration],
  [AppMode.Exploration]: [AppMode.Combat, AppMode.Cutscene, AppMode.Menu, AppMode.Loading],
  [AppMode.Combat]: [AppMode.Exploration],
  [AppMode.Cutscene]: [AppMode.Exploration],
  [AppMode.Menu]: [AppMode.Exploration],
  [AppMode.Loading]: [AppMode.Exploration]
};

/**
 * Modes in which free player movement and camera control are suppressed.
 * Systems call `ctx.isControlLocked()` rather than switch-casing on the mode.
 */
const CONTROL_LOCKED_MODES = new Set([
  AppMode.Combat,
  AppMode.Cutscene,
  AppMode.Menu,
  AppMode.Loading
]);

/**
 * GameContext — the application-wide mode state machine.
 *
 * Responsibilities:
 * - Track the current AppMode.
 * - Validate all transitions and throw on illegal paths.
 * - Notify registered listeners so the rest of the system can react
 *   (UIBus events, audio, input routing) without coupling to this class.
 *
 * Plain JS — no WebGL, no UIBus dependency.
 * That wiring happens in main.js via `onTransition()`.
 */
export class GameContext {
  constructor() {
    this.current = AppMode.Boot;
    this.listeners = [];
  }

  /** The current application mode. Read-only from outside. */
  get mode() {
    return this.current;
  }

  /**
   * Returns true when free player movement and camera input should be
   * ignored — i.e. during Combat, Cutscene, Menu, or Loading.
   */
  isControlLocked() {
    return CONTROL_LOCKED_MODES.has(this.current);
  }

  /**
   * Register a listener that fires after every successful transition.
   * Use this in main.js to bridge GameContext events to UIBus.
   */
  onTransition(listener) {
    this.listeners.push(listener);
  }

  /**
   * Attempt to transition to `to`.
   * Throws `TypeError` if the transition is not in the legal map for the
   * current mode — so callers know immediately when they mis-wire a trigger.
   */
  transition(to) {
    const legal = LEGAL_TRANSITIONS[this.current];
    if (!legal.includes(to)) {
      throw new TypeError(
        `Illegal AppMode transition: ${this.current} → ${to}. `
          + `Legal targets from "${this.current}": [${legal.join(", ")}]`
      );
    }

    const from = this.current;
    this.current = to;

    for (const listener of this.listeners) {
      listener(from, to);
    }
  }
}

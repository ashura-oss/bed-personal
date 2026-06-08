/**
 * InputMap — action-based, frame-safe input manager.
 *
 * Provides `isHeld` (continuous) and `isJustPressed` (one-shot per frame).
 * Call `flush()` at the END of each frame to reset just-pressed state.
 *
 * No UIBus dependency — pure DOM event listening.
 */

export const Action = Object.freeze({
  MoveForward: "MoveForward",
  MoveBack: "MoveBack",
  MoveLeft: "MoveLeft",
  MoveRight: "MoveRight",
  Sprint: "Sprint",
  Dodge: "Dodge",
  LightAttack: "LightAttack",
  HeavyAttack: "HeavyAttack",
  LockOn: "LockOn",
  UseFlask: "UseFlask",
  Interact: "Interact",
  AbilityQ: "AbilityQ",
  AbilityE: "AbilityE",
  AbilityR: "AbilityR",
  Inventory: "Inventory",
  QuestLog: "QuestLog",
  Minimap: "Minimap",
  Pause: "Pause"
});

const KEY_BINDINGS = {
  KeyW: Action.MoveForward,
  ArrowUp: Action.MoveForward,
  KeyS: Action.MoveBack,
  ArrowDown: Action.MoveBack,
  KeyA: Action.MoveLeft,
  ArrowLeft: Action.MoveLeft,
  KeyD: Action.MoveRight,
  ArrowRight: Action.MoveRight,
  ShiftLeft: Action.Sprint,
  ShiftRight: Action.Sprint,
  Space: Action.Dodge,
  KeyJ: Action.LightAttack,
  KeyK: Action.HeavyAttack,
  Tab: Action.LockOn,
  KeyF: Action.UseFlask,
  KeyQ: Action.AbilityQ,
  KeyE: Action.Interact,
  KeyR: Action.AbilityR,
  KeyI: Action.Inventory,
  KeyL: Action.QuestLog,
  KeyM: Action.Minimap,
  Escape: Action.Pause
};

const EXTRA_KEY_BINDINGS = {
  KeyE: Object.freeze([Action.AbilityE])
};

export function actionForKeyCode(code) {
  return KEY_BINDINGS[code] ?? null;
}

export function actionsForKeyCode(code) {
  const primary = actionForKeyCode(code);
  const extras = EXTRA_KEY_BINDINGS[code] ?? [];
  return Object.freeze(primary ? [primary, ...extras] : [...extras]);
}

export function isGameMouseInputTarget(target) {
  if (!target || typeof target.closest !== "function") return true;

  return !target.closest([
    "[data-game-input-blocker]",
    "button",
    "a",
    "input",
    "select",
    "textarea",
    "[role='button']"
  ].join(","));
}

export class InputMap {
  constructor() {
    this.held = new Set();
    this.justPressed = new Set();

    // Mouse buttons tracked separately (left = attack, right = heavy)
    this.mb0Down = false;
    this.mb0Just = false;
    this.mb2Down = false;
    this.mb2Just = false;

    this.onKeyDown = event => {
      const actions = actionsForKeyCode(event.code);
      if (actions.length === 0) return;

      // Prevent browser defaults (space = scroll, tab = focus trap, etc.)
      event.preventDefault();

      for (const action of actions) {
        if (!this.held.has(action)) {
          this.justPressed.add(action);
        }

        this.held.add(action);
      }
    };

    this.onKeyUp = event => {
      const actions = actionsForKeyCode(event.code);
      for (const action of actions) {
        this.held.delete(action);
      }
    };

    this.onMouseDown = event => {
      if (!isGameMouseInputTarget(event.target)) return;

      if (event.button === 0) {
        this.mb0Down = true;
        this.mb0Just = true;
      }

      if (event.button === 2) {
        this.mb2Down = true;
        this.mb2Just = true;
      }
    };

    this.onMouseUp = event => {
      if (event.button === 0) this.mb0Down = false;
      if (event.button === 2) this.mb2Down = false;
    };

    this.onContextMenu = event => {
      event.preventDefault();
    };

    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("contextmenu", this.onContextMenu, { passive: false });
  }

  /**
   * Call ONCE per frame AFTER reading all input.
   * Clears the just-pressed buffer so each action fires for exactly one frame.
   */
  flush() {
    this.justPressed.clear();
    this.mb0Just = false;
    this.mb2Just = false;
  }

  isHeld(action) {
    if (action === Action.LightAttack) return this.mb0Down || this.held.has(action);
    if (action === Action.HeavyAttack) return this.mb2Down || this.held.has(action);
    return this.held.has(action);
  }

  isJustPressed(action) {
    if (action === Action.LightAttack) return this.mb0Just || this.justPressed.has(action);
    if (action === Action.HeavyAttack) return this.mb2Just || this.justPressed.has(action);
    return this.justPressed.has(action);
  }

  /** Normalised movement axes from WASD / arrow keys. Each axis is -1, 0, or 1. */
  getAxes() {
    return {
      forward: (this.held.has(Action.MoveForward) ? 1 : 0) - (this.held.has(Action.MoveBack) ? 1 : 0),
      right: (this.held.has(Action.MoveRight) ? 1 : 0) - (this.held.has(Action.MoveLeft) ? 1 : 0)
    };
  }

  /** True if any movement key is held. */
  isMoving() {
    return this.held.has(Action.MoveForward)
      || this.held.has(Action.MoveBack)
      || this.held.has(Action.MoveLeft)
      || this.held.has(Action.MoveRight);
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("contextmenu", this.onContextMenu);
  }
}

// Pure helpers (no DOM, testable)

/**
 * Compute normalised move direction from raw axes.
 * Returns the zero vector when no input is active.
 */
export function axesToDirection(forward, right) {
  const length = Math.sqrt(forward * forward + right * right);

  if (length === 0) {
    return { x: 0, z: 0 };
  }

  // Add 0 to eliminate -0 from IEEE 754 division of negative zero
  return {
    x: right / length + 0,
    z: -forward / length + 0
  };
}

const DEFAULT_LETTERBOX_HEIGHT = 0.12;
const DEFAULT_FADE_COLOR = "#000000";

function clamp01(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, number));
}

function resolveDurationMilliseconds(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 250;
}

function resolveDurationSeconds(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number * 1000 : 250;
}

function resolveFadeOpacity(payload) {
  if (payload.clear === true) return 0;

  const direct = payload.opacity ?? payload.amount ?? payload.to;
  if (direct !== undefined) {
    return clamp01(direct, 1);
  }

  if (payload.direction === "in") {
    return 1 - clamp01(payload.progress, 0);
  }

  if (payload.direction === "out") {
    return clamp01(payload.progress, 1);
  }

  return 1;
}

/**
 * Letterbox — DOM-only cinematic overlay.
 *
 * Listens to UIBus events and renders:
 * - cinematic:letterbox  { active|visible, height|heightRatio }
 * - cinematic:fade       { active|visible, opacity, color, duration }
 * - cinematic:desaturate { active|visible, amount, duration }
 */
export class Letterbox {
  constructor(bus, options = {}) {
    if (!bus || typeof bus.on !== "function") {
      throw new TypeError("Letterbox: bus with on() is required");
    }

    const documentRef =
      options.document ?? (typeof document !== "undefined" ? document : null);

    if (!documentRef) {
      throw new Error("Letterbox: document is required");
    }

    this._bus = bus;
    this._document = documentRef;
    this._unsubs = [];
    this._state = {
      letterboxActive: false,
      letterboxHeight: DEFAULT_LETTERBOX_HEIGHT,
      fadeActive: false,
      fadeOpacity: 0,
      fadeColor: DEFAULT_FADE_COLOR,
      desaturateActive: false,
      desaturateAmount: 0
    };

    this._mount =
      options.mount ??
      this._document.getElementById("app") ??
      this._document.body;

    if (!this._mount) {
      throw new Error("Letterbox: mount element is required");
    }

    this._root = this._createDOM();
    this._mount.appendChild(this._root);
    this._render();
    this._bindUIBus();
  }

  dispose() {
    for (const unsub of this._unsubs) {
      unsub();
    }

    this._unsubs.length = 0;
    this._root.remove();
  }

  setLetterbox(payload = {}) {
    const active = payload.clear === true
      ? false
      : this._resolveActive(payload, payload.enter === undefined ? true : Boolean(payload.enter));
    const height = payload.heightRatio ?? payload.height ?? payload.size;

    this._state.letterboxActive = active;
    this._state.letterboxHeight = clamp01(height, DEFAULT_LETTERBOX_HEIGHT);
    this._render();
  }

  setFade(payload = {}) {
    const opacity = resolveFadeOpacity(payload);

    this._state.fadeActive = payload.clear === true ? false : this._resolveActive(payload, opacity > 0);
    this._state.fadeOpacity = this._state.fadeActive ? opacity : 0;
    this._state.fadeColor =
      typeof payload.color === "string" && payload.color.trim()
        ? payload.color
        : DEFAULT_FADE_COLOR;
    this._root.style.setProperty(
      "--cutscene-fade-duration",
      `${payload.ms === undefined
        ? resolveDurationSeconds(payload.duration)
        : resolveDurationMilliseconds(payload.ms)}ms`
    );
    this._render();
  }

  setDesaturate(payload = {}) {
    const amount = clamp01(payload.amount ?? payload.value ?? payload.to, 1);

    this._state.desaturateActive = payload.clear === true ? false : this._resolveActive(payload, amount > 0);
    this._state.desaturateAmount = this._state.desaturateActive ? amount : 0;
    this._root.style.setProperty(
      "--cutscene-desaturate-duration",
      `${payload.ms === undefined
        ? resolveDurationSeconds(payload.duration)
        : resolveDurationMilliseconds(payload.ms)}ms`
    );
    this._render();
  }

  _bindUIBus() {
    this._unsubs.push(
      this._bus.on("cinematic:letterbox", (payload) => {
        this.setLetterbox(payload ?? {});
      }),
      this._bus.on("cinematic:fade", (payload) => {
        this.setFade(payload ?? {});
      }),
      this._bus.on("cinematic:desaturate", (payload) => {
        this.setDesaturate(payload ?? {});
      })
    );
  }

  _resolveActive(payload, fallback = true) {
    if (typeof payload.active === "boolean") {
      return payload.active;
    }

    if (typeof payload.visible === "boolean") {
      return payload.visible;
    }

    if (typeof payload.enabled === "boolean") {
      return payload.enabled;
    }

    return fallback;
  }

  _render() {
    const {
      letterboxActive,
      letterboxHeight,
      fadeActive,
      fadeOpacity,
      fadeColor,
      desaturateActive,
      desaturateAmount
    } = this._state;
    const visible = letterboxActive || fadeActive || desaturateActive;

    this._root.classList.toggle("cutscene-letterbox-active", letterboxActive);
    this._root.classList.toggle("cutscene-fade-active", fadeActive);
    this._root.classList.toggle("cutscene-desaturate-active", desaturateActive);
    this._root.setAttribute("aria-hidden", String(!visible));
    this._root.dataset.letterboxActive = String(letterboxActive);
    this._root.dataset.fadeActive = String(fadeActive);
    this._root.dataset.desaturateActive = String(desaturateActive);
    this._root.style.setProperty(
      "--cutscene-letterbox-height",
      `${Math.round(letterboxHeight * 1000) / 10}vh`
    );
    this._root.style.setProperty("--cutscene-fade-opacity", String(fadeOpacity));
    this._root.style.setProperty("--cutscene-fade-color", fadeColor);
    this._root.style.setProperty("--cutscene-desaturate-amount", String(desaturateAmount));
  }

  _createDOM() {
    const root = this._document.createElement("div");
    root.id = "cutscene-letterbox";
    root.setAttribute("aria-hidden", "true");
    root.setAttribute("data-game-input-blocker", "true");
    root.innerHTML = `
      <div class="cutscene-desaturate-layer" aria-hidden="true"></div>
      <div class="cutscene-fade-layer" aria-hidden="true"></div>
      <div class="cutscene-bar cutscene-bar--top" aria-hidden="true"></div>
      <div class="cutscene-bar cutscene-bar--bottom" aria-hidden="true"></div>
    `;
    return root;
  }
}

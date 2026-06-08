const DEFAULT_PLACEMENT = "lower";
const VALID_PLACEMENTS = new Set(["lower", "center"]);

function normalizePlacement(value) {
  if (value === "middle") {
    return "center";
  }

  return VALID_PLACEMENTS.has(value) ? value : DEFAULT_PLACEMENT;
}

/**
 * SubtitleLine — DOM-only cinematic subtitle overlay.
 *
 * Listens to:
 * - subtitle:show { text, speaker, placement|position }
 * - subtitle:hide
 */
export class SubtitleLine {
  constructor(bus, options = {}) {
    if (!bus || typeof bus.on !== "function") {
      throw new TypeError("SubtitleLine: bus with on() is required");
    }

    const documentRef =
      options.document ?? (typeof document !== "undefined" ? document : null);

    if (!documentRef) {
      throw new Error("SubtitleLine: document is required");
    }

    this._bus = bus;
    this._document = documentRef;
    this._unsubs = [];
    this._visible = false;

    this._mount =
      options.mount ??
      this._document.getElementById("app") ??
      this._document.body;

    if (!this._mount) {
      throw new Error("SubtitleLine: mount element is required");
    }

    this._root = this._createDOM();
    this._textEl = this._requireWithin("[data-subtitle-text]");
    this._speakerEl = this._requireWithin("[data-subtitle-speaker]");
    this._mount.appendChild(this._root);
    this._bindUIBus();
  }

  get isVisible() {
    return this._visible;
  }

  show(payload = {}) {
    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    const speaker = typeof payload.speaker === "string" ? payload.speaker.trim() : "";
    const placement = normalizePlacement(payload.placement ?? payload.position);

    if (!text) {
      this.hide();
      return;
    }

    this._visible = true;
    this._textEl.textContent = text;
    this._speakerEl.textContent = speaker;
    this._speakerEl.hidden = speaker.length === 0;
    this._root.dataset.placement = placement;
    this._root.classList.add("subtitle-visible");
    this._root.setAttribute("aria-hidden", "false");
  }

  hide() {
    this._visible = false;
    this._root.classList.remove("subtitle-visible");
    this._root.setAttribute("aria-hidden", "true");
  }

  dispose() {
    for (const unsub of this._unsubs) {
      unsub();
    }

    this._unsubs.length = 0;
    this._root.remove();
  }

  _bindUIBus() {
    this._unsubs.push(
      this._bus.on("subtitle:show", (payload) => {
        this.show(payload ?? {});
      }),
      this._bus.on("subtitle:hide", () => {
        this.hide();
      })
    );
  }

  _requireWithin(selector) {
    const el = this._root.querySelector(selector);
    if (!el) {
      throw new Error(`SubtitleLine: missing element "${selector}"`);
    }

    return el;
  }

  _createDOM() {
    const root = this._document.createElement("section");
    root.id = "subtitle-line";
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-hidden", "true");
    root.setAttribute("data-placement", DEFAULT_PLACEMENT);
    root.setAttribute("data-game-input-blocker", "true");
    root.innerHTML = `
      <div class="subtitle-line__panel">
        <span class="subtitle-line__speaker" data-subtitle-speaker hidden></span>
        <span class="subtitle-line__text" data-subtitle-text></span>
      </div>
    `;
    return root;
  }
}

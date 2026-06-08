/**
 * OptionsMenu — Phase 5 accessibility + settings overlay.
 *
 * Persists preferences to localStorage under `rf_options`.
 * Settings drive CSS custom properties on `document.documentElement`
 * so they apply globally without requiring a restart.
 *
 * Options:
 * - UI scale (0.75 – 1.5)
 * - Reduced post-processing (disables bloom)
 * - Reduced screen shake
 * - Master volume (0 – 1)
 */
const STORAGE_KEY = "rf_options";
const DEFAULTS = {
  uiScale: 1,
  reducedPost: false,
  reducedShake: false,
  masterVolume: 0.65
};

export class OptionsMenu {
  constructor(container, audio, onClose) {
    this.isOpen = false;
    this.container = container;
    this.audioTargets = (Array.isArray(audio) ? audio : [audio])
      .filter((target) => typeof target?.setMasterVolume === "function");
    this.onClose = onClose;
    this.data = this.loadData();
    this.root = this.buildDOM();
    container.appendChild(this.root);
    this.applyAll();
  }

  open() {
    this.isOpen = true;
    this.root.classList.add("menu-open");
    this.root.setAttribute("aria-hidden", "false");
  }

  close() {
    this.isOpen = false;
    this.root.classList.remove("menu-open");
    this.root.setAttribute("aria-hidden", "true");
    this.saveData();
  }

  get isVisible() {
    return this.isOpen;
  }

  dispose() {
    this.root.remove();
  }

  loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULTS };
      }

      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    } catch {
      return { ...DEFAULTS };
    }
  }

  saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  applyAll() {
    const root = document.documentElement;
    root.style.setProperty("--rf-ui-scale", String(this.data.uiScale));
    root.style.setProperty("--rf-reduce-post", this.data.reducedPost ? "1" : "0");
    root.style.setProperty("--rf-reduce-shake", this.data.reducedShake ? "1" : "0");
    this.applyMasterVolume(this.data.masterVolume);
  }

  applyMasterVolume(value) {
    for (const target of this.audioTargets) {
      target.setMasterVolume(value);
    }
  }

  buildDOM() {
    const el = document.createElement("div");
    el.id = "options-menu";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Options");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="rf-panel options-panel">
        <p class="options-kicker">Warden's Measure</p>
        <h2 class="rf-title">FIELD OPTIONS</h2>

        <div class="options-section">
          <div class="options-section__title">Interface</div>
          <div class="options-row">
            <label class="options-label" for="opt-ui-scale">HUD Scale</label>
            <input type="range" id="opt-ui-scale" min="0.75" max="1.5" step="0.05"
              value="${this.data.uiScale}" class="options-slider" />
            <span class="options-value" id="val-ui-scale">${this.data.uiScale.toFixed(2)}x</span>
          </div>
        </div>

        <div class="options-section">
          <div class="options-section__title">Sound</div>
          <div class="options-row">
            <label class="options-label" for="opt-volume">Master Volume</label>
            <input type="range" id="opt-volume" min="0" max="1" step="0.05"
              value="${this.data.masterVolume}" class="options-slider" />
            <span class="options-value" id="val-volume">${Math.round(this.data.masterVolume * 100)}%</span>
          </div>
        </div>

        <div class="options-section">
          <div class="options-section__title">Field Conditions</div>
          <div class="options-row options-row--toggle">
            <label class="options-label" for="opt-reduce-post">Soften bloom</label>
            <input type="checkbox" id="opt-reduce-post" class="options-check"
              ${this.data.reducedPost ? "checked" : ""} />
          </div>
          <div class="options-row options-row--toggle">
            <label class="options-label" for="opt-reduce-shake">Dampen screen shake</label>
            <input type="checkbox" id="opt-reduce-shake" class="options-check"
              ${this.data.reducedShake ? "checked" : ""} />
          </div>
        </div>

        <div class="options-actions">
          <button class="login-btn" id="btn-options-close">Seal Settings</button>
        </div>
      </div>
    `;

    el.querySelector("#opt-ui-scale")?.addEventListener("input", (event) => {
      const value = Number.parseFloat(event.target.value);
      this.data.uiScale = value;

      const span = el.querySelector("#val-ui-scale");
      if (span) {
        span.textContent = `${value.toFixed(2)}x`;
      }

      document.documentElement.style.setProperty("--rf-ui-scale", String(value));
    });

    el.querySelector("#opt-volume")?.addEventListener("input", (event) => {
      const value = Number.parseFloat(event.target.value);
      this.data.masterVolume = value;

      const span = el.querySelector("#val-volume");
      if (span) {
        span.textContent = `${Math.round(value * 100)}%`;
      }

      this.applyMasterVolume(value);
    });

    el.querySelector("#opt-reduce-post")?.addEventListener("change", (event) => {
      this.data.reducedPost = event.target.checked;
      document.documentElement.style.setProperty(
        "--rf-reduce-post",
        this.data.reducedPost ? "1" : "0"
      );
    });

    el.querySelector("#opt-reduce-shake")?.addEventListener("change", (event) => {
      this.data.reducedShake = event.target.checked;
      document.documentElement.style.setProperty(
        "--rf-reduce-shake",
        this.data.reducedShake ? "1" : "0"
      );
    });

    el.querySelector("#btn-options-close")?.addEventListener("click", () => {
      this.close();
      this.onClose();
    });

    return el;
  }
}

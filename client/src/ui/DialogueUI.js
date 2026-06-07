/**
 * DialogueUI — HTML/CSS overlay for branching dialogue.
 *
 * Mirrors CraftingMenu pattern exactly:
 *   - Constructor: (bus, { mount })
 *   - Appends root element to mount
 *   - Listens: dialogue:open, dialogue:render, dialogue:close
 *   - Emits:   dialogue:choose { index }
 *   - Escape while open → emits dialogue:close
 *   - dispose() removes listeners + root element
 *
 * Lives in ui/ — NEVER imports from gameplay/.
 * All data flows through UIBus only.
 */
export class DialogueUI {
  constructor(bus, options = {}) {
    if (!bus || typeof bus.on !== "function" || typeof bus.emit !== "function") {
      throw new TypeError("DialogueUI: bus with on() and emit() is required");
    }

    const documentRef =
      options.document ?? (typeof document !== "undefined" ? document : null);

    if (!documentRef) {
      throw new Error("DialogueUI: document is required");
    }

    this._bus = bus;
    this._document = documentRef;
    this._isOpen = false;
    this._unsubs = [];
    this._domCleanups = [];

    this._mount =
      options.mount ??
      this._document.getElementById("app") ??
      this._document.body;

    if (!this._mount) {
      throw new Error("DialogueUI: mount element is required");
    }

    this._root = this._createDOM();
    this._mount.appendChild(this._root);

    // Cache interior nodes
    this._speakerEl = this._requireWithin("[data-dialogue-speaker]");
    this._bodyEl = this._requireWithin("[data-dialogue-body]");
    this._choicesEl = this._requireWithin("[data-dialogue-choices]");

    this._bindDOM();
    this._bindUIBus();
  }

  // ── Public ────────────────────────────────────────────────────────────────

  get isOpen() {
    return this._isOpen;
  }

  open(payload = {}) {
    this._renderContent(payload);
    this._isOpen = true;
    this._root.classList.add("menu-open");
    this._root.setAttribute("aria-hidden", "false");
    // Focus first choice button for keyboard accessibility
    this._root.querySelector(".dialogue-choice")?.focus();
  }

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._root.classList.remove("menu-open");
    this._root.setAttribute("aria-hidden", "true");
  }

  dispose() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs.length = 0;
    for (const cleanup of this._domCleanups) cleanup();
    this._domCleanups.length = 0;
    this._root.remove();
  }

  // ── Private: rendering ────────────────────────────────────────────────────

  _renderContent({ speaker, text, choices = [], npcName } = {}) {
    // Speaker label: prefer explicit speaker, fall back to npcName
    const displaySpeaker =
      (typeof speaker === "string" && speaker.trim()) ||
      (typeof npcName === "string" && npcName.trim()) ||
      "";
    this._speakerEl.textContent = displaySpeaker;
    this._bodyEl.textContent =
      typeof text === "string" ? text : "";

    this._renderChoices(choices);
  }

  _renderChoices(choices) {
    this._choicesEl.replaceChildren();

    const safeChoices = Array.isArray(choices) ? choices : [];

    for (let i = 0; i < safeChoices.length; i++) {
      const choice = safeChoices[i];
      const btn = this._document.createElement("button");
      btn.type = "button";
      btn.className = "dialogue-choice";
      btn.dataset.choiceIndex = String(i);
      btn.setAttribute("aria-label", `Choice ${i + 1}: ${choice.label ?? ""}`);

      // Number hint (1-9) for keyboard shortcut
      const keyHint = this._document.createElement("span");
      keyHint.className = "dialogue-choice__key";
      keyHint.setAttribute("aria-hidden", "true");
      keyHint.textContent = i < 9 ? String(i + 1) : "";

      const labelEl = this._document.createElement("span");
      labelEl.className = "dialogue-choice__label";
      labelEl.textContent =
        typeof choice?.label === "string" ? choice.label : `Choice ${i + 1}`;

      btn.appendChild(keyHint);
      btn.appendChild(labelEl);
      this._choicesEl.appendChild(btn);
    }
  }

  // ── Private: DOM binding ──────────────────────────────────────────────────

  _bindDOM() {
    const onChoicesClick = (event) => {
      const btn = event.target.closest("[data-choice-index]");
      if (!btn) return;
      const index = Number.parseInt(btn.dataset.choiceIndex ?? "", 10);
      if (Number.isFinite(index)) {
        this._bus.emit("dialogue:choose", { index });
      }
    };

    const onKeyDown = (event) => {
      if (!this._isOpen) return;

      // Escape → emit dialogue:close
      if (event.key === "Escape") {
        event.preventDefault();
        this._bus.emit("dialogue:close", {});
        return;
      }

      // Number keys 1-9 → choose that index
      const num = Number.parseInt(event.key, 10);
      if (num >= 1 && num <= 9) {
        const choiceBtn = this._choicesEl.querySelector(
          `[data-choice-index="${num - 1}"]`
        );
        if (choiceBtn) {
          this._bus.emit("dialogue:choose", { index: num - 1 });
        }
      }
    };

    this._choicesEl.addEventListener("click", onChoicesClick);
    this._document.addEventListener("keydown", onKeyDown);

    this._domCleanups.push(() => {
      this._choicesEl.removeEventListener("click", onChoicesClick);
      this._document.removeEventListener("keydown", onKeyDown);
    });
  }

  _bindUIBus() {
    this._unsubs.push(
      this._bus.on("dialogue:open", (payload) => {
        this.open(payload ?? {});
      }),
      this._bus.on("dialogue:render", (payload) => {
        if (this._isOpen) {
          this._renderContent(payload ?? {});
        }
      }),
      this._bus.on("dialogue:close", () => {
        this.close();
      })
    );
  }

  // ── Private: DOM construction ─────────────────────────────────────────────

  _requireWithin(selector) {
    const el = this._root.querySelector(selector);
    if (!el) {
      throw new Error(`DialogueUI: missing element "${selector}"`);
    }
    return el;
  }

  _createDOM() {
    const root = this._document.createElement("section");
    root.id = "dialogue-ui";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Dialogue");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="dialogue-panel rf-panel">
        <div class="dialogue-speaker" data-dialogue-speaker></div>
        <p class="dialogue-body" data-dialogue-body></p>
        <div class="dialogue-choices" data-dialogue-choices></div>
      </div>
    `;
    return root;
  }
}

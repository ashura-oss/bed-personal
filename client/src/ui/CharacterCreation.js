import {
  affinityDescriptions,
  allowedAffinities,
  allowedClasses,
  allowedOrigins,
  baseStats,
  classDescriptions,
  originDescriptions,
  previewStats,
  validateCharacterName
} from "../gameplay/characters/CharacterRules.js";

const FADE_MS = 240;
const STAT_ROWS = Object.freeze([
  ["hp", "HP"],
  ["strength", "STR"],
  ["intelligence", "INT"],
  ["agility", "AGI"],
  ["faith", "FAI"],
  ["endurance", "END"],
  ["charisma", "CHA"]
]);

export class CharacterCreation {
  constructor(container, { user, authService, onSuccess, onCancel } = {}) {
    if (!container) {
      throw new TypeError("CharacterCreation: container is required");
    }

    if (!authService || typeof authService.createCharacter !== "function") {
      throw new TypeError("CharacterCreation: authService.createCharacter() is required");
    }

    this.container = container;
    this.user = user ?? null;
    this.authService = authService;
    this.onSuccess = typeof onSuccess === "function" ? onSuccess : () => {};
    this.onCancel = typeof onCancel === "function" ? onCancel : null;
    this.selection = {
      origin: allowedOrigins[0],
      className: allowedClasses[0],
      affinity: allowedAffinities[0],
      characterName: ""
    };
    this.isSubmitting = false;
    this.domCleanups = [];

    this.container.classList.add("character-creation-active");
    this.root = this.createDOM();
    this.container.appendChild(this.root);

    this.nameInput = this.requireWithin("[data-character-name]");
    this.submitButton = this.requireWithin("[data-character-submit]");
    this.errorEl = this.requireWithin("[data-character-error]");
    this.statusEl = this.requireWithin("[data-character-status]");
    this.previewTitle = this.requireWithin("[data-character-preview-title]");
    this.previewSummary = this.requireWithin("[data-character-preview-summary]");
    this.previewMode = this.requireWithin("[data-character-preview-mode]");
    this.statsGrid = this.requireWithin("[data-character-stats]");

    this.buildOptions();
    this.bindDOM();
    this.render();
    this.nameInput.focus();
  }

  dispose() {
    for (const cleanup of this.domCleanups) {
      cleanup();
    }
    this.domCleanups.length = 0;
    this.container.classList.remove("character-creation-active");
    this.root.remove();
  }

  requireWithin(selector) {
    const element = this.root.querySelector(selector);
    if (!element) {
      throw new Error(`CharacterCreation: missing element "${selector}"`);
    }

    return element;
  }

  createDOM() {
    const root = document.createElement("section");
    root.id = "character-creation";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "character-creation-title");
    root.innerHTML = `
      <main class="character-creation-shell rf-panel" role="main">
        <header class="character-creation-header">
          <div>
            <p class="character-creation-kicker">Hero Forge</p>
            <h1 class="rf-title character-creation-title" id="character-creation-title">
              Create Character
            </h1>
          </div>
          <button
            type="button"
            class="character-creation-cancel"
            data-character-cancel
            aria-label="Cancel character creation"
          >
            Cancel
          </button>
        </header>

        <form class="character-creation-form" data-character-form novalidate>
          <section class="character-creation-choices" aria-label="Character choices">
            <label class="character-creation-field" for="character-creation-name">
              <span>Character Name</span>
              <input
                id="character-creation-name"
                data-character-name
                type="text"
                maxlength="40"
                autocomplete="off"
                spellcheck="false"
                placeholder="Mira Ashstep"
              />
            </label>

            <fieldset class="character-creation-group">
              <legend>Origin</legend>
              <div class="character-creation-options" data-character-options="origin"></div>
            </fieldset>

            <fieldset class="character-creation-group">
              <legend>Class</legend>
              <div class="character-creation-options" data-character-options="className"></div>
            </fieldset>

            <fieldset class="character-creation-group">
              <legend>Affinity</legend>
              <div class="character-creation-options" data-character-options="affinity"></div>
            </fieldset>
          </section>

          <aside class="character-creation-preview" aria-label="Live stat preview">
            <p class="character-creation-preview__mode" data-character-preview-mode>Base Stats</p>
            <h2 data-character-preview-title>Unnamed Hero</h2>
            <p data-character-preview-summary>No path chosen yet</p>
            <div class="character-creation-stats" data-character-stats></div>
            <p
              class="character-creation-error"
              data-character-error
              aria-live="assertive"
            ></p>
            <p
              class="character-creation-status"
              data-character-status
              role="status"
              aria-live="polite"
            ></p>
            <button class="character-creation-submit" type="submit" data-character-submit>
              Create Character
            </button>
          </aside>
        </form>
      </main>
    `;

    if (!this.onCancel) {
      root.querySelector("[data-character-cancel]")?.remove();
    }

    return root;
  }

  buildOptions() {
    this.populateOptionGroup("origin", allowedOrigins, originDescriptions);
    this.populateOptionGroup("className", allowedClasses, classDescriptions);
    this.populateOptionGroup("affinity", allowedAffinities, affinityDescriptions);
  }

  populateOptionGroup(selectionKey, values, descriptions) {
    const group = this.root.querySelector(`[data-character-options="${selectionKey}"]`);
    if (!group) {
      return;
    }

    for (const value of values) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "character-creation-option";
      button.dataset.selectionKey = selectionKey;
      button.dataset.selectionValue = value;
      button.setAttribute("aria-pressed", "false");

      const title = document.createElement("span");
      title.className = "character-creation-option__title";
      title.textContent = value;

      const description = document.createElement("span");
      description.className = "character-creation-option__description";
      description.textContent = descriptions[value] ?? "";

      button.append(title, description);

      const onClick = () => {
        this.selection[selectionKey] = value;
        this.clearError();
        this.render();
      };
      button.addEventListener("click", onClick);
      this.domCleanups.push(() => button.removeEventListener("click", onClick));
      group.appendChild(button);
    }
  }

  bindDOM() {
    const form = this.requireWithin("[data-character-form]");
    const cancelButton = this.root.querySelector("[data-character-cancel]");

    const onInput = () => {
      this.selection.characterName = this.nameInput.value;
      this.clearError();
      this.render();
    };
    const onSubmit = (event) => {
      event.preventDefault();
      void this.submit();
    };
    const onCancel = () => {
      this.close(() => this.onCancel?.());
    };

    this.nameInput.addEventListener("input", onInput);
    form.addEventListener("submit", onSubmit);
    cancelButton?.addEventListener("click", onCancel);

    this.domCleanups.push(() => {
      this.nameInput.removeEventListener("input", onInput);
      form.removeEventListener("submit", onSubmit);
      cancelButton?.removeEventListener("click", onCancel);
    });
  }

  render() {
    this.renderSelections();
    this.renderPreview();
    this.renderSubmitState();
  }

  renderSelections() {
    const buttons = this.root.querySelectorAll("[data-selection-key]");

    buttons.forEach((button) => {
      const isSelected = this.selection[button.dataset.selectionKey] === button.dataset.selectionValue;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  renderPreview() {
    const stats = previewStats(this.selection);
    const displayStats = stats ?? baseStats;
    const name = this.selection.characterName.trim() || "Unnamed Hero";

    this.previewMode.textContent = stats ? "Forged Stats" : "Base Stats";
    this.previewTitle.textContent = name;
    this.previewSummary.textContent = this.describeSelection();

    this.statsGrid.innerHTML = "";
    for (const [statKey, label] of STAT_ROWS) {
      const row = document.createElement("span");
      row.className = "character-creation-stat";

      const value = document.createElement("strong");
      value.textContent = String(displayStats[statKey]);

      const statLabel = document.createElement("span");
      statLabel.textContent = label;

      row.append(value, statLabel);
      this.statsGrid.appendChild(row);
    }
  }

  renderSubmitState() {
    const nameError = validateCharacterName(this.selection.characterName);
    this.submitButton.disabled = this.isSubmitting || Boolean(nameError);
  }

  describeSelection() {
    const parts = [
      this.selection.origin,
      this.selection.className,
      `${this.selection.affinity} affinity`
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(" / ") : "No path chosen yet";
  }

  async submit() {
    if (this.isSubmitting) {
      return;
    }

    const nameError = validateCharacterName(this.selection.characterName);
    if (nameError) {
      this.showError(nameError);
      this.renderSubmitState();
      return;
    }

    const userId = this.user?.userId ?? this.user?.id;
    if (!userId) {
      this.showError("User profile is missing. Login again before creating a character.");
      return;
    }

    this.isSubmitting = true;
    this.submitButton.disabled = true;
    this.submitButton.textContent = "Creating Character...";
    this.statusEl.textContent = "Creating character.";
    this.clearError();

    const payload = {
      userId,
      characterName: this.selection.characterName.trim(),
      origin: this.selection.origin,
      className: this.selection.className,
      affinity: this.selection.affinity
    };

    try {
      const result = await this.authService.createCharacter(payload);

      if (result?.ok === false) {
        this.handleSubmitError(result.message || "Character creation failed.");
        return;
      }

      this.statusEl.textContent = "Character created.";
      this.close(() => this.onSuccess(result));
    } catch (error) {
      this.handleSubmitError(getFriendlyErrorMessage(error));
    }
  }

  handleSubmitError(message) {
    this.isSubmitting = false;
    this.submitButton.disabled = false;
    this.submitButton.textContent = "Create Character";
    this.statusEl.textContent = "";
    this.showError(message);
  }

  showError(message) {
    this.errorEl.textContent = message;
  }

  clearError() {
    this.errorEl.textContent = "";
  }

  close(afterClose) {
    this.root.style.transition = `opacity ${FADE_MS}ms ease`;
    this.root.style.opacity = "0";

    setTimeout(() => {
      this.dispose();
      afterClose?.();
    }, FADE_MS);
  }
}

function getFriendlyErrorMessage(error) {
  return error?.payload?.message
    || error?.message
    || "Could not create the character. Try again.";
}

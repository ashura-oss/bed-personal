// Ghost HP bar decay time (seconds)
const GHOST_DECAY_DELAY = 0.5;
const DEFAULT_HEARTHLIGHT_PROMPT = "Rest at Hearthlight";
const DEFAULT_GATHERING_PROMPT = "Gather Resource";
const DEFAULT_WARD_META = "Ashfall Road / Hearthmere Fringe";
const HARVEST_FEEDBACK_MS = 1800;

export function formatGatheringPrompt(definition) {
  const name = definition?.name?.trim();
  return name ? `Gather ${name}` : DEFAULT_GATHERING_PROMPT;
}

export function formatHarvestFeedback({ count, nodeDef, itemId }) {
  const label = nodeDef?.name?.trim() || humanizeItemId(itemId) || "Resource";
  const amount = Number.isFinite(count) ? Math.max(1, count) : 1;
  return `Gathered +${amount} ${label}`;
}

export function formatQuestObjectiveText(payload = {}) {
  const objective = payload.objective;
  if (objective?.label) {
    const current = Number.isFinite(objective.current) ? Math.max(0, Math.floor(objective.current)) : 0;
    const requiredCount = Number.isFinite(objective.requiredCount)
      ? Math.max(1, Math.floor(objective.requiredCount))
      : 1;
    return `${objective.label}: ${Math.min(current, requiredCount)}/${requiredCount}`;
  }

  return payload.text || payload.summary || "Continue the Hearthmere writ.";
}

export function resolveInteractPromptState({
  controlsLocked = false,
  hearthlightVisible = false,
  hearthlightText = DEFAULT_HEARTHLIGHT_PROMPT,
  gatheringVisible = false,
  gatheringText = DEFAULT_GATHERING_PROMPT
} = {}) {
  if (controlsLocked) {
    return { visible: false, text: hearthlightText };
  }

  if (hearthlightVisible) {
    return { visible: true, text: hearthlightText };
  }

  if (gatheringVisible) {
    return { visible: true, text: gatheringText };
  }

  return { visible: false, text: hearthlightText };
}

function humanizeItemId(itemId) {
  if (typeof itemId !== "string" || itemId.length === 0) {
    return "";
  }

  return itemId
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * HUD — subscribes to UIBus events and updates the HTML overlay.
 *
 * Never imports from gameplay/. Data flows: UIBus events → DOM only.
 */
export class HUD {
  constructor(bus) {
    this.bus = bus;
    this.ghostHpTimer = 0;
    this.bossName = null;
    this.bossDefeated = false;
    this.controlsLocked = false;
    this.unsubs = [];
    this.domCleanups = [];
    this.wardMetaFeedbackTimer = null;
    this.hearthlightPrompt = { visible: false, text: DEFAULT_HEARTHLIGHT_PROMPT };
    this.gatheringPrompt = {
      visible: false,
      nodeId: null,
      text: DEFAULT_GATHERING_PROMPT
    };
    this.questObjective = null;

    this.vitalsRoot = this.get("#hud-vitals");
    this.fillHp = this.get("#fill-hp");
    this.fillFp = this.get("#fill-fp");
    this.fillStamina = this.get("#fill-stamina");
    this.ghostHp = document.querySelector("#ghost-hp");
    this.flaskCount = this.get("#flask-count");
    this.embersCount = this.get("#embers-count");
    this.lockonReticle = this.get("#lockon-reticle");
    this.iframeIndicator = document.querySelector("#iframe-indicator");
    this.hud = this.get("#hud");
    this.deathBanner = this.get("#death-banner");
    this.pauseMenu = this.get("#pause-menu");
    this.hearthlightMenu = this.get("#hearthlight-menu");
    this.interactPrompt = this.get("#interact-prompt");
    this.interactPromptText = this.getWithin(this.interactPrompt, ".prompt-text");
    this.controlsHint = document.querySelector("#controls-hint");

    const vitalsChrome = this.decorateVitals();
    this.vitalsPlate = vitalsChrome.plate;
    this.wardMeta = vitalsChrome.meta;
    this.baseWardMetaText = this.wardMeta.textContent || DEFAULT_WARD_META;

    this.objectivePanel = this.createObjectivePanel();
    this.objectiveRegion = this.getWithin(this.objectivePanel, ".objective-region");
    this.objectiveTitle = this.getWithin(this.objectivePanel, ".objective-title");
    this.objectiveText = this.getWithin(this.objectivePanel, ".objective-text");
    this.objectiveState = this.getWithin(this.objectivePanel, ".objective-state");

    this.decorateControlsHint();
    this.setDefaultObjective();
    this.bindUIBus();
    this.bindMenuButtons();
  }

  /** Called from the render loop to animate the ghost HP bar. */
  updateGhost(dt) {
    if (this.ghostHpTimer <= 0) {
      return;
    }

    this.ghostHpTimer -= dt;
    if (this.ghostHpTimer <= 0 && this.ghostHp) {
      this.ghostHp.style.transform = this.fillHp.style.transform;
    }
  }

  /** Update the Hearthlight-owned interact prompt state. */
  setInteractPromptVisible(visible, text = DEFAULT_HEARTHLIGHT_PROMPT) {
    this.hearthlightPrompt.visible = visible;
    this.hearthlightPrompt.text = text;
    this.renderInteractPrompt();
  }

  /** Show / hide the dodge phase cue. */
  setIFrameIndicator(active) {
    this.iframeIndicator?.classList.toggle("iframe-active", active);
  }

  dispose() {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs.length = 0;

    for (const cleanup of this.domCleanups) {
      cleanup();
    }
    this.domCleanups.length = 0;

    if (this.wardMetaFeedbackTimer !== null) {
      clearTimeout(this.wardMetaFeedbackTimer);
      this.wardMetaFeedbackTimer = null;
    }

    this.objectivePanel.remove();
    this.vitalsPlate.remove();
  }

  get(selector) {
    const el = document.querySelector(selector);
    if (!el) {
      throw new Error(`HUD: missing element "${selector}"`);
    }

    return el;
  }

  getWithin(root, selector) {
    const el = root.querySelector(selector);
    if (!el) {
      throw new Error(`HUD: missing element "${selector}"`);
    }

    return el;
  }

  setBar(fill, ratio) {
    fill.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
  }

  renderInteractPrompt() {
    const { visible, text } = resolveInteractPromptState({
      controlsLocked: this.controlsLocked,
      hearthlightVisible: this.hearthlightPrompt.visible,
      hearthlightText: this.hearthlightPrompt.text,
      gatheringVisible: this.gatheringPrompt.visible,
      gatheringText: this.gatheringPrompt.text
    });

    this.interactPromptText.textContent = text;
    this.interactPrompt.setAttribute("aria-hidden", String(!visible));
    this.interactPrompt.classList.toggle("prompt-visible", visible);
  }

  setGatheringPrompt(visible, definition = null, nodeId = null) {
    this.gatheringPrompt.visible = visible;
    this.gatheringPrompt.nodeId = visible ? nodeId : null;
    this.gatheringPrompt.text = visible
      ? formatGatheringPrompt(definition)
      : DEFAULT_GATHERING_PROMPT;
    this.renderInteractPrompt();
  }

  setWardMeta(text, { deferUntilFeedbackEnds = false } = {}) {
    this.baseWardMetaText = text;
    if (deferUntilFeedbackEnds && this.wardMetaFeedbackTimer !== null) {
      return;
    }

    if (this.wardMetaFeedbackTimer !== null) {
      clearTimeout(this.wardMetaFeedbackTimer);
      this.wardMetaFeedbackTimer = null;
    }

    this.wardMeta.textContent = text;
  }

  showHarvestFeedback(payload) {
    if (this.wardMetaFeedbackTimer !== null) {
      clearTimeout(this.wardMetaFeedbackTimer);
    }

    this.wardMeta.textContent = formatHarvestFeedback(payload);
    this.wardMetaFeedbackTimer = setTimeout(() => {
      this.wardMetaFeedbackTimer = null;
      this.wardMeta.textContent = this.baseWardMetaText;
    }, HARVEST_FEEDBACK_MS);
  }

  bindUIBus() {
    this.unsubs.push(
      this.bus.on("boot:ready", () => {
        this.hud.classList.add("hud-active");
        this.hud.setAttribute("aria-hidden", "false");
        this.restoreObjective();

        if (this.controlsHint) {
          setTimeout(() => this.controlsHint?.classList.add("hint-hidden"), 8500);
        }
      }),
      this.bus.on("player:hpChanged", ({ current, max }) => {
        const newRatio = current / max;
        if (this.ghostHp) {
          this.ghostHp.style.transform = this.fillHp.style.transform;
          this.ghostHpTimer = GHOST_DECAY_DELAY;
        }
        this.setBar(this.fillHp, newRatio);
      }),
      this.bus.on("player:fpChanged", ({ current, max }) => {
        this.setBar(this.fillFp, current / max);
      }),
      this.bus.on("player:staminaChanged", ({ current, max }) => {
        this.setBar(this.fillStamina, current / max);
      }),
      this.bus.on("player:died", () => {
        this.deathBanner.setAttribute("aria-hidden", "false");
        this.deathBanner.classList.add("unmade-visible");
        this.setObjective(
          "Ashfall Road",
          "Ashes Scattered",
          "Recover the embers you dropped and walk back through the broken gate.",
          "Embers Lost"
        );
      }),
      this.bus.on("player:respawned", () => {
        this.deathBanner.classList.remove("unmade-visible");
        this.setBar(this.fillHp, 1);
        this.setBar(this.fillFp, 1);
        this.setBar(this.fillStamina, 1);
        this.restoreObjective();
        setTimeout(() => this.deathBanner.setAttribute("aria-hidden", "true"), 500);
      }),
      this.bus.on("embers:changed", ({ amount }) => {
        this.embersCount.textContent = String(amount);
      }),
      this.bus.on("player:flaskChanged", ({ remaining }) => {
        this.flaskCount.textContent = String(remaining);
      }),
      this.bus.on("lockon:changed", ({ active }) => {
        this.lockonReticle.classList.toggle("lockon-active", active);
      }),
      this.bus.on("menu:opened", () => {
        // handled by specific menu handlers
      }),
      this.bus.on("controls:locked", () => {
        this.controlsLocked = true;
        this.renderInteractPrompt();
      }),
      this.bus.on("controls:unlocked", () => {
        this.controlsLocked = false;
        this.renderInteractPrompt();
      }),
      this.bus.on("menu:closed", () => {
        this.pauseMenu.classList.remove("menu-open");
        this.pauseMenu.setAttribute("aria-hidden", "true");
        this.hearthlightMenu.classList.remove("menu-open");
        this.hearthlightMenu.setAttribute("aria-hidden", "true");
        this.restoreObjective();
      }),
      this.bus.on("gathering:node_nearby", ({ nodeId, definition }) => {
        this.setGatheringPrompt(true, definition, nodeId ?? null);
      }),
      this.bus.on("gathering:node_left", ({ nodeId }) => {
        if (this.gatheringPrompt.nodeId !== null && nodeId !== this.gatheringPrompt.nodeId) {
          return;
        }

        this.setGatheringPrompt(false);
      }),
      this.bus.on("gathering:harvested", (payload) => {
        this.showHarvestFeedback(payload);
      }),
      this.bus.on("quest:set", (payload) => {
        this.questObjective = payload ?? null;
        if (!this.bossName) {
          this.restoreObjective();
        }
      }),
      this.bus.on("quest:clear", () => {
        this.questObjective = null;
        if (!this.bossName) {
          this.restoreObjective();
        }
      }),
      this.bus.on("hearthlight:opened", () => {
        this.hearthlightMenu.classList.add("menu-open");
        this.hearthlightMenu.setAttribute("aria-hidden", "false");
        this.setObjective(
          "Hearthlight",
          "Bank the Flame",
          "Restore your flask, steady your will, and reset the road before crossing again.",
          "Safe Rest"
        );
      }),
      this.bus.on("hearthlight:hidden", () => {
        this.hearthlightMenu.classList.remove("menu-open");
        this.hearthlightMenu.setAttribute("aria-hidden", "true");
      }),
      this.bus.on("pause:opened", () => {
        this.pauseMenu.classList.add("menu-open");
        this.pauseMenu.setAttribute("aria-hidden", "false");
      }),
      this.bus.on("boss:entered", ({ name }) => {
        this.bossName = name;
        this.bossDefeated = false;
        this.setWardMeta("Ashfall Road / Fog Gate Breached");
        this.setBossObjective(name);
      }),
      this.bus.on("boss:defeated", ({ name }) => {
        this.bossName = null;
        this.bossDefeated = true;
        this.setWardMeta("Ashfall Road / First Shard Claimed");
        this.restoreObjective(name);
      }),
      this.bus.on("character:levelUp", ({ newLevel }) => {
        this.setWardMeta(`Worldheart Stirring / Level ${newLevel}`);
      })
    );
  }

  bindMenuButtons() {
    const bindClick = (elementId, handler) => {
      const button = document.getElementById(elementId);
      if (!button) {
        return;
      }

      button.addEventListener("click", handler);
      this.domCleanups.push(() => {
        button.removeEventListener("click", handler);
      });
    };

    bindClick("btn-resume", () => {
      this.bus.emit("menu:closed", {});
    });
    bindClick("btn-quit", () => {
      window.location.reload();
    });
    bindClick("btn-rest", () => {
      this.bus.emit("hearthlight:rested", {});
    });
    bindClick("btn-hearthlight-crafting", () => {
      this.bus.emit("hearthlight:crafting", {});
    });
    bindClick("btn-hearthlight-abilities", () => {
      this.bus.emit("hearthlight:abilities", {});
    });
    bindClick("btn-hearthlight-leave", () => {
      this.bus.emit("menu:closed", {});
    });
  }

  decorateVitals() {
    const plate = document.createElement("div");
    plate.className = "hud-plate";
    plate.innerHTML = `
      <div class="hud-plate__kicker">Realmforge</div>
      <div class="hud-plate__title">Unbound Writ</div>
      <div class="hud-plate__meta">${DEFAULT_WARD_META}</div>
    `;

    this.vitalsRoot.prepend(plate);
    document.getElementById("hud-flask")?.setAttribute("data-label", "Flasks");
    document.getElementById("hud-embers")?.setAttribute("data-label", "Embers");

    return {
      plate,
      meta: this.getWithin(plate, ".hud-plate__meta")
    };
  }

  decorateControlsHint() {
    if (!this.controlsHint) {
      return;
    }

    this.controlsHint.classList.remove("hint-hidden");
    this.controlsHint.innerHTML = `
      <div class="controls-surface">
        <div class="controls-surface__header">
          <span class="controls-surface__title">Field Orders</span>
          <span class="controls-surface__context">Ashfall Road</span>
        </div>
        <div class="controls-grid">
          <div class="controls-chip"><kbd>WASD</kbd><span>Move</span></div>
          <div class="controls-chip"><kbd>Space</kbd><span>Dodge</span></div>
          <div class="controls-chip"><kbd>J</kbd><span>Light Cut</span></div>
          <div class="controls-chip"><kbd>K</kbd><span>Heavy Cut</span></div>
          <div class="controls-chip"><kbd>Q/E/R</kbd><span>Abilities</span></div>
          <div class="controls-chip"><kbd>Tab</kbd><span>Lock On</span></div>
          <div class="controls-chip"><kbd>E</kbd><span>Interact</span></div>
        </div>
      </div>
    `;
  }

  createObjectivePanel() {
    const panel = document.createElement("section");
    panel.id = "objective-panel";
    panel.innerHTML = `
      <div class="objective-region">Ashfall Road</div>
      <div class="objective-title">Road to Hearthmere</div>
      <p class="objective-text"></p>
      <div class="objective-state">Ashfall Trial</div>
    `;

    this.hud.appendChild(panel);
    return panel;
  }

  setObjective(region, title, text, state) {
    this.objectiveRegion.textContent = region;
    this.objectiveTitle.textContent = title;
    this.objectiveText.textContent = text;
    this.objectiveState.textContent = state;
  }

  setDefaultObjective() {
    this.setObjective(
      "Ashfall Road",
      "Road to Hearthmere",
      "Advance beyond the shrine, bank your strength at the Hearthlight, and challenge the Hollowbound Caravan Guard.",
      "Ashfall Trial"
    );
  }

  setBossObjective(name) {
    if (name === "Hollowbound Caravan Guard") {
      this.setObjective(
        "Fog Gate",
        "Broken Oath",
        "Break the guard's shield rhythm, spend stamina with care, and finish the shardbound warden.",
        "Boss Engaged"
      );
      return;
    }

    this.setObjective(
      "Hostile Presence",
      name,
      "Hold your ground, read the pattern, and press the attack only when the opening is real.",
      "Boss Engaged"
    );
  }

  setPostBossObjective(name) {
    this.setObjective(
      "Ashfall Road",
      "First Shard Secured",
      `The ${name} has fallen. Return to the Hearthlight and gather what the road has yielded.`,
      "Victory Claimed"
    );
  }

  setQuestObjective(payload) {
    this.setObjective(
      payload.regionTitle || "Hearthmere",
      payload.title || "Hearthmere Writ",
      formatQuestObjectiveText(payload),
      payload.state || "In Progress"
    );
  }

  restoreObjective(defeatedBossName = "Hollowbound Caravan Guard") {
    if (this.bossName) {
      this.setBossObjective(this.bossName);
      return;
    }

    if (this.questObjective) {
      this.setQuestObjective(this.questObjective);
      return;
    }

    if (this.bossDefeated) {
      this.setPostBossObjective(defeatedBossName);
      return;
    }

    this.setDefaultObjective();
  }
}

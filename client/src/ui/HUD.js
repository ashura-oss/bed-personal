// Ghost HP bar decay time (seconds)
const GHOST_DECAY_DELAY = 0.5;

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
    this.unsubs = [];
    this.domCleanups = [];

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
    this.controlsHint = document.querySelector("#controls-hint");

    const vitalsChrome = this.decorateVitals();
    this.vitalsPlate = vitalsChrome.plate;
    this.wardMeta = vitalsChrome.meta;

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

  /** Show / hide the interaction prompt (near Hearthlight). */
  setInteractPromptVisible(visible, text = "Rest at Hearthlight") {
    const el = this.interactPrompt.querySelector(".prompt-text");
    if (el) {
      el.textContent = text;
    }

    this.interactPrompt.setAttribute("aria-hidden", String(!visible));
    this.interactPrompt.classList.toggle("prompt-visible", visible);
  }

  /** Show / hide the i-frame debug indicator. */
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
      this.bus.on("menu:closed", () => {
        this.pauseMenu.classList.remove("menu-open");
        this.pauseMenu.setAttribute("aria-hidden", "true");
        this.hearthlightMenu.classList.remove("menu-open");
        this.hearthlightMenu.setAttribute("aria-hidden", "true");
        this.restoreObjective();
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
      this.bus.on("pause:opened", () => {
        this.pauseMenu.classList.add("menu-open");
        this.pauseMenu.setAttribute("aria-hidden", "false");
      }),
      this.bus.on("boss:entered", ({ name }) => {
        this.bossName = name;
        this.bossDefeated = false;
        this.wardMeta.textContent = "Ashfall Road / Fog Gate Breached";
        this.setBossObjective(name);
      }),
      this.bus.on("boss:defeated", ({ name }) => {
        this.bossName = null;
        this.bossDefeated = true;
        this.wardMeta.textContent = "Ashfall Road / First Shard Claimed";
        this.setPostBossObjective(name);
      }),
      this.bus.on("character:levelUp", ({ newLevel }) => {
        this.wardMeta.textContent = `Worldheart Stirring / Level ${newLevel}`;
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
      <div class="hud-plate__meta">Ashfall Road / Hearthmere Fringe</div>
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

  restoreObjective() {
    if (this.bossName) {
      this.setBossObjective(this.bossName);
      return;
    }

    if (this.bossDefeated) {
      this.setPostBossObjective("Hollowbound Caravan Guard");
      return;
    }

    this.setDefaultObjective();
  }
}

/**
 * BossHUD — boss health bar, phase ticks, and name reveal lower-third.
 *
 * Listens to UIBus events. Purely DOM — no gameplay imports.
 */
export class BossHUD {
  constructor(bus) {
    this.unsubs = [];

    this.container = this.createDOM();

    const kicker = this.container.querySelector(".boss-kicker");
    const nameLine = this.container.querySelector(".boss-name");
    const subtitle = this.container.querySelector(".boss-subtitle");
    const phaseLine = this.container.querySelector(".boss-phase");
    const barFill = this.container.querySelector(".boss-bar-fill");
    const ticks = this.container.querySelector(".boss-ticks");
    const pips = this.container.querySelector(".boss-phase-pips");

    if (!kicker || !nameLine || !subtitle || !phaseLine || !barFill || !ticks || !pips) {
      throw new Error("BossHUD: missing DOM elements");
    }

    this.kicker = kicker;
    this.nameLine = nameLine;
    this.subtitle = subtitle;
    this.phaseLine = phaseLine;
    this.barFill = barFill;
    this.ticks = ticks;
    this.pips = pips;

    this.unsubs.push(
      bus.on("boss:entered", ({ name }) => {
        this.show(name);
      }),
      bus.on("boss:hpChanged", ({ current, max, phase }) => {
        this.setHP(current / max, phase);
      }),
      bus.on("boss:defeated", () => {
        this.hide();
      })
    );
  }

  dispose() {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.container.remove();
  }

  show(name) {
    const details = this.lookupEncounter(name);
    this.kicker.textContent = details.kicker;
    this.nameLine.textContent = name;
    this.subtitle.textContent = details.subtitle;
    this.container.classList.add("boss-active");
    this.container.setAttribute("aria-hidden", "false");
    this.buildPhaseTicks();
    this.buildPhasePips();
    this.setHP(1, 1);
  }

  hide() {
    this.container.classList.remove("boss-active");
    this.container.setAttribute("aria-hidden", "true");
  }

  setHP(ratio, phase) {
    const nextRatio = Math.max(0, Math.min(1, ratio));
    this.phaseLine.textContent = `Phase ${this.toRoman(phase)}`;
    this.barFill.style.transform = `scaleX(${nextRatio})`;

    const colors = {
      1: "linear-gradient(90deg, #51110e 0%, #8a1a1a 60%, #cf6f3b 100%)",
      2: "linear-gradient(90deg, #5f180d 0%, #b84400 60%, #e09b34 100%)",
      3: "linear-gradient(90deg, #5f1028 0%, #cc0055 60%, #ff8c73 100%)"
    };

    this.barFill.style.background = colors[phase] ?? colors[1];
    this.updatePhasePips(phase);
  }

  buildPhaseTicks() {
    this.ticks.innerHTML = "";

    for (const pct of [60, 30]) {
      const tick = document.createElement("div");
      tick.className = "boss-tick";
      tick.style.left = `${pct}%`;
      this.ticks.appendChild(tick);
    }
  }

  buildPhasePips() {
    this.pips.innerHTML = "";

    for (let i = 1; i <= 3; i += 1) {
      const pip = document.createElement("span");
      pip.className = "boss-phase-pip";
      pip.dataset.phase = String(i);
      this.pips.appendChild(pip);
    }
  }

  updatePhasePips(phase) {
    const pips = this.pips.querySelectorAll(".boss-phase-pip");
    pips.forEach((pip, index) => {
      const pipPhase = index + 1;
      pip.classList.toggle("is-active", pipPhase === phase);
      pip.classList.toggle("is-spent", pipPhase < phase);
    });
  }

  lookupEncounter(name) {
    if (name === "Hollowbound Caravan Guard") {
      return {
        kicker: "Shardbound Encounter",
        subtitle: "Last shield of the Ashfall Road"
      };
    }

    return {
      kicker: "Boss Encounter",
      subtitle: "Worldheart corruption in full force"
    };
  }

  toRoman(phase) {
    const numerals = {
      1: "I",
      2: "II",
      3: "III"
    };

    return numerals[phase];
  }

  createDOM() {
    const el = document.createElement("div");
    el.id = "boss-hud";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="boss-plate">
        <div class="boss-kicker"></div>
        <div class="boss-name-row">
          <span class="boss-name"></span>
          <span class="boss-phase"></span>
        </div>
        <div class="boss-subtitle"></div>
        <div class="boss-bar-wrap">
          <div class="boss-bar-fill"></div>
          <div class="boss-ticks"></div>
        </div>
        <div class="boss-phase-pips"></div>
      </div>
    `;

    document.getElementById("app")?.appendChild(el);
    return el;
  }
}

/**
 * @jest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import {
  Hotbar,
  buildHotbarSlotView,
  buildHotbarSlotViews,
  formatHotbarCooldown
} from "../ui/Hotbar.js";

function makeBus() {
  const listeners = {};
  const emitted = {};

  return {
    on(event, handler) {
      (listeners[event] ??= []).push(handler);
      return () => {
        const handlers = listeners[event];
        if (!handlers) {
          return;
        }

        const index = handlers.indexOf(handler);
        if (index >= 0) {
          handlers.splice(index, 1);
        }
      };
    },
    emit(event, payload) {
      (emitted[event] ??= []).push(payload);
      (listeners[event] ?? []).forEach((handler) => handler(payload));
    },
    events(event) {
      return emitted[event] ?? [];
    }
  };
}

describe("Hotbar helpers", () => {
  it("formats cooldown labels for compact slot overlays", () => {
    expect(formatHotbarCooldown(0)).toBe("");
    expect(formatHotbarCooldown(2.04)).toBe("2.1s");
    expect(formatHotbarCooldown(12.1)).toBe("13s");
  });

  it("builds ready, cooldown, active, and unavailable ability slot views", () => {
    expect(
      buildHotbarSlotView({
        slotKey: "Q",
        abilityId: "ember_dash",
        name: "Ember Dash",
        fpCost: 8
      }, 0, { currentFp: 20 })
    ).toMatchObject({
      slotKey: "Q",
      abilityId: "ember_dash",
      label: "Ember Dash",
      fpCostText: "8 FP",
      state: "ready",
      statusLabel: "Ready",
      canRequest: true
    });

    expect(
      buildHotbarSlotView({
        slotKey: "E",
        id: "stone_ward",
        fpCost: 12,
        cooldownRemaining: 3,
        cooldownDuration: 6
      }, 1, { currentFp: 30 })
    ).toMatchObject({
      state: "cooldown",
      statusLabel: "3.0s",
      cooldownProgress: 0.5,
      canRequest: false
    });

    expect(
      buildHotbarSlotView({
        slotKey: "R",
        id: "hearth_burst",
        fpCost: 40
      }, 2, { currentFp: 10 })
    ).toMatchObject({
      state: "unavailable",
      statusLabel: "Need 40 FP",
      canRequest: false
    });

    expect(
      buildHotbarSlotView({ slotKey: "Q", id: "ash_form", active: true }, 0)
    ).toMatchObject({
      state: "active",
      statusLabel: "Active",
      canRequest: true
    });
  });

  it("normalizes keyed hotbar payloads into Q/E/R views", () => {
    const views = buildHotbarSlotViews({
      Q: { abilityId: "ember_dash", fpCost: 8 },
      R: { abilityId: "hearth_burst", fpCost: 20, unlocked: false }
    });

    expect(views.map((slot) => slot.slotKey)).toEqual(["Q", "E", "R"]);
    expect(views[0]).toMatchObject({ abilityId: "ember_dash", state: "ready" });
    expect(views[1]).toMatchObject({ isEmpty: true, state: "empty" });
    expect(views[2]).toMatchObject({ abilityId: "hearth_burst", state: "locked" });
  });
});

describe("Hotbar", () => {
  let bus;
  let mount;
  let ui;

  beforeEach(() => {
    bus = makeBus();
    mount = document.createElement("div");
    document.body.appendChild(mount);
    ui = new Hotbar(bus, { mount, document, currentFp: 30 });
  });

  afterEach(() => {
    ui.dispose();
    mount.remove();
  });

  it("mounts a bottom hotbar row and updates from hotbar:set", () => {
    bus.emit("hotbar:set", {
      currentFp: 18,
      slots: [
        { abilityId: "ember_dash", name: "Ember Dash", fpCost: 8 },
        { abilityId: "stone_ward", name: "Stone Ward", fpCost: 12, cooldownRemaining: 4, cooldownDuration: 8 },
        { abilityId: "hearth_burst", name: "Hearth Burst", fpCost: 25 }
      ]
    });

    const buttons = mount.querySelectorAll(".hotbar-slot");
    expect(buttons).toHaveLength(3);
    expect(buttons[0].dataset.state).toBe("ready");
    expect(buttons[0].textContent).toContain("Ember Dash");
    expect(buttons[1].dataset.state).toBe("cooldown");
    expect(buttons[1].textContent).toContain("4.0s");
    expect(buttons[2].dataset.state).toBe("unavailable");
    expect(buttons[2].textContent).toContain("Need 25 FP");
  });

  it("emits an activate request for ready slots only", () => {
    bus.emit("hotbar:set", {
      currentFp: 30,
      slots: [
        { abilityId: "ember_dash", name: "Ember Dash", fpCost: 8 },
        { abilityId: "stone_ward", name: "Stone Ward", fpCost: 12, cooldownRemaining: 2 },
        null
      ]
    });

    mount.querySelector('[data-hotbar-index="0"]').click();
    mount.querySelector('[data-hotbar-index="1"]').click();
    mount.querySelector('[data-hotbar-index="2"]').click();

    expect(bus.events("ability:activateRequested")).toHaveLength(1);
    expect(bus.events("ability:activateRequested")[0]).toMatchObject({
      slotKey: "Q",
      slotIndex: 0,
      abilityId: "ember_dash"
    });
  });

  it("re-renders availability when FP changes", () => {
    bus.emit("hotbar:set", {
      currentFp: 30,
      slots: [{ abilityId: "ember_dash", fpCost: 8 }, null, null]
    });
    expect(mount.querySelector('[data-hotbar-index="0"]').dataset.state).toBe("ready");

    bus.emit("player:fpChanged", { current: 3, max: 30 });

    expect(mount.querySelector('[data-hotbar-index="0"]').dataset.state).toBe("unavailable");
    expect(mount.querySelector('[data-hotbar-index="0"]').textContent).toContain("Need 8 FP");
  });
});

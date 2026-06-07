/**
 * @jest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import {
  AbilityMenu,
  buildAbilityDetailView,
  buildAbilityView,
  buildAbilityViews,
  groupAbilityViewsByAffinity,
  resolveAbilitySelection
} from "../ui/AbilityMenu.js";

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

const ABILITIES = Object.freeze([
  {
    abilityId: "ember_dash",
    name: "Ember Dash",
    affinity: "Ember",
    fpCost: 8,
    unlockCost: 4,
    unlocked: false,
    description: "A short burst through ash and sparks."
  },
  {
    abilityId: "stone_ward",
    name: "Stone Ward",
    affinity: "Stone",
    fpCost: 12,
    unlockCost: 2,
    unlocked: true
  },
  {
    abilityId: "hearth_burst",
    name: "Hearth Burst",
    affinity: "Ember",
    fpCost: 20,
    unlockCost: 12,
    unlocked: true,
    equippedSlot: "R"
  }
]);

describe("AbilityMenu helpers", () => {
  it("builds locked, unlocked, and equipped ability state with cost text", () => {
    expect(buildAbilityView(ABILITIES[0], 0, { availableEmbers: 2 })).toMatchObject({
      abilityId: "ember_dash",
      title: "Ember Dash",
      affinity: "Ember",
      state: "locked",
      costText: "2 Embers short",
      canUnlock: false,
      canEquip: false
    });

    expect(buildAbilityView(ABILITIES[1], 1, { availableEmbers: 2 })).toMatchObject({
      abilityId: "stone_ward",
      state: "unlocked",
      costText: "Unlocked",
      canUnlock: false,
      canEquip: true
    });

    expect(buildAbilityView(ABILITIES[2], 2, { availableEmbers: 20 })).toMatchObject({
      abilityId: "hearth_burst",
      state: "equipped",
      stateLabel: "Equipped R",
      equippedSlotKey: "R",
      canEquip: false
    });
  });

  it("groups ability views by affinity in source order", () => {
    const groups = groupAbilityViewsByAffinity(buildAbilityViews(ABILITIES, { availableEmbers: 20 }));

    expect(groups.map((group) => group.affinity)).toEqual(["Ember", "Stone"]);
    expect(groups[0].abilities.map((ability) => ability.abilityId)).toEqual([
      "ember_dash",
      "hearth_burst"
    ]);
  });

  it("selects explicit ability ids and falls back to the first unlocked ability", () => {
    const views = buildAbilityViews(ABILITIES, { availableEmbers: 20 });

    expect(resolveAbilitySelection(views, "hearth_burst")).toBe(2);
    expect(resolveAbilitySelection(views, "missing")).toBe(1);
    expect(resolveAbilitySelection(views, 0)).toBe(0);
  });

  it("builds empty detail fallback state", () => {
    expect(buildAbilityDetailView(null)).toMatchObject({
      title: "No ability selected",
      state: "empty",
      canUnlock: false,
      canEquip: false
    });
  });
});

describe("AbilityMenu", () => {
  let bus;
  let mount;
  let ui;

  beforeEach(() => {
    bus = makeBus();
    mount = document.createElement("div");
    document.body.appendChild(mount);
    ui = new AbilityMenu(bus, { mount, document });
  });

  afterEach(() => {
    ui.dispose();
    mount.remove();
  });

  it("opens from the bus and renders abilities grouped by affinity", () => {
    bus.emit("abilitymenu:open", {
      abilities: ABILITIES,
      availableEmbers: 10,
      selectedAbilityId: "ember_dash"
    });

    const root = mount.querySelector("#ability-menu-ui");
    expect(root.classList.contains("menu-open")).toBe(true);
    expect(root.getAttribute("aria-hidden")).toBe("false");
    expect(Array.from(mount.querySelectorAll(".abilitymenu-group__title")).map((node) => node.textContent)).toEqual([
      "Ember",
      "Stone"
    ]);
    expect(mount.querySelector("[data-abilitymenu-unlocked]").textContent).toBe("2/3");
    expect(mount.querySelector("[data-abilitymenu-detail-title]").textContent).toBe("Ember Dash");
    expect(mount.querySelector("[data-abilitymenu-detail-cost]").textContent).toBe("4 Embers");
    expect(mount.querySelector("[data-abilitymenu-unlock]").disabled).toBe(false);
    expect(mount.querySelector("[data-abilitymenu-equip]").disabled).toBe(true);
  });

  it("emits unlock request payloads for affordable locked abilities", () => {
    bus.emit("abilitymenu:open", {
      abilities: ABILITIES,
      availableEmbers: 10,
      selectedAbilityId: "ember_dash"
    });

    mount.querySelector("[data-abilitymenu-unlock]").click();

    expect(bus.events("ability:unlockRequested")).toHaveLength(1);
    expect(bus.events("ability:unlockRequested")[0]).toMatchObject({
      abilityId: "ember_dash",
      selectedIndex: 0,
      unlockCost: 4,
      availableEmbers: 10
    });
  });

  it("emits equip request payloads with the selected Q/E/R slot", () => {
    bus.emit("abilitymenu:open", {
      abilities: ABILITIES,
      availableEmbers: 10,
      selectedAbilityId: "stone_ward"
    });

    mount.querySelector('[data-ability-slot="E"]').click();
    mount.querySelector("[data-abilitymenu-equip]").click();

    expect(bus.events("ability:equipRequested")).toHaveLength(1);
    expect(bus.events("ability:equipRequested")[0]).toMatchObject({
      abilityId: "stone_ward",
      selectedIndex: 1,
      slotKey: "E",
      slotIndex: 1
    });
  });

  it("updates cost state from abilitymenu:set while preserving selection", () => {
    bus.emit("abilitymenu:open", {
      abilities: ABILITIES,
      availableEmbers: 1,
      selectedAbilityId: "ember_dash"
    });
    expect(mount.querySelector("[data-abilitymenu-detail-cost]").textContent).toBe("3 Embers short");
    expect(mount.querySelector("[data-abilitymenu-unlock]").disabled).toBe(true);

    bus.emit("abilitymenu:set", {
      abilities: ABILITIES,
      availableEmbers: 6
    });

    expect(mount.querySelector("[data-abilitymenu-detail-title]").textContent).toBe("Ember Dash");
    expect(mount.querySelector("[data-abilitymenu-detail-cost]").textContent).toBe("4 Embers");
    expect(mount.querySelector("[data-abilitymenu-unlock]").disabled).toBe(false);
  });
});

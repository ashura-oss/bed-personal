/**
 * @jest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { createQuestLog, reduceQuestEvents } from "../gameplay/quests/QuestLog.js";
import {
  QuestLogUI,
  buildQuestLogDetailView,
  resolveQuestLogSelection
} from "../ui/QuestLogUI.js";

function makeBus() {
  const listeners = {};

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
      (listeners[event] ?? []).forEach((handler) => handler(payload));
    }
  };
}

describe("QuestLogUI helpers", () => {
  it("selects active quests first, then completed quests, then the first entry", () => {
    const quests = [
      { questId: "inactive", status: "inactive" },
      { questId: "completed", status: "completed" },
      { questId: "active", status: "active" }
    ];

    expect(resolveQuestLogSelection(quests)).toBe(2);
    expect(resolveQuestLogSelection(quests, "completed")).toBe(1);
    expect(resolveQuestLogSelection(quests, "missing", "inactive")).toBe(0);
  });

  it("builds empty detail fallback state", () => {
    expect(buildQuestLogDetailView(null)).toMatchObject({
      title: "No quest selected",
      state: "Unavailable",
      progressText: "0/0 objectives",
      rewards: []
    });
  });
});

describe("QuestLogUI", () => {
  let bus;
  let mount;
  let ui;

  beforeEach(() => {
    bus = makeBus();
    mount = document.createElement("div");
    document.body.appendChild(mount);
    ui = new QuestLogUI(bus, { mount, document, questLog: createQuestLog() });
  });

  afterEach(() => {
    ui.dispose();
    mount.remove();
  });

  it("mounts hidden dialog chrome and opens via bus event", () => {
    const root = mount.querySelector("#questlog-ui");
    expect(root).not.toBeNull();
    expect(root.getAttribute("aria-hidden")).toBe("true");

    bus.emit("questlog:open", {});

    expect(root.classList.contains("menu-open")).toBe(true);
    expect(root.getAttribute("aria-hidden")).toBe("false");
    expect(root.querySelector("[data-questlog-total]").textContent).toBe("5");
  });

  it("renders active, completed, and inactive quest groups from an open payload", () => {
    const questLog = reduceQuestEvents(createQuestLog(), [
      "quest.tessa_gather.offer",
      { type: "gathering:harvested", itemId: "timber", count: 3 },
      "quest.survivor_rite.note",
      { type: "boss:defeated", name: "Hollowbound Caravan Guard" }
    ]);

    bus.emit("questlog:open", { questLog, selectedQuestId: "hearthmere.survivor_rite" });

    expect(mount.querySelector("[data-questlog-active]").textContent).toBe("1");
    expect(mount.querySelector("[data-questlog-completed]").textContent).toBe("1");
    expect(mount.querySelector("[data-questlog-detail-title]").textContent).toBe("The Mending Rite");
    expect(mount.querySelector("[data-questlog-detail-status]").textContent).toBe("Completed");
    expect(Array.from(mount.querySelectorAll(".questlog-group__title")).map((node) => node.textContent)).toEqual([
      "Active",
      "Completed",
      "Inactive"
    ]);
  });

  it("passes claimed reward ids through to rendered reward state", () => {
    const questLog = reduceQuestEvents(createQuestLog(), [
      "quest.survivor_rite.note",
      { type: "boss:defeated", name: "Hollowbound Caravan Guard" }
    ]);

    bus.emit("questlog:open", {
      questLog,
      selectedQuestId: "hearthmere.survivor_rite",
      questRewardSnapshot: {
        claimedRewardIds: ["hearthmere.survivor_rite.reward"]
      }
    });

    expect(mount.querySelector("[data-questlog-reward-label]").textContent).toBe("Reward Claimed");
    expect(mount.querySelector(".questlog-reward__label").textContent).toBe("Experience");
    expect(mount.querySelector(".questlog-reward__count").textContent).toBe("90 XP");
  });

  it("updates rendered quest data from quest:changed while preserving the panel", () => {
    bus.emit("questlog:open", {});

    const questLog = reduceQuestEvents(createQuestLog(), [
      "quest.tessa_gather.offer",
      { type: "gathering:harvested", itemId: "timber", count: 2 }
    ]);
    bus.emit("quest:changed", { questLog });

    const root = mount.querySelector("#questlog-ui");
    expect(root.classList.contains("menu-open")).toBe(true);
    expect(root.querySelector("[data-questlog-active]").textContent).toBe("1");
    expect(root.textContent).toContain("Fuel for the Emberwright");
    expect(root.textContent).toContain("2/3");
  });

  it("closes via close event and emits selection when a quest is clicked", () => {
    const selected = [];
    bus.on("questlog:select", (payload) => selected.push(payload));
    bus.emit("questlog:open", {});

    mount.querySelector('[data-quest-index="1"]').click();
    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({
      selectedIndex: 1,
      questId: "hearthmere.aldric_hollow"
    });

    bus.emit("questlog:close", {});
    const root = mount.querySelector("#questlog-ui");
    expect(root.classList.contains("menu-open")).toBe(false);
    expect(root.getAttribute("aria-hidden")).toBe("true");
  });
});

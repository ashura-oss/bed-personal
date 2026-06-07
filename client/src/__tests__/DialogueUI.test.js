/**
 * @jest-environment jsdom
 *
 * DialogueUI — jsdom unit tests (W-09 Module 2)
 */
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { DialogueUI } from "../ui/DialogueUI.js";

// ── Minimal UIBus stub ─────────────────────────────────────────────────────

function makeBus() {
  const listeners = {};
  return {
    on(event, handler) {
      (listeners[event] ??= []).push(handler);
      return () => {
        const arr = listeners[event];
        if (arr) {
          const idx = arr.indexOf(handler);
          if (idx !== -1) arr.splice(idx, 1);
        }
      };
    },
    emit(event, data) {
      (listeners[event] ?? []).forEach((h) => h(data));
    },
    _listeners: listeners,
  };
}

// ── Fixtures ───────────────────────────────────────────────────────────────

const SAMPLE_CHOICES = [
  { label: "Tell me about the ruins." },
  { label: "What do you trade?" },
  { label: "Farewell." },
];

// ── Tests ──────────────────────────────────────────────────────────────────

describe("DialogueUI", () => {
  let bus;
  let mount;
  let ui;

  beforeEach(() => {
    bus = makeBus();
    mount = document.createElement("div");
    document.body.appendChild(mount);
    ui = new DialogueUI(bus, { mount, document });
  });

  afterEach(() => {
    ui.dispose();
    mount.remove();
  });

  // 1. Construction
  it("mounts a root element into the provided mount", () => {
    const root = mount.querySelector("#dialogue-ui");
    expect(root).not.toBeNull();
    expect(root.getAttribute("role")).toBe("dialog");
    expect(root.getAttribute("aria-hidden")).toBe("true");
  });

  // 2. dialogue:open shows the panel and renders speaker + text
  it("dialogue:open shows the panel with speaker and body text", () => {
    bus.emit("dialogue:open", {
      speaker: "Tessa",
      text: "The ruins hold no welcome for the living.",
      choices: SAMPLE_CHOICES,
      npcName: "Tessa",
    });

    const root = mount.querySelector("#dialogue-ui");
    expect(root.classList.contains("menu-open")).toBe(true);
    expect(root.getAttribute("aria-hidden")).toBe("false");

    const speakerEl = root.querySelector("[data-dialogue-speaker]");
    expect(speakerEl.textContent).toBe("Tessa");

    const bodyEl = root.querySelector("[data-dialogue-body]");
    expect(bodyEl.textContent).toBe("The ruins hold no welcome for the living.");
  });

  // 3. Renders one button per choice with correct labels
  it("renders one button per choice with the correct label text", () => {
    bus.emit("dialogue:open", {
      speaker: "Tessa",
      text: "What would you know?",
      choices: SAMPLE_CHOICES,
    });

    const buttons = mount.querySelectorAll(".dialogue-choice");
    expect(buttons).toHaveLength(3);

    const labels = Array.from(buttons).map((btn) => {
      return btn.querySelector(".dialogue-choice__label").textContent;
    });
    expect(labels).toEqual([
      "Tell me about the ruins.",
      "What do you trade?",
      "Farewell.",
    ]);
  });

  // 4. Clicking a choice button emits dialogue:choose with the right index
  it("clicking a choice button emits dialogue:choose with the correct index", () => {
    bus.emit("dialogue:open", {
      speaker: "Tessa",
      text: "Choose.",
      choices: SAMPLE_CHOICES,
    });

    const received = [];
    bus.on("dialogue:choose", (data) => received.push(data));

    const buttons = mount.querySelectorAll(".dialogue-choice");
    // Click the second button (index 1)
    buttons[1].click();

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ index: 1 });
  });

  // 5. dialogue:render updates text + choices in place
  it("dialogue:render updates speaker, body, and choices without closing", () => {
    bus.emit("dialogue:open", {
      speaker: "Tessa",
      text: "First line.",
      choices: [{ label: "Continue." }],
    });

    bus.emit("dialogue:render", {
      speaker: "Tessa",
      text: "Second line, a branched response.",
      choices: [{ label: "Ask about the shard." }, { label: "Step away." }],
    });

    const root = mount.querySelector("#dialogue-ui");
    // Still open
    expect(root.classList.contains("menu-open")).toBe(true);

    const bodyEl = root.querySelector("[data-dialogue-body]");
    expect(bodyEl.textContent).toBe("Second line, a branched response.");

    const buttons = mount.querySelectorAll(".dialogue-choice");
    expect(buttons).toHaveLength(2);
    expect(
      buttons[0].querySelector(".dialogue-choice__label").textContent
    ).toBe("Ask about the shard.");
  });

  // 6. dialogue:close hides the panel
  it("dialogue:close hides the panel and sets aria-hidden to true", () => {
    bus.emit("dialogue:open", {
      speaker: "Tessa",
      text: "Hello.",
      choices: [{ label: "Goodbye." }],
    });

    bus.emit("dialogue:close", {});

    const root = mount.querySelector("#dialogue-ui");
    expect(root.classList.contains("menu-open")).toBe(false);
    expect(root.getAttribute("aria-hidden")).toBe("true");
  });

  // 7. Pressing Escape while open emits dialogue:close
  it("pressing Escape while open emits dialogue:close", () => {
    bus.emit("dialogue:open", {
      speaker: "Tessa",
      text: "Hello.",
      choices: [{ label: "Goodbye." }],
    });

    const received = [];
    bus.on("dialogue:close", (data) => received.push(data));

    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
    document.dispatchEvent(event);

    expect(received).toHaveLength(1);
  });

  // 8. Escape while closed does NOT emit dialogue:close
  it("pressing Escape while closed does not emit dialogue:close", () => {
    const received = [];
    bus.on("dialogue:close", (data) => received.push(data));

    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
    document.dispatchEvent(event);

    expect(received).toHaveLength(0);
  });

  // 9. Number key 1-9 while open emits dialogue:choose with correct index
  it("pressing number key 2 while open emits dialogue:choose { index: 1 }", () => {
    bus.emit("dialogue:open", {
      speaker: "Tessa",
      text: "Choose.",
      choices: SAMPLE_CHOICES,
    });

    const received = [];
    bus.on("dialogue:choose", (data) => received.push(data));

    const event = new KeyboardEvent("keydown", { key: "2", bubbles: true });
    document.dispatchEvent(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ index: 1 });
  });

  // 10. dispose() removes the root and unsubscribes (no throw on subsequent emits)
  it("dispose() removes the root element from the mount", () => {
    ui.dispose();

    const root = mount.querySelector("#dialogue-ui");
    expect(root).toBeNull();
  });

  it("dispose() unsubscribes UIBus listeners — subsequent emits do not throw", () => {
    ui.dispose();

    // These should not throw even though the root is gone
    expect(() => {
      bus.emit("dialogue:open", { speaker: "X", text: "y", choices: [] });
      bus.emit("dialogue:render", { speaker: "X", text: "z", choices: [] });
      bus.emit("dialogue:close", {});
    }).not.toThrow();
  });

  // 11. npcName is used as fallback speaker when speaker field is absent
  it("uses npcName as fallback when speaker is absent", () => {
    bus.emit("dialogue:open", {
      npcName: "Elden Keeper",
      text: "Greetings, waybound.",
      choices: [],
    });

    const speakerEl = mount.querySelector("[data-dialogue-speaker]");
    expect(speakerEl.textContent).toBe("Elden Keeper");
  });

  // 12. data-choice-index attributes are set correctly
  it("each choice button has the correct data-choice-index attribute", () => {
    bus.emit("dialogue:open", {
      speaker: "Tessa",
      text: "Choose wisely.",
      choices: SAMPLE_CHOICES,
    });

    const buttons = mount.querySelectorAll(".dialogue-choice");
    buttons.forEach((btn, i) => {
      expect(btn.dataset.choiceIndex).toBe(String(i));
    });
  });

  // 13. Constructor: throws if bus is invalid
  it("throws TypeError if bus is not provided", () => {
    expect(() => new DialogueUI(null, { mount, document })).toThrow(TypeError);
  });

  // 14. Constructor: throws if mount is not found and no fallback
  it("throws if mount is null and document has no #app fallback", () => {
    const emptyDoc = {
      createElement: (...args) => document.createElement(...args),
      getElementById: () => null,
      body: null,
      addEventListener: () => {},
    };
    expect(() => new DialogueUI(makeBus(), { mount: null, document: emptyDoc })).toThrow();
  });
});

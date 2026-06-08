/**
 * @jest-environment jsdom
 */
import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { UIBus } from "../ui/UIBus.js";
import { SubtitleLine } from "../ui/SubtitleLine.js";

describe("SubtitleLine", () => {
  let bus;
  let mount;
  let subtitles;

  beforeEach(() => {
    bus = new UIBus();
    mount = document.createElement("div");
    mount.id = "app";
    document.body.appendChild(mount);
    subtitles = new SubtitleLine(bus, { mount, document });
  });

  afterEach(() => {
    subtitles.dispose();
    mount.remove();
  });

  it("mounts a hidden subtitle overlay root", () => {
    const root = mount.querySelector("#subtitle-line");

    expect(root).not.toBeNull();
    expect(root.getAttribute("aria-live")).toBe("polite");
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.dataset.placement).toBe("lower");
    expect(root.dataset.gameInputBlocker).toBe("true");
  });

  it("subtitle:show renders lower-third text and optional speaker", () => {
    bus.emit("subtitle:show", {
      speaker: "Nessa",
      text: "The Hearthmere road remembers every oath.",
      placement: "lower"
    });

    const root = mount.querySelector("#subtitle-line");
    expect(root.classList.contains("subtitle-visible")).toBe(true);
    expect(root.getAttribute("aria-hidden")).toBe("false");
    expect(root.dataset.placement).toBe("lower");
    expect(root.querySelector("[data-subtitle-speaker]").hidden).toBe(false);
    expect(root.querySelector("[data-subtitle-speaker]").textContent).toBe("Nessa");
    expect(root.querySelector("[data-subtitle-text]").textContent).toBe(
      "The Hearthmere road remembers every oath."
    );
  });

  it("supports center placement and hides the speaker when omitted", () => {
    bus.emit("subtitle:show", {
      text: "The gate opens.",
      position: "middle"
    });

    const root = mount.querySelector("#subtitle-line");
    expect(root.dataset.placement).toBe("center");
    expect(root.querySelector("[data-subtitle-speaker]").hidden).toBe(true);
    expect(root.querySelector("[data-subtitle-text]").textContent).toBe("The gate opens.");
  });

  it("subtitle:hide hides without clearing the last rendered line", () => {
    bus.emit("subtitle:show", { text: "Hold." });
    bus.emit("subtitle:hide", {});

    const root = mount.querySelector("#subtitle-line");
    expect(root.classList.contains("subtitle-visible")).toBe(false);
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.querySelector("[data-subtitle-text]").textContent).toBe("Hold.");
    expect(subtitles.isVisible).toBe(false);
  });

  it("empty subtitle text hides the overlay", () => {
    bus.emit("subtitle:show", { text: "Shown first." });
    bus.emit("subtitle:show", { text: "   " });

    const root = mount.querySelector("#subtitle-line");
    expect(root.classList.contains("subtitle-visible")).toBe(false);
    expect(root.getAttribute("aria-hidden")).toBe("true");
  });

  it("dispose removes the root and unsubscribes from UIBus events", () => {
    subtitles.dispose();

    expect(mount.querySelector("#subtitle-line")).toBeNull();
    expect(bus.handlers.size).toBe(0);
    expect(() => {
      bus.emit("subtitle:show", { text: "Ignored." });
      bus.emit("subtitle:hide", {});
    }).not.toThrow();
  });
});

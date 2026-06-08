/**
 * @jest-environment jsdom
 */
import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { UIBus } from "../ui/UIBus.js";
import { Letterbox } from "../ui/Letterbox.js";

describe("Letterbox", () => {
  let bus;
  let mount;
  let letterbox;

  beforeEach(() => {
    bus = new UIBus();
    mount = document.createElement("div");
    mount.id = "app";
    document.body.appendChild(mount);
    letterbox = new Letterbox(bus, { mount, document });
  });

  afterEach(() => {
    letterbox.dispose();
    mount.remove();
  });

  it("mounts an inert cinematic overlay root", () => {
    const root = mount.querySelector("#cutscene-letterbox");

    expect(root).not.toBeNull();
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.dataset.gameInputBlocker).toBe("true");
    expect(root.querySelector(".cutscene-bar--top")).not.toBeNull();
    expect(root.querySelector(".cutscene-bar--bottom")).not.toBeNull();
  });

  it("cinematic:letterbox shows widescreen bars with the requested height", () => {
    bus.emit("cinematic:letterbox", { active: true, height: 0.18 });

    const root = mount.querySelector("#cutscene-letterbox");
    expect(root.classList.contains("cutscene-letterbox-active")).toBe(true);
    expect(root.getAttribute("aria-hidden")).toBe("false");
    expect(root.dataset.letterboxActive).toBe("true");
    expect(root.style.getPropertyValue("--cutscene-letterbox-height")).toBe("18vh");
  });

  it("cinematic:fade renders opacity, color, and transition duration", () => {
    bus.emit("cinematic:fade", {
      active: true,
      opacity: 0.65,
      color: "rgba(10, 8, 6, 1)",
      duration: 0.64
    });

    const root = mount.querySelector("#cutscene-letterbox");
    expect(root.classList.contains("cutscene-fade-active")).toBe(true);
    expect(root.dataset.fadeActive).toBe("true");
    expect(root.style.getPropertyValue("--cutscene-fade-opacity")).toBe("0.65");
    expect(root.style.getPropertyValue("--cutscene-fade-color")).toBe("rgba(10, 8, 6, 1)");
    expect(root.style.getPropertyValue("--cutscene-fade-duration")).toBe("640ms");
  });

  it("also accepts explicit millisecond durations", () => {
    bus.emit("cinematic:fade", {
      active: true,
      opacity: 0.25,
      ms: 375
    });

    const root = mount.querySelector("#cutscene-letterbox");
    expect(root.style.getPropertyValue("--cutscene-fade-duration")).toBe("375ms");
  });

  it("interprets cinematic core fade progress and cleanup payloads", () => {
    bus.emit("cinematic:fade", {
      direction: "out",
      progress: 0.4,
      color: "#101010",
      duration: 0.5
    });

    const root = mount.querySelector("#cutscene-letterbox");
    expect(root.classList.contains("cutscene-fade-active")).toBe(true);
    expect(root.style.getPropertyValue("--cutscene-fade-opacity")).toBe("0.4");

    bus.emit("cinematic:fade", { clear: true });

    expect(root.classList.contains("cutscene-fade-active")).toBe(false);
    expect(root.dataset.fadeActive).toBe("false");
    expect(root.style.getPropertyValue("--cutscene-fade-opacity")).toBe("0");
  });

  it("cinematic:desaturate renders grayscale overlay amount", () => {
    bus.emit("cinematic:desaturate", { active: true, amount: 0.4, duration: 0.12 });

    const root = mount.querySelector("#cutscene-letterbox");
    expect(root.classList.contains("cutscene-desaturate-active")).toBe(true);
    expect(root.dataset.desaturateActive).toBe("true");
    expect(root.style.getPropertyValue("--cutscene-desaturate-amount")).toBe("0.4");
    expect(root.style.getPropertyValue("--cutscene-desaturate-duration")).toBe("120ms");
  });

  it("hides aria state after all overlay effects are disabled", () => {
    bus.emit("cinematic:letterbox", { active: true });
    bus.emit("cinematic:fade", { active: true, opacity: 1 });
    bus.emit("cinematic:desaturate", { active: true, amount: 1 });

    bus.emit("cinematic:letterbox", { active: false });
    bus.emit("cinematic:fade", { active: false });
    bus.emit("cinematic:desaturate", { active: false });

    const root = mount.querySelector("#cutscene-letterbox");
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.dataset.letterboxActive).toBe("false");
    expect(root.dataset.fadeActive).toBe("false");
    expect(root.dataset.desaturateActive).toBe("false");
  });

  it("uses core letterbox enter and cleanup payloads", () => {
    bus.emit("cinematic:letterbox", { enter: true, duration: 0.4 });

    const root = mount.querySelector("#cutscene-letterbox");
    expect(root.dataset.letterboxActive).toBe("true");

    bus.emit("cinematic:letterbox", { enter: false, phase: "cleanup" });

    expect(root.dataset.letterboxActive).toBe("false");
  });

  it("dispose removes the root and unsubscribes from UIBus events", () => {
    letterbox.dispose();

    expect(mount.querySelector("#cutscene-letterbox")).toBeNull();
    expect(bus.handlers.size).toBe(0);
    expect(() => {
      bus.emit("cinematic:letterbox", { active: true });
      bus.emit("cinematic:fade", { active: true });
      bus.emit("cinematic:desaturate", { active: true });
    }).not.toThrow();
  });
});

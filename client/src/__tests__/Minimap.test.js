/**
 * @jest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { Minimap, buildMinimapView } from "../ui/Minimap.js";

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

describe("Minimap helpers", () => {
  it("builds a normalized view from a minimap snapshot", () => {
    const view = buildMinimapView({
      exploredChunks: [
        { chunkX: 0, chunkZ: 0, biome: { id: "hearthmere", name: "Hearthmere" } },
        { x: 1, z: -1, biomeId: "ironvale" }
      ],
      player: { chunkX: 1, chunkZ: -1 },
      hearthlights: [
        { id: "hearthmere.camp", chunkX: 0, chunkZ: 0, discovered: true },
        { id: "hearthmere.hidden", chunkX: 2, chunkZ: 0, discovered: false }
      ],
      worldMapUnlocked: true
    });

    expect(view.currentBiomeName).toBe("Ironvale");
    expect(view.worldMapUnlocked).toBe(true);
    expect(view.chunks).toHaveLength(2);
    expect(view.chunks[0]).toMatchObject({
      chunkX: 0,
      chunkZ: 0,
      biomeId: "hearthmere",
      biomeName: "Hearthmere"
    });
    expect(view.player).toEqual({ chunkX: 1, chunkZ: -1 });
    expect(view.markers.map((marker) => marker.id)).toEqual([
      "hearthmere.camp",
      "hearthmere.hidden"
    ]);
  });
});

describe("Minimap", () => {
  let bus;
  let mount;
  let ui;

  beforeEach(() => {
    bus = makeBus();
    mount = document.createElement("div");
    document.body.appendChild(mount);
    ui = new Minimap(bus, { mount, document });
  });

  afterEach(() => {
    ui.dispose();
    mount.remove();
  });

  it("renders explored chunk tiles, biome label, player indicator, and Hearthlight markers", () => {
    bus.emit("minimap:set", {
      currentBiome: { id: "hearthmere", name: "Hearthmere" },
      exploredChunks: [
        { chunkX: -1, chunkZ: 0, biomeId: "hearthmere" },
        { chunkX: 0, chunkZ: 0, biomeId: "hearthmere" },
        { chunkX: 1, chunkZ: 0, biomeId: "ash_wastes", biomeName: "Ash Wastes" }
      ],
      player: { chunkX: 0, chunkZ: 0 },
      hearthlights: [
        { id: "hearthmere.camp", name: "Camp", chunkX: -1, chunkZ: 0, discovered: true },
        { id: "hearthmere.watch", name: "Watch", chunkX: 1, chunkZ: 0, discovered: false }
      ]
    });

    const root = mount.querySelector("#minimap-ui");
    const tiles = mount.querySelectorAll(".minimap-tile");
    const player = mount.querySelector("[data-minimap-player]");
    const markers = mount.querySelectorAll("[data-minimap-hearthlight-id]");

    expect(root).not.toBeNull();
    expect(root.dataset.gameInputBlocker).toBe("true");
    expect(root.dataset.worldMapUnlocked).toBe("false");
    expect(mount.querySelector("[data-minimap-title]").textContent).toBe("Minimap");
    expect(mount.querySelector("[data-minimap-biome]").textContent).toBe("Hearthmere");
    expect(tiles).toHaveLength(3);
    expect(tiles[0].dataset.chunkX).toBe("-1");
    expect(tiles[2].dataset.biomeName).toBe("Ash Wastes");
    expect(player.hidden).toBe(false);
    expect(player.dataset.chunkX).toBe("0");
    expect(player.style.left).toBe("50%");
    expect(markers).toHaveLength(2);
    expect(markers[0].disabled).toBe(false);
    expect(markers[1].disabled).toBe(true);
    expect(mount.querySelector("[data-minimap-hearthlight-count]").textContent).toBe("1");
  });

  it("renders the world map presentation from minimap payloads and constructor options", () => {
    bus.emit("minimap:set", {
      currentBiomeName: "Hearthmere",
      exploredChunks: [{ chunkX: 0, chunkZ: 0 }],
      worldMapUnlocked: true
    });

    let root = mount.querySelector("#minimap-ui");
    expect(root.dataset.worldMapUnlocked).toBe("true");
    expect(root.getAttribute("aria-label")).toBe("World Map");
    expect(mount.querySelector("[data-minimap-title]").textContent).toBe("World Map");
    expect(mount.querySelector("[data-minimap-map]").getAttribute("aria-label")).toBe(
      "Hearthmere world map"
    );

    ui.dispose();
    ui = new Minimap(bus, { mount, document, worldMapUnlocked: true });
    root = mount.querySelector("#minimap-ui");

    expect(root.dataset.worldMapUnlocked).toBe("true");
    expect(mount.querySelector("[data-minimap-title]").textContent).toBe("World Map");
  });

  it("opens and keeps the world map presentation after worldmap:unlocked", () => {
    const root = mount.querySelector("#minimap-ui");
    ui.close();
    expect(root.hidden).toBe(true);

    bus.emit("worldmap:unlocked", {});

    expect(root.hidden).toBe(false);
    expect(root.getAttribute("aria-hidden")).toBe("false");
    expect(root.dataset.worldMapUnlocked).toBe("true");
    expect(mount.querySelector("[data-minimap-title]").textContent).toBe("World Map");
    expect(bus.events("minimap:opened")).toHaveLength(1);

    bus.emit("minimap:set", {
      currentBiomeName: "Ash Wastes",
      exploredChunks: [{ chunkX: 1, chunkZ: 0 }]
    });

    expect(root.dataset.worldMapUnlocked).toBe("true");
    expect(mount.querySelector("[data-minimap-title]").textContent).toBe("World Map");
    expect(mount.querySelector("[data-minimap-map]").getAttribute("aria-label")).toBe(
      "Ash Wastes world map"
    );
  });

  it("emits fast travel requests only for discovered Hearthlight markers", () => {
    bus.emit("minimap:set", {
      exploredChunks: [{ chunkX: 0, chunkZ: 0, biomeId: "hearthmere" }],
      hearthlights: [
        { id: "hearthmere.camp", name: "Camp", chunkX: 0, chunkZ: 0, discovered: true },
        { id: "hearthmere.hidden", name: "Hidden", chunkX: 1, chunkZ: 0, discovered: false }
      ]
    });

    mount.querySelector('[data-minimap-hearthlight-id="hearthmere.camp"]').click();
    mount.querySelector('[data-minimap-hearthlight-id="hearthmere.hidden"]').click();

    expect(bus.events("minimap:fastTravelRequested")).toHaveLength(1);
    expect(bus.events("minimap:fastTravelRequested")[0]).toMatchObject({
      id: "hearthmere.camp",
      markerId: "hearthmere.camp",
      hearthlightId: "hearthmere.camp",
      chunkX: 0,
      chunkZ: 0
    });
  });

  it("toggles visibility from minimap:toggle events", () => {
    const root = mount.querySelector("#minimap-ui");
    expect(root.hidden).toBe(false);
    expect(root.getAttribute("aria-hidden")).toBe("false");

    bus.emit("minimap:toggle", {});

    expect(root.hidden).toBe(true);
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(bus.events("minimap:closed")).toHaveLength(1);

    bus.emit("minimap:toggle", {});

    expect(root.hidden).toBe(false);
    expect(root.getAttribute("aria-hidden")).toBe("false");
    expect(bus.events("minimap:opened")).toHaveLength(1);
  });

  it("unsubscribes from minimap updates when disposed", () => {
    const root = mount.querySelector("#minimap-ui");
    ui.dispose();

    bus.emit("minimap:set", {
      currentBiomeName: "Should Not Render",
      exploredChunks: [{ chunkX: 0, chunkZ: 0 }]
    });

    expect(root.isConnected).toBe(false);
    expect(mount.querySelector("#minimap-ui")).toBeNull();
    ui = { dispose() {} };
  });
});

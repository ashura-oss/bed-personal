import { describe, expect, it } from "@jest/globals";
import {
  buildMinimapViewModel,
  createMinimapChunkKey,
  createMinimapState,
  discoverHearthlightMarker,
  parseMinimapChunkKey,
  restoreMinimapSnapshot,
  serializeMinimapState,
  updateMinimapFromPlayer,
  worldToChunkPosition
} from "../gameplay/minimap/index.js";

describe("MinimapState", () => {
  it("tracks explored chunks from player positions and current biome samples", () => {
    const biomeSource = {
      biomeAt: (x) => x >= 64
        ? { id: "ironvale", name: "Ironvale" }
        : { id: "hearthmere.plains", label: "Hearthmere Plains" }
    };

    const first = updateMinimapFromPlayer(createMinimapState(), {
      playerPosition: { x: 31.9, y: 2, z: -0.1 },
      biomeSource
    });

    expect(first.exploredChunkKeys).toEqual(["0,-1"]);
    expect(first.currentBiome).toEqual({ id: "hearthmere.plains", label: "Hearthmere Plains" });

    const second = updateMinimapFromPlayer(first, {
      playerPosition: { x: 64, y: 2, z: 32 },
      biomeSource,
      exploreRadius: 1
    });

    expect(second.exploredChunkKeys).toEqual([
      "0,-1", "1,0", "2,0", "3,0",
      "1,1", "2,1", "3,1",
      "1,2", "2,2", "3,2"
    ]);
    expect(second.currentBiome).toEqual({ id: "ironvale", label: "Ironvale" });
  });

  it("discovers Hearthlight markers by id and keeps deterministic marker order", () => {
    const state = discoverHearthlightMarker(
      discoverHearthlightMarker(
        discoverHearthlightMarker(createMinimapState(), {
          id: "hearthlight.camp",
          name: "Road Camp Hearthlight",
          position: { x: 42, y: 1, z: 28 }
        }),
        {
          id: "hearthlight.crypt",
          label: "Crypt Hearthlight",
          origin: { x: -1600, z: 300 }
        }
      ),
      {
        id: "hearthlight.camp",
        name: "Hearthmere Camp",
        position: { x: 40, y: 1, z: 30 }
      }
    );

    expect(state.hearthlights).toEqual([
      {
        id: "hearthlight.camp",
        name: "Hearthmere Camp",
        position: { x: 40, y: 1, z: 30 }
      },
      {
        id: "hearthlight.crypt",
        name: "Crypt Hearthlight",
        position: { x: -1600, y: 0, z: 300 }
      }
    ]);
  });

  it("serializes and restores compact snapshots", () => {
    const state = discoverHearthlightMarker(
      updateMinimapFromPlayer(createMinimapState(), {
        playerPosition: { x: -33, z: 65 },
        currentBiome: { key: "hearthmere.hollow_reach", name: "Hollow's Reach" }
      }),
      { id: "hearthlight.hollow", position: { x: -1000, z: 900 } }
    );
    const snapshot = serializeMinimapState(state);
    const restored = restoreMinimapSnapshot({
      ...snapshot,
      exploredChunkKeys: [...snapshot.exploredChunkKeys, "-2,2", "-2,2"]
    });

    expect(snapshot).toEqual({
      version: 1,
      exploredChunkKeys: ["-2,2"],
      currentBiome: { id: "hearthmere.hollow_reach", label: "Hollow's Reach" },
      hearthlights: [
        {
          id: "hearthlight.hollow",
          name: "Hearthlight",
          position: { x: -1000, y: 0, z: 900 }
        }
      ]
    });
    expect(restored).toEqual(state);
  });

  it("builds a compact DOM minimap view model around the player", () => {
    const state = discoverHearthlightMarker(
      updateMinimapFromPlayer(createMinimapState(), {
        playerPosition: { x: 64, z: 32 },
        currentBiome: { id: "ironvale", label: "Ironvale" },
        exploreRadius: 1
      }),
      { id: "hearthlight.camp", name: "Camp", position: { x: 96, z: 32 } }
    );

    const view = buildMinimapViewModel(state, { x: 64, y: 0, z: 32 }, { radius: 1 });

    expect(view).toMatchObject({
      chunkSize: 32,
      radius: 1,
      diameter: 3,
      center: {
        x: 64,
        y: 0,
        z: 32,
        chunkX: 2,
        chunkZ: 1,
        chunkKey: "2,1"
      },
      currentBiome: { id: "ironvale", label: "Ironvale" }
    });
    expect(view.chunks).toHaveLength(9);
    expect(view.chunks.find((chunk) => chunk.key === "2,1")).toMatchObject({
      offsetX: 0,
      offsetZ: 0,
      explored: true,
      current: true
    });
    expect(view.hearthlights).toEqual([
      {
        id: "hearthlight.camp",
        name: "Camp",
        position: { x: 96, y: 0, z: 32 },
        chunkX: 3,
        chunkZ: 1,
        chunkKey: "3,1",
        offsetX: 1,
        offsetZ: 0,
        visible: true,
        relative: { x: 32, z: 0 },
        distance: 32
      }
    ]);
  });

  it("exposes deterministic chunk helpers for negative world coordinates", () => {
    expect(createMinimapChunkKey(2, -3)).toBe("2,-3");
    expect(parseMinimapChunkKey("2,-3")).toEqual({ chunkX: 2, chunkZ: -3 });
    expect(worldToChunkPosition({ x: -0.1, z: -32 })).toEqual({
      chunkX: -1,
      chunkZ: -1,
      key: "-1,-1"
    });
  });
});

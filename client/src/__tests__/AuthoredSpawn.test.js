import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_AUTHORED_SPAWN_POINT,
  PLAYER_SPAWN_HEIGHT_OFFSET,
  resolveAuthoredSpawnPoint
} from "../world/authored/AuthoredSpawn.js";

describe("AuthoredSpawn", () => {
  it("resolves the requested authored region spawn and samples terrain for player height", () => {
    const authoredMapSource = {
      getSpawnPoint: (regionId) => regionId === "hearthmere"
        ? { x: 12, y: 0, z: -8 }
        : null
    };

    expect(resolveAuthoredSpawnPoint({
      authoredMapSource,
      heightAt: (x, z) => x + z,
      heightOffset: 2
    })).toEqual({
      x: 12,
      y: 6,
      z: -8,
      groundY: 4
    });
  });

  it("falls back to the default Hearthmere spawn when source data is missing or invalid", () => {
    expect(resolveAuthoredSpawnPoint({
      authoredMapSource: {
        getSpawnPoint: () => ({ x: Number.NaN, y: 10, z: 3 })
      },
      heightAt: () => 7
    })).toEqual({
      x: DEFAULT_AUTHORED_SPAWN_POINT.x,
      y: 7 + PLAYER_SPAWN_HEIGHT_OFFSET,
      z: DEFAULT_AUTHORED_SPAWN_POINT.z,
      groundY: 7
    });
  });

  it("falls back to spawn metadata height when terrain sampling is unavailable", () => {
    expect(resolveAuthoredSpawnPoint({
      authoredMapSource: {
        getSpawnPoint: () => ({ x: 4, y: 9, z: 5 })
      },
      heightAt: () => Number.NaN,
      heightOffset: 1
    })).toEqual({
      x: 4,
      y: 10,
      z: 5,
      groundY: 9
    });
  });
});

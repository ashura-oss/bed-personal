import { describe, expect, it } from "@jest/globals";
import { AuthoredPlacementIndex } from "../world/authored/AuthoredPlacementIndex.js";
import { CHUNK_SIZE } from "../world/gen/WorldConfig.js";

function makePlacement(id, type, x, z, extra = {}) {
  return {
    id,
    type,
    tags: [type, id],
    origin: { x, y: 0, z },
    ...extra
  };
}

function makeRegion(id, placements, bounds = { minX: -2500, maxX: 2500, minZ: -2500, maxZ: 2500 }) {
  return {
    id,
    biome: { id: "hearthmere" },
    bounds,
    placements
  };
}

describe("AuthoredPlacementIndex", () => {
  it("groups resource, enemy, prefab, and npc placements by chunk and preserves metadata", () => {
    const placements = [
      makePlacement("resource.timber", "resource", 4, 8, { yieldTable: "timber.basic" }),
      makePlacement("enemy.shambler", "enemy", 16, 24, { level: 3 }),
      makePlacement("prefab.camp", "prefab", 20, 28, { tags: ["hearthmere_camp"] }),
      makePlacement("npc.tessa", "npc", 28, 12, { dialogueId: "tessa_intro" }),
      makePlacement("landmark.fire", "landmark", 8, 4, { marker: true })
    ];
    const index = new AuthoredPlacementIndex(placements);
    const content = index.getContentForChunk(0, 0);

    expect(content).not.toBeNull();
    expect(content?.placements.map(({ id }) => id)).toEqual([
      "resource.timber",
      "enemy.shambler",
      "prefab.camp",
      "npc.tessa",
      "landmark.fire"
    ]);
    expect(index.getPlacementsForChunk(0, 0, { type: "resource" }).map(({ id }) => id)).toEqual([
      "resource.timber"
    ]);
    expect(index.getResourcesForChunk(0, 0).map(({ id }) => id)).toEqual(["resource.timber"]);
    expect(index.getEnemiesForChunk(0, 0).map(({ id }) => id)).toEqual(["enemy.shambler"]);
    expect(index.getPrefabsForChunk(0, 0).map(({ id }) => id)).toEqual(["prefab.camp"]);
    expect(index.getNpcsForChunk(0, 0).map(({ id }) => id)).toEqual(["npc.tessa"]);
    expect(content?.resources.map(({ id }) => id)).toEqual(["resource.timber"]);
    expect(content?.enemies.map(({ id }) => id)).toEqual(["enemy.shambler"]);
    expect(content?.prefabs.map(({ id }) => id)).toEqual(["prefab.camp"]);
    expect(content?.npcs.map(({ id }) => id)).toEqual(["npc.tessa"]);
    expect(content?.placements[0]).toEqual(expect.objectContaining({
      id: "resource.timber",
      yieldTable: "timber.basic",
      chunkX: 0,
      chunkZ: 0
    }));
  });

  it("returns immutable placement arrays, chunk content, and placement objects", () => {
    const index = new AuthoredPlacementIndex([
      makePlacement("resource.edge", "resource", 5, 6, { metadata: { rarity: "common" } })
    ]);
    const content = index.getContentForChunk(0, 0);

    expect(Object.isFrozen(index.placements)).toBe(true);
    expect(Object.isFrozen(content)).toBe(true);
    expect(Object.isFrozen(content?.placements)).toBe(true);
    expect(Object.isFrozen(content?.resources)).toBe(true);
    expect(Object.isFrozen(content?.placements[0])).toBe(true);
    expect(Object.isFrozen(content?.placements[0].origin)).toBe(true);
    expect(Object.isFrozen(content?.placements[0].tags)).toBe(true);
    expect(Object.isFrozen(content?.placements[0].metadata)).toBe(true);
    expect(() => {
      content.resources.push(makePlacement("resource.extra", "resource", 6, 7));
    }).toThrow();
    expect(() => {
      content.placements[0].origin.x = 99;
    }).toThrow();
  });

  it("returns empty arrays for empty chunks and null content summaries", () => {
    const index = new AuthoredPlacementIndex([
      makePlacement("npc.tessa", "npc", 0, 0)
    ]);

    expect(index.getPlacementsForChunk(9, 9)).toEqual([]);
    expect(index.getResourcesForChunk(9, 9)).toEqual([]);
    expect(index.getEnemiesForChunk(9, 9)).toEqual([]);
    expect(index.getPrefabsForChunk(9, 9)).toEqual([]);
    expect(index.getNpcsForChunk(9, 9)).toEqual([]);
    expect(index.getContentForChunk(9, 9)).toBeNull();
  });

  it("indexes a region placement on the authored edge chunk at x=2500", () => {
    const edgeChunkX = Math.floor(2500 / CHUNK_SIZE);
    const region = makeRegion("edge_region", [
      makePlacement("resource.edge", "resource", 2500, 0, { note: "edge" })
    ]);
    const index = new AuthoredPlacementIndex([region]);
    const content = index.getContentForChunk(edgeChunkX, 0);

    expect(edgeChunkX).toBe(78);
    expect(content).not.toBeNull();
    expect(index.getPlacementsForChunk(edgeChunkX, 0).map(({ id }) => id)).toEqual(["resource.edge"]);
    expect(index.getResourcesForChunk(edgeChunkX, 0).map(({ id }) => id)).toEqual(["resource.edge"]);
    expect(index.getPlacementsForChunk(edgeChunkX - 1, 0)).toEqual([]);
    expect(content?.resources[0]).toEqual(expect.objectContaining({
      id: "resource.edge",
      regionId: "edge_region",
      biomeId: "hearthmere",
      note: "edge",
      chunkX: edgeChunkX,
      chunkZ: 0
    }));
  });
});

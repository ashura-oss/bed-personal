import { describe, expect, it } from "@jest/globals";
import { ResourceScatter } from "../world/resources/ResourceScatter.js";
import { getResourcesForBiome } from "../world/resources/ResourceDefinitions.js";

const seed = 1337;
const biomeId = "hearthmere";

// Stub heightAt — flat world at y=0
function heightAt() {
  return 0;
}

function makeScatter(worldSeed = seed) {
  return new ResourceScatter({ worldSeed, biomeMap: null });
}

describe("ResourceScatter", () => {
  it("is deterministic: same seed + chunkX/Z → identical node list", () => {
    const a = makeScatter();
    const b = makeScatter();

    const nodesA = a.getNodesForChunk(0, 0, biomeId, heightAt);
    const nodesB = b.getNodesForChunk(0, 0, biomeId, heightAt);

    expect(nodesA.length).toBe(nodesB.length);
    for (let i = 0; i < nodesA.length; i += 1) {
      expect(nodesA[i].worldX).toBeCloseTo(nodesB[i].worldX, 6);
      expect(nodesA[i].worldZ).toBeCloseTo(nodesB[i].worldZ, 6);
      expect(nodesA[i].definition.id).toBe(nodesB[i].definition.id);
    }
  });

  it("different seeds → different layouts", () => {
    const s1 = makeScatter(1111);
    const s2 = makeScatter(9999);

    const nodes1 = s1.getNodesForChunk(5, 5, biomeId, heightAt);
    const nodes2 = s2.getNodesForChunk(5, 5, biomeId, heightAt);

    // At least one position must differ (extremely unlikely to be identical for any reasonable seed)
    const allSame = nodes1.length === nodes2.length && nodes1.every((n, i) =>
      Math.abs(n.worldX - nodes2[i].worldX) < 0.001 &&
      Math.abs(n.worldZ - nodes2[i].worldZ) < 0.001
    );
    expect(allSame).toBe(false);
  });

  it("all returned definitions are valid for the given biome", () => {
    const scatter = makeScatter();
    const validDefs = getResourcesForBiome(biomeId);
    const validIds = new Set(validDefs.map((d) => d.id));

    const nodes = scatter.getNodesForChunk(2, -3, biomeId, heightAt);
    for (const node of nodes) {
      expect(validIds.has(node.definition.id)).toBe(true);
    }
  });

  it("no two nodes within 3 world units of each other in the same chunk", () => {
    const scatter = makeScatter();
    const MIN_SEP = 3;

    // Test multiple chunks to get confident coverage
    const chunkCoords = [[0, 0], [1, 0], [0, 1], [-1, 2], [3, -2]];
    for (const [cx, cz] of chunkCoords) {
      const nodes = scatter.getNodesForChunk(cx, cz, biomeId, heightAt);
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].worldX - nodes[j].worldX;
          const dz = nodes[i].worldZ - nodes[j].worldZ;
          const dist = Math.sqrt(dx * dx + dz * dz);
          expect(dist).toBeGreaterThanOrEqual(MIN_SEP);
        }
      }
    }
  });

  it("returns between 0 and 8 nodes per chunk", () => {
    const scatter = makeScatter();
    const nodes = scatter.getNodesForChunk(0, 0, biomeId, heightAt);
    expect(nodes.length).toBeGreaterThanOrEqual(0);
    expect(nodes.length).toBeLessThanOrEqual(8);
  });

  it("returns empty array for unknown biome", () => {
    const scatter = makeScatter();
    const nodes = scatter.getNodesForChunk(0, 0, "unknown_biome", heightAt);
    expect(nodes).toEqual([]);
  });

  it("same chunk coordinates with different seeds produce different counts or positions", () => {
    const seeds = [42, 1337, 9876, 54321];
    const results = seeds.map((s) => {
      const scatter = makeScatter(s);
      return scatter.getNodesForChunk(0, 0, biomeId, heightAt);
    });
    // Not all results should be identical
    const firstStr = JSON.stringify(results[0].map((n) => [n.worldX.toFixed(3), n.worldZ.toFixed(3)]));
    const allSame = results.every(
      (r) => JSON.stringify(r.map((n) => [n.worldX.toFixed(3), n.worldZ.toFixed(3)])) === firstStr
    );
    expect(allSame).toBe(false);
  });
});

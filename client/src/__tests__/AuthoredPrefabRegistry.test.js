import { describe, expect, it, jest } from "@jest/globals";
import { AuthoredPrefabRegistry } from "../world/authored/AuthoredPrefabRegistry.js";
import { PREFAB_CATALOGUE } from "../world/authored/PrefabCatalogue.js";
import { CHUNK_SIZE } from "../world/gen/WorldConfig.js";

// ── Mock helpers ──────────────────────────────────────────────────────────────

const OMIT_TAGS = Symbol("omitTags");

function makePlacement(id, tag, x, z) {
  return makePlacementWithTags(id, Object.freeze([tag]), x, z);
}

function makePlacementWithTags(id, tags, x = 100, z = 100) {
  const placement = {
    id,
    type: "prefab",
    origin: Object.freeze({ x, y: 0, z })
  };

  if (tags !== OMIT_TAGS) {
    placement.tags = Array.isArray(tags) ? Object.freeze(tags) : tags;
  }

  return Object.freeze({
    ...placement
  });
}

function makeRegionRegistry(placements) {
  return {
    getRegions() {
      return [
        {
          id: "hearthmere",
          biome: { id: "hearthmere" },
          placements
        }
      ];
    }
  };
}

// Camp is at x=42, z=28 → chunkX=floor(42/32)=1, chunkZ=floor(28/32)=0
const CAMP_PLACEMENT = makePlacement("hearthmere.prefab.camp", "hearthmere_camp", 42, 28);

const FULL_PLACEMENTS = [
  CAMP_PLACEMENT,
  makePlacement("hearthmere.prefab.crypt", "hearthmere_crypt", -1600, 300)
];

describe("AuthoredPrefabRegistry", () => {
  it("constructs without throwing given a valid mock region registry", () => {
    const registry = makeRegionRegistry(FULL_PLACEMENTS);
    expect(() => new AuthoredPrefabRegistry({ regionRegistry: registry })).not.toThrow();
  });

  it("getPrefabAnchors() returns one anchor per prefab placement", () => {
    const registry = makeRegionRegistry(FULL_PLACEMENTS);
    const apr = new AuthoredPrefabRegistry({ regionRegistry: registry });

    expect(apr.getPrefabAnchors().length).toBe(2);
  });

  it("each anchor has the correct shape: id, footprintRadius, build function, origin x/y/z", () => {
    const registry = makeRegionRegistry([CAMP_PLACEMENT]);
    const apr = new AuthoredPrefabRegistry({ regionRegistry: registry });
    const [anchor] = apr.getPrefabAnchors();

    expect(typeof anchor.id).toBe("string");
    expect(typeof anchor.footprintRadius).toBe("number");
    expect(typeof anchor.build).toBe("function");
    expect(Number.isFinite(anchor.origin.x)).toBe(true);
    expect(Number.isFinite(anchor.origin.y)).toBe(true);
    expect(Number.isFinite(anchor.origin.z)).toBe(true);
    expect(anchor.placementId).toBe(CAMP_PLACEMENT.id);
    expect(anchor.placementTags).toEqual(["hearthmere_camp"]);
    expect(anchor.placement).toBe(CAMP_PLACEMENT);
  });

  it("getAnchorById('hearthmere_camp') finds the camp anchor", () => {
    const registry = makeRegionRegistry([CAMP_PLACEMENT]);
    const apr = new AuthoredPrefabRegistry({ regionRegistry: registry });
    const anchor = apr.getAnchorById("hearthmere_camp");

    expect(anchor).not.toBeNull();
    expect(anchor.id).toBe("hearthmere_camp");
    expect(anchor.origin.x).toBe(42);
    expect(anchor.origin.z).toBe(28);
  });

  it("getPlacementsOverlappingChunk(1, 0) returns the camp anchor (x=42,z=28)", () => {
    // camp at x=42, z=28: chunk centre is (32..64, 0..32)
    // footprintRadius=24; origin (42,28) is inside chunk (1,0)
    const registry = makeRegionRegistry([CAMP_PLACEMENT]);
    const apr = new AuthoredPrefabRegistry({ regionRegistry: registry });
    const overlapping = apr.getPlacementsOverlappingChunk(1, 0);

    expect(overlapping.length).toBe(1);
    expect(overlapping[0].id).toBe("hearthmere_camp");
  });

  it("does not return the camp anchor for a distant chunk (10, 10)", () => {
    const registry = makeRegionRegistry([CAMP_PLACEMENT]);
    const apr = new AuthoredPrefabRegistry({ regionRegistry: registry });
    const overlapping = apr.getPlacementsOverlappingChunk(10, 10);

    expect(overlapping.length).toBe(0);
  });

  it("reports and skips placements with an unknown prefab tag (no crash)", () => {
    const badPlacement = makePlacement("bad.prefab", "unknown_tag_xyz", 100, 100);
    const registry = makeRegionRegistry([badPlacement, CAMP_PLACEMENT]);
    const diagnostics = [];
    let apr;

    expect(() => {
      apr = new AuthoredPrefabRegistry({
        regionRegistry: registry,
        onInvalidPlacement: (diagnostic) => diagnostics.push(diagnostic)
      });
    }).not.toThrow();

    // Only the known placement produces an anchor
    expect(apr.getPrefabAnchors().length).toBe(1);
    expect(apr.getPrefabAnchors()[0].id).toBe("hearthmere_camp");
    expect(diagnostics).toEqual([
      expect.objectContaining({
        reason: "unknown-prefab-tag",
        placementId: "bad.prefab",
        tag: "unknown_tag_xyz"
      })
    ]);
  });

  it("trims string prefab tags before catalogue lookup", () => {
    const spacedTagPlacement = makePlacement("hearthmere.prefab.spaced", "  hearthmere_camp  ", 42, 28);
    const diagnostics = [];
    const apr = new AuthoredPrefabRegistry({
      regionRegistry: makeRegionRegistry([spacedTagPlacement]),
      onInvalidPlacement: (diagnostic) => diagnostics.push(diagnostic)
    });

    expect(apr.getPrefabAnchors().length).toBe(1);
    expect(apr.getPrefabAnchors()[0].id).toBe("hearthmere_camp");
    expect(diagnostics).toEqual([]);
  });

  it("reports and skips missing, empty, and malformed prefab tags safely", () => {
    const missingTagPlacement = makePlacementWithTags("bad.prefab.missing", OMIT_TAGS);
    const emptyTagsPlacement = makePlacementWithTags("bad.prefab.empty-array", []);
    const emptyTagPlacement = makePlacementWithTags("bad.prefab.empty-tag", [""]);
    const malformedTagPlacement = makePlacementWithTags("bad.prefab.malformed-tag", [42]);
    const registry = makeRegionRegistry([
      missingTagPlacement,
      emptyTagsPlacement,
      emptyTagPlacement,
      malformedTagPlacement,
      CAMP_PLACEMENT
    ]);
    const diagnostics = [];
    const apr = new AuthoredPrefabRegistry({
      regionRegistry: registry,
      onInvalidPlacement: (diagnostic) => diagnostics.push(diagnostic)
    });

    expect(apr.getPrefabAnchors().length).toBe(1);
    expect(apr.getPrefabAnchors()[0].id).toBe("hearthmere_camp");
    expect(diagnostics).toEqual([
      expect.objectContaining({
        reason: "missing-prefab-tag",
        placementId: "bad.prefab.missing",
        tag: null
      }),
      expect.objectContaining({
        reason: "missing-prefab-tag",
        placementId: "bad.prefab.empty-array",
        tag: null
      }),
      expect.objectContaining({
        reason: "empty-prefab-tag",
        placementId: "bad.prefab.empty-tag",
        tag: ""
      }),
      expect.objectContaining({
        reason: "malformed-prefab-tag",
        placementId: "bad.prefab.malformed-tag",
        tag: 42
      })
    ]);
  });

  it("warns with placement id and tag when no invalid-placement callback is provided", () => {
    const badPlacement = makePlacement("bad.prefab", "unknown_tag_xyz", 100, 100);
    const registry = makeRegionRegistry([badPlacement]);
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const apr = new AuthoredPrefabRegistry({ regionRegistry: registry });

      expect(apr.getPrefabAnchors().length).toBe(0);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('id="bad.prefab" tag="unknown_tag_xyz"'),
        expect.objectContaining({
          reason: "unknown-prefab-tag",
          placementId: "bad.prefab",
          tag: "unknown_tag_xyz"
        })
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("uses heightSource.getHeightAt to set origin.y when provided", () => {
    const heightSource = { getHeightAt: () => 7.5 };
    const registry = makeRegionRegistry([CAMP_PLACEMENT]);
    const apr = new AuthoredPrefabRegistry({ regionRegistry: registry, heightSource });
    const anchor = apr.getAnchorById("hearthmere_camp");

    expect(anchor.origin.y).toBe(7.5);
    expect(anchor.padHeight).toBe(7.5);
  });

  it("supports the terrain stack height-source aliases", () => {
    const registry = makeRegionRegistry([CAMP_PLACEMENT]);
    const functionSource = new AuthoredPrefabRegistry({
      regionRegistry: registry,
      heightSource: () => 6
    });
    const heightAtSource = new AuthoredPrefabRegistry({
      regionRegistry: registry,
      heightSource: { heightAt: () => 7 }
    });
    const sampleHeightSource = new AuthoredPrefabRegistry({
      regionRegistry: registry,
      heightSource: { sampleHeight: () => 8 }
    });

    expect(functionSource.getAnchorById("hearthmere_camp").origin.y).toBe(6);
    expect(heightAtSource.getAnchorById("hearthmere_camp").origin.y).toBe(7);
    expect(sampleHeightSource.getAnchorById("hearthmere_camp").origin.y).toBe(8);
  });

  it("anchor footprintRadius matches PrefabCatalogue definition", () => {
    const registry = makeRegionRegistry([CAMP_PLACEMENT]);
    const apr = new AuthoredPrefabRegistry({ regionRegistry: registry });
    const anchor = apr.getAnchorById("hearthmere_camp");

    expect(anchor.footprintRadius).toBe(PREFAB_CATALOGUE.hearthmere_camp.footprintRadius);
  });

  it("chunk boundary: chunk size is " + CHUNK_SIZE + " world units", () => {
    // Sanity check that the CHUNK_SIZE constant used in overlap logic is correct
    expect(CHUNK_SIZE).toBe(32);
  });
});

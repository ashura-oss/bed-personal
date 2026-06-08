import { describe, expect, it } from "@jest/globals";
import {
  GENERATED_ART,
  ORIGINAL,
  getLicensedAssets
} from "../assets/AssetManifest.js";

describe("AssetManifest", () => {
  it("tracks generated Hearthmere art as original release-bound assets", () => {
    const generatedAssets = Object.values(GENERATED_ART);
    const generatedIds = generatedAssets.map((asset) => asset.id);

    expect(generatedIds).toEqual(expect.arrayContaining([
      "generated.hearthmere.resource_nodes",
      "generated.hearthmere.npc_silhouettes",
      "generated.hearthmere.enemy_silhouettes",
      "generated.hearthmere.hearthlight_shrine",
      "generated.hearthmere.boss_path_prefabs",
      "generated.hearthmere.boss_arena",
      "generated.hearthmere.hollowbound_caravan_guard",
      "generated.hearthmere.procedural_sfx",
      "generated.hearthmere.procedural_score"
    ]));
    for (const asset of generatedAssets) {
      expect(asset.id).toMatch(/^generated\.hearthmere\./);
      expect(typeof asset.module).toBe("string");
      expect(asset.license).toBe(ORIGINAL);
    }
  });

  it("does not report original generated art as third-party licensed assets", () => {
    expect(getLicensedAssets()).toEqual([]);
  });
});

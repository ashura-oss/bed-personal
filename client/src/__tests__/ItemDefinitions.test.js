import { describe, expect, it } from "@jest/globals";
import {
  ITEM_DEFINITIONS,
  MATERIAL_ITEM_IDS,
  assertKnownItemId,
  getItemDefinition,
  hasItemDefinition
} from "../gameplay/items/ItemDefinitions.js";
import { RESOURCE_DEFINITIONS } from "../world/resources/ResourceDefinitions.js";

describe("ItemDefinitions", () => {
  it("covers the authored material ids from resource yields", () => {
    const yieldedItemIds = new Set(RESOURCE_DEFINITIONS.map((definition) => definition.yield.itemId));

    expect(MATERIAL_ITEM_IDS).toEqual(expect.arrayContaining(["timber", "iron_ore", "ashleaf", "ember_shard"]));

    for (const itemId of yieldedItemIds) {
      expect(hasItemDefinition(itemId)).toBe(true);
    }
  });

  it("exposes the required metadata fields for materials and crafted outputs", () => {
    for (const definition of ITEM_DEFINITIONS) {
      expect(typeof definition.id).toBe("string");
      expect(typeof definition.name).toBe("string");
      expect(typeof definition.category).toBe("string");
      expect(typeof definition.rarity).toBe("string");
      expect(typeof definition.description).toBe("string");
      expect(typeof definition.flavorText).toBe("string");
      expect(Number.isInteger(definition.stackSize)).toBe(true);
      expect(definition.stackSize).toBeGreaterThan(0);
    }

    expect(getItemDefinition("hearthlight_hatchet")).toMatchObject({
      id: "hearthlight_hatchet",
      category: "weapon",
      stackSize: 1
    });

    expect(getItemDefinition("ashleaf_poultice")).toMatchObject({
      id: "ashleaf_poultice",
      category: "consumable"
    });

    expect(getItemDefinition("ember_shard")).toMatchObject({
      id: "ember_shard",
      category: "material"
    });
  });

  it("returns null for unknown ids and throws when a known id is required", () => {
    expect(getItemDefinition("missing_item")).toBeNull();
    expect(() => assertKnownItemId("missing_item")).toThrow(RangeError);
  });

  it("normalizes whitespace around known ids", () => {
    expect(getItemDefinition(" timber ")?.id).toBe("timber");
    expect(assertKnownItemId(" iron_ore ").id).toBe("iron_ore");
  });
});

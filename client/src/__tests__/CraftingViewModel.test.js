import { describe, expect, it } from "@jest/globals";
import { CraftingSystem } from "../gameplay/crafting/CraftingSystem.js";
import {
  buildCraftingRecipeViews,
  countInventoryItem,
  describeCraftingResult
} from "../gameplay/crafting/CraftingViewModel.js";
import { Inventory } from "../gameplay/items/Inventory.js";

describe("CraftingViewModel", () => {
  it("counts inventory stacks across slots", () => {
    const inventory = new Inventory();
    inventory.addItem("timber", 4);

    expect(countInventoryItem(inventory, "timber")).toBe(4);
    expect(countInventoryItem(inventory, "iron_ore")).toBe(0);
  });

  it("builds UI-ready recipe views from live inventory state", () => {
    const inventory = new Inventory();
    inventory.addItem("timber", 3);
    inventory.addItem("iron_ore", 2);
    inventory.addItem("ashleaf", 1);

    const views = buildCraftingRecipeViews(new CraftingSystem({ inventory, hearthlightTier: 1 }));
    const hatchet = views.find((recipe) => recipe.id === "hearthlight_hatchet");
    const poultice = views.find((recipe) => recipe.id === "ashleaf_poultice");

    expect(hatchet).toMatchObject({
      id: "hearthlight_hatchet",
      category: "Gear",
      canCraft: true,
      output: { itemId: "hearthlight_hatchet", name: "Hearthlight Hatchet", count: 1 }
    });
    expect(hatchet.ingredients).toEqual([
      { itemId: "timber", name: "Timber", count: 3, available: 3, isAvailable: true },
      { itemId: "iron_ore", name: "Iron Ore", count: 2, available: 2, isAvailable: true }
    ]);
    expect(poultice.canCraft).toBe(false);
    expect(poultice.availabilityText).toBe("Missing 2x Ashleaf.");
  });

  it("describes successful and failed craft results for menu feedback", () => {
    const inventory = new Inventory();
    inventory.addItem("timber", 3);
    inventory.addItem("iron_ore", 2);

    const system = new CraftingSystem({ inventory, hearthlightTier: 1 });
    expect(describeCraftingResult(system.canCraft("ashleaf_poultice"))).toBe("Missing 3x Ashleaf.");
    expect(describeCraftingResult(system.craft("hearthlight_hatchet"))).toBe("Crafted 1x Hearthlight Hatchet.");
  });
});

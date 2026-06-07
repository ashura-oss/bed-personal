import { describe, expect, it } from "@jest/globals"
import { CraftingSystem, evaluateCraftingRecipe, recipeCanCraft } from "../gameplay/crafting/CraftingSystem.js"
import { Inventory, INVENTORY_MAX_SLOTS } from "../gameplay/items/Inventory.js"

function createFullInventorySerialization() {
  return [
    { itemId: "timber", count: 10 },
    { itemId: "iron_ore", count: 10 },
    ...Array.from({ length: INVENTORY_MAX_SLOTS - 2 }, () => ({ itemId: "ashleaf", count: 1 }))
  ]
}

describe("CraftingSystem", () => {
  it("crafts atomically when inputs, requirements, and capacity all pass", () => {
    const inventory = new Inventory()
    inventory.addItem("timber", 3)
    inventory.addItem("iron_ore", 2)

    const system = new CraftingSystem({ inventory, hearthlightTier: 1 })
    const craftable = system.canCraft("hearthlight_hatchet")
    const result = system.craft("hearthlight_hatchet")

    expect(craftable).toMatchObject({ ok: true, code: "craftable", recipeId: "hearthlight_hatchet" })
    expect(result).toMatchObject({ ok: true, code: "crafted", recipeId: "hearthlight_hatchet" })
    expect(inventory.toJSON()).toEqual([{ itemId: "hearthlight_hatchet", count: 1 }])
  })

  it("does not mutate inventory when required inputs are missing", () => {
    const inventory = new Inventory()
    inventory.addItem("timber", 3)

    const before = inventory.toJSON()
    const result = new CraftingSystem({ inventory, hearthlightTier: 1 }).craft("hearthlight_hatchet")

    expect(result).toMatchObject({
      ok: false,
      code: "missing_inputs",
      recipeId: "hearthlight_hatchet"
    })
    expect(result.missingInputs).toEqual([
      { itemId: "iron_ore", requiredCount: 2, availableCount: 0, missingCount: 2 }
    ])
    expect(inventory.toJSON()).toEqual(before)
  })

  it("does not mutate inventory when the output cannot fit after consuming inputs", () => {
    const inventory = Inventory.fromJSON(createFullInventorySerialization())
    const before = inventory.toJSON()

    const evaluation = evaluateCraftingRecipe("hearthlight_hatchet", inventory, { hearthlightTier: 1 })
    const result = new CraftingSystem({ inventory, hearthlightTier: 1 }).craft("hearthlight_hatchet")

    expect(evaluation).toMatchObject({
      ok: false,
      code: "output_blocked",
      recipeId: "hearthlight_hatchet"
    })
    expect(recipeCanCraft("hearthlight_hatchet", inventory, { hearthlightTier: 1 })).toBe(false)
    expect(result).toMatchObject({
      ok: false,
      code: "output_blocked",
      recipeId: "hearthlight_hatchet"
    })
    expect(inventory.toJSON()).toEqual(before)
  })

  it("enforces the hearthlight tier requirement without mutating inventory", () => {
    const inventory = new Inventory()
    inventory.addItem("timber", 3)
    inventory.addItem("iron_ore", 2)

    const before = inventory.toJSON()
    const result = new CraftingSystem({ inventory, hearthlightTier: 0 }).craft("hearthlight_hatchet")

    expect(result).toMatchObject({
      ok: false,
      code: "requires_hearthlight_tier",
      hearthlightTier: 0,
      requiredHearthlightTier: 1,
      recipeId: "hearthlight_hatchet"
    })
    expect(inventory.toJSON()).toEqual(before)
  })
})

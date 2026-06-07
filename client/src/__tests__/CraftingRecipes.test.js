import { describe, expect, it } from "@jest/globals"
import { getItemDefinition } from "../gameplay/items/ItemDefinitions.js"
import {
  CRAFTING_RECIPES,
  assertKnownRecipeId,
  getRecipeDefinition,
  hasRecipeDefinition,
  listCraftingRecipes
} from "../gameplay/crafting/CraftingRecipes.js"
import { getResourcesForBiome } from "../world/resources/ResourceDefinitions.js"

describe("CraftingRecipes", () => {
  it("exposes a frozen catalogue with known item ids and stable shapes", () => {
    expect(Object.isFrozen(CRAFTING_RECIPES)).toBe(true)
    expect(CRAFTING_RECIPES).toHaveLength(2)

    for (const recipe of CRAFTING_RECIPES) {
      expect(Object.isFrozen(recipe)).toBe(true)
      expect(Object.isFrozen(recipe.inputs)).toBe(true)
      expect(Object.isFrozen(recipe.output)).toBe(true)
      expect(Object.isFrozen(recipe.requires)).toBe(true)
      expect(typeof recipe.id).toBe("string")
      expect(typeof recipe.name).toBe("string")
      expect(typeof recipe.description).toBe("string")
      expect(typeof recipe.category).toBe("string")
      expect(recipe.inputs.length).toBeGreaterThan(0)

      for (const input of recipe.inputs) {
        expect(getItemDefinition(input.itemId)?.id).toBe(input.itemId)
        expect(Number.isInteger(input.count)).toBe(true)
        expect(input.count).toBeGreaterThan(0)
      }

      expect(getItemDefinition(recipe.output.itemId)?.id).toBe(recipe.output.itemId)
      expect(Number.isInteger(recipe.output.count)).toBe(true)
      expect(recipe.output.count).toBeGreaterThan(0)
      expect(recipe.requires.hearthlightTier).toBeGreaterThanOrEqual(1)
    }
  })

  it("lists and resolves recipe ids with whitespace normalization", () => {
    expect(listCraftingRecipes()).toBe(CRAFTING_RECIPES)
    expect(hasRecipeDefinition("hearthlight_hatchet")).toBe(true)
    expect(getRecipeDefinition(" ashleaf_poultice ")?.id).toBe("ashleaf_poultice")
    expect(assertKnownRecipeId(" hearthlight_hatchet ").id).toBe("hearthlight_hatchet")
    expect(getRecipeDefinition("missing_recipe")).toBeNull()
    expect(() => assertKnownRecipeId("missing_recipe")).toThrow(RangeError)
  })

  it("keeps tier-one recipes craftable from Hearthmere resource yields", () => {
    const hearthmereItemIds = new Set(getResourcesForBiome("hearthmere").map((definition) => definition.yield.itemId))
    const tierOneRecipes = CRAFTING_RECIPES.filter((recipe) => recipe.requires.hearthlightTier === 1)

    for (const recipe of tierOneRecipes) {
      for (const input of recipe.inputs) {
        expect(hearthmereItemIds.has(input.itemId)).toBe(true)
      }
    }
  })
})

import { describe, expect, it } from "@jest/globals";
import {
  buildRecipeDetailView,
  buildRecipeView,
  buildRecipeViews,
  formatIngredientCount,
  resolveCraftingSelection,
  summarizeRecipeAvailability
} from "../ui/CraftingMenu.js";

describe("CraftingMenu helpers", () => {
  it("formats ingredient counts with unknown availability fallback", () => {
    expect(formatIngredientCount(4, 6)).toBe("4 / 6");
    expect(formatIngredientCount(null, 3)).toBe("-- / 3");
    expect(formatIngredientCount(undefined, 0)).toBe("0 / 0");
  });

  it("builds recipe availability with pending ingredient counts when availability is missing", () => {
    const recipeView = buildRecipeView({
      id: "ash_poultice",
      name: "Ash Poultice",
      description: "A warm wrap for cuts taken on wet stone.",
      output: { itemId: "ash_poultice", name: "Ash Poultice", count: 2 },
      ingredients: [
        { itemId: "ashleaf", name: "Ashleaf", required: 3, available: 5 },
        { itemId: "linen_strip", name: "Linen Strip", required: 1 }
      ]
    });

    expect(recipeView.outputSummary).toBe("2x Ash Poultice");
    expect(recipeView.ingredients[1]).toMatchObject({
      ingredientId: "linen_strip",
      label: "Linen Strip",
      countText: "-- / 1",
      isAvailabilityKnown: false,
      isAvailable: false,
      statusTone: "unknown",
      statusLabel: "Awaiting"
    });
    expect(recipeView.availability).toMatchObject({
      readyCount: 1,
      unknownCount: 1,
      missingCount: 0,
      canCraft: false,
      tone: "unknown",
      ingredientSummaryText: "1/2 ingredients ready",
      statusText: "Availability pending for 1 ingredient"
    });
  });

  it("falls back to the first craftable recipe when the requested selection is invalid", () => {
    const recipeViews = buildRecipeViews([
      {
        id: "charcloth",
        name: "Charcloth",
        output: { itemId: "charcloth", name: "Charcloth", count: 1 },
        ingredients: [{ itemId: "cloth", required: 2, available: 1 }]
      },
      {
        id: "hearth_tonic",
        name: "Hearth Tonic",
        output: { itemId: "hearth_tonic", name: "Hearth Tonic", count: 1 },
        ingredients: [{ itemId: "ember_coal", required: 1, available: 1 }]
      }
    ]);

    expect(resolveCraftingSelection(recipeViews, "missing-id")).toBe(1);
    expect(resolveCraftingSelection(recipeViews, 0)).toBe(0);
    expect(resolveCraftingSelection(recipeViews, 99, "charcloth")).toBe(0);
  });

  it("summarizes recipe details for selected craftables and shortages", () => {
    const recipeView = buildRecipeView({
      id: "ember_salve",
      name: "Ember Salve",
      category: "Field Remedy",
      summary: "Seals minor fractures with a warm resin paste.",
      output: { itemId: "ember_salve", name: "Ember Salve", count: 1 },
      ingredients: [
        { itemId: "pine_resin", name: "Pine Resin", required: 2, available: 2 },
        { itemId: "ashleaf", name: "Ashleaf", required: 1, available: 0 }
      ]
    });
    const detail = buildRecipeDetailView(recipeView);

    expect(detail).toMatchObject({
      recipeId: "ember_salve",
      title: "Ember Salve",
      category: "Field Remedy",
      outputSummary: "1x Ember Salve",
      outputCountText: "x1",
      description: "Seals minor fractures with a warm resin paste.",
      ingredientSummaryText: "1/2 ingredients ready",
      availabilityText: "1 ingredient short",
      availabilityTone: "missing",
      notes: "Gather the missing reagents before requesting this craft.",
      canCraft: false
    });
    expect(detail.ingredients.map((ingredient) => ingredient.label)).toEqual([
      "Pine Resin",
      "Ashleaf"
    ]);
  });

  it("accepts normalized ingredient lists in availability summaries", () => {
    const summary = summarizeRecipeAvailability([
      { label: "Timber", countText: "2 / 2", isAvailabilityKnown: true, isAvailable: true },
      { label: "Coal", countText: "-- / 1", isAvailabilityKnown: false, isAvailable: false }
    ]);

    expect(summary).toMatchObject({
      totalIngredients: 2,
      readyCount: 1,
      unknownCount: 1,
      missingCount: 0,
      canCraft: false,
      ingredientSummaryText: "1/2 ingredients ready",
      statusText: "Availability pending for 1 ingredient"
    });
  });
});

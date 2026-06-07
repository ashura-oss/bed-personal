import { getItemDefinition } from "../items/ItemDefinitions.js";

function titleCase(value) {
  if (typeof value !== "string" || value.length === 0) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function itemName(itemId) {
  return getItemDefinition(itemId)?.name ?? itemId;
}

function formatItemStack(stack) {
  if (!stack?.itemId) return "unknown item";
  const count = Number.isInteger(stack.count) ? stack.count : 1;
  return `${count}x ${itemName(stack.itemId)}`;
}

export function countInventoryItem(inventory, itemId) {
  if (!inventory || typeof inventory.getSlots !== "function") {
    return 0;
  }

  return inventory.getSlots().reduce((total, slot) => {
    return slot.itemId === itemId ? total + slot.count : total;
  }, 0);
}

export function describeCraftingResult(result) {
  if (!result) return "Crafting request could not be resolved.";

  if (result.ok) {
    return `Crafted ${formatItemStack(result.produced)}.`;
  }

  if (result.code === "missing_inputs") {
    const missingText = Array.isArray(result.missingInputs) && result.missingInputs.length > 0
      ? result.missingInputs
        .map((input) => `${input.missingCount}x ${itemName(input.itemId)}`)
        .join(", ")
      : "required ingredients";
    return `Missing ${missingText}.`;
  }

  if (result.code === "requires_hearthlight_tier") {
    return `Requires Hearthlight tier ${result.requiredHearthlightTier}.`;
  }

  if (result.code === "output_blocked") {
    return "Inventory has no room for the crafted output.";
  }

  return "Crafting is unavailable.";
}

export function buildCraftingRecipeView(recipe, inventory, evaluation = null) {
  const outputDef = getItemDefinition(recipe.output.itemId);
  const ingredients = recipe.inputs.map((input) => {
    const definition = getItemDefinition(input.itemId);
    const available = countInventoryItem(inventory, input.itemId);

    return {
      itemId: input.itemId,
      name: definition?.name ?? input.itemId,
      count: input.count,
      available,
      isAvailable: available >= input.count
    };
  });

  return {
    id: recipe.id,
    name: recipe.name,
    category: titleCase(recipe.category),
    description: recipe.description,
    notes: evaluation && !evaluation.ok ? describeCraftingResult(evaluation) : "",
    ingredients,
    output: {
      itemId: recipe.output.itemId,
      name: outputDef?.name ?? recipe.output.itemId,
      count: recipe.output.count
    },
    requires: recipe.requires,
    canCraft: Boolean(evaluation?.ok),
    availabilityText: evaluation ? describeCraftingResult(evaluation) : "Availability pending"
  };
}

export function buildCraftingRecipeViews(craftingSystem) {
  if (!craftingSystem || typeof craftingSystem.listRecipes !== "function") {
    return [];
  }

  return craftingSystem.listRecipes().map((recipe) => {
    return buildCraftingRecipeView(recipe, craftingSystem.inventory, craftingSystem.canCraft(recipe.id));
  });
}

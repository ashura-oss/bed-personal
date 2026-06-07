import { assertKnownItemId } from "../items/ItemDefinitions.js"

function normalizeRecipeId(recipeId) {
  return typeof recipeId === "string" ? recipeId.trim() : ""
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`)
  }

  return value.trim()
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer`)
  }

  return value
}

function freezeIngredient(entry, label) {
  const definition = assertKnownItemId(entry?.itemId)
  return Object.freeze({
    itemId: definition.id,
    count: assertPositiveInteger(entry?.count, `${label} count`)
  })
}

function freezeRequires(requires = {}, recipeId) {
  if (requires == null || typeof requires !== "object" || Array.isArray(requires)) {
    throw new TypeError(`Recipe "${recipeId}" requires must be an object when provided`)
  }

  const normalized = {}

  if (requires.hearthlightTier != null) {
    normalized.hearthlightTier = assertPositiveInteger(
      requires.hearthlightTier,
      `Recipe "${recipeId}" hearthlightTier`
    )
  }

  return Object.freeze(normalized)
}

function assertUniqueInputIds(inputs, recipeId) {
  const seen = new Set()

  for (const input of inputs) {
    if (seen.has(input.itemId)) {
      throw new RangeError(`Recipe "${recipeId}" lists "${input.itemId}" more than once`)
    }

    seen.add(input.itemId)
  }

  return inputs
}

function createRecipeDefinition({
  id,
  name,
  description,
  category,
  inputs,
  output,
  requires
}) {
  const normalizedId = normalizeRecipeId(id)

  if (!normalizedId) {
    throw new TypeError("Crafting recipes require a non-empty id")
  }

  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new RangeError(`Recipe "${normalizedId}" requires at least one input`)
  }

  const normalizedInputs = Object.freeze(
    assertUniqueInputIds(
      inputs.map((entry, index) => freezeIngredient(entry, `Recipe "${normalizedId}" input ${index}`)),
      normalizedId
    )
  )

  return Object.freeze({
    id: normalizedId,
    name: assertNonEmptyString(name, `Recipe "${normalizedId}" name`),
    description: assertNonEmptyString(description, `Recipe "${normalizedId}" description`),
    category: assertNonEmptyString(category, `Recipe "${normalizedId}" category`),
    inputs: normalizedInputs,
    output: freezeIngredient(output, `Recipe "${normalizedId}" output`),
    requires: freezeRequires(requires, normalizedId)
  })
}

export const CRAFTING_RECIPES = Object.freeze([
  createRecipeDefinition({
    id: "hearthlight_hatchet",
    name: "Forge Hearthlight Hatchet",
    description: "Bind timber and iron into a compact road-forge hatchet for field work and close defense.",
    category: "gear",
    inputs: [
      { itemId: "timber", count: 3 },
      { itemId: "iron_ore", count: 2 }
    ],
    output: { itemId: "hearthlight_hatchet", count: 1 },
    requires: { hearthlightTier: 1 }
  }),
  createRecipeDefinition({
    id: "ashleaf_poultice",
    name: "Wrap Ashleaf Poultice",
    description: "Crush gathered ashleaf into a bitter field dressing that keeps wounds from slowing the march.",
    category: "remedy",
    inputs: [
      { itemId: "ashleaf", count: 3 }
    ],
    output: { itemId: "ashleaf_poultice", count: 1 },
    requires: { hearthlightTier: 1 }
  })
])

const CRAFTING_RECIPE_MAP = new Map(CRAFTING_RECIPES.map((recipe) => [recipe.id, recipe]))

export function listCraftingRecipes() {
  return CRAFTING_RECIPES
}

export function getRecipeDefinition(recipeId) {
  const normalizedId = normalizeRecipeId(recipeId)
  return normalizedId ? CRAFTING_RECIPE_MAP.get(normalizedId) ?? null : null
}

export function hasRecipeDefinition(recipeId) {
  return getRecipeDefinition(recipeId) !== null
}

export function assertKnownRecipeId(recipeId) {
  const normalizedId = normalizeRecipeId(recipeId)

  if (!normalizedId) {
    throw new TypeError("Recipe id must be a non-empty string")
  }

  const recipe = CRAFTING_RECIPE_MAP.get(normalizedId)

  if (!recipe) {
    throw new RangeError(`Unknown recipe id: ${normalizedId}`)
  }

  return recipe
}

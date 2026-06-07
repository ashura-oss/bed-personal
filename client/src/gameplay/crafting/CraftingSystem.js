import { Inventory } from "../items/Inventory.js"
import { assertKnownRecipeId, listCraftingRecipes } from "./CraftingRecipes.js"

const DEFAULT_HEARTHLIGHT_TIER = 1

function assertInventory(inventory) {
  if (!(inventory instanceof Inventory)) {
    throw new TypeError("CraftingSystem requires an Inventory instance")
  }

  return inventory
}

function normalizeHearthlightTier(hearthlightTier = DEFAULT_HEARTHLIGHT_TIER) {
  if (!Number.isInteger(hearthlightTier) || hearthlightTier < 0) {
    throw new RangeError("Hearthlight tier must be a non-negative integer")
  }

  return hearthlightTier
}

function getInventoryItemCount(inventory, itemId) {
  return inventory.getSlots().reduce((total, slot) => {
    return slot.itemId === itemId ? total + slot.count : total
  }, 0)
}

function buildMissingInputs(recipe, inventory) {
  const missingInputs = []

  for (const input of recipe.inputs) {
    const availableCount = getInventoryItemCount(inventory, input.itemId)
    if (availableCount >= input.count) continue

    missingInputs.push(Object.freeze({
      itemId: input.itemId,
      requiredCount: input.count,
      availableCount,
      missingCount: input.count - availableCount
    }))
  }

  return Object.freeze(missingInputs)
}

function buildResult({
  ok,
  code,
  recipe,
  hearthlightTier,
  missingInputs = Object.freeze([])
}) {
  const requiredHearthlightTier = recipe.requires.hearthlightTier ?? 0

  return Object.freeze({
    ok,
    code,
    recipeId: recipe.id,
    recipe,
    hearthlightTier,
    requiredHearthlightTier,
    missingInputs,
    consumed: recipe.inputs,
    produced: recipe.output
  })
}

function buildSimulationInventory(inventory) {
  return Inventory.fromJSON(inventory.toJSON())
}

export function evaluateCraftingRecipe(recipeId, inventory, options = {}) {
  const recipe = assertKnownRecipeId(recipeId)
  const normalizedInventory = assertInventory(inventory)
  const hearthlightTier = normalizeHearthlightTier(options.hearthlightTier)
  const requiredHearthlightTier = recipe.requires.hearthlightTier ?? 0

  if (hearthlightTier < requiredHearthlightTier) {
    return buildResult({
      ok: false,
      code: "requires_hearthlight_tier",
      recipe,
      hearthlightTier
    })
  }

  const missingInputs = buildMissingInputs(recipe, normalizedInventory)

  if (missingInputs.length > 0) {
    return buildResult({
      ok: false,
      code: "missing_inputs",
      recipe,
      hearthlightTier,
      missingInputs
    })
  }

  const simulatedInventory = buildSimulationInventory(normalizedInventory)

  for (const input of recipe.inputs) {
    if (!simulatedInventory.removeItem(input.itemId, input.count)) {
      return buildResult({
        ok: false,
        code: "missing_inputs",
        recipe,
        hearthlightTier,
        missingInputs: buildMissingInputs(recipe, normalizedInventory)
      })
    }
  }

  if (!simulatedInventory.addItem(recipe.output.itemId, recipe.output.count)) {
    return buildResult({
      ok: false,
      code: "output_blocked",
      recipe,
      hearthlightTier
    })
  }

  return buildResult({
    ok: true,
    code: "craftable",
    recipe,
    hearthlightTier
  })
}

export function recipeCanCraft(recipeId, inventory, options = {}) {
  return evaluateCraftingRecipe(recipeId, inventory, options).ok
}

export class CraftingSystem {
  constructor({ inventory, hearthlightTier = DEFAULT_HEARTHLIGHT_TIER } = {}) {
    this._inventory = assertInventory(inventory)
    this._hearthlightTier = normalizeHearthlightTier(hearthlightTier)
  }

  get inventory() {
    return this._inventory
  }

  get hearthlightTier() {
    return this._hearthlightTier
  }

  setHearthlightTier(hearthlightTier) {
    this._hearthlightTier = normalizeHearthlightTier(hearthlightTier)
    return this
  }

  listRecipes() {
    return listCraftingRecipes()
  }

  canCraft(recipeId, options = {}) {
    return evaluateCraftingRecipe(recipeId, this._inventory, {
      hearthlightTier: options.hearthlightTier ?? this._hearthlightTier
    })
  }

  craft(recipeId, options = {}) {
    const hearthlightTier = options.hearthlightTier ?? this._hearthlightTier
    const evaluation = evaluateCraftingRecipe(recipeId, this._inventory, { hearthlightTier })

    if (!evaluation.ok) {
      return evaluation
    }

    const snapshot = this._inventory.toJSON()

    for (const input of evaluation.recipe.inputs) {
      if (!this._inventory.removeItem(input.itemId, input.count)) {
        this._inventory.fromJSON(snapshot)
        return buildResult({
          ok: false,
          code: "missing_inputs",
          recipe: evaluation.recipe,
          hearthlightTier: normalizeHearthlightTier(hearthlightTier),
          missingInputs: buildMissingInputs(evaluation.recipe, this._inventory)
        })
      }
    }

    if (!this._inventory.addItem(evaluation.recipe.output.itemId, evaluation.recipe.output.count)) {
      this._inventory.fromJSON(snapshot)
      return buildResult({
        ok: false,
        code: "output_blocked",
        recipe: evaluation.recipe,
        hearthlightTier: normalizeHearthlightTier(hearthlightTier)
      })
    }

    return buildResult({
      ok: true,
      code: "crafted",
      recipe: evaluation.recipe,
      hearthlightTier: normalizeHearthlightTier(hearthlightTier)
    })
  }
}

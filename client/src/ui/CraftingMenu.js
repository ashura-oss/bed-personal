const EMPTY_RECIPE_TITLE = "No recipe selected";
const EMPTY_RECIPE_DESCRIPTION = "Rest at the Hearthlight to review available fieldcraft recipes.";
const EMPTY_RECIPE_NOTES = "Choose a recipe to inspect its reagents and output bundle.";
const EMPTY_OUTPUT_SUMMARY = "No craft output recorded.";
const EMPTY_INGREDIENT_SUMMARY = "0/0 ingredients ready";
const EMPTY_AVAILABILITY_TEXT = "Awaiting recipe data";
const DEFAULT_CATEGORY = "Hearthlight Craft";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function humanizeId(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "";
  }

  return value
    .trim()
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sanitizeCount(value, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function readOptionalCount(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
}

function readOptionalBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function pluralize(count) {
  return count === 1 ? "" : "s";
}

function buildOutputEntry(output, outputIndex) {
  const outputId = normalizeText(output?.itemId)
    || normalizeText(output?.id)
    || normalizeText(output?.outputId);
  const label = normalizeText(output?.name)
    || normalizeText(output?.displayName)
    || normalizeText(output?.label)
    || humanizeId(outputId)
    || `Output ${outputIndex + 1}`;
  const count = sanitizeCount(output?.count ?? output?.quantity ?? output?.amount, 0);

  return Object.freeze({
    outputId,
    label,
    count,
    summaryText: `${count}x ${label}`
  });
}

function buildOutputEntries(recipe) {
  const outputs = Array.isArray(recipe?.outputs)
    ? recipe.outputs
    : recipe?.output
      ? [recipe.output]
      : recipe?.result
        ? [recipe.result]
        : [];

  return Object.freeze(outputs.map((output, index) => buildOutputEntry(output, index)));
}

function buildIngredientView(ingredient, ingredientIndex) {
  const ingredientId = normalizeText(ingredient?.itemId)
    || normalizeText(ingredient?.ingredientId)
    || normalizeText(ingredient?.id);
  const label = normalizeText(ingredient?.name)
    || normalizeText(ingredient?.displayName)
    || normalizeText(ingredient?.label)
    || humanizeId(ingredientId)
    || `Ingredient ${ingredientIndex + 1}`;
  const requiredCount = sanitizeCount(
    ingredient?.required
      ?? ingredient?.count
      ?? ingredient?.quantity
      ?? ingredient?.needed,
    0
  );
  const availableCount = readOptionalCount(
    ingredient?.available
      ?? ingredient?.owned
      ?? ingredient?.onHand
      ?? ingredient?.inventoryCount
      ?? ingredient?.countAvailable
      ?? ingredient?.have
  );
  const explicitAvailabilityKnown = readOptionalBoolean(
    ingredient?.isAvailabilityKnown,
    ingredient?.availabilityKnown
  );
  const explicitAvailable = readOptionalBoolean(
    ingredient?.isAvailable,
    ingredient?.availableEnough,
    ingredient?.craftable
  );
  let isAvailabilityKnown = explicitAvailabilityKnown ?? (availableCount !== null || explicitAvailable !== null);

  if (requiredCount === 0 && !isAvailabilityKnown) {
    isAvailabilityKnown = true;
  }

  const isAvailable = explicitAvailable
    ?? (requiredCount === 0
      ? true
      : availableCount !== null && availableCount >= requiredCount);
  const statusTone = !isAvailabilityKnown
    ? "unknown"
    : isAvailable
      ? "ready"
      : "missing";
  const statusLabel = statusTone === "ready"
    ? "Ready"
    : statusTone === "missing"
      ? "Missing"
      : "Awaiting";

  return Object.freeze({
    ingredientId,
    label,
    requiredCount,
    availableCount,
    countText: formatIngredientCount(availableCount, requiredCount),
    isAvailabilityKnown,
    isAvailable,
    statusTone,
    statusLabel,
    ariaLabel: `${label}, ${formatIngredientCount(availableCount, requiredCount)}, ${statusLabel.toLowerCase()}`
  });
}

function buildIngredientViews(recipe) {
  const ingredients = Array.isArray(recipe?.ingredients)
    ? recipe.ingredients
    : Array.isArray(recipe?.cost)
      ? recipe.cost
      : [];

  return Object.freeze(ingredients.map((ingredient, index) => buildIngredientView(ingredient, index)));
}

export function formatIngredientCount(availableCount, requiredCount) {
  const requiredSafe = sanitizeCount(requiredCount, 0);

  if (!Number.isFinite(availableCount)) {
    return `${requiredSafe === 0 ? 0 : "--"} / ${requiredSafe}`;
  }

  return `${sanitizeCount(availableCount, 0)} / ${requiredSafe}`;
}

export function summarizeRecipeAvailability(recipeOrIngredients) {
  const base = Array.isArray(recipeOrIngredients) ? {} : recipeOrIngredients ?? {};
  const ingredients = Array.isArray(recipeOrIngredients)
    ? Object.freeze(recipeOrIngredients.map((ingredient, index) => {
      return ingredient?.countText ? ingredient : buildIngredientView(ingredient, index);
    }))
    : (Array.isArray(base.ingredients) && base.ingredients.every((ingredient) => ingredient?.countText)
      ? Object.freeze(base.ingredients.slice())
      : buildIngredientViews(base));
  const readyCount = ingredients.filter((ingredient) => ingredient.isAvailable).length;
  const unknownCount = ingredients.filter((ingredient) => !ingredient.isAvailabilityKnown).length;
  const missingCount = ingredients.filter((ingredient) => {
    return ingredient.isAvailabilityKnown && !ingredient.isAvailable;
  }).length;
  const totalIngredients = ingredients.length;
  const explicitCraftable = readOptionalBoolean(
    base?.isCraftable,
    base?.craftable,
    base?.canCraft,
    base?.available
  );
  const blockedReason = normalizeText(base?.availabilityText)
    || normalizeText(base?.unavailableReason)
    || normalizeText(base?.failureReason);
  const canCraft = explicitCraftable ?? (totalIngredients === 0 || (missingCount === 0 && unknownCount === 0));
  let statusText = EMPTY_AVAILABILITY_TEXT;
  let tone = canCraft ? "ready" : unknownCount > 0 ? "unknown" : "missing";

  if (canCraft) {
    statusText = totalIngredients === 0 ? "Ready to craft" : "All ingredients ready";
  } else if (blockedReason) {
    statusText = blockedReason;
    tone = "missing";
  } else if (unknownCount > 0) {
    statusText = `Availability pending for ${unknownCount} ingredient${pluralize(unknownCount)}`;
  } else if (missingCount > 0) {
    statusText = `${missingCount} ingredient${pluralize(missingCount)} short`;
  } else {
    statusText = "Crafting unavailable";
    tone = "missing";
  }

  return Object.freeze({
    ingredients,
    totalIngredients,
    readyCount,
    missingCount,
    unknownCount,
    canCraft,
    tone,
    ingredientSummaryText: `${readyCount}/${totalIngredients} ingredients ready`,
    statusText
  });
}

export function buildRecipeView(recipe, recipeIndex = 0) {
  const recipeId = normalizeText(recipe?.recipeId)
    || normalizeText(recipe?.id)
    || `recipe-${recipeIndex + 1}`;
  const title = normalizeText(recipe?.name)
    || normalizeText(recipe?.displayName)
    || normalizeText(recipe?.label)
    || humanizeId(recipeId)
    || `Recipe ${recipeIndex + 1}`;
  const category = normalizeText(recipe?.category)
    || normalizeText(recipe?.discipline)
    || normalizeText(recipe?.group)
    || DEFAULT_CATEGORY;
  const description = normalizeText(recipe?.description)
    || normalizeText(recipe?.summary)
    || `No field notes recorded for ${title}.`;
  const notes = normalizeText(recipe?.notes)
    || normalizeText(recipe?.flavor)
    || normalizeText(recipe?.hint);
  const outputEntries = buildOutputEntries(recipe);
  const outputSummary = outputEntries.length > 0
    ? outputEntries.map((output) => output.summaryText).join(" • ")
    : EMPTY_OUTPUT_SUMMARY;
  const totalOutputCount = outputEntries.reduce((sum, output) => sum + output.count, 0);
  const availability = summarizeRecipeAvailability({
    ...recipe,
    ingredients: buildIngredientViews(recipe)
  });
  const badgeText = availability.canCraft
    ? "Ready"
    : availability.unknownCount > 0
      ? "Pending"
      : availability.missingCount > 0
        ? `${availability.missingCount} short`
        : "Locked";

  return Object.freeze({
    recipeId,
    recipeIndex,
    title,
    category,
    description,
    notes,
    outputEntries,
    outputSummary,
    outputCountText: totalOutputCount > 0 ? `x${totalOutputCount}` : "--",
    ingredients: availability.ingredients,
    availability,
    isCraftable: availability.canCraft,
    badgeText,
    craftLabel: "Craft",
    ariaLabel: `${title}. ${outputSummary}. ${availability.statusText}.`
  });
}

export function buildRecipeViews(recipes) {
  const source = Array.isArray(recipes) ? recipes : [];
  return source.map((recipe, index) => buildRecipeView(recipe, index));
}

export function resolveCraftingSelection(recipeViews, requestedSelection = null, fallbackSelection = null) {
  const views = Array.isArray(recipeViews) ? recipeViews : [];
  const maxIndex = views.length - 1;
  const resolveSelection = (selection) => {
    if (Number.isInteger(selection) && selection >= 0 && selection <= maxIndex) {
      return selection;
    }

    const selectionId = normalizeText(selection);
    if (!selectionId) {
      return -1;
    }

    return views.findIndex((recipe) => recipe.recipeId === selectionId);
  };

  const requestedIndex = resolveSelection(requestedSelection);
  if (requestedIndex >= 0) {
    return requestedIndex;
  }

  const fallbackIndex = resolveSelection(fallbackSelection);
  if (fallbackIndex >= 0) {
    return fallbackIndex;
  }

  if (views.length === 0) {
    return 0;
  }

  const firstCraftable = views.findIndex((recipe) => recipe.isCraftable);
  return firstCraftable >= 0 ? firstCraftable : 0;
}

export function buildRecipeDetailView(recipeView) {
  if (!recipeView) {
    return Object.freeze({
      recipeId: "",
      title: EMPTY_RECIPE_TITLE,
      category: DEFAULT_CATEGORY,
      outputSummary: EMPTY_OUTPUT_SUMMARY,
      outputCountText: "--",
      description: EMPTY_RECIPE_DESCRIPTION,
      notes: EMPTY_RECIPE_NOTES,
      ingredientSummaryText: EMPTY_INGREDIENT_SUMMARY,
      availabilityText: EMPTY_AVAILABILITY_TEXT,
      availabilityTone: "unknown",
      ingredients: Object.freeze([]),
      craftLabel: "Craft",
      canCraft: false
    });
  }

  const availability = recipeView.availability ?? summarizeRecipeAvailability(recipeView);
  const fallbackNotes = availability.canCraft
    ? "All reagents are prepared at this Hearthlight."
    : availability.unknownCount > 0
      ? "Availability data is pending for one or more reagents."
      : "Gather the missing reagents before requesting this craft.";

  return Object.freeze({
    recipeId: recipeView.recipeId,
    title: recipeView.title,
    category: recipeView.category,
    outputSummary: recipeView.outputSummary,
    outputCountText: recipeView.outputCountText,
    description: recipeView.description,
    notes: recipeView.notes || fallbackNotes,
    ingredientSummaryText: availability.ingredientSummaryText,
    availabilityText: availability.statusText,
    availabilityTone: availability.tone,
    ingredients: recipeView.ingredients,
    craftLabel: recipeView.craftLabel || "Craft",
    canCraft: recipeView.isCraftable
  });
}

function summarizeRecipeCollection(recipeViews) {
  const views = Array.isArray(recipeViews) ? recipeViews : [];
  return {
    readyCountText: String(views.filter((recipe) => recipe.isCraftable).length),
    totalCountText: String(views.length)
  };
}

export class CraftingMenu {
  constructor(bus, options = {}) {
    if (!bus || typeof bus.on !== "function" || typeof bus.emit !== "function") {
      throw new TypeError("CraftingMenu: bus with on() and emit() is required");
    }

    const documentRef = options.document ?? (typeof document !== "undefined" ? document : null);

    if (!documentRef) {
      throw new Error("CraftingMenu: document is required");
    }

    this.bus = bus;
    this.document = documentRef;
    this.unsubs = [];
    this.domCleanups = [];
    this.isOpen = false;
    this.statusState = null;
    this.recipeViews = buildRecipeViews(options.recipes);
    this.selectedIndex = resolveCraftingSelection(
      this.recipeViews,
      options.selectedRecipeId ?? options.selectedIndex
    );
    this.mount = options.mount ?? this.document.getElementById("app") ?? this.document.body;

    if (!this.mount) {
      throw new Error("CraftingMenu: mount element is required");
    }

    this.root = this.createDOM();
    this.mount.appendChild(this.root);

    this.list = this.requireWithin(this.root, "[data-crafting-list]");
    this.readyCount = this.requireWithin(this.root, "[data-crafting-ready]");
    this.totalCount = this.requireWithin(this.root, "[data-crafting-total]");
    this.selectionSummary = this.requireWithin(this.root, "[data-crafting-selected]");
    this.detailKicker = this.requireWithin(this.root, "[data-crafting-detail-kicker]");
    this.detailTitle = this.requireWithin(this.root, "[data-crafting-detail-title]");
    this.detailCount = this.requireWithin(this.root, "[data-crafting-detail-count]");
    this.detailOutput = this.requireWithin(this.root, "[data-crafting-detail-output]");
    this.detailAvailability = this.requireWithin(this.root, "[data-crafting-detail-availability]");
    this.detailDescription = this.requireWithin(this.root, "[data-crafting-detail-description]");
    this.detailIngredientSummary = this.requireWithin(this.root, "[data-crafting-detail-ingredients]");
    this.detailIngredients = this.requireWithin(this.root, "[data-crafting-ingredients]");
    this.detailNotes = this.requireWithin(this.root, "[data-crafting-detail-notes]");
    this.status = this.requireWithin(this.root, "[data-crafting-status]");
    this.requestButton = this.requireWithin(this.root, "[data-crafting-request]");
    this.closeButton = this.requireWithin(this.root, "[data-crafting-close]");

    this.bindDOM();
    this.bindUIBus();
    this.render();
  }

  get isVisible() {
    return this.isOpen;
  }

  open(payload = {}) {
    const recipes = this.readRecipesPayload(payload);
    const selection = this.readSelectionPayload(payload);
    const hasExplicitSelection = selection !== null;

    if (recipes) {
      this.setRecipes(recipes, {
        selectedSelection: selection,
        preserveSelection: !hasExplicitSelection
      });
    } else if (hasExplicitSelection) {
      this.selectRecipe(selection, { emit: false });
    }

    this.isOpen = true;
    this.root.classList.add("menu-open");
    this.root.setAttribute("aria-hidden", "false");
    this.bus.emit("crafting:opened", this.buildSelectionPayload());
    this.findSelectedButton()?.focus();
  }

  close({ emit = true } = {}) {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.root.classList.remove("menu-open");
    this.root.setAttribute("aria-hidden", "true");

    if (emit) {
      this.bus.emit("crafting:closed", this.buildSelectionPayload());
    }
  }

  setRecipes(recipes, { selectedSelection = null, preserveSelection = true } = {}) {
    const currentRecipeId = preserveSelection ? this.getSelectedRecipe()?.recipeId : null;
    this.recipeViews = buildRecipeViews(recipes);
    this.selectedIndex = resolveCraftingSelection(
      this.recipeViews,
      selectedSelection,
      currentRecipeId
    );
    this.clearStatus();
    this.render();
  }

  selectRecipe(selection, { emit = true } = {}) {
    const nextIndex = resolveCraftingSelection(
      this.recipeViews,
      selection,
      this.getSelectedRecipe()?.recipeId ?? this.selectedIndex
    );
    const selectionChanged = nextIndex !== this.selectedIndex;

    this.selectedIndex = nextIndex;
    this.clearStatus();
    this.render();

    if (emit && selectionChanged) {
      this.bus.emit("crafting:select", this.buildSelectionPayload());
    }
  }

  dispose() {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs.length = 0;

    for (const cleanup of this.domCleanups) {
      cleanup();
    }
    this.domCleanups.length = 0;

    this.root.remove();
  }

  getSelectedRecipe() {
    return this.recipeViews[this.selectedIndex] ?? null;
  }

  buildSelectionPayload() {
    const recipe = this.getSelectedRecipe();

    return {
      selectedIndex: this.selectedIndex,
      recipeId: recipe?.recipeId ?? "",
      recipe
    };
  }

  readRecipesPayload(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.recipes)) {
      return payload.recipes;
    }

    return null;
  }

  readSelectionPayload(payload) {
    if (Number.isInteger(payload)) {
      return payload;
    }

    const directRecipeId = normalizeText(payload);
    if (directRecipeId) {
      return directRecipeId;
    }

    const selectedRecipeId = normalizeText(payload?.selectedRecipeId);
    if (selectedRecipeId) {
      return selectedRecipeId;
    }

    const recipeId = normalizeText(payload?.recipeId);
    if (recipeId) {
      return recipeId;
    }

    return Number.isInteger(payload?.selectedIndex) ? payload.selectedIndex : null;
  }

  requireWithin(root, selector) {
    const element = root.querySelector(selector);
    if (!element) {
      throw new Error(`CraftingMenu: missing element "${selector}"`);
    }

    return element;
  }

  bindDOM() {
    const onBackdropClick = (event) => {
      if (event.target === this.root) {
        this.close();
      }
    };
    const onCloseClick = () => {
      this.close();
    };
    const onListClick = (event) => {
      const button = event.target.closest("[data-recipe-index]");
      if (!button) {
        return;
      }

      const recipeIndex = Number.parseInt(button.dataset.recipeIndex ?? "", 10);
      if (Number.isInteger(recipeIndex)) {
        this.selectRecipe(recipeIndex);
      }
    };
    const onRequestClick = () => {
      const recipe = this.getSelectedRecipe();
      if (!recipe || !recipe.recipeId || !recipe.isCraftable) {
        return;
      }

      this.bus.emit("crafting:requested", {
        recipeId: recipe.recipeId,
        selectedIndex: this.selectedIndex,
        recipe
      });
    };

    this.root.addEventListener("click", onBackdropClick);
    this.closeButton.addEventListener("click", onCloseClick);
    this.list.addEventListener("click", onListClick);
    this.requestButton.addEventListener("click", onRequestClick);

    this.domCleanups.push(() => {
      this.root.removeEventListener("click", onBackdropClick);
      this.closeButton.removeEventListener("click", onCloseClick);
      this.list.removeEventListener("click", onListClick);
      this.requestButton.removeEventListener("click", onRequestClick);
    });
  }

  bindUIBus() {
    this.unsubs.push(
      this.bus.on("crafting:open", (payload) => {
        this.open(payload ?? {});
      }),
      this.bus.on("crafting:close", () => {
        this.close();
      }),
      this.bus.on("crafting:set", (payload) => {
        const recipes = this.readRecipesPayload(payload);
        if (!recipes) {
          return;
        }

        const selection = this.readSelectionPayload(payload);
        this.setRecipes(recipes, {
          selectedSelection: selection,
          preserveSelection: selection === null
        });
      }),
      this.bus.on("crafting:select", (payload) => {
        const selection = this.readSelectionPayload(payload);
        if (selection === null) {
          return;
        }

        this.selectRecipe(selection, { emit: false });
      }),
      this.bus.on("crafting:crafted", (payload) => {
        this.setStatus("success", payload ?? {});
      }),
      this.bus.on("crafting:failed", (payload) => {
        this.setStatus("error", payload ?? {});
      })
    );
  }

  setStatus(kind, payload = {}) {
    const payloadRecipeId = normalizeText(payload?.recipeId);
    const selectedRecipe = this.getSelectedRecipe();

    if (payloadRecipeId && selectedRecipe?.recipeId && payloadRecipeId !== selectedRecipe.recipeId) {
      return;
    }

    const message = normalizeText(payload?.message)
      || normalizeText(payload?.reason)
      || (kind === "success"
        ? (selectedRecipe ? `Crafted ${selectedRecipe.title}.` : "Craft complete.")
        : (selectedRecipe ? `${selectedRecipe.title} could not be crafted.` : "Crafting failed."));

    this.statusState = { kind, message };
    this.renderStatus();
  }

  clearStatus() {
    this.statusState = null;
    this.renderStatus();
  }

  render() {
    this.renderSummary();
    this.renderList();
    this.renderDetail();
    this.renderStatus();
  }

  renderSummary() {
    const summary = summarizeRecipeCollection(this.recipeViews);
    this.readyCount.textContent = summary.readyCountText;
    this.totalCount.textContent = summary.totalCountText;

    if (this.recipeViews.length === 0) {
      this.selectionSummary.textContent = "No recipes";
      return;
    }

    this.selectionSummary.textContent = `Selected ${String(this.selectedIndex + 1).padStart(2, "0")}/${String(this.recipeViews.length).padStart(2, "0")}`;
  }

  renderList() {
    this.list.replaceChildren();

    if (this.recipeViews.length === 0) {
      const empty = this.document.createElement("p");
      empty.className = "crafting-list__empty";
      empty.textContent = "No recipes recorded for this Hearthlight.";
      this.list.appendChild(empty);
      return;
    }

    for (let index = 0; index < this.recipeViews.length; index += 1) {
      const recipeView = this.recipeViews[index];
      const button = this.document.createElement("button");
      const titleRow = this.document.createElement("span");
      const title = this.document.createElement("span");
      const badge = this.document.createElement("span");
      const output = this.document.createElement("span");
      const status = this.document.createElement("span");
      const isSelected = index === this.selectedIndex;

      button.type = "button";
      button.className = "crafting-recipe";
      button.dataset.recipeIndex = String(index);
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(isSelected));
      button.setAttribute("aria-label", recipeView.ariaLabel);
      button.title = recipeView.title;
      button.classList.toggle("is-selected", isSelected);
      button.classList.toggle("is-ready", recipeView.isCraftable);
      button.classList.toggle("is-pending", recipeView.availability.tone === "unknown");

      titleRow.className = "crafting-recipe__title-row";
      title.className = "crafting-recipe__title";
      title.textContent = recipeView.title;
      badge.className = "crafting-recipe__badge";
      badge.textContent = recipeView.badgeText;
      titleRow.append(title, badge);

      output.className = "crafting-recipe__output";
      output.textContent = recipeView.outputSummary;

      status.className = "crafting-recipe__status";
      status.textContent = `${recipeView.category} • ${recipeView.availability.statusText}`;

      button.append(titleRow, output, status);
      this.list.appendChild(button);
    }
  }

  renderDetail() {
    const detail = buildRecipeDetailView(this.getSelectedRecipe());
    this.detailKicker.textContent = detail.category;
    this.detailTitle.textContent = detail.title;
    this.detailCount.textContent = detail.outputCountText;
    this.detailOutput.textContent = detail.outputSummary;
    this.detailAvailability.textContent = detail.availabilityText;
    this.detailAvailability.dataset.tone = detail.availabilityTone;
    this.detailDescription.textContent = detail.description;
    this.detailIngredientSummary.textContent = detail.ingredientSummaryText;
    this.detailNotes.textContent = detail.notes;
    this.requestButton.textContent = detail.craftLabel;
    this.requestButton.disabled = !detail.canCraft || !detail.recipeId;

    this.detailIngredients.replaceChildren();

    if (detail.ingredients.length === 0) {
      const empty = this.document.createElement("li");
      empty.className = "crafting-ingredients__empty";
      empty.textContent = "No ingredients recorded.";
      this.detailIngredients.appendChild(empty);
      return;
    }

    for (const ingredient of detail.ingredients) {
      const item = this.document.createElement("li");
      const title = this.document.createElement("span");
      const counts = this.document.createElement("span");
      const status = this.document.createElement("span");

      item.className = "crafting-ingredient";
      item.dataset.tone = ingredient.statusTone;
      item.setAttribute("aria-label", ingredient.ariaLabel);

      title.className = "crafting-ingredient__name";
      title.textContent = ingredient.label;

      counts.className = "crafting-ingredient__count";
      counts.textContent = ingredient.countText;

      status.className = "crafting-ingredient__status";
      status.textContent = ingredient.statusLabel;

      item.append(title, counts, status);
      this.detailIngredients.appendChild(item);
    }
  }

  renderStatus() {
    if (!this.statusState) {
      this.status.hidden = true;
      this.status.textContent = "";
      this.status.dataset.kind = "";
      return;
    }

    this.status.hidden = false;
    this.status.textContent = this.statusState.message;
    this.status.dataset.kind = this.statusState.kind;
  }

  findSelectedButton() {
    return this.root.querySelector(`[data-recipe-index="${this.selectedIndex}"]`);
  }

  createDOM() {
    const root = this.document.createElement("section");
    root.id = "crafting-menu-ui";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Hearthlight crafting");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="rf-panel crafting-shell">
        <div class="crafting-header">
          <div class="crafting-heading">
            <p class="crafting-kicker">Hearthlight</p>
            <h2 class="rf-title crafting-title">Crafting Ledger</h2>
          </div>
          <div class="crafting-summary" aria-label="Crafting summary">
            <div class="crafting-summary__group">
              <span class="crafting-summary__label">Ready</span>
              <span class="crafting-summary__value" data-crafting-ready>0</span>
            </div>
            <div class="crafting-summary__group">
              <span class="crafting-summary__label">Recipes</span>
              <span class="crafting-summary__value" data-crafting-total>0</span>
            </div>
          </div>
          <button type="button" class="crafting-back" data-crafting-close>Back</button>
        </div>

        <div class="crafting-layout">
          <section class="crafting-recipes-pane" aria-label="Crafting recipes">
            <div class="crafting-recipes__heading">
              <span class="crafting-recipes__title">Recipes</span>
              <span class="crafting-recipes__selected" data-crafting-selected>No recipes</span>
            </div>
            <div class="crafting-list" role="listbox" data-crafting-list></div>
          </section>

          <aside class="crafting-detail-pane" aria-live="polite">
            <div class="crafting-detail__kicker" data-crafting-detail-kicker>${DEFAULT_CATEGORY}</div>
            <div class="crafting-detail__title-row">
              <h3 class="crafting-detail__title" data-crafting-detail-title>${EMPTY_RECIPE_TITLE}</h3>
              <span class="crafting-detail__count" data-crafting-detail-count>--</span>
            </div>
            <div class="crafting-detail__output" data-crafting-detail-output>${EMPTY_OUTPUT_SUMMARY}</div>
            <div class="crafting-detail__availability" data-crafting-detail-availability>${EMPTY_AVAILABILITY_TEXT}</div>
            <p class="crafting-detail__description" data-crafting-detail-description>
              ${EMPTY_RECIPE_DESCRIPTION}
            </p>

            <section class="crafting-ingredients">
              <div class="crafting-ingredients__heading">
                <span class="crafting-ingredients__title">Ingredients</span>
                <span class="crafting-ingredients__summary" data-crafting-detail-ingredients>
                  ${EMPTY_INGREDIENT_SUMMARY}
                </span>
              </div>
              <ul class="crafting-ingredients__list" data-crafting-ingredients>
                <li class="crafting-ingredients__empty">No ingredients recorded.</li>
              </ul>
            </section>

            <p class="crafting-detail__notes" data-crafting-detail-notes>${EMPTY_RECIPE_NOTES}</p>
            <p class="crafting-status" data-crafting-status hidden></p>

            <div class="crafting-actions">
              <button
                type="button"
                class="crafting-action crafting-action--primary"
                data-crafting-request
                disabled
              >
                Craft
              </button>
            </div>
          </aside>
        </div>
      </div>
    `;

    return root;
  }
}

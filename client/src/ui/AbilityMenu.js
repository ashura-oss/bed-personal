const DEFAULT_AFFINITY = "Unbound";
const EMPTY_ABILITY_TITLE = "No ability selected";
const EMPTY_ABILITY_DESCRIPTION = "Rest at the Hearthlight to review known abilities.";
const DEFAULT_SLOT_KEYS = Object.freeze(["Q", "E", "R"]);

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

function readOptionalBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function readOptionalNumber(...values) {
  for (const value of values) {
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function sanitizeCount(value, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function readAbilityId(ability) {
  return normalizeText(ability?.abilityId)
    || normalizeText(ability?.id)
    || normalizeText(ability?.key);
}

function readUnlockCost(ability) {
  return readOptionalNumber(
    ability?.unlockCost,
    ability?.emberCost,
    ability?.embersCost,
    ability?.requiredEmbers,
    ability?.cost?.embers,
    ability?.cost?.ember,
    typeof ability?.cost === "number" ? ability.cost : null
  );
}

function normalizeSlotKey(value, fallback = DEFAULT_SLOT_KEYS[0]) {
  const text = normalizeText(value).toUpperCase();
  return text || fallback;
}

function readAvailableEmbers(payload) {
  return readOptionalNumber(
    payload?.availableEmbers,
    payload?.currentEmbers,
    payload?.embers,
    payload?.currency?.embers
  );
}

function normalizeEquippedSlots(equippedSlots) {
  if (!equippedSlots || typeof equippedSlots !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(equippedSlots).map(([slotKey, value]) => {
      const abilityId = typeof value === "string" ? value : readAbilityId(value);
      return [normalizeSlotKey(slotKey), abilityId];
    })
  );
}

function readEquippedSlotForAbility(ability, equippedSlots = {}) {
  const abilityId = readAbilityId(ability);
  const explicitSlot = normalizeText(ability?.equippedSlot)
    || normalizeText(ability?.slotKey)
    || normalizeText(ability?.equippedKey);

  if (explicitSlot) {
    return normalizeSlotKey(explicitSlot);
  }

  for (const [slotKey, equippedAbilityId] of Object.entries(equippedSlots)) {
    if (abilityId && equippedAbilityId === abilityId) {
      return slotKey;
    }
  }

  return "";
}

function buildCostText({ isUnlocked, unlockCost, availableEmbers }) {
  if (isUnlocked) {
    return "Unlocked";
  }

  if (unlockCost === null) {
    return "Cost unknown";
  }

  const safeCost = sanitizeCount(unlockCost, 0);
  if (safeCost === 0) {
    return "Free";
  }

  if (availableEmbers !== null && availableEmbers < safeCost) {
    return `${safeCost - availableEmbers} Ember${safeCost - availableEmbers === 1 ? "" : "s"} short`;
  }

  return `${safeCost} Embers`;
}

export function buildAbilityView(ability, abilityIndex = 0, options = {}) {
  const equippedSlots = normalizeEquippedSlots(options.equippedSlots);
  const availableEmbers = readAvailableEmbers(options);
  const abilityId = readAbilityId(ability) || `ability-${abilityIndex + 1}`;
  const title = normalizeText(ability?.name)
    || normalizeText(ability?.displayName)
    || normalizeText(ability?.label)
    || humanizeId(abilityId)
    || `Ability ${abilityIndex + 1}`;
  const affinity = normalizeText(ability?.affinity)
    || normalizeText(ability?.school)
    || normalizeText(ability?.element)
    || DEFAULT_AFFINITY;
  const equippedSlotKey = readEquippedSlotForAbility(ability, equippedSlots);
  const explicitEquipped = readOptionalBoolean(ability?.isEquipped, ability?.equipped);
  const isEquipped = explicitEquipped ?? equippedSlotKey.length > 0;
  const explicitUnlocked = readOptionalBoolean(ability?.isUnlocked, ability?.unlocked);
  const isUnlocked = explicitUnlocked ?? isEquipped;
  const unlockCost = readUnlockCost(ability);
  const safeUnlockCost = unlockCost === null ? null : sanitizeCount(unlockCost, 0);
  const missingEmbers = !isUnlocked && safeUnlockCost !== null && availableEmbers !== null
    ? Math.max(0, safeUnlockCost - availableEmbers)
    : 0;
  const explicitCanUnlock = readOptionalBoolean(ability?.canUnlock, ability?.unlockable);
  const canUnlock = !isUnlocked && (
    explicitCanUnlock
    ?? (safeUnlockCost !== null && (availableEmbers === null ? safeUnlockCost === 0 : missingEmbers === 0))
  );
  const canEquip = isUnlocked && !isEquipped;
  const fpCost = sanitizeCount(
    readOptionalNumber(
      ability?.fpCost,
      ability?.focusCost,
      ability?.cost?.fp,
      ability?.cost?.focus
    ),
    0
  );
  const costText = buildCostText({ isUnlocked, unlockCost: safeUnlockCost, availableEmbers });
  const state = isEquipped ? "equipped" : isUnlocked ? "unlocked" : "locked";
  const stateLabel = isEquipped
    ? `Equipped${equippedSlotKey ? ` ${equippedSlotKey}` : ""}`
    : isUnlocked
      ? "Unlocked"
      : "Locked";
  const badgeText = isEquipped ? "Equipped" : isUnlocked ? "Unlocked" : canUnlock ? "Unlock" : "Locked";

  return Object.freeze({
    abilityIndex,
    abilityId,
    title,
    affinity,
    description: normalizeText(ability?.description)
      || normalizeText(ability?.summary)
      || `No field notes recorded for ${title}.`,
    notes: normalizeText(ability?.notes) || normalizeText(ability?.flavor),
    fpCost,
    fpCostText: `${fpCost} FP`,
    unlockCost: safeUnlockCost,
    costText,
    missingEmbers,
    isUnlocked,
    isEquipped,
    equippedSlotKey,
    canUnlock,
    canEquip,
    state,
    stateLabel,
    badgeText,
    ariaLabel: `${title}. ${affinity}. ${stateLabel}. ${costText}.`
  });
}

export function buildAbilityViews(abilities, options = {}) {
  const source = Array.isArray(abilities) ? abilities : [];
  return Object.freeze(source.map((ability, index) => buildAbilityView(ability, index, options)));
}

export function groupAbilityViewsByAffinity(abilityViews) {
  const groups = [];
  const groupByAffinity = new Map();

  for (const ability of Array.isArray(abilityViews) ? abilityViews : []) {
    const affinity = ability.affinity || DEFAULT_AFFINITY;
    let group = groupByAffinity.get(affinity);
    if (!group) {
      group = { affinity, abilities: [] };
      groupByAffinity.set(affinity, group);
      groups.push(group);
    }

    group.abilities.push(ability);
  }

  return Object.freeze(groups.map((group) => {
    return Object.freeze({
      affinity: group.affinity,
      abilities: Object.freeze(group.abilities.slice())
    });
  }));
}

function resolveAbilityIndex(abilityViews, selection) {
  const views = Array.isArray(abilityViews) ? abilityViews : [];
  const maxIndex = views.length - 1;

  if (Number.isInteger(selection) && selection >= 0 && selection <= maxIndex) {
    return selection;
  }

  const abilityId = normalizeText(selection);
  if (!abilityId) {
    return -1;
  }

  return views.findIndex((ability) => ability.abilityId === abilityId);
}

export function resolveAbilitySelection(abilityViews, requestedSelection = null, fallbackSelection = null) {
  const views = Array.isArray(abilityViews) ? abilityViews : [];
  const requestedIndex = resolveAbilityIndex(views, requestedSelection);
  if (requestedIndex >= 0) {
    return requestedIndex;
  }

  const fallbackIndex = resolveAbilityIndex(views, fallbackSelection);
  if (fallbackIndex >= 0) {
    return fallbackIndex;
  }

  if (views.length === 0) {
    return 0;
  }

  const firstUnlocked = views.findIndex((ability) => ability.isUnlocked);
  return firstUnlocked >= 0 ? firstUnlocked : 0;
}

export function buildAbilityDetailView(abilityView) {
  if (!abilityView) {
    return Object.freeze({
      abilityId: "",
      title: EMPTY_ABILITY_TITLE,
      affinity: DEFAULT_AFFINITY,
      description: EMPTY_ABILITY_DESCRIPTION,
      notes: "Choose an ability to inspect its Hearthlight unlock state.",
      fpCostText: "--",
      costText: "--",
      state: "empty",
      stateLabel: "Unavailable",
      canUnlock: false,
      canEquip: false,
      unlockCost: null,
      equippedSlotKey: ""
    });
  }

  return Object.freeze({
    abilityId: abilityView.abilityId,
    title: abilityView.title,
    affinity: abilityView.affinity,
    description: abilityView.description,
    notes: abilityView.notes || (abilityView.isUnlocked
      ? "Equip this ability to a Q, E, or R slot before leaving the Hearthlight."
      : "Spend Embers at the Hearthlight to unlock this ability."),
    fpCostText: abilityView.fpCostText,
    costText: abilityView.costText,
    state: abilityView.state,
    stateLabel: abilityView.stateLabel,
    canUnlock: abilityView.canUnlock,
    canEquip: abilityView.canEquip,
    unlockCost: abilityView.unlockCost,
    equippedSlotKey: abilityView.equippedSlotKey
  });
}

function summarizeAbilities(abilityViews) {
  const views = Array.isArray(abilityViews) ? abilityViews : [];
  return {
    unlockedCount: views.filter((ability) => ability.isUnlocked).length,
    equippedCount: views.filter((ability) => ability.isEquipped).length,
    totalCount: views.length
  };
}

export class AbilityMenu {
  constructor(bus, options = {}) {
    if (!bus || typeof bus.on !== "function" || typeof bus.emit !== "function") {
      throw new TypeError("AbilityMenu: bus with on() and emit() is required");
    }

    const documentRef = options.document ?? (typeof document !== "undefined" ? document : null);
    if (!documentRef) {
      throw new Error("AbilityMenu: document is required");
    }

    this.bus = bus;
    this.document = documentRef;
    this.unsubs = [];
    this.domCleanups = [];
    this.isOpen = false;
    this.statusState = null;
    this.slotKeys = Array.isArray(options.slotKeys) && options.slotKeys.length > 0
      ? options.slotKeys.map((slotKey) => normalizeSlotKey(slotKey))
      : DEFAULT_SLOT_KEYS.slice();
    this.selectedSlotKey = normalizeSlotKey(options.selectedSlotKey, this.slotKeys[0]);
    this.availableEmbers = readAvailableEmbers(options);
    this.equippedSlots = normalizeEquippedSlots(options.equippedSlots);
    this.rawAbilities = Array.isArray(options.abilities) ? options.abilities.slice() : [];
    this.abilityViews = buildAbilityViews(this.rawAbilities, {
      availableEmbers: this.availableEmbers,
      equippedSlots: this.equippedSlots
    });
    this.selectedIndex = resolveAbilitySelection(
      this.abilityViews,
      options.selectedAbilityId ?? options.selectedIndex
    );
    this.mount = options.mount ?? this.document.getElementById("app") ?? this.document.body;

    if (!this.mount) {
      throw new Error("AbilityMenu: mount element is required");
    }

    this.root = this.createDOM();
    this.mount.appendChild(this.root);

    this.list = this.requireWithin(this.root, "[data-abilitymenu-list]");
    this.unlockedCount = this.requireWithin(this.root, "[data-abilitymenu-unlocked]");
    this.totalCount = this.requireWithin(this.root, "[data-abilitymenu-total]");
    this.embersCount = this.requireWithin(this.root, "[data-abilitymenu-embers]");
    this.selectionSummary = this.requireWithin(this.root, "[data-abilitymenu-selected]");
    this.detailKicker = this.requireWithin(this.root, "[data-abilitymenu-detail-kicker]");
    this.detailTitle = this.requireWithin(this.root, "[data-abilitymenu-detail-title]");
    this.detailState = this.requireWithin(this.root, "[data-abilitymenu-detail-state]");
    this.detailCost = this.requireWithin(this.root, "[data-abilitymenu-detail-cost]");
    this.detailFp = this.requireWithin(this.root, "[data-abilitymenu-detail-fp]");
    this.detailDescription = this.requireWithin(this.root, "[data-abilitymenu-detail-description]");
    this.detailNotes = this.requireWithin(this.root, "[data-abilitymenu-detail-notes]");
    this.slotPicker = this.requireWithin(this.root, "[data-abilitymenu-slots]");
    this.status = this.requireWithin(this.root, "[data-abilitymenu-status]");
    this.unlockButton = this.requireWithin(this.root, "[data-abilitymenu-unlock]");
    this.equipButton = this.requireWithin(this.root, "[data-abilitymenu-equip]");
    this.closeButton = this.requireWithin(this.root, "[data-abilitymenu-close]");

    this.bindDOM();
    this.bindUIBus();
    this.buildSlotPicker();
    this.render();
  }

  get isVisible() {
    return this.isOpen;
  }

  open(payload = {}) {
    const abilities = this.readAbilitiesPayload(payload);
    const selection = this.readSelectionPayload(payload);
    const hasExplicitSelection = selection !== null;

    if (abilities) {
      this.setAbilities(abilities, {
        availableEmbers: readAvailableEmbers(payload),
        equippedSlots: payload?.equippedSlots,
        selectedSelection: selection,
        preserveSelection: !hasExplicitSelection
      });
    } else {
      this.updateContext(payload);
      if (hasExplicitSelection) {
        this.selectAbility(selection, { emit: false });
      }
    }

    const selectedSlotKey = normalizeText(payload?.selectedSlotKey);
    if (selectedSlotKey) {
      this.selectedSlotKey = normalizeSlotKey(selectedSlotKey, this.slotKeys[0]);
    }

    this.isOpen = true;
    this.root.classList.add("menu-open");
    this.root.setAttribute("aria-hidden", "false");
    this.bus.emit("abilitymenu:opened", this.buildSelectionPayload());
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
      this.bus.emit("abilitymenu:closed", this.buildSelectionPayload());
    }
  }

  toggle(payload = {}) {
    if (this.isOpen) {
      this.close();
      return;
    }

    this.open(payload);
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

  readAbilitiesPayload(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.abilities)) {
      return payload.abilities;
    }

    if (Array.isArray(payload?.abilityList)) {
      return payload.abilityList;
    }

    return null;
  }

  readSelectionPayload(payload) {
    if (Number.isInteger(payload)) {
      return payload;
    }

    const directAbilityId = normalizeText(payload);
    if (directAbilityId) {
      return directAbilityId;
    }

    const selectedAbilityId = normalizeText(payload?.selectedAbilityId);
    if (selectedAbilityId) {
      return selectedAbilityId;
    }

    const abilityId = normalizeText(payload?.abilityId);
    if (abilityId) {
      return abilityId;
    }

    return Number.isInteger(payload?.selectedIndex) ? payload.selectedIndex : null;
  }

  setAbilities(abilities, {
    availableEmbers = null,
    equippedSlots = null,
    selectedSelection = null,
    preserveSelection = true
  } = {}) {
    const currentAbilityId = preserveSelection ? this.getSelectedAbility()?.abilityId : null;
    if (availableEmbers !== null) {
      this.availableEmbers = availableEmbers;
    }

    if (equippedSlots) {
      this.equippedSlots = normalizeEquippedSlots(equippedSlots);
    }

    this.rawAbilities = Array.isArray(abilities) ? abilities.slice() : [];
    this.rebuildViews();
    this.selectedIndex = resolveAbilitySelection(
      this.abilityViews,
      selectedSelection,
      currentAbilityId
    );
    this.clearStatus();
    this.render();
  }

  updateContext(payload = {}) {
    const nextEmbers = readAvailableEmbers(payload);
    if (nextEmbers !== null) {
      this.availableEmbers = nextEmbers;
    }

    if (payload?.equippedSlots) {
      this.equippedSlots = normalizeEquippedSlots(payload.equippedSlots);
    }

    this.rebuildViews();
    this.render();
  }

  updateAbility(payload = {}, patch = {}) {
    const abilityId = normalizeText(payload?.abilityId) || normalizeText(payload?.id);
    if (!abilityId) {
      return;
    }

    this.rawAbilities = this.rawAbilities.map((ability) => {
      if (readAbilityId(ability) !== abilityId) {
        return ability;
      }

      return { ...ability, ...payload, ...patch };
    });

    if (patch.equipped && payload?.slotKey) {
      this.equippedSlots = {
        ...this.equippedSlots,
        [normalizeSlotKey(payload.slotKey)]: abilityId
      };
    }

    this.rebuildViews();
    this.render();
  }

  rebuildViews() {
    this.abilityViews = buildAbilityViews(this.rawAbilities, {
      availableEmbers: this.availableEmbers,
      equippedSlots: this.equippedSlots
    });
    this.selectedIndex = resolveAbilitySelection(
      this.abilityViews,
      this.getSelectedAbility()?.abilityId ?? this.selectedIndex
    );
  }

  selectAbility(selection, { emit = true } = {}) {
    const nextIndex = resolveAbilitySelection(
      this.abilityViews,
      selection,
      this.getSelectedAbility()?.abilityId ?? this.selectedIndex
    );
    const selectionChanged = nextIndex !== this.selectedIndex;

    this.selectedIndex = nextIndex;
    const ability = this.getSelectedAbility();
    if (ability?.equippedSlotKey) {
      this.selectedSlotKey = ability.equippedSlotKey;
    }

    this.clearStatus();
    this.render();

    if (emit && selectionChanged) {
      this.bus.emit("abilitymenu:select", this.buildSelectionPayload());
    }
  }

  selectSlot(slotKey) {
    this.selectedSlotKey = normalizeSlotKey(slotKey, this.slotKeys[0]);
    this.renderSlotPicker();
    this.renderDetail();
  }

  getSelectedAbility() {
    return this.abilityViews[this.selectedIndex] ?? null;
  }

  buildSelectionPayload() {
    const ability = this.getSelectedAbility();

    return {
      selectedIndex: this.selectedIndex,
      abilityId: ability?.abilityId ?? "",
      slotKey: this.selectedSlotKey,
      slotIndex: this.slotKeys.indexOf(this.selectedSlotKey),
      ability
    };
  }

  requireWithin(root, selector) {
    const element = root.querySelector(selector);
    if (!element) {
      throw new Error(`AbilityMenu: missing element "${selector}"`);
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
      const button = event.target.closest("[data-ability-index]");
      if (!button) {
        return;
      }

      const abilityIndex = Number.parseInt(button.dataset.abilityIndex ?? "", 10);
      if (Number.isInteger(abilityIndex)) {
        this.selectAbility(abilityIndex);
      }
    };
    const onSlotClick = (event) => {
      const button = event.target.closest("[data-ability-slot]");
      if (!button) {
        return;
      }

      this.selectSlot(button.dataset.abilitySlot);
    };
    const onUnlockClick = () => {
      const ability = this.getSelectedAbility();
      if (!ability || !ability.canUnlock) {
        return;
      }

      this.bus.emit("ability:unlockRequested", {
        abilityId: ability.abilityId,
        selectedIndex: this.selectedIndex,
        unlockCost: ability.unlockCost,
        availableEmbers: this.availableEmbers,
        ability
      });
    };
    const onEquipClick = () => {
      const ability = this.getSelectedAbility();
      if (!ability || !ability.canEquip) {
        return;
      }

      this.bus.emit("ability:equipRequested", {
        abilityId: ability.abilityId,
        selectedIndex: this.selectedIndex,
        slotKey: this.selectedSlotKey,
        slotIndex: this.slotKeys.indexOf(this.selectedSlotKey),
        ability
      });
    };

    this.root.addEventListener("click", onBackdropClick);
    this.closeButton.addEventListener("click", onCloseClick);
    this.list.addEventListener("click", onListClick);
    this.slotPicker.addEventListener("click", onSlotClick);
    this.unlockButton.addEventListener("click", onUnlockClick);
    this.equipButton.addEventListener("click", onEquipClick);

    this.domCleanups.push(() => {
      this.root.removeEventListener("click", onBackdropClick);
      this.closeButton.removeEventListener("click", onCloseClick);
      this.list.removeEventListener("click", onListClick);
      this.slotPicker.removeEventListener("click", onSlotClick);
      this.unlockButton.removeEventListener("click", onUnlockClick);
      this.equipButton.removeEventListener("click", onEquipClick);
    });
  }

  bindUIBus() {
    this.unsubs.push(
      this.bus.on("abilitymenu:open", (payload) => {
        this.open(payload ?? {});
      }),
      this.bus.on("abilitymenu:close", () => {
        this.close();
      }),
      this.bus.on("abilitymenu:toggle", (payload) => {
        this.toggle(payload ?? {});
      }),
      this.bus.on("abilitymenu:set", (payload) => {
        const abilities = this.readAbilitiesPayload(payload);
        if (!abilities) {
          return;
        }

        const selection = this.readSelectionPayload(payload);
        this.setAbilities(abilities, {
          availableEmbers: readAvailableEmbers(payload),
          equippedSlots: payload?.equippedSlots,
          selectedSelection: selection,
          preserveSelection: selection === null
        });
      }),
      this.bus.on("abilities:changed", (payload) => {
        const abilities = this.readAbilitiesPayload(payload);
        if (!abilities) {
          return;
        }

        this.setAbilities(abilities, {
          availableEmbers: readAvailableEmbers(payload),
          equippedSlots: payload?.equippedSlots,
          preserveSelection: true
        });
      }),
      this.bus.on("abilitymenu:select", (payload) => {
        const selection = this.readSelectionPayload(payload);
        if (selection === null) {
          return;
        }

        this.selectAbility(selection, { emit: false });
      }),
      this.bus.on("ability:unlocked", (payload) => {
        this.updateAbility(payload ?? {}, { unlocked: true });
        this.setStatus("success", payload ?? {});
      }),
      this.bus.on("ability:unlockFailed", (payload) => {
        this.setStatus("error", payload ?? {});
      }),
      this.bus.on("ability:equipped", (payload) => {
        this.updateAbility(payload ?? {}, { unlocked: true, equipped: true });
        this.setStatus("success", payload ?? {});
      }),
      this.bus.on("ability:equipFailed", (payload) => {
        this.setStatus("error", payload ?? {});
      })
    );
  }

  setStatus(kind, payload = {}) {
    const payloadAbilityId = normalizeText(payload?.abilityId);
    const selectedAbility = this.getSelectedAbility();

    if (payloadAbilityId && selectedAbility?.abilityId && payloadAbilityId !== selectedAbility.abilityId) {
      return;
    }

    const message = normalizeText(payload?.message)
      || normalizeText(payload?.reason)
      || (kind === "success"
        ? `${selectedAbility?.title ?? "Ability"} updated.`
        : `${selectedAbility?.title ?? "Ability"} request failed.`);

    this.statusState = { kind, message };
    this.renderStatus();
  }

  clearStatus() {
    this.statusState = null;
    this.renderStatus();
  }

  buildSlotPicker() {
    this.slotPicker.replaceChildren();

    for (const slotKey of this.slotKeys) {
      const button = this.document.createElement("button");
      button.type = "button";
      button.className = "abilitymenu-slot";
      button.dataset.abilitySlot = slotKey;
      button.textContent = slotKey;
      this.slotPicker.appendChild(button);
    }
  }

  render() {
    this.renderSummary();
    this.renderList();
    this.renderSlotPicker();
    this.renderDetail();
    this.renderStatus();
  }

  renderSummary() {
    const summary = summarizeAbilities(this.abilityViews);
    this.unlockedCount.textContent = `${summary.unlockedCount}/${summary.totalCount}`;
    this.totalCount.textContent = String(summary.equippedCount);
    this.embersCount.textContent = this.availableEmbers === null ? "--" : String(this.availableEmbers);

    if (this.abilityViews.length === 0) {
      this.selectionSummary.textContent = "No abilities";
      return;
    }

    this.selectionSummary.textContent = `Selected ${String(this.selectedIndex + 1).padStart(2, "0")}/${String(this.abilityViews.length).padStart(2, "0")}`;
  }

  renderList() {
    this.list.replaceChildren();

    const groups = groupAbilityViewsByAffinity(this.abilityViews);
    if (groups.length === 0) {
      const empty = this.document.createElement("p");
      empty.className = "abilitymenu-list__empty";
      empty.textContent = "No Hearthlight abilities recorded.";
      this.list.appendChild(empty);
      return;
    }

    for (const group of groups) {
      const section = this.document.createElement("section");
      const heading = this.document.createElement("div");
      const title = this.document.createElement("span");
      const count = this.document.createElement("span");

      section.className = "abilitymenu-group";
      heading.className = "abilitymenu-group__heading";
      title.className = "abilitymenu-group__title";
      title.textContent = group.affinity;
      count.className = "abilitymenu-group__count";
      count.textContent = String(group.abilities.length);
      heading.append(title, count);
      section.appendChild(heading);

      for (const ability of group.abilities) {
        const button = this.document.createElement("button");
        const titleRow = this.document.createElement("span");
        const name = this.document.createElement("span");
        const badge = this.document.createElement("span");
        const meta = this.document.createElement("span");
        const cost = this.document.createElement("span");
        const isSelected = ability.abilityIndex === this.selectedIndex;

        button.type = "button";
        button.className = "abilitymenu-ability";
        button.dataset.abilityIndex = String(ability.abilityIndex);
        button.dataset.state = ability.state;
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", String(isSelected));
        button.setAttribute("aria-label", ability.ariaLabel);
        button.title = ability.title;
        button.classList.toggle("is-selected", isSelected);

        titleRow.className = "abilitymenu-ability__title-row";
        name.className = "abilitymenu-ability__title";
        name.textContent = ability.title;
        badge.className = "abilitymenu-ability__badge";
        badge.textContent = ability.badgeText;
        titleRow.append(name, badge);

        meta.className = "abilitymenu-ability__meta";
        meta.textContent = `${ability.fpCostText} / ${ability.stateLabel}`;

        cost.className = "abilitymenu-ability__cost";
        cost.textContent = ability.costText;

        button.append(titleRow, meta, cost);
        section.appendChild(button);
      }

      this.list.appendChild(section);
    }
  }

  renderSlotPicker() {
    const selectedAbility = this.getSelectedAbility();
    for (const button of this.slotPicker.querySelectorAll("[data-ability-slot]")) {
      const slotKey = normalizeSlotKey(button.dataset.abilitySlot);
      const isSelected = slotKey === this.selectedSlotKey;
      const isEquippedHere = selectedAbility?.equippedSlotKey === slotKey;
      button.classList.toggle("is-selected", isSelected);
      button.classList.toggle("is-equipped", isEquippedHere);
      button.setAttribute("aria-pressed", String(isSelected));
    }
  }

  renderDetail() {
    const ability = this.getSelectedAbility();
    const detail = buildAbilityDetailView(ability);

    this.detailKicker.textContent = detail.affinity;
    this.detailTitle.textContent = detail.title;
    this.detailState.textContent = detail.stateLabel;
    this.detailState.dataset.state = detail.state;
    this.detailCost.textContent = detail.costText;
    this.detailFp.textContent = detail.fpCostText;
    this.detailDescription.textContent = detail.description;
    this.detailNotes.textContent = detail.notes;
    this.unlockButton.disabled = !detail.canUnlock || !detail.abilityId;
    this.equipButton.disabled = !detail.canEquip || !detail.abilityId;
    this.equipButton.textContent = `Equip ${this.selectedSlotKey}`;
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
    return this.root.querySelector(`[data-ability-index="${this.selectedIndex}"]`);
  }

  createDOM() {
    const root = this.document.createElement("section");
    root.id = "ability-menu-ui";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Hearthlight abilities");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="rf-panel abilitymenu-shell">
        <div class="abilitymenu-header">
          <div class="abilitymenu-heading">
            <p class="abilitymenu-kicker">Hearthlight</p>
            <h2 class="rf-title abilitymenu-title">Ability Attunement</h2>
          </div>
          <div class="abilitymenu-summary" aria-label="Ability summary">
            <div class="abilitymenu-summary__group">
              <span class="abilitymenu-summary__label">Unlocked</span>
              <span class="abilitymenu-summary__value" data-abilitymenu-unlocked>0/0</span>
            </div>
            <div class="abilitymenu-summary__group">
              <span class="abilitymenu-summary__label">Equipped</span>
              <span class="abilitymenu-summary__value" data-abilitymenu-total>0</span>
            </div>
            <div class="abilitymenu-summary__group">
              <span class="abilitymenu-summary__label">Embers</span>
              <span class="abilitymenu-summary__value" data-abilitymenu-embers>--</span>
            </div>
          </div>
          <button type="button" class="abilitymenu-back" data-abilitymenu-close>Back</button>
        </div>

        <div class="abilitymenu-layout">
          <section class="abilitymenu-list-pane" aria-label="Hearthlight abilities">
            <div class="abilitymenu-list__heading">
              <span class="abilitymenu-list__title">Affinities</span>
              <span class="abilitymenu-list__selected" data-abilitymenu-selected>No abilities</span>
            </div>
            <div class="abilitymenu-list" role="listbox" data-abilitymenu-list></div>
          </section>

          <aside class="abilitymenu-detail-pane" aria-live="polite">
            <div class="abilitymenu-detail__kicker" data-abilitymenu-detail-kicker>${DEFAULT_AFFINITY}</div>
            <div class="abilitymenu-detail__title-row">
              <h3 class="abilitymenu-detail__title" data-abilitymenu-detail-title>${EMPTY_ABILITY_TITLE}</h3>
              <span class="abilitymenu-detail__state" data-abilitymenu-detail-state>Unavailable</span>
            </div>
            <div class="abilitymenu-detail__stats">
              <span class="abilitymenu-detail__stat">
                <span class="abilitymenu-detail__stat-label">Cost</span>
                <span data-abilitymenu-detail-cost>--</span>
              </span>
              <span class="abilitymenu-detail__stat">
                <span class="abilitymenu-detail__stat-label">FP</span>
                <span data-abilitymenu-detail-fp>--</span>
              </span>
            </div>
            <p class="abilitymenu-detail__description" data-abilitymenu-detail-description>
              ${EMPTY_ABILITY_DESCRIPTION}
            </p>

            <section class="abilitymenu-slots-block">
              <div class="abilitymenu-slots__heading">Equip Slot</div>
              <div class="abilitymenu-slots" data-abilitymenu-slots></div>
            </section>

            <p class="abilitymenu-detail__notes" data-abilitymenu-detail-notes>
              Choose an ability to inspect its Hearthlight unlock state.
            </p>
            <p class="abilitymenu-status" data-abilitymenu-status hidden></p>

            <div class="abilitymenu-actions">
              <button
                type="button"
                class="abilitymenu-action"
                data-abilitymenu-unlock
                disabled
              >
                Unlock
              </button>
              <button
                type="button"
                class="abilitymenu-action abilitymenu-action--primary"
                data-abilitymenu-equip
                disabled
              >
                Equip Q
              </button>
            </div>
          </aside>
        </div>
      </div>
    `;

    return root;
  }
}

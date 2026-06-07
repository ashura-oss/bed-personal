const HOTBAR_SLOT_KEYS = Object.freeze(["Q", "E", "R"]);
const EMPTY_ABILITY_LABEL = "Empty";
const EMPTY_ABILITY_DESCRIPTION = "No ability equipped.";

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

function sanitizeSeconds(value, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function clamp01(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function mergeSlotAbility(slot) {
  if (!slot || typeof slot !== "object") {
    return {};
  }

  const ability = slot.ability && typeof slot.ability === "object" ? slot.ability : {};
  return { ...ability, ...slot };
}

function readAbilityId(source) {
  return normalizeText(source?.abilityId)
    || normalizeText(source?.id)
    || normalizeText(source?.key);
}

function readFpCost(source) {
  return sanitizeCount(
    readOptionalNumber(
      source?.fpCost,
      source?.focusCost,
      source?.costFp,
      source?.cost?.fp,
      source?.cost?.focus
    ),
    0
  );
}

export function formatHotbarFpCost(fpCost) {
  return `${sanitizeCount(fpCost, 0)} FP`;
}

export function formatHotbarCooldown(seconds) {
  const safeSeconds = sanitizeSeconds(seconds, 0);

  if (safeSeconds <= 0) {
    return "";
  }

  if (safeSeconds >= 10) {
    return `${Math.ceil(safeSeconds)}s`;
  }

  return `${(Math.ceil(safeSeconds * 10) / 10).toFixed(1)}s`;
}

export function buildHotbarSlotView(slot, slotIndex = 0, options = {}) {
  const slotKey = normalizeText(slot?.slotKey)
    || normalizeText(slot?.key)
    || normalizeText(slot?.binding)
    || HOTBAR_SLOT_KEYS[slotIndex]
    || String(slotIndex + 1);
  const source = mergeSlotAbility(slot);
  const abilityId = readAbilityId(source);
  const isEmpty = abilityId.length === 0;
  const label = normalizeText(source?.name)
    || normalizeText(source?.displayName)
    || normalizeText(source?.label)
    || humanizeId(abilityId)
    || EMPTY_ABILITY_LABEL;
  const affinity = normalizeText(source?.affinity)
    || normalizeText(source?.school)
    || normalizeText(source?.element)
    || "";
  const fpCost = readFpCost(source);
  const currentFp = readOptionalNumber(options.currentFp, options.fp);
  const hasEnoughFp = currentFp === null || fpCost <= currentFp;
  const cooldownRemaining = sanitizeSeconds(
    readOptionalNumber(
      source?.cooldownRemaining,
      source?.remainingCooldown,
      source?.cooldown?.remaining,
      source?.cooldown
    ),
    0
  );
  const cooldownDuration = sanitizeSeconds(
    readOptionalNumber(
      source?.cooldownDuration,
      source?.cooldownMax,
      source?.cooldownTotal,
      source?.cooldown?.duration,
      source?.cooldown?.max
    ),
    cooldownRemaining
  );
  const cooldownProgress = cooldownRemaining > 0
    ? clamp01(cooldownDuration > 0 ? cooldownRemaining / cooldownDuration : 1)
    : 0;
  const explicitUnlocked = readOptionalBoolean(source?.isUnlocked, source?.unlocked);
  const isUnlocked = isEmpty ? false : explicitUnlocked ?? true;
  const explicitAvailable = readOptionalBoolean(
    source?.isAvailable,
    source?.available,
    source?.canUse
  );
  const explicitReady = readOptionalBoolean(source?.isReady, source?.ready);
  const isActive = readOptionalBoolean(source?.isActive, source?.active) ?? false;
  const isOnCooldown = cooldownRemaining > 0;
  const isAvailable = !isEmpty
    && isUnlocked
    && !isOnCooldown
    && hasEnoughFp
    && explicitAvailable !== false;
  const isReady = explicitReady ?? isAvailable;
  const unavailableReason = normalizeText(source?.unavailableReason)
    || normalizeText(source?.reason)
    || normalizeText(source?.failureReason);
  let state = "ready";
  let statusLabel = "Ready";

  if (isEmpty) {
    state = "empty";
    statusLabel = "Empty";
  } else if (!isUnlocked) {
    state = "locked";
    statusLabel = "Locked";
  } else if (isActive) {
    state = "active";
    statusLabel = "Active";
  } else if (isOnCooldown) {
    state = "cooldown";
    statusLabel = formatHotbarCooldown(cooldownRemaining);
  } else if (!hasEnoughFp) {
    state = "unavailable";
    statusLabel = `Need ${fpCost} FP`;
  } else if (explicitAvailable === false || explicitReady === false) {
    state = "unavailable";
    statusLabel = unavailableReason || "Unavailable";
  }

  return Object.freeze({
    slotIndex,
    slotKey,
    abilityId,
    label,
    affinity,
    description: normalizeText(source?.description)
      || normalizeText(source?.summary)
      || (isEmpty ? EMPTY_ABILITY_DESCRIPTION : `No field notes recorded for ${label}.`),
    fpCost,
    fpCostText: isEmpty ? "--" : formatHotbarFpCost(fpCost),
    cooldownRemaining,
    cooldownDuration,
    cooldownProgress,
    cooldownLabel: formatHotbarCooldown(cooldownRemaining),
    state,
    statusLabel,
    isEmpty,
    isUnlocked,
    isActive,
    isReady: isReady && state === "ready",
    isAvailable: isAvailable && state === "ready",
    canRequest: state === "ready" || state === "active",
    ariaLabel: isEmpty
      ? `${slotKey}, empty ability slot`
      : `${slotKey}, ${label}, ${formatHotbarFpCost(fpCost)}, ${statusLabel}`
  });
}

export function normalizeHotbarSlots(slots) {
  if (Array.isArray(slots)) {
    return HOTBAR_SLOT_KEYS.map((slotKey, index) => ({
      slotKey,
      ...(slots[index] ?? {})
    }));
  }

  if (slots && typeof slots === "object") {
    return HOTBAR_SLOT_KEYS.map((slotKey) => {
      const value = slots[slotKey] ?? slots[slotKey.toLowerCase()] ?? null;
      return { slotKey, ...(value ?? {}) };
    });
  }

  return HOTBAR_SLOT_KEYS.map((slotKey) => ({ slotKey }));
}

export function buildHotbarSlotViews(slots, options = {}) {
  return normalizeHotbarSlots(slots).map((slot, index) => {
    return buildHotbarSlotView(slot, index, options);
  });
}

export class Hotbar {
  constructor(bus, options = {}) {
    if (!bus || typeof bus.on !== "function" || typeof bus.emit !== "function") {
      throw new TypeError("Hotbar: bus with on() and emit() is required");
    }

    const documentRef = options.document ?? (typeof document !== "undefined" ? document : null);
    if (!documentRef) {
      throw new Error("Hotbar: document is required");
    }

    this.bus = bus;
    this.document = documentRef;
    this.unsubs = [];
    this.domCleanups = [];
    this.currentFp = readOptionalNumber(options.currentFp, options.fp);
    this.maxFp = readOptionalNumber(options.maxFp);
    this.rawSlots = normalizeHotbarSlots(options.slots);
    this.slotViews = buildHotbarSlotViews(this.rawSlots, { currentFp: this.currentFp });
    this.mount = options.mount ?? this.document.getElementById("app") ?? this.document.body;

    if (!this.mount) {
      throw new Error("Hotbar: mount element is required");
    }

    this.root = this.createDOM();
    this.mount.appendChild(this.root);
    this.row = this.requireWithin(this.root, "[data-hotbar-row]");
    this.slotButtons = [];

    this.buildSlots();
    this.bindUIBus();
    this.render();
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

  readSlotsPayload(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload?.slots) {
      return payload.slots;
    }

    if (payload?.hotbar) {
      return payload.hotbar;
    }

    if (payload?.abilitySlots) {
      return payload.abilitySlots;
    }

    return null;
  }

  setHotbar(payload = {}) {
    const slots = this.readSlotsPayload(payload);
    const nextFp = readOptionalNumber(payload?.currentFp, payload?.fp, payload?.focus);
    const nextMaxFp = readOptionalNumber(payload?.maxFp, payload?.fpMax, payload?.maxFocus);

    if (nextFp !== null) {
      this.currentFp = nextFp;
    }

    if (nextMaxFp !== null) {
      this.maxFp = nextMaxFp;
    }

    if (slots) {
      this.rawSlots = normalizeHotbarSlots(slots);
    }

    this.rebuildViews();
  }

  setFp(payload = {}) {
    const current = readOptionalNumber(payload?.current, payload?.currentFp, payload?.fp, payload);
    const max = readOptionalNumber(payload?.max, payload?.maxFp);

    if (current !== null) {
      this.currentFp = current;
    }

    if (max !== null) {
      this.maxFp = max;
    }

    this.rebuildViews();
  }

  updateSlot(payload = {}) {
    const slotKey = normalizeText(payload?.slotKey)
      || normalizeText(payload?.key)
      || normalizeText(payload?.binding);
    const abilityId = normalizeText(payload?.abilityId) || normalizeText(payload?.id);
    const nextSlots = this.rawSlots.map((slot) => {
      const source = mergeSlotAbility(slot);
      const matchesSlot = slotKey && normalizeText(slot.slotKey) === slotKey.toUpperCase();
      const matchesAbility = abilityId && readAbilityId(source) === abilityId;

      if (!matchesSlot && !matchesAbility) {
        return slot;
      }

      return { ...slot, ...payload };
    });

    this.rawSlots = nextSlots;
    this.rebuildViews();
  }

  rebuildViews() {
    this.slotViews = buildHotbarSlotViews(this.rawSlots, { currentFp: this.currentFp });
    this.render();
  }

  requireWithin(root, selector) {
    const element = root.querySelector(selector);
    if (!element) {
      throw new Error(`Hotbar: missing element "${selector}"`);
    }

    return element;
  }

  bindUIBus() {
    this.unsubs.push(
      this.bus.on("hotbar:set", (payload) => {
        this.setHotbar(payload ?? {});
      }),
      this.bus.on("hotbar:update", (payload) => {
        this.updateSlot(payload ?? {});
      }),
      this.bus.on("abilities:hotbar", (payload) => {
        this.setHotbar(payload ?? {});
      }),
      this.bus.on("player:fpChanged", (payload) => {
        this.setFp(payload ?? {});
      }),
      this.bus.on("ability:cooldownChanged", (payload) => {
        this.updateSlot(payload ?? {});
      }),
      this.bus.on("ability:activated", (payload) => {
        this.updateSlot({ ...(payload ?? {}), isActive: true });
      }),
      this.bus.on("ability:deactivated", (payload) => {
        this.updateSlot({ ...(payload ?? {}), isActive: false });
      })
    );
  }

  buildSlots() {
    for (let index = 0; index < HOTBAR_SLOT_KEYS.length; index += 1) {
      const button = this.document.createElement("button");
      button.type = "button";
      button.className = "hotbar-slot";
      button.dataset.hotbarIndex = String(index);
      button.innerHTML = `
        <span class="hotbar-slot__cooldown" data-hotbar-cooldown-fill></span>
        <span class="hotbar-slot__key" data-hotbar-key></span>
        <span class="hotbar-slot__body">
          <span class="hotbar-slot__name" data-hotbar-name></span>
          <span class="hotbar-slot__meta">
            <span data-hotbar-cost></span>
            <span data-hotbar-status></span>
          </span>
        </span>
      `;

      const onClick = () => {
        const slot = this.slotViews[index];
        if (!slot || !slot.canRequest) {
          return;
        }

        this.bus.emit("ability:activateRequested", {
          slotKey: slot.slotKey,
          slotIndex: slot.slotIndex,
          abilityId: slot.abilityId,
          ability: slot
        });
      };

      button.addEventListener("click", onClick);
      this.domCleanups.push(() => button.removeEventListener("click", onClick));
      this.row.appendChild(button);
      this.slotButtons.push(button);
    }
  }

  render() {
    for (let index = 0; index < this.slotButtons.length; index += 1) {
      const button = this.slotButtons[index];
      const slot = this.slotViews[index];

      if (!button || !slot) {
        continue;
      }

      this.requireWithin(button, "[data-hotbar-key]").textContent = slot.slotKey;
      this.requireWithin(button, "[data-hotbar-name]").textContent = slot.label;
      this.requireWithin(button, "[data-hotbar-cost]").textContent = slot.fpCostText;
      this.requireWithin(button, "[data-hotbar-status]").textContent = slot.statusLabel;

      const fill = this.requireWithin(button, "[data-hotbar-cooldown-fill]");
      fill.style.setProperty("--hotbar-cooldown", String(slot.cooldownProgress));

      button.title = slot.description;
      button.disabled = !slot.canRequest;
      button.setAttribute("aria-label", slot.ariaLabel);
      button.dataset.state = slot.state;
      button.classList.toggle("is-empty", slot.isEmpty);
      button.classList.toggle("is-ready", slot.state === "ready");
      button.classList.toggle("is-active", slot.state === "active");
      button.classList.toggle("is-unavailable", slot.state === "unavailable" || slot.state === "locked");
      button.classList.toggle("is-cooldown", slot.state === "cooldown");
    }
  }

  createDOM() {
    const root = this.document.createElement("section");
    root.id = "hotbar-ui";
    root.setAttribute("aria-label", "Ability hotbar");
    root.innerHTML = `
      <div class="hotbar-row" role="toolbar" aria-label="Equipped abilities" data-hotbar-row></div>
    `;

    return root;
  }
}

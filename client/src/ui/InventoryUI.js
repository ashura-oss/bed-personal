const DEFAULT_GRID_ROWS = 6;
const DEFAULT_GRID_COLUMNS = 8;
const DEFAULT_SLOT_COUNT = DEFAULT_GRID_ROWS * DEFAULT_GRID_COLUMNS;
const EMPTY_SLOT_LABEL = "Empty Slot";
const EMPTY_SLOT_DESCRIPTION = "No carried item recorded in this slot.";
const DEFAULT_CATEGORY = "Field Material";
const DEFAULT_RARITY = "Common";

export function formatInventoryStackCount(count) {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;

  if (safeCount <= 0) {
    return "";
  }

  if (safeCount > 999) {
    return "999+";
  }

  return String(safeCount);
}

export function humanizeInventoryItemId(itemId) {
  if (typeof itemId !== "string" || itemId.trim().length === 0) {
    return "";
  }

  return itemId
    .trim()
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function deriveSigil(label) {
  const parts = normalizeText(label)
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "--";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function buildInventorySlotView(slot, slotIndex) {
  const itemId = normalizeText(slot?.itemId);
  const count = Number.isInteger(slot?.count) ? Math.max(0, slot.count) : 0;
  const isEmpty = !itemId || count <= 0;
  const label = normalizeText(slot?.name)
    || normalizeText(slot?.label)
    || humanizeInventoryItemId(itemId)
    || EMPTY_SLOT_LABEL;
  const category = normalizeText(slot?.category)
    || normalizeText(slot?.type)
    || (isEmpty ? "" : DEFAULT_CATEGORY);
  const rarity = normalizeText(slot?.rarity) || (isEmpty ? "" : DEFAULT_RARITY);
  const description = normalizeText(slot?.description)
    || normalizeText(slot?.summary)
    || (isEmpty ? EMPTY_SLOT_DESCRIPTION : `No field notes recorded for ${label}.`);
  const notes = normalizeText(slot?.notes) || normalizeText(slot?.flavor);
  const sigil = normalizeText(slot?.sigil)
    || normalizeText(slot?.glyph)
    || normalizeText(slot?.iconText)
    || (isEmpty ? "--" : deriveSigil(label));

  return Object.freeze({
    slotIndex,
    itemId: isEmpty ? "" : itemId,
    count: isEmpty ? 0 : count,
    countText: isEmpty ? "" : formatInventoryStackCount(count),
    label,
    sigil,
    category,
    rarity,
    description,
    notes,
    isEmpty,
    ariaLabel: isEmpty
      ? `Slot ${slotIndex + 1}, empty`
      : `Slot ${slotIndex + 1}, ${label}, stack ${count}`
  });
}

export function buildInventorySlotViews(slots, slotCount = DEFAULT_SLOT_COUNT) {
  const safeSlotCount = Number.isInteger(slotCount) && slotCount > 0
    ? slotCount
    : DEFAULT_SLOT_COUNT;
  const source = Array.isArray(slots) ? slots : [];
  const views = [];

  for (let index = 0; index < safeSlotCount; index += 1) {
    views.push(buildInventorySlotView(source[index] ?? null, index));
  }

  return views;
}

export function resolveInventorySelection(slotViews, requestedIndex = null, fallbackIndex = null) {
  const maxIndex = Array.isArray(slotViews) ? slotViews.length - 1 : -1;

  if (Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex <= maxIndex) {
    return requestedIndex;
  }

  if (Number.isInteger(fallbackIndex) && fallbackIndex >= 0 && fallbackIndex <= maxIndex) {
    return fallbackIndex;
  }

  if (!Array.isArray(slotViews) || slotViews.length === 0) {
    return 0;
  }

  const firstOccupied = slotViews.findIndex((slot) => !slot.isEmpty);
  return firstOccupied >= 0 ? firstOccupied : 0;
}

export function buildInventoryDetailView(slotView) {
  const slotNumber = Number.isInteger(slotView?.slotIndex) ? slotView.slotIndex + 1 : 1;

  if (!slotView || slotView.isEmpty) {
    return Object.freeze({
      slotLabel: `Slot ${String(slotNumber).padStart(2, "0")}`,
      title: EMPTY_SLOT_LABEL,
      meta: "No stack recorded",
      countText: "--",
      description: EMPTY_SLOT_DESCRIPTION,
      notes: "Select an occupied slot to inspect its carried count and field notes.",
      itemId: "--"
    });
  }

  const metaParts = [slotView.rarity, slotView.category].filter(Boolean);

  return Object.freeze({
    slotLabel: `Slot ${String(slotNumber).padStart(2, "0")}`,
    title: slotView.label,
    meta: metaParts.join(" / "),
    countText: `x${slotView.count}`,
    description: slotView.description,
    notes: slotView.notes || "Counts reflect the carried stack in your field pack.",
    itemId: slotView.itemId
  });
}

function summarizeInventory(slotViews) {
  const occupied = slotViews.filter((slot) => !slot.isEmpty).length;
  const totalCount = slotViews.reduce((sum, slot) => sum + slot.count, 0);

  return {
    occupiedText: `${occupied}/${slotViews.length}`,
    totalCountText: String(totalCount)
  };
}

export class InventoryUI {
  constructor(bus, options = {}) {
    if (!bus || typeof bus.on !== "function" || typeof bus.emit !== "function") {
      throw new TypeError("InventoryUI: bus with on() and emit() is required");
    }

    this.bus = bus;
    this.rows = Number.isInteger(options.rows) && options.rows > 0
      ? options.rows
      : DEFAULT_GRID_ROWS;
    this.columns = Number.isInteger(options.columns) && options.columns > 0
      ? options.columns
      : DEFAULT_GRID_COLUMNS;
    this.slotCount = this.rows * this.columns;
    this.unsubs = [];
    this.domCleanups = [];
    this.isOpen = false;
    this.selectedIndex = 0;
    this.slotViews = buildInventorySlotViews(options.slots, this.slotCount);
    this.mount = options.mount ?? document.getElementById("app") ?? document.body;
    this.root = this.createDOM();
    this.mount.appendChild(this.root);

    this.shell = this.requireWithin(this.root, ".inventory-shell");
    this.grid = this.requireWithin(this.root, ".inventory-grid");
    this.detailSlot = this.requireWithin(this.root, "[data-inventory-detail-slot]");
    this.detailTitle = this.requireWithin(this.root, "[data-inventory-detail-title]");
    this.detailMeta = this.requireWithin(this.root, "[data-inventory-detail-meta]");
    this.detailCount = this.requireWithin(this.root, "[data-inventory-detail-count]");
    this.detailDescription = this.requireWithin(this.root, "[data-inventory-detail-description]");
    this.detailNotes = this.requireWithin(this.root, "[data-inventory-detail-notes]");
    this.detailItemId = this.requireWithin(this.root, "[data-inventory-detail-item-id]");
    this.occupiedCount = this.requireWithin(this.root, "[data-inventory-occupied]");
    this.totalCount = this.requireWithin(this.root, "[data-inventory-total]");
    this.closeButton = this.requireWithin(this.root, "[data-inventory-close]");
    this.slotButtons = [];

    this.buildGrid();
    this.bindDOM();
    this.bindUIBus();
    this.selectedIndex = resolveInventorySelection(this.slotViews, options.selectedIndex);
    this.render();
  }

  get isVisible() {
    return this.isOpen;
  }

  open(payload = {}) {
    const slots = this.readSlotsPayload(payload);
    if (slots) {
      this.setInventory(slots, {
        selectedIndex: payload?.selectedIndex,
        preserveSelection: !Number.isInteger(payload?.selectedIndex)
      });
    } else if (Number.isInteger(payload?.selectedIndex)) {
      this.selectSlot(payload.selectedIndex, { emit: false });
    }

    this.isOpen = true;
    this.root.classList.add("menu-open");
    this.root.setAttribute("aria-hidden", "false");
    this.bus.emit("inventory:opened", {
      selectedIndex: this.selectedIndex,
      slot: this.slotViews[this.selectedIndex] ?? null
    });
    this.slotButtons[this.selectedIndex]?.focus();
  }

  close({ emit = true } = {}) {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.root.classList.remove("menu-open");
    this.root.setAttribute("aria-hidden", "true");

    if (emit) {
      this.bus.emit("inventory:closed", {
        selectedIndex: this.selectedIndex,
        slot: this.slotViews[this.selectedIndex] ?? null
      });
    }
  }

  toggle(payload = {}) {
    if (this.isOpen) {
      this.close();
      return;
    }

    this.open(payload);
  }

  setInventory(slots, { selectedIndex = null, preserveSelection = true } = {}) {
    this.slotViews = buildInventorySlotViews(slots, this.slotCount);
    this.selectedIndex = resolveInventorySelection(
      this.slotViews,
      selectedIndex,
      preserveSelection ? this.selectedIndex : null
    );
    this.render();
  }

  selectSlot(slotIndex, { emit = true } = {}) {
    const nextIndex = resolveInventorySelection(this.slotViews, slotIndex, this.selectedIndex);
    this.selectedIndex = nextIndex;
    this.renderSelection();
    this.renderDetail();

    if (emit) {
      this.bus.emit("inventory:select", {
        selectedIndex: this.selectedIndex,
        slot: this.slotViews[this.selectedIndex] ?? null
      });
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

  readSlotsPayload(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.slots)) {
      return payload.slots;
    }

    if (Array.isArray(payload?.inventorySlots)) {
      return payload.inventorySlots;
    }

    return null;
  }

  requireWithin(root, selector) {
    const element = root.querySelector(selector);
    if (!element) {
      throw new Error(`InventoryUI: missing element "${selector}"`);
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

    this.root.addEventListener("click", onBackdropClick);
    this.closeButton.addEventListener("click", onCloseClick);

    this.domCleanups.push(() => {
      this.root.removeEventListener("click", onBackdropClick);
      this.closeButton.removeEventListener("click", onCloseClick);
    });
  }

  bindUIBus() {
    this.unsubs.push(
      this.bus.on("inventory:open", (payload) => {
        this.open(payload ?? {});
      }),
      this.bus.on("inventory:close", () => {
        this.close();
      }),
      this.bus.on("inventory:toggle", (payload) => {
        this.toggle(payload ?? {});
      }),
      this.bus.on("inventory:set", (payload) => {
        const slots = this.readSlotsPayload(payload);
        if (!slots) {
          return;
        }

        this.setInventory(slots, {
          selectedIndex: payload?.selectedIndex,
          preserveSelection: !Number.isInteger(payload?.selectedIndex)
        });
      }),
      this.bus.on("inventory:select", ({ selectedIndex, slotIndex } = {}) => {
        const nextIndex = Number.isInteger(selectedIndex) ? selectedIndex : slotIndex;
        if (!Number.isInteger(nextIndex) || nextIndex === this.selectedIndex) {
          return;
        }

        this.selectSlot(nextIndex, { emit: false });
      })
    );
  }

  buildGrid() {
    this.grid.style.setProperty("--inventory-columns", String(this.columns));

    for (let index = 0; index < this.slotCount; index += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inventory-slot";
      button.dataset.slotIndex = String(index);
      button.innerHTML = `
        <span class="inventory-slot__index"></span>
        <span class="inventory-slot__sigil"></span>
        <span class="inventory-slot__count"></span>
      `;

      const onClick = () => {
        this.selectSlot(index);
      };

      button.addEventListener("click", onClick);
      this.domCleanups.push(() => button.removeEventListener("click", onClick));
      this.grid.appendChild(button);
      this.slotButtons.push(button);
    }
  }

  render() {
    for (let index = 0; index < this.slotButtons.length; index += 1) {
      const button = this.slotButtons[index];
      const slotView = this.slotViews[index];

      if (!button || !slotView) {
        continue;
      }

      const indexLine = this.requireWithin(button, ".inventory-slot__index");
      const sigilLine = this.requireWithin(button, ".inventory-slot__sigil");
      const countLine = this.requireWithin(button, ".inventory-slot__count");

      indexLine.textContent = String(index + 1).padStart(2, "0");
      sigilLine.textContent = slotView.sigil;
      countLine.textContent = slotView.countText;

      button.setAttribute("aria-label", slotView.ariaLabel);
      button.title = slotView.isEmpty ? `Slot ${index + 1}` : slotView.label;
      button.classList.toggle("is-filled", !slotView.isEmpty);
      button.classList.toggle("is-empty", slotView.isEmpty);
    }

    this.renderSelection();
    this.renderDetail();
    this.renderSummary();
  }

  renderSelection() {
    for (let index = 0; index < this.slotButtons.length; index += 1) {
      const button = this.slotButtons[index];
      if (!button) {
        continue;
      }

      const isSelected = index === this.selectedIndex;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    }
  }

  renderDetail() {
    const detail = buildInventoryDetailView(this.slotViews[this.selectedIndex] ?? null);

    this.detailSlot.textContent = detail.slotLabel;
    this.detailTitle.textContent = detail.title;
    this.detailMeta.textContent = detail.meta;
    this.detailCount.textContent = detail.countText;
    this.detailDescription.textContent = detail.description;
    this.detailNotes.textContent = detail.notes;
    this.detailItemId.textContent = detail.itemId;
  }

  renderSummary() {
    const summary = summarizeInventory(this.slotViews);
    this.occupiedCount.textContent = summary.occupiedText;
    this.totalCount.textContent = summary.totalCountText;
  }

  createDOM() {
    const root = document.createElement("section");
    root.id = "inventory-ui";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Inventory");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="rf-panel inventory-shell">
        <div class="inventory-header">
          <div class="inventory-heading">
            <p class="inventory-kicker">Field Pack</p>
            <h2 class="rf-title inventory-title">Inventory Ledger</h2>
          </div>
          <div class="inventory-summary" aria-label="Inventory summary">
            <div class="inventory-summary__group">
              <span class="inventory-summary__label">Stacks</span>
              <span class="inventory-summary__value" data-inventory-occupied>0/${this.slotCount}</span>
            </div>
            <div class="inventory-summary__group">
              <span class="inventory-summary__label">Units</span>
              <span class="inventory-summary__value" data-inventory-total>0</span>
            </div>
          </div>
          <button
            type="button"
            class="inventory-close"
            data-inventory-close
            aria-label="Close inventory"
          >
            ×
          </button>
        </div>

        <div class="inventory-layout">
          <section class="inventory-grid-pane" aria-label="Inventory slots">
            <div class="inventory-grid" role="grid"></div>
          </section>

          <aside class="inventory-detail-pane" aria-live="polite">
            <div class="inventory-detail__slot" data-inventory-detail-slot>Slot 01</div>
            <div class="inventory-detail__title-row">
              <h3 class="inventory-detail__title" data-inventory-detail-title>${EMPTY_SLOT_LABEL}</h3>
              <span class="inventory-detail__count" data-inventory-detail-count>--</span>
            </div>
            <div class="inventory-detail__meta" data-inventory-detail-meta>No stack recorded</div>
            <p class="inventory-detail__description" data-inventory-detail-description>
              ${EMPTY_SLOT_DESCRIPTION}
            </p>
            <p class="inventory-detail__notes" data-inventory-detail-notes>
              Select an occupied slot to inspect its carried count and field notes.
            </p>
            <div class="inventory-detail__foot">
              <span class="inventory-detail__foot-label">Registry</span>
              <span class="inventory-detail__foot-value" data-inventory-detail-item-id>--</span>
            </div>
          </aside>
        </div>
      </div>
    `;

    return root;
  }
}

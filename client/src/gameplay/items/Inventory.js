import { assertKnownItemId } from "./ItemDefinitions.js";

export const INVENTORY_MAX_SLOTS = 48;

function assertPositiveInteger(quantity, label = "quantity") {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new RangeError(`Inventory ${label} must be a positive integer`);
  }

  return quantity;
}

function getStackSize(definition) {
  return Number.isInteger(definition.stackSize) && definition.stackSize > 0 ? definition.stackSize : 1;
}

function createEmptySlot(index) {
  return { index, itemId: null, count: 0 };
}

function snapshotSlot(slot) {
  return Object.freeze({
    index: slot.index,
    itemId: slot.itemId,
    count: slot.count
  });
}

function normalizeSerializedEntry(entry, index) {
  const definition = assertKnownItemId(entry?.itemId);
  const count = assertPositiveInteger(entry?.count, `slot ${index} count`);
  const stackSize = getStackSize(definition);

  if (count > stackSize) {
    throw new RangeError(
      `Serialized stack for "${definition.id}" exceeds its stack size (${count} > ${stackSize})`
    );
  }

  return {
    itemId: definition.id,
    count
  };
}

export class Inventory {
  constructor() {
    this._slots = Array.from({ length: INVENTORY_MAX_SLOTS }, (_, index) => createEmptySlot(index));
  }

  get maxSlots() {
    return INVENTORY_MAX_SLOTS;
  }

  addItem(itemId, quantity = 1) {
    const definition = assertKnownItemId(itemId);
    const requested = assertPositiveInteger(quantity);
    const stackSize = getStackSize(definition);

    if (this._remainingCapacityFor(definition.id, stackSize) < requested) {
      return false;
    }

    let remaining = requested;

    for (const slot of this._slots) {
      if (remaining === 0) break;
      if (slot.itemId !== definition.id || slot.count >= stackSize) continue;

      const added = Math.min(stackSize - slot.count, remaining);
      slot.count += added;
      remaining -= added;
    }

    for (const slot of this._slots) {
      if (remaining === 0) break;
      if (slot.itemId !== null) continue;

      const added = Math.min(stackSize, remaining);
      slot.itemId = definition.id;
      slot.count = added;
      remaining -= added;
    }

    return true;
  }

  removeItem(itemId, quantity = 1) {
    const definition = assertKnownItemId(itemId);
    const requested = assertPositiveInteger(quantity);

    if (this._totalCount(definition.id) < requested) {
      return false;
    }

    let remaining = requested;

    for (let index = this._slots.length - 1; index >= 0 && remaining > 0; index -= 1) {
      const slot = this._slots[index];
      if (slot.itemId !== definition.id) continue;

      const removed = Math.min(slot.count, remaining);
      slot.count -= removed;
      remaining -= removed;

      if (slot.count === 0) {
        slot.itemId = null;
      }
    }

    return true;
  }

  hasItem(itemId, quantity = 1) {
    const definition = assertKnownItemId(itemId);
    const requested = assertPositiveInteger(quantity);
    return this._totalCount(definition.id) >= requested;
  }

  getSlots() {
    return Object.freeze(this._slots.map((slot) => snapshotSlot(slot)));
  }

  toJSON() {
    const snapshot = [];

    for (const slot of this._slots) {
      if (slot.itemId === null) continue;
      snapshot.push(Object.freeze({ itemId: slot.itemId, count: slot.count }));
    }

    return Object.freeze(snapshot);
  }

  fromJSON(slots) {
    if (slots == null) {
      this.clear();
      return this;
    }

    if (!Array.isArray(slots)) {
      throw new TypeError("Inventory.fromJSON expects an array of serialized slots");
    }

    if (slots.length > INVENTORY_MAX_SLOTS) {
      throw new RangeError(`Inventory serialization exceeds ${INVENTORY_MAX_SLOTS} slots`);
    }

    const normalizedSlots = slots.map((slot, index) => normalizeSerializedEntry(slot, index));

    this.clear();

    for (let index = 0; index < slots.length; index += 1) {
      const slot = normalizedSlots[index];
      this._slots[index].itemId = slot.itemId;
      this._slots[index].count = slot.count;
    }

    return this;
  }

  clear() {
    for (const slot of this._slots) {
      slot.itemId = null;
      slot.count = 0;
    }

    return this;
  }

  _remainingCapacityFor(itemId, stackSize) {
    let capacity = 0;

    for (const slot of this._slots) {
      if (slot.itemId === null) {
        capacity += stackSize;
      } else if (slot.itemId === itemId) {
        capacity += stackSize - slot.count;
      }
    }

    return capacity;
  }

  _totalCount(itemId) {
    let total = 0;

    for (const slot of this._slots) {
      if (slot.itemId === itemId) {
        total += slot.count;
      }
    }

    return total;
  }

  static fromJSON(slots) {
    return new Inventory().fromJSON(slots);
  }
}

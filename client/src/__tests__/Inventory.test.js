import { describe, expect, it } from "@jest/globals";
import { Inventory, INVENTORY_MAX_SLOTS } from "../gameplay/items/Inventory.js";
import { getItemDefinition } from "../gameplay/items/ItemDefinitions.js";

describe("Inventory", () => {
  it("starts with 48 stable empty slots", () => {
    const inventory = new Inventory();
    const slots = inventory.getSlots();

    expect(slots).toHaveLength(INVENTORY_MAX_SLOTS);
    expect(slots[0]).toEqual({ index: 0, itemId: null, count: 0 });
    expect(slots[INVENTORY_MAX_SLOTS - 1]).toEqual({
      index: INVENTORY_MAX_SLOTS - 1,
      itemId: null,
      count: 0
    });
  });

  it("stacks into existing slots before opening a new one", () => {
    const inventory = new Inventory();
    const stackSize = getItemDefinition("timber").stackSize;

    expect(inventory.addItem("timber", stackSize - 9)).toBe(true);
    expect(inventory.addItem("timber", 20)).toBe(true);

    const slots = inventory.getSlots();
    expect(slots[0]).toEqual({ index: 0, itemId: "timber", count: stackSize });
    expect(slots[1]).toEqual({ index: 1, itemId: "timber", count: 11 });
  });

  it("returns false without mutating when there is not enough room for the full add", () => {
    const inventory = new Inventory();
    const stackSize = getItemDefinition("timber").stackSize;

    expect(inventory.addItem("timber", stackSize * INVENTORY_MAX_SLOTS)).toBe(true);
    const before = inventory.getSlots();

    expect(inventory.addItem("timber", 1)).toBe(false);
    expect(inventory.getSlots()).toEqual(before);
  });

  it("removes from later stacks first so earlier slots stay stable", () => {
    const inventory = new Inventory();
    const stackSize = getItemDefinition("timber").stackSize;

    inventory.addItem("timber", stackSize + 5);
    expect(inventory.removeItem("timber", 5)).toBe(true);

    const slots = inventory.getSlots();
    expect(slots[0]).toEqual({ index: 0, itemId: "timber", count: stackSize });
    expect(slots[1]).toEqual({ index: 1, itemId: null, count: 0 });
  });

  it("checks quantities across multiple stacks", () => {
    const inventory = new Inventory();
    const stackSize = getItemDefinition("timber").stackSize;

    inventory.addItem("timber", stackSize + 4);

    expect(inventory.hasItem("timber", stackSize + 4)).toBe(true);
    expect(inventory.hasItem("timber", stackSize + 5)).toBe(false);
    expect(inventory.removeItem("timber", stackSize + 5)).toBe(false);
  });

  it("serializes occupied stacks for RunState and restores them without merging", () => {
    const inventory = new Inventory();

    inventory.addItem("timber", 70);
    inventory.addItem("ashleaf", 3);

    const restored = Inventory.fromJSON([
      { itemId: "timber", count: 70 },
      { itemId: "timber", count: 12 },
      { itemId: "ashleaf", count: 3 }
    ]);

    expect(inventory.toJSON()).toEqual([
      { itemId: "timber", count: 70 },
      { itemId: "ashleaf", count: 3 }
    ]);

    expect(restored.getSlots()[0]).toEqual({ index: 0, itemId: "timber", count: 70 });
    expect(restored.getSlots()[1]).toEqual({ index: 1, itemId: "timber", count: 12 });
    expect(restored.getSlots()[2]).toEqual({ index: 2, itemId: "ashleaf", count: 3 });
  });

  it("clears back to the stable empty slot shape", () => {
    const inventory = new Inventory();

    inventory.addItem("iron_ore", 5);
    inventory.clear();

    expect(inventory.getSlots()[0]).toEqual({ index: 0, itemId: null, count: 0 });
    expect(inventory.toJSON()).toEqual([]);
  });

  it("rejects invalid quantities, unknown ids, and invalid serialized stacks", () => {
    const inventory = new Inventory();
    const timberStackSize = getItemDefinition("timber").stackSize;

    expect(() => inventory.addItem("timber", 0)).toThrow(RangeError);
    expect(() => inventory.removeItem("missing_item", 1)).toThrow(RangeError);
    expect(() => inventory.hasItem("timber", 1.5)).toThrow(RangeError);
    inventory.addItem("ashleaf", 2);
    expect(() => inventory.fromJSON([{ itemId: "timber", count: timberStackSize + 1 }])).toThrow(RangeError);
    expect(inventory.toJSON()).toEqual([{ itemId: "ashleaf", count: 2 }]);
    expect(() => Inventory.fromJSON([{ itemId: "missing_item", count: 1 }])).toThrow(RangeError);
  });
});

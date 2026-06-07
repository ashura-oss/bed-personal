import { describe, expect, it } from "@jest/globals";
import {
  buildInventoryDetailView,
  buildInventorySlotView,
  buildInventorySlotViews,
  formatInventoryStackCount,
  resolveInventorySelection
} from "../ui/InventoryUI.js";

describe("InventoryUI helpers", () => {
  it("formats stack counts for dense slot badges", () => {
    expect(formatInventoryStackCount(0)).toBe("");
    expect(formatInventoryStackCount(14)).toBe("14");
    expect(formatInventoryStackCount(1200)).toBe("999+");
  });

  it("builds occupied slot views with humanized fallback labels", () => {
    expect(
      buildInventorySlotView({ itemId: "iron_ore", count: 12 }, 3)
    ).toMatchObject({
      slotIndex: 3,
      itemId: "iron_ore",
      count: 12,
      countText: "12",
      label: "Iron Ore",
      category: "Field Material",
      rarity: "Common",
      isEmpty: false,
      sigil: "IO"
    });
  });

  it("pads the grid to 48 slots and marks missing entries as empty", () => {
    const slots = buildInventorySlotViews([
      { itemId: "timber", count: 4 },
      { itemId: "ashleaf", count: 2 }
    ]);

    expect(slots).toHaveLength(48);
    expect(slots[0]).toMatchObject({ label: "Timber", isEmpty: false });
    expect(slots[2]).toMatchObject({
      label: "Empty Slot",
      count: 0,
      countText: "",
      isEmpty: true
    });
  });

  it("resolves selection to an explicit slot, then falls back to the first occupied slot", () => {
    const slots = buildInventorySlotViews([
      null,
      { itemId: "mooncrystal", count: 1 },
      { itemId: "bone", count: 2 }
    ], 4);

    expect(resolveInventorySelection(slots, 2)).toBe(2);
    expect(resolveInventorySelection(slots, null, null)).toBe(1);
    expect(resolveInventorySelection(slots, 99, 0)).toBe(0);
  });

  it("formats detail panes for empty and occupied slots", () => {
    const occupiedDetail = buildInventoryDetailView(
      buildInventorySlotView({
        itemId: "ember_coal",
        count: 3,
        name: "Ember Coal",
        category: "Fuel",
        rarity: "Rare",
        description: "A stubborn coal that keeps a hearth alive in rain.",
        notes: "Used by wardens to relight shrine braziers."
      }, 5)
    );
    const emptyDetail = buildInventoryDetailView(buildInventorySlotView(null, 6));

    expect(occupiedDetail).toEqual({
      slotLabel: "Slot 06",
      title: "Ember Coal",
      meta: "Rare / Fuel",
      countText: "x3",
      description: "A stubborn coal that keeps a hearth alive in rain.",
      notes: "Used by wardens to relight shrine braziers.",
      itemId: "ember_coal"
    });
    expect(emptyDetail).toEqual({
      slotLabel: "Slot 07",
      title: "Empty Slot",
      meta: "No stack recorded",
      countText: "--",
      description: "No carried item recorded in this slot.",
      notes: "Select an occupied slot to inspect its carried count and field notes.",
      itemId: "--"
    });
  });
});

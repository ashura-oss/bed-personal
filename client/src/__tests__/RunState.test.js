import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  RunState,
  normalizeBossSnapshot,
  normalizeInventorySlots,
  normalizeQuestRewardSnapshot,
  normalizeQuestSnapshot,
  normalizeResourceSnapshot
} from "../progression/RunState.js";

class MemoryStorage {
  constructor() {
    this.items = new Map();
  }

  getItem(key) {
    return this.items.has(key) ? this.items.get(key) : null;
  }

  setItem(key, value) {
    this.items.set(key, String(value));
  }

  removeItem(key) {
    this.items.delete(key);
  }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage();
});

describe("normalizeInventorySlots", () => {
  it("keeps only positive item stacks", () => {
    expect(normalizeInventorySlots([
      { itemId: "timber", count: 3 },
      { itemId: "", count: 2 },
      { itemId: "ashleaf", count: 0 },
      { itemId: "iron_ore", count: 1.5 }
    ])).toEqual([{ itemId: "timber", count: 3 }]);
  });

  it("returns an empty array for non-array input", () => {
    expect(normalizeInventorySlots(null)).toEqual([]);
  });
});

describe("normalizeQuestSnapshot", () => {
  it("keeps serializable quest data and drops unsafe or unsupported values", () => {
    expect(normalizeQuestSnapshot({
      active: [
        {
          questId: "tessa_gather",
          stage: 1,
          offered: true,
          ignored: undefined,
          onComplete: () => {}
        }
      ],
      flags: {
        metTessa: true,
        score: Number.POSITIVE_INFINITY
      },
      constructor: {
        polluted: true
      }
    })).toEqual({
      active: [
        {
          questId: "tessa_gather",
          stage: 1,
          offered: true
        }
      ],
      flags: {
        metTessa: true,
        score: null
      }
    });
  });

  it("returns null for malformed top-level snapshots", () => {
    expect(normalizeQuestSnapshot(null)).toBeNull();
    expect(normalizeQuestSnapshot([])).toBeNull();
    expect(normalizeQuestSnapshot("quest.tessa_gather.offer")).toBeNull();
  });

  it("does not throw on circular quest data", () => {
    const snapshot = { active: [] };
    snapshot.self = snapshot;

    expect(normalizeQuestSnapshot(snapshot)).toEqual({ active: [] });
  });
});

describe("normalizeQuestRewardSnapshot", () => {
  it("keeps unique claimed reward ids in a normalized snapshot", () => {
    expect(normalizeQuestRewardSnapshot({
      claimedRewardIds: [
        "hearthmere.tessa_gather.reward",
        "  hearthmere.tessa_gather.reward  ",
        "",
        42,
        "hearthmere.aldric_hollow.reward"
      ]
    })).toEqual({
      version: 1,
      claimedRewardIds: [
        "hearthmere.tessa_gather.reward",
        "hearthmere.aldric_hollow.reward"
      ]
    });
  });

  it("accepts claimed reward id aliases and array shorthand", () => {
    expect(normalizeQuestRewardSnapshot({
      claimedQuestRewardIds: ["hearthmere.marn_supply.reward"]
    })).toEqual({
      version: 1,
      claimedRewardIds: ["hearthmere.marn_supply.reward"]
    });

    expect(normalizeQuestRewardSnapshot(["hearthmere.brek_mine.reward"])).toEqual({
      version: 1,
      claimedRewardIds: ["hearthmere.brek_mine.reward"]
    });
  });

  it("returns null for malformed reward snapshots", () => {
    expect(normalizeQuestRewardSnapshot(null)).toBeNull();
    expect(normalizeQuestRewardSnapshot({ claimedRewardIds: "not-an-array" })).toBeNull();
    expect(normalizeQuestRewardSnapshot("hearthmere.tessa_gather.reward")).toBeNull();
  });
});

describe("normalizeResourceSnapshot", () => {
  it("keeps unique depleted node keys in a normalized snapshot", () => {
    expect(normalizeResourceSnapshot({
      depletedNodes: [
        "0,0:0:herb:1:2",
        "  hearthmere.tree.01:wood:5:6  ",
        "",
        "0,0:0:herb:1:2",
        42
      ]
    })).toEqual({
      depletedNodes: [
        "0,0:0:herb:1:2",
        "hearthmere.tree.01:wood:5:6"
      ]
    });
  });

  it("accepts a depleted node key array shorthand", () => {
    expect(normalizeResourceSnapshot([
      "0,0:0:herb:1:2",
      "0,0:1:wood:3:4"
    ])).toEqual({
      depletedNodes: [
        "0,0:0:herb:1:2",
        "0,0:1:wood:3:4"
      ]
    });
  });

  it("accepts GatheringSystem depletedKeys snapshots", () => {
    expect(normalizeResourceSnapshot({
      version: 1,
      depletedKeys: [
        "0,0:0:herb:1:2",
        "0,0:0:herb:1:2",
        "  0,0:1:wood:3:4  "
      ]
    })).toEqual({
      depletedNodes: [
        "0,0:0:herb:1:2",
        "0,0:1:wood:3:4"
      ]
    });
  });

  it("returns null for malformed resource snapshots", () => {
    expect(normalizeResourceSnapshot(null)).toBeNull();
    expect(normalizeResourceSnapshot({ depletedNodes: "not-an-array" })).toBeNull();
    expect(normalizeResourceSnapshot("0,0:0:herb:1:2")).toBeNull();
  });
});

describe("normalizeBossSnapshot", () => {
  it("keeps unique defeated boss ids in a normalized snapshot", () => {
    expect(normalizeBossSnapshot({
      defeatedBossIds: [
        "hearthmere.boss.hollowbound_guard",
        "  hearthmere.boss.hollowbound_guard  ",
        "",
        42,
        "hearthmere.boss.other"
      ]
    })).toEqual({
      defeatedBossIds: [
        "hearthmere.boss.hollowbound_guard",
        "hearthmere.boss.other"
      ]
    });
  });

  it("accepts a defeated boss id array shorthand", () => {
    expect(normalizeBossSnapshot([
      "hearthmere.boss.hollowbound_guard"
    ])).toEqual({
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });
  });

  it("returns null for malformed boss snapshots", () => {
    expect(normalizeBossSnapshot(null)).toBeNull();
    expect(normalizeBossSnapshot({ defeatedBossIds: "not-an-array" })).toBeNull();
    expect(normalizeBossSnapshot("hearthmere.boss.hollowbound_guard")).toBeNull();
  });
});

describe("RunState inventory persistence", () => {
  it("saves inventory slots with normal run state", () => {
    const runState = new RunState();

    runState.save("char-a", 12, 4, { x: 1, y: 2, z: 3 }, {
      inventorySlots: [{ itemId: "timber", count: 5 }]
    });

    const loaded = runState.load("char-a");
    expect(loaded.inventorySlots).toEqual([{ itemId: "timber", count: 5 }]);
    expect(loaded.embers).toBe(12);
    expect(loaded.lastHearthlightZ).toBe(3);
  });

  it("saves inventory independently without dropping existing run data", () => {
    const runState = new RunState();

    runState.save("char-a", 9, 3, { x: 4, y: 5, z: 6 });
    runState.saveInventory("char-a", [{ itemId: "iron_ore", count: 2 }]);

    const loaded = runState.load("char-a");
    expect(loaded.embers).toBe(9);
    expect(loaded.flaskCharges).toBe(3);
    expect(loaded.inventorySlots).toEqual([{ itemId: "iron_ore", count: 2 }]);
  });

  it("preserves current inventory when saving run state without inventory options", () => {
    const runState = new RunState();

    runState.saveInventory("char-a", [{ itemId: "ashleaf", count: 7 }]);
    runState.save("char-a", 3, 4, { x: 0, y: 1, z: 2 });

    const loaded = runState.load("char-a");
    expect(loaded.inventorySlots).toEqual([{ itemId: "ashleaf", count: 7 }]);
    expect(loaded.embers).toBe(3);
  });
});

describe("RunState quest reward persistence", () => {
  it("saves quest reward snapshots with normal run state", () => {
    const runState = new RunState();

    runState.save("char-a", 12, 4, { x: 1, y: 2, z: 3 }, {
      inventorySlots: [{ itemId: "timber", count: 5 }],
      questSnapshot: {
        active: [{ questId: "tessa_gather", stage: 1 }]
      },
      questRewardSnapshot: {
        claimedRewardIds: ["hearthmere.tessa_gather.reward"]
      }
    });

    const loaded = runState.load("char-a");
    expect(loaded.questRewardSnapshot).toEqual({
      version: 1,
      claimedRewardIds: ["hearthmere.tessa_gather.reward"]
    });
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "tessa_gather", stage: 1 }]
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "timber", count: 5 }]);
  });

  it("tolerates malformed saved quest reward snapshots", () => {
    localStorage.setItem("rf_run_v1", JSON.stringify({
      schemaVersion: 1,
      characterId: "char-a",
      embers: 7,
      flaskCharges: 2,
      lastHearthlightX: 1,
      lastHearthlightY: 2,
      lastHearthlightZ: 3,
      questRewardSnapshot: {
        claimedRewardIds: "not-an-array"
      }
    }));

    const loaded = new RunState().load("char-a");
    expect(loaded.questRewardSnapshot).toBeNull();
    expect(loaded.embers).toBe(7);
  });

  it("saves quest reward snapshots independently without dropping existing run data", () => {
    const runState = new RunState();

    runState.save("char-a", 9, 3, { x: 4, y: 5, z: 6 }, {
      inventorySlots: [{ itemId: "iron_ore", count: 2 }],
      questSnapshot: {
        active: [{ questId: "aldric_hollow", stage: 2 }]
      }
    });
    runState.saveQuestRewardSnapshot("char-a", {
      claimedRewardIds: ["hearthmere.aldric_hollow.reward"]
    });

    const loaded = runState.load("char-a");
    expect(loaded.embers).toBe(9);
    expect(loaded.flaskCharges).toBe(3);
    expect(loaded.inventorySlots).toEqual([{ itemId: "iron_ore", count: 2 }]);
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "aldric_hollow", stage: 2 }]
    });
    expect(loaded.questRewardSnapshot).toEqual({
      version: 1,
      claimedRewardIds: ["hearthmere.aldric_hollow.reward"]
    });
  });

  it("preserves current quest reward snapshot when saving other run slices", () => {
    const runState = new RunState();

    runState.saveQuestRewardSnapshot("char-a", {
      claimedRewardIds: ["hearthmere.marn_supply.reward"]
    });
    runState.saveInventory("char-a", [{ itemId: "ashleaf", count: 7 }]);
    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "marn_supply", stage: 1 }]
    });
    runState.saveResourceSnapshot("char-a", {
      depletedNodes: ["0,0:1:wood:3:4"]
    });
    runState.saveBossSnapshot("char-a", {
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });

    const loaded = runState.load("char-a");
    expect(loaded.questRewardSnapshot).toEqual({
      version: 1,
      claimedRewardIds: ["hearthmere.marn_supply.reward"]
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "ashleaf", count: 7 }]);
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["0,0:1:wood:3:4"]
    });
    expect(loaded.bossSnapshot).toEqual({
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });
  });

  it("allows explicit quest reward snapshot clearing", () => {
    const runState = new RunState();

    runState.saveQuestRewardSnapshot("char-a", {
      claimedRewardIds: ["hearthmere.survivor_rite.reward"]
    });
    runState.save("char-a", 1, 4, { x: 0, y: 0, z: 0 }, {
      questRewardSnapshot: null
    });

    const loaded = runState.load("char-a");
    expect(loaded.questRewardSnapshot).toBeNull();
  });
});

describe("RunState resource persistence", () => {
  it("saves resource snapshots with normal run state", () => {
    const runState = new RunState();

    runState.save("char-a", 12, 4, { x: 1, y: 2, z: 3 }, {
      inventorySlots: [{ itemId: "timber", count: 5 }],
      questSnapshot: {
        active: [{ questId: "tessa_gather", stage: 1 }]
      },
      resourceSnapshot: {
        depletedNodes: ["0,0:0:herb:1:2"]
      }
    });

    const loaded = runState.load("char-a");
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["0,0:0:herb:1:2"]
    });
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "tessa_gather", stage: 1 }]
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "timber", count: 5 }]);
    expect(loaded.embers).toBe(12);
  });

  it("tolerates malformed saved resource snapshots", () => {
    localStorage.setItem("rf_run_v1", JSON.stringify({
      schemaVersion: 1,
      characterId: "char-a",
      embers: 7,
      flaskCharges: 2,
      lastHearthlightX: 1,
      lastHearthlightY: 2,
      lastHearthlightZ: 3,
      resourceSnapshot: {
        depletedNodes: "not-an-array"
      }
    }));

    const loaded = new RunState().load("char-a");
    expect(loaded.resourceSnapshot).toBeNull();
    expect(loaded.embers).toBe(7);
  });

  it("saves resource snapshots independently without dropping existing run data", () => {
    const runState = new RunState();

    runState.save("char-a", 9, 3, { x: 4, y: 5, z: 6 }, {
      inventorySlots: [{ itemId: "iron_ore", count: 2 }],
      questSnapshot: {
        active: [{ questId: "aldric_hollow", stage: 2 }]
      }
    });
    runState.saveResourceSnapshot("char-a", {
      depletedNodes: ["0,0:1:wood:3:4"]
    });

    const loaded = runState.load("char-a");
    expect(loaded.embers).toBe(9);
    expect(loaded.flaskCharges).toBe(3);
    expect(loaded.inventorySlots).toEqual([{ itemId: "iron_ore", count: 2 }]);
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "aldric_hollow", stage: 2 }]
    });
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["0,0:1:wood:3:4"]
    });
  });

  it("preserves current resource snapshot when saving run state without resource options", () => {
    const runState = new RunState();

    runState.saveResourceSnapshot("char-a", {
      depletedNodes: ["0,0:0:herb:1:2"]
    });
    runState.save("char-a", 3, 4, { x: 0, y: 1, z: 2 });

    const loaded = runState.load("char-a");
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["0,0:0:herb:1:2"]
    });
    expect(loaded.embers).toBe(3);
  });

  it("preserves current resource snapshot when saving inventory without resource options", () => {
    const runState = new RunState();

    runState.saveResourceSnapshot("char-a", {
      depletedNodes: ["0,0:1:wood:3:4"]
    });
    runState.saveInventory("char-a", [{ itemId: "ashleaf", count: 7 }]);

    const loaded = runState.load("char-a");
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["0,0:1:wood:3:4"]
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "ashleaf", count: 7 }]);
  });

  it("preserves current resource snapshot when saving quest snapshot without resource options", () => {
    const runState = new RunState();

    runState.saveResourceSnapshot("char-a", {
      depletedNodes: ["hearthmere.tree.01:wood:5:6"]
    });
    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "brek_mine", stage: 1 }]
    });

    const loaded = runState.load("char-a");
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["hearthmere.tree.01:wood:5:6"]
    });
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "brek_mine", stage: 1 }]
    });
  });

  it("allows explicit resource snapshot clearing", () => {
    const runState = new RunState();

    runState.saveResourceSnapshot("char-a", {
      depletedNodes: ["0,0:0:herb:1:2"]
    });
    runState.save("char-a", 1, 4, { x: 0, y: 0, z: 0 }, {
      resourceSnapshot: null
    });

    const loaded = runState.load("char-a");
    expect(loaded.resourceSnapshot).toBeNull();
  });
});

describe("RunState boss persistence", () => {
  it("saves boss snapshots with normal run state", () => {
    const runState = new RunState();

    runState.save("char-a", 12, 4, { x: 1, y: 2, z: 3 }, {
      inventorySlots: [{ itemId: "timber", count: 5 }],
      questSnapshot: {
        active: [{ questId: "survivor_rite", stage: 1 }]
      },
      resourceSnapshot: {
        depletedNodes: ["0,0:0:herb:1:2"]
      },
      bossSnapshot: {
        defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
      }
    });

    const loaded = runState.load("char-a");
    expect(loaded.bossSnapshot).toEqual({
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["0,0:0:herb:1:2"]
    });
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "survivor_rite", stage: 1 }]
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "timber", count: 5 }]);
  });

  it("tolerates malformed saved boss snapshots", () => {
    localStorage.setItem("rf_run_v1", JSON.stringify({
      schemaVersion: 1,
      characterId: "char-a",
      embers: 7,
      flaskCharges: 2,
      lastHearthlightX: 1,
      lastHearthlightY: 2,
      lastHearthlightZ: 3,
      bossSnapshot: {
        defeatedBossIds: "not-an-array"
      }
    }));

    const loaded = new RunState().load("char-a");
    expect(loaded.bossSnapshot).toBeNull();
    expect(loaded.embers).toBe(7);
  });

  it("saves boss snapshots independently without dropping existing run data", () => {
    const runState = new RunState();

    runState.save("char-a", 9, 3, { x: 4, y: 5, z: 6 }, {
      inventorySlots: [{ itemId: "iron_ore", count: 2 }],
      questSnapshot: {
        active: [{ questId: "aldric_hollow", stage: 2 }]
      },
      resourceSnapshot: {
        depletedNodes: ["0,0:1:wood:3:4"]
      }
    });
    runState.saveBossSnapshot("char-a", {
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });

    const loaded = runState.load("char-a");
    expect(loaded.embers).toBe(9);
    expect(loaded.flaskCharges).toBe(3);
    expect(loaded.inventorySlots).toEqual([{ itemId: "iron_ore", count: 2 }]);
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "aldric_hollow", stage: 2 }]
    });
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["0,0:1:wood:3:4"]
    });
    expect(loaded.bossSnapshot).toEqual({
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });
  });

  it("preserves current boss snapshot when saving other run slices", () => {
    const runState = new RunState();

    runState.saveBossSnapshot("char-a", {
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });
    runState.saveInventory("char-a", [{ itemId: "ashleaf", count: 7 }]);
    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    runState.saveResourceSnapshot("char-a", {
      depletedNodes: ["hearthmere.tree.01:wood:5:6"]
    });

    const loaded = runState.load("char-a");
    expect(loaded.bossSnapshot).toEqual({
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "ashleaf", count: 7 }]);
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["hearthmere.tree.01:wood:5:6"]
    });
  });

  it("allows explicit boss snapshot clearing", () => {
    const runState = new RunState();

    runState.saveBossSnapshot("char-a", {
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });
    runState.save("char-a", 1, 4, { x: 0, y: 0, z: 0 }, {
      bossSnapshot: null
    });

    const loaded = runState.load("char-a");
    expect(loaded.bossSnapshot).toBeNull();
  });
});

describe("RunState quest persistence", () => {
  it("saves quest snapshots with normal run state", () => {
    const runState = new RunState();

    runState.save("char-a", 12, 4, { x: 1, y: 2, z: 3 }, {
      inventorySlots: [{ itemId: "timber", count: 5 }],
      questSnapshot: {
        active: [{ questId: "tessa_gather", stage: 1 }],
        completed: ["first_hearth"]
      }
    });

    const loaded = runState.load("char-a");
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "tessa_gather", stage: 1 }],
      completed: ["first_hearth"]
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "timber", count: 5 }]);
    expect(loaded.embers).toBe(12);
  });

  it("tolerates malformed saved quest snapshots", () => {
    localStorage.setItem("rf_run_v1", JSON.stringify({
      schemaVersion: 1,
      characterId: "char-a",
      embers: 7,
      flaskCharges: 2,
      lastHearthlightX: 1,
      lastHearthlightY: 2,
      lastHearthlightZ: 3,
      questSnapshot: "not-a-snapshot"
    }));

    const loaded = new RunState().load("char-a");
    expect(loaded.questSnapshot).toBeNull();
    expect(loaded.embers).toBe(7);
  });

  it("saves quest snapshots independently without dropping existing run data", () => {
    const runState = new RunState();

    runState.save("char-a", 9, 3, { x: 4, y: 5, z: 6 }, {
      inventorySlots: [{ itemId: "iron_ore", count: 2 }]
    });
    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "aldric_hollow", stage: 2 }]
    });

    const loaded = runState.load("char-a");
    expect(loaded.embers).toBe(9);
    expect(loaded.flaskCharges).toBe(3);
    expect(loaded.inventorySlots).toEqual([{ itemId: "iron_ore", count: 2 }]);
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "aldric_hollow", stage: 2 }]
    });
  });

  it("preserves current quest snapshot when saving run state without quest options", () => {
    const runState = new RunState();

    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "marn_supply", stage: 1 }]
    });
    runState.save("char-a", 3, 4, { x: 0, y: 1, z: 2 });

    const loaded = runState.load("char-a");
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "marn_supply", stage: 1 }]
    });
    expect(loaded.embers).toBe(3);
  });

  it("preserves current quest snapshot when saving inventory without quest options", () => {
    const runState = new RunState();

    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    runState.saveInventory("char-a", [{ itemId: "ashleaf", count: 7 }]);

    const loaded = runState.load("char-a");
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "ashleaf", count: 7 }]);
  });

  it("allows explicit quest snapshot clearing", () => {
    const runState = new RunState();

    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "survivor_rite", stage: 1 }]
    });
    runState.save("char-a", 1, 4, { x: 0, y: 0, z: 0 }, {
      questSnapshot: null
    });

    const loaded = runState.load("char-a");
    expect(loaded.questSnapshot).toBeNull();
  });
});

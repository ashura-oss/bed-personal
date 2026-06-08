import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  RunState,
  normalizeAbilityLoadoutSnapshot,
  normalizeBossSnapshot,
  normalizeCinematicSnapshot,
  normalizeInventorySlots,
  normalizeMinimapSnapshot,
  normalizeQuestRewardSnapshot,
  normalizeQuestSnapshot,
  normalizeResourceSnapshot,
  normalizeStorySnapshot
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

describe("normalizeCinematicSnapshot", () => {
  it("keeps unique played cutscene flags in a normalized snapshot", () => {
    expect(normalizeCinematicSnapshot({
      playedFlags: [
        "opening_ashfall_road",
        "  opening_ashfall_road  ",
        "",
        42,
        "boss_intro:hearthmere.hollowbound_guard"
      ]
    })).toEqual({
      version: 1,
      playedFlags: [
        "opening_ashfall_road",
        "boss_intro:hearthmere.hollowbound_guard"
      ]
    });
  });

  it("accepts aliases and array shorthand for played flags", () => {
    expect(normalizeCinematicSnapshot({
      playedCutsceneIds: ["opening_ashfall_road"]
    })).toEqual({
      version: 1,
      playedFlags: ["opening_ashfall_road"]
    });

    expect(normalizeCinematicSnapshot(["boss_intro:hearthmere.hollowbound_guard"])).toEqual({
      version: 1,
      playedFlags: ["boss_intro:hearthmere.hollowbound_guard"]
    });
  });

  it("returns null for malformed cinematic snapshots", () => {
    expect(normalizeCinematicSnapshot(null)).toBeNull();
    expect(normalizeCinematicSnapshot({ playedFlags: "opening_ashfall_road" })).toBeNull();
    expect(normalizeCinematicSnapshot("opening_ashfall_road")).toBeNull();
  });
});

describe("normalizeStorySnapshot", () => {
  it("keeps boolean story flags in a normalized snapshot", () => {
    expect(normalizeStorySnapshot({
      version: 99,
      flags: {
        act1_started: true,
        world_map_unlocked: false,
        ignored: "yes",
        constructor: true
      }
    })).toEqual({
      version: 1,
      flags: {
        act1_started: true,
        world_map_unlocked: false
      }
    });
  });

  it("accepts direct flag maps and rejects malformed story snapshots", () => {
    expect(normalizeStorySnapshot({
      shard_absorbed_first: true
    })).toEqual({
      version: 1,
      flags: {
        shard_absorbed_first: true
      }
    });

    expect(normalizeStorySnapshot(null)).toBeNull();
    expect(normalizeStorySnapshot({ flags: { act1_started: "true" } })).toBeNull();
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

describe("normalizeAbilityLoadoutSnapshot", () => {
  it("keeps valid ability slots and trims ability ids", () => {
    expect(normalizeAbilityLoadoutSnapshot({
      slots: {
        Q: " ability_thornbind ",
        e: "ability_spark",
        X: "ability_ignored",
        R: ""
      }
    })).toEqual({
      version: 1,
      slots: {
        q: "ability_thornbind",
        e: "ability_spark"
      }
    });
  });

  it("accepts equippedSlots and hotbar aliases", () => {
    expect(normalizeAbilityLoadoutSnapshot({
      equippedSlots: {
        R: "ability_beastcall"
      }
    })).toEqual({
      version: 1,
      slots: {
        r: "ability_beastcall"
      }
    });

    expect(normalizeAbilityLoadoutSnapshot({
      hotbar: {
        Q: "ability_spark"
      }
    })).toEqual({
      version: 1,
      slots: {
        q: "ability_spark"
      }
    });
  });

  it("returns null for malformed ability loadout snapshots", () => {
    expect(normalizeAbilityLoadoutSnapshot(null)).toBeNull();
    expect(normalizeAbilityLoadoutSnapshot({ slots: "Q" })).toBeNull();
    expect(normalizeAbilityLoadoutSnapshot("ability_spark")).toBeNull();
  });
});

describe("normalizeMinimapSnapshot", () => {
  it("keeps explored chunks, biome, and Hearthlight markers in a normalized snapshot", () => {
    expect(normalizeMinimapSnapshot({
      exploredChunks: [
        "0,0",
        { chunkX: 1, chunkZ: -1 },
        "bad",
        "0,0"
      ],
      currentBiome: {
        key: "hearthmere.plains",
        name: "Hearthmere Plains"
      },
      hearthlightMarkers: [
        {
          id: "hearthmere_camp:hearthlight:0",
          label: "Camp",
          position: { x: 42, y: 0, z: 30 }
        },
        {
          id: "bad",
          position: { x: Number.NaN, z: 1 }
        }
      ]
    })).toEqual({
      version: 1,
      exploredChunkKeys: ["1,-1", "0,0"],
      currentBiome: {
        id: "hearthmere.plains",
        label: "Hearthmere Plains"
      },
      hearthlights: [
        {
          id: "hearthmere_camp:hearthlight:0",
          name: "Camp",
          position: { x: 42, y: 0, z: 30 }
        }
      ]
    });
  });

  it("returns null for empty or malformed minimap snapshots", () => {
    expect(normalizeMinimapSnapshot(null)).toBeNull();
    expect(normalizeMinimapSnapshot({ exploredChunkKeys: ["bad"] })).toBeNull();
    expect(normalizeMinimapSnapshot("0,0")).toBeNull();
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

describe("RunState world seed persistence", () => {
  it("loads and saves a numeric world seed with normal run state", () => {
    const runState = new RunState();

    runState.save("char-a", 12, 4, { x: 1, y: 2, z: 3 }, {
      worldSeed: 31415
    });

    const loaded = runState.load("char-a");
    expect(loaded.worldSeed).toBe(31415);
    expect(loaded.embers).toBe(12);
    expect(loaded.flaskCharges).toBe(4);
  });

  it("saves world seed independently without dropping existing run data", () => {
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
    runState.saveWorldSeed("char-a", 27182);

    const loaded = runState.load("char-a");
    expect(loaded.worldSeed).toBe(27182);
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

  it("preserves current world seed when saving other run slices", () => {
    const runState = new RunState();

    runState.saveWorldSeed("char-a", 12345);
    runState.saveInventory("char-a", [{ itemId: "ashleaf", count: 7 }]);
    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    runState.saveResourceSnapshot("char-a", {
      depletedNodes: ["hearthmere.tree.01:wood:5:6"]
    });
    runState.saveBossSnapshot("char-a", {
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });

    const loaded = runState.load("char-a");
    expect(loaded.worldSeed).toBe(12345);
    expect(loaded.inventorySlots).toEqual([{ itemId: "ashleaf", count: 7 }]);
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["hearthmere.tree.01:wood:5:6"]
    });
    expect(loaded.bossSnapshot).toEqual({
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });
  });

  it("drops malformed saved world seeds", () => {
    localStorage.setItem("rf_run_v1", JSON.stringify({
      schemaVersion: 1,
      characterId: "char-a",
      embers: 7,
      worldSeed: "not-a-number",
      flaskCharges: 2,
      lastHearthlightX: 1,
      lastHearthlightY: 2,
      lastHearthlightZ: 3
    }));

    const loaded = new RunState().load("char-a");
    expect(loaded.worldSeed).toBeNull();
    expect(loaded.embers).toBe(7);
  });
});

describe("RunState ability loadout persistence", () => {
  it("saves ability loadouts with normal run state", () => {
    const runState = new RunState();

    runState.save("char-a", 12, 4, { x: 1, y: 2, z: 3 }, {
      inventorySlots: [{ itemId: "timber", count: 5 }],
      abilityLoadoutSnapshot: {
        slots: {
          Q: "ability_thornbind",
          R: "ability_beastcall"
        }
      }
    });

    const loaded = runState.load("char-a");
    expect(loaded.abilityLoadoutSnapshot).toEqual({
      version: 1,
      slots: {
        q: "ability_thornbind",
        r: "ability_beastcall"
      }
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "timber", count: 5 }]);
    expect(loaded.embers).toBe(12);
  });

  it("saves ability loadouts independently without dropping existing run data", () => {
    const runState = new RunState();

    runState.save("char-a", 9, 3, { x: 4, y: 5, z: 6 }, {
      inventorySlots: [{ itemId: "iron_ore", count: 2 }],
      questSnapshot: {
        active: [{ questId: "aldric_hollow", stage: 2 }]
      },
      resourceSnapshot: {
        depletedNodes: ["0,0:1:wood:3:4"]
      },
      bossSnapshot: {
        defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
      }
    });
    runState.saveAbilityLoadoutSnapshot("char-a", {
      slots: {
        E: "ability_spark"
      }
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
    expect(loaded.abilityLoadoutSnapshot).toEqual({
      version: 1,
      slots: {
        e: "ability_spark"
      }
    });
  });

  it("preserves current ability loadout when saving other run slices", () => {
    const runState = new RunState();

    runState.saveAbilityLoadoutSnapshot("char-a", {
      slots: {
        Q: "ability_thornbind"
      }
    });
    runState.saveInventory("char-a", [{ itemId: "ashleaf", count: 7 }]);
    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    runState.saveResourceSnapshot("char-a", {
      depletedNodes: ["hearthmere.tree.01:wood:5:6"]
    });
    runState.saveBossSnapshot("char-a", {
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });

    const loaded = runState.load("char-a");
    expect(loaded.abilityLoadoutSnapshot).toEqual({
      version: 1,
      slots: {
        q: "ability_thornbind"
      }
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "ashleaf", count: 7 }]);
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["hearthmere.tree.01:wood:5:6"]
    });
    expect(loaded.bossSnapshot).toEqual({
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });
  });
});

describe("RunState minimap persistence", () => {
  it("saves minimap snapshots with normal run state", () => {
    const runState = new RunState();

    runState.save("char-a", 12, 4, { x: 1, y: 2, z: 3 }, {
      inventorySlots: [{ itemId: "timber", count: 5 }],
      minimapSnapshot: {
        exploredChunkKeys: ["0,0", "1,0"],
        currentBiome: { id: "hearthmere", label: "Hearthmere" },
        hearthlights: [
          {
            id: "hearthmere_camp:hearthlight:0",
            name: "Camp",
            position: { x: 42, y: 0, z: 30 }
          }
        ]
      }
    });

    const loaded = runState.load("char-a");
    expect(loaded.minimapSnapshot).toEqual({
      version: 1,
      exploredChunkKeys: ["0,0", "1,0"],
      currentBiome: { id: "hearthmere", label: "Hearthmere" },
      hearthlights: [
        {
          id: "hearthmere_camp:hearthlight:0",
          name: "Camp",
          position: { x: 42, y: 0, z: 30 }
        }
      ]
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "timber", count: 5 }]);
  });

  it("saves minimap snapshots independently without dropping other run data", () => {
    const runState = new RunState();

    runState.save("char-a", 9, 3, { x: 4, y: 5, z: 6 }, {
      inventorySlots: [{ itemId: "iron_ore", count: 2 }],
      questSnapshot: {
        active: [{ questId: "aldric_hollow", stage: 2 }]
      },
      abilityLoadoutSnapshot: {
        slots: { Q: "ability_thornbind" }
      }
    });
    runState.saveMinimapSnapshot("char-a", {
      exploredChunkKeys: ["0,0"],
      currentBiome: { id: "hearthmere.plains", label: "Hearthmere Plains" }
    });

    const loaded = runState.load("char-a");
    expect(loaded.embers).toBe(9);
    expect(loaded.flaskCharges).toBe(3);
    expect(loaded.inventorySlots).toEqual([{ itemId: "iron_ore", count: 2 }]);
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "aldric_hollow", stage: 2 }]
    });
    expect(loaded.abilityLoadoutSnapshot).toEqual({
      version: 1,
      slots: { q: "ability_thornbind" }
    });
    expect(loaded.minimapSnapshot).toEqual({
      version: 1,
      exploredChunkKeys: ["0,0"],
      currentBiome: { id: "hearthmere.plains", label: "Hearthmere Plains" },
      hearthlights: []
    });
  });

  it("preserves current minimap snapshot when saving other run slices", () => {
    const runState = new RunState();

    runState.saveMinimapSnapshot("char-a", {
      exploredChunkKeys: ["0,0"],
      currentBiome: { id: "hearthmere", label: "Hearthmere" }
    });
    runState.saveInventory("char-a", [{ itemId: "ashleaf", count: 7 }]);
    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    runState.saveAbilityLoadoutSnapshot("char-a", {
      slots: { R: "ability_beastcall" }
    });

    const loaded = runState.load("char-a");
    expect(loaded.minimapSnapshot).toEqual({
      version: 1,
      exploredChunkKeys: ["0,0"],
      currentBiome: { id: "hearthmere", label: "Hearthmere" },
      hearthlights: []
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "ashleaf", count: 7 }]);
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    expect(loaded.abilityLoadoutSnapshot).toEqual({
      version: 1,
      slots: { r: "ability_beastcall" }
    });
  });
});

describe("RunState cinematic persistence", () => {
  it("saves cinematic snapshots with normal run state", () => {
    const runState = new RunState();

    runState.save("char-a", 12, 4, { x: 1, y: 2, z: 3 }, {
      inventorySlots: [{ itemId: "timber", count: 5 }],
      cinematicSnapshot: {
        playedFlags: ["opening_ashfall_road"]
      }
    });

    const loaded = runState.load("char-a");
    expect(loaded.cinematicSnapshot).toEqual({
      version: 1,
      playedFlags: ["opening_ashfall_road"]
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "timber", count: 5 }]);
  });

  it("saves cinematic snapshots independently without dropping other run data", () => {
    const runState = new RunState();

    runState.save("char-a", 9, 3, { x: 4, y: 5, z: 6 }, {
      inventorySlots: [{ itemId: "iron_ore", count: 2 }],
      minimapSnapshot: {
        exploredChunkKeys: ["0,0"],
        currentBiome: { id: "hearthmere", label: "Hearthmere" }
      },
      abilityLoadoutSnapshot: {
        slots: { Q: "ability_thornbind" }
      }
    });
    runState.saveCinematicSnapshot("char-a", {
      playedFlags: ["boss_intro:hearthmere.hollowbound_guard"]
    });

    const loaded = runState.load("char-a");
    expect(loaded.embers).toBe(9);
    expect(loaded.flaskCharges).toBe(3);
    expect(loaded.inventorySlots).toEqual([{ itemId: "iron_ore", count: 2 }]);
    expect(loaded.minimapSnapshot).toEqual({
      version: 1,
      exploredChunkKeys: ["0,0"],
      currentBiome: { id: "hearthmere", label: "Hearthmere" },
      hearthlights: []
    });
    expect(loaded.abilityLoadoutSnapshot).toEqual({
      version: 1,
      slots: { q: "ability_thornbind" }
    });
    expect(loaded.cinematicSnapshot).toEqual({
      version: 1,
      playedFlags: ["boss_intro:hearthmere.hollowbound_guard"]
    });
  });

  it("preserves current cinematic snapshot when saving other run slices", () => {
    const runState = new RunState();

    runState.saveCinematicSnapshot("char-a", {
      playedFlags: ["opening_ashfall_road"]
    });
    runState.saveInventory("char-a", [{ itemId: "ashleaf", count: 7 }]);
    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    runState.saveResourceSnapshot("char-a", {
      depletedNodes: ["hearthmere.tree.01:wood:5:6"]
    });
    runState.saveBossSnapshot("char-a", {
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });
    runState.saveMinimapSnapshot("char-a", {
      exploredChunkKeys: ["0,0"],
      currentBiome: { id: "hearthmere", label: "Hearthmere" }
    });

    const loaded = runState.load("char-a");
    expect(loaded.cinematicSnapshot).toEqual({
      version: 1,
      playedFlags: ["opening_ashfall_road"]
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "ashleaf", count: 7 }]);
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "brek_mine", stage: 1 }]
    });
    expect(loaded.resourceSnapshot).toEqual({
      depletedNodes: ["hearthmere.tree.01:wood:5:6"]
    });
    expect(loaded.bossSnapshot).toEqual({
      defeatedBossIds: ["hearthmere.boss.hollowbound_guard"]
    });
    expect(loaded.minimapSnapshot).toEqual({
      version: 1,
      exploredChunkKeys: ["0,0"],
      currentBiome: { id: "hearthmere", label: "Hearthmere" },
      hearthlights: []
    });
  });
});

describe("RunState story persistence", () => {
  it("saves story snapshots with normal run state", () => {
    const runState = new RunState();

    runState.save("char-a", 12, 4, { x: 1, y: 2, z: 3 }, {
      inventorySlots: [{ itemId: "timber", count: 5 }],
      storySnapshot: {
        flags: {
          act1_started: true,
          world_map_unlocked: false
        }
      }
    });

    const loaded = runState.load("char-a");
    expect(loaded.storySnapshot).toEqual({
      version: 1,
      flags: {
        act1_started: true,
        world_map_unlocked: false
      }
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "timber", count: 5 }]);
  });

  it("saves story snapshots independently without dropping other run data", () => {
    const runState = new RunState();

    runState.save("char-a", 9, 3, { x: 4, y: 5, z: 6 }, {
      inventorySlots: [{ itemId: "iron_ore", count: 2 }],
      cinematicSnapshot: {
        playedFlags: ["opening_ashfall_road"]
      },
      minimapSnapshot: {
        exploredChunkKeys: ["0,0"],
        currentBiome: { id: "hearthmere", label: "Hearthmere" }
      }
    });
    runState.saveStorySnapshot("char-a", {
      flags: {
        act1_complete: true,
        world_map_unlocked: true
      }
    });

    const loaded = runState.load("char-a");
    expect(loaded.embers).toBe(9);
    expect(loaded.flaskCharges).toBe(3);
    expect(loaded.inventorySlots).toEqual([{ itemId: "iron_ore", count: 2 }]);
    expect(loaded.cinematicSnapshot).toEqual({
      version: 1,
      playedFlags: ["opening_ashfall_road"]
    });
    expect(loaded.minimapSnapshot).toEqual({
      version: 1,
      exploredChunkKeys: ["0,0"],
      currentBiome: { id: "hearthmere", label: "Hearthmere" },
      hearthlights: []
    });
    expect(loaded.storySnapshot).toEqual({
      version: 1,
      flags: {
        act1_complete: true,
        world_map_unlocked: true
      }
    });
  });

  it("preserves current story snapshot when saving other run slices", () => {
    const runState = new RunState();

    runState.saveStorySnapshot("char-a", {
      flags: {
        quest_road_started: true
      }
    });
    runState.saveInventory("char-a", [{ itemId: "ashleaf", count: 7 }]);
    runState.saveQuestSnapshot("char-a", {
      active: [{ questId: "road_that_still_stands", stage: 1 }]
    });
    runState.saveCinematicSnapshot("char-a", {
      playedFlags: ["opening_ashfall_road"]
    });

    const loaded = runState.load("char-a");
    expect(loaded.storySnapshot).toEqual({
      version: 1,
      flags: {
        quest_road_started: true
      }
    });
    expect(loaded.inventorySlots).toEqual([{ itemId: "ashleaf", count: 7 }]);
    expect(loaded.questSnapshot).toEqual({
      active: [{ questId: "road_that_still_stands", stage: 1 }]
    });
    expect(loaded.cinematicSnapshot).toEqual({
      version: 1,
      playedFlags: ["opening_ashfall_road"]
    });
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

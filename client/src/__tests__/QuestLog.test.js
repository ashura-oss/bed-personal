import { describe, expect, test } from "@jest/globals";
import {
  QUEST_EVENT_TYPES,
  QUEST_STATUS,
  createQuestLog,
  deserializeQuestLog,
  isQuestComplete,
  reduceQuestEffect,
  reduceQuestEvent,
  reduceQuestEvents,
  serializeQuestLog
} from "../gameplay/quests/QuestLog.js";

describe("QuestLog", () => {
  test("creates a normalized inactive Hearthmere quest log", () => {
    const questLog = createQuestLog();

    expect(questLog.version).toBe(1);
    expect(Object.keys(questLog.quests)).toEqual([
      "hearthmere.road_that_still_stands",
      "hearthmere.tessa_gather",
      "hearthmere.aldric_hollow",
      "hearthmere.marn_supply",
      "hearthmere.survivor_rite",
      "hearthmere.brek_mine"
    ]);
    expect(questLog.quests["hearthmere.tessa_gather"]).toMatchObject({
      status: QUEST_STATUS.INACTIVE,
      objectives: {
        gather_timber: { current: 0, requiredCount: 3, complete: false },
        gather_iron_ore: { current: 0, requiredCount: 2, complete: false }
      }
    });
  });

  test("reduces the Act 1 main quest from road cleanup through boss defeat", () => {
    const questLog = reduceQuestEvents(createQuestLog(), [
      { type: QUEST_EVENT_TYPES.QUEST_EFFECT, effect: "quest.road_that_still_stands.offer" },
      { type: QUEST_EVENT_TYPES.ENEMY_DIED, enemyTypeId: "hollow_shambler", count: 3 },
      { type: QUEST_EVENT_TYPES.GATHERING_HARVESTED, itemId: "timber", count: 3 },
      { type: QUEST_EVENT_TYPES.GATHERING_HARVESTED, itemId: "iron_ore", count: 2 },
      { type: QUEST_EVENT_TYPES.CRAFTING_CRAFTED, output: { itemId: "hearthlight_hatchet", count: 1 } },
      { type: QUEST_EVENT_TYPES.BOSS_DEFEATED, bossId: "hearthmere.boss.hollowbound_guard" }
    ]);

    expect(questLog.quests["hearthmere.road_that_still_stands"]).toMatchObject({
      status: QUEST_STATUS.COMPLETED,
      objectives: {
        clear_old_road: { current: 3, requiredCount: 3, complete: true },
        recover_caravan_timber: { current: 3, requiredCount: 3, complete: true },
        recover_iron_fittings: { current: 2, requiredCount: 2, complete: true },
        forge_hearthlight_hatchet: { current: 1, requiredCount: 1, complete: true },
        defeat_hollowbound_guard: { current: 1, requiredCount: 1, complete: true }
      }
    });
  });

  test("activates quests from dialogue effect strings and dialogue events", () => {
    const offered = reduceQuestEffect(createQuestLog(), "quest.tessa_gather.offer");
    const noted = reduceQuestEvent(offered, {
      type: QUEST_EVENT_TYPES.DIALOGUE_EFFECT,
      effect: "quest.survivor_rite.note"
    });
    const unchanged = reduceQuestEffect(noted, "quest.unknown");

    expect(noted.quests["hearthmere.tessa_gather"].status).toBe(QUEST_STATUS.ACTIVE);
    expect(noted.quests["hearthmere.survivor_rite"].status).toBe(QUEST_STATUS.ACTIVE);
    expect(unchanged).toEqual(noted);
  });

  test("reduces gathering events and completes the Tessa quest deterministically", () => {
    const questLog = reduceQuestEvents(createQuestLog(), [
      "quest.tessa_gather.offer",
      { type: QUEST_EVENT_TYPES.GATHERING_HARVESTED, itemId: "timber", count: 2 },
      { type: QUEST_EVENT_TYPES.RESOURCE_GATHERED, nodeDef: { yield: { itemId: "timber" } }, count: 9 },
      { type: QUEST_EVENT_TYPES.GATHERING_HARVESTED, itemId: "iron_ore", count: 1 },
      { type: QUEST_EVENT_TYPES.GATHERING_HARVESTED, itemId: "iron_ore", count: 1 }
    ]);

    expect(questLog.quests["hearthmere.tessa_gather"]).toMatchObject({
      status: QUEST_STATUS.COMPLETED,
      objectives: {
        gather_timber: { current: 3, requiredCount: 3, complete: true },
        gather_iron_ore: { current: 2, requiredCount: 2, complete: true }
      }
    });
    expect(isQuestComplete(questLog, "hearthmere.tessa_gather")).toBe(true);
  });

  test("counts enemy kills for all active matching quests", () => {
    const questLog = reduceQuestEvents(createQuestLog(), [
      "quest.aldric_hollow.offer",
      "quest.brek_mine.offer",
      { type: QUEST_EVENT_TYPES.ENEMY_DIED, enemyId: "briar_wolf", count: 20 },
      { type: QUEST_EVENT_TYPES.ENEMY_DIED, enemyTypeId: "hollow_shambler", count: 3 },
      { type: QUEST_EVENT_TYPES.ENEMY_KILLED, enemy: { id: "hollow_shambler" }, count: 2 }
    ]);

    expect(questLog.quests["hearthmere.aldric_hollow"]).toMatchObject({
      status: QUEST_STATUS.COMPLETED,
      objectives: {
        kill_hollow_shamblers: { current: 3, requiredCount: 3, complete: true }
      }
    });
    expect(questLog.quests["hearthmere.brek_mine"]).toMatchObject({
      status: QUEST_STATUS.COMPLETED,
      objectives: {
        clear_mine_hollow: { current: 5, requiredCount: 5, complete: true }
      }
    });
  });

  test("reduces crafted items and boss defeats using future-friendly payloads", () => {
    const questLog = reduceQuestEvents(createQuestLog(), [
      { type: QUEST_EVENT_TYPES.QUEST_EFFECT, effect: "quest.marn_supply.note" },
      { type: QUEST_EVENT_TYPES.QUEST_EFFECT, effect: "quest.survivor_rite.note" },
      { type: QUEST_EVENT_TYPES.CRAFTING_CRAFTED, output: { itemId: "ashleaf_poultice", count: 1 } },
      { type: QUEST_EVENT_TYPES.ITEM_CRAFTED, recipeId: "ashleaf_poultice", count: 1 },
      { type: QUEST_EVENT_TYPES.BOSS_DIED, name: "Hollowbound Caravan Guard" }
    ]);

    expect(questLog.quests["hearthmere.marn_supply"].status).toBe(QUEST_STATUS.COMPLETED);
    expect(questLog.quests["hearthmere.survivor_rite"].status).toBe(QUEST_STATUS.COMPLETED);
  });

  test("normalizes serialized state by clamping progress and ignoring unknown quests", () => {
    const questLog = deserializeQuestLog({
      version: 99,
      quests: [
        {
          id: "hearthmere.tessa_gather",
          status: QUEST_STATUS.ACTIVE,
          objectives: [
            { id: "gather_timber", current: 50 },
            { id: "gather_iron_ore", current: -4 }
          ]
        },
        {
          id: "unknown.quest",
          status: QUEST_STATUS.COMPLETED,
          objectives: []
        }
      ]
    });

    expect(questLog.version).toBe(1);
    expect(questLog.quests["unknown.quest"]).toBeUndefined();
    expect(questLog.quests["hearthmere.tessa_gather"]).toMatchObject({
      status: QUEST_STATUS.ACTIVE,
      objectives: {
        gather_timber: { current: 3, requiredCount: 3, complete: true },
        gather_iron_ore: { current: 0, requiredCount: 2, complete: false }
      }
    });
    expect(serializeQuestLog(questLog)).toEqual(questLog);
  });
});

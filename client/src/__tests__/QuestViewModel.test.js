import { describe, expect, test } from "@jest/globals";
import {
  QUEST_STATUS,
  buildQuestLogView,
  buildQuestObjectiveView,
  createQuestLog,
  reduceQuestEvents
} from "../gameplay/quests/index.js";

describe("QuestViewModel", () => {
  test("returns null before any Hearthmere quest is active", () => {
    expect(buildQuestObjectiveView(createQuestLog())).toBeNull();
  });

  test("selects the first active quest and next incomplete objective", () => {
    const questLog = reduceQuestEvents(createQuestLog(), [
      "quest.tessa_gather.offer",
      { type: "gathering:harvested", itemId: "timber", count: 2 }
    ]);

    expect(buildQuestObjectiveView(questLog)).toMatchObject({
      questId: "hearthmere.tessa_gather",
      regionTitle: "Hearthmere",
      title: "Fuel for the Emberwright",
      status: QUEST_STATUS.ACTIVE,
      state: "In Progress",
      objective: {
        id: "gather_timber",
        label: "Gather timber",
        current: 2,
        requiredCount: 3,
        complete: false
      }
    });
  });

  test("falls back to completed quest text when no active quests remain", () => {
    const questLog = reduceQuestEvents(createQuestLog(), [
      "quest.survivor_rite.note",
      { type: "boss:defeated", name: "Hollowbound Caravan Guard" }
    ]);

    expect(buildQuestObjectiveView(questLog)).toMatchObject({
      questId: "hearthmere.survivor_rite",
      status: QUEST_STATUS.COMPLETED,
      state: "Completed",
      text: "The shrine path is clear enough for the rite to begin.",
      objective: {
        complete: true,
        current: 1,
        requiredCount: 1
      }
    });
  });

  test("builds a full quest log grouped by active, completed, and inactive quests", () => {
    const questLog = reduceQuestEvents(createQuestLog(), [
      "quest.tessa_gather.offer",
      { type: "gathering:harvested", itemId: "timber", count: 3 },
      "quest.survivor_rite.note",
      { type: "boss:defeated", name: "Hollowbound Caravan Guard" }
    ]);
    const view = buildQuestLogView(questLog);

    expect(view.summary).toEqual({
      activeCount: 1,
      completedCount: 1,
      inactiveCount: 4,
      totalCount: 6
    });
    expect(view.active[0]).toMatchObject({
      questId: "hearthmere.tessa_gather",
      state: "In Progress",
      progressText: "1/2 objectives",
      objectives: [
        {
          id: "gather_timber",
          progressText: "3/3",
          complete: true
        },
        {
          id: "gather_iron_ore",
          progressText: "0/2",
          complete: false
        }
      ]
    });
    expect(view.completed[0]).toMatchObject({
      questId: "hearthmere.survivor_rite",
      state: "Completed",
      text: "The shrine path is clear enough for the rite to begin.",
      reward: {
        rewardId: "hearthmere.survivor_rite.reward",
        rewardMetadata: {
          id: "hearthmere.survivor_rite.reward",
          type: "xp",
          xp: 90
        },
        state: "available",
        claimable: true,
        claimed: false,
        rewards: [
          {
            rewardId: "hearthmere.survivor_rite.reward",
            type: "xp",
            xp: 90,
            label: "Experience",
            countText: "90 XP"
          }
        ]
      }
    });
    expect(view.inactive.map((quest) => quest.status)).toEqual([
      QUEST_STATUS.INACTIVE,
      QUEST_STATUS.INACTIVE,
      QUEST_STATUS.INACTIVE,
      QUEST_STATUS.INACTIVE
    ]);
  });

  test("includes reward state when quest definitions provide rewards", () => {
    const definitions = [
      Object.freeze({
        id: "test.rewarded",
        regionId: "hearthmere",
        title: "Rewarded Work",
        summary: "Finish the task.",
        startEffect: "quest.rewarded.start",
        objectives: Object.freeze([
          Object.freeze({
            id: "finish_task",
            type: "test",
            targetId: "task",
            requiredCount: 1,
            label: "Finish the task"
          })
        ]),
        completionText: "The task is done.",
        rewards: Object.freeze([
          Object.freeze({ itemId: "ember_sigil", label: "Ember Sigil", count: 2 })
        ])
      })
    ];
    const view = buildQuestLogView({
      quests: {
        "test.rewarded": {
          status: QUEST_STATUS.COMPLETED,
          rewardClaimed: true,
          objectives: {
            finish_task: { current: 1 }
          }
        }
      }
    }, definitions);

    expect(view.completed[0].reward).toMatchObject({
      state: "claimed",
      label: "Reward Claimed",
      rewards: [
        {
          itemId: "ember_sigil",
          label: "Ember Sigil",
          count: 2,
          countText: "x2"
        }
      ]
    });
  });

  test("marks metadata rewards claimed from external claimed reward ids", () => {
    const questLog = reduceQuestEvents(createQuestLog(), [
      "quest.survivor_rite.note",
      { type: "boss:defeated", name: "Hollowbound Caravan Guard" }
    ]);
    const view = buildQuestLogView(questLog, {
      claimedRewardIds: ["hearthmere.survivor_rite.reward"]
    });

    expect(view.claimedRewardIds).toEqual(["hearthmere.survivor_rite.reward"]);
    expect(view.completed[0].reward).toMatchObject({
      rewardId: "hearthmere.survivor_rite.reward",
      state: "claimed",
      label: "Reward Claimed",
      claimed: true,
      claimable: false
    });
  });
});

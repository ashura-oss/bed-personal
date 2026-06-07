import { describe, expect, it } from "@jest/globals";
import {
  HEARTHMERE_QUEST_EFFECTS,
  QUEST_EVENT_TYPES,
  createQuestLog,
  reduceQuestEvent
} from "../gameplay/quests/index.js";
import {
  addClaimedQuestRewardIds,
  detectNewlyCompletedQuestRewards,
  getClaimedQuestRewardIds,
  listCompletedUnclaimedQuestRewards,
  normalizeQuestRewardSnapshot
} from "../gameplay/quests/QuestCompletionService.js";

function activateTessaQuest() {
  return reduceQuestEvent(
    createQuestLog(),
    HEARTHMERE_QUEST_EFFECTS.TESSA_GATHER_OFFER
  );
}

function completeTessaQuest(questLog) {
  const withTimber = reduceQuestEvent(questLog, {
    type: QUEST_EVENT_TYPES.RESOURCE_GATHERED,
    itemId: "timber",
    count: 3
  });

  return reduceQuestEvent(withTimber, {
    type: QUEST_EVENT_TYPES.RESOURCE_GATHERED,
    itemId: "iron_ore",
    count: 2
  });
}

describe("QuestCompletionService", () => {
  it("detects rewards for quests that newly transition to completed", () => {
    const previousQuestLog = activateTessaQuest();
    const nextQuestLog = completeTessaQuest(previousQuestLog);

    expect(detectNewlyCompletedQuestRewards({
      previousQuestLog,
      nextQuestLog
    })).toEqual([
      {
        questId: "hearthmere.tessa_gather",
        rewardId: "hearthmere.tessa_gather.reward",
        rewardMetadata: {
          id: "hearthmere.tessa_gather.reward",
          type: "xp",
          xp: 35
        }
      }
    ]);
  });

  it("does not emit already completed or already claimed rewards", () => {
    const completedQuestLog = completeTessaQuest(activateTessaQuest());

    expect(detectNewlyCompletedQuestRewards({
      previousQuestLog: completedQuestLog,
      nextQuestLog: completedQuestLog
    })).toEqual([]);

    expect(detectNewlyCompletedQuestRewards({
      previousQuestLog: activateTessaQuest(),
      nextQuestLog: completedQuestLog,
      claimedRewardIds: ["hearthmere.tessa_gather.reward"]
    })).toEqual([]);
  });

  it("lists completed unclaimed rewards for boot retry", () => {
    const completedQuestLog = completeTessaQuest(activateTessaQuest());

    expect(listCompletedUnclaimedQuestRewards({
      questLog: completedQuestLog
    })).toEqual([
      {
        questId: "hearthmere.tessa_gather",
        rewardId: "hearthmere.tessa_gather.reward",
        rewardMetadata: {
          id: "hearthmere.tessa_gather.reward",
          type: "xp",
          xp: 35
        }
      }
    ]);

    expect(listCompletedUnclaimedQuestRewards({
      questLog: completedQuestLog,
      claimedRewardIds: {
        claimedRewardIds: ["hearthmere.tessa_gather.reward"]
      }
    })).toEqual([]);
  });

  it("normalizes claimed reward snapshots and appends unique ids", () => {
    expect(normalizeQuestRewardSnapshot({
      claimedQuestRewardIds: [
        " hearthmere.tessa_gather.reward ",
        "",
        "hearthmere.tessa_gather.reward",
        42
      ]
    })).toEqual({
      version: 1,
      claimedRewardIds: ["hearthmere.tessa_gather.reward"]
    });

    expect(getClaimedQuestRewardIds(null)).toEqual([]);
    expect(addClaimedQuestRewardIds(
      { claimedRewardIds: ["hearthmere.tessa_gather.reward"] },
      ["hearthmere.aldric_hollow.reward", "hearthmere.tessa_gather.reward"]
    )).toEqual({
      version: 1,
      claimedRewardIds: [
        "hearthmere.tessa_gather.reward",
        "hearthmere.aldric_hollow.reward"
      ]
    });
  });
});

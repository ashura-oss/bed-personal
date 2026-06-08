import assert from "node:assert/strict";
import test from "node:test";

import {
  HEARTHMERE_LOCAL_QUEST_REWARDS,
  findHearthmereLocalQuestReward
} from "../questCompletionModel.js";

test("findHearthmereLocalQuestReward maps the Act 1 road quest reward", () => {
  assert.deepEqual(
    findHearthmereLocalQuestReward("hearthmere.road_that_still_stands"),
    {
      questId: "hearthmere.road_that_still_stands",
      regionId: "hearthmere",
      title: "The Road That Still Stands",
      rewardXp: 30
    }
  );
});

test("findHearthmereLocalQuestReward preserves existing local Hearthmere rewards", () => {
  const existingQuestIds = [
    "hearthmere.tessa_gather",
    "hearthmere.aldric_hollow",
    "hearthmere.marn_supply",
    "hearthmere.survivor_rite",
    "hearthmere.brek_mine"
  ];

  for (const questId of existingQuestIds) {
    assert.equal(
      findHearthmereLocalQuestReward(questId),
      HEARTHMERE_LOCAL_QUEST_REWARDS[questId]
    );
  }
});

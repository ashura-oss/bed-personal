import assert from "node:assert/strict";
import test from "node:test";

import {
  MORDOR_LOCAL_QUEST_REWARDS,
  findMordorLocalQuestReward
} from "../questCompletionModel.js";

test("findMordorLocalQuestReward maps the Act 1 Black Road reward", () => {
  assert.deepEqual(
    findMordorLocalQuestReward("mordor.black_road_reclamation"),
    {
      questId: "mordor.black_road_reclamation",
      regionId: "mordor",
      title: "Reclaim the Black Road",
      rewardXp: 30
    }
  );
});

test("findMordorLocalQuestReward preserves existing local Mordor rewards", () => {
  const existingQuestIds = [
    "mordor.war_stock",
    "mordor.ring_touched_cull",
    "mordor.warforge_supply",
    "mordor.first_ring_trace",
    "mordor.gorgoroth_mine"
  ];

  for (const questId of existingQuestIds) {
    assert.equal(
      findMordorLocalQuestReward(questId),
      MORDOR_LOCAL_QUEST_REWARDS[questId]
    );
  }
});

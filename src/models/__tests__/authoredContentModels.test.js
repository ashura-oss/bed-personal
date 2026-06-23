import assert from "node:assert/strict";
import test from "node:test";

import { findAbilities, findAbilityById } from "../abilityModel.js";
import { findQuestById, findQuests } from "../questModel.js";
import { findRegionById, findRegions } from "../regionModel.js";

test("region reads come from authored content modules", async () => {
  const regions = await findRegions();
  const ringGate = await findRegionById("region_mordor_ring_gate");
  const mordor = await findRegionById("mordor");

  assert.ok(regions.length >= 4);
  assert.equal(ringGate.name, "Ring Gate Encampment");
  assert.equal(mordor.name, "Mordor");
});

test("quest reads resolve authored quests without relying on mutable DB content", async () => {
  const ringGateQuests = await findQuests({ regionId: "region_mordor_ring_gate" });
  const bossQuest = await findQuestById("quest_first_ring_guardian");

  assert.ok(ringGateQuests.some((quest) => quest.questId === "quest_black_road_reclamation"));
  assert.equal(bossQuest.questType, "boss");
});

test("ability reads resolve authored ability definitions", async () => {
  const rangerAbilities = await findAbilities({ className: "Ranger" });
  const thornbind = await findAbilityById("ability_thornbind");

  assert.ok(rangerAbilities.some((ability) => ability.abilityId === "ability_verdant_strike"));
  assert.equal(thornbind.affinity, "Nature");
});

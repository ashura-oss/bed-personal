import { describe, expect, test } from "@jest/globals";
import {
  HEARTHMERE_QUEST_DEFINITIONS,
  HEARTHMERE_QUEST_EFFECTS,
  QUEST_OBJECTIVE_TYPES,
  QUEST_REWARD_TYPES,
  getHearthmereQuestDefinition,
  getHearthmereQuestDefinitionForEffect,
  listHearthmereQuestDefinitions
} from "../gameplay/quests/HearthmereQuestDefinitions.js";

describe("HearthmereQuestDefinitions", () => {
  test("defines one Hearthmere quest for each authored dialogue effect", () => {
    const effects = HEARTHMERE_QUEST_DEFINITIONS.map((definition) => definition.startEffect);

    expect(effects).toEqual([
      HEARTHMERE_QUEST_EFFECTS.TESSA_GATHER_OFFER,
      HEARTHMERE_QUEST_EFFECTS.ALDRIC_HOLLOW_OFFER,
      HEARTHMERE_QUEST_EFFECTS.MARN_SUPPLY_NOTE,
      HEARTHMERE_QUEST_EFFECTS.SURVIVOR_RITE_NOTE,
      HEARTHMERE_QUEST_EFFECTS.BREK_MINE_OFFER
    ]);
    expect(new Set(effects).size).toBe(effects.length);
  });

  test("exports stable lookup helpers", () => {
    expect(listHearthmereQuestDefinitions()).toBe(HEARTHMERE_QUEST_DEFINITIONS);
    expect(getHearthmereQuestDefinition(" hearthmere.tessa_gather ")?.title).toBe("Fuel for the Emberwright");
    expect(getHearthmereQuestDefinition("missing.quest")).toBeNull();

    expect(getHearthmereQuestDefinitionForEffect(" quest.brek_mine.offer ")?.id).toBe("hearthmere.brek_mine");
    expect(getHearthmereQuestDefinitionForEffect("quest.unknown")).toBeNull();
  });

  test("uses existing Hearthmere gameplay ids as pure objective targets", () => {
    const objectives = HEARTHMERE_QUEST_DEFINITIONS.flatMap((definition) => definition.objectives);

    expect(objectives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: QUEST_OBJECTIVE_TYPES.GATHER_ITEM,
          targetId: "timber",
          requiredCount: 3
        }),
        expect.objectContaining({
          type: QUEST_OBJECTIVE_TYPES.GATHER_ITEM,
          targetId: "iron_ore",
          requiredCount: 2
        }),
        expect.objectContaining({
          type: QUEST_OBJECTIVE_TYPES.KILL_ENEMY,
          targetId: "hollow_shambler"
        }),
        expect.objectContaining({
          type: QUEST_OBJECTIVE_TYPES.CRAFT_ITEM,
          targetId: "ashleaf_poultice"
        }),
        expect.objectContaining({
          type: QUEST_OBJECTIVE_TYPES.DEFEAT_BOSS,
          targetId: "hearthmere.boss.hollowbound_guard",
          targetAliases: ["Hollowbound Caravan Guard"]
        })
      ])
    );
  });

  test("defines reward metadata for every quest", () => {
    for (const definition of HEARTHMERE_QUEST_DEFINITIONS) {
      expect(definition.rewardMetadata).toEqual({
        id: `${definition.id}.reward`,
        type: QUEST_REWARD_TYPES.XP,
        xp: expect.any(Number)
      });
      expect(definition.rewardMetadata.xp).toBeGreaterThan(0);
    }
  });
});

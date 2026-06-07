import { describe, expect, it } from "@jest/globals";
import {
  ABILITY_DEFINITION_BY_ID,
  ABILITY_DEFINITIONS,
  ABILITY_SLOT_IDS,
  buildAbilityDefinitionView,
  getAbilityDefinition
} from "../gameplay/player/AbilityDefinitions.js";

const SEEDED_ABILITY_IDS = [
  "ability_spark",
  "ability_flame_slash",
  "ability_ash_step",
  "ability_vanish",
  "ability_shadow_cut",
  "ability_bless",
  "ability_smite",
  "ability_quickstep",
  "ability_static_strike",
  "ability_life_tap",
  "ability_thornbind",
  "ability_verdant_strike",
  "ability_beastcall",
  "ability_heartwood_finish",
  "ability_arcane_surge"
];

describe("AbilityDefinitions", () => {
  it("defines the Q/E/R ability slots", () => {
    expect(ABILITY_SLOT_IDS).toEqual(["Q", "E", "R"]);
  });

  it("has local metadata for every seeded backend ability id", () => {
    expect(ABILITY_DEFINITIONS).toHaveLength(SEEDED_ABILITY_IDS.length);

    for (const abilityId of SEEDED_ABILITY_IDS) {
      const definition = getAbilityDefinition(abilityId);
      expect(definition).toBe(ABILITY_DEFINITION_BY_ID[abilityId]);
      expect(definition).toEqual(expect.objectContaining({
        abilityId,
        name: expect.any(String),
        abilityType: expect.any(String),
        fpCost: expect.any(Number),
        cooldown: expect.any(Number),
        range: expect.any(Number),
        damage: expect.any(Number),
        effect: expect.any(Object),
        icon: expect.any(String),
        glyph: expect.any(String)
      }));
      expect(definition.fpCost).toBeGreaterThanOrEqual(0);
      expect(definition.cooldown).toBeGreaterThan(0);
      expect(definition.range).toBeGreaterThanOrEqual(0);
      expect(definition.damage).toBeGreaterThanOrEqual(0);
    }
  });

  it("builds UI-safe definition views with slot key glyphs", () => {
    const view = buildAbilityDefinitionView(getAbilityDefinition("ability_thornbind"), "E");

    expect(view).toMatchObject({
      abilityId: "ability_thornbind",
      name: "Thornbind",
      slot: "E",
      keyGlyph: "E",
      fpCost: 13,
      icon: "thornbind",
      glyph: "THN"
    });
  });
});

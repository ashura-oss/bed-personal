import { describe, expect, it } from "@jest/globals";
import {
  BOSS_INTRO_PLAYED_FLAG,
  FIRST_SHARD_ABSORBED_FLAG,
  HEARTHMERE_REACHED_FLAG,
  OPENING_ASHFALL_ROAD_FLAG,
  createBossIntroFlag,
  createHollowboundBossIntroSequence,
  createOpeningAshfallRoadSequence
} from "../cinematic/index.js";

describe("CinematicSequences", () => {
  it("builds the opening sequence with callback and played flag commands", () => {
    const sequence = createOpeningAshfallRoadSequence();

    expect(sequence.id).toBe(OPENING_ASHFALL_ROAD_FLAG);
    expect(sequence.commands.some((command) => command.type === "callback")).toBe(true);
    expect(sequence.commands).toEqual(expect.arrayContaining([
      { type: "subtitle", text: "The Heart remembers you.", duration: 1.8, position: "center" },
      { type: "setFlag", flagId: FIRST_SHARD_ABSORBED_FLAG },
      { type: "setFlag", flagId: HEARTHMERE_REACHED_FLAG }
    ]));
    expect(sequence.commands.at(-1)).toEqual({
      type: "setFlag",
      flagId: OPENING_ASHFALL_ROAD_FLAG
    });
  });

  it("builds boss intros with generic and per-boss played flags", () => {
    const sequence = createHollowboundBossIntroSequence({
      bossId: "hearthmere.hollowbound_guard"
    });

    expect(sequence.id).toBe(createBossIntroFlag("hearthmere.hollowbound_guard"));
    expect(sequence.commands.slice(-2)).toEqual([
      { type: "setFlag", flagId: BOSS_INTRO_PLAYED_FLAG },
      { type: "setFlag", flagId: createBossIntroFlag("hearthmere.hollowbound_guard") }
    ]);
  });
});

import { describe, expect, it } from "@jest/globals";
import {
  ACT1_EVENTS,
  ACT1_FLAGS,
  ACT1_HOLLOWBOUND_GUARD_BOSS_ID,
  createAct1Progression,
  hasAct1Flag,
  isAct1Complete,
  isAct1WorldMapUnlocked,
  isHollowboundGuardDefeatEvent,
  reduceAct1Event,
  serializeAct1Progression
} from "../gameplay/story/Act1Progression.js";

describe("Act1Progression", () => {
  it("starts Act 1 from the opening and derives the road quest state", () => {
    const state = reduceAct1Event(createAct1Progression(), ACT1_EVENTS.OPENING_COMPLETED);

    expect(state.flags).toMatchObject({
      [ACT1_FLAGS.ACT1_STARTED]: true,
      [ACT1_FLAGS.SHARD_ABSORBED_FIRST]: true,
      [ACT1_FLAGS.HEARTHMERE_REACHED]: true,
      [ACT1_FLAGS.QUEST_ROAD_STARTED]: true,
      [ACT1_FLAGS.WORLD_MAP_UNLOCKED]: false,
      [ACT1_FLAGS.ACT1_COMPLETE]: false
    });
  });

  it("marks Tessa tutorial completion without losing previous flags", () => {
    const started = reduceAct1Event(createAct1Progression(), ACT1_EVENTS.OPENING_COMPLETED);
    const next = reduceAct1Event(started, ACT1_EVENTS.TESSA_FORGE_TUTORIAL_COMPLETED);

    expect(next.flags[ACT1_FLAGS.TESSA_MET]).toBe(true);
    expect(next.flags[ACT1_FLAGS.TESSA_FORGE_TUTORIAL_COMPLETE]).toBe(true);
    expect(next.flags[ACT1_FLAGS.QUEST_ROAD_STARTED]).toBe(true);
  });

  it("unlocks the world map and completes Act 1 after the guard falls", () => {
    const started = reduceAct1Event(createAct1Progression(), ACT1_EVENTS.OPENING_COMPLETED);
    const completed = reduceAct1Event(started, ACT1_EVENTS.BOSS_GUARD_DEFEATED);
    const repeated = reduceAct1Event(completed, ACT1_EVENTS.BOSS_GUARD_DEFEATED);

    expect(isAct1Complete(completed)).toBe(true);
    expect(isAct1WorldMapUnlocked(completed)).toBe(true);
    expect(repeated).toEqual(completed);
  });

  it("normalizes reload snapshots and derives missing prerequisite flags", () => {
    const restored = createAct1Progression({
      version: 1,
      flags: {
        [ACT1_FLAGS.BOSS_GUARD_DEFEATED]: true,
        unknown_flag: true
      }
    });

    expect(serializeAct1Progression(restored)).toEqual(restored);
    expect(hasAct1Flag(restored, ACT1_FLAGS.ACT1_STARTED)).toBe(true);
    expect(hasAct1Flag(restored, ACT1_FLAGS.SHARD_ABSORBED_FIRST)).toBe(true);
    expect(hasAct1Flag(restored, ACT1_FLAGS.WORLD_MAP_UNLOCKED)).toBe(true);
    expect(hasAct1Flag(restored, "unknown_flag")).toBe(false);
  });

  it("recognizes Hollowbound Caravan Guard defeat payload aliases", () => {
    expect(isHollowboundGuardDefeatEvent({
      bossId: ACT1_HOLLOWBOUND_GUARD_BOSS_ID
    })).toBe(true);
    expect(isHollowboundGuardDefeatEvent({
      name: "Hollowbound Caravan Guard"
    })).toBe(true);
    expect(isHollowboundGuardDefeatEvent({
      bossId: "other.boss"
    })).toBe(false);
  });
});

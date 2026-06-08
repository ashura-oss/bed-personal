import { describe, expect, it, jest } from "@jest/globals";
import {
  CinematicCommandType,
  normalizeCinematicCommand,
  normalizeCinematicCommands,
} from "../cinematic/CinematicCommands.js";

describe("normalizeCinematicCommand", () => {
  it("normalizes command defaults into frozen plain objects", () => {
    const command = normalizeCinematicCommand({
      type: CinematicCommandType.Subtitle,
      text: "  The Heart remembers you.  ",
      duration: "2.5",
    });

    expect(command).toEqual({
      type: "subtitle",
      text: "The Heart remembers you.",
      duration: 2.5,
      position: "lower-third",
    });
    expect(Object.isFrozen(command)).toBe(true);
  });

  it("keeps callback functions and normalizes instant command duration", () => {
    const fn = jest.fn();
    const command = normalizeCinematicCommand({
      type: "callback",
      id: "spawn_wave",
      fn,
    });

    expect(command).toEqual({
      type: "callback",
      id: "spawn_wave",
      fn,
      duration: 0,
    });
  });

  it("clamps desaturate amount to the visible effect range", () => {
    expect(normalizeCinematicCommand({ type: "desaturate", amount: 2, duration: 0.4 }).amount).toBe(1);
    expect(normalizeCinematicCommand({ type: "desaturate", amount: -1, duration: 0.4 }).amount).toBe(0);
  });

  it("rejects unsupported command types and invalid timing", () => {
    expect(() => normalizeCinematicCommand({ type: "teleport" })).toThrow(TypeError);
    expect(() => normalizeCinematicCommand({ type: "wait", duration: -1 })).toThrow(RangeError);
    expect(() => normalizeCinematicCommand({ type: "subtitle", text: "", duration: 1 })).toThrow(TypeError);
  });
});

describe("normalizeCinematicCommands", () => {
  it("normalizes a full declarative command list", () => {
    const commands = normalizeCinematicCommands([
      { type: "letterbox", enter: true, duration: 0.3 },
      { type: "playAudio", soundId: "bossIntro" },
      { type: "setFlag", flagId: "boss_intro_played" },
    ]);

    expect(commands).toEqual([
      { type: "letterbox", enter: true, duration: 0.3 },
      { type: "playAudio", soundId: "bossIntro", duration: 0 },
      { type: "setFlag", flagId: "boss_intro_played", value: true, duration: 0 },
    ]);
    expect(Object.isFrozen(commands)).toBe(true);
  });
});

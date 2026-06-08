import { describe, expect, it, jest } from "@jest/globals";
import { AppMode } from "../core/AppMode.js";
import { GameContext } from "../core/GameContext.js";
import { CinematicPlayer } from "../cinematic/CinematicPlayer.js";

class RecordingBus {
  constructor() {
    this.events = [];
  }

  emit(name, payload) {
    this.events.push({ name, payload });
  }

  named(name) {
    return this.events.filter((event) => event.name === name);
  }
}

function makeExplorationContext() {
  const ctx = new GameContext();
  ctx.transition(AppMode.Exploration);
  return ctx;
}

describe("CinematicPlayer", () => {
  it("transitions Exploration -> Cutscene on play and back on completion", () => {
    const ctx = makeExplorationContext();
    const bus = new RecordingBus();
    const player = new CinematicPlayer({ gameContext: ctx, uiBus: bus });

    player.play({
      id: "fog_gate_intro",
      commands: [
        { type: "letterbox", enter: true, duration: 0.4 },
        { type: "subtitle", text: "SURVIVE.", duration: 0.6, position: "center" },
        { type: "playAudio", soundId: "bossIntro" },
        { type: "setFlag", flagId: "boss_intro_played" },
      ],
    });

    expect(ctx.mode).toBe(AppMode.Cutscene);
    expect(bus.named("cinematic:started")[0].payload).toEqual({
      id: "fog_gate_intro",
      duration: 1,
      commandCount: 4,
    });

    player.update(0.4);
    expect(bus.named("cinematic:letterbox").some((event) => event.payload.phase === "end")).toBe(true);
    expect(bus.named("cinematic:subtitle")[0].payload).toMatchObject({
      phase: "start",
      text: "SURVIVE.",
      position: "center",
    });

    player.update(0.6);
    expect(ctx.mode).toBe(AppMode.Exploration);
    expect(player.isPlaying).toBe(false);
    expect(bus.named("cinematic:audio")[0].payload).toMatchObject({ soundId: "bossIntro" });
    expect(bus.named("cinematic:setFlag")[0].payload).toMatchObject({
      flagId: "boss_intro_played",
      value: true,
    });
    expect(bus.named("cinematic:ended")[0].payload).toMatchObject({
      id: "fog_gate_intro",
      skipped: false,
      reason: "complete",
    });
  });

  it("emits progress for timed commands and executes callbacks once", () => {
    const bus = new RecordingBus();
    const fn = jest.fn();
    const player = new CinematicPlayer({ uiBus: bus });

    player.play([
      { type: "cameraPan", from: { x: 0, y: 1, z: 2 }, to: { x: 5, y: 1, z: 8 }, duration: 2 },
      { type: "callback", fn },
    ]);
    player.update(1);

    expect(bus.named("cinematic:cameraPan").map((event) => event.payload.progress)).toContain(0.5);

    player.update(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(bus.named("cinematic:callback").map((event) => event.payload.phase)).toEqual([
      "start",
      "progress",
      "end",
    ]);
  });

  it("skip ends active commands, emits cleanup, and restores Exploration", () => {
    const ctx = makeExplorationContext();
    const bus = new RecordingBus();
    const player = new CinematicPlayer({ gameContext: ctx, uiBus: bus });

    player.play([
      { type: "fade", direction: "out", color: "black", duration: 2 },
      { type: "desaturate", amount: 0.8, duration: 1 },
    ]);
    player.update(0.5);

    expect(player.skip()).toBe(true);
    expect(ctx.mode).toBe(AppMode.Exploration);
    expect(player.isPlaying).toBe(false);
    expect(bus.named("cinematic:cleanup")).toHaveLength(1);
    expect(bus.named("cinematic:fade").at(-1).payload).toMatchObject({
      phase: "cleanup",
      clear: true,
      skipped: true,
    });
    expect(bus.named("cinematic:ended")[0].payload).toMatchObject({
      skipped: true,
      reason: "skip",
    });
  });

  it("manual end cleans up an active sequence without marking it skipped", () => {
    const bus = new RecordingBus();
    const player = new CinematicPlayer({ uiBus: bus });

    player.play([{ type: "letterbox", enter: true, duration: 2 }]);
    player.update(0.5);

    expect(player.end()).toBe(true);
    expect(bus.named("cinematic:letterbox").some((event) => event.payload.phase === "end")).toBe(true);
    expect(bus.named("cinematic:ended")[0].payload).toMatchObject({
      skipped: false,
      reason: "end",
    });
    expect(bus.named("cinematic:cleanup")).toHaveLength(1);
  });

  it("rejects invalid update deltas", () => {
    const player = new CinematicPlayer({ uiBus: new RecordingBus() });
    player.play([{ type: "wait", duration: 1 }]);

    expect(() => player.update(Number.NaN)).toThrow(TypeError);
    expect(() => player.update(-0.1)).toThrow(RangeError);
  });
});

import { describe, expect, it } from "@jest/globals";
import { CinematicTimeline, createCinematicTimeline } from "../cinematic/CinematicTimeline.js";

describe("CinematicTimeline", () => {
  it("schedules commands sequentially by default", () => {
    const timeline = new CinematicTimeline({
      id: "boss_intro",
      commands: [
        { type: "letterbox", enter: true, duration: 0.4 },
        { type: "desaturate", amount: 0.6, duration: 0.8 },
        { type: "wait", duration: 0.3 },
      ],
    });

    expect(timeline.id).toBe("boss_intro");
    expect(timeline.duration).toBeCloseTo(1.5);
    expect(timeline.entries.map(({ start, end }) => [start, end])).toEqual([
      [0, 0.4],
      [0.4, 1.2000000000000002],
      [1.2000000000000002, 1.5000000000000002],
    ]);
    expect(Object.isFrozen(timeline.entries)).toBe(true);
  });

  it("supports authored absolute start times for overlaps", () => {
    const timeline = new CinematicTimeline([
      { type: "cameraPan", from: "gate", to: "boss", duration: 2 },
      { type: "cameraShake", intensity: 0.25, duration: 0.5, at: 1 },
      { type: "bossReveal", name: "Hollowbound Caravan Guard", subtitle: "Last shield", at: 1.25 },
    ]);

    expect(timeline.duration).toBe(2);
    expect(timeline.entries.map(({ start, end }) => [start, end])).toEqual([
      [0, 2],
      [1, 1.5],
      [1.25, 1.25],
    ]);
  });

  it("returns an existing timeline from the factory unchanged", () => {
    const timeline = new CinematicTimeline([{ type: "wait", duration: 1 }]);

    expect(createCinematicTimeline(timeline)).toBe(timeline);
  });
});

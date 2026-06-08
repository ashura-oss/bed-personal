/**
 * @jest-environment jsdom
 */
import { describe, expect, it, jest } from "@jest/globals";
import { AudioManager } from "../audio/AudioManager.js";

class FakeAudioParam {
  constructor(value = 0) {
    this.value = value;
    this.events = [];
  }

  setValueAtTime(value, time) {
    this.value = value;
    this.events.push({ type: "set", value, time });
  }

  linearRampToValueAtTime(value, time) {
    this.value = value;
    this.events.push({ type: "linear", value, time });
  }

  exponentialRampToValueAtTime(value, time) {
    this.value = value;
    this.events.push({ type: "exponential", value, time });
  }

  setTargetAtTime(value, time, constant) {
    this.value = value;
    this.events.push({ type: "target", value, time, constant });
  }
}

class FakeNode {
  constructor() {
    this.connections = [];
    this.disconnect = jest.fn(() => {
      this.connections = [];
    });
  }

  connect(node) {
    this.connections.push(node);
    return node;
  }
}

class FakeScheduledSource extends FakeNode {
  constructor() {
    super();
    this.startedAt = null;
    this.stopCalls = [];
    this.onended = null;
  }

  start(time) {
    this.startedAt = time;
  }

  stop(time) {
    this.stopCalls.push(time);
  }
}

class FakeOscillator extends FakeScheduledSource {
  constructor() {
    super();
    this.type = "sine";
    this.frequency = new FakeAudioParam(440);
    this.detune = new FakeAudioParam(0);
  }
}

class FakeBufferSource extends FakeScheduledSource {
  constructor() {
    super();
    this.buffer = null;
  }
}

class FakeGain extends FakeNode {
  constructor() {
    super();
    this.gain = new FakeAudioParam(1);
  }
}

class FakeBiquadFilter extends FakeNode {
  constructor() {
    super();
    this.type = "lowpass";
    this.frequency = new FakeAudioParam(350);
    this.Q = new FakeAudioParam(1);
  }
}

class FakeStereoPanner extends FakeNode {
  constructor() {
    super();
    this.pan = new FakeAudioParam(0);
  }
}

class FakeAudioContext {
  constructor({ state = "running" } = {}) {
    this.currentTime = 12;
    this.sampleRate = 44100;
    this.state = state;
    this.destination = { id: "destination" };
    this.createdOscillators = [];
    this.createdBufferSources = [];
    this.createdGains = [];
    this.createdFilters = [];
    this.createdPanners = [];
    this.resume = jest.fn(() => {
      this.state = "running";
      return Promise.resolve();
    });
    this.close = jest.fn(() => Promise.resolve());
  }

  createOscillator() {
    const oscillator = new FakeOscillator();
    this.createdOscillators.push(oscillator);
    return oscillator;
  }

  createBufferSource() {
    const source = new FakeBufferSource();
    this.createdBufferSources.push(source);
    return source;
  }

  createGain() {
    const gain = new FakeGain();
    this.createdGains.push(gain);
    return gain;
  }

  createBiquadFilter() {
    const filter = new FakeBiquadFilter();
    this.createdFilters.push(filter);
    return filter;
  }

  createStereoPanner() {
    const panner = new FakeStereoPanner();
    this.createdPanners.push(panner);
    return panner;
  }

  createBuffer(channels, length, sampleRate) {
    return {
      channels,
      length,
      sampleRate,
      data: Array.from({ length: channels }, () => new Float32Array(length)),
      getChannelData(index) {
        return this.data[index];
      }
    };
  }
}

function makeClock(start = 1000) {
  return {
    value: start,
    now() {
      return this.value;
    },
    advance(ms) {
      this.value += ms;
    }
  };
}

function makeManager(ctx = new FakeAudioContext(), clock = makeClock()) {
  return new AudioManager({
    audioContext: ctx,
    autoUnlock: false,
    subscribeToFeedback: false,
    performance: clock
  });
}

describe("AudioManager", () => {
  it("instantiates important Hearthmere cues safely", () => {
    const ctx = new FakeAudioContext();
    const clock = makeClock();
    const manager = makeManager(ctx, clock);

    const cueIds = [
      "swing",
      "hit",
      "dodge",
      "hearthlight",
      "unmade",
      "bossHit",
      "bossPhase",
      "bossDefeat",
      "embers",
      "uiSelect"
    ];

    for (const cueId of cueIds) {
      expect(() => manager.play(cueId)).not.toThrow();
      clock.advance(1300);
    }

    expect(ctx.createdOscillators.length).toBeGreaterThan(10);
    expect(ctx.createdBufferSources.length).toBeGreaterThan(5);
    expect(ctx.createdFilters.length).toBe(ctx.createdBufferSources.length);
    expect(manager.active.size).toBeGreaterThan(10);
  });

  it("keeps cooldowns from creating rapid repeated cues", () => {
    const ctx = new FakeAudioContext();
    const clock = makeClock();
    const manager = makeManager(ctx, clock);

    manager.play("swing");
    const oscillatorCount = ctx.createdOscillators.length;
    const noiseCount = ctx.createdBufferSources.length;

    manager.play("swing");

    expect(ctx.createdOscillators).toHaveLength(oscillatorCount);
    expect(ctx.createdBufferSources).toHaveLength(noiseCount);

    clock.advance(46);
    manager.play("swing");

    expect(ctx.createdOscillators.length).toBeGreaterThan(oscillatorCount);
    expect(ctx.createdBufferSources.length).toBeGreaterThan(noiseCount);
  });

  it("disposes active audio, closes the context, and removes listeners", () => {
    const ctx = new FakeAudioContext();
    const clock = makeClock();
    const manager = makeManager(ctx, clock);

    manager.play("bossPhase");
    const activeNodes = [...manager.active];

    manager.dispose();

    expect(manager.active.size).toBe(0);
    expect(ctx.close).toHaveBeenCalledTimes(1);
    for (const node of activeNodes) {
      expect(node.stopCalls.length).toBeGreaterThanOrEqual(2);
      expect(node.stopCalls).toContain(ctx.currentTime);
      expect(node.disconnect).toHaveBeenCalledTimes(1);
    }
  });

  it("supports direct accent API calls without gameplay event plumbing", () => {
    const ctx = new FakeAudioContext();
    const manager = makeManager(ctx);

    expect(() => manager.playAttackAccent(undefined, "heavy", 1.1)).not.toThrow();
    expect(() => manager.playImpactAccent(undefined, 0.8)).not.toThrow();

    expect(ctx.createdOscillators.length).toBeGreaterThanOrEqual(2);
    expect(ctx.createdBufferSources.length).toBeGreaterThanOrEqual(2);
  });
});

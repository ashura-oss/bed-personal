import { describe, expect, it, jest } from "@jest/globals";
import { MusicManager } from "../audio/MusicManager.js";

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

  cancelScheduledValues(time) {
    this.events.push({ type: "cancel", time });
  }
}

class FakeGain {
  constructor() {
    this.gain = new FakeAudioParam(1);
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

class FakeBiquadFilter {
  constructor() {
    this.type = "lowpass";
    this.frequency = new FakeAudioParam(350);
    this.Q = new FakeAudioParam(1);
    this.gain = new FakeAudioParam(0);
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

class FakeStereoPanner {
  constructor() {
    this.pan = new FakeAudioParam(0);
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

class FakeOscillator {
  constructor() {
    this.type = "sine";
    this.frequency = new FakeAudioParam(440);
    this.detune = new FakeAudioParam(0);
    this.connections = [];
    this.startedAt = null;
    this.stoppedAt = null;
    this.stopCalls = 0;
    this.onended = null;
    this.disconnect = jest.fn(() => {
      this.connections = [];
    });
  }

  connect(node) {
    this.connections.push(node);
    return node;
  }

  start(time) {
    this.startedAt = time;
  }

  stop(time) {
    this.stopCalls += 1;
    if (this.stopCalls > 1) {
      throw new Error("already stopped");
    }
    this.stoppedAt = time;
  }
}

class FakeAudioContext {
  constructor({ state = "running" } = {}) {
    this.currentTime = 10;
    this.destination = { id: "destination" };
    this.state = state;
    this.createdGains = [];
    this.createdOscillators = [];
    this.createdFilters = [];
    this.createdPanners = [];
    this.resume = jest.fn(() => {
      this.state = "running";
      return Promise.resolve();
    });
    this.close = jest.fn(() => Promise.resolve());
  }

  createGain() {
    const gain = new FakeGain();
    this.createdGains.push(gain);
    return gain;
  }

  createOscillator() {
    const oscillator = new FakeOscillator();
    this.createdOscillators.push(oscillator);
    return oscillator;
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
}

function makeEventTarget() {
  const listeners = new Map();

  return {
    listeners,
    addEventListener: jest.fn((type, callback, options) => {
      listeners.set(type, { callback, options });
    }),
    removeEventListener: jest.fn((type, callback) => {
      const listener = listeners.get(type);
      if (listener?.callback === callback) {
        listeners.delete(type);
      }
    }),
    dispatch(type) {
      const listener = listeners.get(type);
      listener?.callback();
      if (listener?.options?.once) {
        listeners.delete(type);
      }
    }
  };
}

function makeTrack(id = "music.test") {
  return {
    id,
    volume: 0.4,
    voices: [
      { type: "sine", frequency: 220, volume: 0.2 },
      { type: "triangle", frequency: 330, volume: 0.1, detune: -3 }
    ]
  };
}

function makeRichTrack(id = "music.rich") {
  return {
    id,
    volume: 0.45,
    loop: true,
    cycleSeconds: 9,
    voices: [
      {
        type: "triangle",
        frequency: 110,
        volume: 0.18,
        attack: 0.25,
        release: 0.5,
        pan: -0.45,
        filter: { type: "lowpass", frequency: 700, q: 0.8, sweepTo: 900, sweepSeconds: 2 },
        tremolo: { rate: 0.2, depth: 0.3 },
        vibrato: { rate: 0.12, depth: 8 },
        detuneDriftCents: 5
      }
    ]
  };
}

describe("MusicManager", () => {
  it("starts a procedural track definition and exposes current state", () => {
    const ctx = new FakeAudioContext();
    const manager = new MusicManager({ audioContext: ctx, autoUnlock: false });

    const voices = manager.setTrack(makeTrack(), { fadeIn: 0.5 });

    expect(manager.currentTrackId).toBe("music.test");
    expect(manager.currentTrack).toMatchObject({ id: "music.test", volume: 0.4 });
    expect(manager.isPlaying).toBe(true);
    expect(manager.activeVoices).toHaveLength(2);
    expect(voices).toBe(manager.activeVoices);
    expect(ctx.createdOscillators).toHaveLength(2);
    expect(ctx.createdOscillators[0]).toMatchObject({ type: "sine", startedAt: 10 });
    expect(ctx.createdOscillators[0].frequency.value).toBe(220);
    expect(manager.activeVoices[0].trackGain.gain.events).toContainEqual({
      type: "linear",
      value: 0.4,
      time: 10.5
    });
  });

  it("resolves string IDs from an injected registry", () => {
    const ctx = new FakeAudioContext();
    const manager = new MusicManager({
      audioContext: ctx,
      autoUnlock: false,
      tracks: new Map([["music.registry", makeTrack("music.registry")]])
    });

    manager.setTrack("music.registry", { fadeIn: 0 });

    expect(manager.currentTrackId).toBe("music.registry");
    expect(manager.activeVoices).toHaveLength(2);
    expect(ctx.createdOscillators[1].frequency.value).toBe(330);
  });

  it("builds filtered, panned, and modulated production voices", () => {
    const ctx = new FakeAudioContext();
    const manager = new MusicManager({ audioContext: ctx, autoUnlock: false });

    const voices = manager.setTrack(makeRichTrack(), { fadeIn: 0 });

    expect(voices).toHaveLength(1);
    expect(ctx.createdFilters).toHaveLength(1);
    expect(ctx.createdFilters[0]).toMatchObject({ type: "lowpass" });
    expect(ctx.createdFilters[0].frequency.events).toContainEqual({
      type: "linear",
      value: 900,
      time: 12
    });
    expect(ctx.createdPanners).toHaveLength(1);
    expect(ctx.createdPanners[0].pan.value).toBe(-0.45);
    expect(ctx.createdOscillators).toHaveLength(3);
    expect(ctx.createdOscillators[1].frequency.value).toBe(0.2);
    expect(ctx.createdOscillators[2].frequency.value).toBe(0.12);
    expect(voices[0].modulators).toHaveLength(2);
    expect(voices[0].gain.gain.events).toContainEqual({ type: "linear", value: 0.18, time: 10.25 });
    expect(voices[0].oscillator.detune.events).toContainEqual({ type: "linear", value: 5, time: 19 });
  });

  it("crossfades from the previous track to the next track", () => {
    const ctx = new FakeAudioContext();
    const manager = new MusicManager({ audioContext: ctx, autoUnlock: false });

    manager.setTrack(makeTrack("music.first"), { fadeIn: 0 });
    const firstVoices = manager.activeVoices;
    manager.setTrack(makeTrack("music.second"), { fadeIn: 0.25, fadeOut: 1.5 });

    expect(manager.currentTrackId).toBe("music.second");
    expect(manager.activeVoices).toHaveLength(2);
    expect(manager.fadingVoices).toEqual(firstVoices);
    expect(firstVoices[0].oscillator.stoppedAt).toBe(11.5);
    expect(firstVoices[1].oscillator.stoppedAt).toBe(11.5);
    expect(firstVoices[0].trackGain.gain.events).toContainEqual({
      type: "linear",
      value: 0,
      time: 11.5
    });
    expect(manager.activeVoices[0].trackGain.gain.events).toContainEqual({
      type: "linear",
      value: 0.4,
      time: 10.25
    });
  });

  it("does not recreate voices when setting the same track without restart", () => {
    const ctx = new FakeAudioContext();
    const manager = new MusicManager({ audioContext: ctx, autoUnlock: false });

    manager.setTrack(makeTrack("music.same"), { fadeIn: 0 });
    const voices = manager.activeVoices;
    manager.setTrack(makeTrack("music.same"), { fadeIn: 0 });

    expect(manager.activeVoices).toBe(voices);
    expect(ctx.createdOscillators).toHaveLength(2);
  });

  it("cleans up fading voices after oscillator end", () => {
    const ctx = new FakeAudioContext();
    const manager = new MusicManager({ audioContext: ctx, autoUnlock: false });

    manager.setTrack(makeTrack("music.first"), { fadeIn: 0 });
    const firstVoices = manager.activeVoices;
    manager.setTrack(makeTrack("music.second"), { fadeIn: 0, fadeOut: 0.5 });

    expect(manager.fadingVoices).toEqual(firstVoices);
    firstVoices[0].oscillator.onended();

    expect(manager.fadingVoices).toEqual([]);
    expect(firstVoices[0].oscillator.disconnect).toHaveBeenCalledTimes(1);
    expect(firstVoices[0].gain.disconnect).toHaveBeenCalledTimes(1);
    expect(firstVoices[0].trackGain.disconnect).toHaveBeenCalledTimes(1);
  });

  it("stops with a fade and clears current track state", () => {
    const ctx = new FakeAudioContext();
    const manager = new MusicManager({ audioContext: ctx, autoUnlock: false });

    manager.setTrack(makeTrack(), { fadeIn: 0 });
    const voices = manager.activeVoices;
    manager.stop({ fadeOut: 0.75 });

    expect(manager.currentTrackId).toBeNull();
    expect(manager.currentTrack).toBeNull();
    expect(manager.isPlaying).toBe(false);
    expect(manager.activeVoices).toEqual([]);
    expect(manager.fadingVoices).toEqual(voices);
    expect(voices[0].oscillator.stoppedAt).toBe(10.75);
  });

  it("sets master volume on the master gain", () => {
    const ctx = new FakeAudioContext();
    const manager = new MusicManager({ audioContext: ctx, autoUnlock: false });

    manager.setMasterVolume(2);

    expect(manager.masterVolume).toBe(1);
    expect(manager.masterGain.gain.events).toContainEqual({ type: "linear", value: 1, time: 10.03 });
  });

  it("supports setVolume alias and enabled state without losing the queued track", () => {
    const ctx = new FakeAudioContext();
    const manager = new MusicManager({ audioContext: ctx, autoUnlock: false });

    manager.setVolume(0.25);
    expect(manager.masterVolume).toBe(0.25);
    expect(manager.masterGain.gain.events).toContainEqual({ type: "linear", value: 0.25, time: 10.03 });

    manager.setTrack(makeTrack("music.enabled"), { fadeIn: 0 });
    const enabledVoices = manager.activeVoices;
    manager.setEnabled(false);

    expect(manager.isEnabled).toBe(false);
    expect(manager.enabled).toBe(false);
    expect(manager.activeVoices).toEqual([]);
    expect(manager.fadingVoices).toEqual(enabledVoices);
    expect(enabledVoices[0].oscillator.stoppedAt).toBe(10.35);

    manager.setTrack(makeTrack("music.queued"), { fadeIn: 0 });
    expect(manager.currentTrackId).toBe("music.queued");
    expect(manager.isPlaying).toBe(false);

    manager.setEnabled(true);
    expect(manager.isEnabled).toBe(true);
    expect(manager.currentTrackId).toBe("music.queued");
    expect(manager.activeVoices).toHaveLength(2);
  });

  it("updates one-shot cues off the active layer after their authored duration", () => {
    const ctx = new FakeAudioContext();
    const manager = new MusicManager({ audioContext: ctx, autoUnlock: false });

    manager.setTrack({
      ...makeTrack("music.sting"),
      loop: false,
      durationSeconds: 1,
      releaseSeconds: 0.2
    }, { fadeIn: 0 });
    const voices = manager.activeVoices;

    ctx.currentTime = 11.1;
    manager.update();

    expect(manager.currentTrackId).toBeNull();
    expect(manager.activeVoices).toEqual([]);
    expect(manager.fadingVoices).toEqual(voices);
    expect(voices[0].oscillator.stoppedAt).toBeCloseTo(11.3);
  });

  it("is safe when AudioContext is unavailable", () => {
    const manager = new MusicManager({
      AudioContextClass: null,
      window: null,
      document: null,
      autoUnlock: false
    });

    expect(() => manager.setTrack(makeTrack())).not.toThrow();
    expect(manager.currentTrackId).toBe("music.test");
    expect(manager.isPlaying).toBe(false);
    expect(manager.activeVoices).toEqual([]);

    expect(() => manager.stop()).not.toThrow();
    expect(() => manager.dispose()).not.toThrow();
  });

  it("resumes suspended contexts on setTrack and browser unlock", () => {
    const documentRef = makeEventTarget();
    const ctx = new FakeAudioContext({ state: "suspended" });
    const manager = new MusicManager({ audioContext: ctx, document: documentRef, window: null });

    expect(documentRef.addEventListener).toHaveBeenCalledWith("pointerdown", manager.unlock, { once: true });
    expect(documentRef.addEventListener).toHaveBeenCalledWith("keydown", manager.unlock, { once: true });

    manager.setTrack(makeTrack(), { fadeIn: 0 });
    expect(ctx.resume).toHaveBeenCalledTimes(1);

    ctx.state = "suspended";
    documentRef.dispatch("pointerdown");
    expect(manager.isUnlocked).toBe(true);
    expect(ctx.resume).toHaveBeenCalledTimes(2);
  });

  it("disposes active voices, closes the context, and removes unlock listeners", () => {
    const documentRef = makeEventTarget();
    const ctx = new FakeAudioContext();
    const manager = new MusicManager({ audioContext: ctx, document: documentRef, window: null });

    manager.setTrack(makeTrack(), { fadeIn: 0 });
    const voices = manager.activeVoices;
    manager.dispose();

    expect(manager.isDisposed).toBe(true);
    expect(manager.activeVoices).toEqual([]);
    expect(manager.fadingVoices).toEqual([]);
    expect(voices[0].oscillator.stoppedAt).toBe(10);
    expect(ctx.close).toHaveBeenCalledTimes(1);
    expect(documentRef.removeEventListener).toHaveBeenCalledWith("pointerdown", manager.unlock);
    expect(documentRef.removeEventListener).toHaveBeenCalledWith("keydown", manager.unlock);
  });
});

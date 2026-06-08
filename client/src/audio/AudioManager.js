import {
  emitCombatFeedback,
  subscribeCombatFeedback
} from "../gameplay/combat/CombatFeedbackSignals.js";

function getGlobalValue(name) {
  if (typeof globalThis === "undefined") {
    return undefined;
  }

  return globalThis[name];
}

/**
 * AudioManager - procedural Hearthmere sound design.
 *
 * The game ships without external SFX files, so every cue is built from Web
 * Audio primitives: pitched oscillators, shaped noise, filtering, stereo
 * placement, and tight envelopes. The public API remains intentionally small
 * because main.js drives sound from gameplay events.
 */
export class AudioManager {
  constructor(options = {}) {
    this.windowRef = options.window ?? (typeof window !== "undefined" ? window : null);
    this.performanceRef =
      options.performance ??
      this.windowRef?.performance ??
      getGlobalValue("performance") ??
      null;
    this.AudioContextClass =
      options.AudioContextClass ??
      options.AudioContext ??
      this.windowRef?.AudioContext ??
      this.windowRef?.webkitAudioContext ??
      getGlobalValue("AudioContext") ??
      getGlobalValue("webkitAudioContext") ??
      null;

    this.ctx = options.audioContext ?? null;
    this.masterGain = null;
    this.masterVolume = options.masterVolume ?? 0.65;
    this.enabled = options.enabled ?? true;
    this.isDisposed = false;
    this.active = new Set();
    this.cleanupByNode = new Map();
    this.noiseBuffer = null;
    this.variationIndex = new Map();
    this.lastPlayAtMs = new Map();
    this.unlockEvents = [];
    this.resumeCtx = () => {
      const ctx = this.getCtx();
      if (ctx?.state === "suspended" && typeof ctx.resume === "function") {
        void ctx.resume();
      }
    };

    if (options.autoUnlock !== false && this.windowRef?.addEventListener) {
      this.windowRef.addEventListener("pointerdown", this.resumeCtx, { once: true });
      this.windowRef.addEventListener("keydown", this.resumeCtx, { once: true });
      this.unlockEvents.push("pointerdown", "keydown");
    }

    this.unsubscribeFeedback =
      options.subscribeToFeedback === false
        ? () => undefined
        : subscribeCombatFeedback((signal) => {
            this.onCombatFeedback(signal);
          });
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this.stopAll();
    }
  }

  setMasterVolume(value) {
    this.masterVolume = Math.max(0, Math.min(1, value));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  play(id) {
    if (id === "dodge") {
      emitCombatFeedback({
        type: "dodge",
        intensity: 0.95
      });
    }

    if (!this.enabled || this.isDisposed) {
      return;
    }

    const ctx = this.getCtx();
    if (!this.canUseContext(ctx)) {
      return;
    }

    if (!this.canPlay(id, this.getCooldownMs(id))) {
      return;
    }

    switch (id) {
      case "swing":
        this.playSwing(ctx);
        break;
      case "hit":
        this.playHit(ctx);
        break;
      case "dodge":
        this.playDodge(ctx);
        break;
      case "hearthlight":
        this.playHearthlight(ctx);
        break;
      case "unmade":
        this.playUnmade(ctx);
        break;
      case "bossHit":
        this.playBossHit(ctx);
        break;
      case "bossPhase":
        this.playBossPhase(ctx);
        break;
      case "bossDefeat":
        this.playBossDefeat(ctx);
        break;
      case "embers":
        this.playEmbers(ctx);
        break;
      case "uiSelect":
        this.playUiSelect(ctx);
        break;
      default:
        break;
    }
  }

  stopAll() {
    for (const node of [...this.active]) {
      try {
        node.stop(this.ctx?.currentTime ?? 0);
      } catch {
        // The node may already have been stopped by its scheduled envelope.
      }
      this.releaseNode(node);
    }
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }

    this.stopAll();
    this.active.clear();
    this.cleanupByNode.clear();
    this.noiseBuffer = null;
    this.masterGain = null;

    if (this.ctx && typeof this.ctx.close === "function") {
      void this.ctx.close();
    }
    this.ctx = null;
    this.isDisposed = true;

    if (typeof this.unsubscribeFeedback === "function") {
      this.unsubscribeFeedback();
    }

    if (this.windowRef?.removeEventListener) {
      for (const eventName of this.unlockEvents) {
        this.windowRef.removeEventListener(eventName, this.resumeCtx);
      }
    }
    this.unlockEvents = [];
  }

  getCtx() {
    if (this.isDisposed) {
      return null;
    }

    if (!this.ctx) {
      if (!this.AudioContextClass) {
        return null;
      }
      this.ctx = new this.AudioContextClass();
    }

    this.ensureMasterGain(this.ctx);
    return this.ctx;
  }

  ensureMasterGain(ctx) {
    if (this.masterGain || !ctx?.createGain) {
      return;
    }

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.masterGain.connect(ctx.destination);
  }

  onCombatFeedback(signal) {
    if (!this.enabled || this.isDisposed || !this.canUseContext(this.ctx)) {
      return;
    }

    switch (signal.type) {
      case "attack-start":
        if (!this.canPlay(`accent:${signal.attack}`, signal.attack === "heavy" ? 90 : 60)) {
          return;
        }
        this.playAttackAccent(this.ctx, signal.attack, signal.intensity);
        break;
      case "attack-hit":
        if (signal.attack === "heavy" || signal.killed) {
          if (!this.canPlay("impact-accent", 70)) {
            return;
          }
          this.playImpactAccent(this.ctx, signal.killed ? 1.1 : signal.intensity);
        }
        break;
      default:
        break;
    }
  }

  playSwing(ctx = this.getCtx()) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    const variant = this.nextVariant("swing");
    const baseFreq = [620, 690, 560][variant % 3] + this.randomBetween(-18, 22);
    const pan = [-0.18, 0.16, -0.07][variant % 3];

    this.playNoiseBurst(ctx, {
      delay: 0,
      decay: 0.12,
      volume: 0.07,
      filterType: "bandpass",
      filterFrequency: 1800 + variant * 120,
      endFilterFrequency: 920,
      q: 0.85,
      pan
    });
    this.playTone(ctx, {
      freq: baseFreq,
      endFreq: baseFreq * 0.38,
      decay: 0.105,
      volume: 0.09,
      type: variant % 2 === 0 ? "triangle" : "sawtooth",
      detune: this.randomBetween(-9, 9),
      pan
    });
    this.playTone(ctx, {
      freq: baseFreq * 2.05,
      endFreq: baseFreq * 0.92,
      decay: 0.07,
      volume: 0.025,
      type: "sine",
      delay: 0.008,
      pan: pan * -0.6
    });
  }

  playHit(ctx = this.getCtx()) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    const variant = this.nextVariant("hit");
    const body = 112 + variant * 10 + this.randomBetween(-5, 5);

    this.playTone(ctx, {
      freq: body,
      endFreq: 52,
      attack: 0.001,
      decay: 0.16,
      volume: 0.2,
      type: "triangle"
    });
    this.playNoiseBurst(ctx, {
      decay: 0.18,
      volume: 0.18,
      filterType: "lowpass",
      filterFrequency: 1180 + variant * 90,
      endFilterFrequency: 380,
      q: 0.95
    });
    this.playNoiseBurst(ctx, {
      delay: 0.006,
      decay: 0.075,
      volume: 0.055,
      filterType: "bandpass",
      filterFrequency: 3250 + variant * 150,
      q: 1.6,
      pan: this.randomBetween(-0.08, 0.08)
    });
    this.playTone(ctx, {
      freq: 760 + variant * 42,
      endFreq: 430,
      decay: 0.09,
      volume: 0.04,
      type: "square",
      detune: this.randomBetween(-8, 8)
    });
  }

  playDodge(ctx = this.getCtx()) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    const variant = this.nextVariant("dodge");
    const pan = variant % 2 === 0 ? -0.22 : 0.22;

    this.playNoiseBurst(ctx, {
      decay: 0.16,
      volume: 0.075,
      filterType: "highpass",
      filterFrequency: 620 + variant * 80,
      endFilterFrequency: 1300,
      q: 0.6,
      pan
    });
    this.playTone(ctx, {
      freq: 410 + variant * 22,
      endFreq: 245,
      decay: 0.09,
      volume: 0.065,
      type: "sine",
      detune: this.randomBetween(-10, 10),
      pan
    });
    this.playTone(ctx, {
      freq: 255,
      endFreq: 390,
      decay: 0.065,
      volume: 0.028,
      type: "triangle",
      delay: 0.018,
      pan: pan * -0.45
    });
  }

  playHearthlight(ctx = this.getCtx()) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    this.playNoiseBurst(ctx, {
      decay: 0.72,
      volume: 0.035,
      filterType: "lowpass",
      filterFrequency: 1150,
      endFilterFrequency: 680,
      q: 0.5
    });
    this.playTone(ctx, {
      freq: 220,
      endFreq: 196,
      attack: 0.018,
      decay: 0.56,
      volume: 0.16,
      type: "sine"
    });
    this.playTone(ctx, {
      freq: 330,
      endFreq: 294,
      attack: 0.018,
      decay: 0.52,
      volume: 0.11,
      type: "triangle",
      delay: 0.035,
      pan: -0.08
    });
    this.playTone(ctx, {
      freq: 440,
      endFreq: 392,
      attack: 0.016,
      decay: 0.48,
      volume: 0.06,
      type: "sine",
      delay: 0.07,
      pan: 0.1
    });
    this.playTone(ctx, {
      freq: 880,
      endFreq: 660,
      attack: 0.006,
      decay: 0.18,
      volume: 0.025,
      type: "triangle",
      delay: 0.14,
      pan: 0.18
    });
  }

  playUnmade(ctx = this.getCtx()) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    this.playNoiseBurst(ctx, {
      decay: 0.82,
      volume: 0.12,
      filterType: "lowpass",
      filterFrequency: 310,
      endFilterFrequency: 95,
      q: 0.8
    });
    this.playTone(ctx, {
      freq: 76,
      endFreq: 39,
      attack: 0.006,
      decay: 0.72,
      volume: 0.24,
      type: "sawtooth",
      detune: -6
    });
    this.playTone(ctx, {
      freq: 113,
      endFreq: 54,
      attack: 0.01,
      decay: 0.58,
      volume: 0.09,
      type: "sine",
      detune: 5,
      delay: 0.025,
      pan: -0.1
    });
    this.playTone(ctx, {
      freq: 620,
      endFreq: 250,
      attack: 0.002,
      decay: 0.28,
      volume: 0.028,
      type: "triangle",
      delay: 0.04,
      pan: 0.12
    });
  }

  playBossHit(ctx = this.getCtx()) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    this.playTone(ctx, {
      freq: 92,
      endFreq: 43,
      decay: 0.2,
      volume: 0.24,
      type: "sawtooth"
    });
    this.playNoiseBurst(ctx, {
      decay: 0.24,
      volume: 0.22,
      filterType: "lowpass",
      filterFrequency: 760,
      endFilterFrequency: 260,
      q: 1.1
    });
    this.playNoiseBurst(ctx, {
      delay: 0.008,
      decay: 0.11,
      volume: 0.075,
      filterType: "bandpass",
      filterFrequency: 2400,
      q: 1.2,
      pan: -0.05
    });
    this.playTone(ctx, {
      freq: 184,
      endFreq: 78,
      decay: 0.24,
      volume: 0.075,
      type: "triangle",
      detune: -11,
      delay: 0.02
    });
  }

  playBossPhase(ctx = this.getCtx()) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    this.playNoiseBurst(ctx, {
      decay: 0.92,
      volume: 0.11,
      filterType: "bandpass",
      filterFrequency: 210,
      endFilterFrequency: 520,
      q: 0.9
    });
    this.playTone(ctx, {
      freq: 118,
      endFreq: 64,
      attack: 0.01,
      decay: 0.86,
      volume: 0.26,
      type: "sawtooth"
    });
    this.playTone(ctx, {
      freq: 235,
      endFreq: 141,
      attack: 0.012,
      decay: 0.62,
      volume: 0.08,
      type: "triangle",
      delay: 0.035,
      detune: -8,
      pan: -0.12
    });
    this.playTone(ctx, {
      freq: 350,
      endFreq: 210,
      attack: 0.012,
      decay: 0.5,
      volume: 0.045,
      type: "sine",
      delay: 0.07,
      detune: 11,
      pan: 0.12
    });
  }

  playBossDefeat(ctx = this.getCtx()) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    this.playNoiseBurst(ctx, {
      decay: 0.86,
      volume: 0.055,
      filterType: "highpass",
      filterFrequency: 760,
      endFilterFrequency: 1550,
      q: 0.55
    });
    this.playTone(ctx, {
      freq: 220,
      endFreq: 196,
      attack: 0.012,
      decay: 0.42,
      volume: 0.12,
      type: "sine"
    });
    this.playTone(ctx, {
      freq: 277,
      endFreq: 247,
      attack: 0.014,
      decay: 0.52,
      volume: 0.095,
      type: "triangle",
      delay: 0.08,
      pan: -0.08
    });
    this.playTone(ctx, {
      freq: 330,
      endFreq: 294,
      attack: 0.014,
      decay: 0.58,
      volume: 0.09,
      type: "sine",
      delay: 0.16,
      pan: 0.08
    });
    this.playTone(ctx, {
      freq: 440,
      endFreq: 392,
      attack: 0.012,
      decay: 0.64,
      volume: 0.07,
      type: "triangle",
      delay: 0.25,
      pan: 0.16
    });
  }

  playEmbers(ctx = this.getCtx()) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    const variant = this.nextVariant("embers");
    const base = [660, 740, 830][variant % 3];

    this.playNoiseBurst(ctx, {
      decay: 0.12,
      volume: 0.024,
      filterType: "highpass",
      filterFrequency: 1700,
      q: 0.6,
      pan: -0.1
    });
    for (let i = 0; i < 3; i += 1) {
      this.playTone(ctx, {
        freq: base + i * 110 + this.randomBetween(-12, 12),
        endFreq: base + i * 128 + 80,
        attack: 0.003,
        decay: 0.075 + i * 0.025,
        volume: 0.035 - i * 0.006,
        type: i % 2 === 0 ? "sine" : "triangle",
        delay: i * 0.024,
        pan: -0.12 + i * 0.12
      });
    }
  }

  playUiSelect(ctx = this.getCtx()) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    this.playTone(ctx, {
      freq: 510,
      endFreq: 660,
      attack: 0.001,
      decay: 0.048,
      volume: 0.052,
      type: "sine"
    });
    this.playTone(ctx, {
      freq: 1020,
      endFreq: 840,
      attack: 0.001,
      decay: 0.035,
      volume: 0.018,
      type: "triangle",
      delay: 0.008
    });
  }

  playAttackAccent(ctx = this.getCtx(), attack = "light", intensity = 1) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    const isHeavy = attack === "heavy";
    const force = this.clamp(intensity, 0, 1.25);

    this.playNoiseBurst(ctx, {
      decay: isHeavy ? 0.1 : 0.065,
      volume: (isHeavy ? 0.04 : 0.024) * force,
      filterType: "highpass",
      filterFrequency: isHeavy ? 680 : 1200,
      endFilterFrequency: isHeavy ? 980 : 1800,
      q: 0.7
    });
    this.playTone(ctx, {
      freq: isHeavy ? 230 : 330,
      endFreq: isHeavy ? 118 : 188,
      decay: isHeavy ? 0.105 : 0.062,
      volume: (isHeavy ? 0.075 : 0.045) * force,
      type: isHeavy ? "sawtooth" : "triangle",
      detune: isHeavy ? -4 : 3
    });
  }

  playImpactAccent(ctx = this.getCtx(), intensity = 1) {
    if (!this.canUseContext(ctx)) {
      return;
    }

    const force = this.clamp(intensity, 0, 1.25);

    this.playTone(ctx, {
      freq: 86,
      endFreq: 46,
      attack: 0.001,
      decay: 0.095,
      volume: 0.075 * force,
      type: "triangle"
    });
    this.playNoiseBurst(ctx, {
      delay: 0.004,
      decay: 0.07,
      volume: 0.035 * force,
      filterType: "lowpass",
      filterFrequency: 520,
      q: 0.8
    });
  }

  playTone(ctx, config) {
    if (!this.canSchedule(ctx)) {
      return null;
    }

    const startTime = ctx.currentTime + (config.delay ?? 0);
    const attack = config.attack ?? 0.003;
    const decay = Math.max(0.01, config.decay);
    const stopTime = startTime + decay + 0.03;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const chain = [osc, gain];
    const destination = this.connectVoiceChain(ctx, gain, config, chain);

    osc.type = config.type ?? "sine";
    this.setParam(osc.frequency, Math.max(20, config.freq), startTime);
    this.rampParam(osc.frequency, Math.max(20, config.endFreq ?? config.freq), startTime + decay, "exponential");

    if (config.detune !== undefined && osc.detune) {
      this.setParam(osc.detune, config.detune, startTime);
    }

    this.setParam(gain.gain, 0.0001, startTime);
    this.rampParam(gain.gain, Math.max(0.0001, config.volume), startTime + attack, "linear");
    this.rampParam(gain.gain, 0.0001, startTime + decay, "exponential");

    osc.connect(gain);
    destination.connect(this.masterGain);
    this.startNode(osc, startTime, stopTime, chain);
    return osc;
  }

  playNoiseBurst(ctx, config) {
    if (!this.canSchedule(ctx)) {
      return null;
    }

    const startTime = ctx.currentTime + (config.delay ?? 0);
    const decay = Math.max(0.012, config.decay);
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = config.filterType ?? "bandpass";
    this.setParam(filter.frequency, Math.max(20, config.filterFrequency), startTime);
    if (config.endFilterFrequency) {
      this.rampParam(filter.frequency, Math.max(20, config.endFilterFrequency), startTime + decay, "exponential");
    }
    this.setParam(filter.Q, config.q ?? 0.8, startTime);

    const gain = ctx.createGain();
    const chain = [src, filter, gain];
    const destination = this.connectVoiceChain(ctx, gain, config, chain);

    this.setParam(gain.gain, 0.0001, startTime);
    this.rampParam(gain.gain, Math.max(0.0001, config.volume), startTime + 0.004, "linear");
    this.rampParam(gain.gain, 0.0001, startTime + decay, "exponential");

    src.connect(filter);
    filter.connect(gain);
    destination.connect(this.masterGain);
    this.startNode(src, startTime, startTime + decay + 0.04, chain);
    return src;
  }

  connectVoiceChain(ctx, gain, config, chain) {
    if (typeof ctx.createStereoPanner !== "function" || config.pan === undefined) {
      return gain;
    }

    const panner = ctx.createStereoPanner();
    this.setParam(panner.pan, this.clamp(config.pan, -1, 1), ctx.currentTime + (config.delay ?? 0));
    gain.connect(panner);
    chain.push(panner);
    return panner;
  }

  startNode(node, startTime, stopTime, chain) {
    this.active.add(node);
    this.cleanupByNode.set(node, () => {
      for (const chainNode of chain) {
        if (typeof chainNode.disconnect === "function") {
          try {
            chainNode.disconnect();
          } catch {
            // Some Web Audio implementations throw if already disconnected.
          }
        }
      }
    });

    node.onended = () => {
      this.releaseNode(node);
    };
    node.start(startTime);
    node.stop(stopTime);
  }

  releaseNode(node) {
    const cleanup = this.cleanupByNode.get(node);
    this.active.delete(node);
    this.cleanupByNode.delete(node);
    if (cleanup) {
      cleanup();
    }
  }

  getNoiseBuffer(ctx) {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }

    const duration = 1.5;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;

    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.74 + white * 0.26;
      data[i] = this.clamp(previous + white * 0.32, -1, 1);
    }

    this.noiseBuffer = buffer;
    return buffer;
  }

  getCooldownMs(id) {
    switch (id) {
      case "swing":
        return 45;
      case "hit":
        return 35;
      case "dodge":
        return 65;
      case "hearthlight":
        return 180;
      case "unmade":
        return 600;
      case "bossHit":
        return 80;
      case "bossPhase":
        return 900;
      case "bossDefeat":
        return 1200;
      case "embers":
        return 90;
      case "uiSelect":
        return 30;
      default:
        return 0;
    }
  }

  canPlay(key, cooldownMs) {
    const now = this.now();
    const last = this.lastPlayAtMs.get(key) ?? -Infinity;
    if (now - last < cooldownMs) {
      return false;
    }

    this.lastPlayAtMs.set(key, now);
    return true;
  }

  canUseContext(ctx) {
    this.ensureMasterGain(ctx);

    return Boolean(
      this.enabled &&
        !this.isDisposed &&
        ctx &&
        ctx.state !== "suspended" &&
        this.masterGain
    );
  }

  canSchedule(ctx) {
    return Boolean(this.canUseContext(ctx) && typeof ctx.createGain === "function");
  }

  setParam(param, value, time) {
    if (!param) {
      return;
    }

    if (typeof param.setValueAtTime === "function") {
      param.setValueAtTime(value, time);
    } else {
      param.value = value;
    }
  }

  rampParam(param, value, time, type) {
    if (!param) {
      return;
    }

    if (type === "linear" && typeof param.linearRampToValueAtTime === "function") {
      param.linearRampToValueAtTime(value, time);
      return;
    }

    if (type === "exponential" && typeof param.exponentialRampToValueAtTime === "function") {
      param.exponentialRampToValueAtTime(Math.max(0.0001, value), time);
      return;
    }

    this.setParam(param, value, time);
  }

  nextVariant(key) {
    const current = this.variationIndex.get(key) ?? 0;
    this.variationIndex.set(key, current + 1);
    return current;
  }

  now() {
    if (this.performanceRef && typeof this.performanceRef.now === "function") {
      return this.performanceRef.now();
    }

    return Date.now();
  }

  randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}

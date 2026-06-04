import {
  emitCombatFeedback,
  subscribeCombatFeedback
} from "../gameplay/combat/CombatFeedbackSignals.js";

/**
 * AudioManager — Web Audio API manager for Realmforge.
 *
 * Manages a single AudioContext (must be resumed after first user gesture).
 * Exposes play(), stopAll(), setMasterVolume(), and dispose().
 *
 * Phase 4 greybox: all sounds are generated procedurally (oscillators +
 * noise) so the game has audio feel without external audio files.
 * Real SFX/music assets replace these in the Phase 4 art pass.
 *
 * No UIBus dependency — callers drive audio from game events in main.js.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.masterVolume = 0.65;
    this.active = new Set();
    this.noiseBuffer = null;
    this.variationIndex = new Map();
    this.lastPlayAtMs = new Map();
    this.resumeCtx = () => {
      void this.getCtx().resume();
    };

    window.addEventListener("pointerdown", this.resumeCtx, { once: true });
    window.addEventListener("keydown", this.resumeCtx, { once: true });

    this.unsubscribeFeedback = subscribeCombatFeedback((signal) => {
      this.onCombatFeedback(signal);
    });
  }

  setMasterVolume(value) {
    this.masterVolume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.getCtx().currentTime, 0.02);
    }
  }

  /** Play a procedural sound by id. */
  play(id) {
    if (id === "dodge") {
      emitCombatFeedback({
        type: "dodge",
        intensity: 0.95
      });
    }

    const ctx = this.getCtx();
    if (!ctx || ctx.state === "suspended") {
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

  dispose() {
    for (const node of this.active) {
      try {
        node.stop();
      } catch {
        // already stopped
      }
    }

    this.active.clear();
    void this.ctx?.close();
    this.ctx = null;
    this.noiseBuffer = null;
    this.unsubscribeFeedback();
    window.removeEventListener("pointerdown", this.resumeCtx);
    window.removeEventListener("keydown", this.resumeCtx);
  }

  getCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);
    }

    return this.ctx;
  }

  onCombatFeedback(signal) {
    if (!this.ctx || this.ctx.state === "suspended") {
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

  playSwing(ctx) {
    const variant = this.nextVariant("swing");
    const baseFreq = [520, 610, 470][variant % 3] + this.randomBetween(-24, 18);

    this.playNoiseBurst(ctx, {
      decay: 0.11,
      volume: 0.055,
      filterType: "bandpass",
      filterFrequency: 1500 + variant * 180,
      q: 0.7
    });
    this.playTone(ctx, {
      freq: baseFreq,
      endFreq: baseFreq * 0.44,
      decay: 0.095,
      volume: 0.085,
      type: variant % 2 === 0 ? "triangle" : "sawtooth",
      detune: this.randomBetween(-14, 14)
    });
    this.playTone(ctx, {
      freq: baseFreq * 1.8,
      endFreq: baseFreq * 0.95,
      decay: 0.07,
      volume: 0.026,
      type: "sine",
      detune: this.randomBetween(-8, 8)
    });
  }

  playHit(ctx) {
    const variant = this.nextVariant("hit");
    const impactFreq = 118 + variant * 12 + this.randomBetween(-6, 6);

    this.playNoiseBurst(ctx, {
      decay: 0.18,
      volume: 0.18,
      filterType: "lowpass",
      filterFrequency: 820 + variant * 110,
      q: 0.9
    });
    this.playTone(ctx, {
      freq: impactFreq,
      endFreq: 58,
      decay: 0.12,
      volume: 0.16,
      type: "triangle"
    });
    this.playTone(ctx, {
      freq: 760 + variant * 60,
      endFreq: 300,
      decay: 0.082,
      volume: 0.05,
      type: "square",
      detune: this.randomBetween(-10, 10)
    });
  }

  playDodge(ctx) {
    const variant = this.nextVariant("dodge");

    this.playNoiseBurst(ctx, {
      decay: 0.14,
      volume: 0.065,
      filterType: "highpass",
      filterFrequency: 520 + variant * 90,
      q: 0.6
    });
    this.playTone(ctx, {
      freq: 520 + variant * 28,
      endFreq: 260,
      decay: 0.09,
      volume: 0.075,
      type: "sine",
      detune: this.randomBetween(-12, 12)
    });
    this.playTone(ctx, {
      freq: 260,
      endFreq: 390,
      decay: 0.06,
      volume: 0.032,
      type: "triangle",
      delay: 0.01
    });
  }

  playHearthlight(ctx) {
    this.playTone(ctx, {
      freq: 220,
      endFreq: 180,
      decay: 0.42,
      volume: 0.2,
      type: "sine"
    });
    this.playTone(ctx, {
      freq: 330,
      endFreq: 248,
      decay: 0.36,
      volume: 0.12,
      type: "triangle",
      delay: 0.02
    });
    this.playTone(ctx, {
      freq: 440,
      endFreq: 330,
      decay: 0.28,
      volume: 0.045,
      type: "sine",
      delay: 0.05
    });
  }

  playUnmade(ctx) {
    this.playNoiseBurst(ctx, {
      decay: 0.55,
      volume: 0.1,
      filterType: "lowpass",
      filterFrequency: 140,
      q: 0.8
    });
    this.playTone(ctx, {
      freq: 78,
      endFreq: 44,
      decay: 0.62,
      volume: 0.24,
      type: "sawtooth",
      detune: -8
    });
    this.playTone(ctx, {
      freq: 116,
      endFreq: 56,
      decay: 0.5,
      volume: 0.09,
      type: "sine",
      detune: 4,
      delay: 0.03
    });
  }

  playBossHit(ctx) {
    this.playHit(ctx);
    this.playTone(ctx, {
      freq: 96,
      endFreq: 52,
      decay: 0.16,
      volume: 0.11,
      type: "sawtooth"
    });
  }

  playBossPhase(ctx) {
    this.playNoiseBurst(ctx, {
      decay: 0.45,
      volume: 0.08,
      filterType: "bandpass",
      filterFrequency: 220,
      q: 0.9
    });
    this.playTone(ctx, {
      freq: 130,
      endFreq: 72,
      decay: 0.72,
      volume: 0.26,
      type: "sawtooth"
    });
    this.playTone(ctx, {
      freq: 260,
      endFreq: 140,
      decay: 0.52,
      volume: 0.07,
      type: "triangle",
      delay: 0.03
    });
  }

  playBossDefeat(ctx) {
    this.playTone(ctx, {
      freq: 440,
      endFreq: 330,
      decay: 0.32,
      volume: 0.14,
      type: "sine"
    });
    this.playTone(ctx, {
      freq: 554,
      endFreq: 440,
      decay: 0.44,
      volume: 0.11,
      type: "triangle",
      delay: 0.06
    });
    this.playTone(ctx, {
      freq: 660,
      endFreq: 524,
      decay: 0.62,
      volume: 0.09,
      type: "sine",
      delay: 0.12
    });
  }

  playEmbers(ctx) {
    this.playTone(ctx, {
      freq: 660,
      endFreq: 760,
      decay: 0.11,
      volume: 0.055,
      type: "sine"
    });
    this.playTone(ctx, {
      freq: 880,
      endFreq: 980,
      decay: 0.09,
      volume: 0.036,
      type: "triangle",
      delay: 0.02
    });
  }

  playUiSelect(ctx) {
    this.playTone(ctx, {
      freq: 540,
      endFreq: 660,
      decay: 0.05,
      volume: 0.05,
      type: "sine"
    });
  }

  playAttackAccent(ctx, attack, intensity) {
    const freq = attack === "heavy" ? 220 : 320;

    this.playNoiseBurst(ctx, {
      decay: attack === "heavy" ? 0.09 : 0.06,
      volume: attack === "heavy" ? 0.03 : 0.02,
      filterType: "highpass",
      filterFrequency: attack === "heavy" ? 700 : 1100,
      q: 0.7
    });
    this.playTone(ctx, {
      freq,
      endFreq: attack === "heavy" ? 120 : 180,
      decay: attack === "heavy" ? 0.09 : 0.055,
      volume: (attack === "heavy" ? 0.06 : 0.04) * intensity,
      type: attack === "heavy" ? "sawtooth" : "triangle"
    });
  }

  playImpactAccent(ctx, intensity) {
    this.playTone(ctx, {
      freq: 84,
      endFreq: 48,
      decay: 0.085,
      volume: 0.06 * intensity,
      type: "triangle"
    });
  }

  playTone(ctx, config) {
    if (!this.masterGain) {
      return;
    }

    const startTime = ctx.currentTime + (config.delay ?? 0);
    const attack = config.attack ?? 0.002;
    const stopTime = startTime + config.decay + 0.02;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = config.type;
    osc.frequency.setValueAtTime(Math.max(20, config.freq), startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, config.endFreq), startTime + config.decay);

    if (config.detune !== undefined) {
      osc.detune.setValueAtTime(config.detune, startTime);
    }

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(config.volume, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + config.decay);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(stopTime);
    osc.onended = () => {
      this.active.delete(osc);
    };
    this.active.add(osc);
  }

  playNoiseBurst(ctx, config) {
    if (!this.masterGain) {
      return;
    }

    const startTime = ctx.currentTime + (config.delay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = config.filterType;
    filter.frequency.setValueAtTime(config.filterFrequency, startTime);
    filter.Q.setValueAtTime(config.q, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(config.volume, startTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + config.decay);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(startTime);
    src.stop(startTime + config.decay + 0.03);
    src.onended = () => {
      this.active.delete(src);
    };
    this.active.add(src);
  }

  getNoiseBuffer(ctx) {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }

    const duration = 1;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
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
    const now = performance.now();
    const last = this.lastPlayAtMs.get(key) ?? -Infinity;
    if (now - last < cooldownMs) {
      return false;
    }

    this.lastPlayAtMs.set(key, now);
    return true;
  }

  nextVariant(key) {
    const current = this.variationIndex.get(key) ?? 0;
    this.variationIndex.set(key, current + 1);
    return current;
  }

  randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }
}

const DEFAULT_MASTER_VOLUME = 0.55;
const DEFAULT_FADE_SECONDS = 0.75;
const DEFAULT_ATTACK_SECONDS = 0.08;
const DEFAULT_RELEASE_SECONDS = 0.4;
const SUPPORTED_OSCILLATOR_TYPES = new Set(["sine", "square", "sawtooth", "triangle"]);
const SUPPORTED_FILTER_TYPES = new Set([
  "lowpass",
  "highpass",
  "bandpass",
  "lowshelf",
  "highshelf",
  "peaking",
  "notch",
  "allpass"
]);

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function clamp(value, min, max, fallback) {
  const numericValue = Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, numericValue));
}

function clampNonNegative(value, fallback = 0) {
  return Math.max(0, Number.isFinite(value) ? value : fallback);
}

function clampFrequency(value) {
  return Math.max(20, Number.isFinite(value) ? value : 220);
}

function getGlobal(name) {
  return typeof globalThis !== "undefined" ? globalThis[name] : undefined;
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getParamValue(param, fallback) {
  return Number.isFinite(param?.value) ? param.value : fallback;
}

function setParamAtTime(param, value, time) {
  if (!param) return;
  if (typeof param.setValueAtTime === "function") {
    param.setValueAtTime(value, time);
  } else {
    param.value = value;
  }
}

function rampParamToTime(param, value, time) {
  if (!param) return;
  if (typeof param.linearRampToValueAtTime === "function") {
    param.linearRampToValueAtTime(value, time);
  } else {
    param.value = value;
  }
}

function cancelParam(param, time) {
  if (typeof param?.cancelScheduledValues === "function") {
    param.cancelScheduledValues(time);
  }
}

function disconnectNode(node) {
  try {
    if (typeof node?.disconnect === "function") {
      node.disconnect();
    }
  } catch {
    // Nodes can throw when disconnected twice or never connected.
  }
}

function stopNode(node, stopAt = 0) {
  try {
    if (typeof node?.stop === "function") {
      node.stop(stopAt);
    }
  } catch {
    // OscillatorNode throws when stop() is called twice.
  }
}

function normalizeOscillatorType(type) {
  return SUPPORTED_OSCILLATOR_TYPES.has(type) ? type : "sine";
}

function normalizeFilter(filter) {
  if (!filter || typeof filter !== "object") return null;

  return {
    type: SUPPORTED_FILTER_TYPES.has(filter.type) ? filter.type : "lowpass",
    frequency: clampFrequency(filter.frequency ?? filter.cutoff ?? 1200),
    q: clampNonNegative(filter.q ?? filter.Q, 0.0001),
    gain: Number.isFinite(filter.gain) ? filter.gain : 0,
    sweepTo: Number.isFinite(filter.sweepTo) ? clampFrequency(filter.sweepTo) : null,
    sweepSeconds: clampNonNegative(filter.sweepSeconds, 0)
  };
}

function normalizeModulation(modulation, defaults = {}) {
  if (!modulation || typeof modulation !== "object") return null;

  const rate = clampNonNegative(modulation.rate ?? modulation.frequency, defaults.rate ?? 0);
  const depth = clampNonNegative(modulation.depth ?? modulation.amount, defaults.depth ?? 0);
  if (rate <= 0 || depth <= 0) return null;

  return {
    rate,
    depth: Math.min(depth, defaults.maxDepth ?? depth),
    type: normalizeOscillatorType(modulation.type ?? defaults.type ?? "sine")
  };
}

function normalizeEnvelope(voice) {
  const envelope = voice.envelope && typeof voice.envelope === "object" ? voice.envelope : {};
  return {
    attack: clampNonNegative(voice.attack ?? envelope.attack, DEFAULT_ATTACK_SECONDS),
    release: clampNonNegative(voice.release ?? envelope.release, DEFAULT_RELEASE_SECONDS)
  };
}

function collectVoiceDefinitions(track) {
  if (Array.isArray(track.voices) && track.voices.length > 0) {
    return track.voices;
  }

  if (!Array.isArray(track.layers)) {
    return [];
  }

  return track.layers.flatMap((layer) => {
    if (!Array.isArray(layer?.voices)) return [];
    return layer.voices.map((voice) => ({
      ...voice,
      layer: voice.layer ?? layer.id ?? layer.name ?? layer.role,
      volume: voice.volume ?? voice.gain ?? layer.volume
    }));
  });
}

function normalizeVoice(voice, index) {
  const envelope = normalizeEnvelope(voice);
  const frequency = clampFrequency(voice.frequency ?? voice.freq ?? 220 + index * 55);
  const durationSeconds = Number.isFinite(voice.durationSeconds ?? voice.duration)
    ? Math.max(0.03, voice.durationSeconds ?? voice.duration)
    : null;

  return {
    ...voice,
    type: normalizeOscillatorType(voice.type ?? "sine"),
    frequency,
    detune: Number.isFinite(voice.detune) ? voice.detune : 0,
    volume: clamp01(voice.volume ?? voice.gain ?? 0.18),
    pan: clamp(voice.pan, -1, 1, 0),
    startOffset: clampNonNegative(voice.startOffset ?? voice.offset, 0),
    durationSeconds,
    attack: envelope.attack,
    release: envelope.release,
    filter: normalizeFilter(voice.filter),
    tremolo: normalizeModulation(voice.tremolo, { maxDepth: 0.75 }),
    vibrato: normalizeModulation(voice.vibrato, { maxDepth: 48 }),
    detuneDriftCents: Number.isFinite(voice.detuneDriftCents) ? voice.detuneDriftCents : 0
  };
}

function makeFallbackTrack(id) {
  const hash = hashString(id);
  const root = 110 + (hash % 6) * 18;

  return {
    id,
    title: "Fallback Hearthmere Tone",
    role: "fallback",
    volume: 0.5,
    loop: true,
    voices: [
      { type: "sine", frequency: root, volume: 0.18, filter: { frequency: 900 } },
      {
        type: "triangle",
        frequency: root * 1.5,
        volume: 0.1,
        detune: -4,
        tremolo: { rate: 0.07, depth: 0.018 }
      },
      {
        type: "sine",
        frequency: root * 2,
        volume: 0.065,
        detune: 6,
        vibrato: { rate: 0.04, depth: 4 }
      }
    ]
  };
}

/**
 * Procedural Web Audio music manager.
 *
 * Tracks are oscillator voice groups with optional filters, stereo placement,
 * envelopes, tremolo, and vibrato. They can be supplied directly or resolved
 * by id from an injected `tracks` object, Map, or resolver function.
 */
export class MusicManager {
  constructor(options = {}) {
    this.window = options.window ?? options.windowRef ?? getGlobal("window") ?? null;
    this.document = options.document ?? options.documentRef ?? getGlobal("document") ?? null;
    this.AudioContextClass =
      options.AudioContextClass ??
      options.AudioContext ??
      this.window?.AudioContext ??
      this.window?.webkitAudioContext ??
      getGlobal("AudioContext") ??
      null;
    this.ctx = options.audioContext ?? options.context ?? null;
    this.tracks = options.tracks ?? null;
    this.masterVolume = clamp01(options.masterVolume ?? options.volume ?? DEFAULT_MASTER_VOLUME);
    this.defaultFadeSeconds = Math.max(0, options.defaultFadeSeconds ?? DEFAULT_FADE_SECONDS);
    this.isEnabled = options.enabled !== false;
    this.enabled = this.isEnabled;

    this.masterGain = null;
    this.currentTrackId = null;
    this.currentTrack = null;
    this.currentTrackStartedAt = null;
    this.pendingTrack = null;
    this.activeVoices = [];
    this.fadingVoices = [];
    this.isPlaying = false;
    this.isDisposed = false;
    this.isUnlocked = false;
    this.lastSetTrackResult = null;

    this.unlock = this.unlock.bind(this);
    this.unlockTarget = this.document ?? this.window;

    if (options.autoUnlock !== false) {
      this.addUnlockListeners();
    }

    if (this.ctx) {
      this.ensureMasterGain();
    }
  }

  setEnabled(enabled) {
    if (this.isDisposed) return;

    const nextEnabled = enabled !== false;
    if (this.isEnabled === nextEnabled) return;

    this.isEnabled = nextEnabled;
    this.enabled = nextEnabled;

    if (!nextEnabled) {
      this.pendingTrack = this.currentTrack;
      this.stop({ fadeOut: Math.min(this.defaultFadeSeconds, 0.35) });
      return;
    }

    if (this.pendingTrack) {
      const track = this.pendingTrack;
      this.pendingTrack = null;
      this.setTrack(track, { fadeIn: this.defaultFadeSeconds, restart: true });
    }
  }

  setVolume(value) {
    this.setMasterVolume(value);
  }

  setTrack(trackDefinitionOrId, options = {}) {
    if (this.isDisposed || !trackDefinitionOrId) {
      return null;
    }

    const track = this.resolveTrack(trackDefinitionOrId);
    if (!track) {
      this.lastSetTrackResult = null;
      return null;
    }

    if (!this.isEnabled) {
      this.pendingTrack = track;
      this.currentTrackId = track.id;
      this.currentTrack = track;
      this.currentTrackStartedAt = null;
      this.activeVoices = [];
      this.isPlaying = false;
      this.lastSetTrackResult = null;
      return null;
    }

    if (this.currentTrackId === track.id && this.activeVoices.length > 0 && !options.restart) {
      this.currentTrack = track;
      this.lastSetTrackResult = this.activeVoices;
      return this.activeVoices;
    }

    const fadeOutSeconds = Math.max(0, options.fadeOut ?? options.crossfade ?? this.defaultFadeSeconds);
    const fadeInSeconds = Math.max(0, options.fadeIn ?? options.crossfade ?? this.defaultFadeSeconds);

    if (this.activeVoices.length > 0) {
      this.fadeOutVoiceGroup(this.activeVoices, fadeOutSeconds);
    }

    this.currentTrackId = track.id;
    this.currentTrack = track;

    const ctx = this.getCtx();
    if (!ctx || !this.ensureMasterGain()) {
      this.activeVoices = [];
      this.currentTrackStartedAt = null;
      this.isPlaying = false;
      this.lastSetTrackResult = null;
      return null;
    }

    this.tryResume();
    this.currentTrackStartedAt = ctx.currentTime ?? 0;
    this.activeVoices = this.startTrack(track, fadeInSeconds);
    this.isPlaying = this.activeVoices.length > 0;
    this.lastSetTrackResult = this.activeVoices;
    return this.activeVoices;
  }

  stop(options = {}) {
    const fadeOutSeconds =
      typeof options === "number"
        ? Math.max(0, options)
        : Math.max(0, options.fadeOut ?? options.fade ?? this.defaultFadeSeconds);

    if (this.activeVoices.length > 0) {
      this.fadeOutVoiceGroup(this.activeVoices, fadeOutSeconds);
    }

    this.activeVoices = [];
    this.currentTrackId = null;
    this.currentTrack = null;
    this.currentTrackStartedAt = null;
    this.isPlaying = false;
  }

  fadeOut(fadeOutSeconds = this.defaultFadeSeconds) {
    this.stop({ fadeOut: fadeOutSeconds });
  }

  setMasterVolume(value) {
    this.masterVolume = clamp01(value);
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime ?? 0;
      cancelParam(this.masterGain.gain, now);
      setParamAtTime(this.masterGain.gain, getParamValue(this.masterGain.gain, this.masterVolume), now);
      rampParamToTime(this.masterGain.gain, this.masterVolume, now + 0.03);
    }
  }

  update() {
    if (!this.currentTrack || this.currentTrackStartedAt === null || this.activeVoices.length === 0) {
      return;
    }

    const durationSeconds = this.currentTrack.durationSeconds;
    if (this.currentTrack.loop !== false || !Number.isFinite(durationSeconds)) {
      return;
    }

    const now = this.ctx?.currentTime ?? 0;
    if (now - this.currentTrackStartedAt >= durationSeconds) {
      this.stop({ fadeOut: this.currentTrack.releaseSeconds ?? this.defaultFadeSeconds });
    }
  }

  dispose() {
    if (this.isDisposed) return;

    this.removeUnlockListeners();
    this.stopAllVoiceGroups();
    this.activeVoices = [];
    this.fadingVoices = [];
    this.currentTrackId = null;
    this.currentTrack = null;
    this.currentTrackStartedAt = null;
    this.pendingTrack = null;
    this.isPlaying = false;
    this.isDisposed = true;

    if (typeof this.ctx?.close === "function") {
      void this.ctx.close();
    }
  }

  unlock() {
    if (this.isDisposed) return;
    this.isUnlocked = true;
    this.tryResume();
  }

  addUnlockListeners() {
    if (!this.unlockTarget?.addEventListener) return;
    this.unlockTarget.addEventListener("pointerdown", this.unlock, { once: true });
    this.unlockTarget.addEventListener("keydown", this.unlock, { once: true });
  }

  removeUnlockListeners() {
    if (!this.unlockTarget?.removeEventListener) return;
    this.unlockTarget.removeEventListener("pointerdown", this.unlock);
    this.unlockTarget.removeEventListener("keydown", this.unlock);
  }

  getCtx() {
    if (this.ctx) {
      return this.ctx;
    }

    if (!this.AudioContextClass) {
      return null;
    }

    try {
      this.ctx = new this.AudioContextClass();
      this.ensureMasterGain();
      return this.ctx;
    } catch {
      this.ctx = null;
      return null;
    }
  }

  ensureMasterGain() {
    if (this.masterGain) {
      return this.masterGain;
    }

    if (!this.ctx?.createGain) {
      return null;
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.masterVolume;
    if (typeof this.masterGain.connect === "function" && this.ctx.destination) {
      this.masterGain.connect(this.ctx.destination);
    }
    return this.masterGain;
  }

  tryResume() {
    const ctx = this.getCtx();
    if (!ctx || ctx.state !== "suspended" || typeof ctx.resume !== "function") {
      return;
    }

    void ctx.resume();
  }

  resolveTrack(trackDefinitionOrId) {
    if (typeof trackDefinitionOrId === "object") {
      return this.normalizeTrack(trackDefinitionOrId);
    }

    const id = String(trackDefinitionOrId);
    const registered = this.lookupTrack(id);
    return this.normalizeTrack(registered ?? makeFallbackTrack(id));
  }

  lookupTrack(id) {
    if (!this.tracks) return null;
    if (typeof this.tracks === "function") return this.tracks(id);
    if (this.tracks instanceof Map) return this.tracks.get(id);
    return this.tracks[id] ?? null;
  }

  normalizeTrack(track) {
    if (!track) return null;

    const id = track.id ?? track.trackId ?? track.name;
    if (!id) return null;

    const sourceVoices = collectVoiceDefinitions(track);
    const voices = sourceVoices.length > 0
      ? sourceVoices
      : makeFallbackTrack(String(id)).voices;

    return {
      ...track,
      id: String(id),
      volume: clamp01(track.volume ?? 0.5),
      releaseSeconds: clampNonNegative(track.releaseSeconds, this.defaultFadeSeconds),
      durationSeconds: Number.isFinite(track.durationSeconds)
        ? Math.max(0.03, track.durationSeconds)
        : null,
      voices: voices.map((voice, index) => normalizeVoice(voice, index))
    };
  }

  startTrack(track, fadeInSeconds) {
    const ctx = this.getCtx();
    const masterGain = this.ensureMasterGain();
    if (!ctx || !masterGain) {
      return [];
    }

    const now = ctx.currentTime ?? 0;
    const trackGain = ctx.createGain();
    const targetVolume = track.volume;
    trackGain.gain.value = fadeInSeconds > 0 ? 0 : targetVolume;
    setParamAtTime(trackGain.gain, fadeInSeconds > 0 ? 0 : targetVolume, now);
    if (fadeInSeconds > 0) {
      rampParamToTime(trackGain.gain, targetVolume, now + fadeInSeconds);
    }
    trackGain.connect(masterGain);

    return track.voices.map((voiceDefinition) => (
      this.startVoice(track, voiceDefinition, trackGain, now)
    ));
  }

  startVoice(track, voiceDefinition, trackGain, now) {
    const ctx = this.getCtx();
    const oscillator = ctx.createOscillator();
    const voiceGain = ctx.createGain();
    const startAt = now + voiceDefinition.startOffset;
    const nodes = [oscillator, voiceGain];
    const modulators = [];

    oscillator.type = voiceDefinition.type;
    setParamAtTime(oscillator.frequency, voiceDefinition.frequency, startAt);
    setParamAtTime(oscillator.detune, voiceDefinition.detune, startAt);

    let previousNode = oscillator;
    let filter = null;
    if (voiceDefinition.filter && typeof ctx.createBiquadFilter === "function") {
      filter = ctx.createBiquadFilter();
      filter.type = voiceDefinition.filter.type;
      setParamAtTime(filter.frequency, voiceDefinition.filter.frequency, startAt);
      setParamAtTime(filter.Q, voiceDefinition.filter.q, startAt);
      setParamAtTime(filter.gain, voiceDefinition.filter.gain, startAt);
      if (voiceDefinition.filter.sweepTo && voiceDefinition.filter.sweepSeconds > 0) {
        rampParamToTime(filter.frequency, voiceDefinition.filter.sweepTo, startAt + voiceDefinition.filter.sweepSeconds);
      }
      previousNode.connect(filter);
      previousNode = filter;
      nodes.push(filter);
    }

    previousNode.connect(voiceGain);

    let outputNode = voiceGain;
    if (voiceDefinition.pan !== 0 && typeof ctx.createStereoPanner === "function") {
      const panner = ctx.createStereoPanner();
      setParamAtTime(panner.pan, voiceDefinition.pan, startAt);
      voiceGain.connect(panner);
      outputNode = panner;
      nodes.push(panner);
    }
    outputNode.connect(trackGain);

    this.applyGainEnvelope(voiceGain.gain, voiceDefinition, startAt);
    this.applyVoiceModulation(ctx, voiceDefinition, oscillator, voiceGain, startAt, modulators);

    if (voiceDefinition.detuneDriftCents !== 0) {
      rampParamToTime(
        oscillator.detune,
        voiceDefinition.detune + voiceDefinition.detuneDriftCents,
        startAt + Math.max(6, track.cycleSeconds ?? 12)
      );
    }

    oscillator.start(startAt);
    for (const modulator of modulators) {
      modulator.oscillator.start(startAt);
    }

    const voice = {
      trackId: track.id,
      oscillator,
      gain: voiceGain,
      filter,
      trackGain,
      nodes,
      modulators,
      definition: voiceDefinition,
      startedAt: startAt,
      stopAt: null,
      cleanup: null
    };

    if (voiceDefinition.durationSeconds) {
      const stopAt = startAt + voiceDefinition.durationSeconds + voiceDefinition.release;
      this.stopVoice(voice, stopAt);
    }

    return voice;
  }

  applyGainEnvelope(gainParam, voiceDefinition, startAt) {
    const targetVolume = voiceDefinition.volume;
    const attack = voiceDefinition.attack;

    if (attack > 0) {
      gainParam.value = 0;
      setParamAtTime(gainParam, 0, startAt);
      rampParamToTime(gainParam, targetVolume, startAt + attack);
      return;
    }

    gainParam.value = targetVolume;
    setParamAtTime(gainParam, targetVolume, startAt);
  }

  applyVoiceModulation(ctx, voiceDefinition, oscillator, voiceGain, startAt, modulators) {
    if (voiceDefinition.tremolo) {
      const lfo = ctx.createOscillator();
      const amount = ctx.createGain();
      lfo.type = voiceDefinition.tremolo.type;
      setParamAtTime(lfo.frequency, voiceDefinition.tremolo.rate, startAt);
      setParamAtTime(amount.gain, voiceDefinition.volume * voiceDefinition.tremolo.depth, startAt);
      lfo.connect(amount);
      amount.connect(voiceGain.gain);
      modulators.push({ oscillator: lfo, amount });
    }

    if (voiceDefinition.vibrato) {
      const lfo = ctx.createOscillator();
      const amount = ctx.createGain();
      lfo.type = voiceDefinition.vibrato.type;
      setParamAtTime(lfo.frequency, voiceDefinition.vibrato.rate, startAt);
      setParamAtTime(amount.gain, voiceDefinition.vibrato.depth, startAt);
      lfo.connect(amount);
      amount.connect(oscillator.detune);
      modulators.push({ oscillator: lfo, amount });
    }
  }

  fadeOutVoiceGroup(voices, fadeOutSeconds) {
    if (voices.length === 0) return;

    const ctx = this.getCtx();
    const now = ctx?.currentTime ?? 0;
    const stopAt = now + fadeOutSeconds;
    const uniqueTrackGains = new Set(voices.map((voice) => voice.trackGain).filter(Boolean));
    const voiceSet = new Set(voices);
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      this.fadingVoices = this.fadingVoices.filter((voice) => !voiceSet.has(voice));

      for (const voice of voices) {
        if (voice.oscillator) {
          voice.oscillator.onended = null;
        }
        for (const modulator of voice.modulators ?? []) {
          stopNode(modulator.oscillator, stopAt);
          disconnectNode(modulator.oscillator);
          disconnectNode(modulator.amount);
        }
        for (const node of voice.nodes ?? [voice.oscillator, voice.gain]) {
          disconnectNode(node);
        }
      }

      for (const trackGain of uniqueTrackGains) {
        disconnectNode(trackGain);
      }
    };

    for (const trackGain of uniqueTrackGains) {
      cancelParam(trackGain.gain, now);
      setParamAtTime(trackGain.gain, getParamValue(trackGain.gain, 0), now);
      rampParamToTime(trackGain.gain, 0, stopAt);
    }

    for (const voice of voices) {
      voice.stopAt = stopAt;
      voice.cleanup = cleanup;
      if (voice.oscillator) {
        voice.oscillator.onended = cleanup;
      }
      this.stopVoice(voice, stopAt);
      this.fadingVoices.push(voice);
    }
  }

  stopVoice(voice, stopAt = 0) {
    const release = voice.definition?.release ?? DEFAULT_RELEASE_SECONDS;
    const releaseStart = Math.max(0, stopAt - release);
    if (voice.gain?.gain) {
      cancelParam(voice.gain.gain, releaseStart);
      setParamAtTime(voice.gain.gain, getParamValue(voice.gain.gain, 0), releaseStart);
      rampParamToTime(voice.gain.gain, 0, stopAt);
    }

    stopNode(voice.oscillator, stopAt);
    for (const modulator of voice.modulators ?? []) {
      stopNode(modulator.oscillator, stopAt);
    }
  }

  stopAllVoiceGroups() {
    const voices = [...this.activeVoices, ...this.fadingVoices];
    for (const voice of voices) {
      this.stopVoice(voice, this.ctx?.currentTime ?? 0);
    }
  }
}

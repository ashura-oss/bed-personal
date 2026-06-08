import { AppMode } from "../core/AppMode.js";
import { BIOME_DEFINITIONS, STARTER_BIOME } from "../world/biomes/BiomeDefinitions.js";

export const MUSIC_TRACK_IDS = Object.freeze({
  HearthmereAmbient: "hearthmere_ambient",
  CombatAmbient: "combat_ambient",
  BossIntro: "boss_intro",
  BossPhase1: "boss_phase1",
  BossPhase2: "boss_phase2",
  BossPhase3: "boss_phase3",
  BossVictory: "boss_victory",
  HearthlightRest: "hearthlight_rest",
  CutsceneAmbient: "cutscene_ambient",
  UnmadeSting: "unmade_sting"
});

export const DEFAULT_MUSIC_TRACK_ID = MUSIC_TRACK_IDS.HearthmereAmbient;

const NOTE = Object.freeze({
  C2: 65.41,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98,
  A2: 110,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196,
  A3: 220,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25
});

function voice(definition) {
  return Object.freeze({
    type: "sine",
    volume: 0.1,
    attack: 0.12,
    release: 0.6,
    pan: 0,
    ...definition
  });
}

function lowpass(frequency, q = 0.7, extra = {}) {
  return Object.freeze({ type: "lowpass", frequency, q, ...extra });
}

function bandpass(frequency, q = 1.2, extra = {}) {
  return Object.freeze({ type: "bandpass", frequency, q, ...extra });
}

function makeBiomeVoices({
  root,
  fifth,
  octave,
  color,
  shimmer,
  shadow,
  leadType = "sine",
  rootType = "triangle",
  filter = 1200
}) {
  return Object.freeze([
    voice({
      layer: "ground",
      type: rootType,
      frequency: root,
      volume: 0.135,
      attack: 1.8,
      release: 1.4,
      pan: -0.18,
      filter: lowpass(filter, 0.65),
      tremolo: { rate: 0.055, depth: 0.08 },
      detuneDriftCents: -3
    }),
    voice({
      layer: "breath",
      type: "sine",
      frequency: fifth,
      volume: 0.076,
      attack: 2.4,
      release: 1.6,
      pan: 0.22,
      filter: lowpass(filter * 1.2, 0.5),
      vibrato: { rate: 0.06, depth: 5 }
    }),
    voice({
      layer: "harmony",
      type: "triangle",
      frequency: octave,
      volume: 0.058,
      attack: 1.2,
      release: 1.1,
      pan: 0.04,
      filter: bandpass(filter * 0.82, 0.9),
      tremolo: { rate: 0.09, depth: 0.06 }
    }),
    voice({
      layer: "color",
      type: leadType,
      frequency: color,
      volume: 0.04,
      attack: 2.8,
      release: 1.8,
      pan: -0.36,
      filter: lowpass(filter * 1.7, 0.45),
      vibrato: { rate: 0.11, depth: 7 },
      detune: -4
    }),
    voice({
      layer: "shimmer",
      type: "sine",
      frequency: shimmer,
      volume: 0.027,
      attack: 3.2,
      release: 1.2,
      pan: 0.42,
      filter: bandpass(filter * 1.35, 1.1),
      tremolo: { rate: 0.14, depth: 0.12 },
      vibrato: { rate: 0.08, depth: 6 },
      detune: 5
    }),
    voice({
      layer: "shadow",
      type: "sine",
      frequency: shadow,
      volume: 0.026,
      attack: 1.6,
      release: 1.4,
      pan: 0,
      filter: lowpass(filter * 0.72, 0.8),
      tremolo: { rate: 0.035, depth: 0.16 },
      detuneDriftCents: 4
    })
  ]);
}

const BIOME_SCORE_PALETTES = Object.freeze({
  hearthmere: makeBiomeVoices({
    root: NOTE.A2,
    fifth: NOTE.E3,
    octave: NOTE.A3,
    color: NOTE.C4,
    shimmer: NOTE.E4,
    shadow: NOTE.D2,
    filter: 1080
  }),
  ironvale: makeBiomeVoices({
    root: NOTE.G2,
    fifth: NOTE.D3,
    octave: NOTE.G3,
    color: NOTE.B3,
    shimmer: NOTE.D4,
    shadow: NOTE.E2,
    rootType: "sawtooth",
    leadType: "triangle",
    filter: 940
  }),
  blackroot: makeBiomeVoices({
    root: NOTE.E2,
    fifth: NOTE.B2,
    octave: NOTE.E3,
    color: NOTE.G3,
    shimmer: NOTE.B3,
    shadow: NOTE.C2,
    filter: 760
  }),
  sunken_temple: makeBiomeVoices({
    root: NOTE.D2,
    fifth: NOTE.A2,
    octave: NOTE.D3,
    color: NOTE.F3,
    shimmer: NOTE.A3,
    shadow: NOTE.C2,
    filter: 680
  }),
  dragon_coast: makeBiomeVoices({
    root: NOTE.B2,
    fifth: NOTE.F3,
    octave: NOTE.B3,
    color: NOTE.D4,
    shimmer: NOTE.F4,
    shadow: NOTE.G2,
    rootType: "triangle",
    leadType: "sawtooth",
    filter: 1320
  }),
  moonspire: makeBiomeVoices({
    root: NOTE.C3,
    fifth: NOTE.G3,
    octave: NOTE.C4,
    color: NOTE.E4,
    shimmer: NOTE.G4,
    shadow: NOTE.F2,
    filter: 1540
  }),
  gravehold: makeBiomeVoices({
    root: NOTE.C2,
    fifth: NOTE.G2,
    octave: NOTE.C3,
    color: NOTE.E3,
    shimmer: NOTE.G3,
    shadow: NOTE.F2,
    filter: 620
  }),
  ashen_wastes: makeBiomeVoices({
    root: NOTE.F2,
    fifth: NOTE.C3,
    octave: NOTE.F3,
    color: NOTE.A3,
    shimmer: NOTE.C4,
    shadow: NOTE.D2,
    rootType: "sawtooth",
    filter: 880
  })
});

const SPECIAL_TRACK_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: MUSIC_TRACK_IDS.CombatAmbient,
    title: "Ashfall Road - Blades Under Smoke",
    role: "combat",
    keyCenter: "E minor",
    tempo: 92,
    texture: "low pulse, close strings, ember harmonics",
    volume: 0.46,
    cycleSeconds: 8,
    loop: true,
    voices: Object.freeze([
      voice({
        layer: "pulse",
        type: "triangle",
        frequency: NOTE.E2,
        volume: 0.16,
        attack: 0.08,
        release: 0.5,
        pan: -0.08,
        filter: lowpass(720, 0.9),
        tremolo: { rate: 2.3, depth: 0.18 }
      }),
      voice({
        layer: "blade",
        type: "sawtooth",
        frequency: NOTE.B2,
        volume: 0.064,
        attack: 0.04,
        release: 0.35,
        pan: 0.18,
        filter: bandpass(520, 1.8, { sweepTo: 680, sweepSeconds: 5 }),
        tremolo: { rate: 4.6, depth: 0.12 },
        detune: -5
      }),
      voice({
        layer: "tension",
        type: "triangle",
        frequency: NOTE.E3,
        volume: 0.068,
        attack: 0.55,
        release: 0.8,
        pan: -0.26,
        filter: lowpass(1050, 0.65),
        vibrato: { rate: 0.18, depth: 8 }
      }),
      voice({
        layer: "cinder",
        type: "sine",
        frequency: NOTE.G3,
        volume: 0.044,
        attack: 0.9,
        release: 0.7,
        pan: 0.34,
        filter: bandpass(1250, 1.1),
        tremolo: { rate: 0.31, depth: 0.2 }
      }),
      voice({
        layer: "edge",
        type: "sine",
        frequency: NOTE.D4,
        volume: 0.024,
        attack: 1.4,
        release: 0.6,
        pan: 0.02,
        filter: bandpass(1780, 1.5),
        vibrato: { rate: 0.22, depth: 12 },
        detune: 7
      })
    ])
  }),
  Object.freeze({
    id: MUSIC_TRACK_IDS.BossIntro,
    title: "The Guard Wakes",
    role: "boss",
    phase: "intro",
    keyCenter: "D Phrygian",
    tempo: 64,
    texture: "single reveal swell with iron overtone",
    volume: 0.62,
    loop: false,
    durationSeconds: 2.2,
    releaseSeconds: 0.45,
    voices: Object.freeze([
      voice({
        layer: "impact",
        type: "sawtooth",
        frequency: NOTE.D2,
        volume: 0.19,
        attack: 0.02,
        release: 0.5,
        durationSeconds: 1.8,
        filter: lowpass(620, 1.1, { sweepTo: 420, sweepSeconds: 1.6 }),
        tremolo: { rate: 0.8, depth: 0.18 }
      }),
      voice({
        layer: "warning",
        type: "triangle",
        frequency: NOTE.A2,
        volume: 0.12,
        attack: 0.16,
        release: 0.45,
        durationSeconds: 2,
        pan: -0.2,
        filter: bandpass(860, 1.2),
        vibrato: { rate: 0.3, depth: 14 }
      }),
      voice({
        layer: "glare",
        type: "sine",
        frequency: NOTE.F3,
        volume: 0.06,
        attack: 0.3,
        release: 0.5,
        durationSeconds: 1.6,
        pan: 0.28,
        filter: bandpass(1540, 1.4),
        detune: 9
      })
    ])
  }),
  Object.freeze({
    id: MUSIC_TRACK_IDS.BossPhase1,
    title: "Caravan Guard - First Oath",
    role: "boss",
    phase: 1,
    keyCenter: "D Phrygian",
    tempo: 88,
    texture: "measured war drum without samples",
    volume: 0.52,
    cycleSeconds: 7,
    loop: true,
    voices: Object.freeze([
      voice({ layer: "root", type: "triangle", frequency: NOTE.D2, volume: 0.17, attack: 0.08, filter: lowpass(660), tremolo: { rate: 1.45, depth: 0.16 } }),
      voice({ layer: "fifth", type: "sawtooth", frequency: NOTE.A2, volume: 0.082, attack: 0.18, pan: -0.12, filter: bandpass(540, 1.25), detune: -4 }),
      voice({ layer: "minor", type: "sine", frequency: NOTE.F3, volume: 0.052, attack: 0.8, pan: 0.2, filter: lowpass(900), vibrato: { rate: 0.16, depth: 7 } }),
      voice({ layer: "ring", type: "triangle", frequency: NOTE.D3, volume: 0.055, attack: 0.5, pan: 0.32, filter: bandpass(1100, 1.1), tremolo: { rate: 0.42, depth: 0.14 } })
    ])
  }),
  Object.freeze({
    id: MUSIC_TRACK_IDS.BossPhase2,
    title: "Caravan Guard - Broken Axle",
    role: "boss",
    phase: 2,
    keyCenter: "E locrian",
    tempo: 104,
    texture: "faster pulse, strained harmonics",
    volume: 0.57,
    cycleSeconds: 6,
    loop: true,
    voices: Object.freeze([
      voice({ layer: "root", type: "triangle", frequency: NOTE.E2, volume: 0.18, attack: 0.05, filter: lowpass(740), tremolo: { rate: 2.05, depth: 0.2 } }),
      voice({ layer: "tritone", type: "sawtooth", frequency: NOTE.B2, volume: 0.096, attack: 0.08, pan: -0.24, filter: bandpass(680, 1.55), detune: -8, tremolo: { rate: 3.1, depth: 0.1 } }),
      voice({ layer: "climb", type: "triangle", frequency: NOTE.F3, volume: 0.062, attack: 0.4, pan: 0.18, filter: lowpass(1180), vibrato: { rate: 0.2, depth: 10 }, detuneDriftCents: 7 }),
      voice({ layer: "spark", type: "sine", frequency: NOTE.D4, volume: 0.035, attack: 1.1, pan: 0.4, filter: bandpass(1700, 1.6), tremolo: { rate: 0.65, depth: 0.2 } })
    ])
  }),
  Object.freeze({
    id: MUSIC_TRACK_IDS.BossPhase3,
    title: "Caravan Guard - Last Ember",
    role: "boss",
    phase: 3,
    keyCenter: "F minor",
    tempo: 122,
    texture: "urgent final stand with bright threat tone",
    volume: 0.61,
    cycleSeconds: 5,
    loop: true,
    voices: Object.freeze([
      voice({ layer: "root", type: "sawtooth", frequency: NOTE.F2, volume: 0.18, attack: 0.03, filter: lowpass(820), tremolo: { rate: 3.05, depth: 0.22 } }),
      voice({ layer: "drive", type: "triangle", frequency: NOTE.C3, volume: 0.104, attack: 0.06, pan: -0.18, filter: bandpass(720, 1.8), detune: 6, tremolo: { rate: 6.1, depth: 0.12 } }),
      voice({ layer: "wound", type: "sine", frequency: NOTE.G3, volume: 0.06, attack: 0.35, pan: 0.22, filter: bandpass(1160, 1.3), vibrato: { rate: 0.28, depth: 16 } }),
      voice({ layer: "flare", type: "triangle", frequency: NOTE.C4, volume: 0.05, attack: 0.7, pan: 0.38, filter: bandpass(1960, 1.5), tremolo: { rate: 0.82, depth: 0.22 }, detuneDriftCents: -6 })
    ])
  }),
  Object.freeze({
    id: MUSIC_TRACK_IDS.BossVictory,
    title: "Ash Settles on the Road",
    role: "boss",
    phase: "victory",
    keyCenter: "A minor resolving C",
    tempo: 58,
    texture: "brief resolved cadence",
    volume: 0.48,
    loop: false,
    durationSeconds: 3.4,
    releaseSeconds: 0.85,
    voices: Object.freeze([
      voice({ layer: "release", type: "sine", frequency: NOTE.A2, volume: 0.13, attack: 0.18, release: 1, durationSeconds: 3, filter: lowpass(980), vibrato: { rate: 0.08, depth: 5 } }),
      voice({ layer: "third", type: "triangle", frequency: NOTE.C3, volume: 0.084, attack: 0.28, release: 1, durationSeconds: 2.8, pan: -0.18, filter: lowpass(1120) }),
      voice({ layer: "crown", type: "sine", frequency: NOTE.E3, volume: 0.058, attack: 0.5, release: 0.9, durationSeconds: 2.5, pan: 0.22, filter: bandpass(1350, 1), tremolo: { rate: 0.12, depth: 0.08 } }),
      voice({ layer: "afterglow", type: "sine", frequency: NOTE.C4, volume: 0.033, attack: 0.9, release: 0.8, durationSeconds: 2.1, pan: 0.38, filter: bandpass(1750, 1.2), detune: 4 })
    ])
  }),
  Object.freeze({
    id: MUSIC_TRACK_IDS.HearthlightRest,
    title: "Hearthlight Rest - Coals Remember",
    role: "hearthlight",
    keyCenter: "A minor",
    tempo: 48,
    texture: "warm low drone with slow ember shimmer",
    volume: 0.37,
    cycleSeconds: 14,
    loop: true,
    voices: Object.freeze([
      voice({ layer: "warmth", type: "sine", frequency: NOTE.A2, volume: 0.12, attack: 2.4, release: 1.8, filter: lowpass(900), tremolo: { rate: 0.045, depth: 0.1 } }),
      voice({ layer: "memory", type: "triangle", frequency: NOTE.E3, volume: 0.074, attack: 3, release: 2, pan: -0.18, filter: lowpass(1180), vibrato: { rate: 0.07, depth: 4 } }),
      voice({ layer: "spark", type: "sine", frequency: NOTE.C4, volume: 0.04, attack: 3.4, release: 1.6, pan: 0.34, filter: bandpass(1600, 1.2), tremolo: { rate: 0.16, depth: 0.16 } }),
      voice({ layer: "breath", type: "sine", frequency: NOTE.E4, volume: 0.022, attack: 4.2, release: 1.5, pan: 0.08, filter: bandpass(2100, 1.1), vibrato: { rate: 0.09, depth: 5 } })
    ])
  }),
  Object.freeze({
    id: MUSIC_TRACK_IDS.CutsceneAmbient,
    title: "Between Ash and Oath",
    role: "cutscene",
    keyCenter: "D minor",
    tempo: 54,
    texture: "wide suspended story bed",
    volume: 0.36,
    cycleSeconds: 16,
    loop: true,
    voices: Object.freeze([
      voice({ layer: "frame", type: "sine", frequency: NOTE.D2, volume: 0.105, attack: 2.8, release: 1.8, filter: lowpass(820), vibrato: { rate: 0.05, depth: 4 } }),
      voice({ layer: "distant", type: "triangle", frequency: NOTE.A2, volume: 0.07, attack: 3.2, release: 1.6, pan: -0.28, filter: lowpass(970), tremolo: { rate: 0.07, depth: 0.08 } }),
      voice({ layer: "question", type: "sine", frequency: NOTE.F3, volume: 0.046, attack: 2.2, release: 1.2, pan: 0.24, filter: bandpass(1240, 1.1), detuneDriftCents: 5 }),
      voice({ layer: "thread", type: "sine", frequency: NOTE.A3, volume: 0.03, attack: 4, release: 1.2, pan: 0.42, filter: bandpass(1850, 1.2), vibrato: { rate: 0.1, depth: 7 } })
    ])
  }),
  Object.freeze({
    id: MUSIC_TRACK_IDS.UnmadeSting,
    title: "Unmade",
    role: "sting",
    keyCenter: "C diminished",
    tempo: 0,
    texture: "short collapse cue",
    volume: 0.64,
    loop: false,
    durationSeconds: 1.85,
    releaseSeconds: 0.28,
    voices: Object.freeze([
      voice({ layer: "collapse", type: "sawtooth", frequency: NOTE.C2, volume: 0.18, attack: 0.015, release: 0.28, durationSeconds: 1.45, filter: lowpass(520, 1.5, { sweepTo: 180, sweepSeconds: 1.3 }), detuneDriftCents: -24 }),
      voice({ layer: "break", type: "triangle", frequency: NOTE.G2, volume: 0.095, attack: 0.04, release: 0.24, durationSeconds: 1.2, pan: -0.24, filter: bandpass(720, 1.6), detune: -10, vibrato: { rate: 0.9, depth: 20 } }),
      voice({ layer: "ash", type: "sine", frequency: NOTE.C3, volume: 0.062, attack: 0.12, release: 0.26, durationSeconds: 0.95, pan: 0.3, filter: bandpass(1440, 1.8), tremolo: { rate: 1.4, depth: 0.25 } }),
      voice({ layer: "void", type: "sine", frequency: NOTE.F3, volume: 0.034, attack: 0.2, release: 0.22, durationSeconds: 0.7, pan: 0.08, filter: bandpass(2100, 1.4), detune: 12 })
    ])
  })
]);

const BIOME_AMBIENT_DEFINITIONS = Object.freeze(
  BIOME_DEFINITIONS.map((biome) => Object.freeze({
    id: biome.id === STARTER_BIOME.id
      ? MUSIC_TRACK_IDS.HearthmereAmbient
      : `${biome.id}_ambient`,
    title: biome.id === STARTER_BIOME.id
      ? "Hearthmere Outpost - Emberfield Vigil"
      : `${biome.name} - Field Theme`,
    role: "biome",
    biomeId: biome.id,
    musicId: biome.musicId,
    keyCenter: biome.id === STARTER_BIOME.id ? "A minor" : "regional mode",
    tempo: 52,
    texture: "procedural regional drone with authored harmonic color",
    cycleSeconds: biome.id === STARTER_BIOME.id ? 14 : 12,
    volume: biome.id === STARTER_BIOME.id ? 0.35 : 0.33,
    voices: BIOME_SCORE_PALETTES[biome.id] ?? BIOME_SCORE_PALETTES.hearthmere,
    loop: true
  }))
);

export const MUSIC_TRACK_DEFINITIONS = Object.freeze([
  ...BIOME_AMBIENT_DEFINITIONS,
  ...SPECIAL_TRACK_DEFINITIONS
].map((definition) => Object.freeze({ ...definition })));

export const MUSIC_TRACKS_BY_ID = Object.freeze(
  Object.fromEntries(MUSIC_TRACK_DEFINITIONS.map((definition) => [definition.id, definition]))
);

export const BIOME_MUSIC_TRACK_BY_MUSIC_ID = Object.freeze(
  Object.fromEntries(BIOME_AMBIENT_DEFINITIONS.map((definition) => [definition.musicId, definition.id]))
);

export const BIOME_MUSIC_TRACK_BY_BIOME_ID = Object.freeze(
  Object.fromEntries(BIOME_AMBIENT_DEFINITIONS.map((definition) => [definition.biomeId, definition.id]))
);

export const BOSS_PHASE_TRACK_IDS = Object.freeze({
  1: MUSIC_TRACK_IDS.BossPhase1,
  2: MUSIC_TRACK_IDS.BossPhase2,
  3: MUSIC_TRACK_IDS.BossPhase3
});

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBossPhase(phase) {
  const numericPhase = typeof phase === "number"
    ? phase
    : Number.parseInt(normalizeString(phase), 10);

  if (!Number.isInteger(numericPhase)) return null;
  return Math.max(1, Math.min(3, numericPhase));
}

function getContextMode(context) {
  return context.appMode ?? context.mode ?? null;
}

function isCutsceneContext(context) {
  const mode = getContextMode(context);
  return mode === AppMode.Cutscene ||
    context.cutscene === true ||
    context.isCutscene === true ||
    context.cinematic === true ||
    context.isCinematic === true;
}

function isHearthlightRestContext(context) {
  return context.hearthlightRest === true ||
    context.hearthlightResting === true ||
    context.isHearthlightResting === true ||
    context.restingAtHearthlight === true;
}

function isBossVictoryContext(context) {
  return context.bossVictory === true ||
    context.bossDefeated === true ||
    context.victory === true;
}

function isBossIntroContext(context) {
  return context.bossIntro === true ||
    context.bossPhase === "intro" ||
    context.phase === "intro";
}

function isUnmadeStingContext(context) {
  return context.unmade === true ||
    context.unmadeSting === true ||
    context.stingId === "unmade" ||
    context.trackCue === MUSIC_TRACK_IDS.UnmadeSting;
}

function resolveBossMusicTrack(context) {
  if (isBossVictoryContext(context)) return MUSIC_TRACK_IDS.BossVictory;
  if (isBossIntroContext(context)) return MUSIC_TRACK_IDS.BossIntro;

  const phase = normalizeBossPhase(context.bossPhase ?? context.phase);
  if (phase) return BOSS_PHASE_TRACK_IDS[phase];

  if (context.bossActive === true || context.isBossActive === true) {
    return MUSIC_TRACK_IDS.BossPhase1;
  }

  return null;
}

export function getMusicTrackDefinition(trackId) {
  return MUSIC_TRACKS_BY_ID[trackId] ?? null;
}

export function listMusicTrackDefinitions() {
  return [...MUSIC_TRACK_DEFINITIONS];
}

export function getBiomeMusicTrackId(biomeOrMusicId) {
  if (typeof biomeOrMusicId === "string") {
    const id = normalizeString(biomeOrMusicId);
    return BIOME_MUSIC_TRACK_BY_MUSIC_ID[id] ??
      BIOME_MUSIC_TRACK_BY_BIOME_ID[id] ??
      (MUSIC_TRACKS_BY_ID[id]?.role === "biome" ? id : DEFAULT_MUSIC_TRACK_ID);
  }

  if (!biomeOrMusicId || typeof biomeOrMusicId !== "object") {
    return DEFAULT_MUSIC_TRACK_ID;
  }

  const musicId = normalizeString(biomeOrMusicId.musicId);
  if (musicId && BIOME_MUSIC_TRACK_BY_MUSIC_ID[musicId]) {
    return BIOME_MUSIC_TRACK_BY_MUSIC_ID[musicId];
  }

  const biomeId = normalizeString(
    biomeOrMusicId.id ?? biomeOrMusicId.key ?? biomeOrMusicId.biomeId
  );
  const biomeDefinition = BIOME_DEFINITIONS.find((biome) => biome.id === biomeId);
  return biomeDefinition
    ? BIOME_MUSIC_TRACK_BY_MUSIC_ID[biomeDefinition.musicId]
    : DEFAULT_MUSIC_TRACK_ID;
}

export function getBiomeMusicTrackDefinition(biomeOrMusicId) {
  return getMusicTrackDefinition(getBiomeMusicTrackId(biomeOrMusicId));
}

export function resolveBiomeMusicTrack(biomeOrMusicId) {
  return getBiomeMusicTrackId(biomeOrMusicId);
}

export function resolveMusicTrack(context = {}) {
  if (isUnmadeStingContext(context)) return MUSIC_TRACK_IDS.UnmadeSting;
  if (isBossIntroContext(context)) return MUSIC_TRACK_IDS.BossIntro;
  if (isCutsceneContext(context)) return MUSIC_TRACK_IDS.CutsceneAmbient;

  const bossTrack = resolveBossMusicTrack(context);
  if (bossTrack) return bossTrack;

  if (isHearthlightRestContext(context)) return MUSIC_TRACK_IDS.HearthlightRest;

  const mode = getContextMode(context);
  if (mode === AppMode.Combat || context.combat === true || context.inCombat === true) {
    return MUSIC_TRACK_IDS.CombatAmbient;
  }

  if (mode === AppMode.Boot || mode === AppMode.Loading || mode === AppMode.Menu) {
    return DEFAULT_MUSIC_TRACK_ID;
  }

  return getBiomeMusicTrackId(context.biome ?? context.musicId ?? context.biomeMusicId);
}

import { describe, expect, it } from "@jest/globals";
import { AppMode } from "../core/AppMode.js";
import {
  BIOME_MUSIC_TRACK_BY_BIOME_ID,
  BIOME_MUSIC_TRACK_BY_MUSIC_ID,
  DEFAULT_MUSIC_TRACK_ID,
  MUSIC_TRACK_DEFINITIONS,
  MUSIC_TRACK_IDS,
  getBiomeMusicTrackDefinition,
  getBiomeMusicTrackId,
  getMusicTrackDefinition,
  listMusicTrackDefinitions,
  resolveBiomeMusicTrack,
  resolveMusicTrack
} from "../audio/MusicRegistry.js";
import { BIOME_DEFINITIONS } from "../world/biomes/BiomeDefinitions.js";

describe("MusicRegistry", () => {
  it("defines a registry entry for every authored biome music id", () => {
    for (const biome of BIOME_DEFINITIONS) {
      const trackId = BIOME_MUSIC_TRACK_BY_MUSIC_ID[biome.musicId];
      const definition = getMusicTrackDefinition(trackId);

      expect(definition).toMatchObject({
        id: trackId,
        role: "biome",
        biomeId: biome.id,
        musicId: biome.musicId,
        loop: true
      });
      expect(definition.title).toEqual(expect.stringContaining(biome.id === "hearthmere" ? "Hearthmere" : biome.name));
      expect(definition.texture).toEqual(expect.any(String));
      expect(definition.voices.length).toBeGreaterThanOrEqual(6);
      expect(definition.voices).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            layer: expect.any(String),
            filter: expect.objectContaining({ type: expect.any(String), frequency: expect.any(Number) })
          })
        ])
      );
    }

    expect(getMusicTrackDefinition(MUSIC_TRACK_IDS.HearthmereAmbient)).toBeTruthy();
    expect(MUSIC_TRACK_DEFINITIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: MUSIC_TRACK_IDS.CombatAmbient }),
        expect.objectContaining({ id: MUSIC_TRACK_IDS.BossIntro }),
        expect.objectContaining({ id: MUSIC_TRACK_IDS.BossPhase1 }),
        expect.objectContaining({ id: MUSIC_TRACK_IDS.BossPhase2 }),
        expect.objectContaining({ id: MUSIC_TRACK_IDS.BossPhase3 }),
        expect.objectContaining({ id: MUSIC_TRACK_IDS.BossVictory }),
        expect.objectContaining({ id: MUSIC_TRACK_IDS.HearthlightRest }),
        expect.objectContaining({ id: MUSIC_TRACK_IDS.CutsceneAmbient }),
        expect.objectContaining({ id: MUSIC_TRACK_IDS.UnmadeSting })
      ])
    );
  });

  it("exposes stable list and biome helper APIs for score lookups", () => {
    const listed = listMusicTrackDefinitions();

    expect(listed).toEqual(MUSIC_TRACK_DEFINITIONS);
    expect(listed).not.toBe(MUSIC_TRACK_DEFINITIONS);
    expect(getBiomeMusicTrackId("music.biome.blackroot")).toBe("blackroot_ambient");
    expect(getBiomeMusicTrackId({ biomeId: "ashen_wastes" })).toBe("ashen_wastes_ambient");
    expect(getBiomeMusicTrackDefinition("moonspire")).toMatchObject({
      id: "moonspire_ambient",
      role: "biome",
      biomeId: "moonspire"
    });
  });

  it("authors special cues with production metadata and one-shot durations", () => {
    const combat = getMusicTrackDefinition(MUSIC_TRACK_IDS.CombatAmbient);
    const bossIntro = getMusicTrackDefinition(MUSIC_TRACK_IDS.BossIntro);
    const victory = getMusicTrackDefinition(MUSIC_TRACK_IDS.BossVictory);
    const unmade = getMusicTrackDefinition(MUSIC_TRACK_IDS.UnmadeSting);

    expect(combat).toMatchObject({
      role: "combat",
      keyCenter: expect.any(String),
      tempo: expect.any(Number),
      loop: true
    });
    expect(combat.voices.length).toBeGreaterThanOrEqual(5);
    expect(combat.voices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tremolo: expect.objectContaining({ rate: expect.any(Number) }) }),
        expect.objectContaining({ filter: expect.objectContaining({ type: expect.any(String) }) })
      ])
    );

    for (const cue of [bossIntro, victory, unmade]) {
      expect(cue).toMatchObject({
        loop: false,
        durationSeconds: expect.any(Number),
        releaseSeconds: expect.any(Number),
        texture: expect.any(String)
      });
      expect(cue.durationSeconds).toBeGreaterThan(0.5);
      expect(cue.voices.some((voice) => Number.isFinite(voice.durationSeconds))).toBe(true);
    }
  });

  it("resolves biome shifts from biome definitions and music ids", () => {
    expect(resolveBiomeMusicTrack({ musicId: "music.biome.blackroot" })).toBe("blackroot_ambient");
    expect(resolveBiomeMusicTrack({ id: "moonspire" })).toBe("moonspire_ambient");
    expect(resolveBiomeMusicTrack("blackroot")).toBe("blackroot_ambient");
    expect(resolveBiomeMusicTrack("blackroot_ambient")).toBe("blackroot_ambient");
    expect(BIOME_MUSIC_TRACK_BY_BIOME_ID.blackroot).toBe("blackroot_ambient");
    expect(resolveMusicTrack({
      appMode: AppMode.Exploration,
      biome: { musicId: "music.biome.dragon_coast" }
    })).toBe("dragon_coast_ambient");
  });

  it("lets boss phase context take precedence over combat and biome ambience", () => {
    expect(resolveMusicTrack({
      appMode: AppMode.Combat,
      bossPhase: 2,
      biome: { musicId: "music.biome.gravehold" }
    })).toBe(MUSIC_TRACK_IDS.BossPhase2);

    expect(resolveMusicTrack({
      appMode: AppMode.Exploration,
      bossPhase: 9,
      biome: { musicId: "music.biome.blackroot" }
    })).toBe(MUSIC_TRACK_IDS.BossPhase3);

    expect(resolveMusicTrack({
      appMode: AppMode.Combat,
      bossVictory: true,
      bossPhase: 3
    })).toBe(MUSIC_TRACK_IDS.BossVictory);
  });

  it("applies cutscene, menu, and hearthlight precedence deterministically", () => {
    expect(resolveMusicTrack({
      appMode: AppMode.Cutscene,
      hearthlightResting: true,
      bossPhase: 1
    })).toBe(MUSIC_TRACK_IDS.CutsceneAmbient);

    expect(resolveMusicTrack({
      appMode: AppMode.Menu,
      hearthlightResting: true
    })).toBe(MUSIC_TRACK_IDS.HearthlightRest);

    expect(resolveMusicTrack({
      appMode: AppMode.Menu,
      biome: { musicId: "music.biome.ironvale" }
    })).toBe(DEFAULT_MUSIC_TRACK_ID);
  });

  it("protects explicit boss intro and unmade cues over cutscene ambience", () => {
    expect(resolveMusicTrack({
      appMode: AppMode.Cutscene,
      bossIntro: true,
      bossPhase: 1
    })).toBe(MUSIC_TRACK_IDS.BossIntro);

    expect(resolveMusicTrack({
      appMode: AppMode.Cutscene,
      bossIntro: true,
      unmade: true
    })).toBe(MUSIC_TRACK_IDS.UnmadeSting);
  });

  it("falls back to Hearthmere ambient for unknown or missing context", () => {
    expect(resolveBiomeMusicTrack("music.biome.unknown")).toBe(DEFAULT_MUSIC_TRACK_ID);
    expect(resolveBiomeMusicTrack({ id: "unknown" })).toBe(DEFAULT_MUSIC_TRACK_ID);
    expect(resolveMusicTrack()).toBe(DEFAULT_MUSIC_TRACK_ID);
    expect(getMusicTrackDefinition("missing_track")).toBeNull();
  });
});

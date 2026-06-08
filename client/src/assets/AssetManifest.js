/**
 * AssetManifest — single source of truth for all game assets.
 *
 * Every asset path lives here. No scattered hardcoded strings in gameplay
 * or render code — the manifest enforces the license-clean release boundary.
 *
 * File-backed model/texture/audio assets must be placed in
 * `client/public/assets/` and have license metadata filled in. Code-generated
 * assets are tracked here too so the release checklist can distinguish
 * deliberate original procedural art from file-backed assets.
 */

/**
 * ORIGINAL = created specifically for Realmforge; no third-party license.
 * Add every new asset here before referencing it in code.
 */
export const ORIGINAL = {
  spdx: "ORIGINAL",
  author: "Realmforge team"
};

// ── Generated art (original procedural assets) ──────────────────────────────

export const GENERATED_ART = {
  hearthmereResourceNodes: Object.freeze({
    id: "generated.hearthmere.resource_nodes",
    module: "world/art/HearthmereArtKit",
    description: "Generated Hearthmere timber, ore, herb, bone, coal, crystal, and root resource node visuals.",
    license: ORIGINAL
  }),
  hearthmereNpcSilhouettes: Object.freeze({
    id: "generated.hearthmere.npc_silhouettes",
    module: "gameplay/npc/NpcVisual",
    description: "Generated Hearthmere role silhouettes for camp NPCs.",
    license: ORIGINAL
  }),
  hearthmereEnemySilhouettes: Object.freeze({
    id: "generated.hearthmere.enemy_silhouettes",
    module: "gameplay/enemies/WanderingEnemyVisual",
    description: "Generated dark-fantasy wandering enemy silhouettes.",
    license: ORIGINAL
  }),
  hearthlightShrine: Object.freeze({
    id: "generated.hearthmere.hearthlight_shrine",
    module: "world/Hearthlight",
    description: "Generated Hearthlight shrine, flame, and ember glow prop.",
    license: ORIGINAL
  }),
  hearthmereBossPathPrefabs: Object.freeze({
    id: "generated.hearthmere.boss_path_prefabs",
    module: "world/prefab/prefabs",
    description: "Generated Hearthmere camp, crypt, road, rubble, forge, cart, palisade, and rune set dressing.",
    license: ORIGINAL
  }),
  hearthmereBossArena: Object.freeze({
    id: "generated.hearthmere.boss_arena",
    module: "world/BossArena",
    description: "Generated Hearthmere boss arena floor, fog gate, and ritual presentation.",
    license: ORIGINAL
  }),
  hollowboundCaravanGuard: Object.freeze({
    id: "generated.hearthmere.hollowbound_caravan_guard",
    module: "gameplay/enemies/BossController",
    description: "Generated Hollowbound Caravan Guard boss silhouette and phase feedback rig.",
    license: ORIGINAL
  }),
  hearthmereProceduralSfx: Object.freeze({
    id: "generated.hearthmere.procedural_sfx",
    module: "audio/AudioManager",
    description: "Generated original Hearthmere combat, boss, Hearthlight, UI, and death sound-design cues.",
    license: ORIGINAL
  }),
  hearthmereProceduralScore: Object.freeze({
    id: "generated.hearthmere.procedural_score",
    module: "audio/MusicRegistry",
    description: "Generated original Hearthmere biome, combat, boss, rest, cutscene, victory, and death music layers.",
    license: ORIGINAL
  })
};

// ── File-backed models ─────────────────────────────────────────────────────

export const MODELS = {
  // player:  { id: "player",  path: "player/unbound.glb",           license: ORIGINAL },
  // boss:    { id: "boss",    path: "enemies/hollowbound-guard.glb", license: ORIGINAL },
  // dummy:   { id: "dummy",   path: "enemies/dummy.glb",             license: ORIGINAL },
};

// ── File-backed audio ──────────────────────────────────────────────────────

export const AUDIO = {
  // footstep:    { id: "footstep",    path: "sfx/footstep.mp3",        license: ORIGINAL },
  // swingLight:  { id: "swingLight",  path: "sfx/swing-light.mp3",     license: ORIGINAL },
  // hitFlesh:    { id: "hitFlesh",    path: "sfx/hit-flesh.mp3",       license: ORIGINAL },
  // hearthlight: { id: "hearthlight", path: "sfx/hearthlight.mp3",     license: ORIGINAL },
  // unmade:      { id: "unmade",      path: "sfx/unmade-sting.mp3",    license: ORIGINAL },
  // bossIntro:   { id: "bossIntro",   path: "music/boss-intro.mp3",    license: ORIGINAL },
  // bossLoop:    { id: "bossLoop",    path: "music/boss-loop.mp3",     license: ORIGINAL },
};

// ── Fonts (licensed for release) ─────────────────────────────────────────────

export const FONTS = {
  // display: { id: "display", family: "Cormorant Garamond", path: "fonts/CormorantGaramond-Regular.woff2", license: { spdx: "OFL-1.1", author: "Christian Thalmann" } },
  // body:    { id: "body",    family: "Inter",              path: "fonts/Inter-Variable.woff2",            license: { spdx: "OFL-1.1", author: "Rasmus Andersson"  } },
};

/** Collect all assets with non-ORIGINAL licenses for the release checklist. */
export function getLicensedAssets() {
  const result = [];

  for (const asset of Object.values(GENERATED_ART)) {
    if (asset.license.spdx !== "ORIGINAL") {
      result.push({ type: "generated", ...asset });
    }
  }
  for (const asset of Object.values(MODELS)) {
    if (asset.license.spdx !== "ORIGINAL") {
      result.push({ type: "model", ...asset });
    }
  }
  for (const asset of Object.values(AUDIO)) {
    if (asset.license.spdx !== "ORIGINAL") {
      result.push({ type: "audio", ...asset });
    }
  }
  for (const asset of Object.values(FONTS)) {
    if (asset.license.spdx !== "ORIGINAL") {
      result.push({ type: "font", ...asset });
    }
  }

  return result;
}

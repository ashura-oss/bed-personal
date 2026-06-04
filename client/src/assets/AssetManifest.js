/**
 * AssetManifest — single source of truth for all game assets.
 *
 * Every asset path lives here. No scattered hardcoded strings in gameplay
 * or render code — the manifest enforces the license-clean release boundary.
 *
 * Phase 4 note: all model/texture/audio slots are currently commented out
 * (greybox uses procedural geometry). When real assets are added they must
 * be placed in `client/public/assets/` and have license metadata filled in.
 */

/**
 * ORIGINAL = created specifically for Realmforge; no third-party license.
 * Add every new asset here before referencing it in code.
 */
export const ORIGINAL = {
  spdx: "ORIGINAL",
  author: "Realmforge team"
};

// ── Models (Phase 4 placeholder — greybox until real assets land) ─────────────

export const MODELS = {
  // player:  { id: "player",  path: "player/unbound.glb",           license: ORIGINAL },
  // boss:    { id: "boss",    path: "enemies/hollowbound-guard.glb", license: ORIGINAL },
  // dummy:   { id: "dummy",   path: "enemies/dummy.glb",             license: ORIGINAL },
};

// ── Audio (Phase 4 placeholder) ───────────────────────────────────────────────

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

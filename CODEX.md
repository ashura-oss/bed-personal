# Realmforge Codex Context

Read `CLAUDE.md` first. This file has Codex-specific details.

## Direction (2026-05-29 pivot, updated 2026-06-02)

Third-person 3D action RPG (soulslike) on Three.js + webpack 5, reusing the Express/libSQL backend.
Phases 1–5 implemented on `feat/app-mode-context`. Full game plan in `docs/forge3d/05-full-game-roadmap.md`.

## What's Done (feat/app-mode-context, uncommitted)

- client-bootstrap: webpack5, plain JS ESM, Three.js, Rapier, FollowCamera, UIBus, Jest
- T-01: AppMode/GameContext state machine
- T-02–T-20: Player (KCC+dodge+i-frames), stamina, combat, HUD, dummy enemy + TrainingEnemyVisual, PlayerVisual, BossController (3-phase), fog gate, Hearthlight, EmberOrb, lock-on camera, backend login/character stats, run-state persistence, procedural audio, options menu, /play production route

## Ownership

Active AI session implements. Human approves commits/pushes/merges/tags/deploys.
See `.ai/00-master-control.md`.

## Key Rules

- Backend `src/` stays routes→controllers→models→db. Do not rewrite.
- gameplay/ never imports ui/ — UIBus only.
- Assets must go through `client/src/assets/AssetManifest.js`.
- Death banner is `UNMADE`. No copied game phrases.
- Branch flow: `feat/* → dev → qa → staging → main`. No skipping.

## Next Slices (G-01 onward)

See `docs/forge3d/05-full-game-roadmap.md` for the full 15-slice plan:
G-01 World Map → G-02 Region Geometry → G-03 NPCs → G-04 Dialogue → G-05 Quests → G-06 Skills/Hotbar → G-07 Inventory → G-08 Crafting → G-09 Cutscenes → G-10 Music → G-11 Char Creation → G-12 Act 1 Story → G-13 Faction Rep → G-14 All Regions → G-15 Endgame

# Feature Ledger

| Feature | Branch | Status | Scope | Notes |
|---|---|---|---|---|
| **TypeScript → plain JS refactor** | `feat/world-chunks` | **Done, QA-PASS** | All 46 client `.js` files; Babel toolchain (webpack/jest/eslint); tsconfig→jsconfig; docs de-TS'd | 0 `.ts` files. eslint✅ jest 81✅ build✅. qa-gatekeeper full audit PASS (no dead TS syntax, all param-property expansions correct, boundaries/determinism intact). Codex implemented; browser + /play smoke passed. Plan: `docs/forge3d/07-typescript-to-js-refactor-plan.md`. |
| AI workflow control plane | `feat/app-mode-context` | Done | `.ai/`, docs sync | Contradictions fixed; Claude-review-only removed. |
| client-bootstrap | `feat/app-mode-context` | Done (pending commit) | webpack5/plain JS ESM/Three/Rapier/UIBus/FollowCamera | Headless smoke passed. |
| T-01 AppMode/GameContext | `feat/app-mode-context` | Done | State machine, control-lock contract, UIBus mode events | eslint✅ jest✅ build✅ |
| T-02 InputMap | `feat/app-mode-context` | Done | Action-based input (WASD/mouse/keyboard) | Pure helper tested |
| T-03 StaminaSystem | `feat/app-mode-context` | Done | drain/regen/gate, pure | 13 Jest tests |
| T-04 PlayerController | `feat/app-mode-context` | Done | Rapier KCC, WASD, sprint, dodge + i-frames | Camera-relative movement |
| T-05 DummyEnemy | `feat/app-mode-context` | Done | Capsule mesh, HP, hit flash, respawn | Proximity damage |
| T-06 CombatSystem | `feat/app-mode-context` | Done | Light/heavy attack timing, hitbox, stamina gate | Startup/active/recovery frames |
| T-07 Hearthlight | `feat/app-mode-context` | Done | Flame mesh, flicker light, proximity rest | Saves respawn point |
| T-08 FollowCamera | `feat/app-mode-context` | Done | Third-person spring-arm, lock-on mode | Replaces bootstrap OrbitControls |
| T-09 HUD | `feat/app-mode-context` | Done | HP/FP/Stamina bars, ghost HP, Embers, Flask | UIBus-driven, per style guide |
| T-10 EmberOrb | `feat/app-mode-context` | Done | Drop on death, float, proximity collect | Full death loop |
| T-11 FogGate | `feat/app-mode-context` | Done | Pillar mesh, trigger threshold | Boss arena entrance |
| T-12 BossController | `feat/app-mode-context` | Done | 3-phase AI, poise/stagger, approach/attack FSM | 600 HP, 3 attack types |
| T-13 BossHUD | `feat/app-mode-context` | Done | Health bar + phase ticks + name reveal | Lower-third per style guide |
| T-14 Auth / LoginScreen | `feat/app-mode-context` | Done | POST /auth/login, JWT, session resume, demo button | Feeds derived stats to player |
| T-15 AuthService | `feat/app-mode-context` | Done | Login, resume, XP persist on boss defeat | Uses existing backend endpoints |
| T-16 RunState | `feat/app-mode-context` | Done | localStorage v1 — embers, flask, hearthlight pos | Versioned schema |
| T-17 AudioManager | `feat/app-mode-context` | Done | Web Audio API procedural SFX (no files needed yet) | 10 sound IDs |
| T-18 AssetManifest | `feat/app-mode-context` | Done | License-tracked manifest for models/audio/fonts | Stubs ready for Phase 4 art |
| T-19 OptionsMenu | `feat/app-mode-context` | Done | UI scale, volume, reduced-post, reduced-shake | localStorage-persisted |
| T-20 /play production route | `feat/app-mode-context` | Done | Express serves `client/dist/` at `/play` | Production build verified |

## Phase Summary

| Phase | DoD | Status |
|---|---|---|
| 0 Pre-production | docs/forge3d/ written and approved | ✅ Done |
| 1 Greybox vertical slice | Move, roll, lock-on, hit dummy, stamina, hearthlight, die, recover embers | ✅ Done |
| 2 Boss fight | Fog gate, 3-phase boss, boss bar, UNMADE banner | ✅ Done |
| 3 Backend integration | Login, load char, derive stats, XP persist, run-state | ✅ Done |
| 4 Asset infrastructure | Manifest, audio, options, production build | ✅ Done |
| 5 Polish + release prep | Options menu, /play serving, release readiness doc | ✅ Done |

## Procedural World (W-series)

| Slice | Branch | Status | Notes |
|---|---|---|---|
| **W-01 Chunk + Terrain** | `feat/world-chunks` | **Done, QA-PASS** | Seeded RNG/value-noise/fBm (`world/gen/Rng.js`), pure `terrainHeightAt` (`heightField.js`), `TerrainGenerator` (mesh + matching trimesh collider), `Chunk`, `ChunkManager` (7×7 streaming, budgeted builds, hysteresis unload, pre-sorted queue). Wired into `main.js` replacing `createGreyboxArena`; entities placed on terrain via `sampleHeight`. eslint/jest/build green. qa-gatekeeper PASS (2 findings found + fixed: tautological seam test, per-frame alloc). |
| W-02 Biomes | TBD | Next | temp/moisture noise → 8 biome palettes, fog/colour transitions |
| W-03 Prefab Injection | TBD | Planned | Authored story chunks embedded in procedural world |

## Pending Human Approvals

- `git commit` on `feat/app-mode-context` (Phases 1–5) and `feat/world-chunks` (W-01)
- Merge sequence per branch: `feat/* → dev → qa → staging → main`
- Manual browser smoke test (walk the procedural terrain, confirm no seams/fall-through)
- Optional: CI pipeline, real art assets, gamepad support

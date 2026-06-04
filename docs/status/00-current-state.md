# Current State

Date: 2026-06-03

## Active Direction

Realmforge is a third-person 3D action RPG using Three.js, webpack 5, plain JavaScript ESM, Rapier WASM, Jest, and HTML/CSS overlay UI. The full Phase 1–5 vertical slice plus W-01 terrain chunk foundation are implemented.

## Implemented (all on `feat/app-mode-context`, pending commit)

### Client (`client/src/`)

| Module | What's in it |
|---|---|
| `core/` | AppMode enum, GameContext state machine (6 modes, control-lock, UIBus bridge) |
| `controls/` | InputMap (WASD/mouse/keyboard, action-based, frame-safe) |
| `camera/` | FollowCamera (spring-arm + lock-on override, damp-lerp) |
| `gameplay/player/` | PlayerController (Rapier KCC, sprint, dodge+i-frames), StaminaSystem, ResourceBar |
| `gameplay/combat/` | CombatSystem (startup/active/recovery frames, hit detection, poise damage) |
| `gameplay/enemies/` | DummyEnemy (greybox capsule, HP, hit flash), BossController (3-phase FSM, poise/stagger, 600HP) |
| `world/` | Chunk/ChunkManager streaming terrain, TerrainGenerator/Rng/heightField, Hearthlight (flicker light, rest menu), FogGate (boss entrance), EmberOrb (death drop + collect) |
| `ui/` | UIBus events, HUD (bars + Embers + flask + i-frame indicator), BossHUD (health bar + phase ticks + name reveal), LoginScreen, OptionsMenu |
| `net/` | ApiClient fetch wrapper, AuthService (login/resume/XP persist), JSDoc response typedefs |
| `progression/` | RunState (localStorage v1, versioned) |
| `audio/` | AudioManager (Web Audio procedural SFX, 10 sound IDs) |
| `assets/` | AssetManifest (license-tracked model/audio/font stubs) |
| `engine/` | createScene (three-point cinematic lighting), createRenderer (ACES filmic), createCamera, startLoop (fixed-step accumulator) |
| `physics/` | initRapier (async WASM, KCC, gravity world) |

### Backend (`src/`)

- **Unchanged** except one line: Express now serves `client/dist/` at `/play`.

### Quality gates

| Gate | Result |
|---|---|
| TypeScript files under `client/` | ✅ None |
| `eslint "src/**/*.js"` | ✅ Clean |
| `jest` | ✅ 81/81 tests |
| webpack production build | ✅ Compiled (2 size warnings, non-blocking R-010) |
| `/play` serving | ✅ HTTP 200, full HTML |
| `/health` | ✅ `{"status":"ok","database":"connected"}` |

## AI Workflow Reality

- Active session implements; human approves irreversible actions.
- `feat/app-mode-context` branch is the current working branch.

## Pending Human Approvals

1. Manual browser smoke: open `http://localhost:5173` (dev) or `http://localhost:3001/play` (prod), log in as `demoUnbound`/`demo-password-ca1`, verify game boots and all Phase 1–5 features work
2. `git commit` on `feat/app-mode-context`
3. Merge `feat/app-mode-context → dev → qa → staging → main`

## Game Direction (2026-06-03)

**Procedural open world + soulslike bosses.** See `docs/forge3d/06-procedural-world-plan.md`.

- Open-world layer: Minecraft/Valheim-style — seamless procedural terrain, gather resources, craft, explore freely, light wandering enemies.
- Boss layer: existing soulslike combat — fog gate seals the arena, lock-on/stamina/dodge, 3-phase fights, UNMADE death loop. **Already built; reused unchanged.**
- Story: authored prefab chunks (Hearthmere camp, Ashfall Road, boss arenas, NPC camps) embedded by the generator at seeded biome-correct locations. Discovered through exploration.

## Next Slice: W-01 — Chunk + Terrain Foundation

W-01 is implemented: seeded chunk/terrain system (`Rng`, `WorldConfig`, `TerrainGenerator`, `Chunk`, `ChunkManager`) with streaming procedural terrain + Rapier heightfield colliders.

## Pending Human Approvals (Phase 1–5 slice)

1. Manual browser smoke: `http://localhost:5173` (dev) or `http://localhost:3001/play` (prod), log in `demoUnbound`/`demo-password-ca1`
2. `git commit` on `feat/app-mode-context`
3. Merge `feat/app-mode-context → dev → qa → staging → main`

## Later (post-vertical-slice)

- CI pipeline (GitHub Actions)
- Real glTF models + composed audio (manifest slots ready)
- Gamepad support (Gamepad API, InputMap extension)

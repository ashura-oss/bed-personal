# Release Readiness

Current readiness: **Phase 1–5 vertical slice implemented, pending human commit/merge approval.**

## Checklist

| Item | Status |
|---|---|
| `client/` scaffolded | ✅ Done |
| webpack dev server + HMR | ✅ Done |
| Plain JavaScript ESM client | ✅ Done |
| Three.js nonblank boot | ✅ Done (Greybox online) |
| Rapier async init + KCC | ✅ Done |
| Player movement (WASD + sprint + dodge + i-frames) | ✅ Done |
| Stamina system (drain/regen/gate) | ✅ Done |
| HUD overlay (HP/FP/Stamina bars + Embers + Flask) | ✅ Done |
| Lock-on camera (Tab toggle) | ✅ Done |
| Light/heavy attack + hit detection | ✅ Done |
| Dummy enemy (HP, hit reaction, respawn) | ✅ Done |
| Hearthlight (rest, heal, respawn point) | ✅ Done |
| Death → UNMADE banner → respawn | ✅ Done |
| Embers drop orb + proximity collect | ✅ Done |
| Fog gate boss entrance | ✅ Done |
| BossController (3 phases, AI, poise/stagger) | ✅ Done |
| Boss HUD (health bar, phase ticks, name reveal) | ✅ Done |
| Backend auth (login, JWT, session resume) | ✅ Done |
| Character data load → derived stats | ✅ Done |
| XP persistence on boss defeat | ✅ Done |
| Run-state persistence (localStorage) | ✅ Done |
| Asset manifest with license tracking | ✅ Done |
| Procedural audio (Web Audio API) | ✅ Done |
| Options menu (UI scale, volume, accessibility) | ✅ Done |
| Pause menu | ✅ Done |
| CI lint/test/build | ✅ Local scripts pass; CI not configured |
| webpack production build | ✅ Compiled with 2 non-blocking size warnings (R-010) |
| `/play` production serving | ✅ Express serves `client/dist/` at `/play` |
| Demo login in 3D client | ✅ `demoUnbound`/`demo-password-ca1` wired |
| License-clean asset manifest | ✅ Manifest stub in place; no third-party assets yet |
| Phase DoD playable | ✅ All Phase 1–5 systems implemented and QA-gated |
| Rollback plan | Revert to `a92f430` (initial commit) |

## QA Gate History

| Phase | Gate result | Notes |
|---|---|---|
| T-01 AppMode/GameContext | PASS | 3 `as never` casts fixed before pass |
| Phase 1+2 combined | PASS | rAF in BossController → game-loop dissolve timer fixed |
| Phase 3 backend | PASS | Clean first run |
| Phase 4+5 infrastructure | PASS | Clean first run |

## Remaining Before Human-Approved Release

1. Human manual browser smoke test at `http://localhost:5173` (dev) and `http://localhost:3001/play` (prod)
2. `git commit` on `feat/app-mode-context` (human approval)
3. Merge sequence: `feat/app-mode-context → dev → qa → staging → main` (each requires human approval)
4. Optional: CI configuration (GitHub Actions lint → test → build)
5. Optional Phase 4 art pass: real glTF models + audio assets (manifest slots ready)

## Production Size Budget (R-010, non-blocking)

| Chunk | Size | Note |
|---|---|---|
| `rapier.*.js` | 2.29 MiB | Rapier WASM — expected; lazy-loaded |
| `383.*.js` (Three.js vendor) | 494 KiB | Expected; tree-shaking tuning is Phase 5 stretch |
| `main.*.js` | ~43 KiB | Game code — well within budget |
| `runtime.*.js` | ~2 KiB | webpack runtime |

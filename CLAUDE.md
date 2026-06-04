# Realmforge Context

## Project Overview
Realmforge is a **third-person 3D action RPG (soulslike, Elden Ring–inspired)** on **Three.js + webpack 5**, reusing the completed Express/libSQL backend and the Realmforge world/lore. The 2D Phaser slice (`game/`) and CA2 DOM app (`frontend/`) are **legacy reference, not the game** (kept, not deleted). Phases 1–5 are implemented on `feat/app-mode-context` (pending commit/merge approval): player movement, dodge+i-frames, stamina, combat, HUD, dummy enemy, hearthlight, death/embers loop, 3-phase boss fight, backend login + character stats, run-state persistence, procedural audio, options menu, and `/play` production serving.

## Tech Stack
- Backend (unchanged): Express, libSQL, Drizzle, bcrypt, JWT
- 3D client: Three.js, webpack 5 + webpack-dev-server (HMR), plain JavaScript ESM, Rapier physics, glTF/AnimationMixer, HTML/CSS UI overlay, Gamepad API

## File Structure
- `src/`: backend (reused API/data layer)
- `client/`: NEW webpack + Three.js client (Phase 1)
- `docs/forge3d/`: 3D pre-prod docs
- `frontend/` (CA2 DOM app) + `game/` (Phaser 2D): LEGACY/ARCHIVED

## Key Commands
- Backend: `npm run dev` (Express `http://localhost:3001/`); `npm run db:seed`; demo login `demoUnbound`/`demo-password-ca1`
- 3D client: `npm run client:dev` (webpack-dev-server proxies API to Express); quality gates: `npm run lint`, `npm test`, `npm run build`

## Architecture Rules
- Backend stays routes→controllers→models→db; do NOT rewrite it.
- New game = Three.js client under `client/`; separate render/physics/gameplay/ui/net. UI is an HTML/CSS overlay driven by a `UIBus`; gameplay never imports UI.
- Reuse existing API/auth (JWT in localStorage); greybox before art; each phase runnable, verified in-browser.
- Release-bound: original, license-clean assets/text. No fake UI or "done" without verification.

## Reference Docs (read only what the task needs)
- 3D (current): `docs/forge3d/` (00 vision, 01 game-design, 02 ui-ux, 03 tech, 04 roadmap)
- World/API: `docs/story-bible.md`, `docs/api-reference.md`
- History + superseded-2D: `docs/project-master-plan.md`, `docs/game-design-doc.md`, `docs/track2-delegation-plan.md`, `docs/pixel-art-style-guide.md`

## Pipeline & Workflow (3D client)
**Branch flow — forward only:** `feat/* → dev → qa → staging → main`. No direct commits to `dev`/`qa`/`staging`/`main`; no backward or stage-skipping merges. Policy: `.claude/hooks/pre-merge.json`. `feat/*` branches off `dev`.

**Active session is the implementer.** Claude Code and Codex switch on token exhaustion — whichever is running builds the current slice. Human approves all commits, pushes, merges, tags, and deploys.

**Gate slash commands** (run these to promote branches — agents check/report, never auto-merge):
- `/ship-to-qa` → **qa-gatekeeper**: eslint/jest/build + boundary/secrets audit; PASS = ready to merge `feat→dev→qa` (human approves), FAIL = blocks.
- `/ship-to-staging` → **staging-auditor**: 60fps frame-budget gate; PASS = ready for `qa→staging` (human approves).
- `/release <version>` → **release-manager**: CI + prod build + playable demo + license-clean; changelog + tag; never auto-deploys.

**Context hygiene:** `/clear` between unrelated tasks; one slice per session. "Done" = eslint + jest + build green, verified in-browser — no fake UI, no unverified done.

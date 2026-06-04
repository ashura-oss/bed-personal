# Realmforge AI Master Control

Purpose: the operating control plane for Realmforge AI work.

## Authority Model

- Human owns product decisions and approves commits, pushes, merges, tags, and releases.
- The active AI session (Claude Code or Codex, whichever is running) is the implementer for that session — edits files, runs checks, updates docs.
- Human switches between Claude Code and Codex as needed; they do not collaborate in real-time.
- Subagents (qa-gatekeeper, staging-auditor, release-manager) run as gates — they check and report but do not merge or deploy without human approval.

## Active Project

- Direction: third-person 3D soulslike action RPG vertical slice.
- Stack: Three.js, webpack 5, webpack-dev-server (HMR), plain JavaScript ESM, Rapier WASM, Jest, HTML/CSS overlay UI.
- UI boundary: gameplay -> `UIBus` -> UI only.
- Backend: existing Express/libSQL/Drizzle API reused unchanged.
- Backend architecture: routes -> controllers -> models -> db.
- Legacy/reference only: `frontend/`, `game/`, `docs/game-design-doc.md`, `docs/track2-delegation-plan.md`, `docs/pixel-art-style-guide.md`.
- `client/` exists. `client-bootstrap` is done (webpack5, Three.js, Rapier, orbit camera, greybox arena, UIBus, Jest tests).

## Control Loop

1. Codex reads source-of-truth docs.
2. Codex slices the work.
3. Codex edits on `feat/*` only.
4. Codex verifies with tests/checks.
5. Claude may review only.
6. Codex fixes review blockers.
7. Human approves commit/merge/push.
8. Codex updates status docs.

## Hard Stops

- Do not implement combat, enemies, inventory, progression, or save state without an approved Phase 2+ slice.
- Do not use Vite or Vitest.
- Do not rewrite backend architecture.
- Do not import UI into gameplay.
- Do not claim incomplete work is complete.
- Do not commit, push, merge, tag, or deploy without explicit human approval.

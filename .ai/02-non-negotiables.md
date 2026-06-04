# Non-Negotiables

## Stack

- Bundler: webpack 5.
- Dev server: webpack-dev-server with HMR.
- Language: plain JavaScript ESM for `client/`.
- Renderer: Three.js.
- Physics: Rapier WASM.
- Tests: Jest for pure systems, Playwright for browser smoke.
- UI: HTML/CSS overlay above WebGL canvas.
- Not allowed: Vite, Vitest, fake UI, unverified "done".

## Scope

- `client/` exists. The 3D client is plain JS ESM with webpack5, Three.js, Rapier, FollowCamera, procedural terrain chunks, UIBus, and Jest tests.
- Phase 1–5 vertical slice plus W-01 chunk terrain are implemented.
- Greybox before art.

## Architecture

- Backend remains routes -> controllers -> models -> db.
- Backend changes are forbidden until Phase 3 run-state persistence unless the human explicitly approves.
- Gameplay must communicate with UI through `UIBus` only.
- Gameplay must never import from `ui/` or mutate DOM.
- Assets must go through manifests/loaders, not scattered hardcoded paths.

## Release Bound

- Assets, fonts, sounds, names, and in-game text must be original or license-clean.
- Death banner is `UNMADE`.
- Every phase must be runnable and verified in browser.

## AI Roles

- The active AI session (Claude Code or Codex) is the implementer for that session.
- Commits, pushes, merges, tags, and releases require explicit human approval.

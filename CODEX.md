# Realmforge Codex Context

This file is the Codex-facing companion to `CLAUDE.md`. Keep `CLAUDE.md` short so Claude Code does not load the full project memory on every turn.

## Startup Rule

Read `CLAUDE.md` first. Read this file when working as Codex or when Claude needs deeper workflow guidance. Do not load the long docs unless the current task needs them.

## Current State

- Completed through corrective `10.3 Boss battle presentation`, Phase 11 UI polish, and `12.1 Action gameplay architecture and art plan`.
- Next recommended work is `12.2 Phaser game shell and static serving`.
- CA1 backend is validated.
- CA2 auth, login/register frontend, dashboard HUD, character creation, map quest browsing, quest attempts, adventure journal review, combo backend resolution, ability unlock UI, combo frontend resolution, and boss quest combo encounters are validated.
- Gameplay reality: Realmforge currently has school-assignment RPG gameplay through backend-backed UI flows. Track 2 is now planned as a real Phaser action game, but no Phaser runtime has been implemented yet.
- Track 2 action gameplay must follow `docs/game-design-doc.md` and `docs/pixel-art-style-guide.md`.

## Codex Workflow

- Use `docs/project-master-plan.md` when changing ticket status, completing work, or checking the roadmap.
- Use `docs/ca-requirements-map.md` before CA1/CA2 requirement changes.
- Use `docs/api-reference.md` before route/API changes.
- Use `docs/story-bible.md` or `docs/project-context.md` only for story, region, NPC, ability, or game-feel work.
- Use `docs/game-design-doc.md` and `docs/pixel-art-style-guide.md` before Track 2 Phaser/action work.
- Update `CLAUDE.md` only for compact high-level state changes and keep it under 2000 characters.
- Update this file when Codex-specific workflow or handoff notes change.
- Log completed tickets in `docs/project-master-plan.md`.

## Implementation Rules

- Plain HTML/CSS/JS only unless the user explicitly asks otherwise.
- Keep frontend game logic separate from DOM manipulation.
- Use `frontend/js/scenes/` for page controllers.
- Use `frontend/js/game/` for pure rules and state.
- Treat `frontend/js/game/gameState.js` as the central frontend store.
- For Track 2, put Phaser code under `game/`; do not mix Phaser scene code into `frontend/`.
- Track 2 must ship real playable slices: nonblank canvas, controllable player, real collisions/combat, and backend-backed rewards.
- Keep backend layering: routes -> controllers -> models -> database.
- Do not create fake UI, dead buttons, fake routes, or docs claiming unfinished work is complete.

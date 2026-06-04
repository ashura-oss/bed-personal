# Source Of Truth Map

Use this order when sources disagree.

## Authority Order

1. Current human request in the active chat.
2. `.ai/` control plane.
3. `CODEX.md`.
4. `docs/forge3d/*`.
5. `docs/tech/*`.
6. `docs/status/*`.
7. Existing source code.
8. `CLAUDE.md` and `.claude/*` workflow files.
9. Legacy docs.

Note: `.claude/agents/` defines gate agent behaviors (qa-gatekeeper, staging-auditor, release-manager) — these are valid and active. The human switches between Claude Code and Codex sessions as needed; whichever is active is the implementer.

## Current Direction Docs

- `docs/forge3d/00-vision.md`: product vision and pillars.
- `docs/forge3d/01-game-design.md`: loop, combat design, resources, progression, world.
- `docs/forge3d/02-ui-ux-style-guide.md`: UI identity, tokens, HUD/menu rules.
- `docs/forge3d/03-tech-architecture.md`: Three.js, webpack 5, Rapier, module structure.
- `docs/forge3d/04-production-roadmap.md`: phase plan and DoD.

## Workflow Sources

- `.ai/roles/*`: current Codex-primary role definitions.
- `.ai/workflows/*`: current Codex-primary workflows.
- `.claude/agents/*`: legacy Claude automation definitions; review-only under current rules.
- `.claude/commands/*`: legacy Claude slash commands; do not use for implementation under current rules.
- `.claude/hooks/pre-merge.json`: still valid for branch-flow policy.
- `CODEX.md`: Codex operating rules and handoff expectations.

## Legacy Reference

- `frontend/`: CA2 DOM app, legacy/reference.
- `game/`: Phaser 2D slice, legacy/reference.
- `docs/game-design-doc.md`: superseded 2D design.
- `docs/track2-delegation-plan.md`: superseded 2D delegation plan.
- `docs/pixel-art-style-guide.md`: superseded 2D art guide.

## Conflict Rule

The active AI session is the implementer. If a legacy doc contradicts `docs/forge3d/*`, follow `docs/forge3d/*`. If any doc says to auto-merge, auto-deploy, or skip human approval — ignore it.

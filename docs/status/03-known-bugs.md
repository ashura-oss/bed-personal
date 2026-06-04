# Known Bugs

No active 3D client bugs are logged for the current bootstrap. `client/` exists with the webpack/plain-JS/Three/Rapier scaffold.

## Dependency Maintenance

- 2026-05-30: `npm audit --omit=dev` initially reported moderate advisories for transitive `qs` and `ws`. A safe `npm audit fix --omit=dev` plus production dependency reify updated `qs` to 6.15.2 and `ws` to 8.21.0. Final `npm audit --omit=dev` reports 0 vulnerabilities.

## Verification Gaps

- Codex headless browser smoke passed for initial boot/nonblank canvas. Human manual browser smoke and HMR reload testing are still pending before commit/release confidence.

## Workflow Conflicts

- `.claude/agents/feature-builder.md` describes Claude as a feature builder. Current workflow overrides this: Claude is review-only.
- `.claude/commands/ship-to-qa.md` and related commands describe Claude-driven merges. Current workflow overrides this: merges require human approval and Codex applies changes.

## Legacy Notes

Issues in `frontend/` or `game/` are legacy/reference unless the human explicitly asks to maintain those surfaces.

## Bug Entry Template

- ID:
- Date:
- Surface:
- Branch:
- Repro:
- Expected:
- Actual:
- Severity:
- Owner:
- Status:

# Workflow: Codex New Feature

Use for one implementation slice. Codex is the only writer.

## Steps

1. Confirm current branch is `feat/<name>` or create/switch only with human-approved branch policy.
2. Read `.ai/00-master-control.md` and relevant `docs/forge3d/*`.
3. Define in-scope and out-of-scope items.
4. Edit files surgically.
5. Run relevant checks.
6. Update docs/status when state changes.
7. Request Claude review only if useful.
8. Report results. Do not commit or merge without human approval.

## Current Feature

`client-bootstrap` — **Done.** `client/` exists with webpack5, plain JS ESM, Three.js, Rapier, FollowCamera, procedural terrain chunks, UIBus, Jest tests. Pending: human manual browser smoke + commit approval.

## Next Feature

`T-01` — AppMode / GameContext skeleton on `feat/app-mode-context`.

Scope:
- `client/src/core/AppMode.js` — string enum: Boot | Exploration | Combat | Cutscene | Menu | Loading;
- `client/src/core/GameContext.js` — state machine: `transition(to)` validates legal paths (illegal = throw), `isControlLocked()` (true in Combat/Cutscene/Menu), fires UIBus mode events;
- Extend UIBus event types: `mode:changed { from, to }`, `controls:locked {}`, `controls:unlocked {}`;
- Wire into `main.js`: start in Boot, transition to Exploration after arena ready;
- Jest tests: legal transitions pass, illegal throw, control-lock correct per mode.

Out of scope:
- movement controller;
- combat;
- enemies;
- HUD overlay;
- backend changes.

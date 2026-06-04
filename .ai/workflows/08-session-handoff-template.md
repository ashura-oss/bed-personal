# Session Handoff Template

Use at the end of every Codex session.

## Handoff

- Branch:
- Goal:
- Codex changes:
- Files changed:
- Files intentionally not touched:
- Checks run:
- Results:
- Claude review status:
- Human approvals needed:
- Risks:
- Assumptions:
- Next exact prompt:

## Standard Next Prompt

`Implement T-02: Player movement controller on feat/player-movement (branch off dev after T-01 merges). Create client/src/controls/InputMap.js (action map: MoveForward/Back/Left/Right/Jump via keyboard + gamepad, polled per fixedUpdate tick). Create client/src/gameplay/PlayerController.js (Rapier kinematic character controller: WASD movement in XZ plane, jump impulse, gravity, ground detection). Gate all movement on ctx.isControlLocked() returning false. Add Jest tests for InputMap pure action-mapping logic. Run eslint + jest + build — all must pass. Do not implement dodge, stamina, combat, or HUD. Do not commit or push.`

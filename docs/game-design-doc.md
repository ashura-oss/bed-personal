# Realmforge Game Design Document

This is the Track 2 implementation guide for turning Realmforge from a backend-backed RPG web app into a real playable 2D action RPG. CA1/CA2 requirements are already complete; Track 2 must preserve those working systems and build on top of them.

## Product Definition

Realmforge: Shards of the Worldheart is a 2D side-scrolling action RPG browser game backed by the existing Express API. The action layer should feel deliberate and readable: committed attacks, dodge timing, stamina management, parry windows, and boss patterns. It should still use the existing backend for characters, abilities, quests, combo resolution, XP, gold, and adventure logs.

Target feel:
- 16-bit SNES readability.
- Dark fantasy atmosphere.
- Blasphemous-paced combat.
- Browser playable.
- Interview-friendly code.
- No fake screens, no dead buttons, no placeholder systems marked complete.

## Current State

Implemented before Track 2:
- Express backend.
- libSQL and Drizzle schema.
- JWT auth.
- Character CRUD and character creation frontend.
- Region and quest data.
- Adventure attempt progression.
- Adventure logs.
- Ability unlocks.
- Combo resolution.
- Boss quest combo encounters through the existing frontend.

Not implemented yet:
- Phaser game shell.
- Realtime player movement.
- Tilemap exploration.
- Realtime combat.
- Enemy AI.
- Boss action encounter.
- Game-specific automated test suite through `npm test`.

## Tech Stack

- Game engine: Phaser 3, ES modules, no bundler initially.
- Backend: Express 4, libSQL, Drizzle ORM, bcrypt, JWT.
- Frontend app: existing plain HTML/CSS/JS remains available.
- Art: pixel art generated through Canvas API PNG scripts where practical.
- Tilemaps: Tiled JSON exported for Phaser.
- Audio: Phaser audio system using Web Audio API.
- Input: keyboard plus mouse.
- Tests: planned `npm test` script using Node's built-in test runner first, with Playwright-style browser smoke tests only if needed later.

## Runtime Delivery

Planned game URL:
- `http://localhost:3001/game/index.html`

Current Express static serving only serves `frontend/`. The first Track 2 implementation ticket must add a safe static mount for `game/` without breaking existing frontend routes.

Recommended Express shape:
- Keep `/health` and all API routes unchanged.
- Keep existing `frontend/` static root unchanged.
- Add `/game` static mount for the Phaser client.
- Do not move existing CA2 frontend files into `game/`.

## Directory Structure

Planned structure:

```text
game/
  index.html
  config.js
  main.js
  api/
    ApiClient.js
  scenes/
    BootScene.js
    CinematicScene.js
    MainMenuScene.js
    CharacterSelectScene.js
    WorldMapScene.js
    ExplorationScene.js
    CombatScene.js
  systems/
    InputManager.js
    PlayerStateMachine.js
    CombatSystem.js
    ComboResolver.js
    SaveBridge.js
  entities/
    Player.js
    Enemy.js
    Boss.js
    NPC.js
    Projectile.js
  ui/
    HUD.js
    DialogueBox.js
    BossHealthBar.js
    AbilityBar.js
  data/
    regions/
    enemies/
    bosses/
    dialogues/
    maps/
  assets/
    sprites/
    tiles/
    audio/
    ui/
  tools/
    generatePixelAssets.js
tests/
  backend/
  game/
  smoke/
```

Rules:
- Scenes own screen lifecycle.
- Systems own reusable gameplay logic.
- Entities own per-object behaviour and state.
- UI classes own Phaser HUD rendering.
- API wrappers own network calls.
- Data files drive enemies, bosses, regions, and dialogue.
- No game logic belongs inside `index.html`.
- No DOM-specific code belongs inside reusable gameplay systems.

## Scene Flow

Target full flow:

```text
BootScene -> CinematicScene -> MainMenuScene -> CharacterSelectScene -> WorldMapScene -> ExplorationScene <-> CombatScene
```

First playable vertical slice:

```text
BootScene -> MainMenuScene -> CharacterSelectScene -> ExplorationScene
```

The first slice should load one character, one Hearthmere test map, one Hollowborn enemy, one HUD, and one combat result path.

## Controls

Keyboard:
- Move: `A` / `D`
- Jump: `W`, `Space`, or `ArrowUp`
- Light attack: `J`
- Heavy attack: `K`
- Dodge: `L` or `Shift`
- Block / parry: `I`
- Ability slots: `1`, `2`, `3`, `4`
- Ultimate: `Q`
- Interact: `E`
- Pause: `Escape`

Mouse:
- Light attack: left click
- Heavy attack: right click
- Aim or select target: pointer position where useful

Input rules:
- Keyboard and mouse must both work for primary combat.
- Input mapping lives in `InputManager`.
- Player state machine decides whether input is allowed during attack locks, dodge locks, hurt, death, or dialogue.

## Physics Constants

Initial constants:

```js
export const physicsConstants = {
  gravity: 800,
  jumpForce: -350,
  doubleJumpForce: -280,
  moveSpeed: 160,
  dodgeSpeed: 300,
  coyoteTimeMs: 100,
  lightAttackLockMs: 300,
  heavyAttackLockMs: 500,
  dodgeDurationMs: 400,
  dodgeIframesMs: 200,
  parryWindowMs: 150,
  enemyStaggerMs: 1000
};
```

Rules:
- Tune through constants, not magic numbers inside entity code.
- Movement and combat must be deterministic enough to test manually.
- Avoid sub-pixel drift in rendered sprites.

## Player Design

Core player stats:
- HP.
- Stamina.
- Current ability slots.
- Current combo input sequence.
- Invincibility state.
- Parry state.
- Grounded / airborne state.
- Facing direction.

Player states:
- `idle`
- `run`
- `jumpRise`
- `jumpFall`
- `land`
- `lightAttack`
- `heavyAttack`
- `dodge`
- `block`
- `parry`
- `abilityCast`
- `hurt`
- `dead`
- `interact`

Rules:
- Attacks are committed. The player cannot cancel every animation freely.
- Dodge has a 400ms duration and 200ms i-frames at the start.
- Parry succeeds only during a 150ms window.
- Heavy attack has bigger damage and longer lockout.
- Ability casts pull from unlocked backend ability data where possible.

## Combat Design

Combat pacing:
- Deliberate, not spammy.
- Enemy telegraphs matter.
- Dodges and parries should be readable.
- Bosses should punish panic attacks but reward timing.

Damage model for first slice:
- Player light attack: low damage, fast lock.
- Player heavy attack: high damage, slow lock.
- Enemy touch damage should be avoided where possible; use attacks/hitboxes instead.
- Hitboxes are active only during strike frames.

Stamina:
- Light attack costs stamina.
- Heavy attack costs more stamina.
- Dodge costs stamina.
- Block drains stamina while held or on impact.
- Stamina regenerates when idle or moving without attacking/blocking.

I-frames:
- Active only during the first 200ms of dodge.
- Hurt state grants a short recovery invulnerability only if needed after testing.

Parry:
- Tap block to open a 150ms parry window.
- Successful parry staggers enemy for 1s.
- Failed parry becomes normal block or recovery, depending on current state.

## Backend Combo Integration

Existing API:
- `POST /combos/resolve`

Track 2 use:
- Ability slots `1`, `2`, `3`, and `4` map to currently unlocked abilities.
- Action combat can collect a combo sequence locally.
- When a sequence reaches opener -> chain -> finisher, call `/combos/resolve` with:
  - `characterId`
  - `abilityIds`
  - optional `questId` for boss/quest context
- Backend remains source of truth for combo rating, bonuses, and boss reward persistence.

Important:
- Do not duplicate backend reward logic in Phaser.
- Client may predict VFX and damage feel, but final reward/log state must come from backend.
- If action combat needs a new endpoint later, document it first in `docs/api-reference.md`.

## Quest and Progression Integration

Existing sources:
- `GET /auth/me`
- `GET /users/:userId/characters`
- `GET /regions`
- `GET /regions/:regionId/quests`
- `POST /adventures/attempt`
- `POST /combos/resolve`

Planned game bridge:
- `ApiClient` stores and attaches JWT.
- `CharacterSelectScene` loads backend characters.
- `WorldMapScene` loads backend regions and region quests.
- `ExplorationScene` uses selected region/map data.
- `CombatScene` resolves boss combo outcomes.
- `SaveBridge` updates HUD and journal state after API responses.

Rules:
- The existing dashboard frontend remains valid.
- Phaser game should not corrupt backend data.
- Every progression write must have an API response and error handling.

## Enemy Design

Enemies are data-driven JSON configs, not hardcoded behaviour.

Example:

```json
{
  "enemyId": "hollowborn",
  "displayName": "Hollowborn",
  "hp": 40,
  "moveSpeed": 55,
  "aggroRange": 120,
  "attackRange": 28,
  "contactDamage": 0,
  "attacks": [
    {
      "name": "claw",
      "damage": 10,
      "telegraphMs": 450,
      "activeMs": 120,
      "recoveryMs": 500
    }
  ]
}
```

Basic enemy states:
- `idle`
- `patrol`
- `alert`
- `chase`
- `telegraph`
- `attack`
- `stagger`
- `hurt`
- `dead`

## First Boss

First boss:
- Hollowbound Caravan Guard.

Purpose:
- Convert the existing Hearthmere boss quest into a playable action encounter.
- Teach telegraphs, dodge, stamina, and combo finishing.
- Connect to existing `quest_hollowbound_guard`.

Boss phases:
- Phase 1: shield bash and slow sword sweep.
- Phase 2: corrupted lunge and guard-break pulse below 50 percent HP.

Backend finish:
- On victory, send a boss combo resolution or action-combat completion request.
- If using existing `/combos/resolve`, victory requires a valid combo sequence and `questId`.
- If action combat needs HP-based victory without combo sequence, add a new planned route later; do not fake rewards locally.

## Art Pipeline

Reference:
- `docs/pixel-art-style-guide.md`

Required first assets:
- Player idle/run/jump/fall/light attack/dodge/hurt.
- Hollowborn idle/walk/attack/hurt/death.
- Hearthmere tileset.
- Basic slash VFX.
- HUD health/stamina/ability icons.

Generation:
- Use Canvas API asset generation scripts under `game/tools/`.
- Output PNG files to `game/assets/`.
- Keep generator source committed with generated outputs.
- Do not use CSS/SVG mockups as final in-game sprites.

## Audio Plan

Initial audio can be minimal but real:
- Footstep blips.
- Sword swing.
- Hit impact.
- Dodge dust.
- Parry spark.
- Boss hit.
- Boss defeat.
- Ambient Hearthmere loop.

Rules:
- Audio must be optional and not block gameplay.
- Add mute toggle before expanding audio significantly.

## Testing Plan

Add `npm test` in a dedicated ticket before the game grows too large.

Recommended first testing stack:
- Node built-in test runner for backend and pure game rules.
- Lightweight HTTP integration tests that start the Express app on a test port.
- Static file smoke tests for `/game/index.html`, `/game/main.js`, and key assets.

Initial test targets:
- Health endpoint.
- Auth register/login.
- Character read/create.
- Ability unlock.
- Combo resolve.
- Boss combo reward/log persistence.
- Phaser static files served.
- Pure constants/rules import without syntax errors.

Later optional tests:
- Browser smoke test for game boot canvas.
- Pixel canvas nonblank test.
- Input state-machine unit tests.

## Build Order

This is the shipping order. Each ticket must leave the app runnable.

1. `12.1 Action gameplay architecture and art plan` - documentation only.
2. `12.2 Phaser game shell and static serving` - install Phaser, create `/game/index.html`, config, main, BootScene, MainMenuScene, mount `/game`, add first `npm test` smoke.
3. `12.3 Pixel asset pipeline` - generate first player/Hollowborn placeholder-quality-but-real pixel sprites and Hearthmere test tiles using the style guide.
4. `12.4 Player movement vertical slice` - Player entity, InputManager, physics constants, idle/run/jump/fall, camera follow.
5. `12.5 Hearthmere exploration tilemap` - Tiled JSON map, collision layer, spawn points, camera bounds, parallax.
6. `12.6 Combat system v1` - light/heavy attacks, hitboxes, stamina, dodge, i-frames, hurt/death states.
7. `12.7 Hollowborn enemy v1` - data-driven enemy config, patrol/chase/telegraph/attack/hurt/death.
8. `12.8 HUD and ability bar` - health, stamina, selected character, ability slots, backend ability load.
9. `12.9 ComboResolver bridge` - in-game combo input sequence calls existing `/combos/resolve`.
10. `12.10 Hollowbound Caravan Guard boss` - first boss action encounter tied to `quest_hollowbound_guard`.
11. `12.11 WorldMap and CharacterSelect game scenes` - Phaser scenes load real backend characters/regions/quests.
12. `12.12 Save/progression integration` - action encounter rewards/logs flow back into backend and dashboard remains consistent.
13. `12.13 Audio and game feel pass` - real audio hooks, hit pause, camera shake, VFX, screen flash.
14. `12.14 Regression and presentation pass` - browser smoke, npm test, README updates, demo instructions.

## Acceptance Bar

A Track 2 ticket is not complete unless:
- The feature is implemented.
- It is reachable in browser.
- It has no dead buttons.
- It does not break existing CA1/CA2 frontend routes.
- It has at least one relevant command/API/browser check.
- Docs are updated.
- The next ticket is stated.

For action gameplay specifically:
- Canvas must render nonblank.
- Player must be controllable.
- Collision must work.
- Combat must have visible feedback.
- Any reward/progression must come from backend, not fake local state.

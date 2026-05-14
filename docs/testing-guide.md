# Testing Guide

This guide lists planned endpoint tests. Only endpoints marked "Implemented" should be tested as real routes.

Current implementation status:
- Express server foundation is implemented.
- Database seed script is implemented.
- `GET /health` is implemented.
- Users CRUD endpoints are implemented.
- Characters CRUD endpoints are implemented.
- Region read endpoints are implemented.
- Quest CRUD endpoints are implemented.
- Adventure attempt and adventure log endpoints are implemented.
- Ability read and character ability unlock endpoints are implemented.
- CA2 auth endpoints, JWT middleware, bcrypt hashing, and protected route behavior are implemented.
- CA2 dashboard HUD, profile loading, protected dashboard redirect, character summary, region previews, log count, and logout are implemented.
- CA2 character creation frontend is implemented and verified.
- CA2 interactive world map browsing with region-specific quest loading is implemented and verified.
- CA2 quest board and adventure attempt frontend is implemented and verified.
- CA2 adventure log and progression frontend is implemented and verified.
- CA2 combo backend is implemented and verified.
- CA2 ability progression frontend and combo UI are implemented and verified.

CA1 validation status:
- Full backend validation was run on 2026-05-12.
- `npm run db:seed` passed.
- `npm audit --omit=dev` reported zero production vulnerabilities.
- `node --check` passed for all source files.
- `npm start` and `npm run dev` served health checks.
- 81 endpoint checks passed across all implemented CA1 routes.
- Final database counts returned to the seeded baseline after cleanup.

CA2 auth validation status:
- Phase 8.1 backend auth validation was run on 2026-05-12.
- `npm run db:seed` passed and the seeded demo password was confirmed as a bcrypt hash.
- `npm audit --omit=dev` reported zero production vulnerabilities.
- `node --check` passed for all source files.
- `npm start` and `npm run dev` served health checks.
- 29 auth endpoint checks passed.
- Final database counts returned to the seeded baseline after cleanup.

Frontend shell validation status:
- Phase 9.1 frontend shell validation was run on 2026-05-12.
- `node --check` passed for all backend and frontend JavaScript files.
- Static frontend pages and assets were served by Express.
- 21 static checks passed for `/`, page files, CSS, JS, dashboard panels, and internal links.

Frontend auth validation status:
- Phase 9.2 registration and login screen validation was run on 2026-05-12.
- `node --check` passed for all backend and frontend JavaScript files.
- `npm audit --omit=dev` reported zero production vulnerabilities.
- 15 frontend auth checks passed against a live server.
- Checks covered served login/register/dashboard pages, auth form markers, auth JS endpoint wiring, token/user storage code, dashboard redirect code, password clearing code, missing-field friendly message, register success, duplicate username error, login success, wrong password error, and JWT use on `/auth/me`.
- Cleanup returned counts to the seeded baseline.

Dashboard validation status:
- Phase 9.3 player dashboard validation was run on 2026-05-13.
- `node --check` passed for all backend and frontend JavaScript files.
- 26 dashboard checks passed against the live server on `http://localhost:3001`.
- Checks covered served dashboard files, dynamic dashboard targets, `/auth/me`, protected user character reads, protected user adventure log reads, region reads, JWT login, and missing-token `401 Unauthorized`.
- In-app browser validation confirmed demo login redirects to dashboard, profile data renders, the seeded character summary renders, region previews render from backend data, logout redirects to login, direct dashboard access without a token redirects to login, and no browser console errors were present.

Character creation frontend validation status:
- Phase 9.4 character creation validation was run on 2026-05-13.
- `node --check` passed for all backend and frontend JavaScript files.
- In-app browser validation confirmed demo login, navigation to `characterCreation.html`, the five-step creator flow, live stat preview, successful `POST /characters`, redirect back to `dashboard.html`, and display of the created character in the character panel.
- API validation confirmed `characterCreation.html`, `dashboard.js`, and `characterCreationScene.js` were served; auth login issued a token; `/auth/me` returned the demo user; and the frontend-created character persisted in `GET /users/:userId/characters`.
- The temporary `Codex94` test character was deleted through `DELETE /characters/:id` and cleanup was confirmed.

Interactive world map validation status:
- Phase 9.5 interactive world map validation was run on 2026-05-13.
- In-app browser validation confirmed the map panel renders dynamic region nodes, selected state updates, Hearthmere details and quests load by default, clicking Ironvale loads Ironvale region details and quests, and no browser console errors were present.
- API validation confirmed `GET /regions` returned 4 regions and `GET /regions/region_ironvale_city/quests` returned the expected Ironvale quests.

Quest board validation status:
- Phase 9.6 quest board and adventure flow validation was run on 2026-05-13.
- `node --check` passed for all backend and frontend JavaScript files.
- In-app browser validation used a temporary `questFlow` user and character, opened the quest board, displayed quests from the selected region, selected a character, attempted a successful Hearthmere quest, attempted a failed Ironvale quest, and attempted a low-level Ironvale quest that returned the backend level error.
- Validation confirmed HUD XP/gold updates, character XP updates, success/failure result panels, reward popups, refreshed log count, adventure log display, and no browser console errors.
- The temporary `questFlow` test user was deleted through `DELETE /users/:id`, returned `404` afterward, and no `questFlow*` test users remained.

Adventure journal validation status:
- Phase 9.7 adventure log and progression validation was run on 2026-05-13.
- `node --check` passed for `frontend/js/dashboard.js`, `frontend/js/game/logRules.js`, and `src/models/adventureModel.js`.
- API validation created a temporary `testLog` user, character, success boss quest, failure exploration quest, and two adventure attempts.
- Raw `GET /users/:userId/adventure-logs` JSON confirmed joined `questTitle`, `questType`, `regionId`, `regionName`, `characterName`, `characterClassName`, and `characterAffinity` fields.
- In-app browser validation confirmed login, Logs navigation, journey totals, character XP progress, success filter, boss filter, region filter, and character-scoped log loading.
- The temporary `testLog20260513174107` user and temporary test quests were deleted after validation.

Combo backend validation status:
- Phase 10.1 combo battle backend validation was run on 2026-05-13.
- `node --check` passed for `src/app.js`, `src/controllers/comboController.js`, `src/models/comboModel.js`, `src/routes/comboRoutes.js`, and `src/utils/comboRules.js`.
- API validation created a temporary `comboTest` user and Rogue/Shadow character, unlocked `Vanish` and `Shadow Cut`, and resolved `POST /combos/resolve` against `quest_road_that_still_stands`.
- Validation confirmed total power, combo rating, class/affinity/structured/tag bonuses, quest target result, non-persisted reward preview, locked ability rejection, and chain-before-opener rejection.
- The temporary `comboTest20260513181053` user was deleted after validation.

Ability progression frontend validation status:
- Phase 10.2 ability progression frontend validation was run on 2026-05-13.
- `node --check` passed for `src/controllers/abilityController.js`, `src/routes/characterRoutes.js`, `frontend/js/dashboard.js`, and `frontend/js/game/abilityRules.js`.
- `npm audit --omit=dev` reported zero vulnerabilities.
- `npm run db:seed` passed.
- API validation confirmed `GET /characters/:characterId/abilities`, ability unlocks, combo resolution, and cleanup with a temporary Rogue/Shadow character.
- In-app browser validation confirmed login, Abilities navigation, real unlocked/ready/locked ability states, unlocking `Vanish` and `Shadow Cut`, selecting opener/chain combo slots, and resolving a real combo result.
- Cleanup confirmed the demo account returned to one seeded character, `Kael`.

Boss combo gameplay validation status:
- Corrective Phase 10.3 validation was run on 2026-05-13.
- `npm run db:seed` passed and seeded 15 abilities.
- `node --check` passed for all 54 backend and frontend JavaScript files.
- `npm audit --omit=dev` reported zero vulnerabilities.
- API validation created a temporary `bossFlow` user and Ranger/Nature character, leveled the character to the boss requirement, unlocked `Verdant Strike`, `Beastcall`, and `Heartwood Finish`, then resolved `POST /combos/resolve` with `quest_hollowbound_guard`.
- Validation confirmed `outcome=success`, `rewardPreview.isAwarded=true`, XP/gold reward award, user/character progression update, returned `adventureLog`, and one persisted `boss` adventure-log entry.
- In-app browser smoke validation confirmed `login.html` and `dashboard.html` load from the live server, dashboard navigation includes Map/Quests/Abilities/Boss content, and browser console errors were empty.
- The temporary `bossFlow1778675340087` user was deleted after validation.

## General Test Order

1. Install dependencies with `npm install`.
2. Seed database with `npm run db:seed`.
3. Start server with `npm run dev`.
4. Test health/base route if added in Phase 1.
5. Test auth with `/auth/register`, `/auth/login`, and `/auth/me`.
6. Copy the returned token.
7. For protected routes, include `Authorization: Bearer <token>`.
8. Test users.
9. Test characters.
10. Test regions.
11. Test quests.
12. Test adventure attempts.
13. Test abilities.
14. Test frontend shell pages.
15. Test dashboard login, protected redirect, profile rendering, and logout.
16. Test character creation through `characterCreation.html`.
17. Test the dashboard map panel and region-specific quest loading.
18. Test quest board character selection, quest attempts, result display, HUD updates, and log refresh.
19. Test adventure journal totals, timeline, all/success/failure/boss filters, region filter, and character log scope.
20. Test combo resolution with a real character and unlocked abilities.
21. Test ability progression frontend: load unlocked abilities, unlock valid abilities, select combo slots, and resolve combo.
22. Test boss combo flow: start from a boss quest, build a valid combo, resolve it, confirm XP/gold/HUD/log updates, and confirm the boss log appears in the adventure journal.

## Planned Automated Test Suite

Status:
[NOT STARTED]

Goal:
Add a real `npm test` suite before Track 2 Phaser code grows large.

Planned first implementation ticket:
`12.3 Automated test foundation`

Planned command:

```bash
npm test
```

Planned coverage:
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /users/:userId/characters`
- `POST /characters`
- `POST /characters/:characterId/unlock-ability`
- `POST /combos/resolve`
- Boss combo reward/log persistence with `quest_hollowbound_guard`
- Static serving for `/game/index.html` after Track 2 starts
- Syntax/import smoke tests for core `game/` modules

Testing approach:
- Prefer Node's built-in test runner first.
- Keep tests isolated with temporary users and cleanup.
- Use local test ports instead of relying on a manually running dev server.
- Keep browser automation as a later smoke layer unless a ticket specifically needs visual canvas verification.

Do not mark this automated suite as `[COMPLETED]` until `npm test` exists and passes locally.

## CA2 Auth Note

After Phase 8.1, these routes require a valid JWT:
- `GET /auth/me`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`
- `GET /users/:userId/characters`
- `GET /users/:userId/adventure-logs`
- `POST /characters`
- `GET /characters/:id`
- `PUT /characters/:id`
- `DELETE /characters/:id`
- `GET /characters/:characterId/adventure-logs`
- `GET /characters/:characterId/abilities`
- `POST /characters/:characterId/unlock-ability`
- `POST /combos/resolve`
- `POST /quests`
- `PUT /quests/:id`
- `DELETE /quests/:id`
- `POST /adventures/attempt`

Header:

```http
Authorization: Bearer <token>
```

## Implemented Phase 9.1 Frontend Shell Tests

### Serve frontend shell

Status:
[TESTED]

Command:

```powershell
npm run dev
```

Requests:

```http
GET /
GET /index.html
GET /login.html
GET /register.html
GET /dashboard.html
```

Expected:
- `200 OK`
- Each page contains the Realmforge shell.

Confirmed on 2026-05-12.

## Implemented Phase 9.2 Frontend Auth Tests

### Register through frontend auth wiring

Status:
[TESTED]

Screen:
`/register.html`

Backend request:

```http
POST /auth/register
Content-Type: application/json

{
  "username": "frontendAuthExample",
  "password": "front-test-password"
}
```

Expected:
- `201 Created`
- Response includes JWT token.
- Response does not include password.
- Frontend stores token and user.
- Frontend redirects to `dashboard.html`.

Confirmed on 2026-05-12.

### Login through frontend auth wiring

Status:
[TESTED]

Screen:
`/login.html`

Backend request:

```http
POST /auth/login
Content-Type: application/json

{
  "username": "demoUnbound",
  "password": "demo-password-ca1"
}
```

Expected:
- `200 OK`
- Response includes JWT token.
- Response does not include password.
- Frontend stores token and user.
- Frontend redirects to `dashboard.html`.

Confirmed on 2026-05-12.

### Auth error states

Status:
[TESTED]

Expected:
- Missing username/password shows a local user-friendly message.
- Duplicate username returns `409 Conflict` and shows a user-friendly message.
- Wrong password returns `401 Unauthorized` and shows a user-friendly message.
- Password field clears after submission.

Confirmed on 2026-05-12.

## Implemented Phase 9.3 Dashboard Tests

### Dashboard protected route behavior

Status:
[TESTED]

Screen:
`/dashboard.html`

Expected:
- No stored token redirects the browser to `/login.html`.
- Login page displays a clear login-required message.
- Invalid or expired tokens clear the session and redirect to `/login.html`.

Confirmed on 2026-05-13.

### Dashboard profile and HUD data

Status:
[TESTED]

Backend requests:

```http
GET /auth/me
Authorization: Bearer <token>

GET /users/:userId/characters
Authorization: Bearer <token>

GET /users/:userId/adventure-logs
Authorization: Bearer <token>

GET /regions
```

Expected:
- Dashboard displays username, level, XP progress, total XP, and gold.
- Dashboard displays current character summary from the saved character records.
- Dashboard displays region preview cards from real region data.
- Dashboard displays character, region, and log counts.

Confirmed on 2026-05-13.

### Dashboard logout

Status:
[TESTED]

Expected:
- Logout clears local auth state.
- Browser redirects to `/login.html`.
- Login page displays a logout message.

Confirmed on 2026-05-13.

### Serve frontend assets

Status:
[TESTED]

Requests:

```http
GET /css/global.css
GET /css/game-ui.css
GET /css/animations.css
GET /js/api.js
GET /js/auth.js
GET /js/ui.js
GET /js/state.js
GET /js/animations/waapi.js
GET /js/animations/particles.js
```

Expected:
- `200 OK`

Confirmed on 2026-05-12.

### Dashboard navigation targets

Status:
[TESTED]

Checked targets:
- `#overview`
- `#character`
- `#map`
- `#quests`
- `#abilities`
- `#logs`

Expected:
- Each target exists in `frontend/dashboard.html`.
- Internal page links resolve to existing served files.

Confirmed on 2026-05-12.

## Implemented Phase 9.4 Character Creation Frontend Tests

### Hero forge page and assets

Status:
[TESTED]

Requests:

```http
GET /characterCreation.html
GET /js/scenes/characterCreationScene.js
GET /js/game/characterRules.js
GET /js/game/gameState.js
```

Expected:
- `200 OK`
- Page requires an existing JWT session before allowing character creation.

Confirmed on 2026-05-13.

### Create character through frontend

Status:
[TESTED]

Browser flow:
1. Login with the seeded demo account.
2. Open `dashboard.html`.
3. Click `Forge Hero`.
4. Select origin, class, affinity, and character name.
5. Review the live stat preview.
6. Click `Forge Hero`.

Expected:
- Frontend submits `POST /characters` with the stored JWT.
- Backend recalculates and saves stats.
- Browser redirects to `dashboard.html`.
- Created character appears in the character panel.
- Errors show through the shared alert system.

Confirmed on 2026-05-13 with a temporary `Codex94` character, then cleaned up through `DELETE /characters/:id`.

## Implemented Phase 9.5 Interactive World Map Tests

### Region nodes and details

Status:
[TESTED]

Backend requests:

```http
GET /regions
GET /regions/:regionId/quests
```

Browser flow:
1. Login with the seeded demo account.
2. Open `dashboard.html#map`.
3. Confirm region nodes render from `GET /regions`.
4. Confirm Hearthmere details and quests load by default.
5. Click `Ironvale City`.
6. Confirm Ironvale details and quests replace the panel content.

Expected:
- Region cards and map nodes are generated from real backend records.
- Selected region state updates on map nodes and region cards.
- Region detail shows name, description, danger level, recommended level, faction, shard name, and available quests.
- Region quests load through `GET /regions/:regionId/quests`.
- Loading, empty, and error states are handled by the dashboard map UI.

Confirmed on 2026-05-13.

## Implemented Phase 9.6 Quest Board Tests

### Quest board and attempt flow

Status:
[TESTED]

Backend requests:

```http
GET /users/:userId/characters
GET /regions/:regionId/quests
POST /adventures/attempt
GET /users/:userId/adventure-logs
```

Browser flow:
1. Login with a user that owns at least one character.
2. Open `dashboard.html#quests`.
3. Select a region contract set.
4. Select a character.
5. Attempt a quest.
6. Review success/failure result, XP/gold rewards, and updated HUD values.
7. Open Logs and confirm the new adventure records appear.

Expected:
- Quest cards are rendered from real backend quest records.
- `POST /adventures/attempt` is called with the selected user, character, and quest.
- Success results show story text, XP, gold, score, and progression.
- Failure results show story text, partial XP, zero gold, score, and progression.
- Low-level backend errors render as a clear blocked quest message.
- Adventure logs refresh after successful backend writes.

Confirmed on 2026-05-13 with a temporary `questFlow` user, then cleaned up through `DELETE /users/:id`.

## Implemented Phase 9.7 Adventure Journal Tests

### Adventure log and progression screen

Status:
[TESTED]

Backend requests:

```http
GET /users/:userId/adventure-logs
GET /characters/:characterId/adventure-logs
```

Browser flow:
1. Login with a user that owns at least one character and adventure log.
2. Open `dashboard.html#logs`.
3. Confirm journey totals, success/failure/boss counts, XP earned, and gold earned.
4. Confirm character level progress renders from real character data.
5. Use the all, success, failure, boss, region, and hero filters.

Expected:
- Timeline entries show quest title, date, outcome, region, quest type, character, story result, XP, and gold.
- User log endpoint and character log endpoint both return joined quest, region, and character metadata.
- Filters update the visible timeline without fake records.
- Empty/loading/error states remain visible and game-styled.

Confirmed on 2026-05-13 with a temporary `testLog` user, then cleaned up through `DELETE /users/:id` and `DELETE /quests/:id`.

## Implemented Phase 10.1 Combo Backend Tests

### Combo resolve flow

Status:
[TESTED]

Backend requests:

```http
POST /characters/:characterId/unlock-ability
POST /combos/resolve
```

Example request:

```json
{
  "characterId": "char_00000000-0000-0000-0000-000000000000",
  "abilityIds": ["ability_vanish", "ability_shadow_cut"],
  "questId": "quest_road_that_still_stands"
}
```

Expected:
- Route requires `Authorization: Bearer <token>`.
- Character must belong to the token user.
- Every selected ability must already be unlocked by that character.
- Chain abilities must come after an opener.
- Finisher or ultimate abilities must be the final ability when used.
- Response includes total power, total damage, combo rating, triggered bonuses, target result, and narration text.
- Non-boss quest reward previews are not persisted or awarded by this route.
- Boss quest targets are persisted: rewards are awarded, progression is updated, and an adventure log is written.

Confirmed on 2026-05-13 with a temporary `comboTest` user, then cleaned up through `DELETE /users/:id`.

## Implemented Phase 10.2 Ability Progression Frontend Tests

### Ability board and combo UI

Status:
[TESTED]

Backend requests:

```http
GET /abilities
GET /characters/:characterId/abilities
POST /characters/:characterId/unlock-ability
POST /combos/resolve
```

Browser flow:
1. Login with `demoUnbound` / `demo-password-ca1`.
2. Open `dashboard.html#abilities`.
3. Select a Rogue/Shadow test character.
4. Unlock `Vanish` and `Shadow Cut`.
5. Place `Vanish` in Opener and `Shadow Cut` in Chain.
6. Resolve the combo.

Expected:
- Ability cards come from real `GET /abilities` data.
- Unlocked state comes from real `GET /characters/:characterId/abilities` data.
- Unlock buttons call `POST /characters/:characterId/unlock-ability`.
- Resolve button calls `POST /combos/resolve`.
- Result panel displays rating, total damage, total power, bonuses, and narration from the backend.
- Temporary test character is deleted after validation.

Confirmed on 2026-05-13 with a temporary Rogue/Shadow character. Cleanup returned the demo account to one seeded character, `Kael`.

## Implemented Phase 1 Tests

### Seed database

Status:
[TESTED]

Command:

```powershell
npm run db:seed
```

Expected:
- Script exits successfully.
- `realmforge.db` is created locally when using the default `LIBSQL_URL`.
- Output confirms 4 regions, 8 quests, and 12 abilities.

Confirmed on 2026-05-12:
- `users=1`
- `characters=1`
- `regions=4`
- `quests=8`
- `abilities=12`
- `character_abilities=1`

### Start server with npm start

Status:
[TESTED]

Command:

```powershell
$env:PORT = "3062"
npm start
```

Expected:
- Server starts.
- `GET /health` returns `200 OK`.

Confirmed on 2026-05-12:
- `GET /health` returned `200`.

### Start server with npm run dev

Status:
[TESTED]

Command:

```powershell
$env:PORT = "3063"
npm run dev
```

Expected:
- Nodemon starts the server.
- `GET /health` returns `200 OK`.

Confirmed on 2026-05-12:
- `GET /health` returned `200`.

### Health check

Status:
[TESTED]

Request:

```http
GET /health
```

Expected:
- `200 OK`

Example response:

```json
{
  "status": "ok",
  "project": "Realmforge: Shards of the Worldheart",
  "database": "connected"
}
```

### Not found route

Status:
[TESTED]

Request:

```http
GET /nope
```

Expected:
- `404 Not Found`

Confirmed response:

```json
{
  "error": "Not Found",
  "message": "No route found for GET /nope"
}
```

## Implemented CA1 User Tests

### Create user

Status:
[TESTED]

Request:

```http
POST /users
Content-Type: application/json

{
  "username": "ashwarden",
  "password": "test123"
}
```

Expected:
- `201 Created`
- Response includes user id and username.
- Response does not include password.

Confirmed on 2026-05-12:
- `201 Created`
- Response did not include password.

### Get users

Status:
[TESTED]

Request:

```http
GET /users
```

Expected:
- `200 OK`
- Response is an array.
- Passwords are not returned.

Confirmed on 2026-05-12:
- `200 OK`
- Response was an array.
- Response did not include password.

### Get users by level query

Status:
[TESTED]

Request:

```http
GET /users?level=1
```

Expected:
- `200 OK`
- Response is an array filtered by level.

Confirmed on 2026-05-12:
- `GET /users?level=1` returned `200 OK`.
- `GET /users?level=abc` returned `400 Bad Request`.

### Get user by id

Status:
[TESTED]

Request:

```http
GET /users/{userId}
```

Expected:
- `200 OK` when found.
- `404 Not Found` when missing.

Confirmed on 2026-05-12:
- Existing user returned `200 OK`.
- Missing user returned `404 Not Found`.

### Update user

Status:
[TESTED]

Request:

```http
PUT /users/{userId}
Content-Type: application/json

{
  "username": "worldheartSeeker"
}
```

Expected:
- `200 OK` when updated.
- `400 Bad Request` for invalid body.
- `404 Not Found` when missing.
- `409 Conflict` if username is already taken.

Confirmed on 2026-05-12:
- Updating `username`, `level`, `xp`, and `gold` returned `200 OK`.
- Duplicate username returned `409 Conflict`.

### Delete user

Status:
[TESTED]

Request:

```http
DELETE /users/{userId}
```

Expected:
- `204 No Content` when deleted.
- `404 Not Found` when missing.

Confirmed on 2026-05-12:
- First delete returned `204 No Content`.
- Repeating delete for the same id returned `404 Not Found`.

### Create duplicate user

Status:
[TESTED]

Request:

```http
POST /users
Content-Type: application/json

{
  "username": "existingUsername",
  "password": "abc123"
}
```

Expected:
- `409 Conflict`

Confirmed on 2026-05-12:

```json
{
  "error": "Conflict",
  "message": "Username is already taken."
}
```

### Missing username validation

Status:
[TESTED]

Request:

```http
POST /users
Content-Type: application/json

{
  "password": "abc123"
}
```

Expected:
- `400 Bad Request`

Confirmed on 2026-05-12:

```json
{
  "error": "Bad Request",
  "message": "username is required and must be a non-empty string."
}
```

### Bad JSON validation

Status:
[TESTED]

Request:

```http
POST /users
Content-Type: application/json

{bad json
```

Expected:
- `400 Bad Request`

Confirmed on 2026-05-12:
- Error response used the consistent JSON error shape.

## Implemented Character Tests

### Create character

Status:
[TESTED]

Request:

```http
POST /characters
Content-Type: application/json

{
  "userId": "{userId}",
  "characterName": "Kael",
  "origin": "Village Hunter",
  "className": "Ranger",
  "affinity": "Nature"
}
```

Expected:
- `201 Created`
- Character is linked to the user.
- Stats are calculated by server rules.

Confirmed on 2026-05-12:
- `201 Created`
- Character was linked to the provided user id.
- `Street Thief` + `Rogue` + `Shadow` produced calculated stats.

### Filter characters by class

Status:
[TESTED]

Request:

```http
GET /characters?className=Mage
```

Expected:
- `200 OK`
- Response contains only Mage characters.

Confirmed on 2026-05-12:
- `GET /characters?className=Rogue` returned `200 OK`.
- `GET /characters?className=Jester` returned `400 Bad Request`.

### Get all characters

Status:
[TESTED]

Request:

```http
GET /characters
```

Expected:
- `200 OK`
- Response is an array.

Confirmed on 2026-05-12.

### Get character by id

Status:
[TESTED]

Request:

```http
GET /characters/{characterId}
```

Expected:
- `200 OK` when found.
- `404 Not Found` when missing.

Confirmed on 2026-05-12.

### Get characters by user id

Status:
[TESTED]

Request:

```http
GET /users/{userId}/characters
```

Expected:
- `200 OK` when user exists.
- `404 Not Found` when user does not exist.

Confirmed on 2026-05-12.

### Update character

Status:
[TESTED]

Request:

```http
PUT /characters/{characterId}
Content-Type: application/json

{
  "characterName": "Mira Worldshade",
  "className": "Spellblade",
  "affinity": "Fire"
}
```

Expected:
- `200 OK`
- Character fields update.
- Stats recalculate when origin, className, or affinity changes.

Confirmed on 2026-05-12.

### Delete character

Status:
[TESTED]

Request:

```http
DELETE /characters/{characterId}
```

Expected:
- `204 No Content` when deleted.
- `404 Not Found` when missing.

Confirmed on 2026-05-12.

### Invalid character origin

Status:
[TESTED]

Request:

```http
POST /characters
Content-Type: application/json

{
  "userId": "{userId}",
  "characterName": "Bad Origin",
  "origin": "Banana Knight",
  "className": "Mage",
  "affinity": "Arcane"
}
```

Expected:
- `400 Bad Request`
- Response includes allowed values.

Confirmed on 2026-05-12.

### Character create with missing user

Status:
[TESTED]

Request:

```http
POST /characters
Content-Type: application/json

{
  "userId": "user_missing",
  "characterName": "No Owner",
  "origin": "Mercenary",
  "className": "Warrior",
  "affinity": "Fire"
}
```

Expected:
- `404 Not Found`

Confirmed on 2026-05-12.

## Implemented Region and Quest Tests

### Get regions

Status:
[TESTED]

Request:

```http
GET /regions
```

Expected:
- `200 OK`
- At least seeded regions are returned after seeding.

Confirmed on 2026-05-12:
- `GET /regions` returned `200 OK`.
- Seeded regions included Hearthmere Outpost, Ironvale City, Blackroot Forest, and Sunken Temple.

### Filter regions by danger level

Status:
[TESTED]

Request:

```http
GET /regions?dangerLevel=3
```

Expected:
- `200 OK`
- Response contains only regions with danger level 3.

Confirmed on 2026-05-12:
- `GET /regions?dangerLevel=3` returned `200 OK`.
- `GET /regions?dangerLevel=bad` returned `400 Bad Request`.

### Get region by id

Status:
[TESTED]

Request:

```http
GET /regions/region_hearthmere_outpost
```

Expected:
- `200 OK` when found.
- `404 Not Found` when missing.

Confirmed on 2026-05-12:
- Existing region returned `200 OK`.
- `GET /regions/region_missing` returned `404 Not Found`.

### Get quests in a region

Status:
[TESTED]

Request:

```http
GET /regions/{regionId}/quests
```

Expected:
- `200 OK`
- Response includes quests for that region.

Confirmed on 2026-05-12:
- `GET /regions/region_hearthmere_outpost/quests` returned `200 OK`.

### Get quests

Status:
[TESTED]

Request:

```http
GET /quests
```

Expected:
- `200 OK`
- Response is an array.

Confirmed on 2026-05-12:
- `GET /quests` returned `200 OK`.

### Get quest by id

Status:
[TESTED]

Request:

```http
GET /quests/quest_road_that_still_stands
```

Expected:
- `200 OK` when found.
- `404 Not Found` when missing.

Confirmed on 2026-05-12:
- Existing seeded quest returned `200 OK`.

### Create quest

Status:
[TESTED]

Request:

```http
POST /quests
Content-Type: application/json

{
  "regionId": "{regionId}",
  "title": "Test Quest",
  "description": "A small test quest.",
  "questType": "combat",
  "requiredLevel": 1,
  "difficulty": 1,
  "requiredStat": "strength",
  "requiredStatValue": 5,
  "rewardXp": 20,
  "rewardGold": 10,
  "successText": "You cleared the path.",
  "failureText": "The path remains dangerous."
}
```

Expected:
- `201 Created`

Confirmed on 2026-05-12:
- Temporary quest creation returned `201 Created`.

### Update quest

Status:
[TESTED]

Request:

```http
PUT /quests/{questId}
Content-Type: application/json

{
  "title": "Updated Quest Title",
  "questType": "lore",
  "requiredStat": "intelligence",
  "requiredStatValue": 6,
  "rewardGold": 12
}
```

Expected:
- `200 OK`
- Updated quest is returned.

Confirmed on 2026-05-12:
- Temporary quest update returned `200 OK`.

### Delete quest

Status:
[TESTED]

Request:

```http
DELETE /quests/{questId}
```

Expected:
- `204 No Content` when deleted.
- `404 Not Found` when missing.

Confirmed on 2026-05-12:
- First delete for the temporary quest returned `204 No Content`.
- Repeating delete for the same quest returned `404 Not Found`.
- Database row count returned to 8 seeded quests.

### Invalid quest required stat

Status:
[TESTED]

Request:

```http
POST /quests
Content-Type: application/json

{
  "regionId": "region_hearthmere_outpost",
  "title": "Invalid Stat Quest",
  "description": "This should fail.",
  "questType": "combat",
  "requiredLevel": 1,
  "difficulty": 1,
  "requiredStat": "luck",
  "requiredStatValue": 5,
  "rewardXp": 10,
  "rewardGold": 5,
  "successText": "Unexpected success.",
  "failureText": "Expected failure."
}
```

Expected:
- `400 Bad Request`
- Response includes allowed stat values.

Confirmed on 2026-05-12.

### Create quest with missing region

Status:
[TESTED]

Request:

```http
POST /quests
Content-Type: application/json

{
  "regionId": "region_missing",
  "title": "Missing Region Quest",
  "description": "This should fail.",
  "questType": "combat",
  "requiredLevel": 1,
  "difficulty": 1,
  "requiredStat": "strength",
  "requiredStatValue": 5,
  "rewardXp": 10,
  "rewardGold": 5,
  "successText": "Unexpected success.",
  "failureText": "Expected failure."
}
```

Expected:
- `404 Not Found`

Confirmed on 2026-05-12.

## Implemented Adventure Tests

Status:
[TESTED]

Request:

```http
POST /adventures/attempt
Content-Type: application/json

{
  "userId": "{userId}",
  "characterId": "{characterId}",
  "questId": "{questId}"
}
```

Expected:
- `200 OK`
- Validates ownership.
- Returns outcome, XP, gold, level changes, and story result.
- Creates an adventure log.

Confirmed on 2026-05-12:
- Temporary user creation returned `201 Created`.
- Temporary character creation returned `201 Created`.
- Temporary quest creation returned `201 Created`.
- `POST /adventures/attempt` returned `200 OK`.
- Successful attempt returned `outcome: "success"`.
- Character gained XP, reached level 2 after 125 XP, and HP increased from 100 to 110.
- User gained XP, gold, and level progression.
- Temporary test data cleanup returned the database to `users=1`, `characters=1`, `quests=8`, and `adventure_logs=0`.

### Get adventure logs by user

Status:
[TESTED]

Request:

```http
GET /users/{userId}/adventure-logs
```

Expected:
- `200 OK` when user exists.
- Response is an array of adventure logs.
- `404 Not Found` when user does not exist.

Confirmed on 2026-05-12:
- Existing temporary user returned `200 OK` with 1 log.
- Missing user returned `404 Not Found`.

### Get adventure logs by character

Status:
[TESTED]

Request:

```http
GET /characters/{characterId}/adventure-logs
```

Expected:
- `200 OK` when character exists.
- Response is an array of adventure logs.
- `404 Not Found` when character does not exist.

Confirmed on 2026-05-12:
- Existing temporary character returned `200 OK` with 1 log.
- Missing character returned `404 Not Found`.

### Adventure level gate

Status:
[TESTED]

Request:

```http
POST /adventures/attempt
Content-Type: application/json

{
  "userId": "{userId}",
  "characterId": "{characterId}",
  "questId": "quest_oracle_below"
}
```

Expected:
- `400 Bad Request` if the character level is below the quest required level.

Confirmed on 2026-05-12.

### Adventure failure outcome

Status:
[TESTED]

Request:

```http
POST /adventures/attempt
Content-Type: application/json

{
  "userId": "{userId}",
  "characterId": "{characterId}",
  "questId": "{highRequiredStatQuestId}"
}
```

Expected:
- `200 OK`
- `outcome` is `failure`.
- Character receives small XP.
- User receives no gold.
- Adventure log is created.

Confirmed on 2026-05-12:
- Valid failed quest attempt returned `200 OK`.
- Response returned `outcome: "failure"`.
- Failure reward was 10 XP and 0 gold for a difficulty 2 temporary quest.
- Temporary test data cleanup returned the database to `users=1`, `characters=1`, `quests=8`, and `adventure_logs=0`.

### Adventure ownership validation

Status:
[TESTED]

Request:

```http
POST /adventures/attempt
Content-Type: application/json

{
  "userId": "user_demo_unbound",
  "characterId": "{characterIdOwnedByAnotherUser}",
  "questId": "{questId}"
}
```

Expected:
- `400 Bad Request`
- Error explains that the character does not belong to the provided user.

Confirmed on 2026-05-12.

### Adventure missing quest validation

Status:
[TESTED]

Request:

```http
POST /adventures/attempt
Content-Type: application/json

{
  "userId": "{userId}",
  "characterId": "{characterId}",
  "questId": "quest_missing"
}
```

Expected:
- `404 Not Found`

Confirmed on 2026-05-12.

## Implemented Ability Tests

### Get abilities

Status:
[TESTED]

Request:

```http
GET /abilities
```

Expected:
- `200 OK`
- Response includes 12 seeded abilities after seeding.

Confirmed on 2026-05-12.

### Get abilities by class

Request:

```http
GET /abilities?className=Mage
```

Expected:
- `200 OK`
- Response includes only Mage abilities.

Confirmed on 2026-05-12.

### Get abilities by affinity

Status:
[TESTED]

Request:

```http
GET /abilities?affinity=Fire
```

Expected:
- `200 OK`
- Response includes Fire affinity abilities.

Confirmed on 2026-05-12.

### Get abilities by class and affinity

Status:
[TESTED]

Request:

```http
GET /abilities?className=Mage&affinity=Arcane
```

Expected:
- `200 OK`
- Response includes Mage Arcane abilities.

Confirmed on 2026-05-12.

### Invalid ability filters

Status:
[TESTED]

Requests:

```http
GET /abilities?className=Jester
GET /abilities?affinity=Void
```

Expected:
- `400 Bad Request`

Confirmed on 2026-05-12.

### Unlock ability

Status:
[TESTED]

Request:

```http
POST /characters/{characterId}/unlock-ability
Content-Type: application/json

{
  "abilityId": "{abilityId}"
}
```

Expected:
- `201 Created`
- Ability is unlocked only if requirements are met.

Confirmed on 2026-05-12:
- Rogue Shadow character successfully unlocked `ability_vanish`.
- Response included `characterAbility` and `ability`.
- Cleanup returned `character_abilities=1`, the seeded baseline.

### Duplicate ability unlock

Status:
[TESTED]

Request:

```http
POST /characters/{characterId}/unlock-ability
Content-Type: application/json

{
  "abilityId": "ability_vanish"
}
```

Expected:
- `409 Conflict` when the character already has the ability.

Confirmed on 2026-05-12.

### Ability unlock validation

Status:
[TESTED]

Requests:

```http
POST /characters/{characterId}/unlock-ability
Content-Type: application/json

{
  "abilityId": "ability_ash_step"
}
```

```http
POST /characters/{characterId}/unlock-ability
Content-Type: application/json

{
  "abilityId": "ability_smite"
}
```

```http
POST /characters/{characterId}/unlock-ability
Content-Type: application/json

{
  "abilityId": "ability_quickstep"
}
```

Expected:
- `400 Bad Request` for low character level.
- `400 Bad Request` for className mismatch.
- `400 Bad Request` for affinity mismatch.

Confirmed on 2026-05-12.

### Ability unlock missing resources

Status:
[TESTED]

Requests:

```http
POST /characters/{characterId}/unlock-ability
Content-Type: application/json

{
  "abilityId": "ability_missing"
}
```

```http
POST /characters/char_missing/unlock-ability
Content-Type: application/json

{
  "abilityId": "ability_vanish"
}
```

Expected:
- `404 Not Found` for missing ability.
- `404 Not Found` for missing character.

Confirmed on 2026-05-12.

### Ability unlock missing body field

Status:
[TESTED]

Request:

```http
POST /characters/{characterId}/unlock-ability
Content-Type: application/json

{}
```

Expected:
- `400 Bad Request`

Confirmed on 2026-05-12.

## Implemented Phase 8.1 Auth Tests

### Register

Status:
[TESTED]

```http
POST /auth/register
Content-Type: application/json

{
  "username": "newPlayer",
  "password": "strongPassword123"
}
```

Expected:
- `201 Created`
- Password is stored as bcrypt hash.
- Password is not returned.
- Response includes JWT token.

Confirmed on 2026-05-12.

### Login

Status:
[TESTED]

```http
POST /auth/login
Content-Type: application/json

{
  "username": "newPlayer",
  "password": "strongPassword123"
}
```

Expected:
- `200 OK`
- Response includes JWT token.
- Password is not returned.

Confirmed on 2026-05-12.

### Get current user

Status:
[TESTED]

```http
GET /auth/me
Authorization: Bearer <token>
```

Expected:
- `200 OK`
- Response contains the authenticated public user profile.
- Response does not include password.

Confirmed on 2026-05-12.

### Protected route without token

Status:
[TESTED]

Examples:

```http
GET /auth/me
```

```http
POST /characters
Content-Type: application/json

{
  "userId": "user_demo_unbound",
  "characterName": "Auth Sentinel",
  "origin": "Mercenary",
  "className": "Warrior",
  "affinity": "Fire"
}
```

Expected:
- `401 Unauthorized` when token is missing, malformed, invalid, or expired.
- `403 Forbidden` when the token belongs to a different user.

Confirmed on 2026-05-12:
- Missing token checks returned `401 Unauthorized`.
- Wrong-owner token checks returned `403 Forbidden`.

### Protected gameplay flow

Status:
[TESTED]

Tested order:
1. Register temporary user A.
2. Register temporary user B.
3. Login user A.
4. Confirm user B cannot access user A routes.
5. Create a character for user A with user A token.
6. Attempt a quest with user A token.
7. Read user A adventure logs with user A token.
8. Unlock an ability for user A's character with user A token.
9. Create, update, and delete a temporary quest with a token.
10. Delete temporary character and users.

Confirmed on 2026-05-12:
- 29 auth endpoint checks passed.
- Cleanup returned counts to the seeded baseline:
  - `users=1`
  - `characters=1`
  - `regions=4`
  - `quests=8`
  - `adventure_logs=0`
  - `abilities=12`
  - `character_abilities=1`

## CA2 Frontend Manual Test Checklist (Phase 11.5)

Run `npm run db:seed` then `npm run dev`. Open `http://localhost:3000`.

Loading screen (Phase 11.1):
1. Open any page (index, login, register, dashboard, characterCreation).
2. Confirm the pulsing shard + rotating lore lines appear briefly, then fade out before content is usable.

Auth flow:
1. Register a new user → confirm the dashboard opens.
2. Logout, then login as `demoUnbound` / `demo-password-ca1` → confirm the dashboard opens.
3. Submit a wrong password → confirm the friendly error appears.

Dashboard HUD + map (Phase 9.3 / 11.4):
1. Confirm the HUD shows username, level, gold, XP fill, and totals from `/auth/me`.
2. Open the Map panel; hover over each map node and confirm the tooltip shows danger + recommended level.
3. Click a region; confirm the selected node pulses and the detail panel + quests render.

Character Edit / Delete (new):
1. Open the Character panel.
2. Click **Edit** on a hero. Inline form appears with current name.
3. Try saving an empty name → confirm the inline validation message.
4. Save a valid new name → confirm the card re-renders with the new name and an alert says "renamed".
5. Click **Delete** on a temporary hero. Confirm the "Dismiss this hero forever?" prompt.
6. Confirm the card fades out, the HUD hero count drops by 1, and the alert says "dismissed".
7. Try Edit/Delete with an expired token (clear localStorage manually) → confirm a 401 redirect to login with a flash message.

Quest board / boss flow (Phase 9.6 / 10.3):
1. Pick a region, pick a hero, attempt a regular quest → confirm result panel + XP/gold popups + HUD refresh.
2. Start a boss quest such as `Hollowbound Guard` → confirm the Quest Board opens the combo boss flow instead of the regular stat-check attempt.
3. Build a valid opener/chain/finisher combo, strike the boss, and confirm the boss visual treatment, reward award, HUD refresh, and persisted `boss` log entry.

Ability + combo (Phase 10.2):
1. Open Abilities, pick a character, unlock an ability the hero qualifies for.
2. Place opener/chain/finisher into combo slots and click Resolve Combo → confirm the result panel with rating, damage, and triggered bonuses.
3. When the Abilities panel was opened from a boss quest, confirm the button says `Strike Boss` and the result panel shows victory/defeat, rewards, and log navigation.

Logs (Phase 9.7):
1. Open Logs; filter by success, failure, boss, region, and hero → confirm the timeline updates from real backend data.

Polish (Phase 11.2, 11.3, 11.5):
1. Confirm ambient particles drift on every page, pause on tab-hide (use DevTools), and stop entirely under `prefers-reduced-motion`.
2. Confirm all card entrances, reward popups, and quest-result glows go through `frontend/js/animations/waapi.js` (no scattered `element.animate(...)` outside shared helpers, aside from the character delete fade which calls a shared helper-style block).
3. Resize the browser to a narrow viewport → confirm the responsive layout collapses cleanly with no horizontal scroll.

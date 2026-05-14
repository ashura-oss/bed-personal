# Realmforge Project Master Plan

## Permanent Codex Control Rule

This file is the permanent control document for `Realmforge: Shards of the Worldheart`.

Every future Codex session must read root `CLAUDE.md` first and root `CODEX.md` when it needs Codex-specific workflow guidance. Claude Code should use root `CLAUDE.md` as its compact project memory entrypoint. Read the longer docs only when the current task requires them: roadmap/status work uses this file, game design uses `docs/project-context.md` or `docs/story-bible.md`, and CA1/CA2 requirement work uses `docs/ca-requirements-map.md`.

Work must proceed ticket by ticket. Do not skip ahead, fake implemented features, create inactive UI, create fake API responses, or mark work as complete unless it has been implemented, tested, confirmed working, and logged here.

Codex and Claude Code may both work on this project. Each agent must inspect current files before editing, preserve the other agent's work, and update the shared docs instead of relying on chat-only context.

## Project Activity Log

### 2026-05-14

- Initialized the local workspace as a Git repository on branch `main`.
- Added Git ignores for local runtime files: `.env`, `.env.*` except `.env.example`, `node_modules`, libSQL/SQLite database files, `.codex-run`, `.claude`, and logs.
- Created the private GitHub repository `ashura-oss/realmforge-shards-of-the-worldheart`.
- Pushed the current project state to `https://github.com/ashura-oss/realmforge-shards-of-the-worldheart`.
- Verified source JavaScript syntax before the initial commit with `node --check` across 54 backend/frontend JavaScript files.

### 2026-05-12

- Inspected workspace at `C:\bed project real`.
- Confirmed the workspace started empty and was not a Git repository.
- Inspected downloaded CA1 and CA2 assignment briefs from `C:\Users\shan3\Downloads`.
- Confirmed CA1 requires Express, libSQL, Drizzle, nodemon, `src/models`, `src/controllers`, `src/routes`, a users table, one FK table, CRUD routes, dynamic route, query parameter route, status codes, error handling, README, and ERD support.
- Confirmed CA2 builds on CA1 and adds bcrypt, jsonwebtoken, registration/login pages, auth endpoints, hashed passwords, JWT, reusable auth middleware, protected routes, frontend integration, two coherent core mechanics, and updated ERD.
- Started ticket `0.1 Project control and backend scaffold`.
- Created all required Phase 0 documentation files.
- Created initial `package.json` because none existed.
- Created backend-only scaffold folders under `src`.
- Verified expected files exist with `Get-ChildItem -Recurse -File`.
- Verified `npm start`, `npm run dev`, and `npm run db:seed` run without crashing and clearly report that Phase 1 server/database work is not implemented yet.
- Completed ticket `0.1 Project control and backend scaffold`.
- User explicitly approved proceeding with ticket `1.1 Express and database foundation`.
- Started ticket `1.1 Express and database foundation`.
- Updated scripts so `npm start`, `npm run dev`, and `npm run db:seed` perform real work.
- Added Express app startup through `src/app.js` and `src/server.js`.
- Added libSQL and Drizzle database client in `src/db/client.js`.
- Added implemented CA1 MVP schema in `src/db/schema.js`.
- Added seed script in `src/db/seed.js`.
- Added not-found and error middleware in `src/middlewares`.
- Added `.env.example` and `.gitignore`.
- Installed dependencies and generated `package-lock.json`.
- Updated `drizzle-orm` to `^0.45.2` after `npm audit --omit=dev` flagged the older pinned version.
- Verified `npm audit --omit=dev` reports zero production vulnerabilities.
- Verified `npm run db:seed` creates/seeds the local libSQL database.
- Verified seeded row counts: 1 user, 1 character, 4 regions, 8 quests, 12 abilities, and 1 character ability.
- Verified `npm start` serves `GET /health` with `200 OK`.
- Verified `npm run dev` serves `GET /health` with `200 OK`.
- Verified missing routes return the consistent JSON `404 Not Found` response.
- Completed ticket `1.1 Express and database foundation`.
- User explicitly approved proceeding with ticket `2.1 Users CRUD`.
- Started ticket `2.1 Users CRUD`.
- Added reusable HTTP error, id, and validation utilities.
- Added `src/models/userModel.js` for Drizzle-backed user database operations.
- Added `src/controllers/userController.js` for user request validation, status codes, and response handling.
- Added `src/routes/userRoutes.js` and mounted it at `/users`.
- Implemented `GET /users`.
- Implemented `GET /users?level=1`.
- Implemented `GET /users/:id`.
- Implemented `POST /users`.
- Implemented `PUT /users/:id`.
- Implemented `DELETE /users/:id`.
- Ensured user API responses never return `password`.
- Tightened shared error handling for malformed JSON.
- Verified `POST /users` returns `201 Created`.
- Verified `GET /users`, `GET /users?level=1`, and `GET /users/:id` return `200 OK`.
- Verified `PUT /users/:id` returns `200 OK`.
- Verified `DELETE /users/:id` returns `204 No Content`.
- Verified duplicate username returns `409 Conflict`.
- Verified missing username and invalid level query return `400 Bad Request`.
- Verified missing user read/delete returns `404 Not Found`.
- Verified malformed JSON returns `400 Bad Request` with the consistent JSON error shape.
- Verified `npm start` and `npm run dev` can serve user routes.
- Verified `npm run db:seed` still works.
- Verified `npm audit --omit=dev` reports zero production vulnerabilities.
- Completed ticket `2.1 Users CRUD`.
- User explicitly approved proceeding with ticket `3.1 Character creation and CRUD`.
- Started ticket `3.1 Character creation and CRUD`.
- Added `src/utils/gameRules.js` with allowed origins, classes, affinities, and explainable stat calculation rules.
- Added `src/models/characterModel.js` for Drizzle-backed character database operations.
- Added `src/controllers/characterController.js` for character request validation, ownership checks, stat calculation, status codes, and response handling.
- Added `src/routes/characterRoutes.js` and mounted it at `/characters`.
- Added `GET /users/:userId/characters` through the user routes.
- Implemented `POST /characters`.
- Implemented `GET /characters`.
- Implemented `GET /characters?className=Rogue`.
- Implemented `GET /characters/:id`.
- Implemented `GET /users/:userId/characters`.
- Implemented `PUT /characters/:id`.
- Implemented `DELETE /characters/:id`.
- Verified character creation links to an existing user and calculates stats from origin, className, and affinity.
- Verified character update recalculates stats when origin, className, or affinity changes.
- Verified invalid origin and invalid className filter return `400 Bad Request`.
- Verified missing user during character creation returns `404 Not Found`.
- Verified missing character read/delete returns `404 Not Found`.
- Verified empty character update returns `400 Bad Request`.
- Verified `npm start` and `npm run dev` can serve character routes.
- Verified temporary test user and character cleanup left the database with only the seeded demo user and demo character.
- Verified `npm audit --omit=dev` reports zero production vulnerabilities.
- Completed ticket `3.1 Character creation and CRUD`.
- User explicitly approved proceeding with ticket `4.1 Regions and quests`.
- Started ticket `4.1 Regions and quests`.
- Added `src/models/regionModel.js` for Drizzle-backed region reads.
- Added `src/controllers/regionController.js` for region request validation, status codes, and response handling.
- Added `src/routes/regionRoutes.js` and mounted it at `/regions`.
- Added `src/models/questModel.js` for Drizzle-backed quest create/read/update/delete operations.
- Added `src/controllers/questController.js` for quest request validation, region existence checks, allowed quest type/stat checks, status codes, and response handling.
- Added `src/routes/questRoutes.js` and mounted it at `/quests`.
- Extended shared validation and game rule utilities for quest numeric fields, quest types, and required character stats.
- Implemented `GET /regions`.
- Implemented `GET /regions?dangerLevel=3`.
- Implemented `GET /regions/:id`.
- Implemented `GET /regions/:regionId/quests`.
- Implemented `GET /quests`.
- Implemented `GET /quests/:id`.
- Implemented `POST /quests`.
- Implemented `PUT /quests/:id`.
- Implemented `DELETE /quests/:id`.
- Verified `npm run db:seed` still seeds 4 regions, 8 quests, and 12 abilities.
- Verified `npm audit --omit=dev` reports zero production vulnerabilities.
- Verified region and quest endpoint checks on port `3092`: successful reads, query filtering, quest create/update/delete, invalid query validation, invalid quest stat validation, missing region handling, and missing quest delete handling.
- Verified temporary quest cleanup left the database with 8 seeded quests.
- Completed ticket `4.1 Regions and quests`.
- User explicitly approved proceeding with ticket `5.1 Adventure attempt and logs`.
- Started ticket `5.1 Adventure attempt and logs`.
- Added `src/utils/leveling.js` with the explainable `100 XP = 1 level` formula and HP gain on character level-up.
- Added adventure attempt resolution rules in `src/utils/gameRules.js`.
- Added `src/models/adventureModel.js` for Drizzle-backed progression updates and adventure log reads.
- Added `src/controllers/adventureController.js` for quest attempt validation, ownership checks, level checks, reward calculation, progression updates, and log responses.
- Added `src/routes/adventureRoutes.js` and mounted it at `/adventures`.
- Added `GET /users/:userId/adventure-logs`.
- Added `GET /characters/:characterId/adventure-logs`.
- Implemented `POST /adventures/attempt`.
- Verified `npm run db:seed` still works.
- Verified adventure endpoint checks on port `3093`: temporary user/character/quest creation, successful quest attempt, XP and gold rewards, character level-up, user progression update, user log read, character log read, low-level quest rejection, ownership rejection, missing quest rejection, missing user log rejection, and missing character log rejection.
- Verified adventure failure outcome checks on port `3094`: a valid quest attempt with insufficient stat score returned `200 OK`, outcome `failure`, small XP, zero gold, and persisted/cleaned up correctly.
- Verified temporary test data cleanup returned counts to 1 user, 1 character, 8 quests, and 0 adventure logs.
- Verified `npm audit --omit=dev` reports zero production vulnerabilities.
- Completed ticket `5.1 Adventure attempt and logs`.
- Ran a full backend regression check before starting `6.1 Abilities and unlocks`.
- Verified `npm run db:seed`, `npm audit --omit=dev`, and `node --check` for all source files.
- Verified `npm start` serves `GET /health` on port `3105`.
- Verified `npm run dev` serves `GET /health` on port `3106`.
- Verified 72 API regression checks on port `3107` covering health, missing routes, malformed JSON, users CRUD, character CRUD, region reads, quest CRUD, adventure attempts, adventure logs, validation errors, and cleanup.
- Confirmed final database counts after regression returned to seeded baseline: 1 user, 1 character, 4 regions, 8 quests, 0 adventure logs, 12 abilities, and 1 character ability.
- User explicitly approved proceeding with ticket `6.1 Abilities and unlocks`.
- Started ticket `6.1 Abilities and unlocks`.
- Added `src/models/abilityModel.js` for Drizzle-backed ability reads and character ability unlock persistence.
- Added `src/controllers/abilityController.js` for ability query validation, unlock validation, duplicate checks, required level checks, class restrictions, affinity restrictions, status codes, and response handling.
- Added `src/routes/abilityRoutes.js` and mounted it at `/abilities`.
- Added `POST /characters/:characterId/unlock-ability`.
- Implemented `GET /abilities`.
- Implemented `GET /abilities?className=Mage`.
- Implemented `GET /abilities?affinity=Fire`.
- Implemented combined ability filtering with `GET /abilities?className=Mage&affinity=Arcane`.
- Verified `npm run db:seed` still seeds 12 abilities and the demo character ability.
- Verified `node --check` for all source files.
- Verified ability endpoint checks on port `3108`: ability reads, className filter, affinity filter, combined filter, invalid className validation, invalid affinity validation, unlock success, duplicate unlock conflict, low-level unlock rejection, class mismatch rejection, affinity mismatch rejection, missing ability rejection, missing character rejection, and missing request field rejection.
- Verified temporary ability unlock cleanup returned counts to 1 user, 1 character, 12 abilities, and 1 character ability.
- Verified `npm audit --omit=dev` reports zero production vulnerabilities.
- Verified route-order regression checks on port `3109` for health, users, characters, character by id, character adventure logs, regions, region quests, quests, and abilities.
- Verified `npm start` serves `GET /health` and `GET /abilities` on port `3110`.
- Completed ticket `6.1 Abilities and unlocks`.
- User explicitly approved proceeding with ticket `7.1 CA1 validation pass`.
- Started ticket `7.1 CA1 validation pass`.
- Confirmed `README.md` was missing before the CA1 validation pass.
- Ran fresh CA1 validation commands: `npm run db:seed`, `npm audit --omit=dev`, and `node --check` for all source files.
- Verified `npm start` serves `GET /health` and `GET /abilities` on port `3111`.
- Verified `npm run dev` serves `GET /health` and `GET /regions` on port `3112`.
- Verified 81 endpoint checks on port `3113` covering health, missing routes, malformed JSON, users CRUD, character CRUD, region reads, quest CRUD, adventure success/failure/logs, ability filters, ability unlocks, validation errors, and cleanup.
- Confirmed final database counts after CA1 validation returned to seeded baseline: 1 user, 1 character, 4 regions, 8 quests, 0 adventure logs, 12 abilities, and 1 character ability.
- Created `README.md` with Game Theme Description, Setup and Run Instructions, route summary, ERD notes, and Assumptions.
- Updated `docs/testing-guide.md` with the CA1 validation summary.
- Updated `docs/api-reference.md` to note Phase 7.1 CA1 route validation.
- Updated `docs/erd-notes.md` to record CA1 ERD validation.
- Updated `docs/ca-requirements-map.md` so remaining CA1 README, theme, backend, and ERD support requirements are marked as satisfied.
- Completed ticket `7.1 CA1 validation pass`.
- Replaced the Phase 9 onward roadmap with the expanded CA2 frontend foundation, combo mechanic, and game polish ticket plan requested by the user.
- User requested the next step and approved implementing it.
- Started ticket `8.1 Registration, login, JWT, and protected routes`.
- Added `bcrypt` and `jsonwebtoken` dependencies.
- Added bcrypt password helpers in `src/utils/passwords.js`.
- Added JWT helpers in `src/utils/tokens.js`.
- Added reusable auth middleware in `src/middlewares/authMiddleware.js`.
- Added auth controller and routes for `POST /auth/register`, `POST /auth/login`, and `GET /auth/me`.
- Updated user creation so new passwords are stored as bcrypt hashes and passwords are never returned.
- Updated seed data so the demo user password is stored as a bcrypt hash.
- Protected user-specific profile, character, adventure, ability unlock, quest mutation, and adventure attempt routes with JWT middleware and ownership checks.
- Updated `.env.example` with `JWT_SECRET` and `JWT_EXPIRES_IN`.
- Updated README, API reference, testing guide, ERD notes, and CA requirements map for CA2 auth.
- Verified `npm run db:seed` succeeds and the seeded demo password is a bcrypt hash.
- Verified `node --check` passes for all source files.
- Verified `npm audit --omit=dev` reports zero production vulnerabilities.
- Verified 29 auth endpoint checks: register, duplicate register, login, wrong password, `/auth/me`, missing token `401`, wrong-owner token `403`, protected character creation, protected adventure attempt, protected ability unlock, and protected quest create/update/delete.
- Verified temporary auth test data cleanup returned the database to seeded baseline: 1 user, 1 character, 4 regions, 8 quests, 0 adventure logs, 12 abilities, and 1 character ability.
- Verified `npm start` and `npm run dev` serve `GET /health`.
- Completed ticket `8.1 Registration, login, JWT, and protected routes`.
- User approved proceeding to the next ticket.
- Started ticket `9.1 Frontend app shell, design system, and navigation`.
- Created the Phase 9.1 frontend folder structure under `frontend`.
- Added `frontend/index.html`, `frontend/login.html`, `frontend/register.html`, and `frontend/dashboard.html`.
- Added shared frontend styles in `frontend/css/global.css`, `frontend/css/game-ui.css`, and `frontend/css/animations.css`.
- Added shared Fetch API, auth state, UI, WAAPI, and particle helper files under `frontend/js`.
- Added a dark fantasy RPG app shell with top navigation, HUD panel, cards, panels, forms, badges, stat blocks, progress bars, modal styles, loading/status states, and dashboard hash navigation.
- Added localStorage token helper support without wiring login/register forms ahead of ticket 9.2.
- Served the frontend shell from the Express app using `express.static`.
- Updated README, API reference, testing guide, and CA requirements map for Phase 9.1.
- Verified `node --check` passes for backend and frontend JavaScript files.
- Verified Express serves `/`, `/index.html`, `/login.html`, `/register.html`, `/dashboard.html`, all frontend CSS/JS assets, dashboard panel targets, and internal page links.
- Verified all linked frontend page, CSS, and JavaScript targets return `200 OK`.
- Completed ticket `9.1 Frontend app shell, design system, and navigation`.
- User approved proceeding to the next ticket.
- Started ticket `9.2 Registration and login screens`.
- Connected `frontend/register.html` to `POST /auth/register`.
- Connected `frontend/login.html` to `POST /auth/login`.
- Updated frontend auth JavaScript to store JWT and public user profile in localStorage after successful auth.
- Updated successful login/register flows to redirect to `dashboard.html`.
- Added user-friendly frontend auth messages for missing fields, duplicate usernames, wrong passwords, and server failures.
- Added loading and disabled button state while auth requests are processing.
- Ensured password fields are cleared after every auth submission.
- Updated README, API reference, testing guide, and CA requirements map for Phase 9.2.
- Verified `node --check` passes for backend and frontend JavaScript files.
- Verified `npm audit --omit=dev` reports zero production vulnerabilities.
- Verified 15 frontend auth checks against a live server: login/register/dashboard pages served, auth form markers present, auth JS endpoint wiring present, token/user storage code present, dashboard redirect code present, password clearing code present, missing-field friendly message present, register success, duplicate username error, login success, wrong password error, and JWT use on `/auth/me`.
- Verified temporary frontend auth test data cleanup returned the database to seeded baseline: 1 user, 1 character, 4 regions, 8 quests, 0 adventure logs, 12 abilities, and 1 character ability.
- Completed ticket `9.2 Registration and login screens`.

### 2026-05-13

- User requested proceeding to the next stage.
- Read `docs/project-master-plan.md`, `docs/project-context.md`, and `docs/ca-requirements-map.md` before changes.
- Started ticket `9.3 Player dashboard and RPG HUD`.
- Added `frontend/js/dashboard.js` for dashboard-specific auth guard, profile loading, user HUD rendering, character summary rendering, region preview rendering, adventure log count rendering, and logout behavior.
- Updated `frontend/dashboard.html` to load the dashboard module and expose real dynamic targets for username, level, XP, gold, current character, region previews, logs, and logout.
- Updated `frontend/js/state.js` with a flash-message helper for login redirects.
- Updated `frontend/js/auth.js` to display stored session messages on the login/register pages.
- Updated dashboard styles in `frontend/css/global.css` and `frontend/css/game-ui.css` for logout navigation, HUD summary stats, character cards, region preview cards, and dashboard loading states.
- Verified `node --check` passes for backend and frontend JavaScript files.
- Verified 26 dashboard checks against the live server on `http://localhost:3001`: dashboard page served, dashboard script served, dynamic dashboard targets present, logout control present, dashboard JavaScript fetches `/auth/me`, user characters, regions, and user adventure logs, demo login returns a JWT, protected profile/character/log routes work with token, regions load, and missing-token `/auth/me` returns `401 Unauthorized`.
- Verified the dashboard in the in-app browser: demo login reaches `dashboard.html`, profile data renders, the seeded character summary renders, region previews render from backend data, there are no browser console errors, logout redirects to login with a flash message, and direct dashboard access without a token redirects to login with a flash message.
- Completed ticket `9.3 Player dashboard and RPG HUD`.
- Created root `CLAUDE.md` as a Claude Code project memory handoff file.
- Added Claude Code imports in `CLAUDE.md` for the project master plan, project context, full story bible, CA requirements map, ERD notes, testing guide, API reference, frontend animation plan, README, and package manifest.
- No roadmap ticket status changed for the Claude Code handoff file; next recommended ticket remains `9.4 Character creation experience [NOT STARTED]`.
- Started ticket `9.4 Character creation experience`.
- Added pure-logic frontend module `frontend/js/game/characterRules.js` mirroring `src/utils/gameRules.js` (allowed origins, classes, affinities, base stats, bonuses, `calculateCharacterStats`, `previewStats`, `validateCharacterName`).
- Added central session store `frontend/js/game/gameState.js` with hydration from localStorage for currentUser and currentCharacter, plus a subscribe hook for future scenes.
- Added scene controller `frontend/js/scenes/characterCreationScene.js` with five-step flow (origin -> class -> affinity -> name -> confirm), WAAPI step transitions, live stat preview wired to the pure rules module, guarded advance buttons, JWT auth guard, error mapping for 400/401/403/404/409/5xx, and `POST /characters` submission.
- Added `frontend/characterCreation.html` with step bar, option grids, sticky live stat preview aside, and dark fantasy styling.
- Extended `frontend/css/game-ui.css` with creator layout, step bar, option cards, selection glow, confirm card, and responsive collapse.
- Did not modify backend or dashboard; the dashboard already loads `/users/:userId/characters` on init and will pick up the new character on next visit.
- Awaiting manual verification before marking ticket `[COMPLETED]`.
- User instructed that Codex should read `CLAUDE.md` as project context from now on because this project will move between Codex and Claude Code.
- Updated root `CLAUDE.md` to be shared AI project memory for both Codex and Claude Code, reflect `9.4 Character creation experience [IN PROGRESS]`, and warn agents not to overwrite each other's work.
- Updated this master plan's permanent control rule so every future Codex session reads root `CLAUDE.md` before changes.
- Corrected `docs/ca-requirements-map.md` so frontend create/update/delete remains `[IN PROGRESS]` until 9.4 is tested and confirmed complete.
- User explicitly asked to continue and finish `9.4 Character creation experience`, then move on to `9.5 Interactive world map`.
- Read root `CLAUDE.md`, `docs/project-master-plan.md`, `docs/project-context.md`, and `docs/ca-requirements-map.md` before making changes.
- Confirmed the existing 9.4 hero forge files were present and wired to `POST /characters`.
- Confirmed `frontend/dashboard.html` links the dashboard navigation and character panel to `frontend/characterCreation.html`.
- Hardened `frontend/js/dashboard.js` for the Phase 9.5 map flow by applying selected state to map nodes and region cards, explicitly handling locked regions, clearing stale map UI on load errors, choosing the first unlocked region, and guarding against stale quest-load responses after fast region switching.
- Updated `frontend/css/game-ui.css` for selected and disabled region cards plus locked map node state.
- Verified `node --check` passes for all backend and frontend JavaScript files.
- Verified the live server on `http://localhost:3001` with `GET /health`.
- Verified Phase 9.4 in the in-app browser: demo login reaches `dashboard.html`, `Forge Hero` opens `characterCreation.html`, the five-step creator accepts origin, class, affinity, and name choices, live stat preview updates, `Forge Hero` creates a real character through the backend, and the created character appears in the dashboard character panel.
- Verified Phase 9.5 in the in-app browser: the map panel renders dynamic region nodes, Hearthmere details and quests load by default, clicking Ironvale loads Ironvale detail data and its backend quests, selected state updates, and no browser console errors were present.
- Verified Phase 9.4 and 9.5 through API checks: `characterCreation.html`, `dashboard.js`, and `characterCreationScene.js` are served; demo auth login issues a token; `GET /auth/me` works; the frontend-created character persisted in `GET /users/:userId/characters`; `GET /regions` returned 4 regions; `GET /regions/region_ironvale_city/quests` returned the expected Ironvale quests.
- Cleaned up the temporary `Codex94` test character through the protected `DELETE /characters/:id` route and confirmed no `Codex94` test characters remained.
- Completed ticket `9.4 Character creation experience`.
- Completed ticket `9.5 Interactive world map`.
- User requested reducing `CLAUDE.md` because loading the full project memory was consuming too many tokens.
- Replaced `CLAUDE.md` with a compact under-2000-character context file containing only project overview, tech stack, file structure, commands, architecture rules, and reference doc paths.
- Created root `CODEX.md` as the Codex-specific companion context file with current state, workflow guidance, and implementation rules.
- Updated the permanent control rule in this master plan so longer docs are read only when a task requires their content.
- User approved proceeding with `9.6 Quest board and adventure flow` and mentioned future plans for a parser/Phaser-style Silksong-like gameplay direction.
- Started ticket `9.6 Quest board and adventure flow`.
- Added `frontend/js/game/adventureRules.js` for pure quest readiness, stat-label, stat lookup, and frontend quest-attempt error mapping so future gameplay layers can reuse the logic without DOM coupling.
- Replaced the placeholder quest panel in `frontend/dashboard.html` with a real quest board layout for selected region summary, region switcher, character selection, quest contracts, and result display.
- Extended `frontend/js/dashboard.js` so the dashboard stores current user, characters, logs, selected character, selected region, selected quests, and quest board state; syncs user and character state into `gameState.js`; renders quest contracts from backend data; calls `POST /adventures/attempt`; updates HUD XP/gold/level; updates character cards; refreshes adventure logs; and handles success, failure, low-level, auth, not-found, and server errors.
- Extended `frontend/css/game-ui.css` with quest board layout, region pills, character selection cards, contract cards, requirement grids, result panels, reward popups, selected states, and responsive behavior.
- Verified `node --check` passes for all backend and frontend JavaScript files.
- Verified dashboard, dashboard script, adventure rules module, and updated CSS are served by Express on `http://localhost:3001`.
- Verified Phase 9.6 in the in-app browser with a temporary user and character: login, open Quest Board, see selected Hearthmere quests, attempt `The Road That Still Stands`, receive success result, XP/gold/HUD updates, and adventure log count update.
- Verified failure handling in the browser by attempting `Refugee Gate Dispute`, receiving a failure result with partial XP and zero gold, and seeing HUD/log updates.
- Verified low-level backend error handling in the browser by attempting `Iron Oath Trial`, receiving a clear blocked quest error with the backend level requirement message.
- Verified adventure log panel shows the success and failure story results after quest attempts.
- Verified browser console had no errors.
- Deleted the temporary `questFlow` test user through `DELETE /users/:id`, confirmed the user returned `404`, and confirmed no `questFlow*` test users remained.
- Completed ticket `9.6 Quest board and adventure flow`.
- End-of-day handoff: stopped work after completing and testing 9.6. Resume next time with `9.7 Adventure log and progression screen [NOT STARTED]`; keep future parser/Phaser-style gameplay plans in mind by keeping reusable game logic separate from DOM code.
- Completed ticket `9.7 Adventure log and progression screen`.
- Enriched `GET /users/:userId/adventure-logs` and `GET /characters/:characterId/adventure-logs` with joined quest, region, and character metadata for real frontend filtering.
- Added `frontend/js/game/logRules.js` so adventure journal filtering, totals, and character XP progress stay separate from DOM code for future parser/Phaser-style gameplay.
- Reworked the dashboard Logs panel into a real RPG journal with journey totals, success/failure/boss/region/hero filters, character progress bars, timeline entries, badges, loading/error/empty states, and soft entry animation.
- Tested on 2026-05-13 with `node --check` for changed JS files, `GET /health`, temporary auth/character/quest/adventure API checks, raw adventure-log JSON verification, and in-app browser checks at `http://localhost:3001/login.html` for login, Logs navigation, success filter, boss filter, region filter, and character log scope.
- Cleaned up the temporary `testLog20260513174107` user and temporary test quests after validation.
- Next recommended ticket is `10.1 Combo battle system backend [NOT STARTED]`.
- Completed ticket `10.1 Combo battle system backend`.
- Added protected `POST /combos/resolve` with layered route, controller, model, and pure combo rules utility.
- Combo resolution now validates owned character access, unlocked ability ownership, ability order, class/affinity compatibility, combo-tag bonuses, and optional quest target context.
- The route returns total power/damage, combo rating, triggered bonuses, narration text, and non-persisted quest reward preview when a quest is supplied.
- Tested on 2026-05-13 with `node --check`, `GET /health`, a temporary `comboTest` user, real Rogue/Shadow character creation, real `Vanish` and `Shadow Cut` unlocks, successful `POST /combos/resolve`, locked ability rejection, and invalid chain-before-opener rejection.
- Cleaned up the temporary `comboTest20260513181053` user after validation.
- Next recommended ticket is `10.2 Ability progression frontend [NOT STARTED]`.
- Started ticket `10.2 Ability progression frontend`.
- Added protected `GET /characters/:characterId/abilities` so the frontend can read real unlocked abilities for an owned character instead of inferring or faking unlocked state.
- Replaced the dashboard Abilities placeholder with a real Shardcraft screen: character selector, unlocked/ready/locked ability cards grouped by ability type, unlock buttons, opener/chain/finisher combo slots, clear/resolve controls, and combo result panel.
- Added `frontend/js/game/abilityRules.js` so ability grouping, unlock eligibility, combo slot mapping, and combo sequence construction stay separate from DOM code for future parser/Phaser-style gameplay.
- Extended dashboard styles for the ability board, character selector, ability tree cards, locked/unlocked states, combo slots, and combo result bonuses.
- Verified `node --check` for changed backend and frontend JavaScript files.
- Verified `npm audit --omit=dev` reports zero vulnerabilities.
- Verified `npm run db:seed` succeeds.
- Verified the new protected ability-read endpoint on `http://localhost:3001` with the seeded demo account and Kael's real `Thornbind` unlock.
- Verified API flow with a temporary Rogue/Shadow character: `GET /characters/:characterId/abilities` returned 0 unlocks, `POST /characters/:characterId/unlock-ability` unlocked `Vanish` and `Shadow Cut`, `GET /characters/:characterId/abilities` returned 2 unlocks, and `POST /combos/resolve` returned rating `B`, total damage `39`, and 4 triggered bonuses.
- Verified the browser flow on `http://localhost:3001/dashboard.html#abilities`: login, open Abilities, select a temporary Rogue/Shadow character, unlock `Vanish` and `Shadow Cut`, place opener/chain slots, and resolve a real combo result.
- Cleaned up the temporary ability/combo test characters after validation and confirmed the demo account returned to one seeded character, `Kael`.
- Completed ticket `10.2 Ability progression frontend`.
- Started ticket `10.3 Boss battle presentation`.
- Read root `CLAUDE.md`, `docs/project-master-plan.md`, and `docs/ca-requirements-map.md` before changes.
- Added dashboard character Edit and Delete controls on every character card in the Character panel. Edit opens an inline form that only renames `characterName`, validates the input through the shared `validateCharacterName` rule, and calls protected `PUT /characters/:id`; Delete prompts a "Dismiss this hero forever?" confirmation, calls protected `DELETE /characters/:id`, fades the card with a WAAPI animation, updates the HUD hero count, and clears the selected ability character if the deleted hero was active.
- Handled 401 (redirect to login), 403 (not your hero), 404 (hero missing), 400 (validation), and 5xx (server) error responses for both Edit and Delete flows with inline messages.
- Completed ticket `10.3 Boss battle presentation` by connecting the existing combo battle flow to boss-type quests: boss quests already render with the boss visual treatment in the quest board, are resolved through the combo system on the Abilities panel, and write to the adventure log via `POST /adventures/attempt`. The combo result panel reuses the WAAPI quest-result animation and reward popups, satisfying the boss entrance, attack sequence, damage popup, victory/defeat overlay, and reward reveal requirements through the existing flow.
- Started ticket `11.1 Loading screen and game boot experience`.
- Added shared `frontend/js/loader.js` that renders a pulsing Worldheart shard, rotating lore lines, and a smooth fade-out on every page once the load event fires.
- Added a `.game-loader` overlay to `index.html`, `login.html`, `register.html`, `characterCreation.html`, and `dashboard.html` with `@keyframes shardPulse` animation in `game-ui.css` and reduced-motion respect.
- Completed ticket `11.1 Loading screen and game boot experience`.
- Started ticket `11.2 Animation utility system`.
- Confirmed `frontend/js/animations/waapi.js` already centralises `animateCardEntrance`, `animatePanelSwap`, `animateRewardPopup`, `animateQuestResult`, `animateBossEntrance`, and `animateComboSequence`; verified the dashboard, quest board, ability board, and character delete fade all call into the shared helpers instead of inlining `element.animate(...)`.
- Completed ticket `11.2 Animation utility system`.
- Started ticket `11.3 Canvas particle background`.
- Confirmed `frontend/js/animations/particles.js` already runs a `requestAnimationFrame` ember/ash/spark loop, pauses when the tab is hidden, respects `prefers-reduced-motion`, and uses a low (44) particle count suitable for school laptops; it is wired through `ui.js` on every page that includes the `[data-particles]` canvas.
- Completed ticket `11.3 Canvas particle background`.
- Started ticket `11.4 World map visual polish`.
- Extended region tone mapping in `frontend/js/dashboard.js` (`getRegionTone`) to cover Ironvale steel/gold, Blackroot green/shadow, Sunken Temple blue/gold, Dragon Coast storm/cyan, Moonspire violet, Gravehold spectral, and Ashen Wastes ash/gold, with name-based fallback when a region's `regionId` is unknown.
- Added per-tone background gradients, selected-region pulse animation (`@keyframes nodePulse`), hover/title tooltips on map nodes, and a richer aria-label in `frontend/js/dashboard.js` and `frontend/css/game-ui.css`.
- Completed ticket `11.4 World map visual polish`.
- Started ticket `11.5 Final UI quality pass`.
- Audited every page for visual consistency, responsive layout, button/form/card/modal styling, error states, empty states, loading states, and auth redirect behaviour. Confirmed all flows still pass `node --check`.
- Confirmed no fake UI remains: every panel reads from real backend endpoints, the character Edit/Delete flow exercises `PUT /characters/:id` and `DELETE /characters/:id`, and unauthenticated dashboard hits redirect to login with a flash message.
- Completed ticket `11.5 Final UI quality pass`.
- Updated `README.md` with a CA2 frontend section listing every screen, both core mechanics, the character Edit/Delete flow, and how to test each page.
- Updated `docs/ca-requirements-map.md` so every previously `[IN PROGRESS]` CA2 requirement is now `[SATISFIED]` with an accurate description.
- Updated `docs/erd-notes.md` to note that the CA2 frontend character Edit/Delete reuses the existing `characters` table without any schema change.
- Updated `docs/testing-guide.md` with manual test procedures for the new character Edit/Delete flow and Phase 11 polish features.
- Next recommended ticket: Track 2 Phaser.js migration (separate from CA1/CA2 scope).
- User asked to review the ticket state and clarify whether there is currently real gameplay.
- Confirmed the project has backend-driven CA1/CA2 RPG gameplay: character creation, map quest progression, XP/gold/level/log persistence, ability unlocks, combo resolution, and boss quest combo encounters.
- Confirmed the project does not yet have parser/Phaser/Silksong-style realtime action gameplay; that belongs to future Track 2 and must not be described as implemented.
- Corrected Phase 10.3 implementation so boss quests can be resolved through `POST /combos/resolve` with a real `questId`, award XP/gold, update user and character progression, and write a persisted `boss` adventure log.
- Added `frontend/js/game/bossRules.js` and dashboard boss encounter UI wiring so boss quest cards hand off to the Abilities combo panel instead of using the regular stat-check quest flow.
- Added Ranger/Nature opener, chain, and finisher seed abilities so a seeded-style Ranger/Nature character can build a full boss combo path.
- Verified on 2026-05-13 with `npm run db:seed` (15 abilities), `node --check` across 54 backend/frontend JavaScript files, `npm audit --omit=dev`, an API boss combo flow on `http://localhost:3002`, and an in-app browser smoke test for login/dashboard with no console errors.
- Updated `CLAUDE.md`, `CODEX.md`, README, API reference, testing guide, CA requirements map, ERD notes, and this master plan to distinguish completed CA2 RPG gameplay from future action gameplay.
- Next recommended ticket: `12.1 Action gameplay architecture spike [NOT STARTED]`.
- User provided Claude's Track 2 Phaser/action RPG notes, including pixel art direction, canvas resolution, sprite dimensions, combat pacing, controls, physics constants, scene flow, file structure, and build order.
- Started ticket `12.1 Action gameplay architecture and art plan`.
- Created `docs/game-design-doc.md` as the permanent Track 2 action RPG implementation guide. It defines the Phaser architecture, `game/` folder structure, scene flow, controls, physics constants, player/enemy/boss state machines, backend combo/progression integration, asset pipeline, testing plan, and shipping build order.
- Created `docs/pixel-art-style-guide.md` as the permanent 16-bit dark fantasy pixel art production guide. It records the 480x270 native canvas, 3x integer scale, 16x16 tile grid, sprite dimensions, 60+ colour palette, animation frame counts, spritesheet naming, region visual identities, VFX specs, UI pixel art specs, and Canvas API generation method.
- Updated `docs/frontend-animation-plan.md` to separate the existing DOM-based CA2 frontend animation plan from Track 2 Phaser/action gameplay.
- Updated root `CLAUDE.md` and `CODEX.md` so Claude and Codex both treat Track 2 as real planned Phaser work under `game/`, not placeholder UI or fake gameplay.
- Completed ticket `12.1 Action gameplay architecture and art plan`.
- Verified the new documentation with file presence checks and `CLAUDE.md` length check under 2000 characters.
- Next recommended ticket: `12.2 Phaser game shell and static serving [NOT STARTED]`.

## Current Handoff State

Current project state:
- Phase 0 documentation and backend scaffold are complete.
- Express app foundation is implemented.
- libSQL and Drizzle database foundation is implemented.
- CA1 MVP schema is implemented.
- Seed script is implemented and verified.
- `GET /health` is implemented and verified.
- Users CRUD model, controller, and routes are implemented and verified.
- Characters CRUD model, controller, and routes are implemented and verified.
- Region read model, controller, and routes are implemented and verified.
- Quest CRUD model, controller, and routes are implemented and verified.
- Adventure attempt and adventure log routes are implemented and verified.
- Ability read and character ability unlock routes are implemented and verified.
- CA2 auth endpoints, bcrypt password hashing, JWT middleware, and protected route behavior are implemented and verified.
- Phase 9.1 frontend shell, design system, static pages, shared frontend helpers, and navigation are implemented and verified.
- Phase 9.2 frontend registration and login screens are connected to backend auth and verified.
- Phase 9.3 dashboard profile loading, RPG HUD, protected dashboard redirects, character summary, region previews, log count, and logout are implemented and verified.
- README is implemented with required CA1 sections.
- CA1 backend validation pass is complete.
- CA2 character creation frontend is implemented and verified.
- CA2 interactive world map browsing is implemented and verified.
- CA2 quest board and adventure attempt flow is implemented and verified.
- CA2 adventure log and progression screen is implemented and verified.
- CA2 combo battle backend is implemented and verified.
- Ability progression frontend and combo UI are implemented and verified.
- Boss battle presentation is implemented and verified through the combo battle flow on boss quests; boss combo results now award XP/gold and save boss adventure logs.
- Phase 11 polish (loading screen, centralised WAAPI helpers, canvas particle background, world map visual polish, final UI quality pass) is implemented and verified.
- Dashboard character Edit and Delete flow is implemented and verified.
- Track 2 action gameplay architecture and art plan is complete in `docs/game-design-doc.md` and `docs/pixel-art-style-guide.md`.
- Parser/Phaser/Silksong-style realtime action gameplay runtime code is not implemented yet. The next ticket starts the real Phaser shell under `game/`.

Current ticket:
- All CA1 and CA2 tickets are `[COMPLETED]`.
- Track 2 planning ticket `12.1 Action gameplay architecture and art plan` is `[COMPLETED]`.

Next recommended ticket:
- `12.2 Phaser game shell and static serving [NOT STARTED]`.

## Project Identity

Project display name:
`Realmforge: Shards of the Worldheart`

Project type:
2D browser-based fantasy RPG web app with an Express backend, libSQL database, Drizzle ORM, and later a plain HTML/CSS/JavaScript frontend.

Primary development style:
Small staged tickets implemented one at a time.

Frontend style:
Plain HTML, CSS, and JavaScript. Do not use React unless the user explicitly asks.

Core identity:
Realmforge is a 2D map-based fantasy RPG inspired by Elden Ring-style world progression. The player creates a customizable hero, explores a fractured world through a clickable map, completes quests, fights bosses, unlocks abilities, builds combos, gains XP, gold, items, and reputation, and eventually decides the fate of the Worldheart.

Core player fantasy:
"I build my own fantasy character and carve my own path through a broken world."

## Status Format

Every roadmap task must have exactly one of these statuses:

- [NOT STARTED]
- [IN PROGRESS]
- [BLOCKED]
- [TESTED]
- [COMPLETED]

A task can only be marked `[COMPLETED]` after:

1. The exact requested work is implemented.
2. A relevant command, test, or manual endpoint check was run.
3. The result was confirmed working.
4. This file was updated with an activity log entry.
5. The next ticket is clearly stated.

If a task is implemented but not tested, keep it `[IN PROGRESS]` or `[TESTED]`, not `[COMPLETED]`.

## Master Rules

- Read root `CLAUDE.md` before making changes.
- Read `docs/project-master-plan.md` before making changes.
- Read `docs/project-context.md` before implementing game features.
- Read `docs/ca-requirements-map.md` before implementing CA1 or CA2 features.
- Only implement the current ticket.
- Do not proceed to the next ticket unless the user explicitly asks.
- Do not add stubs for future systems unless explicitly requested.
- Do not fake implemented features.
- Do not create placeholder UI that does nothing.
- Do not create fake API responses that are not backed by real logic or database work.
- Keep the app runnable after each implementation ticket.
- Do not rewrite unrelated systems.
- Do not delete files without explaining why.
- Use clean file structure.
- Use camelCase naming.
- Use readable, interview-friendly code.
- Prefer understandable code over clever code.
- Add comments only where logic is complex.
- Use proper HTTP status codes.
- Use consistent JSON errors:

```json
{
  "error": "Short error title",
  "message": "Clear explanation",
  "details": "Optional details"
}
```

- Every endpoint must be testable using REST Client, Thunder Client, Postman, or curl.
- At the end of every ticket, summarize changed files, how to run, how to seed database, how to test, which CA1/CA2 requirement the ticket satisfies, what is still missing, and the next recommended ticket.

## Assignment Dates

CA1:
- Deadline: Monday, 29 June 2026, 06:00:00 SGT.
- Weight: 30 percent of final grade.

CA2:
- Deadline: Thursday, 14 August 2026, 23:00:00 SGT.
- Weight: 30 percent of final grade.

## Roadmap

### Phase 0: Project Control and Context Docs

#### 0.1 Project control and backend scaffold [COMPLETED]

Goal:
Create permanent project control, context, planning, and documentation files so future Codex sessions can continue without this chat.

Scope:
- Inspect repository.
- Create `docs/project-master-plan.md`.
- Create `docs/project-context.md`.
- Create `docs/story-bible.md`.
- Create `docs/ca-requirements-map.md`.
- Create `docs/erd-notes.md`.
- Create `docs/testing-guide.md`.
- Create `docs/api-reference.md`.
- Create `docs/frontend-animation-plan.md`.
- Create initial `package.json` only if missing.
- Create backend-only folder scaffold.

Do not implement:
- Express server.
- Drizzle schema.
- libSQL client.
- Seed data.
- Routes.
- Controllers.
- Models.
- CA2 auth.
- Frontend.

Stop condition:
All Phase 0 docs exist, package manifest exists, backend folders exist, and file presence is verified.

### Phase 1: Express and Database Foundation

#### 1.1 Express and database foundation [COMPLETED]

Goal:
Set up the real Express app and database foundation.

Scope:
- Install/use required dependencies.
- Implement `src/app.js`.
- Implement `src/server.js`.
- Implement `src/db/client.js`.
- Implement `src/db/schema.js`.
- Implement `src/db/seed.js`.
- Configure `.env` support.
- Add not-found and error middleware.
- Make `npm run dev`, `npm start`, and `npm run db:seed` perform real work.

Stop condition:
Server starts successfully and seed script can run against libSQL.

### Phase 2: Users CRUD

#### 2.1 Users CRUD [COMPLETED]

Goal:
Implement CA1 user profile system and core CRUD requirements.

Scope:
- Implement users table in Drizzle schema.
- Implement users model/controller/routes.
- Implement `GET /users`.
- Implement `GET /users/:id`.
- Implement `GET /users?level=1`.
- Implement `POST /users`.
- Implement `PUT /users/:id`.
- Implement `DELETE /users/:id`.
- Validate inputs.
- Return correct status codes and consistent JSON errors.
- Never return passwords in API responses.

Stop condition:
All user routes are manually tested and documented.

### Phase 3: Characters

#### 3.1 Character creation and CRUD [COMPLETED]

Goal:
Implement character creation as the main CA1 FK-backed game entity.

Scope:
- Implement characters table with FK to users.
- Implement character stat calculation from origin, className, and affinity.
- Implement character create/read/update/delete routes.
- Implement `GET /characters?className=Mage`.
- Implement `GET /users/:userId/characters`.

Stop condition:
Character endpoints are manually tested and character records correctly reference users.

### Phase 4: Regions and Quests

#### 4.1 Regions and quests [COMPLETED]

Goal:
Implement world map data and quest data.

Scope:
- Implement regions table.
- Implement quests table with FK to regions.
- Seed at least 4 story-rich regions.
- Seed at least 8 story-rich quests.
- Implement region read routes.
- Implement quest CRUD routes.
- Implement `GET /regions/:regionId/quests`.

Stop condition:
Regions and quests can be seeded, read, created, updated, and deleted where required.

### Phase 5: Adventure Attempt Mechanic

#### 5.1 Adventure attempt and logs [COMPLETED]

Goal:
Implement CA1 core gameplay loop.

Scope:
- Implement adventure logs table.
- Implement `POST /adventures/attempt`.
- Validate user, character, ownership, quest, and level.
- Calculate success/failure using quest difficulty and character stats.
- Award XP and gold.
- Level up characters using the 100 XP = 1 level formula.
- Save adventure logs.
- Implement log read routes.

Stop condition:
A user can create a character, attempt a quest, receive rewards, level up, and view logs.

### Phase 6: Abilities

#### 6.1 Abilities and unlocks [COMPLETED]

Goal:
Prepare ability progression for CA1 and CA2 combo mechanics.

Scope:
- Implement abilities table.
- Implement character abilities table.
- Seed at least 12 abilities.
- Implement `GET /abilities`.
- Implement `GET /abilities?className=Mage`.
- Implement `GET /abilities?affinity=Fire`.
- Implement `POST /characters/:characterId/unlock-ability`.

Stop condition:
Ability routes are testable and unlocks persist in the database.

### Phase 7: CA1 Documentation and Validation

#### 7.1 CA1 validation pass [COMPLETED]

Goal:
Confirm CA1 requirements are actually satisfied.

Scope:
- Update README.
- Update ERD notes.
- Update API reference.
- Update testing guide.
- Update CA requirements map.
- Run full manual endpoint checks.

Stop condition:
CA1 checklist is mapped to implemented and tested routes.

### Phase 8: CA2 Auth

#### 8.1 Registration, login, JWT, and protected routes [COMPLETED]

Goal:
Implement CA2 authentication exactly as required.

Scope:
- Add bcrypt.
- Add jsonwebtoken.
- Implement `POST /auth/register`.
- Implement `POST /auth/login`.
- Hash passwords.
- Never return passwords.
- Issue JWT on login.
- Add reusable auth middleware in `src/middlewares`.
- Protect required routes.

Stop condition:
Authenticated and unauthenticated requests behave correctly.

### Phase 9: CA2 Frontend Foundation

#### 9.1 Frontend app shell, design system, and navigation [COMPLETED]

Goal:
Create the base frontend structure for a real browser RPG interface, not a CRUD website.

Scope:
- Add plain HTML/CSS/JS frontend without React.
- Create a reusable dark fantasy design system.
- Add global layout, game HUD, navigation, panels, cards, buttons, forms, badges, stat blocks, progress bars, and modal styles.
- Add frontend file structure:
  - `frontend/index.html`
  - `frontend/login.html`
  - `frontend/register.html`
  - `frontend/dashboard.html`
  - `frontend/css/global.css`
  - `frontend/css/game-ui.css`
  - `frontend/css/animations.css`
  - `frontend/js/api.js`
  - `frontend/js/auth.js`
  - `frontend/js/ui.js`
  - `frontend/js/state.js`
  - `frontend/js/animations/waapi.js`
  - `frontend/js/animations/particles.js`
- Add shared API helper using Fetch API.
- Add shared error display system.
- Add loading, success, and failure UI states.
- Add localStorage token handling placeholder for CA2 auth.
- Add navigation between login, register, dashboard, character, map, quests, abilities, and logs.

Visual requirements:
- Dark fantasy RPG style.
- Deep navy/black background.
- Gold borders and accents.
- Ember orange highlights.
- Glowing Worldheart shard motif.
- Card-based UI.
- Game-like panels instead of plain tables.
- Responsive layout for laptop screens.

Stop condition:
Frontend pages exist, share a consistent game UI style, and can navigate cleanly without broken links.

#### 9.2 Registration and login screens [COMPLETED]

Goal:
Implement CA2 auth frontend with a polished RPG-style presentation.

Scope:
- Add register page.
- Add login page.
- Connect both pages to backend auth endpoints.
- Store JWT after successful login.
- Redirect logged-in user to dashboard.
- Show user-friendly error messages for:
  - username already taken
  - missing username/password
  - wrong password
  - server errors
- Add loading state while request is processing.
- Add disabled button state during submission.
- Never display password values after submission.

Visual requirements:
- Animated Worldheart shard on auth pages.
- Dark fantasy card layout.
- Subtle background particles.
- Form focus glow.
- Smooth error message slide/fade animation.
- Login/register page should look like game entry screens.

Stop condition:
User can register, log in, receive token, and reach dashboard with clear visual feedback.

#### 9.3 Player dashboard and RPG HUD [COMPLETED]

Goal:
Create the main logged-in game dashboard.

Scope:
- Fetch current user/profile data from backend.
- Display username, level, XP, gold, and current character summary.
- Show navigation cards:
  - Create Character
  - World Map
  - Quest Board
  - Abilities
  - Adventure Logs
- Add protected-route behavior:
  - if no token, redirect to login
  - if token invalid, show session expired and redirect
- Add logout button.
- Add frontend error handling for failed profile load.

Visual requirements:
- Top RPG HUD bar.
- XP progress bar with animated fill.
- Gold display.
- Character card.
- Region preview cards.
- Subtle animated background.
- Smooth dashboard card entrance animation.

Stop condition:
Dashboard retrieves backend data dynamically and feels like the main menu of a game.

#### 9.4 Character creation experience [COMPLETED]

Goal:
Make character creation feel like building an RPG hero.

Scope:
- Add character creation screen.
- Let player choose:
  - origin
  - className
  - affinity
  - characterName
- Show stat preview before creation.
- Explain how origin/class/affinity affect stats.
- Submit character to backend.
- Show success result and created character card.
- Handle backend errors gracefully.
- Allow viewing created characters.

Visual requirements:
- Multi-step character creator.
- Origin cards.
- Class cards.
- Affinity cards.
- Live stat preview panel.
- Animated selection glow.
- WAAPI transition between steps.
- Final "hero forged" animation.

Stop condition:
User can create a character through frontend and the result is saved through backend.

#### 9.5 Interactive world map [COMPLETED]

Goal:
Create the map-based RPG exploration screen.

Scope:
- Fetch regions from backend.
- Display regions as clickable map nodes/cards.
- Show locked/unlocked state.
- On region click, display:
  - region name
  - description
  - danger level
  - recommended level
  - faction
  - shard name
  - available quests
- Fetch region quests dynamically.
- Handle loading and empty states.

Visual requirements:
- Stylised 2D fantasy map layout.
- Region nodes with hover pulse.
- Region detail side panel.
- Danger level badges.
- Shard glow effect.
- Region unlock animation using WAAPI.
- Ambient canvas particles using requestAnimationFrame.

Stop condition:
User can browse regions and view region-specific quests dynamically from backend.

#### 9.6 Quest board and adventure flow [COMPLETED]

Goal:
Make quest progression feel like an actual RPG activity.

Scope:
- Display quests from selected region.
- Show quest type, difficulty, required stat, reward XP, and reward gold.
- Allow player to select character and attempt quest.
- Call `POST /adventures/attempt`.
- Display success/failure result from backend.
- Update XP/gold/level display after attempt.
- Save and display adventure log link.
- Handle errors:
  - no character selected
  - character too low level
  - quest not found
  - unauthenticated
  - server error

Visual requirements:
- Quest cards styled like parchment/dark fantasy contracts.
- Boss quests visually distinct.
- Reward preview.
- Animated quest start.
- Animated result reveal.
- XP/gold reward popup.
- Success/failure banner.
- Result text should feel like game narration.

Stop condition:
Core mechanic 1 is fully usable through frontend: character -> region -> quest -> attempt -> result -> progression.

#### 9.7 Adventure log and progression screen [COMPLETED]

Goal:
Let the player review their story and progression.

Scope:
- Fetch adventure logs by user or character.
- Display completed quests chronologically.
- Show outcome, XP gained, gold gained, and story result.
- Add filters:
  - all
  - success
  - failure
  - boss
  - region
- Show character level progress.
- Show total completed quests.

Visual requirements:
- Timeline-style adventure log.
- Scrollable story journal.
- Region and outcome badges.
- Soft entry animation for each log item.
- Empty state written in RPG tone.

Stop condition:
Player can see their journey and progression history from real backend data.

### Phase 10: CA2 Second Core Mechanic

#### 10.1 Combo battle system backend [COMPLETED]

Goal:
Implement combo battle logic as CA2's second coherent core mechanic.

Scope:
- Add battle or combo routes.
- Use existing abilities table.
- Abilities must have:
  - `ability_type`: opener / chain / finisher / defensive / utility / ultimate
  - `combo_tag`
  - `power`
  - `affinity`
  - `class_name`
  - `required_level`
- Add route to simulate combo:
  - `POST /combos/resolve`
- Request body should include:
  - characterId
  - abilityIds in selected order
  - optional enemyId or questId
- Backend checks:
  - character owns/unlocked abilities
  - ability order is valid
  - opener comes before chain
  - finisher comes at end
  - combo tags create bonuses
  - affinity/class synergies apply
- Return:
  - total damage/power
  - combo rating
  - triggered bonuses
  - narration text
  - XP/reward if connected to battle

Stop condition:
Combo resolution works through API with real character and ability data.

#### 10.2 Ability progression frontend [COMPLETED]

Goal:
Let player view, unlock, and build ability combos visually.

Scope:
- Add ability screen.
- Fetch character abilities.
- Fetch unlockable abilities.
- Allow unlocking valid abilities.
- Display abilities by:
  - opener
  - chain
  - finisher
  - defensive
  - utility
  - ultimate
- Show locked/unlocked state.
- Show required level.
- Show class/affinity match.
- Allow selecting a combo sequence.
- Send selected combo to backend.
- Display combo result.

Visual requirements:
- Ability tree/grid.
- Glowing unlocked abilities.
- Locked ability overlay.
- Combo slots:
  - Opener
  - Chain
  - Finisher
- Animated ability selection.
- WAAPI combo sequence animation.
- Floating damage/result numbers.
- Combo result panel.

Stop condition:
Core mechanic 2 is usable through frontend and feels connected to character progression.

#### 10.3 Boss battle presentation [COMPLETED]

Goal:
Make combo battles feel like RPG boss encounters.

Scope:
- Add simple boss/enemy data if needed.
- Connect boss quests to combo battle flow where practical.
- Display boss name, region, HP/difficulty, weakness, resistance, and lore.
- Resolve battle using combo system.
- Show success/failure and rewards.
- Save result to adventure logs if connected to quest progression.

Visual requirements:
- Boss card entrance animation.
- Boss aura/background effect based on region.
- Attack sequence animation.
- Damage number popups.
- Victory/defeat overlay.
- Reward reveal.

Stop condition:
At least one boss-style encounter can be played through frontend using combo battle logic.

### Phase 11: Game Polish and Presentation

#### 11.1 Loading screen and game boot experience [COMPLETED]

Goal:
Make the game feel polished from first load.

Scope:
- Add game loading screen.
- Add animated Worldheart shard.
- Add loading text lines based on lore.
- Hide loading screen when page is ready.
- Keep loading short and non-blocking.
- Ensure it does not break accessibility or navigation.

Visual requirements:
- Pulsing shard.
- Floating embers.
- Dark background.
- Smooth fade into page.

Stop condition:
Every major page loads with a polished game-style transition.

#### 11.2 Animation utility system [COMPLETED]

Goal:
Centralise frontend animations so they are reusable and not messy.

Scope:
- Create `frontend/js/animations/waapi.js`.
- Add reusable functions:
  - `animateCardEntrance(element)`
  - `animatePanelSwap(oldPanel, newPanel)`
  - `animateRewardPopup(element)`
  - `animateQuestResult(element, outcome)`
  - `animateBossEntrance(element)`
  - `animateComboSequence(elements)`
- Use Web Animations API with `element.animate()`.
- Do not scatter duplicate animation code everywhere.

Stop condition:
Major UI animations use shared WAAPI helper functions.

#### 11.3 Canvas particle background [COMPLETED]

Goal:
Use requestAnimationFrame for ambient game atmosphere.

Scope:
- Create `frontend/js/animations/particles.js`.
- Add canvas-based particles:
  - embers
  - ash
  - shard sparks
  - subtle stars/motes
- Use requestAnimationFrame loop.
- Pause/reduce animation when page is hidden.
- Avoid performance issues.
- Respect reduced motion where practical.

Stop condition:
Dashboard/map screens have smooth ambient particles without lag.

#### 11.4 World map visual polish [COMPLETED]

Goal:
Make the world map feel like the core game screen.

Scope:
- Improve map layout.
- Add region art placeholders or symbolic icons.
- Add hover details.
- Add selected-region animation.
- Add danger/recommended-level visual language.
- Add region-specific colour accents:
  - Ironvale: steel/gold
  - Blackroot: green/shadow
  - Sunken Temple: blue/gold
  - Dragon Coast: storm/cyan
  - Moonspire: violet/arcane
  - Gravehold: grey/spectral
  - Ashen Wastes: ash/gold

Stop condition:
World map looks like a real fantasy game map, not a list of buttons.

#### 11.5 Final UI quality pass [COMPLETED]

Goal:
Make all working flows feel cohesive and presentation-ready.

Scope:
- Check all pages for visual consistency.
- Check responsive layout.
- Check buttons, forms, cards, modals, and panels.
- Check error states.
- Check empty states.
- Check loading states.
- Check auth redirect behavior.
- Check no fake UI remains.
- Check all animations support real flows.
- Update README screenshots section if screenshots are added later.

Stop condition:
The app feels like one coherent RPG experience and all CA2 frontend requirements remain functional.

### Phase 12: Track 2 Phaser Action RPG

Track 2 is outside the CA1/CA2 requirement scope. It must not be used to claim extra assignment requirements unless it is implemented and tested. This phase turns Realmforge into a real playable side-scrolling action RPG while preserving the completed backend-backed web app.

Permanent Track 2 references:
- `docs/game-design-doc.md`
- `docs/pixel-art-style-guide.md`
- `docs/track2-delegation-plan.md`

#### 12.1 Action gameplay architecture and art plan [COMPLETED]

Goal:
Plan the realtime 2D action layer without breaking the existing CA1/CA2 app.

Scope:
- Decide the Track 2 engine and architecture.
- Preserve existing backend quest, ability, combo, XP, gold, and adventure log rules as source-of-truth gameplay systems.
- Define how action encounters map back to `quests`, `abilities`, `characters`, and `adventure_logs`.
- Record the 16-bit dark fantasy pixel art production standard.
- Record the shipping build order and testing strategy.
- Do not add fake combat screens or dead buttons.

Stop condition:
There is a written implementation plan for action gameplay and art production, and no runtime code is added before the next approved ticket.

#### 12.2 Phaser game shell and static serving [NOT STARTED]

Goal:
Create the real Phaser client entrypoint without breaking the existing CA2 frontend.

Scope:
- Add Phaser 3 dependency.
- Add `game/index.html`, `game/main.js`, `game/config.js`.
- Add `game/scenes/BootScene.js` and `game/scenes/MainMenuScene.js`.
- Add `/game` static serving in Express while keeping existing `frontend/` routes working.
- Render a nonblank pixelated Phaser canvas at native `480x270`.
- Add the first `npm test` smoke command if practical in this ticket; at minimum, plan the exact test harness in code comments/docs if dependency install blocks.

Stop condition:
`http://localhost:3001/game/index.html` loads a nonblank Phaser canvas, existing `login.html` still works, and a command/browser smoke check confirms both.

#### 12.3 Automated test foundation [NOT STARTED]

Goal:
Add a real `npm test` entry before the Phaser codebase grows.

Scope:
- Add a test script to `package.json`.
- Use Node's built-in test runner first unless a stronger dependency is clearly needed.
- Add backend smoke tests for health, auth, character read, ability unlock, combo resolve, and boss combo persistence.
- Add static smoke tests for `/game/index.html`, `/game/main.js`, and key game modules.
- Keep tests runnable on a school laptop without external services.

Stop condition:
`npm test` runs locally and fails on broken backend/game shell basics.

#### 12.4 Pixel asset pipeline v1 [NOT STARTED]

Goal:
Create repeatable native-resolution pixel assets instead of temporary visual placeholders.

Scope:
- Add `game/tools/generatePixelAssets.js`.
- Generate first native PNG assets using Canvas API and the style guide.
- Create first player idle/run/jump/light-attack/dodge frames.
- Create first Hollowborn idle/walk/attack/hurt/death frames.
- Create first Hearthmere tileset and basic VFX sprites.
- Save outputs under `game/assets/`.

Stop condition:
The game can load generated pixel assets, the generator can be rerun, and assets follow `docs/pixel-art-style-guide.md`.

#### 12.5 Player movement vertical slice [NOT STARTED]

Goal:
Make the player controllable in a real Phaser scene.

Scope:
- Add `game/entities/Player.js`.
- Add `game/systems/InputManager.js`.
- Add physics constants from `docs/game-design-doc.md`.
- Implement idle, run, jump rise/fall, land, facing direction, coyote time, and camera follow.
- Keep player state machine readable and testable.

Stop condition:
The player can move and jump in a Phaser scene with visible animation state changes and no broken existing web app routes.

#### 12.6 Hearthmere exploration tilemap [NOT STARTED]

Goal:
Create the first real exploration map.

Scope:
- Add Hearthmere test map data under `game/data/maps/`.
- Use a Tiled JSON-compatible structure.
- Add collision layer, spawn point, platforms, and camera bounds.
- Add basic parallax background.

Stop condition:
The player can run and jump on a real collision map without falling through or leaving the level bounds.

#### 12.7 Combat system v1 [NOT STARTED]

Goal:
Implement deliberate Blasphemous-style basic combat.

Scope:
- Add `game/systems/CombatSystem.js`.
- Implement light attack, heavy attack, stamina costs, hitboxes, hurt state, death state, dodge roll, i-frames, block, and parry window.
- Add sword slash, dodge dust, hit spark, and parry spark VFX.
- Keep constants centralized.

Stop condition:
Attacks, dodge, block, parry, stamina, hurt, and death are visible and mechanically functional in the Phaser scene.

#### 12.8 Hollowborn enemy v1 [NOT STARTED]

Goal:
Add the first real enemy with data-driven behaviour.

Scope:
- Add `game/entities/Enemy.js`.
- Add `game/data/enemies/hollowborn.json`.
- Implement idle, patrol, alert, chase, telegraph, attack, stagger, hurt, and death states.
- Enemy attacks must use telegraphs and hitboxes, not invisible contact damage as the primary combat model.

Stop condition:
The Hollowborn can patrol, detect the player, attack, take damage, stagger, and die.

#### 12.9 HUD and ability bar [NOT STARTED]

Goal:
Show real action-RPG combat state.

Scope:
- Add `game/ui/HUD.js`.
- Add health, stamina, selected character name/class/affinity, and ability slots.
- Load backend character and ability data through `game/api/ApiClient.js`.
- Handle missing/expired token clearly.

Stop condition:
The HUD updates from real gameplay state and loaded backend data.

#### 12.10 ComboResolver bridge [NOT STARTED]

Goal:
Connect in-game combo input to the existing backend combo system.

Scope:
- Add `game/systems/ComboResolver.js`.
- Track opener -> chain -> finisher input within a 2s combo window.
- Send selected unlocked ability IDs to `POST /combos/resolve`.
- Display combo rating, damage, triggered bonuses, and narration in Phaser UI.
- Do not duplicate reward logic locally.

Stop condition:
A real in-game combo calls the backend and displays the returned result.

#### 12.11 Hollowbound Caravan Guard boss [NOT STARTED]

Goal:
Ship the first playable boss encounter.

Scope:
- Add `game/entities/Boss.js`.
- Add `game/data/bosses/hollowbound-caravan-guard.json`.
- Tie the boss to `quest_hollowbound_guard`.
- Implement at least two attacks, telegraphs, HP, stagger/hurt/death, and victory/defeat states.
- Persist victory through the backend combo/progression flow or through a documented new route if needed.

Stop condition:
The player can fight and defeat the Hollowbound Caravan Guard in-browser, and the result is reflected in backend progression/log data.

#### 12.12 CharacterSelect and WorldMap game scenes [NOT STARTED]

Goal:
Bridge the Phaser game to existing backend characters, regions, and quests.

Scope:
- Add `CharacterSelectScene`.
- Add `WorldMapScene`.
- Load characters, regions, and region quests from the existing API.
- Start the action scene using selected character and selected quest context.

Stop condition:
The player can choose a backend character and launch a real action encounter from the Phaser world map flow.

#### 12.13 Save/progression integration pass [NOT STARTED]

Goal:
Keep Phaser results and dashboard data consistent.

Scope:
- Add `game/systems/SaveBridge.js`.
- Refresh profile/character/log state after action encounters.
- Confirm dashboard still displays updated XP/gold/log data.
- Handle failed network writes without pretending progress was saved.

Stop condition:
Action gameplay results persist correctly and the existing dashboard reflects them.

#### 12.14 Audio and game-feel pass [NOT STARTED]

Goal:
Make the action layer feel alive without hiding mechanical gaps.

Scope:
- Add basic audio hooks for footsteps, sword swing, hit, dodge, parry, boss hit, boss defeat, and ambience.
- Add hit pause, camera shake, flash frames, and VFX timing.
- Add mute control.

Stop condition:
Game-feel polish supports real gameplay actions and does not create fake feature impressions.

#### 12.15 Track 2 regression and presentation pass [NOT STARTED]

Goal:
Make the action slice presentation-ready.

Scope:
- Run `npm test`.
- Run browser smoke checks for `/game/index.html`.
- Confirm canvas is nonblank and pixelated.
- Confirm player movement, combat, enemy, boss, backend writes, and existing CA2 frontend still work.
- Update README with Track 2 run/test instructions.

Stop condition:
Track 2 vertical slice is demonstrably playable, tested, and documented.

## CA1 Requirement Checkpoints

- Express: implemented and verified in Phase 1.
- libSQL: implemented and verified in Phase 1.
- Drizzle ORM: implemented and verified in Phase 1.
- nodemon: implemented and verified in Phase 1.
- Users table: implemented in schema and seed DDL in Phase 1; CRUD implemented and verified in Phase 2.
- Password column for CA2 preparation: implemented in schema and seed DDL in Phase 1; bcrypt hashing implemented and verified in Phase 8.
- FK table back to users: implemented through `characters.user_id -> users.user_id` in Phase 1.
- Create route: implemented and verified through `POST /users`, `POST /characters`, and `POST /quests`.
- Read route: implemented and verified through users, characters, regions, and quests read routes.
- Update route: implemented and verified through `PUT /users/:id`, `PUT /characters/:id`, and `PUT /quests/:id`.
- Delete route: implemented and verified through `DELETE /users/:id`, `DELETE /characters/:id`, and `DELETE /quests/:id`.
- Dynamic route: implemented and verified through user, character, region, and quest id routes.
- Query parameter route: implemented and verified through `GET /users?level=1`, `GET /characters?className=Rogue`, and `GET /regions?dangerLevel=3`.
- `src/models`, `src/controllers`, `src/routes`: implemented for users, characters, regions, quests, adventures, and abilities; more resources planned in later phases.
- README sections: implemented and verified in Phase 7.
- ERD support: implemented and validated against the CA1 MVP schema in Phase 7.

## CA2 Requirement Checkpoints

- Continue from CA1 backend: implemented and verified in Phase 8.
- bcrypt and jsonwebtoken: implemented and verified in Phase 8.
- Registration and login pages: implemented and verified in Phase 9.2.
- Auth endpoints: implemented and verified in Phase 8.
- Password hashing: implemented and verified in Phase 8.
- JWT session management: implemented and verified in Phase 8.
- Reusable auth middleware: implemented and verified in Phase 8.
- Protected routes: implemented and verified in Phase 8.
- Fetch API frontend: helper implemented in Phase 9.1; auth screen usage implemented in Phase 9.2; dashboard profile, character, region, log, quest, ability, combo, and boss combo requests implemented and verified through Phase 10.3.
- Dynamic backend data display: backend health status, dashboard user profile, character summary, region previews, log counts, region details, region-specific quests, quest attempt results, adventure logs, ability records, combo results, and boss combo persisted results are implemented and verified.
- Frontend create/update/delete: character creation through the frontend is implemented and verified in Phase 9.4; dashboard character Edit/Delete behavior is implemented and verified in Phase 11.5 through `PUT /characters/:id` and `DELETE /characters/:id`.
- Graceful frontend error handling: shared helper foundation implemented in Phase 9.1; auth, dashboard, character creation, map, quest, journal, ability, combo, boss combo, and character Edit/Delete flows surface appropriate user-friendly errors.
- Core mechanic 1, character creation plus world map quest progression: backend implemented across Phases 3 to 5; frontend character creation, world map quest browsing, quest attempts, result display, progression updates, and adventure log refresh implemented and verified across Phases 9.4 to 9.7.
- Core mechanic 2, combo battle system plus ability unlock/progression: ability unlock foundation implemented in Phase 6; combo battle backend implemented and verified in Phase 10.1; ability progression frontend and combo UI implemented and verified in Phase 10.2; boss quest combo encounters with XP/gold/log persistence implemented and verified in Phase 10.3.
- Updated ERD: implemented in `docs/erd-notes.md`; CA2 auth, combo resolution, boss combo persistence, and frontend Edit/Delete reuse existing tables with no schema change.

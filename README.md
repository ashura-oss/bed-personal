# Sauron's Conquest

## Game Theme Description

Sauron's Conquest is a backend-driven fantasy RPG project built for the CA1 Backend Web Development assignment.

The player advances Sauron's return through Mordor, the Black Road, the Ring Gate, and later campaign fronts such as Eregion. Fixed lore, quests, abilities, enemies, items, recipes, maps, and regions live in authored backend modules; player-changing progression lives in database tables.

The CA1 backend supports the first core gameplay loop:

1. Create a user profile.
2. Create a custom RPG character.
3. View world regions.
4. View quests in a region.
5. Attempt quests using character stats and level.
6. Gain XP and gold.
7. Level up.
8. Save and view adventure logs.
9. Unlock abilities for future combo progression.

The game is designed to later become a plain HTML, CSS, and JavaScript 2D browser RPG for CA2.

## Tech Stack

- Node.js
- Express
- libSQL
- Drizzle ORM
- nodemon
- dotenv
- bcrypt
- jsonwebtoken

## Setup and Run Instructions

Install dependencies:

```powershell
npm install
```

Create and seed the local libSQL database:

```powershell
npm run db:seed
```

Optional local environment values:

```powershell
$env:PORT = "3000"
$env:LIBSQL_URL = "file:saurons-conquest.db"
$env:JWT_SECRET = "replace-this-with-a-long-random-secret"
$env:JWT_EXPIRES_IN = "2h"
```

Start the backend server:

```powershell
npm start
```

Start the backend with nodemon during development:

```powershell
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

Health check:

```http
GET http://localhost:3000/health
```

## Useful Test Order

1. `npm install`
2. `npm run db:seed`
3. `npm run dev`
4. `GET /health`
5. Register or login through `/auth/register` or `/auth/login`.
6. Use `Authorization: Bearer <token>` for protected routes.
7. Test users.
8. Test characters.
9. Test regions.
10. Test quests.
11. Test adventure attempts.
12. Test abilities.
13. Open frontend shell pages.

Detailed endpoint examples are in `docs/testing-guide.md`.

## Main Implemented Routes

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Users:

- `GET /users`
- `GET /users?level=1`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

Characters:

- `GET /characters`
- `GET /characters?className=Rogue`
- `GET /characters/:id`
- `GET /users/:userId/characters`
- `POST /characters`
- `PUT /characters/:id`
- `DELETE /characters/:id`

Regions:

- `GET /regions`
- `GET /regions?dangerLevel=3`
- `GET /regions/:id`
- `GET /regions/:regionId/quests`

Quests:

- `GET /quests`
- `GET /quests/:id`
- `POST /quests`
- `PUT /quests/:id`
- `DELETE /quests/:id`

Adventures:

- `POST /adventures/attempt`
- `GET /users/:userId/adventure-logs`
- `GET /characters/:characterId/adventure-logs`

Abilities:

- `GET /abilities`
- `GET /abilities?className=Mage`
- `GET /abilities?affinity=Fire`
- `GET /characters/:characterId/abilities`
- `POST /characters/:characterId/unlock-ability`

Combos:

- `POST /combos/resolve`

Full route details are in `docs/api-reference.md`.

Protected routes require:

```http
Authorization: Bearer <token>
```

The public read routes for regions, quests, abilities, and list-style CA1 checks remain available without login. User-specific profile, character, adventure, ability unlock, combo, and quest mutation routes now require a valid JWT.

## Frontend Shell

The Phase 9.1 frontend shell is served by the Express app.

Pages:

- `http://localhost:3000/`
- `http://localhost:3000/login.html`
- `http://localhost:3000/register.html`
- `http://localhost:3000/dashboard.html`
- `http://localhost:3000/characterCreation.html`

Implemented frontend foundation:

- Plain HTML, CSS, and JavaScript only.
- Shared dark fantasy design system.
- Dashboard HUD, panels, cards, forms, badges, stat blocks, progress bars, modal styles, and responsive layout.
- Shared Fetch API helper in `frontend/js/api.js`.
- Shared localStorage token helpers in `frontend/js/state.js`.
- Shared UI states and navigation helpers in `frontend/js/ui.js`.
- Basic WAAPI and ambient canvas utilities in `frontend/js/animations`.

Implemented auth frontend:

- `login.html` posts to `POST /auth/login`.
- `register.html` posts to `POST /auth/register`.
- Successful auth stores the JWT and public user profile in `localStorage`.
- Successful auth redirects to `dashboard.html`.
- Missing fields, duplicate username, wrong password, and server errors show user-friendly messages.
- Password fields are cleared after each submission.

Implemented dashboard frontend:

- `dashboard.html` requires a stored JWT and redirects unauthenticated users to `login.html`.
- The dashboard fetches the current profile from `GET /auth/me`.
- The dashboard fetches saved characters from `GET /users/:userId/characters`.
- The dashboard fetches live region records from `GET /regions`.
- The dashboard map fetches selected-region quests from `GET /regions/:regionId/quests`.
- The dashboard fetches adventure logs from `GET /users/:userId/adventure-logs` and `GET /characters/:characterId/adventure-logs`.
- The HUD displays username, level, XP progress, total XP, gold, hero count, region count, and log count.
- The map panel displays clickable region nodes, selected region details, faction, shard, danger level, recommended level, and quest previews.
- The quest board lets the player select a region, select a saved character, attempt real quests through `POST /adventures/attempt`, see success/failure results, and update XP, gold, HUD values, and adventure logs.
- The Logs panel renders a timeline journal with journey totals, character XP progress, success/failure/boss filters, region filtering, and character-scoped log loading.
- The Abilities panel fetches real ability and character unlock data, lets valid characters unlock abilities, builds opener/chain/finisher combos, and resolves combos through `POST /combos/resolve`.
- Logout clears the local session and redirects back to login.

Implemented character creation frontend:

- `characterCreation.html` requires a stored JWT session.
- The five-step Hero Forge lets the player choose origin, class, affinity, and character name.
- Live stat preview mirrors the backend stat calculation rules for explanation, while the backend remains the source of truth on save.
- Successful creation posts to `POST /characters`, redirects back to `dashboard.html`, and the saved character appears in the dashboard character panel.

## Database and ERD Notes

The current backend schema uses these dynamic player-state tables:

- `users`
- `characters`
- `save_slots`
- `character_run_states`
- `character_inventory`
- `character_equipment`
- `character_abilities`
- `character_quest_completions`
- `adventure_logs`
- `character_dialogue_flags`
- `character_boss_states`
- `character_campaign_markers`
- `character_faction_reputation`
- `character_region_states`

These compatibility mirror tables also exist for assignment/custom-content routes, while fixed authored definitions live in `src/content/*`:

- `regions`
- `quests`
- `abilities`

Important relationships:

- `characters.user_id -> users.id`
- `save_slots.user_id -> users.id`
- `save_slots.character_id -> characters.id`
- `quests.region_id -> regions.id`
- `adventure_logs.character_id -> characters.id`
- `character_abilities.character_id -> characters.id`
- `character_abilities.ability_id -> abilities.id`
- `character_run_states.character_id -> characters.id`
- `character_quest_completions.character_id -> characters.id`
- `character_inventory.character_id -> characters.id`
- `character_equipment.character_id -> characters.id`
- `character_dialogue_flags.character_id -> characters.id`
- `character_boss_states.character_id -> characters.id`
- `character_campaign_markers.character_id -> characters.id`
- `character_faction_reputation.character_id -> characters.id`
- `character_region_states.character_id -> characters.id`

Detailed ERD support is in `docs/erd-notes.md`.

## Assumptions

- CA2 backend authentication is implemented with bcrypt and JWT.
- New passwords are stored as bcrypt hashes.
- Passwords are never returned by API responses.
- The seeded demo login is `demoSauron` / `demo-password-ca1`.
- The local database uses `file:saurons-conquest.db` unless `LIBSQL_URL` is set.
- Seed data includes one demo user, one demo character, eleven regions, eight quests, fifteen abilities, and one demo unlocked ability.
- Ability unlocks are allowed only when the character meets the ability level, class, and affinity requirements.
- Combo resolution uses real unlocked character abilities and validates ability order. Training/non-boss combo results are simulations; boss quest combo results award XP/gold and write adventure logs.
- Gold is stored on the user profile, while character progression stores XP, level, HP, and stats.
- The Phase 9.1 frontend shell, Phase 9.2 auth screens, Phase 9.3 dashboard HUD, Phase 9.4 character creation frontend, Phase 9.5 interactive world map, Phase 9.6 quest board/adventure flow, Phase 9.7 adventure journal, Phase 10.1 combo backend, Phase 10.2 ability progression frontend, Phase 10.3 boss-style presentation (via the combo flow on boss quests), and the Phase 11.1-11.5 polish pass are all implemented.

## CA2 Frontend Section

Every CA2 frontend feature is reachable from the served HTML/CSS/JavaScript app. The five pages are:

- `login.html` — JWT login screen, posts to `POST /auth/login`, stores the token and user.
- `register.html` — Registration screen, posts to `POST /auth/register`, stores the token and user.
- `dashboard.html` — Player dashboard with HUD, character panel, world map, quest board, abilities/combo board, and adventure journal.
- `characterCreation.html` — Five-step Hero Forge with live stat preview, posts to `POST /characters`.
- `index.html` — Landing screen that links to login and register.

Screens and what each one tests:

| Screen | What to test |
| --- | --- |
| Login | Submit demo `demoSauron` / `demo-password-ca1`, then check that the dashboard loads. Wrong password shows a friendly error. |
| Register | Create a new account, check that the dashboard opens automatically. Duplicate username shows the conflict message. |
| Dashboard HUD | Username, level, XP fill, gold, hero count, region count, and log count are dynamic from `/auth/me` and related endpoints. |
| Character panel | Each saved hero card has **Edit** and **Delete** buttons. Edit opens an inline form to rename the character (origin, class, and affinity are permanent). Delete prompts a confirmation, fades out via WAAPI, and updates the hero count. 401/403/404 and server errors show inline messages. |
| Hero Forge | Multi-step character creation. After saving, the new character appears in the dashboard panel. |
| World Map | Region nodes are positioned with region-specific colour accents. Hovering shows quick details, the selected region pulses, and clicking loads quests from `/regions/:id/quests`. |
| Quest Board | Pick a region, pick a hero, attempt a quest. Regular quests call `POST /adventures/attempt`; boss quests hand off to the Abilities combo screen for a boss encounter. Result, XP/gold reward popups, HUD updates, and log refreshes animate via the centralised WAAPI helpers. |
| Abilities | Pick a character, unlock abilities the hero qualifies for, drop opener/chain/finisher into combo slots, and resolve via `POST /combos/resolve`. When launched from a boss quest, the result awards rewards and saves a boss log. |
| Logs | Filter the adventure journal by outcome, region, and hero. Character XP bars and totals re-render from real backend data. |

Both CA2 core mechanics are interactive in the browser:

1. **Character + world map quest progression** — Hero Forge → World Map → Quest Board → result → HUD/log refresh.
2. **Ability progression + combo battle** — Abilities panel → unlock ability → fill combo slots → Resolve Combo → narrated result panel.

Not implemented yet:

- Realtime/parser/Phaser/Silksong-style action gameplay. That belongs to future Track 2 and should reuse the existing quest, ability, combo, and progression rules instead of replacing them.

Track 2 planning docs:

- `docs/game-design-doc.md` — Phaser action RPG architecture, controls, physics, combat, backend bridge, build order, and testing plan.
- `docs/pixel-art-style-guide.md` — 16-bit dark fantasy pixel art standards, palette, sprite sizes, animation counts, region identity, and asset generation rules.
- Planned first code ticket: `12.2 Phaser game shell and static serving`.

Polish features (Phase 11):

- Pulsing Ring-trace loading screen with rotating lore lines on every page.
- Centralised WAAPI helpers in `frontend/js/animations/waapi.js` (`animateCardEntrance`, `animatePanelSwap`, `animateRewardPopup`, `animateQuestResult`, `animateBossEntrance`, `animateComboSequence`).
- Ambient canvas particles using `requestAnimationFrame` with hidden-tab pause and reduced-motion respect.
- Region-specific colour accents on the world map for Mordor, Eregion, the Ashen Western March, and the Drowned Ring-Vault.
- Consistent dark fantasy buttons, forms, cards, modals, error states, empty states, loading states, and auth redirects across all pages.

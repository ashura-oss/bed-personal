# CA Requirements Map

This file maps CA1 and CA2 requirements to planned project files, routes, tables, and tickets. Status values must be exactly one of:

- [NOT STARTED]
- [IN PROGRESS]
- [SATISFIED]
- [BLOCKED]

## CA1 Requirements

| Requirement | Status | Planned implementation | Ticket |
| --- | --- | --- | --- |
| Craft original game theme | [SATISFIED] | `docs/project-context.md`, `docs/story-bible.md`, and `README.md` | 0.1, 7.1 |
| Use Express | [SATISFIED] | `src/app.js`, `src/server.js`; verified with `GET /health` | 1.1 |
| Use libSQL | [SATISFIED] | `src/db/client.js`; verified with `npm run db:seed` and `/health` | 1.1 |
| Use Drizzle ORM | [SATISFIED] | `src/db/schema.js`, Drizzle insert seed operations | 1.1 |
| Use nodemon | [SATISFIED] | `npm run dev` starts `nodemon src/server.js` | 1.1 |
| Build Express backend server for a game | [SATISFIED] | Game backend, route structure, seed data, quest loop, progression, and ability unlocks implemented and validated | 1.1 onward |
| users table has `user_id <varchar, PK>` | [SATISFIED] | `users.user_id text primary key` in `src/db/schema.js` and seed DDL | 1.1 |
| users table has `username <varchar>` | [SATISFIED] | `users.username text unique not null` in `src/db/schema.js` and seed DDL | 1.1 |
| users table includes `password <varchar>` for CA2 | [SATISFIED] | `users.password text not null`; CA2 auth now stores seeded and new passwords as bcrypt hashes | 1.1, 8.1 |
| At least one FK table back to users | [SATISFIED] | `characters.user_id -> users.user_id`; verified seeded sample character | 1.1 |
| At least one Create route | [SATISFIED] | `POST /users`, `POST /characters`, and `POST /quests` implemented and tested | 2.1, 3.1, 4.1 |
| At least one Read route | [SATISFIED] | Users, characters, regions, and quests read routes implemented and tested | 2.1, 3.1, 4.1 |
| At least one Update route | [SATISFIED] | `PUT /users/:id`, `PUT /characters/:id`, and `PUT /quests/:id` implemented and tested | 2.1, 3.1, 4.1 |
| At least one Delete route | [SATISFIED] | `DELETE /users/:id`, `DELETE /characters/:id`, and `DELETE /quests/:id` implemented and tested | 2.1, 3.1, 4.1 |
| Each route reachable | [SATISFIED] | Implemented user, character, region, quest, adventure, and ability routes are reachable and tested | 2.1 onward |
| Appropriate HTTP status codes | [SATISFIED] | User, character, region, quest, adventure, and ability route status codes verified | 1.1 onward |
| Appropriate error handling | [SATISFIED] | Shared error middleware plus user, character, region, quest, adventure, and ability validation implemented and tested | 1.1 onward |
| Dynamic route | [SATISFIED] | User, character, region, quest, adventure log, and unlock dynamic routes tested | 2.1, 3.1, 4.1, 5.1, 6.1 |
| Query parameter route | [SATISFIED] | `GET /users?level=1`, `GET /characters?className=Rogue`, `GET /regions?dangerLevel=3`, `GET /abilities?className=Mage`, and `GET /abilities?affinity=Fire` tested | 2.1, 3.1, 4.1, 6.1 |
| Use `src/models` | [SATISFIED] | User, character, region, quest, adventure, and ability models implemented | 2.1, 3.1, 4.1, 5.1, 6.1 |
| Use `src/controllers` | [SATISFIED] | User, character, region, quest, adventure, and ability controllers implemented | 2.1, 3.1, 4.1, 5.1, 6.1 |
| Use `src/routes` | [SATISFIED] | User, character, region, quest, adventure, and ability routes implemented | 2.1, 3.1, 4.1, 5.1, 6.1 |
| README includes game theme description | [SATISFIED] | `README.md` includes game theme and CA1 gameplay loop | 7.1 |
| README includes setup and run instructions | [SATISFIED] | `README.md` includes install, seed, start, dev, and test order | 7.1 |
| README includes assumptions | [SATISFIED] | `README.md` includes CA1/CA2 and database assumptions | 7.1 |
| ERD support includes table names | [SATISFIED] | `docs/erd-notes.md` lists all CA1 MVP tables | 0.1, 1.1, 7.1 |
| ERD support includes column names | [SATISFIED] | `docs/erd-notes.md` lists columns for all CA1 MVP tables | 0.1, 1.1, 7.1 |
| ERD support includes data types | [SATISFIED] | `docs/erd-notes.md` lists varchar/int style data types | 0.1, 1.1, 7.1 |
| ERD support includes PK labels | [SATISFIED] | `docs/erd-notes.md` labels PK columns | 0.1, 1.1, 7.1 |
| ERD support includes FK labels | [SATISFIED] | `docs/erd-notes.md` labels FK columns | 0.1, 1.1, 7.1 |
| ERD support includes relationship arrows | [SATISFIED] | `docs/erd-notes.md` lists FK-to-PK relationship arrows | 0.1, 1.1, 7.1 |

## CA2 Requirements

| Requirement | Status | Planned implementation | Ticket |
| --- | --- | --- | --- |
| Continue from CA1 backend | [SATISFIED] | CA2 auth was added on top of the validated CA1 backend without replacing the CA1 data model | 8.1 |
| Use express, libSQL, Drizzle, nodemon | [SATISFIED] | Foundation remains implemented and was rechecked during CA2 auth validation | 1.1, 8.1 |
| Use bcrypt | [SATISFIED] | `bcrypt` dependency added; registration and user creation hash passwords | 8.1 |
| Use jsonwebtoken | [SATISFIED] | `jsonwebtoken` dependency added; login/register issue JWTs and middleware verifies JWTs | 8.1 |
| Users table has password column | [SATISFIED] | `users.password text not null` | 1.1 |
| At least one FK table back to users | [SATISFIED] | `characters.user_id -> users.user_id` | 1.1 |
| CRUD route set remains functional | [SATISFIED] | Users, characters, and quests CRUD remain implemented and exercised through the dashboard character Edit/Delete UI (`PUT /characters/:id`, `DELETE /characters/:id`) and Hero Forge (`POST /characters`) | 2.1 onward, 11.5 |
| Dynamic route remains functional | [SATISFIED] | User, character, region, quest, adventure log, ability unlock, and combo dynamic routes are exercised through dashboard map, journal, ability, and combo flows | 2.1 onward, 11.5 |
| Query parameter route remains functional | [SATISFIED] | User level, character class, region danger, ability class, and ability affinity filters remain implemented and rechecked during the Phase 11 polish pass | 2.1 onward, 11.5 |
| README updated for backend and frontend | [SATISFIED] | README now contains a CA2 frontend section that lists every screen, both core mechanics, the character Edit/Delete flow, and how to test each page | 8.1, 9.1, 11.5 |
| Updated ERD for CA2 | [SATISFIED] | `docs/erd-notes.md` records CA2 auth password hashing and notes that combo resolution and the dashboard character Edit/Delete flow reuse existing tables with no schema change | 8.1, 11.5 |
| Demonstrate core mechanic 1 | [SATISFIED] | Backend and frontend now support character creation, world map/region quest browsing, quest attempts, success/failure results, XP/gold progression, level updates, adventure log writes, and adventure journal review/filtering | 3.1, 4.1, 5.1, 9.4, 9.5, 9.6, 9.7 |
| Demonstrate core mechanic 2 | [SATISFIED] | Ability unlock/progression foundation, backend combo resolution, frontend ability board/combo slot/result flow, and boss quest combo encounters with XP/gold/log persistence are implemented and tested | 6.1, 10.1, 10.2, 10.3 |
| Registration page | [SATISFIED] | `frontend/register.html` posts to `POST /auth/register`, stores token/user, handles errors, and redirects to dashboard | 9.1, 9.2 |
| Login page | [SATISFIED] | `frontend/login.html` posts to `POST /auth/login`, stores token/user, handles errors, and redirects to dashboard | 9.1, 9.2 |
| `POST /auth/register` | [SATISFIED] | `src/routes/authRoutes.js`, `src/controllers/authController.js`; tested with `201 Created` and duplicate `409 Conflict` | 8.1 |
| `POST /auth/login` | [SATISFIED] | `src/routes/authRoutes.js`, `src/controllers/authController.js`; tested with `200 OK` and wrong password `401 Unauthorized` | 8.1 |
| Hash passwords using bcrypt | [SATISFIED] | `src/utils/passwords.js`, auth registration, original `POST /users`, and seed script | 8.1 |
| Never store plaintext passwords after CA2 auth | [SATISFIED] | New and seeded passwords are bcrypt hashes; legacy plaintext is migrated on successful login | 8.1 |
| Never return passwords in API responses | [SATISFIED] | User, auth, login, register, and `/auth/me` responses were checked for no password field | 2.1, 8.1 |
| Use JWT for session management | [SATISFIED] | `src/utils/tokens.js` issues/verifies JWTs; auth middleware uses Bearer tokens | 8.1 |
| Include token in protected requests | [SATISFIED] | Backend supports `Authorization: Bearer <token>`; frontend stores token, API helper attaches it, and dashboard protected profile/character/log/ability/combo/boss requests were tested | 8.1, 9.1, 9.2, 9.3, 10.2, 10.3 |
| Reusable auth middleware in `src/middlewares` | [SATISFIED] | `src/middlewares/authMiddleware.js` | 8.1 |
| Protected routes reject unauthenticated requests | [SATISFIED] | Missing token returns `401 Unauthorized`; wrong-owner token returns `403 Forbidden` | 8.1 |
| Frontend uses Fetch API or Axios | [SATISFIED] | Fetch API helper exists in `frontend/js/api.js`; auth screens, dashboard data loading, character creation, map quest loading, quest attempts, adventure log screens, ability unlocks, combo resolution, and boss combo resolution use the Fetch-backed helper | 9.1 onward |
| Frontend displays backend data dynamically | [SATISFIED] | Dashboard fetches and displays `/auth/me`, user characters, user adventure logs, character adventure logs, region records, selected region details, region-specific quest records, quest attempt results, refreshed user progression, enriched journal metadata, ability records, character unlocks, combo results, and boss combo adventure-log writes from the backend | 9.1, 9.3, 9.5, 9.6, 9.7, 10.2, 10.3 |
| Frontend creates/updates/deletes at least one entity | [SATISFIED] | Frontend creates characters in the Hero Forge (`POST /characters`), renames characters via the dashboard inline Edit form (`PUT /characters/:id`), and removes them via the dashboard Delete button with confirmation and WAAPI fade (`DELETE /characters/:id`) | 9.4, 11.5 |
| Frontend handles backend errors gracefully | [SATISFIED] | Auth, dashboard, character creation, map, quest, journal, ability, combo, and character Edit/Delete flows all surface 401/403/404/400/5xx errors with friendly inline messages; 401 redirects to login with a flash message; empty/loading/error states are consistent across panels | 9.1 onward, 11.5 |
| Frontend allows interaction with both core mechanics | [SATISFIED] | Core mechanic 1 is usable through character creation, map, quest board, adventure results, and journal review; core mechanic 2 is usable through the ability board, real unlocks, combo slots, backend combo result display, and boss quest combo encounters that save progression | 9.1, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3 |

## Current Rule

Statuses in this file describe requirement satisfaction, not just planning. Do not mark a requirement `[SATISFIED]` until the corresponding implementation exists and has been tested.

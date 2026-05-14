# API Reference

This document must only describe implemented routes as complete. Planned routes are listed separately and must not be treated as working until their ticket is implemented and tested.

Current status:
- Phase 1 has implemented the Express app foundation, database connection, seed script, and health route.
- Phase 2.1 has implemented and tested Users CRUD.
- Phase 3.1 has implemented and tested Characters CRUD.
- Phase 4.1 has implemented and tested Region read routes and Quest CRUD.
- Phase 5.1 has implemented and tested Adventure attempts and Adventure log reads.
- Phase 6.1 has implemented and tested Ability reads and Character ability unlocks.
- Phase 7.1 has validated the implemented CA1 backend route set.
- Phase 8.1 has implemented and tested CA2 auth endpoints, bcrypt password hashing, JWT issue/verify, reusable auth middleware, and protected route behavior.
- Phase 9.1 has implemented and tested the static frontend shell served by Express.
- Phase 9.2 has implemented and tested frontend login/register screen wiring to the CA2 auth endpoints.
- Phase 9.3 has implemented and tested the dashboard HUD, protected dashboard redirect behavior, profile loading, character summary, region previews, adventure log count, and logout behavior.
- Phase 9.4 has implemented and tested the character creation frontend flow against `POST /characters`.
- Phase 9.5 has implemented and tested interactive dashboard world map browsing against `GET /regions` and `GET /regions/:regionId/quests`.
- Phase 9.6 has implemented and tested the quest board frontend flow against `POST /adventures/attempt` and refreshed adventure logs.
- Phase 9.7 has implemented and tested the adventure journal frontend against enriched user and character adventure-log responses.
- Phase 10.1 has implemented and tested backend combo resolution against real characters and unlocked abilities.
- Phase 10.2 has implemented and tested the dashboard ability progression frontend and protected character ability read route.
- Phase 10.3 has implemented and tested boss quest combo resolution: boss quests sent to `POST /combos/resolve` award XP/gold and write adventure logs.

## Error Response Format

All implemented routes must use this JSON error shape:

```json
{
  "error": "Short error title",
  "message": "Clear explanation",
  "details": "Optional details"
}
```

## Authentication

CA2 backend authentication is implemented.

Use this header for protected routes:

```http
Authorization: Bearer <token>
```

Protected routes:
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

Protected route auth errors:
- `401 Unauthorized` when the token is missing, malformed, invalid, or expired.
- `403 Forbidden` when the token is valid but belongs to a different user.

## Implemented Routes

### Health Check

Method:
`GET`

Route:
`/health`

Request body:
None.

Example response:

```json
{
  "status": "ok",
  "project": "Realmforge: Shards of the Worldheart",
  "database": "connected"
}
```

Description:
Checks that the Express server is running and can connect to libSQL.

Status codes:
- `200 OK` when the server and database connection are healthy.
- `500 Internal Server Error` if the database check fails.

### Frontend Shell Pages

Method:
`GET`

Routes:
- `/`
- `/index.html`
- `/login.html`
- `/register.html`
- `/dashboard.html`
- `/characterCreation.html`

Description:
Serves the plain HTML/CSS/JavaScript frontend. Login and register forms are connected to `POST /auth/login` and `POST /auth/register`, store JWTs in `localStorage`, and redirect successful auth to `dashboard.html`. The dashboard uses the stored JWT to call `GET /auth/me`, `GET /users/:userId/characters`, `GET /users/:userId/adventure-logs`, `GET /characters/:characterId/adventure-logs`, `GET /characters/:characterId/abilities`, `POST /characters/:characterId/unlock-ability`, and `POST /combos/resolve`, reads public region data from `GET /regions`, loads selected-region quests from `GET /regions/:regionId/quests`, attempts quests through `POST /adventures/attempt`, and renders the adventure journal and ability combo board from real backend records. `characterCreation.html` uses the stored JWT to create real character records through `POST /characters`.

Status codes:
- `200 OK` when the static file exists.
- `404 Not Found` for missing static files or missing API routes.

### Not Found

Any route that is not implemented returns:

```json
{
  "error": "Not Found",
  "message": "No route found for GET /missing-route"
}
```

Status codes:
- `404 Not Found`.

### Register

Method:
`POST`

Route:
`/auth/register`

Request body:

```json
{
  "username": "newPlayer",
  "password": "strongPassword123"
}
```

Example response:

```json
{
  "user": {
    "userId": "user_00000000-0000-0000-0000-000000000000",
    "username": "newPlayer",
    "level": 1,
    "xp": 0,
    "gold": 0,
    "createdAt": "2026-05-12T12:00:00.000Z"
  },
  "token": "jwt-token-string",
  "tokenType": "Bearer",
  "expiresIn": "2h"
}
```

Description:
Creates a new user, hashes the password with bcrypt, returns the public user profile, and issues a JWT. Passwords are never returned.

Status codes:
- `201 Created`
- `400 Bad Request` if `username` or `password` is missing or empty.
- `409 Conflict` if the username already exists.

### Login

Method:
`POST`

Route:
`/auth/login`

Request body:

```json
{
  "username": "demoUnbound",
  "password": "demo-password-ca1"
}
```

Example response:

```json
{
  "user": {
    "userId": "user_demo_unbound",
    "username": "demoUnbound",
    "level": 1,
    "xp": 0,
    "gold": 25,
    "createdAt": "2026-05-12T12:00:00.000Z"
  },
  "token": "jwt-token-string",
  "tokenType": "Bearer",
  "expiresIn": "2h"
}
```

Description:
Verifies a username and password, then returns a JWT for protected requests. If a legacy plaintext password is encountered, a successful login migrates it to a bcrypt hash.

Status codes:
- `200 OK`
- `400 Bad Request` if `username` or `password` is missing or empty.
- `401 Unauthorized` if the username or password is incorrect.

### Get Current User

Method:
`GET`

Route:
`/auth/me`

Headers:

```http
Authorization: Bearer <token>
```

Request body:
None.

Description:
Returns the public user profile for the currently authenticated token.

Status codes:
- `200 OK`
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `404 Not Found` if the token user no longer exists.

### Get Users

Method:
`GET`

Route:
`/users`

Query parameters:
- `level` optional positive integer.

Example:
`GET /users?level=1`

Request body:
None.

Example response:

```json
[
  {
    "userId": "user_demo_unbound",
    "username": "demoUnbound",
    "level": 1,
    "xp": 0,
    "gold": 25,
    "createdAt": "2026-05-12T07:32:58.801Z"
  }
]
```

Description:
Returns all users, or users filtered by level. Passwords are never returned.

Status codes:
- `200 OK`
- `400 Bad Request` if `level` is not a positive integer.

### Get User By Id

Method:
`GET`

Route:
`/users/:id`

Request body:
None.

Example response:

```json
{
  "userId": "user_demo_unbound",
  "username": "demoUnbound",
  "level": 1,
  "xp": 0,
  "gold": 25,
  "createdAt": "2026-05-12T07:32:58.801Z"
}
```

Description:
Returns one user by id. This is a protected route. Passwords are never returned.

Status codes:
- `200 OK`
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token belongs to a different user.
- `404 Not Found` if the user does not exist.

### Create User

Method:
`POST`

Route:
`/users`

Request body:

```json
{
  "username": "ashwarden",
  "password": "test123"
}
```

Example response:

```json
{
  "userId": "user_00000000-0000-0000-0000-000000000000",
  "username": "ashwarden",
  "level": 1,
  "xp": 0,
  "gold": 0,
  "createdAt": "2026-05-12T07:47:24.467Z"
}
```

Description:
Creates a user profile through the original CA1 route. Password is hashed with bcrypt and is not returned. For CA2 login flow, prefer `POST /auth/register` because it also returns a JWT.

Status codes:
- `201 Created`
- `400 Bad Request` if `username` or `password` is missing or empty.
- `409 Conflict` if the username already exists.

### Update User

Method:
`PUT`

Route:
`/users/:id`

Request body:

```json
{
  "username": "worldheartSeeker",
  "level": 2,
  "xp": 100,
  "gold": 50
}
```

Allowed fields:
- `username`
- `level`
- `xp`
- `gold`

Example response:

```json
{
  "userId": "user_00000000-0000-0000-0000-000000000000",
  "username": "worldheartSeeker",
  "level": 2,
  "xp": 100,
  "gold": 50,
  "createdAt": "2026-05-12T07:47:24.467Z"
}
```

Description:
Updates user profile/progression fields. This is a protected route. Password updates are not exposed through this route.

Status codes:
- `200 OK`
- `400 Bad Request` if no valid field is provided or numeric fields are invalid.
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token belongs to a different user.
- `404 Not Found` if the user does not exist.
- `409 Conflict` if the username already exists.

### Delete User

Method:
`DELETE`

Route:
`/users/:id`

Request body:
None.

Response body:
None.

Description:
Deletes a user by id. This is a protected route. Related rows using cascading foreign keys are also deleted by the database.

Status codes:
- `204 No Content`
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token belongs to a different user.
- `404 Not Found` if the user does not exist.

### Create Character

Method:
`POST`

Route:
`/characters`

Request body:

```json
{
  "userId": "user_demo_unbound",
  "characterName": "Mira Ashstep",
  "origin": "Street Thief",
  "className": "Rogue",
  "affinity": "Shadow"
}
```

Allowed origins:
- `Exiled Noble`
- `Street Thief`
- `Cursed Scholar`
- `Temple Acolyte`
- `Village Hunter`
- `Mercenary`
- `Forgotten Heir`
- `Monster-Blooded Outcast`

Allowed classes:
- `Warrior`
- `Mage`
- `Rogue`
- `Cleric`
- `Ranger`
- `Necromancer`
- `Paladin`
- `Spellblade`
- `Alchemist`
- `Warlock`

Allowed affinities:
- `Fire`
- `Ice`
- `Lightning`
- `Shadow`
- `Holy`
- `Nature`
- `Blood`
- `Arcane`
- `Storm`

Example response:

```json
{
  "characterId": "char_00000000-0000-0000-0000-000000000000",
  "userId": "user_demo_unbound",
  "characterName": "Mira Ashstep",
  "origin": "Street Thief",
  "className": "Rogue",
  "affinity": "Shadow",
  "level": 1,
  "xp": 0,
  "hp": 100,
  "strength": 5,
  "intelligence": 5,
  "agility": 12,
  "faith": 5,
  "endurance": 5,
  "charisma": 7,
  "createdAt": "2026-05-12T08:10:16.182Z"
}
```

Description:
Creates a character for the logged-in user. This is a protected route, and request `userId` must match the JWT user. Stats are calculated by server-side game rules from origin, className, and affinity.

Status codes:
- `201 Created`
- `400 Bad Request` for missing or invalid fields.
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token user does not match `userId`.
- `404 Not Found` if the user does not exist.

### Get Characters

Method:
`GET`

Route:
`/characters`

Query parameters:
- `className` optional class filter.

Example:
`GET /characters?className=Mage`

Request body:
None.

Example response:

```json
[
  {
    "characterId": "char_demo_kael",
    "userId": "user_demo_unbound",
    "characterName": "Kael",
    "origin": "Village Hunter",
    "className": "Ranger",
    "affinity": "Nature",
    "level": 1,
    "xp": 0,
    "hp": 100,
    "strength": 7,
    "intelligence": 5,
    "agility": 8,
    "faith": 6,
    "endurance": 7,
    "charisma": 5,
    "createdAt": "2026-05-12T07:32:58.801Z"
  }
]
```

Description:
Returns all characters or characters filtered by className.

Status codes:
- `200 OK`
- `400 Bad Request` if `className` is not an allowed class.

### Get Character By Id

Method:
`GET`

Route:
`/characters/:id`

Request body:
None.

Description:
Returns one character by id. This is a protected route, and the token user must own the character.

Status codes:
- `200 OK`
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token user does not own the character.
- `404 Not Found` if the character does not exist.

### Get Characters For User

Method:
`GET`

Route:
`/users/:userId/characters`

Request body:
None.

Description:
Returns all characters belonging to one user. This is a protected route, and the token user must match `userId`.

Status codes:
- `200 OK`
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token belongs to a different user.
- `404 Not Found` if the user does not exist.

### Update Character

Method:
`PUT`

Route:
`/characters/:id`

Request body:

```json
{
  "characterName": "Mira Worldshade",
  "className": "Spellblade",
  "affinity": "Fire"
}
```

Allowed fields:
- `characterName`
- `origin`
- `className`
- `affinity`

Description:
Updates a character. If origin, className, or affinity changes, stats are recalculated by server-side game rules. This is a protected route, and the token user must own the character.

Status codes:
- `200 OK`
- `400 Bad Request` if no valid field is provided or a value is invalid.
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token user does not own the character.
- `404 Not Found` if the character does not exist.

### Delete Character

Method:
`DELETE`

Route:
`/characters/:id`

Request body:
None.

Response body:
None.

Description:
Deletes a character by id. This is a protected route, and the token user must own the character. Related rows using cascading foreign keys are also deleted by the database.

Status codes:
- `204 No Content`
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token user does not own the character.
- `404 Not Found` if the character does not exist.

### Get Regions

Method:
`GET`

Route:
`/regions`

Query parameters:
- `dangerLevel` optional positive integer.

Example:
`GET /regions?dangerLevel=3`

Request body:
None.

Example response:

```json
[
  {
    "regionId": "region_hearthmere_outpost",
    "name": "Hearthmere Outpost",
    "description": "A fortified starter settlement built from old caravans, broken statues, and repaired stone walls.",
    "dangerLevel": 1,
    "recommendedLevel": 1,
    "faction": "Free Guilds",
    "shardName": "Minor Worldheart Shard",
    "isUnlocked": 1
  }
]
```

Description:
Returns all seeded world map regions, or regions filtered by danger level.

Status codes:
- `200 OK`
- `400 Bad Request` if `dangerLevel` is not a positive integer.

### Get Region By Id

Method:
`GET`

Route:
`/regions/:id`

Request body:
None.

Description:
Returns one world map region by id.

Status codes:
- `200 OK`
- `404 Not Found` if the region does not exist.

### Get Quests In Region

Method:
`GET`

Route:
`/regions/:regionId/quests`

Request body:
None.

Description:
Returns all quests belonging to one region. The region must exist.

Status codes:
- `200 OK`
- `404 Not Found` if the region does not exist.

### Get Quests

Method:
`GET`

Route:
`/quests`

Request body:
None.

Example response:

```json
[
  {
    "questId": "quest_road_that_still_stands",
    "regionId": "region_hearthmere_outpost",
    "title": "The Road That Still Stands",
    "description": "Clear Hollowborn from the Ashfall Road so caravans can reach Hearthmere again.",
    "questType": "combat",
    "requiredLevel": 1,
    "difficulty": 1,
    "requiredStat": "strength",
    "requiredStatValue": 6,
    "rewardXp": 35,
    "rewardGold": 20,
    "successText": "The road is safer, and Hearthmere's people speak your name with cautious hope.",
    "failureText": "The Hollowborn force you back. The road remains dangerous."
  }
]
```

Description:
Returns all quests ordered by required level.

Status codes:
- `200 OK`

### Get Quest By Id

Method:
`GET`

Route:
`/quests/:id`

Request body:
None.

Description:
Returns one quest by id.

Status codes:
- `200 OK`
- `404 Not Found` if the quest does not exist.

### Create Quest

Method:
`POST`

Route:
`/quests`

Request body:

```json
{
  "regionId": "region_hearthmere_outpost",
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

Allowed quest types:
- `combat`
- `dialogue`
- `exploration`
- `lore`
- `boss`
- `magic`

Allowed required stats:
- `strength`
- `intelligence`
- `agility`
- `faith`
- `endurance`
- `charisma`

Description:
Creates a quest linked to an existing region. This is a protected route.

Status codes:
- `201 Created`
- `400 Bad Request` for missing or invalid fields.
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `404 Not Found` if the region does not exist.

### Update Quest

Method:
`PUT`

Route:
`/quests/:id`

Request body:

```json
{
  "title": "Updated Quest Title",
  "questType": "lore",
  "requiredStat": "intelligence",
  "requiredStatValue": 6,
  "rewardGold": 12
}
```

Allowed fields:
- `regionId`
- `title`
- `description`
- `questType`
- `requiredLevel`
- `difficulty`
- `requiredStat`
- `requiredStatValue`
- `rewardXp`
- `rewardGold`
- `successText`
- `failureText`

Description:
Updates an existing quest. This is a protected route. If `regionId` is changed, the new region must exist.

Status codes:
- `200 OK`
- `400 Bad Request` if no valid field is provided or a value is invalid.
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `404 Not Found` if the quest or updated region does not exist.

### Delete Quest

Method:
`DELETE`

Route:
`/quests/:id`

Request body:
None.

Response body:
None.

Description:
Deletes a quest by id. This is a protected route.

Status codes:
- `204 No Content`
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `404 Not Found` if the quest does not exist.

### Attempt Adventure

Method:
`POST`

Route:
`/adventures/attempt`

Request body:

```json
{
  "userId": "user_demo_unbound",
  "characterId": "char_demo_kael",
  "questId": "quest_road_that_still_stands"
}
```

Description:
Attempts a quest with one character. This is a protected route, and request `userId` must match the JWT user. The server validates the user, character, character ownership, quest existence, and required level. Success is calculated from the quest's required stat, the character's matching stat, and the character level bonus. Successful attempts grant full XP and gold. Failed attempts grant small XP and no gold. Character XP, level, and HP are updated; user XP, level, and gold are updated; an adventure log is saved.

Example success response:

```json
{
  "outcome": "success",
  "resultText": "The last Hollowborn falls, and the road breathes again beneath the ash.",
  "rewards": {
    "xp": 30,
    "gold": 15
  },
  "challenge": {
    "requiredStat": "strength",
    "characterStat": 7,
    "levelBonus": 0,
    "totalScore": 7,
    "requiredStatValue": 6,
    "difficulty": 1
  },
  "quest": {
    "questId": "quest_road_that_still_stands",
    "title": "The Road That Still Stands",
    "questType": "combat",
    "requiredLevel": 1,
    "difficulty": 1
  },
  "characterProgression": {
    "previousXp": 0,
    "nextXp": 30,
    "previousLevel": 1,
    "nextLevel": 1,
    "levelsGained": 0,
    "previousHp": 100,
    "nextHp": 100
  },
  "userProgression": {
    "previousXp": 0,
    "nextXp": 30,
    "previousGold": 25,
    "nextGold": 40,
    "previousLevel": 1,
    "nextLevel": 1,
    "levelsGained": 0
  },
  "character": {
    "characterId": "char_demo_kael",
    "userId": "user_demo_unbound",
    "characterName": "Kael",
    "origin": "Village Hunter",
    "className": "Ranger",
    "affinity": "Nature",
    "level": 1,
    "xp": 30,
    "hp": 100,
    "strength": 7,
    "intelligence": 5,
    "agility": 8,
    "faith": 6,
    "endurance": 7,
    "charisma": 5,
    "createdAt": "2026-05-12T10:15:00.000Z"
  },
  "user": {
    "userId": "user_demo_unbound",
    "username": "demoUnbound",
    "level": 1,
    "xp": 30,
    "gold": 40,
    "createdAt": "2026-05-12T10:15:00.000Z"
  },
  "adventureLog": {
    "logId": "log_00000000-0000-0000-0000-000000000000",
    "userId": "user_demo_unbound",
    "characterId": "char_demo_kael",
    "questId": "quest_road_that_still_stands",
    "outcome": "success",
    "xpGained": 30,
    "goldGained": 15,
    "resultText": "The last Hollowborn falls, and the road breathes again beneath the ash.",
    "createdAt": "2026-05-12T10:15:00.000Z"
  }
}
```

Status codes:
- `200 OK`
- `400 Bad Request` if required fields are missing, the character does not belong to the user, or the character level is too low.
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token user does not match `userId`.
- `404 Not Found` if the user, character, or quest does not exist.

### Get Adventure Logs For User

Method:
`GET`

Route:
`/users/:userId/adventure-logs`

Request body:
None.

Description:
Returns adventure logs for one existing user, newest first. Each log includes joined quest, region, and character display metadata for the frontend journal. This is a protected route, and the token user must match `userId`.

Example response:

```json
[
  {
    "logId": "log_00000000-0000-0000-0000-000000000000",
    "userId": "user_demo_unbound",
    "characterId": "char_demo_kael",
    "questId": "quest_road_that_still_stands",
    "outcome": "success",
    "xpGained": 30,
    "goldGained": 15,
    "resultText": "The last Hollowborn falls, and the road breathes again beneath the ash.",
    "createdAt": "2026-05-12T10:15:00.000Z",
    "questTitle": "The Road That Still Stands",
    "questType": "combat",
    "regionId": "region_hearthmere_outpost",
    "regionName": "Hearthmere Outpost",
    "characterName": "Kael Ashborne",
    "characterClassName": "Warrior",
    "characterAffinity": "Fire"
  }
]
```

Status codes:
- `200 OK`
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token belongs to a different user.
- `404 Not Found` if the user does not exist.

### Get Adventure Logs For Character

Method:
`GET`

Route:
`/characters/:characterId/adventure-logs`

Request body:
None.

Description:
Returns adventure logs for one existing character, newest first. Each log includes the same joined quest, region, and character display metadata as the user log endpoint. This is a protected route, and the token user must own the character.

Example response:

```json
[
  {
    "logId": "log_00000000-0000-0000-0000-000000000000",
    "userId": "user_demo_unbound",
    "characterId": "char_demo_kael",
    "questId": "quest_hollowbound_guard",
    "outcome": "success",
    "xpGained": 60,
    "goldGained": 30,
    "resultText": "The Hollowbound Guard drops its broken blade as a final memory returns.",
    "createdAt": "2026-05-12T10:20:00.000Z",
    "questTitle": "Hollowbound Guard",
    "questType": "boss",
    "regionId": "region_hearthmere_outpost",
    "regionName": "Hearthmere Outpost",
    "characterName": "Kael Ashborne",
    "characterClassName": "Warrior",
    "characterAffinity": "Fire"
  }
]
```

Status codes:
- `200 OK`
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token user does not own the character.
- `404 Not Found` if the character does not exist.

### Get Abilities

Method:
`GET`

Route:
`/abilities`

Query parameters:
- `className` optional class filter.
- `affinity` optional affinity filter.

Examples:
- `GET /abilities`
- `GET /abilities?className=Mage`
- `GET /abilities?affinity=Fire`
- `GET /abilities?className=Mage&affinity=Arcane`

Request body:
None.

Example response:

```json
[
  {
    "abilityId": "ability_arcane_surge",
    "name": "Arcane Surge",
    "className": "Mage",
    "affinity": "Arcane",
    "abilityType": "finisher",
    "power": 14,
    "comboTag": "arcane-finisher",
    "requiredLevel": 2,
    "description": "Release stored willpower as a decisive burst of raw arcane force."
  }
]
```

Description:
Returns seeded abilities for class, affinity, and future combo progression. Filters are exact matches.

Status codes:
- `200 OK`
- `400 Bad Request` if `className` or `affinity` is not allowed.

### Get Character Abilities

Method:
`GET`

Route:
`/characters/:characterId/abilities`

Request body:
None.

Description:
Returns the real abilities unlocked by one owned character. This is a protected route used by the Phase 10.2 ability progression frontend to show unlocked, ready, and locked states without fake data.

Example response:

```json
[
  {
    "characterAbilityId": "char_ability_demo_thornbind",
    "unlockedAt": "2026-05-12T07:32:58.801Z",
    "abilityId": "ability_thornbind",
    "name": "Thornbind",
    "className": "Ranger",
    "affinity": "Nature",
    "abilityType": "utility",
    "power": 8,
    "comboTag": "nature-control",
    "requiredLevel": 1,
    "description": "Call roots from broken soil to slow an enemy's advance."
  }
]
```

Status codes:
- `200 OK`
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token user does not own the character.
- `404 Not Found` if the character does not exist.

### Unlock Character Ability

Method:
`POST`

Route:
`/characters/:characterId/unlock-ability`

Request body:

```json
{
  "abilityId": "ability_vanish"
}
```

Description:
Unlocks an ability for a character and saves it in `character_abilities`. This is a protected route, and the token user must own the character. The character must exist, the ability must exist, the character must meet the ability's `requiredLevel`, and any ability `className` or `affinity` restriction must match the character.

Example response:

```json
{
  "characterAbility": {
    "characterAbilityId": "char_ability_00000000-0000-0000-0000-000000000000",
    "characterId": "char_00000000-0000-0000-0000-000000000000",
    "abilityId": "ability_vanish",
    "unlockedAt": "2026-05-12T11:00:00.000Z"
  },
  "ability": {
    "abilityId": "ability_vanish",
    "name": "Vanish",
    "className": "Rogue",
    "affinity": "Shadow",
    "abilityType": "opener",
    "power": 6,
    "comboTag": "shadow-opener",
    "requiredLevel": 1,
    "description": "Slip out of sight long enough to begin a shadow combo."
  }
}
```

Status codes:
- `201 Created`
- `400 Bad Request` if `abilityId` is missing, level is too low, className does not match, or affinity does not match.
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token user does not own the character.
- `404 Not Found` if the character or ability does not exist.
- `409 Conflict` if the character already unlocked the ability.

### Resolve Combo

Method:
`POST`

Route:
`/combos/resolve`

Request body:

```json
{
  "characterId": "char_00000000-0000-0000-0000-000000000000",
  "abilityIds": ["ability_vanish", "ability_shadow_cut"],
  "questId": "quest_road_that_still_stands"
}
```

Optional fields:
- `questId` connects the combo to an existing quest target.
- For non-boss quests, `questId` returns a non-persisted reward preview only.
- For boss quests, `questId` turns the combo into a real boss encounter: the route awards XP/gold, updates user and character progression, and writes an adventure log.
- `enemyId` may be provided instead of `questId` for an external enemy target id.

Description:
Resolves an ordered ability combo for one owned character. The route requires JWT auth, checks that the character exists and belongs to the logged-in user, checks that every selected ability is already unlocked by the character, validates combo order, applies class/affinity/tag bonuses, and returns total power/damage, rating, bonuses, target result, and narration. Training, enemy, and non-boss quest targets are simulation-only. Boss quest targets are persisted gameplay: the route awards rewards, updates progression, and writes a boss adventure log.

Example response:

```json
{
  "character": {
    "characterId": "char_00000000-0000-0000-0000-000000000000",
    "characterName": "Cipher Shade",
    "level": 1,
    "className": "Rogue",
    "affinity": "Shadow"
  },
  "selectedAbilities": [
    {
      "abilityId": "ability_vanish",
      "name": "Vanish",
      "abilityType": "opener",
      "power": 6,
      "comboTag": "shadow-opener",
      "className": "Rogue",
      "affinity": "Shadow"
    },
    {
      "abilityId": "ability_shadow_cut",
      "name": "Shadow Cut",
      "abilityType": "chain",
      "power": 10,
      "comboTag": "shadow-chain",
      "className": "Rogue",
      "affinity": "Shadow"
    }
  ],
  "basePower": 16,
  "statBonus": 6,
  "levelBonus": 0,
  "bonusPower": 17,
  "totalPower": 39,
  "totalDamage": 39,
  "comboRating": "B",
  "triggeredBonuses": [
    {
      "name": "Class Synergy",
      "value": 4,
      "description": "2 abilities match Rogue."
    },
    {
      "name": "Affinity Synergy",
      "value": 4,
      "description": "2 abilities match Shadow."
    },
    {
      "name": "Structured Combo",
      "value": 4,
      "description": "The combo uses an opener before a chain ability."
    },
    {
      "name": "Combo Tag Resonance",
      "value": 5,
      "description": "shadow tags connect 2 abilities."
    }
  ],
  "target": {
    "type": "quest",
    "questId": "quest_road_that_still_stands",
    "title": "The Road That Still Stands",
    "questType": "combat",
    "requiredPower": 12,
    "outcome": "combo_success",
    "rewardPreview": {
      "xp": 30,
      "gold": 15,
      "isAwarded": false
    }
  },
  "narrationText": "Cipher Shade threads Vanish -> Shadow Cut against The Road That Still Stands, releasing 39 combo power."
}
```

Boss quest responses include the same combo fields plus persisted progression fields:

```json
{
  "outcome": "success",
  "resultText": "You defeat the Hollowbound Guard. Kael threads Verdant Strike -> Beastcall -> Heartwood Finish against Hollowbound Guard, releasing 63 combo power.",
  "rewards": {
    "xp": 60,
    "gold": 25
  },
  "target": {
    "type": "quest",
    "questType": "boss",
    "rewardPreview": {
      "xp": 60,
      "gold": 25,
      "isAwarded": true
    }
  },
  "characterProgression": {
    "leveledUp": true
  },
  "adventureLog": {
    "logId": "log_...",
    "outcome": "success"
  }
}
```

Status codes:
- `200 OK`
- `400 Bad Request` if `abilityIds` is missing, empty, duplicated, too long, locked, incompatible, or ordered incorrectly.
- `401 Unauthorized` if the token is missing, invalid, or expired.
- `403 Forbidden` if the token user does not own the character.
- `404 Not Found` if the character or quest does not exist.

## Planned CA1 Routes

### Users

Implemented and documented above.

### Characters

Implemented and documented above.

### Regions

Implemented and documented above.

### Quests

Implemented and documented above.

### Adventure

Implemented and documented above.

### Abilities

Implemented and documented above.

## CA2 Auth Routes

Implemented and documented above.

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Protected route behavior is implemented through `src/middlewares/authMiddleware.js`.

## Status Code Rules

- `200 OK` for successful reads, updates, and action results.
- `201 Created` for successful creates.
- `204 No Content` for successful deletes with no body.
- `400 Bad Request` for validation errors.
- `401 Unauthorized` for missing/invalid CA2 authentication.
- `403 Forbidden` for authenticated users without permission.
- `404 Not Found` for missing resources.
- `409 Conflict` for duplicate usernames or duplicate unlocks.
- `500 Internal Server Error` for unexpected failures.

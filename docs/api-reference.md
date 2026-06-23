# API Reference

This document describes the current implemented backend contract.

## Response Format

Successful routes use the teacher-style response middleware in `src/middlewares/response.js`.

```json
{
  "message": "Human readable success message.",
  "data": {}
}
```

Delete routes that return `204 No Content` have no response body.

Error routes use:

```json
{
  "error": "Short error title",
  "message": "Clear explanation",
  "details": "Optional details"
}
```

## ID Rules

- Database primary keys are integer `id` columns.
- API fields named `userId`, `characterId`, `saveSlotId`, `characterAbilityId`, and similar table-row identifiers are numeric.
- Authored game keys such as `questId`, `regionId`, `abilityId`, `itemId`, `bossId`, and `factionId` are strings because they identify fixed content definitions.

Example user object:

```json
{
  "id": 1,
  "userId": 1,
  "username": "demoSauron",
  "level": 1,
  "xp": 0,
  "gold": 25,
  "createdAt": "2026-06-20T12:00:00.000Z"
}
```

## Authentication

Protected routes require:

```http
Authorization: Bearer <token>
```

Auth routes:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

`POST /auth/register` and `POST /auth/login` return a JWT inside `data.token`.

## Public Fixed-Content Routes

These read authored game definitions.

- `GET /regions`
- `GET /regions/:id`
- `GET /regions/:regionId/quests`
- `GET /quests`
- `GET /quests/:id`
- `GET /abilities`

Fixed definitions live in `src/content/*`. They should not be treated as player-changing database state.

## Users

- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`
- `GET /users/:userId/characters`
- `GET /users/:userId/adventure-logs`

Notes:
- `:id` and `:userId` are numeric user IDs.
- Protected user routes require the JWT user to match the route user.
- Passwords are never returned.

## Characters

- `GET /characters`
- `POST /characters`
- `GET /characters/:id`
- `PUT /characters/:id`
- `DELETE /characters/:id`
- `GET /characters/:characterId/adventure-logs`
- `GET /characters/:characterId/abilities`
- `POST /characters/:characterId/unlock-ability`

Notes:
- Character route IDs are numeric.
- `POST /characters` requires numeric `userId` in the request body.
- Ability unlock requests use string authored `abilityId`.

## Quests

- `POST /quests`
- `PUT /quests/:id`
- `DELETE /quests/:id`

Notes:
- These mutation routes are compatibility routes for custom/legacy quests.
- Authored quests from `src/content/quests.js` cannot be updated or deleted through the API.
- Quest IDs are string keys such as `quest_black_road_reclamation`.

## Adventure And Combo

- `POST /adventures/attempt`
- `POST /combos/resolve`

`POST /adventures/attempt` body:

```json
{
  "userId": 1,
  "characterId": 1,
  "questId": "quest_black_road_reclamation"
}
```

`POST /combos/resolve` body:

```json
{
  "characterId": 1,
  "abilityIds": ["ability_vanish"],
  "questId": "quest_first_ring_guardian"
}
```

Notes:
- User and character IDs are numeric.
- Quest and ability IDs are authored string keys.
- Boss quest combo success persists progression and an adventure log.

## Progression

- `GET /progression/characters/:characterId`
- `PUT /progression/characters/:characterId`
- `PUT /progression/characters/:characterId/quest-completions/:questId`

Notes:
- `:characterId` is numeric.
- `:questId` is a string authored/local quest key.
- Quest completion rewards are idempotent through unique `(character_id, quest_key)`.
- Run-state checkpoint coordinates use `lastCheckpointX`, `lastCheckpointY`, and `lastCheckpointZ`.

## Full-Game State

All state routes are protected.

- `GET /state/users/:userId/save-slots`
- `PUT /state/users/:userId/save-slots/:slotIndex`
- `GET /state/characters/:characterId/full`
- `PUT /state/characters/:characterId/inventory/:itemId`
- `DELETE /state/characters/:characterId/inventory/:itemId`
- `PUT /state/characters/:characterId/equipment/:equipmentSlot`
- `DELETE /state/characters/:characterId/equipment/:equipmentSlot`
- `PUT /state/characters/:characterId/dialogue-flags/:flagId`
- `PUT /state/characters/:characterId/boss-states/:bossId`
- `PUT /state/characters/:characterId/campaign-markers/:markerId`
- `PUT /state/characters/:characterId/faction-reputation/:factionId`
- `PUT /state/characters/:characterId/region-states/:regionId`

Notes:
- `userId` and `characterId` are numeric.
- `itemId`, `bossId`, `markerId`, `factionId`, and `regionId` are authored/string state keys.
- Dynamic state tables prevent duplicates with unique constraints.

## Status Codes

- `200 OK` for successful reads, updates, and action results.
- `201 Created` for successful creates.
- `204 No Content` for successful deletes.
- `400 Bad Request` for validation errors.
- `401 Unauthorized` for missing or invalid JWT auth.
- `403 Forbidden` for ownership violations.
- `404 Not Found` for missing resources.
- `409 Conflict` for duplicates such as usernames or already-unlocked abilities.
- `500 Internal Server Error` for unexpected failures.

# Dawn of Man

## Game Theme Description

Dawn of Man is a turn-based RPG backend about a human soldier who starts a rebellion after elven tax knights kill his family for unpaid tribute. The player begins as a village soldier in Middle-earth, gathers supplies, unlocks abilities, fights enemies, defeats bosses, moves across the map, takes the first ring from Celebrimbor in Eregion, becomes king of mankind, and later commands an army toward Lindon. The backend handles users, characters, fixed game content, map travel, combat sessions, army state, progression, inventory, equipment, save slots, boss states, dialogue flags, faction reputation, and region state.

## Setup And Run Instructions

Install dependencies:

```powershell
npm install
```

Create the local environment file:

```powershell
copy .env.example .env
```

Create or update the database tables and seed the starter data:

```powershell
npm run db
```

Reset the local database when you want a fresh test database:

```powershell
npm run db:reset
```

Start the server:

```powershell
npm start
```

Start the server with nodemon during development:

```powershell
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

## Environment Variables

```text
PORT=3000
DATABASE_URL=file:dawn-of-man.db
```

`PORT` controls the Express server port. `DATABASE_URL` points Drizzle/libSQL to the database. For local development, it can use `file:dawn-of-man.db`.

## Tech Stack

- Node.js
- Express
- libSQL
- Drizzle ORM
- nodemon
- dotenv
- cors

## Project Structure

```text
src/
  constants/      fixed game data such as abilities, enemies, quests, items, map nodes, and army encounters.
  controllers/    Request validation, route flow, game checks, and calls to models.
  db/             Drizzle database client, schema, seed, and reset files.
  middlewares/    Shared request validation middleware.
  models/         Database interaction functions.
  routes/         Express route definitions.
  utils/          Pure helper logic such as combat rules, equipment rules, validation helpers, and leveling.
```

## Response Format

Most successful routes return:

```json
{
  "message": "Short success message.",
  "data": {}
}
```

Routes that delete a user or character return `204 No Content`.

Expected validation errors return:

```json
{
  "message": "What went wrong in detail.",
  "details": {
    "allowedValues": ["example"]
  }
}
```

Some error responses do not need `details` and only return a clear `message`.

Unknown routes return:

```json
{
  "error": "Not Found",
  "message": "No route found for GET /wrong-route. The requested endpoint is not defined."
}
```

Common status codes:

- Status `200`: Request succeeded.
- Status `201`: Resource was created.
- Status `204`: Resource was deleted with no response body.
- Status `400`: Required data is missing or invalid.
- Status `403`: The action is blocked by progression or access rules.
- Status `404`: The requested resource or definition was not found.
- Status `409`: The action conflicts with existing state.
- Status `500`: Unexpected server error.

## API Documentation

### Users

- `GET` `/users`
  - What it does: Gets all users. Can filter by level.
  - Request data: Optional query: `level`
  - Success response: `200`, returns an array of users.
- `GET` `/users/:id`
  - What it does: Gets one user by id.
  - Request data: Param: `id`
  - Success response: `200`, returns one user.
- `GET` `/users/:userId/characters`
  - What it does: Gets all characters owned by one user.
  - Request data: Param: `userId`
  - Success response: `200`, returns an array of characters.
- `GET` `/users/:userId/adventure-logs`
  - What it does: Gets adventure logs for one user.
  - Request data: Param: `userId`
  - Success response: `200`, returns an array of adventure logs.
- `POST` `/users`
  - What it does: Creates one user.
  - Request data: Body: `username`
  - Success response: `201`, returns the created user.
- `PUT` `/users/:id`
  - What it does: Updates one user.
  - Request data: Param: `id`; body can contain `username`, `level`, `xp`, `gold`
  - Success response: `200`, returns the updated user.
- `DELETE` `/users/:id`
  - What it does: Deletes one user and cascades linked user data.
  - Request data: Param: `id`
  - Success response: `204`, no response body.

Create user request:

```json
{
  "username": "demoPlayer"
}
```

Update user request:

```json
{
  "level": 2,
  "xp": 50,
  "gold": 20
}
```

User response data:

```json
{
  "userId": 1,
  "username": "demoPlayer",
  "level": 1,
  "xp": 0,
  "gold": 0,
  "createdAt": "2026-06-27T00:00:00.000Z"
}
```

### Characters

- `GET` `/characters`
  - What it does: Gets all characters. Can filter by class.
  - Request data: Optional query: `className`
  - Success response: `200`, returns an array of characters.
- `GET` `/characters/:id`
  - What it does: Gets one character by id.
  - Request data: Param: `id`
  - Success response: `200`, returns one character.
- `GET` `/characters/:characterId/adventure-logs`
  - What it does: Gets adventure logs for one character.
  - Request data: Param: `characterId`
  - Success response: `200`, returns an array of logs.
- `GET` `/characters/:characterId/abilities`
  - What it does: Gets all abilities unlocked by one character.
  - Request data: Param: `characterId`
  - Success response: `200`, returns unlocked abilities.
- `POST` `/characters`
  - What it does: Creates a character for a user.
  - Request data: Body: `userId`, `characterName`, `origin`, `className`, `affinity`
  - Success response: `201`, returns the created character.
- `POST` `/characters/:characterId/unlock-ability`
  - What it does: Unlocks one ability after checking level, class, affinity, XP, and item costs.
  - Request data: Param: `characterId`; body: `abilityId`
  - Success response: `201`, returns unlock result, ability, character, and spent cost.
- `PUT` `/characters/:id`
  - What it does: Updates character profile fields and recalculates stats if class/origin/affinity changes.
  - Request data: Param: `id`; body can contain `characterName`, `origin`, `className`, `affinity`
  - Success response: `200`, returns the updated character.
- `DELETE` `/characters/:id`
  - What it does: Deletes one character.
  - Request data: Param: `id`
  - Success response: `204`, no response body.

Create character request:

```json
{
  "userId": 1,
  "characterName": "Aldric",
  "origin": "Taxed Village Guard",
  "className": "Soldier",
  "affinity": "Resolve"
}
```

Unlock ability request:

```json
{
  "abilityId": "ability_basic_slash"
}
```

Character response data:

```json
{
  "characterId": 1,
  "userId": 1,
  "characterName": "Aldric",
  "origin": "Taxed Village Guard",
  "className": "Soldier",
  "affinity": "Resolve",
  "level": 1,
  "xp": 0,
  "hp": 115,
  "strength": 9,
  "intelligence": 5,
  "agility": 5,
  "faith": 5,
  "endurance": 8,
  "charisma": 5
}
```

### Fixed Game Content

These routes read fixed game definitions stored in `src/constants`.

- `GET` `/abilities`
  - What it does: Gets ability definitions.
  - Request data: Optional query: `className`, `affinity`
  - Success response: `200`, returns abilities.
- `GET` `/regions`
  - What it does: Gets region definitions.
  - Request data: Optional query: `dangerLevel`
  - Success response: `200`, returns regions.
- `GET` `/regions/:id`
  - What it does: Gets one region definition.
  - Request data: Param: `id`
  - Success response: `200`, returns one region.
- `GET` `/regions/:regionId/quests`
  - What it does: Gets quest definitions inside one region.
  - Request data: Param: `regionId`
  - Success response: `200`, returns quests.
- `GET` `/quests`
  - What it does: Gets all quest definitions.
  - Request data: None
  - Success response: `200`, returns quests.
- `GET` `/quests/:id`
  - What it does: Gets one quest definition.
  - Request data: Param: `id`
  - Success response: `200`, returns one quest.
- `GET` `/items`
  - What it does: Gets item definitions.
  - Request data: Optional query: `itemType`, `equipmentSlot`
  - Success response: `200`, returns items.
- `GET` `/items/:itemId`
  - What it does: Gets one item definition.
  - Request data: Param: `itemId`
  - Success response: `200`, returns one item.
- `GET` `/enemies`
  - What it does: Gets enemy definitions.
  - Request data: Optional query: `regionId`, `isBoss` as `0` or `1`
  - Success response: `200`, returns enemies.
- `GET` `/enemies/:enemyId`
  - What it does: Gets one enemy definition.
  - Request data: Param: `enemyId`
  - Success response: `200`, returns one enemy.
- `GET` `/factions`
  - What it does: Gets faction definitions.
  - Request data: None
  - Success response: `200`, returns factions.
- `GET` `/factions/:factionId`
  - What it does: Gets one faction definition.
  - Request data: Param: `factionId`
  - Success response: `200`, returns one faction.
- `GET` `/dialogues`
  - What it does: Gets dialogue definitions.
  - Request data: Optional query: `regionId`, `storyPhase`
  - Success response: `200`, returns dialogues.
- `GET` `/dialogues/:dialogueId`
  - What it does: Gets one dialogue definition.
  - Request data: Param: `dialogueId`
  - Success response: `200`, returns one dialogue.
- `POST` `/dialogues/:dialogueId/complete`
  - What it does: Marks a dialogue as completed for one character.
  - Request data: Param: `dialogueId`; body: `characterId`, `choiceId`
  - Success response: `200`, returns dialogue, selected choice, and saved flag.

Complete dialogue request:

```json
{
  "characterId": 1,
  "choiceId": "swear_oath"
}
```

Example content response:

```json
{
  "message": "Quest retrieved.",
  "data": {
    "questId": "quest_family_oath",
    "regionId": "region_middle_earth",
    "title": "The Family Oath",
    "questType": "dialogue",
    "requiredLevel": 1,
    "rewardXp": 25,
    "rewardGold": 0
  }
}
```

### Map

- `GET` `/map/nodes`
  - What it does: Gets all map node definitions. Can filter by region.
  - Request data: Optional query: `regionId`
  - Success response: `200`, returns map nodes.
- `GET` `/map/nodes/:nodeId`
  - What it does: Gets one map node definition.
  - Request data: Param: `nodeId`
  - Success response: `200`, returns one map node.
- `GET` `/map/characters/:characterId/location`
  - What it does: Gets or creates a character's current map location.
  - Request data: Param: `characterId`
  - Success response: `200`, returns the current location.
- `POST` `/map/travel`
  - What it does: Moves a character to a connected and unlocked node, then returns the travel event.
  - Request data: Body: `characterId`, `targetNodeId`
  - Success response: `200`, returns location, source node, target node, transition effect, and travel event.

Travel request:

```json
{
  "characterId": 1,
  "targetNodeId": "node_old_mill"
}
```

Travel response data:

```json
{
  "location": {
    "characterId": 1,
    "regionId": "region_middle_earth",
    "nodeId": "node_old_mill",
    "previousNodeId": "node_hearthvale_square"
  },
  "fromNode": {},
  "toNode": {},
  "transitionEffect": "dust clouds moving over wheat fields",
  "travelEvent": {
    "eventType": "materials",
    "message": "You recovered iron scrap from a hidden supply cache.",
    "reward": {}
  }
}
```

Travel can return different event types:

- Event type `arrival`: The character moved without a special event.
- Event type `materials`: The character found material rewards.
- Event type `ambush`: The route created or warns about combat.
- Event type `boss`: The node contains a boss encounter.
- Event type `army`: The node contains an army encounter.

### Combat And Army

- `GET` `/combat/sessions/:combatSessionId`
  - What it does: Gets one combat session and its turn logs.
  - Request data: Param: `combatSessionId`
  - Success response: `200`, returns combat session and turn logs.
- `POST` `/combat/sessions`
  - What it does: Starts one combat session against an enemy or boss. Boss fights must be started from the matching boss node.
  - Request data: Body: `characterId`, `enemyId`; optional `questId`, `nodeId`
  - Success response: `201`, returns combat session, enemy, and equipment bonuses.
- `POST` `/combat/sessions/:combatSessionId/turns`
  - What it does: Resolves one turn in an active combat session.
  - Request data: Param: `combatSessionId`; body: `characterId`, `actionType`; optional `abilityId`
  - Success response: `200`, returns updated session, turn logs, reward result, and equipment bonuses.
- `GET` `/army/characters/:characterId`
  - What it does: Gets one character's army state.
  - Request data: Param: `characterId`
  - Success response: `200`, returns saved army state or default locked army state.
- `PUT` `/army/characters/:characterId`
  - What it does: Saves army state for one character.
  - Request data: Param: `characterId`; body can contain `isUnlocked`, `commandRank`, `soldiers`, `archers`, `cavalry`, `morale`, `strategy`
  - Success response: `200`, returns saved army state.
- `GET` `/army/encounters`
  - What it does: Gets fixed army encounter definitions.
  - Request data: Optional query: `requiredStoryPhase`
  - Success response: `200`, returns army encounters.
- `GET` `/army/encounters/:armyEncounterId`
  - What it does: Gets one army encounter definition.
  - Request data: Param: `armyEncounterId`
  - Success response: `200`, returns one encounter.
- `POST` `/army/characters/:characterId/battles`
  - What it does: Resolves one army battle and applies story changes on victory.
  - Request data: Param: `characterId`; body: `armyEncounterId`; optional `strategy`, `orders`
  - Success response: `200`, returns encounter, battle result, equipment bonus, army state, and story result.

Start combat request:

```json
{
  "characterId": 1,
  "enemyId": "enemy_tax_knight"
}
```

Resolve combat turn request:

```json
{
  "characterId": 1,
  "actionType": "attack"
}
```

Resolve combat turn with ability:

```json
{
  "characterId": 1,
  "actionType": "ability",
  "abilityId": "ability_basic_slash"
}
```

Army state request:

```json
{
  "isUnlocked": 1,
  "commandRank": "king",
  "soldiers": 180,
  "archers": 90,
  "cavalry": 45,
  "morale": 85,
  "strategy": "attack"
}
```

Army battle request:

```json
{
  "armyEncounterId": "army_lindon_road",
  "strategy": "attack",
  "orders": [
    {
      "unitType": "soldiers",
      "command": "attack",
      "target": "frontline"
    },
    {
      "unitType": "archers",
      "command": "support",
      "target": "archers"
    }
  ]
}
```

Valid army strategies:

```text
hold, attack, defend, flank, retreat
```

Valid army order unit types:

```text
soldiers, archers, cavalry
```

Valid army order commands:

```text
attack, defend, support
```

### Progression And Adventure

- `GET` `/progression/characters/:characterId`
  - What it does: Gets level, XP, HP, run state, and quest completion state for one character.
  - Request data: Param: `characterId`
  - Success response: `200`, returns progression data.
- `PUT` `/progression/characters/:characterId`
  - What it does: Saves editable character progression and run state fields.
  - Request data: Param: `characterId`; body can contain `level`, `xp`, `hp`, `supplies`, `morale`, `storyPhase`, `commandModeUnlocked`
  - Success response: `200`, returns saved progression data.
- `PUT` `/progression/characters/:characterId/quest-completions/:questId`
  - What it does: Claims one dialogue quest completion reward.
  - Request data: Params: `characterId`, `questId`
  - Success response: `200`, returns whether reward was awarded and updated character state.
- `POST` `/adventures/attempt`
  - What it does: Attempts a non-combat quest and awards XP/gold based on the result. Combat, boss, and strategy quests are handled by their own routes.
  - Request data: Body: `userId`, `characterId`, `questId`
  - Success response: `200`, returns outcome, rewards, challenge, quest summary, progression, and adventure log.

Save progression request:

```json
{
  "level": 2,
  "xp": 80,
  "hp": 120,
  "supplies": 5,
  "morale": 70,
  "storyPhase": "village_rebellion",
  "commandModeUnlocked": 0
}
```

Adventure attempt request:

```json
{
  "userId": 1,
  "characterId": 1,
  "questId": "quest_rebellion_supplies"
}
```

Adventure response data:

```json
{
  "outcome": "success",
  "resultText": "The caches are recovered and the village smith can arm more rebels.",
  "rewards": {
    "xp": 25,
    "gold": 8
  },
  "challenge": {},
  "quest": {},
  "characterProgression": {},
  "userProgression": {},
  "character": {},
  "user": {},
  "adventureLog": {}
}
```

### Saved State, Inventory, And Equipment

- `GET` `/state/users/:userId/save-slots`
  - What it does: Gets all save slots for one user.
  - Request data: Param: `userId`
  - Success response: `200`, returns save slots.
- `PUT` `/state/users/:userId/save-slots/:slotIndex`
  - What it does: Creates or updates one user save slot.
  - Request data: Params: `userId`, `slotIndex`; optional body: `characterId`, `slotName`
  - Success response: `200`, returns saved slot.
- `GET` `/state/characters/:characterId/full`
  - What it does: Gets the full saved state for one character.
  - Request data: Param: `characterId`
  - Success response: `200`, returns inventory, equipment, flags, boss states, markers, reputation, region states, save state, and location state.
- `PUT` `/state/characters/:characterId/inventory/:itemId`
  - What it does: Saves one inventory item quantity. Quantity `0` removes the item.
  - Request data: Params: `characterId`, `itemId`; body: `quantity`
  - Success response: `200`, returns saved or removed inventory item.
- `DELETE` `/state/characters/:characterId/inventory/:itemId`
  - What it does: Removes one inventory item.
  - Request data: Params: `characterId`, `itemId`
  - Success response: `200`, returns removal result.
- `POST` `/state/characters/:characterId/consume/:itemId`
  - What it does: Consumes one owned consumable item and applies its effect.
  - Request data: Params: `characterId`, `itemId`
  - Success response: `200`, returns consume result.
- `PUT` `/state/characters/:characterId/equipment/:equipmentSlot`
  - What it does: Equips one owned item into a matching equipment slot.
  - Request data: Params: `characterId`, `equipmentSlot`; body: `itemId`
  - Success response: `200`, returns equipment row.
- `DELETE` `/state/characters/:characterId/equipment/:equipmentSlot`
  - What it does: Unequips one equipment slot.
  - Request data: Params: `characterId`, `equipmentSlot`
  - Success response: `200`, returns removal result.
- `PUT` `/state/characters/:characterId/dialogue-flags/:flagId`
  - What it does: Saves one dialogue flag.
  - Request data: Params: `characterId`, `flagId`; body: `value` as boolean, `0`, or `1`
  - Success response: `200`, returns saved flag.
- `PUT` `/state/characters/:characterId/boss-states/:bossId`
  - What it does: Saves boss progress such as attempts, defeat status, best time, and last outcome.
  - Request data: Params: `characterId`, `bossId`; optional body: `status`, `attempts`, `defeats`, `bestTimeSeconds`, `lastOutcome`
  - Success response: `200`, returns saved boss state.
- `PUT` `/state/characters/:characterId/campaign-markers/:markerId`
  - What it does: Saves one campaign marker on the map.
  - Request data: Params: `characterId`, `markerId`; body: `regionId`, `markerType`; optional `isRevealed`, `isCompleted`, `positionX`, `positionY`
  - Success response: `200`, returns saved marker.
- `PUT` `/state/characters/:characterId/faction-reputation/:factionId`
  - What it does: Saves reputation with one faction.
  - Request data: Params: `characterId`, `factionId`; optional body: `reputation`, `rank`
  - Success response: `200`, returns saved reputation row.
- `PUT` `/state/characters/:characterId/region-states/:regionId`
  - What it does: Saves unlock, discovery, threat, and world state for one region.
  - Request data: Params: `characterId`, `regionId`; optional body: `isUnlocked`, `isDiscovered`, `threatLevel`, `worldState`
  - Success response: `200`, returns saved region state.

Save slot request:

```json
{
  "characterId": 1,
  "slotName": "Main Save"
}
```

Inventory request:

```json
{
  "quantity": 2
}
```

Equipment request:

```json
{
  "itemId": "item_village_sword"
}
```

Dialogue flag request:

```json
{
  "value": true
}
```

Boss state request:

```json
{
  "status": "active",
  "attempts": 1,
  "defeats": 0,
  "bestTimeSeconds": null,
  "lastOutcome": "started"
}
```

Campaign marker request:

```json
{
  "regionId": "region_middle_earth",
  "markerType": "story",
  "isRevealed": 1,
  "isCompleted": 0,
  "positionX": 10,
  "positionY": 70
}
```

Faction reputation request:

```json
{
  "reputation": 10,
  "rank": "ally"
}
```

Region state request:

```json
{
  "isUnlocked": 1,
  "isDiscovered": 1,
  "threatLevel": 2,
  "worldState": "contested"
}
```

Full state response data:

```json
{
  "characterId": 1,
  "saveSlots": [],
  "inventory": [],
  "equipment": [],
  "dialogueFlags": [],
  "bossStates": [],
  "campaignMarkers": [],
  "factionReputation": [],
  "regionStates": [],
  "runState": {},
  "location": {}
}
```

## Database Design Summary

The database stores player-created and player-changing data, while fixed game definitions stay in constants because they are fixed game rules and story content.

Player and save tables:

- `users`: Stores account-level player data.
- `characters`: Stores player characters and their stats.
- `save_slots`: Stores user save slot metadata.
- `character_run_states`: Stores supplies, morale, story phase, and army command unlock state.
- `character_locations`: Stores each character's current map node.

Progression and gameplay tables:

- `adventure_logs`: Stores quest/adventure/combat result history.
- `character_abilities`: Stores unlocked abilities per character.
- `character_quest_completions`: Stores claimed quest completion rewards.
- `combat_sessions`: Stores active and completed turn-based combat sessions.
- `combat_turn_logs`: Stores each combat turn result.
- `character_army_states`: Stores army command state.

Inventory and saved state tables:

- `character_inventory`: Stores item quantities owned by each character.
- `character_equipment`: Stores equipped items by equipment slot.
- `character_dialogue_flags`: Stores completed dialogue/story flags.
- `character_boss_states`: Stores boss attempts, defeat status, and latest outcome.
- `character_campaign_markers`: Stores campaign map marker state.
- `character_faction_reputation`: Stores character reputation with each faction.
- `character_region_states`: Stores per-character region unlock and world state.

Important foreign key relationships:

- Relationship `characters.user_id -> users.id`: A user owns many characters.
- Relationship `adventure_logs.character_id -> characters.id`: A character has many adventure logs.
- Relationship `character_abilities.character_id -> characters.id`: A character unlocks many abilities.
- Relationship `character_locations.character_id -> characters.id`: A character has one current location.
- Relationship `combat_sessions.character_id -> characters.id`: A character can have combat sessions.
- Relationship `combat_turn_logs.combat_session_id -> combat_sessions.id`: Combat sessions have turn logs.
- Relationship `character_inventory.character_id -> characters.id`: A character owns many inventory items.
- Relationship `character_equipment.character_id -> characters.id`: A character has equipped items.
- Relationship `character_run_states.character_id -> characters.id`: A character has one run state.
- Relationship `save_slots.user_id -> users.id`: A user owns save slots.

## Fixed Game Definitions

Fixed content is stored in constants:

- `src/constants/characterOptions.js`: Allowed origins, classes, affinities, and starting stat bonuses.
- `src/constants/abilities.js`: Ability definitions and unlock requirements.
- `src/constants/dialogues.js`: Dialogue scenes, choices, and completion flags.
- `src/constants/enemies.js`: Enemy and boss definitions.
- `src/constants/factions.js`: Faction definitions.
- `src/constants/items.js`: Item, consumable, weapon, equipment, and army item definitions.
- `src/constants/quests.js`: Quest definitions and rewards.
- `src/constants/regions.js`: Region definitions.
- `src/constants/mapNodes.js`: Map nodes, connections, encounters, and transition effects.
- `src/constants/armyEncounters.js`: Army encounter definitions.
- `src/constants/combatBalance.js`: Damage range and army balance constants.
- `src/constants/storyMilestones.js`: Story changes after boss victories.

## Game Loop Summary

1. A user creates an account.
2. The user creates a character with an origin, class, and affinity.
3. The character starts in Hearthvale Square.
4. The character travels across connected map nodes.
5. Travel can grant materials, show a boss event, show an army event, or trigger an ambush.
6. The character can gain items, equip gear, and unlock abilities.
7. Non-combat quests use the adventure route.
8. Combat quests and bosses use combat sessions and combat turns.
9. Boss victories update story phase, boss state, quest completion, region unlocks, markers, faction reputation, and rewards.
10. After Eregion, army command can be unlocked and army battles can be resolved.
11. Full character state can be loaded and saved through the state routes.

## points to take note

- The fixed game content is stored as constants because it is fixed design data, not player-created data.
- The database stores player-owned and player-changing state.
- IDs are stored as integer primary keys in the database.
- Boolean-like saved state is stored as `0` or `1` in SQLite-compatible tables.
- Boss combat must start from the matching boss map node.
- A character cannot travel while an active combat session is unresolved.
- Combat damage uses class, weapon, ability, and enemy damage ranges.
- Army battles require army command to be unlocked and the correct story phase.
- Authentication is not included in this backend version.

# ERD Notes

This file supports CA1 and CA2 ERD drawing. It currently documents the planned CA1 MVP schema. Update it whenever the actual Drizzle schema changes.

Status:
- CA1 MVP schema is implemented in `src/db/schema.js`.
- Tables are created by `src/db/seed.js` using `CREATE TABLE IF NOT EXISTS`.
- Seed data was verified on 2026-05-12.
- Users, characters, regions, quests, adventures, and abilities are implemented in `src/models`, `src/controllers`, and `src/routes`.
- Region reads, quest CRUD, adventure attempts, progression updates, adventure log reads, ability reads, and ability unlocks were verified on 2026-05-12.
- CA1 ERD support was validated on 2026-05-12 against `src/db/schema.js` and `src/db/seed.js`.
- CA2 auth was implemented on 2026-05-12 without adding new tables.
- The `users.password` column now stores bcrypt hashes for seeded and newly registered users.
- Phase 10.1 combo resolution was implemented on 2026-05-13 without adding new tables; it uses `characters`, `abilities`, `character_abilities`, and optional `quests` records.
- Phase 10.2 ability progression frontend was implemented on 2026-05-13 without adding new tables; it reads `abilities` and `character_abilities`, unlocks through the existing join table, and resolves combos through existing character/ability records.
- Corrective Phase 10.3 boss combo gameplay was verified on 2026-05-13 without adding new tables; boss combo results reuse `quests`, update `users` and `characters`, and write to `adventure_logs`.

## CA1 MVP Tables

### users

Purpose:
Stores player profiles. CA1 includes `password` now to prepare for CA2.

Columns:
- `user_id <varchar, PK>`
- `username <varchar, unique, not null>`
- `password <varchar, not null>`
- `level <int, default 1>`
- `xp <int, default 0>`
- `gold <int, default 0>`
- `created_at <varchar, not null>`

Notes:
- Passwords must not be returned in API responses.
- CA2 auth stores seeded and newly created passwords as bcrypt hashes.
- The auth login flow migrates a legacy plaintext password to bcrypt if one is encountered and the login is successful.

### characters

Purpose:
Stores player-created RPG heroes.

Columns:
- `character_id <varchar, PK>`
- `user_id <varchar, FK, not null>`
- `character_name <varchar, not null>`
- `origin <varchar, not null>`
- `class_name <varchar, not null>`
- `affinity <varchar, not null>`
- `level <int, default 1>`
- `xp <int, default 0>`
- `hp <int, default 100>`
- `strength <int, not null>`
- `intelligence <int, not null>`
- `agility <int, not null>`
- `faith <int, not null>`
- `endurance <int, not null>`
- `charisma <int, not null>`
- `created_at <varchar, not null>`

Relationships:
- `characters.user_id -> users.user_id`
- One user can own many characters.
- Each character belongs to exactly one user.

### regions

Purpose:
Stores world map regions.

Columns:
- `region_id <varchar, PK>`
- `name <varchar, unique, not null>`
- `description <varchar, not null>`
- `danger_level <int, not null>`
- `recommended_level <int, not null>`
- `faction <varchar, nullable>`
- `shard_name <varchar, nullable>`
- `is_unlocked <int, default 1>`

Relationships:
- `regions.region_id <- quests.region_id`
- One region can contain many quests.

### quests

Purpose:
Stores quest board entries and boss encounters.

Columns:
- `quest_id <varchar, PK>`
- `region_id <varchar, FK, not null>`
- `title <varchar, not null>`
- `description <varchar, not null>`
- `quest_type <varchar, not null>`
- `required_level <int, not null>`
- `difficulty <int, not null>`
- `required_stat <varchar, not null>`
- `required_stat_value <int, not null>`
- `reward_xp <int, not null>`
- `reward_gold <int, not null>`
- `success_text <varchar, not null>`
- `failure_text <varchar, not null>`

Relationships:
- `quests.region_id -> regions.region_id`
- `quests.quest_id <- adventure_logs.quest_id`
- One region can contain many quests.
- One quest can appear in many adventure logs.

### adventure_logs

Purpose:
Stores quest attempt results.

Columns:
- `log_id <varchar, PK>`
- `user_id <varchar, FK, not null>`
- `character_id <varchar, FK, not null>`
- `quest_id <varchar, FK, not null>`
- `outcome <varchar, not null>`
- `xp_gained <int, not null>`
- `gold_gained <int, not null>`
- `result_text <varchar, not null>`
- `created_at <varchar, not null>`

Relationships:
- `adventure_logs.user_id -> users.user_id`
- `adventure_logs.character_id -> characters.character_id`
- `adventure_logs.quest_id -> quests.quest_id`
- One user can have many adventure logs.
- One character can have many adventure logs.
- One quest can have many adventure logs.

### abilities

Purpose:
Stores available abilities for class, affinity, and combo progression.

Columns:
- `ability_id <varchar, PK>`
- `name <varchar, not null>`
- `class_name <varchar, nullable>`
- `affinity <varchar, nullable>`
- `ability_type <varchar, not null>`
- `power <int, not null>`
- `combo_tag <varchar, nullable>`
- `required_level <int, not null>`
- `description <varchar, not null>`

Relationships:
- `abilities.ability_id <- character_abilities.ability_id`
- One ability can be unlocked by many characters.

### character_abilities

Purpose:
Join table for unlocked character abilities.

Columns:
- `character_ability_id <varchar, PK>`
- `character_id <varchar, FK, not null>`
- `ability_id <varchar, FK, not null>`
- `unlocked_at <varchar, not null>`

Relationships:
- `character_abilities.character_id -> characters.character_id`
- `character_abilities.ability_id -> abilities.ability_id`
- One character can unlock many abilities.
- One ability can be unlocked by many characters.

## Planned ERD Relationship Arrows

- `characters.user_id -> users.user_id`
- `adventure_logs.user_id -> users.user_id`
- `quests.region_id -> regions.region_id`
- `adventure_logs.character_id -> characters.character_id`
- `adventure_logs.quest_id -> quests.quest_id`
- `character_abilities.character_id -> characters.character_id`
- `character_abilities.ability_id -> abilities.ability_id`

## Future CA2 Tables Not To Implement Yet

Do not implement these until a future ticket explicitly asks:

- `factions`
- `character_reputation`
- `battles`
- `battle_turns`
- `inventory_items`
- `character_inventory`
- `endings`
- `region_unlocks`

## ERD Drawing Notes

For CA1, draw these tables:
- `users`
- `characters`
- `regions`
- `quests`
- `adventure_logs`
- `abilities`
- `character_abilities`

Use rectangles for tables. List each column with type. Mark PK and FK beside the relevant columns. Draw arrows from FK columns to PK columns.

Before submitting CA1 or CA2, compare this file with the real `src/db/schema.js` and update any mismatch.

## CA2 Phase 11 Note

The Phase 11 polish pass and the dashboard character Edit/Delete flow reuse the existing CA1 schema with no changes:

- Edit calls protected `PUT /characters/:id`, which updates `characters.character_name` (and recomputes stats when origin/class/affinity ever change, although the frontend only ever sends `characterName`).
- Delete calls protected `DELETE /characters/:id`, which removes the row from `characters`. `adventure_logs.character_id` continues to reference characters via the FK already documented above; deleting a character does not retroactively edit existing log rows because the model removes the character row only.

No new tables, columns, or relationships are introduced by the CA2 frontend Edit/Delete flow, the combo battle resolution route, or the Phase 11 polish.

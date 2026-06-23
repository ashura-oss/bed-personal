# ERD Notes

This file documents the current backend ERD shape. It follows the BED/MVC convention requested by the teacher: every real database table has an integer primary key named `id`, foreign keys point to those integer `id` columns, and string game identifiers are normal unique/reference columns instead of primary keys.

Status:
- Current schema is implemented in `src/db/schema.js`.
- Reset/seed SQL is implemented in `src/db/seed.js`.
- `npm run db:seed` recreates the local database from scratch.
- `npm run test:backend` passes.
- Success responses use route-level `withMessage(...)` plus `sendResponse`.
- Fixed game rules/content live in `src/content/*`; player-changing state lives in database tables.

## Key Rules

- Primary keys: every table uses `id INTEGER PRIMARY KEY AUTOINCREMENT`.
- Foreign keys: user/character/ability/region relational links use integer FK columns such as `user_id`, `character_id`, `ability_id`, and `region_id`.
- Authored game keys: fixed-content identifiers such as `quest_key`, `region_key`, `ability_key`, `item_key`, `boss_key`, and `faction_key` are string columns, not primary keys.
- Duplicate prevention: junction/state tables use unique constraints such as `(character_id, ability_id)` and `(character_id, item_key)`.
- Static content: regions, quests, abilities, items, factions, enemies, recipes, and maps are authored content modules unless they are compatibility mirrors.

## Tables

### users

Columns:
- `id <int, PK>`
- `username <varchar, unique, not null>`
- `password <varchar, not null>`
- `level <int, default 1>`
- `xp <int, default 0>`
- `gold <int, default 0>`
- `created_at <varchar, not null>`

Relationships:
- One user owns many characters.
- One user owns many save slots.

### characters

Columns:
- `id <int, PK>`
- `user_id <int, FK -> users.id, not null>`
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
- Many characters belong to one user.
- One character has one current run state.
- One character has many inventory, equipment, ability, quest completion, log, dialogue, boss, marker, faction, and region-state rows.

### regions

Compatibility mirror for authored region definitions.

Columns:
- `id <int, PK>`
- `region_key <varchar, unique, not null>`
- `name <varchar, unique, not null>`
- `description <varchar, not null>`
- `danger_level <int, not null>`
- `recommended_level <int, not null>`
- `faction <varchar, nullable>`
- `shard_name <varchar, nullable>`
- `is_unlocked <int, default 1>`

Relationships:
- One region can have many compatibility quest rows.

### quests

Compatibility/custom quest table. Authored quests live in `src/content/quests.js`.

Columns:
- `id <int, PK>`
- `quest_key <varchar, unique, not null>`
- `region_id <int, FK -> regions.id, not null>`
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
- Many quests belong to one region.
- Adventure logs store `quest_key` because authored quests are fixed content.

### adventure_logs

Columns:
- `id <int, PK>`
- `character_id <int, FK -> characters.id, not null>`
- `quest_key <varchar, not null>`
- `outcome <varchar, not null>`
- `xp_gained <int, not null>`
- `gold_gained <int, not null>`
- `result_text <varchar, not null>`
- `created_at <varchar, not null>`

Relationships:
- Many adventure logs belong to one character.
- User ownership is derived through `characters.user_id`, avoiding a redundant `user_id` FK.

### abilities

Compatibility mirror for authored ability definitions.

Columns:
- `id <int, PK>`
- `ability_key <varchar, unique, not null>`
- `name <varchar, not null>`
- `class_name <varchar, nullable>`
- `affinity <varchar, nullable>`
- `ability_type <varchar, not null>`
- `power <int, not null>`
- `combo_tag <varchar, nullable>`
- `required_level <int, not null>`
- `description <varchar, not null>`

Relationships:
- One ability can be unlocked by many characters through `character_abilities`.

### character_abilities

Junction table for learned abilities.

Columns:
- `id <int, PK>`
- `character_id <int, FK -> characters.id, not null>`
- `ability_id <int, FK -> abilities.id, not null>`
- `unlocked_at <varchar, not null>`

Constraints:
- Unique `(character_id, ability_id)`

Relationships:
- Many-to-many between characters and abilities.

### character_run_states

Columns:
- `id <int, PK>`
- `character_id <int, FK -> characters.id, unique, not null>`
- `schema_version <int, default 1>`
- `embers <int, default 0>`
- `flask_charges <int, default 4>`
- `last_checkpoint_x <real, default -5>`
- `last_checkpoint_y <real, default 0>`
- `last_checkpoint_z <real, default 4>`
- `saved_at <varchar, not null>`

Relationships:
- One-to-one with characters.

### save_slots

Columns:
- `id <int, PK>`
- `user_id <int, FK -> users.id, not null>`
- `character_id <int, FK -> characters.id, nullable>`
- `slot_index <int, not null>`
- `slot_name <varchar, not null>`
- `created_at <varchar, not null>`
- `updated_at <varchar, not null>`
- `last_played_at <varchar, nullable>`

Constraints:
- Unique `(user_id, slot_index)`

Relationships:
- One user has many save slots.
- A save slot can point to one character or no character.

### character_quest_completions

Columns:
- `id <int, PK>`
- `character_id <int, FK -> characters.id, not null>`
- `quest_key <varchar, not null>`
- `reward_xp <int, not null>`
- `awarded_at <varchar, not null>`

Constraints:
- Unique `(character_id, quest_key)`

Relationships:
- One character has many quest completion records.

### character_inventory

Columns:
- `id <int, PK>`
- `character_id <int, FK -> characters.id, not null>`
- `item_key <varchar, not null>`
- `quantity <int, default 1>`
- `acquired_at <varchar, not null>`
- `updated_at <varchar, not null>`

Constraints:
- Unique `(character_id, item_key)`

Relationships:
- One character has many inventory rows.

### character_equipment

Columns:
- `id <int, PK>`
- `character_id <int, FK -> characters.id, not null>`
- `equipment_slot <varchar, not null>`
- `item_key <varchar, not null>`
- `equipped_at <varchar, not null>`

Constraints:
- Unique `(character_id, equipment_slot)`

Relationships:
- One character has many equipment slots.

### character_dialogue_flags

Columns:
- `id <int, PK>`
- `character_id <int, FK -> characters.id, not null>`
- `flag_key <varchar, not null>`
- `flag_value <varchar, default true>`
- `set_at <varchar, not null>`

Constraints:
- Unique `(character_id, flag_key)`

Relationships:
- One character has many dialogue/story flags.

### character_boss_states

Columns:
- `id <int, PK>`
- `character_id <int, FK -> characters.id, not null>`
- `boss_key <varchar, not null>`
- `status <varchar, default unknown>`
- `attempts <int, default 0>`
- `defeats <int, default 0>`
- `best_time_seconds <real, nullable>`
- `last_outcome <varchar, nullable>`
- `updated_at <varchar, not null>`

Constraints:
- Unique `(character_id, boss_key)`

Relationships:
- One character has many boss-state records.

### character_campaign_markers

Columns:
- `id <int, PK>`
- `character_id <int, FK -> characters.id, not null>`
- `marker_key <varchar, not null>`
- `region_key <varchar, not null>`
- `marker_type <varchar, not null>`
- `is_revealed <int, default 1>`
- `is_completed <int, default 0>`
- `position_x <real, nullable>`
- `position_y <real, nullable>`
- `position_z <real, nullable>`
- `updated_at <varchar, not null>`

Constraints:
- Unique `(character_id, marker_key)`

Relationships:
- One character has many campaign marker records.

### character_faction_reputation

Columns:
- `id <int, PK>`
- `character_id <int, FK -> characters.id, not null>`
- `faction_key <varchar, not null>`
- `reputation <int, default 0>`
- `rank <varchar, default neutral>`
- `updated_at <varchar, not null>`

Constraints:
- Unique `(character_id, faction_key)`

Relationships:
- One character has many faction reputation records.

### character_region_states

Columns:
- `id <int, PK>`
- `character_id <int, FK -> characters.id, not null>`
- `region_key <varchar, not null>`
- `is_unlocked <int, default 0>`
- `is_discovered <int, default 0>`
- `threat_level <int, default 0>`
- `world_state <varchar, default stable>`
- `updated_at <varchar, not null>`

Constraints:
- Unique `(character_id, region_key)`

Relationships:
- One character has many per-region state records.

## Relationship Arrows

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

## Authored Content Modules

These are fixed rules/content and should not be normal mutable gameplay DB tables:

- `src/content/regions.js`
- `src/content/quests.js`
- `src/content/abilities.js`
- `src/content/items.js`
- `src/content/factions.js`
- `src/content/enemies.js`
- `src/content/recipes.js`
- `src/content/maps.js`

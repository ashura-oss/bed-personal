# BED Personal Backend

Backend API for the BED personal RPG project. This repo is a backend-only export from the larger local game worktree so it can be cloned and run on another computer without the unfinished client/UI files.

## Stack

- Node.js
- Express
- libSQL
- Drizzle ORM
- bcrypt
- JSON Web Tokens
- dotenv
- nodemon

## What Is Included

- Auth, users, and characters
- Authored fixed content in `src/content`
- Region, quest, ability, combo, adventure, and progression routes
- Full-game state persistence routes for save slots, inventory, equipment, dialogue flags, boss states, campaign markers, faction reputation, and region state
- Seed script and backend model tests
- Backend docs in `docs/`

## Setup

Install dependencies:

```powershell
npm install
```

Create a local environment file:

```powershell
copy .env.example .env
```

Seed the local libSQL database:

```powershell
npm run db:seed
```

Start the server:

```powershell
npm start
```

Development server with nodemon:

```powershell
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

Health check:

```http
GET /health
```

## Test

Run the backend model tests:

```powershell
npm run test:backend
```

If tests touch seeded legacy tables, run the seed first:

```powershell
npm run db:seed
npm run test:backend
```

## Main Route Groups

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `/users`
- `/characters`
- `/regions`
- `/quests`
- `/abilities`
- `/combos`
- `/adventures`
- `/progression`
- `/state`

Protected routes require:

```http
Authorization: Bearer <token>
```

Detailed endpoint notes are in `docs/api-reference.md` and `docs/testing-guide.md`.

## Data Design

The backend follows the teacher's structure: fixed game rules live in authored content modules, while player-changing data lives in database tables.

Fixed content examples:

- Regions
- Quests
- Abilities
- Items
- Factions
- Enemies
- Recipes
- Maps

Dynamic DB state examples:

- Users
- Characters
- Adventure logs
- Quest completions
- Ability unlocks
- Run state
- Save slots
- Inventory
- Equipment
- Dialogue flags
- Boss states
- Campaign markers
- Faction reputation
- Region state

ERD notes are in `docs/erd-notes.md`.

## Not Included

- Client/game frontend
- Generated SQLite database files
- `node_modules`
- Local workflow files
- Test output folders

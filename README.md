# CA1 Ashura OSS Backend

Early backend foundation for the ST0503 CA1 project. This snapshot is intentionally small: it sets up the Express API, libSQL database connection, Drizzle schema, seed script, and the first MVC-style route groups.

## Current Scope

Implemented:

- Express server with JSON middleware and health endpoints
- libSQL + Drizzle database setup
- `users` table for basic player profiles
- `characters` table linked to users
- User routes for listing, creating, viewing, and editing a profile name
- Character routes for listing, creating, and viewing starter characters
- Basic validation and shared error responses

Not implemented yet:

- Authentication
- Password storage
- Inventory
- Progression
- Quests
- Combat
- Frontend integration

## Setup

```bash
npm install
cp .env.example .env
npm run db
npm run dev
```

The default server URL is:

```text
http://localhost:3000
```

## Main Endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Basic health check |
| `GET` | `/api/health` | Template health check |
| `GET` | `/api/users` | List users |
| `POST` | `/api/users` | Create a user profile |
| `GET` | `/api/users/:userId` | Get one user |
| `PATCH` | `/api/users/:userId/profile` | Update display name |
| `GET` | `/api/users/:userId/characters` | List a user's characters |
| `GET` | `/api/characters` | List characters |
| `POST` | `/api/characters` | Create a character for a user |
| `GET` | `/api/characters/:characterId` | Get one character |

Example user payload:

```json
{
  "username": "ashen",
  "displayName": "Ashen Player"
}
```

Example character payload:

```json
{
  "userId": 1,
  "name": "Rowan",
  "archetype": "warden"
}
```

## Scripts

| Command | Description |
|---|---|
| `npm start` | Run the API once |
| `npm run dev` | Run with nodemon |
| `npm run db` | Recreate and seed the local database |
| `npm test` | Run baseline tests |
| `npm run export` | Export a zip without `node_modules` |

## Notes

Local environment files and generated SQLite/libSQL database files are ignored by Git. Use `.env.example` as the safe template for local setup.

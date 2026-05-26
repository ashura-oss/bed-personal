# Student Assignment Template

Express.js + libsql + Drizzle ORM starter for building your own API and frontend feature.

This template now starts without any sample MVC feature routes. Only infrastructure endpoints are pre-wired:

- `GET /api/health`
- `GET /api-docs`

## Setup

```bash
npm install
npm run db
npm run dev
```

Open http://localhost:3000 after the server starts.

## Build Your Feature

1. Add tables in `src/db/schema.js`
2. Add seed data in `src/db/seed.js`
3. Create model files in `src/models/`
4. Create controller files in `src/controllers/`
5. Create route files in `src/routes/`
6. Register routes in `index.js` before `app.use(errorHandler)`
7. Build/update pages in `src/frontend/`

## Key Files

| File | Purpose |
|---|---|
| `index.js` | App setup, middleware, route registration, global error handler |
| `src/db/schema.js` | Drizzle table schemas |
| `src/db/seed.js` | Database reset and seed script |
| `src/models/` | Data access layer |
| `src/controllers/` | Request validation and response formatting |
| `src/routes/` | Route to controller mapping |
| `src/utils/_errors.js` | `AppError`, `ERROR_CODES`, and `errorHandler` |
| `_extras/tests/` | Infrastructure and baseline tests |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with auto-reload |
| `npm run db` | Recreate DB and seed data |
| `npm test` | Run test suite |
| `npm run export` | Export project zip (without node_modules) |

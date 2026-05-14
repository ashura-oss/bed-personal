# Realmforge Context

## Project Overview
Realmforge is a school CA1/CA2 Express/libSQL RPG project with a working plain HTML/CSS/JS frontend. Current shipped gameplay is backend-driven: auth, hero creation, map quests, XP/gold/logs, ability unlocks, combos, and boss quest combo encounters. Track 2 is planned as a real Phaser side-scrolling action RPG, but Phaser runtime code is not implemented yet.

## Tech Stack
- Express, libSQL, Drizzle, nodemon
- bcrypt, jsonwebtoken
- Plain HTML/CSS/JS, Fetch API, localStorage
- Planned Track 2: Phaser 3 ES modules, Tiled JSON, Canvas-generated pixel art

## File Structure
- `src/`: backend routes/controllers/models/db/middlewares/utils
- `frontend/`: current CA2 web app pages, CSS, JS modules
- `frontend/js/game/`: reusable pure frontend rules and `gameState.js`
- `game/`: planned Phaser client folder for Track 2
- `docs/`: roadmap, lore, API, ERD, testing, game design

## Key Commands
- `npm install`
- `npm run dev`
- `npm start`
- `npm run db:seed`
- Demo login: `demoUnbound` / `demo-password-ca1`
- Current app URL: `http://localhost:3001/login.html`

## Architecture Rules
- Assignment requirements stay preserved; Track 2 builds on top.
- Keep DOM app logic in `frontend/`; keep Phaser code in `game/`.
- Separate game logic from rendering/DOM.
- Use `frontend/js/game/gameState.js` as current frontend store.
- Backend remains routes -> controllers -> models -> db.
- No fake UI, fake routes, dead buttons, or completed statuses without tests.

## Reference Docs
Read these only when the current task requires their content. Do not load all of them at once.
- `docs/project-master-plan.md`
- `docs/story-bible.md`
- `docs/api-reference.md`
- `docs/ca-requirements-map.md`
- `docs/erd-notes.md`
- `docs/game-design-doc.md`
- `docs/pixel-art-style-guide.md`

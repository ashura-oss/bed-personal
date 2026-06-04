# Backend Integration Contract

The backend is complete and reused unchanged until Phase 3.

## Backend Architecture

Keep:

`routes -> controllers -> models -> db`

Do not rewrite backend structure.

## Existing API Role

- Auth and JWT session.
- Characters, stats, XP, level.
- Abilities and affinity.
- Regions and quests.
- Adventure logs.

## Client Access

- Client talks through `client/src/net/ApiClient.js`.
- Reuse JWT-in-localStorage pattern.
- webpack-dev-server proxies API calls to Express in dev.
- Production build is served by Express at `/play`.

## Deferred Backend Work

Phase 3 only:
- carried Embers;
- last Hearthlight;
- Emberflask charges;
- equipped loadout.

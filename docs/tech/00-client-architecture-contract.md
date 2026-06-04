# Client Architecture Contract

Status: bootstrapped. `client/` exists with webpack5, plain JavaScript ESM, Three.js, Rapier, FollowCamera, procedural terrain chunks, UIBus, and Jest tests.

## Stack

- webpack 5 + webpack-dev-server (HMR).
- Plain JavaScript ESM.
- Three.js renderer.
- Rapier WASM physics.
- HTML/CSS overlay UI.
- Jest for pure systems.
- Playwright for browser smoke.

## Planned Structure

`client/src/` must keep these boundaries:

- `core/`: loop, clock, event bus, service setup.
- `render/`: renderer, scene, lighting, camera, post.
- `physics/`: Rapier world, colliders, controller, raycasts.
- `gameplay/`: player, combat later, enemies later, resources.
- `world/`: regions, greybox levels, Hearthlights, gates.
- `progression/`: level/stat systems and backend mapping.
- `save/`: run-state once Phase 3 begins.
- `ui/`: overlay components only.
- `net/`: API client and endpoint wrappers.
- `assets/`: manifests and loaders.

## Bootstrap Boundary

`client-bootstrap` may create boot, renderer, Rapier init, greybox arena, and orbit camera. Combat, HUD, dummy enemy, backend schema changes, and art pass are out of scope.

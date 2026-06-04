# Definition Of Done

## Any Documentation Task

- Source-of-truth docs read.
- No current-direction contradiction introduced.
- Legacy material clearly labeled when referenced.
- Status docs updated if direction, risk, or readiness changed.

## Any Client Feature

- Built on `feat/<name>`.
- Implemented by Codex.
- Reviewed by Claude only if requested.
- ESLint passes.
- Jest passes for pure systems touched.
- webpack build passes for runnable client changes.
- Browser smoke passes if feature is runnable.
- No gameplay -> UI imports.
- UI updates flow through `UIBus`.
- No render-loop console logs.
- No hardcoded asset paths outside asset layer.
- No secrets.

## `client-bootstrap` Done

- `client/` exists with webpack 5 + plain JavaScript ESM.
- webpack-dev-server runs with HMR and API proxy.
- Three.js renders a nonblank greybox arena.
- Rapier WASM initializes asynchronously.
- Orbit camera works.
- No combat systems are implemented.
- No enemies, inventory, progression, save state, or real UI screens are implemented.
- Browser boot is verified.

## Release Done

- CI green: lint -> test -> build.
- webpack production build is hashed and code-split.
- Express serves the build at `/play`.
- Demo login works.
- The phase is actually playable in browser.
- License-clean asset check is recorded.

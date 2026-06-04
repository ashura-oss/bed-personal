# Render Loop Contract

The runtime separates fixed simulation from variable rendering.

## Loop Shape

1. Poll input.
2. Accumulate time.
3. Run fixed updates for physics/gameplay.
4. Render current scene.
5. Emit UI events only when state changes.

## Rules

- No gameplay logic inside render-only functions.
- No avoidable allocations in hot paths.
- No per-frame `console.log`.
- Resize handling must update renderer and camera.
- Frame loop must stop or pause cleanly when the app is destroyed.

## Bootstrap Acceptance

- Nonblank Three.js canvas.
- Stable orbit camera.
- Basic lighting/fog/tone-map.
- No combat or HUD dependency.

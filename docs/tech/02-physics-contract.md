# Physics Contract

Physics uses Rapier WASM through async initialization.

## Rules

- Initialize Rapier before creating physics world objects.
- Use a fixed timestep for simulation.
- Keep physics colliders simple: capsules, boxes, simple ramps.
- Do not use render meshes as physics colliders in gameplay-critical paths.
- Dispose physics resources on scene unload.
- Gate debug draw behind a debug flag.

## `client-bootstrap`

Allowed:
- load Rapier;
- create a world;
- create static greybox colliders;
- prove initialization and stepping.

Out of scope:
- attacks;
- hurtboxes;
- enemy AI;
- death/recover loop.

## Later

Kinematic character controller, grounded checks, slopes, steps, lock-on raycasts, and hitbox windows arrive in later slices.

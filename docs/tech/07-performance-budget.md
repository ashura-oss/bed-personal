# Performance Budget

Target: 60 fps at 1080p on a mid-range machine.

## Frame Budget

- Total frame: about 16.6 ms.
- Keep simulation predictable.
- Prefer stable frame time over visual extras.

## Render Budget

- Low draw calls.
- Shared materials.
- Instanced repeated props.
- Limited dynamic shadows.
- Bloom and tone-map by default; SSAO optional later.

## Physics Budget

- Fixed timestep.
- Simple colliders.
- No duplicate physics work per render frame.
- Avoid main-thread stalls.

## UI Budget

- Event-driven updates.
- No per-frame DOM churn.
- No layout read/write loops.

## Asset Budget

- Preload required assets.
- Compress shipped textures.
- Dispose geometry, materials, textures, and render targets on unload.

# Assets Contract

Greybox comes first. Shipped assets must be original or license-clean.

## Rules

- Use webpack asset modules.
- Use manifests/loaders for asset references.
- Do not scatter hardcoded `.glb`, `.png`, `.ktx2`, `.mp3`, or `.wav` paths.
- Preload required assets behind a loading screen.
- Use glTF/GLB for models.
- Use KTX2/Basis for shipped textures where practical.
- Record license/source for every release-bound asset.

## Bootstrap

`client-bootstrap` should use generated primitives or minimal internal placeholders. It should not add production art/audio.

## Review

Flag:
- copied game assets;
- unclear font license;
- large uncompressed textures;
- sync loads during gameplay;
- build output committed accidentally.

# Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-29 | Pivot to third-person 3D action RPG | User wants real releasable 3D game |
| 2026-05-29 | webpack 5, not Vite | Industry standard, WASM pipeline fit |
| 2026-05-29 | Jest, not Vitest | Avoid Vite-coupled test stack |
| 2026-05-29 | Reuse backend unchanged | Existing API/data layer is complete |
| 2026-05-29 | UI through UIBus only | Preserve gameplay/UI separation |
| 2026-05-29 | Greybox before art | Ship gameplay first, replace visuals later |
| 2026-06-02 | Active session is implementer | Claude and Codex switch on token exhaustion; no real-time collaboration |
| 2026-06-02 | Procedural character visuals (PlayerVisual, TrainingEnemyVisual) | Greybox art with full character feel before real glTF assets |
| 2026-06-02 | CombatFeedbackSignals via CustomEvent | Zero-coupling side-channel for audio/VFX reactions |
| 2026-06-02 | Full game roadmap in `docs/forge3d/05-full-game-roadmap.md` | 15 slices (G-01 to G-15) covering world, NPCs, quests, skills, items, crafting, cutscenes, music, story |
| 2026-06-03 | **Procedural open world + authored prefab chunks** | Minecraft-style gather/craft/explore loop in a seeded procedural world; soulslike boss fights triggered by fog gates; story beats live in hand-crafted prefab chunks the generator embeds at seeded locations. Architecture in `docs/forge3d/06-procedural-world-plan.md` |
| 2026-06-03 | World-space deterministic generation | All noise sampled in world coords (not chunk-local) → seamless chunks + reproducible seeds. No `Math.random()` in generation |
| 2026-06-03 | Next slice = W-01 (Chunk + Terrain Foundation) | De-risks seams/stutter/KCC-on-heightfield up front; everything else builds on it |
| 2026-06-03 | Client converted from TypeScript to plain JavaScript ESM | Course/project requirement is JS-only. `client/` now has zero `.ts` files, Babel/Jest/webpack JS tooling, and no TypeScript toolchain dependencies. |

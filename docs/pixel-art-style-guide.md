# Realmforge Pixel Art Style Guide

This is the permanent visual production guide for Track 2. The goal is not placeholder art. Realmforge should read as a real dark fantasy 16-bit action RPG, with pixel art that is consistent enough to ship, explain, and expand.

## Art Direction

Target style:
- 16-bit SNES-era readability inspired by `Chrono Trigger` and `Secret of Mana`.
- Dark fantasy atmosphere closer to `Blasphemous`: heavy silhouettes, sacred ruins, ash, blood, gold, and corrupted nature.
- Rich palette with gradients inside sprites.
- Every pixel should serve silhouette, volume, animation readability, or lighting.

Rules:
- No antialiasing.
- No sub-pixel rendering.
- No pure black outlines. Use the darkest stop of the relevant palette ramp.
- No pure white highlights. Use holy light or steel highlight instead.
- Use integer scaling only.
- Prefer strong silhouettes over noisy detail.

## Canvas Resolution

- Native game render: `480x270`.
- Intended desktop scale: `3x`, giving `1440x810`.
- Canvas CSS: `image-rendering: pixelated`.
- Phaser camera and sprites must avoid fractional positions where possible.
- Asset PNGs are exported at native 1x resolution; Phaser handles integer scaling.

## Tile Size

- Base grid: `16x16`.
- Platforms, walls, floors, decorations, hazards, and collision bodies snap to the 16px grid.
- Tilemaps should use Tiled JSON exported for Phaser.
- Collision layers must be explicit, not inferred from tile art.

## Sprite Dimensions

| Asset type | Native size |
| --- | --- |
| Player | `32x48` |
| Small enemy | `32x32` |
| Medium enemy | `48x48` |
| Boss | `96x96` to `128x128` |
| NPC | `24x48` |
| Item or pickup | `16x16` |
| Projectile | `8x8` to `16x16` |

Scale:
- All sprites render at `3x`.
- Player appears `96x144` on screen.
- Bosses appear `288x288` to `384x384` on screen.
- Never scale sprites at non-integer multiples.

## Colour Palette

Each ramp has 5 stops:
1. Highlight
2. Base
3. Mid shade
4. Deep shade
5. Darkest

Use highlight sparingly for edges catching light, metal sheen, magic flares, and impact frames. Use darkest stops for outlines and deep shadow.

### Skin and Flesh

Light:
- `#F5D6B8`
- `#D4A574`
- `#B07D4F`
- `#8B5E3C`
- `#5C3A20`

Dark:
- `#C08B5C`
- `#8B5A2B`
- `#6B3F1F`
- `#4A2A12`
- `#2E1A0B`

### Metal and Armour

Steel:
- `#D4D4D8`
- `#A8A8B0`
- `#787882`
- `#52525C`
- `#2C2C34`

Gold:
- `#F5D97E`
- `#D7AF42`
- `#B08A22`
- `#7A5C0E`
- `#4A3508`

Dark iron:
- `#6B6B78`
- `#4A4A55`
- `#333340`
- `#22222E`
- `#14141E`

### Nature

Verdant:
- `#8BC46A`
- `#5A9E3A`
- `#3B7222`
- `#244E14`
- `#142E0A`

Corrupted:
- `#7A9E5C`
- `#4E6B2E`
- `#3A4A22`
- `#2A3418`
- `#1A2210`

Wood and bark:
- `#A07850`
- `#7A5A38`
- `#5C4028`
- `#3E2A18`
- `#261A0E`

### Fire and Ember

Fire:
- `#FCE8A0`
- `#F5C24A`
- `#E8922F`
- `#C45420`
- `#8A2A10`

Ember:
- `#E8692F`
- `#B84820`
- `#8A3018`
- `#5C1E10`
- `#3A120A`

### Water and Holy

Deep water:
- `#6AAEDC`
- `#3A82B8`
- `#2A5E8A`
- `#1A3E5C`
- `#0E2238`

Holy light:
- `#FAFAE0`
- `#F0E8A0`
- `#D4C860`
- `#A89830`
- `#7A6A18`

### Shadow and Void

Shadow:
- `#585468`
- `#3E3A50`
- `#2A2838`
- `#1C1A28`
- `#0E0E18`

Arcane:
- `#B88AE8`
- `#8A5CC4`
- `#6A3EA0`
- `#482878`
- `#2A1850`

Blood:
- `#DC4A4A`
- `#B03030`
- `#8A1E1E`
- `#5C1010`
- `#380808`

### Environment

Stone:
- `#B8B0A0`
- `#908878`
- `#686058`
- `#484038`
- `#2A2420`

Ash:
- `#C8C0B0`
- `#A09888`
- `#787060`
- `#504840`
- `#302A24`

Dark sky:
- `#1E2840`
- `#141E30`
- `#0E1420`
- `#080E18`
- `#040810`

## Animation Frame Counts

### Player

Player total target: 48 frames.

| Animation | Frames | Notes |
| --- | ---: | --- |
| Idle | 4 | Subtle breathing, 8fps |
| Run | 6 | 10fps |
| Jump rise | 2 | Immediate read |
| Jump fall | 2 | Different silhouette from rise |
| Land | 2 | Squash/recovery |
| Light attack | 4 | Wind-up, swing, hit, recovery at 12fps |
| Heavy attack | 6 | Longer wind-up at 10fps |
| Dodge roll | 5 | 12fps |
| Block idle | 1 | Stable defensive pose |
| Parry flash | 2 | 16fps |
| Hurt | 2 | Fast recoil |
| Death | 6 | 8fps |
| Ledge grab | 2 | Grab and hang |
| Ability cast | 4 | Recoloured per affinity |

### Enemy

Enemy total target: 19 frames per enemy type.

| Animation | Frames | Notes |
| --- | ---: | --- |
| Idle | 4 | 6fps |
| Walk or patrol | 4 | 8fps |
| Attack telegraph | 2 | Hold final telegraph frame by timing |
| Attack | 3 | 12fps |
| Hurt | 2 | Quick hit response |
| Death | 4 | 8fps |

### Boss

Boss total target: 34 frames per boss.

| Animation | Frames | Notes |
| --- | ---: | --- |
| Idle | 4 | 6fps |
| Walk | 4 | 6fps |
| Attack pattern 1 | 6 | Telegraph 2 + strike 4 |
| Attack pattern 2 | 6 | Telegraph 2 + strike 4 |
| Enrage transition | 4 | 8fps |
| Hurt | 2 | Impact response |
| Death | 8 | 6fps, cinematic |

## Spritesheet Format

- Each animation is a separate PNG file.
- Frames are laid out horizontally in a single row.
- Naming format: `entity-animation.png`.
- Examples:
  - `player-idle.png`
  - `player-run.png`
  - `hollowborn-walk.png`
  - `hollowbound-guard-attack-1.png`
- Store sprites in `game/assets/sprites/`.
- Load spritesheets in `BootScene` with Phaser's spritesheet loader.

## Region Visual Identity

### Hearthmere Outpost

- Palette: ash, stone, wood, ember.
- Tiles: cobblestone roads, wooden walls, thatched roofs, broken statues.
- Atmosphere: warm but worn, safe but damaged.
- Parallax: overcast sky and distant ruined towers.

### Ironvale City

- Palette: steel, dark iron, ember, gold.
- Tiles: iron walls, military banners, prison bars, stone floors.
- Atmosphere: oppressive, rigid, cold authority.
- Parallax: smoke stacks, fortress walls, grey sky.

### Blackroot Forest

- Palette: verdant, corrupted, shadow, arcane.
- Tiles: massive tree trunks, thorny vines, glowing mushrooms, twisted roots.
- Atmosphere: beautiful but threatening, alive and watching.
- Parallax: layered fog, distant canopy, floating spores.

### Sunken Temple

- Palette: deep water, stone, holy light, shadow.
- Tiles: flooded stone halls, crumbling pillars, submerged altars, floating debris.
- Atmosphere: eerie, sacred, drowned memory.
- Parallax: underwater light shafts, bubbles, distant submerged architecture.

### Dragon Coast

- Palette: deep water, steel, ash, fire.
- Tiles: cliff edges, wooden docks, dragon bone reefs, lighthouse ruins.
- Atmosphere: wild, dangerous, untamed.
- Parallax: stormy ocean, lightning flashes, distant dragon skeleton.

### Moonspire Academy

- Palette: arcane, shadow, holy light, stone.
- Tiles: floating stone platforms, arcane glyphs, crystal formations, bookshelves.
- Atmosphere: mysterious, unstable, reality-bending.
- Parallax: starfield through gaps, floating debris, arcane energy.

### Gravehold Marsh

- Palette: ash, shadow, corrupted, blood.
- Tiles: muddy ground, broken gravestones, dead trees, spectral fog.
- Atmosphere: melancholic, haunted, heavy with regret.
- Parallax: thick fog layers and distant ghostly formations.

### Ashen Capital / Aurelmere

- Palette: gold, ash, holy light, shadow.
- Tiles: golden ruins, ash-covered marble, translucent memory echoes, grand arches.
- Atmosphere: beautiful and tragic, frozen in time.
- Parallax: falling golden ash, rising memory-light, ruined skyline.

## VFX Sprites

| VFX | Frames | Native size | Palette |
| --- | ---: | --- | --- |
| Sword slash arc | 3 | `32x32` | Steel |
| Fire burst | 4 | `32x32` | Fire |
| Shadow wisp | 3 | `16x16` | Shadow |
| Holy flash | 2 | `32x32` | Holy light |
| Blood splatter | 3 | `16x16` | Blood |
| Shard glow | 4 | `16x16` | Gold + holy light |
| Dodge dust | 3 | `16x16` | Ash |
| Parry spark | 2 | `16x16` | Gold + steel |

## UI Pixel Art

- Health orb: `16x16`, blood palette, drains with HP.
- Stamina bar segment: `8x4`, gold palette.
- Ability icons: `16x16`, affinity-coloured borders.
- Boss health bar: `128x8`, region-coloured fill.
- Dialogue box: 9-slice from `48x48` source, stone palette, gold border.
- Inventory slot: `20x20`, dark iron border, shadow fill.

## Generation Method

Preferred production method for generated assets:
- Generate PNG assets with Canvas API.
- Draw pixel-by-pixel with `fillRect`.
- Export at native 1x resolution.
- Use SVG only for previews or planning diagrams, not final in-game sprite assets.
- Phaser handles display scaling.

Asset generation scripts should be repeatable. If a generated asset is revised, update the source generator and rerun it rather than hand-editing only the PNG.

## Related Documents

- `docs/game-design-doc.md` — Phaser architecture, scene flow, physics constants, and build order.
- `docs/track2-delegation-plan.md` — Exact Claude Code prompts and test criteria for every Track 2 build ticket.

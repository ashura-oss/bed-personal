# Realmforge Track 2: Task Delegation Plan

## Overview

Claude.ai plans and designs. Claude Code builds the Phaser.js game and pixel art. Codex handles large autonomous builds when Claude Code tokens are low. All planning is done in Claude.ai first — never plan in Claude Code or Codex.

## Rules

- Always read CLAUDE.md before starting.
- One ticket per Claude Code session.
- /compact mid-session if context grows.
- /clear between sessions.
- Sonnet normal for 90% of tasks.
- Sonnet extended thinking only for T2-6.1 (cinematic) and complex multi-system work.
- Never use Opus.
- Test after every ticket before moving to the next.
- All game logic in `systems/`, all rendering in `scenes/` and `entities/`.

---

## Phase T2-1: Game Engine Foundation (Weeks 1–2)

### T2-1.1 Phaser setup + BootScene

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/index.html, game/config.js, game/scenes/BootScene.js. Phaser 3 from CDN, 480x270 resolution, Arcade Physics, gravity 800, pixel art rendering. BootScene shows loading bar then transitions to a TestScene with a coloured rectangle on a platform."
- **Test:** See loading screen, then rectangle standing on ground with gravity.

### T2-1.2 Player entity + movement

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/entities/Player.js with state machine (idle, run, jump, fall, land). WASD/arrows for movement. Physics from CLAUDE.md (move speed 160, jump force -350, double jump -280, coyote time 100ms). Use a coloured rectangle placeholder for now."
- **Test:** Move left/right, jump, double jump, fall, land.

### T2-1.3 InputManager

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/systems/InputManager.js. Map keyboard (WASD+arrows for movement, JKL for combat, 1234Q for abilities, E interact, Tab inventory, M map, Esc pause) and mouse (left=light attack, right=heavy attack). Register as Phaser plugin so all scenes access it."
- **Test:** Press every key, confirm bindings logged to console.

### T2-1.4 First tilemap + ExplorationScene

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md and docs/pixel-art-style-guide.md. Create game/scenes/ExplorationScene.js. Generate a simple Hearthmere test level as a tilemap (stone platform tiles, 16x16, using the stone palette). Load Player, apply camera follow, add collision with tilemap. Include a few platforms at different heights."
- **Test:** Player walks and jumps across platforms in a side-scrolling level.

---

## Phase T2-2: Combat System (Weeks 3–4)

### T2-2.1 Light attack + heavy attack

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Add attack states to Player.js (attack_light 300ms lock, attack_heavy 500ms lock). Create game/systems/CombatSystem.js with hitbox generation on attack frames. Add placeholder attack rectangle visual. Attacks should feel committed — no cancelling mid-swing."
- **Test:** Press J for light attack (fast), K for heavy attack (slow, bigger hitbox).

### T2-2.2 Dodge roll + stamina

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Add dodge state to Player (400ms duration, 200ms i-frames, speed 300, directional with A/D). Add stamina system: attacks cost 15, dodge costs 25, block holds cost 5/tick. Stamina max 100, regen 20/sec when idle. Add stamina bar to a basic HUD."
- **Test:** Dodge through placeholder hazard, stamina drains and regens.

### T2-2.3 Block + parry

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Add block state (hold I = 50% damage reduction, drains guard meter). Add parry (tap I within 150ms of incoming hit = enemy stagger 1s). Visual flash on successful parry."
- **Test:** Block reduces damage, parry staggers enemy, wrong timing takes full hit.

### T2-2.4 First enemy (Hollowborn)

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/entities/Enemy.js base class with state machine (idle, patrol, chase, telegraph, attack, hurt, death). Create game/data/enemies/hollowborn.json config. Hollowborn: 32x32, slow patrol, 400ms telegraph, simple lunge attack. Drops XP on death."
- **Test:** Enemy patrols, chases player when close, telegraphs attack, takes damage, dies.

### T2-2.5 ComboResolver

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/systems/ComboResolver.js. When player presses 1 (opener), start 2s combo window. If 2 (chain) pressed in window, extend. If 3 (finisher) pressed, resolve. Connect to backend POST /combos/resolve. Display combo result damage. Getting hit breaks combo."
- **Test:** Full opener→chain→finisher combo on Hollowborn, see bonus damage.

---

## Phase T2-3: First Playable Boss (Weeks 5–6)

### T2-3.1 Boss entity class

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/entities/Boss.js extending Enemy. Add phase system (3 phases). Each phase has its own attack pattern set. Phase transition at HP thresholds (66%, 33%). Add BossHealthBar UI."
- **Test:** Boss transitions phases at HP thresholds.

### T2-3.2 Hollowbound Caravan Guard boss

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md and docs/story-bible.md (Hearthmere section only). Create boss config for the Hollowbound Caravan Guard. Phase 1: slow sword swings, 500ms telegraph. Phase 2: adds shield charge. Phase 3: desperate flurry attacks, shorter telegraphs. Arena is a broken road."
- **Test:** Full boss fight with three phases, death and victory states.

### T2-3.3 BossIntroScene

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/scenes/BossIntroScene.js. Cinematic camera pan to boss, boss name appears with dark fantasy title card, brief pause, then combat begins. Use WAAPI-style tweens."
- **Test:** Entering boss area triggers cinematic intro before fight starts.

---

## Phase T2-4: Game Loop Integration (Weeks 7–8)

### T2-4.1 HUD system

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md and docs/pixel-art-style-guide.md. Create game/ui/HUD.js as a Phaser Scene running parallel to ExplorationScene/CombatScene. Show: health orb (blood palette), stamina bar (gold), ability slots (1–4 + Q), combo meter, shard count. All pixel art style."
- **Test:** HUD visible during gameplay, updates in real time.

### T2-4.2 DialogueScene + NPC system

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/scenes/DialogueScene.js and game/entities/NPC.js. Dialogue box as 9-slice pixel art panel. NPC has interaction prompt (E key). Dialogue supports choices (up to 4 options). Load dialogue from game/data/dialogues/ JSON files. Create test dialogue for Edrin Vale at Hearthmere."
- **Test:** Approach NPC, press E, dialogue plays with choices.

### T2-4.3 Save shrine system

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/scenes/ShrineSaveScene.js and game/systems/SaveManager.js. Shrine is an interactable object in ExplorationScene. Resting: refills HP and consumables, respawns non-boss enemies, saves to backend. SaveManager persists: current region, shrine ID, character stats, inventory, shard collection."
- **Test:** Rest at shrine, enemies respawn, die and respawn at shrine.

### T2-4.4 WorldMapScene

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md and docs/pixel-art-style-guide.md. Create game/scenes/WorldMapScene.js. Pixel art map with region nodes. Locked/unlocked states. Region-specific colour tones from style guide. Click or press enter on region to transition to ExplorationScene for that region. Fetch region data from GET /regions."
- **Test:** See map, select Hearthmere, enter the level.

### T2-4.5 CharacterSelectScene

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/scenes/CharacterSelectScene.js. List existing characters from GET /characters or create new (origin→class→affinity→name). Use pixel art UI. On select, load character into GameStateManager and proceed to WorldMapScene."
- **Test:** Create character, select it, proceed to map.

---

## Phase T2-5: Pixel Art Pass (Weeks 9–10)

### T2-5.1 Player spritesheet

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md and docs/pixel-art-style-guide.md. Generate all player animation spritesheets using Canvas API. 32x48 per frame. Dark iron armour with gold trim. Steel/dark iron/gold palette. Generate: player-idle.png (4 frames), player-run.png (6 frames), player-jump.png (2 frames), player-fall.png (2 frames), player-light-attack.png (4 frames), player-heavy-attack.png (6 frames), player-dodge.png (5 frames), player-hurt.png (2 frames), player-death.png (6 frames). Save all to game/assets/sprites/."
- **Test:** Replace placeholder rectangle with animated pixel art player.

### T2-5.2 Hearthmere tileset

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read docs/pixel-art-style-guide.md (Hearthmere section). Generate a 16x16 tileset for Hearthmere Outpost using Canvas API. Include: cobblestone ground, wooden walls, thatched roof edges, broken statue fragments, campfire, crate, barrel, door, torch on wall, fence, mud patch, grass tufts. Stone/ash/wood/ember palette. Save as game/assets/tiles/hearthmere-tileset.png."
- **Test:** Level renders with proper tiles instead of placeholders.

### T2-5.3 Enemy sprites

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read docs/pixel-art-style-guide.md. Generate Hollowborn enemy spritesheet. 32x32 per frame. Corrupted humanoid in tattered robes, shadow/ash/blood palette. Generate: hollowborn-idle.png (4f), hollowborn-walk.png (4f), hollowborn-telegraph.png (2f), hollowborn-attack.png (3f), hollowborn-hurt.png (2f), hollowborn-death.png (4f). Save to game/assets/sprites/."
- **Test:** Enemies render with pixel art animations.

### T2-5.4 Boss sprite (Hollowbound Caravan Guard)

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read docs/pixel-art-style-guide.md and docs/story-bible.md (Hollowbound Caravan Guard). Generate boss spritesheet. 96x96 per frame. Corrupted caravan guard in broken armour, twisted by shard energy. Steel/shadow/ember palette. Glowing shard visible in chest. Generate all boss animations per style guide frame counts."
- **Test:** Boss renders with full pixel art and phase transitions.

### T2-5.5 VFX sprites

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read docs/pixel-art-style-guide.md (VFX section). Generate all VFX spritesheets: sword-slash.png, fire-burst.png, shadow-wisp.png, holy-flash.png, blood-splatter.png, shard-glow.png, dodge-dust.png, parry-spark.png. Dimensions and palettes per style guide."
- **Test:** Attacks show slash VFX, dodge shows dust, parry shows spark.

---

## Phase T2-6: Cinematic + Audio (Weeks 11–12)

### T2-6.1 Remotion opening cinematic

- **Tool:** Claude Code | Sonnet extended thinking
- **Prompt:** "Read CLAUDE.md and docs/story-bible.md (opening story section). Create game/scenes/CinematicScene.js. Build the opening cinematic as an animated sequence: dark screen, golden text appears telling the story of the Worldheart, show stylised pixel art scenes of the shattering, end with 'The Heart remembers you.' Narration-style text with dramatic timing. Player can skip with any key."
- **Test:** Game starts with cinematic before main menu.

### T2-6.2 MainMenuScene

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/scenes/MainMenuScene.js. Dark fantasy title screen with 'Realmforge: Shards of the Worldheart' in pixel art text. Animated shard particles. Options: New Journey, Continue, Settings. Ambient atmospheric sound. Gold and shadow palette."
- **Test:** Title screen displays, options navigate correctly.

### T2-6.3 Audio system

- **Tool:** Claude Code | Sonnet normal
- **Prompt:** "Read CLAUDE.md. Create game/systems/AudioManager.js. Support: background music per region (looping), combat music (transitions on enemy encounter), boss music, SFX (attack, hit, dodge, parry, death, menu, pickup, shrine). Volume controls. For now use placeholder sine wave tones — real audio assets come later."
- **Test:** Music changes between exploration and combat, SFX play on actions.

---

## Phase T2-7: Additional Regions (Weeks 13+)

Repeat the pattern from T2-5.2 (tileset) + T2-2.4 (enemies) + T2-3.2 (boss) for each new region:

| Region | Tileset | Enemy | Boss |
| --- | --- | --- | --- |
| Ironvale | steel tileset | Iron Guard | Lord Marshal Voss |
| Blackroot | forest tileset | corrupted beast | Hollow Stag |
| Sunken Temple | underwater tileset | drowned spirit | Drowned Oracle |
| Dragon Coast | cliff tileset | storm raider | Stormborn Drake |
| Moonspire | arcane tileset | construct | Archmagister Selene |
| Gravehold | marsh tileset | undead soldier | Oathgrave King |
| Ashen Capital | ruin tileset | memory echo | Ser Caldris (final boss) |

Each region is one Claude Code session with: tileset generation, enemy config + sprite, boss config + sprite + phases, and region-specific NPC dialogues.

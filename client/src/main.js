import "./styles.css";
import * as THREE from "three";
import { createCamera, updateCameraAspect } from "./engine/createCamera.js";
import { createRenderer, resizeRenderer } from "./engine/createRenderer.js";
import { createScene, getSceneBiomeAtmosphere } from "./engine/createScene.js";
import { startLoop } from "./engine/startLoop.js";
import { initRapier } from "./physics/initRapier.js";
import { ChunkManager } from "./world/chunk/ChunkManager.js";
import { AuthoredMapSource } from "./world/authored/AuthoredMapSource.js";
import { resolveAuthoredSpawnPoint } from "./world/authored/AuthoredSpawn.js";
import { CHUNK_SIZE, USE_AUTHORED_MAP, WORLD_SEED_DEFAULT } from "./world/gen/WorldConfig.js";
import { PrefabLoader } from "./world/prefab/PrefabLoader.js";
import { PrefabRegistry } from "./world/prefab/PrefabRegistry.js";
import { AuthoredPrefabRegistry } from "./world/authored/AuthoredPrefabRegistry.js";
import { UIBus } from "./ui/UIBus.js";
import { HUD } from "./ui/HUD.js";
import { GameContext } from "./core/GameContext.js";
import { AppMode } from "./core/AppMode.js";
import { InputMap, Action } from "./controls/InputMap.js";
import { FollowCamera } from "./camera/FollowCamera.js";
import { StaminaSystem } from "./gameplay/player/StaminaSystem.js";
import { ResourceBar } from "./gameplay/player/ResourceBar.js";
import { PlayerController } from "./gameplay/player/PlayerController.js";
import { AbilitySystem } from "./gameplay/player/AbilitySystem.js";
import { ABILITY_SLOT_IDS, getAbilityDefinitions } from "./gameplay/player/AbilityDefinitions.js";
import {
  buildMinimapViewModel,
  createMinimapState,
  discoverHearthlightMarker,
  serializeMinimapState,
  updateMinimapFromPlayer,
  worldToChunkPosition
} from "./gameplay/minimap/index.js";
import { DummyEnemy } from "./gameplay/enemies/DummyEnemy.js";
import { BOSS_MAX_HP } from "./gameplay/enemies/BossController.js";
import { CombatSystem } from "./gameplay/combat/CombatSystem.js";
import { EmberOrb } from "./world/EmberOrb.js";
import { BossHUD } from "./ui/BossHUD.js";
import { LoginScreen } from "./ui/LoginScreen.js";
import { CharacterCreation } from "./ui/CharacterCreation.js";
import { authService, deriveStats } from "./net/AuthService.js";
import { runState } from "./progression/RunState.js";
import { AudioManager } from "./audio/AudioManager.js";
import { MusicManager } from "./audio/MusicManager.js";
import {
  MUSIC_TRACK_DEFINITIONS,
  getMusicTrackDefinition,
  resolveMusicTrack
} from "./audio/MusicRegistry.js";
import { OptionsMenu } from "./ui/OptionsMenu.js";
import { ResourceScatter } from "./world/resources/ResourceScatter.js";
import { GatheringSystem } from "./gameplay/gathering/GatheringSystem.js";
import { Inventory } from "./gameplay/items/Inventory.js";
import { getItemDefinition } from "./gameplay/items/ItemDefinitions.js";
import { CraftingSystem } from "./gameplay/crafting/CraftingSystem.js";
import { buildCraftingRecipeViews, describeCraftingResult } from "./gameplay/crafting/CraftingViewModel.js";
import { InventoryUI } from "./ui/InventoryUI.js";
import { CraftingMenu } from "./ui/CraftingMenu.js";
import { Hotbar } from "./ui/Hotbar.js";
import { AbilityMenu } from "./ui/AbilityMenu.js";
import { Minimap } from "./ui/Minimap.js";
import { Letterbox } from "./ui/Letterbox.js";
import { SubtitleLine } from "./ui/SubtitleLine.js";
import { QuestLogUI } from "./ui/QuestLogUI.js";
import {
  BOSS_INTRO_PLAYED_FLAG,
  CinematicPlayer,
  FIRST_SHARD_ABSORBED_FLAG,
  HEARTHMERE_REACHED_FLAG,
  OPENING_ASHFALL_ROAD_FLAG,
  createBossIntroFlag,
  createHollowboundBossIntroSequence,
  createOpeningAshfallRoadSequence
} from "./cinematic/index.js";
import { EnemySpawner } from "./gameplay/enemies/EnemySpawner.js";
import { rollLoot } from "./gameplay/enemies/LootResolver.js";
import { mulberry32 } from "./world/gen/Rng.js";
import { NpcSpawner } from "./gameplay/npc/NpcSpawner.js";
import { DialogueUI } from "./ui/DialogueUI.js";
import { DialogueEngine } from "./gameplay/dialogue/DialogueEngine.js";
import { getDialogueTree } from "./gameplay/dialogue/DialogueDefinitions.js";
import { createCharacterWorldSeed } from "./gameplay/characters/CharacterRules.js";
import {
  ACT1_EVENTS,
  ACT1_FLAGS,
  ACT1_HOLLOWBOUND_GUARD_BOSS_ID,
  ACT1_HOLLOWBOUND_GUARD_BOSS_NAME,
  ACT1_MAIN_QUEST_ID,
  createAct1Progression,
  hasAct1Flag,
  isAct1WorldMapUnlocked,
  isHollowboundGuardDefeatEvent,
  reduceAct1Event,
  serializeAct1Progression
} from "./gameplay/story/Act1Progression.js";
import {
  HEARTHMERE_QUEST_EFFECTS,
  QUEST_EVENT_TYPES,
  addClaimedQuestRewardIds,
  buildQuestLogView,
  buildQuestObjectiveView,
  createQuestLog,
  detectNewlyCompletedQuestRewards,
  deserializeQuestLog,
  getClaimedQuestRewardIds,
  listCompletedUnclaimedQuestRewards,
  reduceQuestEvent,
  serializeQuestLog
} from "./gameplay/quests/index.js";

// ── Boot setup ────────────────────────────────────────────────────────────────

const sceneRoot = getRequiredElement("#scene-root");
const appRoot = getRequiredElement("#app");
const bootStatus = document.querySelector("#boot-status");
const uiBus = new UIBus();
const ctx = new GameContext();

const cleanups = [];
let isDisposed = false;
let embers = 0;
let loadedUser = null;
let loadedChar = null;
let loadedStats = null;
let hasEmittedCharacterLoaded = false;
let hasBootStarted = false;

const EMPTY_PLACEMENT_SOURCE = Object.freeze({
  getPlacementsForChunk: () => Object.freeze([])
});
const BOSS_INTRO_MUSIC_WINDOW_MS = 1400;

// Bridge GameContext → UIBus
ctx.onTransition((from, to) => {
  uiBus.emit("mode:changed", { from, to });
  if (ctx.isControlLocked()) uiBus.emit("controls:locked", {});
  else uiBus.emit("controls:unlocked", {});
});

uiBus.on("boot:ready", ({ message }) => setBootStatus(message, true));
uiBus.on("boot:error", ({ message }) => setBootStatus(message, false));

window.addEventListener("beforeunload", teardown, { once: true });
getWebpackHotContext()?.dispose(teardown);

function emitCharacterLoadedOnce(character) {
  if (!character || hasEmittedCharacterLoaded) return;

  hasEmittedCharacterLoaded = true;
  uiBus.emit("character:loaded", {
    name: character.characterName,
    level: character.level,
    className: character.className,
  });
}

function bootWithCharacter(result) {
  if (!result?.character) {
    if (result?.user) {
      showCharacterCreation(result.user);
      return;
    }

    setBootStatus("No character was selected.", false);
    return;
  }

  if (hasBootStarted) return;
  hasBootStarted = true;
  loadedUser = result.user ?? loadedUser;
  loadedChar = result.character;
  loadedStats = result.stats ?? deriveStats(result.character);
  emitCharacterLoadedOnce(result.character);
  void boot();
}

function showCharacterCreation(user) {
  loadedUser = user ?? loadedUser;
  if (!loadedUser?.userId) {
    setBootStatus("Could not load account details for character creation.", false);
    return;
  }

  setBootStatus("Create a character to enter Ashfall Road.", false);

  let characterCreation = null;
  const handleCreated = (result) => {
    if (!result || result.ok === false || !result.character) return result;

    characterCreation?.dispose?.();
    bootWithCharacter({
      user: loadedUser,
      character: result.character,
      stats: result.stats
    });
    return result;
  };

  characterCreation = new CharacterCreation(appRoot, {
    user: loadedUser,
    authService,
    createCharacter: async (characterOptions) => {
      const result = await authService.createCharacter({
        userId: loadedUser.userId,
        ...characterOptions
      });
      return handleCreated(result);
    },
    onCreate: async (characterOptions) => {
      const result = await authService.createCharacter({
        userId: loadedUser.userId,
        ...characterOptions
      });
      return handleCreated(result);
    },
    onSubmit: async (characterOptions) => {
      const result = await authService.createCharacter({
        userId: loadedUser.userId,
        ...characterOptions
      });
      return handleCreated(result);
    },
    onCreated: handleCreated,
    onSuccess: handleCreated
  });

  addCleanup(() => {
    characterCreation?.dispose?.();
  });
}

// ── Phase 3: login gate ───────────────────────────────────────────────────────
// Try to resume a session silently; if that fails, show the login screen.
void (async () => {
  setBootStatus("Checking session…", false);
  const resumed = await authService.tryResume();

  if (resumed?.ok) {
    if (resumed.needsCharacterCreation || !resumed.character) {
      showCharacterCreation(resumed.user);
      return;
    }

    bootWithCharacter(resumed);
  } else {
    // Show login screen — boot is called from its onSuccess callback
    const loginScreen = new LoginScreen(appRoot, (result) => {
      if (result?.needsCharacterCreation || !result?.character) {
        showCharacterCreation(result?.user);
        return;
      }

      bootWithCharacter(result);
    });
    addCleanup(() => {
      loginScreen.dispose();
    });
  }
})();

// ── Boot ──────────────────────────────────────────────────────────────────────

async function boot() {
  try {
    setBootStatus("Initialising physics…", false);
    const rapier = await initRapier();
    if (!addCleanup(() => { rapier.world.free(); })) return;

    setBootStatus("Creating renderer…", false);
    const renderer = createRenderer(sceneRoot);
    if (!addCleanup(() => { renderer.dispose(); renderer.domElement.remove(); })) return;

    setBootStatus(USE_AUTHORED_MAP ? "Loading authored map…" : "Loading world…", false);
    const authoredMapSource = USE_AUTHORED_MAP ? new AuthoredMapSource() : null;
    const biomeSource = authoredMapSource;
    const heightSource = authoredMapSource;

    const scene = createScene();
    addCleanup(() => { disposeSceneGraph(scene); scene.clear(); });
    const sceneBiomeAtmosphere = getSceneBiomeAtmosphere(scene);

    const { camera, target: initialTarget } = createCamera(sceneRoot);
    const savedRunState = loadedChar ? runState.load(loadedChar.characterId) : null;
    const runtimeWorldSeed = loadedChar
      ? (Number.isFinite(savedRunState?.worldSeed)
          ? savedRunState.worldSeed
          : createCharacterWorldSeed(loadedChar))
      : WORLD_SEED_DEFAULT;
    if (loadedChar) {
      runState.saveWorldSeed(loadedChar.characterId, runtimeWorldSeed);
    }
    const defeatedBossIds = new Set(savedRunState?.bossSnapshot?.defeatedBossIds ?? []);
    const cinematicFlags = new Set(savedRunState?.cinematicSnapshot?.playedFlags ?? []);
    let act1Progression = createAct1Progression(savedRunState?.storySnapshot);
    let chunkManager = null;
    let player = null;
    let activeHearthlight = null;
    const groundAt = (x, z) => chunkManager?.sampleHeight(x, z) ?? authoredMapSource?.heightAt?.(x, z) ?? 0;
    const hasCinematicFlag = (flagId) => cinematicFlags.has(flagId);
    const serializeCinematicFlags = () => ({
      playedFlags: [...cinematicFlags].sort()
    });
    const persistCinematicFlags = () => {
      if (!loadedChar) return;
      runState.saveCinematicSnapshot(loadedChar.characterId, serializeCinematicFlags());
    };
    const markCinematicFlag = (flagId) => {
      const normalized = typeof flagId === "string" ? flagId.trim() : "";
      if (!normalized || cinematicFlags.has(normalized)) return;

      cinematicFlags.add(normalized);
      persistCinematicFlags();
    };
    const persistBossSnapshot = () => {
      if (loadedChar) {
        runState.saveBossSnapshot(loadedChar.characterId, {
          defeatedBossIds: [...defeatedBossIds].sort()
        });
      }
    };

    // ── Procedural world (W-01/W-03) / Authored registry (WM-06) ─────────
    const prefabRegistry = authoredMapSource
      ? new AuthoredPrefabRegistry({
          regionRegistry: authoredMapSource.regionRegistry,
          heightSource: authoredMapSource
        })
      : new PrefabRegistry(runtimeWorldSeed, { biomeSource, heightSource });
    const prefabLoader = new PrefabLoader(scene, rapier, prefabRegistry, {
      onHearthlightRest: (hearthlight) => {
        activeHearthlight = hearthlight ?? null;
        ctx.transition(AppMode.Menu);
        uiBus.emit("hearthlight:opened", {});
      },
      groundAt,
      isBossDefeated: (bossId) => defeatedBossIds.has(bossId),
      bossArenaCallbacks: {
        onArmed: () => {
          uiBus.emit("world:prompt", { message: "The crypt stirs..." });
        },
        onEntered: (bossEvent) => {
          handleBossArenaEntered(bossEvent);
        },
        onHpChanged: (bossHp, max, phase) => {
          uiBus.emit("boss:hpChanged", { current: bossHp, max, phase });
        },
        onPhaseChanged: (phase, boss) => {
          uiBus.emit("boss:phaseChanged", {
            current: Math.round((boss?.hpRatio ?? 1) * BOSS_MAX_HP),
            max: BOSS_MAX_HP,
            phase,
          });
          uiBus.emit("boss:hpChanged", {
            current: Math.round((boss?.hpRatio ?? 1) * BOSS_MAX_HP),
            max: BOSS_MAX_HP,
            phase,
          });
        },
        onAttack: (_type, damage) => {
          if (damage > 0) player?.takeDamage(damage);
        },
        onStaggered: () => {
          uiBus.emit("boss:staggered", {});
        },
        onBossDied: (emberReward, bossEvent = {}) => {
          const bossId = bossEvent.bossId ?? bossEvent.id ?? bossEvent.arenaId ?? null;
          const bossName = bossEvent.bossName ?? bossEvent.name ?? "Unknown Boss";
          if (bossId && defeatedBossIds.has(bossId)) {
            return;
          }

          if (bossId) {
            defeatedBossIds.add(bossId);
            persistBossSnapshot();
          }

          embers += emberReward;
          uiBus.emit("embers:changed", { amount: embers });
          uiBus.emit("boss:defeated", {
            bossId,
            arenaId: bossEvent.arenaId ?? bossId,
            encounterId: bossEvent.encounterId ?? bossId,
            name: bossName,
            bossName
          });
        }
      }
    });
    addCleanup(() => { prefabLoader.dispose(); });

    // ── Resources + Gathering (W-04) ────────────────────────────────────
    const resourceScatter = new ResourceScatter({
      worldSeed: runtimeWorldSeed,
      biomeMap: biomeSource,
      prefabSource: prefabRegistry
    });

    // ── Inventory (W-05) ─────────────────────────────────────────────────
    const inventory = new Inventory();
    const gatheringSystem = new GatheringSystem({
      scene,
      rapier,
      resourceScatter,
      placementSource: authoredMapSource,
      canAcceptHarvest: ({ itemId, count }) => {
        let canAccept = false;
        try {
          canAccept = Inventory.fromJSON(inventory.toJSON()).addItem(itemId, count);
        } catch {
          canAccept = false;
        }

        if (!canAccept) {
          uiBus.emit("inventory:full", { itemId, count });
        }
        return canAccept;
      },
      uiBus
    });

    chunkManager = new ChunkManager(scene, rapier, runtimeWorldSeed, {
      biomeSource,
      heightSource,
      prefabSource: prefabRegistry,
      prefabLoader,
      gatheringSystem
    });

    // ── Wandering enemies (W-07) ─────────────────────────────────────────
    const enemySpawner = new EnemySpawner({
      scene,
      worldSeed: runtimeWorldSeed,
      biomeMap: biomeSource,
      placementSource: authoredMapSource,
      uiBus,
    });
    chunkManager.enemySpawner = enemySpawner;

    // ── NPC spawner (W-09) ───────────────────────────────────────────────
    const npcSpawner = new NpcSpawner({
      scene,
      placementSource: authoredMapSource ?? EMPTY_PLACEMENT_SOURCE,
      uiBus,
      heightAt: (x, z) => authoredMapSource?.heightAt(x, z) ?? chunkManager.sampleHeight(x, z),
    });
    chunkManager.npcSpawner = npcSpawner;

    const authoredSpawn = resolveAuthoredSpawnPoint({
      authoredMapSource,
      heightAt: groundAt
    });
    chunkManager.ensureSpawnArea(authoredSpawn.x, authoredSpawn.z, 1); // solid ground under the spawn before the loop
    addCleanup(() => { chunkManager.dispose(); });
    addCleanup(() => { gatheringSystem.dispose(); });
    addCleanup(() => { enemySpawner.dispose(); });
    addCleanup(() => { npcSpawner.dispose(); });
    sceneBiomeAtmosphere?.applyBiome(chunkManager.sampleAtmosphereBiome(authoredSpawn.x, authoredSpawn.z));

    // ── Input ────────────────────────────────────────────────────────────
    const input = new InputMap();
    addCleanup(() => { input.dispose(); });

    // ── Camera ───────────────────────────────────────────────────────────
    const followCam = new FollowCamera(camera, renderer.domElement);
    addCleanup(() => { followCam.dispose(); });

    // ── Cutscenes (W-13) ─────────────────────────────────────────────────
    const cinematicPlayer = new CinematicPlayer({ gameContext: ctx, uiBus });
    let pendingBossIntroEvent = null;
    let pendingBossIntroRevealed = false;

    const emitBossEntered = (bossEvent = {}) => {
      const name = bossEvent.name ?? bossEvent.bossName ?? "Unknown Boss";
      uiBus.emit("boss:entered", { ...bossEvent, name, bossName: bossEvent.bossName ?? name });
    };

    const revealPendingBossIntro = () => {
      if (!pendingBossIntroEvent) return;

      emitBossEntered(pendingBossIntroEvent);
      pendingBossIntroRevealed = true;
    };

    const createCameraAnchor = (position, target, fov = camera.fov) => ({
      position: { x: position.x, y: position.y, z: position.z },
      target: { x: target.x, y: target.y, z: target.z },
      fov
    });

    const createCurrentCameraAnchor = () => createCameraAnchor(
      camera.position,
      {
        x: player?.position?.x ?? authoredSpawn.x,
        y: (player?.position?.y ?? authoredSpawn.y) + 1.1,
        z: player?.position?.z ?? authoredSpawn.z
      }
    );

    const createOpeningCameraAnchors = () => {
      const target = {
        x: authoredSpawn.x,
        y: authoredSpawn.y + 1.2,
        z: authoredSpawn.z - 6
      };

      return {
        cameraFrom: createCameraAnchor(
          { x: authoredSpawn.x + 12, y: authoredSpawn.y + 7, z: authoredSpawn.z + 16 },
          target
        ),
        cameraTo: createCameraAnchor(
          { x: authoredSpawn.x + 5, y: authoredSpawn.y + 4.4, z: authoredSpawn.z + 7 },
          { x: authoredSpawn.x, y: authoredSpawn.y + 1.1, z: authoredSpawn.z - 10 }
        )
      };
    };

    const createBossCameraAnchors = () => {
      const arena = prefabLoader.getActiveBossArena?.() ?? null;
      const bossPosition = arena?.bossPosition ?? player?.position ?? authoredSpawn;
      const playerPosition = player?.position ?? authoredSpawn;
      const toBoss = new THREE.Vector3(
        bossPosition.x - playerPosition.x,
        0,
        bossPosition.z - playerPosition.z
      );
      if (toBoss.lengthSq() < 0.001) {
        toBoss.set(0, 0, -1);
      } else {
        toBoss.normalize();
      }
      const side = new THREE.Vector3(-toBoss.z, 0, toBoss.x);
      const bossTarget = {
        x: bossPosition.x,
        y: bossPosition.y + 1.35,
        z: bossPosition.z
      };

      return {
        cameraFrom: createCurrentCameraAnchor(),
        cameraTo: createCameraAnchor(
          {
            x: bossPosition.x - toBoss.x * 7 + side.x * 3,
            y: bossPosition.y + 3.2,
            z: bossPosition.z - toBoss.z * 7 + side.z * 3
          },
          bossTarget,
          54
        )
      };
    };

    const playOpeningCinematic = () => {
      if (hasCinematicFlag(OPENING_ASHFALL_ROAD_FLAG) || ctx.mode !== AppMode.Exploration) return;

      cinematicPlayer.play(createOpeningAshfallRoadSequence(createOpeningCameraAnchors()));
    };

    function handleBossArenaEntered(bossEvent = {}) {
      const bossName = bossEvent.name ?? bossEvent.bossName ?? "Hollowbound Caravan Guard";
      const bossId = bossEvent.bossId ?? bossEvent.id ?? bossEvent.arenaId ?? bossName;
      const flagId = createBossIntroFlag(bossId);

      if (hasCinematicFlag(flagId) || cinematicPlayer.isPlaying || ctx.mode !== AppMode.Exploration) {
        emitBossEntered({ ...bossEvent, name: bossName, bossName });
        return;
      }

      pendingBossIntroEvent = { ...bossEvent, name: bossName, bossName };
      pendingBossIntroRevealed = false;
      markCinematicFlag(BOSS_INTRO_PLAYED_FLAG);
      markCinematicFlag(flagId);
      cinematicPlayer.play(createHollowboundBossIntroSequence({
        bossId,
        bossName,
        subtitle: "Last shield of the Ashfall Road",
        ...createBossCameraAnchors()
      }));
    }

    const readPoint = (value, fallback = { x: 0, y: 0, z: 0 }) => ({
      x: Number.isFinite(value?.x) ? value.x : fallback.x,
      y: Number.isFinite(value?.y) ? value.y : fallback.y,
      z: Number.isFinite(value?.z) ? value.z : fallback.z
    });

    const resolveCameraAnchor = (anchor, fallback) => {
      const source = anchor && typeof anchor === "object" ? anchor : {};
      const fallbackPoint = readPoint(fallback?.position, camera.position);
      const position = readPoint(source.position ?? source, fallbackPoint);
      const target = readPoint(source.target, readPoint(fallback?.target, {
        x: player?.position?.x ?? authoredSpawn.x,
        y: (player?.position?.y ?? authoredSpawn.y) + 1.1,
        z: player?.position?.z ?? authoredSpawn.z
      }));
      const fov = Number.isFinite(source.fov) ? source.fov : fallback?.fov;

      return { position, target, fov };
    };

    const interpolatePoint = (from, to, progress) => ({
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress,
      z: from.z + (to.z - from.z) * progress
    });

    const easeCinematicProgress = (progress, easing) => {
      const t = Math.max(0, Math.min(1, progress));
      return easing === "ease-in-out" ? t * t * (3 - 2 * t) : t;
    };

    uiBus.on("cinematic:cameraPan", (payload = {}) => {
      if (payload.phase === "cleanup" || payload.active === false) {
        followCam.clearOverride();
        return;
      }

      const from = resolveCameraAnchor(payload.from, createCurrentCameraAnchor());
      const to = resolveCameraAnchor(payload.to, from);
      const progress = easeCinematicProgress(payload.progress ?? 0, payload.easing);
      const fov = Number.isFinite(from.fov) && Number.isFinite(to.fov)
        ? from.fov + (to.fov - from.fov) * progress
        : undefined;

      followCam.setOverridePose({
        position: interpolatePoint(from.position, to.position, progress),
        target: interpolatePoint(from.target, to.target, progress),
        fov
      });
    });

    uiBus.on("cinematic:subtitle", (payload = {}) => {
      if (payload.clear || payload.phase === "cleanup" || payload.phase === "end") {
        uiBus.emit("subtitle:hide", {});
        return;
      }

      if (payload.text) {
        uiBus.emit("subtitle:show", {
          text: payload.text,
          position: payload.position === "lower-third" ? "lower" : payload.position
        });
      }
    });

    uiBus.on("cinematic:bossReveal", (payload = {}) => {
      if (payload.phase === "start" && payload.visible !== false) {
        revealPendingBossIntro();
      }
    });

    uiBus.on("cinematic:setFlag", (payload = {}) => {
      if (payload.phase === "start") {
        markCinematicFlag(payload.flagId);
        if (payload.flagId === FIRST_SHARD_ABSORBED_FLAG) {
          applyAct1Event({ type: ACT1_EVENTS.SHARD_ABSORBED });
        }
        if (payload.flagId === HEARTHMERE_REACHED_FLAG) {
          applyAct1Event({ type: ACT1_EVENTS.HEARTHMERE_REACHED });
        }
      }
    });

    uiBus.on("cinematic:ended", (payload = {}) => {
      if (pendingBossIntroEvent && !pendingBossIntroRevealed) {
        revealPendingBossIntro();
      }

      if (payload.id === OPENING_ASHFALL_ROAD_FLAG) {
        applyAct1Event({ type: ACT1_EVENTS.OPENING_COMPLETED });
      }

      pendingBossIntroEvent = null;
      pendingBossIntroRevealed = false;
      followCam.clearOverride();
    });

    // ── Player resources — use backend-derived stats if available ─────────
    const stats = loadedStats;
    const stamina = new StaminaSystem({
      max: stats?.maxStamina ?? 100,
      regenRate: 30,
      regenDelay: 1.0,
    });
    const hp = new ResourceBar(stats?.maxHp ?? 120);
    const fp = new ResourceBar(stats?.maxFp ?? 60);
    const abilitySystem = new AbilitySystem({ fp });

    // ── Player ───────────────────────────────────────────────────────────
    player = new PlayerController(
      scene,
      rapier,
      {
        onHpChanged: (cur, max) => uiBus.emit("player:hpChanged", { current: cur, max }),
        onFpChanged: (cur, max) => uiBus.emit("player:fpChanged", { current: cur, max }),
        onStaminaChanged: (cur, max) => uiBus.emit("player:staminaChanged", { current: cur, max }),
        onDied: (pos) => {
          uiBus.emit("player:died", { position: { x: pos.x, y: pos.y, z: pos.z } });
          uiBus.emit("embers:dropped", { position: { x: pos.x, y: pos.y, z: pos.z } });
          // Drop embers
          embers = 0;
          uiBus.emit("embers:changed", { amount: 0 });
        },
        onRespawned: () => {
          uiBus.emit("player:respawned", {});
        },
        onFlaskUsed: (remaining) => uiBus.emit("player:flaskChanged", { remaining }),
        onDodgeStart: () => uiBus.emit("player:iframesChanged", { active: true }),
        onDodgeEnd: () => uiBus.emit("player:iframesChanged", { active: false }),
      },
      stamina,
      hp,
      fp,
      authoredSpawn,
    );
    addCleanup(() => { player.dispose(); });

    // ── Enemies ──────────────────────────────────────────────────────────
    const enemy = new DummyEnemy(scene, rapier, { x: 0, y: groundAt(0, -4), z: -4 });
    addCleanup(() => { enemy.dispose(); });

    // ── Combat ───────────────────────────────────────────────────────────
    const combat = new CombatSystem(stamina, {
      onAttackHit: ({ damage }) => {
        uiBus.emit("combat:hitLanded", { damage });
      },
      onAttackMiss: () => {
        uiBus.emit("combat:missed", {});
      },
      onEmbersDelta: (delta) => {
        embers += delta;
        uiBus.emit("embers:changed", { amount: embers });
      },
    });

    const craftingSystem = new CraftingSystem({ inventory, hearthlightTier: 1 });
    const getInventorySlots = () => buildInventoryViewSlots(inventory);
    const getCraftingRecipes = () => buildCraftingRecipeViews(craftingSystem);
    const emitInventoryUpdate = () => {
      uiBus.emit("inventory:set", { slots: getInventorySlots() });
    };
    const emitCraftingUpdate = (selectedRecipeId = null) => {
      uiBus.emit("crafting:set", { recipes: getCraftingRecipes(), selectedRecipeId });
    };
    const persistInventory = () => {
      if (loadedChar) {
        runState.saveInventory(loadedChar.characterId, inventory.toJSON());
      }
    };

    if (savedRunState?.resourceSnapshot) {
      gatheringSystem.restoreDepletionSnapshot(savedRunState.resourceSnapshot);
    }

    const persistResourceSnapshot = () => {
      if (loadedChar) {
        runState.saveResourceSnapshot(
          loadedChar.characterId,
          gatheringSystem.serializeDepletionSnapshot()
        );
      }
    };

    let questLog = savedRunState?.questSnapshot
      ? deserializeQuestLog(savedRunState.questSnapshot)
      : createQuestLog();
    let questSnapshotJson = JSON.stringify(serializeQuestLog(questLog));
    let questRewardSnapshot = savedRunState?.questRewardSnapshot ?? null;

    const getQuestRewardIds = () => getClaimedQuestRewardIds(questRewardSnapshot);

    const buildCurrentQuestLogView = () => buildQuestLogView(
      serializeQuestLog(questLog),
      { questRewardSnapshot }
    );

    const emitQuestUpdate = () => {
      const questView = buildQuestObjectiveView(questLog);
      if (questView) {
        uiBus.emit("quest:set", questView);
      } else {
        uiBus.emit("quest:clear", {});
      }
      uiBus.emit("questlog:set", buildCurrentQuestLogView());
    };

    const persistQuestLog = () => {
      if (loadedChar) {
        runState.saveQuestSnapshot(loadedChar.characterId, serializeQuestLog(questLog));
      }
    };

    const persistQuestRewardSnapshot = () => {
      if (loadedChar) {
        runState.saveQuestRewardSnapshot(loadedChar.characterId, questRewardSnapshot);
      }
    };

    const markQuestRewardClaimed = (claim) => {
      questRewardSnapshot = addClaimedQuestRewardIds(questRewardSnapshot, [claim.rewardId]);
      persistQuestRewardSnapshot();
      emitQuestUpdate();
    };

    const applyClaimedCharacter = (claimResult) => {
      const updatedCharacter = claimResult?.character ?? null;
      if (!updatedCharacter) return;

      const previousLevel = loadedChar?.level ?? updatedCharacter.level;
      loadedChar = { ...loadedChar, ...updatedCharacter };
      loadedStats = deriveStats(loadedChar);

      if (claimResult?.awarded && updatedCharacter.level > previousLevel) {
        uiBus.emit("character:levelUp", {
          newLevel: updatedCharacter.level,
          xpTotal: updatedCharacter.xp
        });
      }
    };

    const claimQuestReward = async (claim) => {
      if (!loadedChar || !claim?.questId || !claim?.rewardId) return;
      if (getQuestRewardIds().includes(claim.rewardId)) return;

      if (typeof authService.claimQuestCompletionReward !== "function") {
        console.warn("[Quest] Quest completion reward endpoint is unavailable.");
        uiBus.emit("quest:reward_failed", {
          questId: claim.questId,
          rewardId: claim.rewardId,
          message: "Quest reward persistence is unavailable."
        });
        return;
      }

      try {
        const response = await authService.claimQuestCompletionReward(
          loadedChar.characterId,
          claim.questId
        );
        if (response?.ok === false) {
          throw new Error(response.message ?? "Quest reward claim failed.");
        }

        const claimResult = response?.claim ?? response;
        applyClaimedCharacter(claimResult);
        markQuestRewardClaimed(claim);
        uiBus.emit("quest:reward_claimed", {
          questId: claim.questId,
          rewardId: claim.rewardId,
          awarded: Boolean(claimResult?.awarded),
          rewards: claimResult?.rewards ?? null,
          characterProgression: claimResult?.characterProgression ?? null
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Quest reward claim failed.";
        console.warn("[Quest] Failed to claim quest reward", error);
        uiBus.emit("quest:reward_failed", {
          questId: claim.questId,
          rewardId: claim.rewardId,
          message
        });
      }
    };

    const claimQuestRewards = (claims) => {
      for (const claim of claims) {
        void claimQuestReward(claim);
      }
    };

    const retryCompletedQuestRewards = () => {
      claimQuestRewards(listCompletedUnclaimedQuestRewards({
        questLog,
        claimedRewardIds: getQuestRewardIds()
      }));
    };

    const applyQuestEvent = (event) => {
      const previousQuestLog = questLog;
      const nextQuestLog = reduceQuestEvent(questLog, event);
      const nextSnapshot = serializeQuestLog(nextQuestLog);
      const nextSnapshotJson = JSON.stringify(nextSnapshot);
      if (nextSnapshotJson === questSnapshotJson) {
        return;
      }
      const rewardClaims = detectNewlyCompletedQuestRewards({
        previousQuestLog,
        nextQuestLog: nextSnapshot,
        claimedRewardIds: getQuestRewardIds()
      });

      questLog = nextSnapshot;
      questSnapshotJson = nextSnapshotJson;
      persistQuestLog();
      emitQuestUpdate();
      uiBus.emit("quest:changed", { questLog: nextSnapshot });
      claimQuestRewards(rewardClaims);

      if (event?.type === QUEST_EVENT_TYPES.QUEST_EFFECT && event.effect === HEARTHMERE_QUEST_EFFECTS.ROAD_STANDS_OFFER) {
        applyAct1Event({ type: ACT1_EVENTS.ROAD_QUEST_STARTED });
      }
    };

    let act1SnapshotJson = JSON.stringify(serializeAct1Progression(act1Progression));

    const persistAct1Progression = () => {
      if (!loadedChar) return;

      runState.saveStorySnapshot(
        loadedChar.characterId,
        serializeAct1Progression(act1Progression)
      );
    };

    const emitAct1ProgressionUpdate = (previousProgression, event) => {
      const snapshot = serializeAct1Progression(act1Progression);
      uiBus.emit("story:act1", {
        ...snapshot,
        eventType: typeof event === "string" ? event : event?.type ?? null,
        mainQuestId: ACT1_MAIN_QUEST_ID
      });

      if (!isAct1WorldMapUnlocked(previousProgression) && isAct1WorldMapUnlocked(act1Progression)) {
        uiBus.emit("worldmap:unlocked", {
          questId: ACT1_MAIN_QUEST_ID,
          bossId: ACT1_HOLLOWBOUND_GUARD_BOSS_ID,
          bossName: ACT1_HOLLOWBOUND_GUARD_BOSS_NAME,
          story: snapshot
        });
      }
    };

    const applyAct1Event = (event) => {
      const previousProgression = act1Progression;
      const nextProgression = reduceAct1Event(act1Progression, event);
      const nextSnapshotJson = JSON.stringify(serializeAct1Progression(nextProgression));
      if (nextSnapshotJson === act1SnapshotJson) {
        return;
      }

      act1Progression = nextProgression;
      act1SnapshotJson = nextSnapshotJson;
      persistAct1Progression();
      emitAct1ProgressionUpdate(previousProgression, event);

      const startedRoadQuest = !hasAct1Flag(previousProgression, ACT1_FLAGS.QUEST_ROAD_STARTED)
        && hasAct1Flag(act1Progression, ACT1_FLAGS.QUEST_ROAD_STARTED);
      const eventType = typeof event === "string" ? event : event?.type;
      if (startedRoadQuest && eventType !== ACT1_EVENTS.ROAD_QUEST_STARTED) {
        applyQuestEvent({
          type: QUEST_EVENT_TYPES.QUEST_EFFECT,
          effect: HEARTHMERE_QUEST_EFFECTS.ROAD_STANDS_OFFER
        });
      }
    };

    const reconcileAct1Progression = () => {
      if (hasCinematicFlag(FIRST_SHARD_ABSORBED_FLAG)) {
        applyAct1Event({ type: ACT1_EVENTS.SHARD_ABSORBED });
      }

      if (hasCinematicFlag(HEARTHMERE_REACHED_FLAG)) {
        applyAct1Event({ type: ACT1_EVENTS.HEARTHMERE_REACHED });
      }

      if (hasCinematicFlag(OPENING_ASHFALL_ROAD_FLAG)) {
        applyAct1Event({ type: ACT1_EVENTS.OPENING_COMPLETED });
      }

      if (defeatedBossIds.has(ACT1_HOLLOWBOUND_GUARD_BOSS_ID)) {
        applyQuestEvent({
          type: QUEST_EVENT_TYPES.BOSS_DEFEATED,
          bossId: ACT1_HOLLOWBOUND_GUARD_BOSS_ID,
          bossName: ACT1_HOLLOWBOUND_GUARD_BOSS_NAME
        });
        applyAct1Event({ type: ACT1_EVENTS.BOSS_GUARD_DEFEATED });
      }
    };

    reconcileAct1Progression();

    // ── Abilities + hotbar (W-11) ────────────────────────────────────────
    let abilityCatalog = getAbilityDefinitions();
    let abilityMenuOpen = false;
    let returnToHearthlightAfterAbilityMenu = false;
    let nearbyResourceNodeId = null;
    let nearbyNpcName = null;
    let lastHotbarSnapshot = "";

    const loadAbilityState = async () => {
      const backendCatalog = await safeLoadAbilityCatalog();
      if (backendCatalog.length > 0) {
        abilityCatalog = mergeAbilityCatalog(backendCatalog);
      }

      const unlocked = await safeLoadUnlockedAbilityIds();
      abilitySystem.unlockAbilities(unlocked.abilityIds);

      const savedSlots = normalizeSavedAbilitySlots(savedRunState?.abilityLoadoutSnapshot?.slots);
      if (savedSlots) {
        abilitySystem.loadEquippedSlots(savedSlots);
      }

      autoEquipUnlockedAbilities();
      if (unlocked.ok) {
        persistAbilityLoadoutOnly();
      }
    };

    const safeLoadAbilityCatalog = async () => {
      if (typeof authService.listAbilities !== "function") return [];

      try {
        const abilities = await authService.listAbilities();
        return Array.isArray(abilities) ? abilities : [];
      } catch (error) {
        console.warn("[Abilities] Ability catalog could not be loaded", error);
        return [];
      }
    };

    const safeLoadUnlockedAbilityIds = async () => {
      if (!loadedChar || typeof authService.getCharacterAbilities !== "function") {
        return { ok: false, abilityIds: [] };
      }

      try {
        const abilities = await authService.getCharacterAbilities(loadedChar.characterId);
        return { ok: true, abilityIds: extractAbilityIds(abilities) };
      } catch (error) {
        console.warn("[Abilities] Character unlocks could not be loaded", error);
        return { ok: false, abilityIds: [] };
      }
    };

    const mergeAbilityCatalog = (backendCatalog) => {
      const backendById = new Map(
        backendCatalog
          .filter((ability) => typeof ability?.abilityId === "string")
          .map((ability) => [ability.abilityId, ability])
      );

      return getAbilityDefinitions().map((definition) => ({
        ...(backendById.get(definition.abilityId) ?? {}),
        ...definition
      }));
    };

    const extractAbilityIds = (abilities) => {
      if (!Array.isArray(abilities)) return [];

      return abilities
        .map((ability) => typeof ability?.abilityId === "string" ? ability.abilityId.trim() : "")
        .filter(Boolean);
    };

    const normalizeSavedAbilitySlots = (slots) => {
      if (!slots || typeof slots !== "object") return null;

      const normalized = {};
      for (const [slotKey, abilityId] of Object.entries(slots)) {
        const runtimeSlot = String(slotKey).trim().toUpperCase();
        if (!ABILITY_SLOT_IDS.includes(runtimeSlot)) continue;
        if (typeof abilityId !== "string" || !abilityId.trim()) continue;

        normalized[runtimeSlot] = abilityId.trim();
      }

      return Object.keys(normalized).length > 0 ? normalized : null;
    };

    const autoEquipUnlockedAbilities = () => {
      const slots = abilitySystem.getEquippedSlots();
      const equippedAbilityIds = new Set(Object.values(slots).filter(Boolean));
      const unlockedAbilityIds = abilitySystem.getUnlockedAbilityIds();

      for (const slotKey of ABILITY_SLOT_IDS) {
        if (slots[slotKey]) continue;

        const abilityId = unlockedAbilityIds.find((id) => !equippedAbilityIds.has(id));
        if (!abilityId) continue;

        const result = abilitySystem.equipAbility(slotKey, abilityId);
        if (result.ok) {
          equippedAbilityIds.add(abilityId);
        }
      }
    };

    const getAbilityUnlockCost = (ability) => {
      const powerCost = Math.ceil(Math.max(1, Number(ability?.power ?? 1)) / 2);
      const levelCost = Math.max(0, Number(ability?.requiredLevel ?? 1) - 1) * 3;
      return Math.max(1, powerCost + levelCost);
    };

    const getAbilityEligibility = (ability) => {
      if (!loadedChar) return { ok: false, reason: "No character loaded." };

      const requiredLevel = Number(ability?.requiredLevel ?? 1);
      if (Number(loadedChar.level ?? 1) < requiredLevel) {
        return { ok: false, reason: `Requires level ${requiredLevel}.` };
      }

      const requiredClass = ability?.className;
      if (requiredClass && requiredClass !== loadedChar.className) {
        return { ok: false, reason: `Requires ${requiredClass}.` };
      }

      const requiredAffinity = ability?.affinity;
      if (requiredAffinity && requiredAffinity !== loadedChar.affinity) {
        return { ok: false, reason: `Requires ${requiredAffinity} affinity.` };
      }

      return { ok: true, reason: "" };
    };

    const buildAbilityMenuPayload = (selection = {}) => {
      const selectedAbilityId = typeof selection === "string" ? selection : selection.selectedAbilityId;
      const selectedSlotKey = typeof selection === "object" ? selection.selectedSlotKey : null;
      const catalogById = new Map(abilityCatalog.map((ability) => [ability.abilityId, ability]));
      const abilities = abilitySystem.getAbilityMenuViewModel({ fp }).map((view) => {
        const catalogAbility = catalogById.get(view.abilityId) ?? {};
        const ability = { ...catalogAbility, ...view };
        const eligibility = getAbilityEligibility(ability);
        const unlockCost = getAbilityUnlockCost(ability);

        return {
          ...ability,
          unlockCost,
          unlocked: ability.isUnlocked,
          equippedSlot: ability.slot,
          canUnlock: !ability.isUnlocked && eligibility.ok && embers >= unlockCost,
          notes: eligibility.ok
            ? ability.description
            : eligibility.reason
        };
      });

      return {
        abilities,
        availableEmbers: embers,
        equippedSlots: abilitySystem.getEquippedSlots(),
        selectedAbilityId,
        selectedSlotKey
      };
    };

    const emitAbilityHotbarUpdate = (force = false) => {
      const payload = {
        slots: abilitySystem.getHotbarViewModel({ fp }),
        currentFp: fp.value,
        maxFp: fp.max
      };
      const snapshot = JSON.stringify(payload);
      if (!force && snapshot === lastHotbarSnapshot) return;

      lastHotbarSnapshot = snapshot;
      uiBus.emit("hotbar:set", payload);
    };

    const emitAbilityMenuUpdate = (selection = {}) => {
      if (!abilityMenuOpen) return;

      uiBus.emit("abilitymenu:set", buildAbilityMenuPayload(selection));
    };

    const persistAbilityLoadoutOnly = () => {
      if (!loadedChar) return;

      runState.saveAbilityLoadoutSnapshot(loadedChar.characterId, {
        slots: abilitySystem.getEquippedSlots()
      });
    };

    const persistAbilityRunState = () => {
      if (!loadedChar) return;

      const hearthlight = prefabLoader.getPrimaryHearthlight();
      const fallbackPosition = player?.position ?? authoredSpawn;
      const savePosition = hearthlight?.group?.position ?? fallbackPosition;
      runState.save(loadedChar.characterId, embers, player?.flaskCharges ?? 4, savePosition, {
        inventorySlots: inventory.toJSON(),
        questSnapshot: serializeQuestLog(questLog),
        questRewardSnapshot,
        resourceSnapshot: gatheringSystem.serializeDepletionSnapshot(),
        bossSnapshot: {
          defeatedBossIds: [...defeatedBossIds].sort()
        },
        abilityLoadoutSnapshot: {
          slots: abilitySystem.getEquippedSlots()
        },
        minimapSnapshot: serializeMinimapState(minimapState),
        storySnapshot: serializeAct1Progression(act1Progression)
      });
    };

    const handleAbilityUnlockRequest = async ({ abilityId } = {}) => {
      if (!loadedChar || typeof abilityId !== "string" || !abilityId.trim()) return;

      const ability = abilitySystem.getAbility(abilityId);
      if (!ability) {
        uiBus.emit("ability:unlockFailed", { abilityId, reason: "Unknown ability." });
        return;
      }

      const eligibility = getAbilityEligibility(ability);
      const unlockCost = getAbilityUnlockCost(ability);
      if (!eligibility.ok) {
        uiBus.emit("ability:unlockFailed", { abilityId, reason: eligibility.reason });
        return;
      }

      if (embers < unlockCost) {
        uiBus.emit("ability:unlockFailed", {
          abilityId,
          reason: `${unlockCost - embers} more Embers required.`
        });
        return;
      }

      try {
        await authService.unlockCharacterAbility(loadedChar.characterId, abilityId);
        abilitySystem.unlockAbility(abilityId);
        embers -= unlockCost;
        uiBus.emit("embers:changed", { amount: embers });
        persistAbilityRunState();
        uiBus.emit("ability:unlocked", {
          abilityId,
          message: `${ability.name} unlocked.`
        });
      } catch (error) {
        if (error?.status === 409) {
          abilitySystem.unlockAbility(abilityId);
          persistAbilityRunState();
          uiBus.emit("ability:unlocked", {
            abilityId,
            message: `${ability.name} was already unlocked.`
          });
        } else {
          const message = error?.payload?.message
            || error?.message
            || "Ability unlock failed.";
          uiBus.emit("ability:unlockFailed", { abilityId, reason: message });
        }
      }

      emitAbilityHotbarUpdate(true);
      emitAbilityMenuUpdate({ selectedAbilityId: abilityId });
    };

    const handleAbilityEquipRequest = ({ abilityId, slotKey } = {}) => {
      try {
        const result = abilitySystem.equipAbility(slotKey, abilityId);
        if (!result.ok) {
          uiBus.emit("ability:equipFailed", {
            abilityId,
            slotKey,
            reason: result.reason
          });
          return;
        }

        persistAbilityRunState();
        uiBus.emit("ability:equipped", {
          abilityId,
          slotKey: result.slot,
          message: `${result.ability.name} equipped to ${result.slot}.`
        });
        emitAbilityHotbarUpdate(true);
        emitAbilityMenuUpdate({
          selectedAbilityId: abilityId,
          selectedSlotKey: result.slot
        });
      } catch (error) {
        uiBus.emit("ability:equipFailed", {
          abilityId,
          slotKey,
          reason: error instanceof Error ? error.message : "Ability equip failed."
        });
      }
    };

    const buildAbilityTargets = (activeBossArena) => {
      const targets = [];

      if (activeBossArena?.active && activeBossArena.boss?.isAlive) {
        targets.push({
          position: activeBossArena.bossPosition,
          isAlive: true,
          hit: (damage) => {
            const didHit = activeBossArena.tryHit(
              damage,
              Math.max(1, Math.round(damage * 0.75)),
              player.position,
              999
            );
            return {
              damage: didHit ? damage : 0,
              died: activeBossArena.boss?.isAlive === false
            };
          }
        });
      }

      if (enemy.alive) {
        targets.push(enemy);
      }

      if (typeof enemySpawner.getCombatTargets === "function") {
        targets.push(...enemySpawner.getCombatTargets());
      }

      return targets;
    };

    const tryUseAbilitySlot = (slotKey, activeBossArena) => {
      let result;
      try {
        result = abilitySystem.useSlot(slotKey, {
          fp,
          origin: player.position,
          direction: playerForward,
          targets: buildAbilityTargets(activeBossArena),
          coneDot: -0.25
        });
      } catch (error) {
        uiBus.emit("ability:failed", {
          slotKey,
          reason: error instanceof Error ? error.message : "Ability failed."
        });
        return;
      }

      if (!result.ok) {
        uiBus.emit("ability:failed", {
          slotKey: result.slot,
          abilityId: result.ability?.abilityId ?? null,
          reason: result.reason
        });
        return;
      }

      const embersRewarded = Number(result.application?.embersRewarded ?? 0);
      if (embersRewarded > 0) {
        embers += embersRewarded;
        uiBus.emit("embers:changed", { amount: embers });
      }

      uiBus.emit("player:fpChanged", { current: fp.value, max: fp.max });
      uiBus.emit("ability:used", {
        slotKey: result.slot,
        abilityId: result.ability.abilityId,
        ability: result.ability,
        application: result.application
      });
      emitAbilityHotbarUpdate(true);
      uiBus.emit("ability:activated", {
        slotKey: result.slot,
        abilityId: result.ability.abilityId
      });
      window.setTimeout(() => {
        uiBus.emit("ability:deactivated", {
          slotKey: result.slot,
          abilityId: result.ability.abilityId
        });
      }, 160);
    };

    // ── Minimap + discovered Hearthlight fast travel (W-12) ──────────────
    const HEARTHLIGHT_DISCOVERY_RADIUS = 10;
    let minimapState = createMinimapState(savedRunState?.minimapSnapshot);
    let lastMinimapPayloadJson = "";
    let lastPersistedMinimapJson = JSON.stringify(serializeMinimapState(minimapState));

    const getRuntimeHearthlightEntries = () => (
      typeof prefabLoader.getHearthlights === "function" ? prefabLoader.getHearthlights() : []
    ).filter((entry) => entry.position);

    const discoverHearthlightEntry = (entry) => {
      if (!entry?.position) return;

      minimapState = discoverHearthlightMarker(minimapState, {
        id: entry.id,
        name: entry.name,
        position: entry.position
      });
    };

    const discoverNearbyHearthlights = () => {
      for (const entry of getRuntimeHearthlightEntries()) {
        const dx = player.position.x - entry.position.x;
        const dz = player.position.z - entry.position.z;
        const nearEnough = dx * dx + dz * dz <= HEARTHLIGHT_DISCOVERY_RADIUS * HEARTHLIGHT_DISCOVERY_RADIUS;
        if (entry.hearthlight?.isPlayerNear || nearEnough) {
          discoverHearthlightEntry(entry);
        }
      }
    };

    const updateMinimapStateFromPlayer = () => {
      minimapState = updateMinimapFromPlayer(minimapState, {
        playerPosition: player.position,
        biomeSource: chunkManager,
        exploreRadius: 1
      });
      discoverNearbyHearthlights();
    };

    const getBiomePayloadAt = (worldX, worldZ, fallback = null) => {
      const biome = chunkManager.sampleAtmosphereBiome(worldX, worldZ) ?? fallback;
      if (!biome) return null;

      const id = biome.id ?? biome.key ?? biome.biomeId ?? "";
      const name = biome.label ?? biome.name ?? id;
      return id ? { id, name, label: name } : null;
    };

    const buildMinimapChunkPayloads = (view) => view.chunks
      .filter((chunk) => chunk.explored)
      .map((chunk) => {
        const worldX = (chunk.chunkX + 0.5) * (view.chunkSize ?? CHUNK_SIZE);
        const worldZ = (chunk.chunkZ + 0.5) * (view.chunkSize ?? CHUNK_SIZE);
        const biome = getBiomePayloadAt(worldX, worldZ, view.currentBiome);

        return {
          id: chunk.key,
          chunkX: chunk.chunkX,
          chunkZ: chunk.chunkZ,
          biome,
          biomeId: biome?.id ?? "",
          biomeName: biome?.name ?? ""
        };
      });

    const buildMinimapHearthlightPayload = (marker, discovered = true) => {
      const chunk = worldToChunkPosition(marker.position);
      return {
        id: marker.id,
        type: "hearthlight",
        name: marker.name,
        position: marker.position,
        chunkX: chunk.chunkX,
        chunkZ: chunk.chunkZ,
        discovered
      };
    };

    const buildMinimapPayload = () => {
      const view = buildMinimapViewModel(minimapState, player.position, { radius: 4 });
      const discoveredIds = new Set(minimapState.hearthlights.map((marker) => marker.id));
      const hearthlightsById = new Map();

      for (const marker of view.hearthlights) {
        hearthlightsById.set(marker.id, buildMinimapHearthlightPayload(marker, true));
      }

      for (const entry of getRuntimeHearthlightEntries()) {
        hearthlightsById.set(entry.id, buildMinimapHearthlightPayload(entry, discoveredIds.has(entry.id)));
      }

      return {
        currentBiome: view.currentBiome
          ? { id: view.currentBiome.id, label: view.currentBiome.label, name: view.currentBiome.label }
          : null,
        exploredChunks: buildMinimapChunkPayloads(view),
        player: {
          chunkX: view.center.chunkX,
          chunkZ: view.center.chunkZ
        },
        hearthlights: [...hearthlightsById.values()],
        worldMapUnlocked: isAct1WorldMapUnlocked(act1Progression)
      };
    };

    const persistMinimapSnapshotIfChanged = () => {
      if (!loadedChar) return;

      const snapshot = serializeMinimapState(minimapState);
      const snapshotJson = JSON.stringify(snapshot);
      if (snapshotJson === lastPersistedMinimapJson) return;

      lastPersistedMinimapJson = snapshotJson;
      runState.saveMinimapSnapshot(loadedChar.characterId, snapshot);
    };

    const emitMinimapUpdate = (force = false) => {
      const payload = buildMinimapPayload();
      const payloadJson = JSON.stringify(payload);
      if (!force && payloadJson === lastMinimapPayloadJson) return;

      lastMinimapPayloadJson = payloadJson;
      uiBus.emit("minimap:set", payload);
    };

    const updateMinimap = (force = false) => {
      updateMinimapStateFromPlayer();
      emitMinimapUpdate(force);
      persistMinimapSnapshotIfChanged();
    };

    const handleMinimapFastTravel = ({ hearthlightId, markerId, id } = {}) => {
      if (prefabLoader.getActiveBossArena?.()?.active || ctx.mode !== AppMode.Exploration) {
        uiBus.emit("world:prompt", { message: "Fast travel is unavailable right now." });
        return;
      }

      const targetId = hearthlightId ?? markerId ?? id;
      const marker = minimapState.hearthlights.find((candidate) => candidate.id === targetId);
      if (!marker) return;

      chunkManager.ensureSpawnArea(marker.position.x, marker.position.z, 1);
      player.teleportTo(marker.position);
      followCam.setFollowTarget(player.position);
      followCam.update();
      uiBus.emit("world:prompt", { message: `Travelled to ${marker.name}.` });
      updateMinimap(true);
    };

    // ── Loot drop handler (W-07) ──────────────────────────────────────────
    uiBus.on("enemy:died", ({ enemyId, enemyTypeId, enemyName, lootTable, position }) => {
      applyQuestEvent({
        type: QUEST_EVENT_TYPES.ENEMY_DIED,
        enemyId,
        enemyTypeId,
        enemyName,
        count: 1
      });

      const rng = mulberry32(Math.floor(position.x * 1000 + position.z));
      const granted = rollLoot(lootTable, rng);
      let inventoryChanged = false;

      for (const { itemId, count } of granted) {
        if (!inventory.addItem(itemId, count)) {
          uiBus.emit("inventory:full", { itemId, count });
          continue;
        }

        inventoryChanged = true;
        uiBus.emit("inventory:item_added", { itemId, count });
      }

      if (inventoryChanged) {
        emitInventoryUpdate();
        emitCraftingUpdate();
        persistInventory();
      }
    });

    uiBus.on("gathering:node_nearby", ({ nodeId }) => {
      nearbyResourceNodeId = nodeId ?? "__resource__";
    });

    uiBus.on("gathering:node_left", ({ nodeId }) => {
      if (nearbyResourceNodeId !== null && nodeId !== undefined && nodeId !== nearbyResourceNodeId) {
        return;
      }
      nearbyResourceNodeId = null;
    });

    uiBus.on("gathering:harvested", ({ itemId, count, nodeDef }) => {
      if (!inventory.addItem(itemId, count)) {
        uiBus.emit("inventory:full", { itemId, count });
        return;
      }

      applyQuestEvent({
        type: QUEST_EVENT_TYPES.GATHERING_HARVESTED,
        itemId,
        count,
        nodeDef
      });
      emitInventoryUpdate();
      emitCraftingUpdate();
      persistInventory();
    });

    uiBus.on("gathering:depleted", () => {
      persistResourceSnapshot();
    });

    uiBus.on("hearthlight:crafting", () => {
      uiBus.emit("crafting:open", { recipes: getCraftingRecipes() });
    });

    uiBus.on("hearthlight:abilities", () => {
      returnToHearthlightAfterAbilityMenu = true;
      uiBus.emit("hearthlight:hidden", {});
      uiBus.emit("abilitymenu:open", buildAbilityMenuPayload());
    });

    uiBus.on("ability:unlockRequested", (payload) => {
      void handleAbilityUnlockRequest(payload);
    });

    uiBus.on("ability:equipRequested", (payload) => {
      handleAbilityEquipRequest(payload);
    });

    uiBus.on("ability:activateRequested", ({ slotKey }) => {
      if (ctx.isControlLocked()) return;
      tryUseAbilitySlot(slotKey, prefabLoader.getActiveBossArena?.() ?? null);
    });

    uiBus.on("minimap:fastTravelRequested", (payload) => {
      handleMinimapFastTravel(payload);
    });

    uiBus.on("crafting:requested", ({ recipeId }) => {
      let result;

      try {
        result = craftingSystem.craft(recipeId);
      } catch (error) {
        uiBus.emit("crafting:failed", {
          recipeId: "",
          reason: "invalid_recipe",
          message: error instanceof Error ? error.message : "Crafting request is invalid."
        });
        return;
      }

      const message = describeCraftingResult(result);

      if (!result.ok) {
        uiBus.emit("crafting:failed", {
          recipeId: result.recipeId,
          reason: result.code,
          message,
          result
        });
        return;
      }

      emitInventoryUpdate();
      emitCraftingUpdate(result.recipeId);
      persistInventory();
      uiBus.emit("crafting:crafted", {
        recipeId: result.recipeId,
        message,
        result
      });
    });

    uiBus.on("crafting:crafted", ({ recipeId, result }) => {
      applyQuestEvent({
        type: QUEST_EVENT_TYPES.CRAFTING_CRAFTED,
        recipeId,
        output: result?.produced
      });

      if (recipeId === "hearthlight_hatchet" || result?.produced?.itemId === "hearthlight_hatchet") {
        applyAct1Event({ type: ACT1_EVENTS.TESSA_FORGE_TUTORIAL_COMPLETED });
      }
    });

    uiBus.on("dialogue:effect", ({ effect, npcId }) => {
      applyQuestEvent({
        type: QUEST_EVENT_TYPES.DIALOGUE_EFFECT,
        effect,
        npcId
      });

      if (effect === HEARTHMERE_QUEST_EFFECTS.TESSA_GATHER_OFFER) {
        applyAct1Event({ type: ACT1_EVENTS.TESSA_MET });
      }
      if (effect === HEARTHMERE_QUEST_EFFECTS.ROAD_STANDS_OFFER) {
        applyAct1Event({ type: ACT1_EVENTS.ROAD_QUEST_STARTED });
      }
      if (effect === "story.shard_absorbed_first") {
        applyAct1Event({ type: ACT1_EVENTS.SHARD_ABSORBED });
      }
    });

    // Hearthlight rest action (from menu button)
    uiBus.on("hearthlight:rested", () => {
      const hearthlight = activeHearthlight ?? prefabLoader.getPrimaryHearthlight();
      if (!hearthlight) return;

      player.fullRestore();
      player.setRespawnPoint(hearthlight.group.position);
      enemy.respawn();
      gatheringSystem?.respawnAll();
      abilitySystem.resetCooldowns();
      emitAbilityHotbarUpdate(true);
      const activeHearthlightEntry = getRuntimeHearthlightEntries()
        .find((entry) => entry.hearthlight === hearthlight);
      if (activeHearthlightEntry) {
        discoverHearthlightEntry(activeHearthlightEntry);
      }
      updateMinimap(true);
      const resourceSnapshot = gatheringSystem?.serializeDepletionSnapshot();
      ctx.transition(AppMode.Exploration);
      uiBus.emit("menu:closed", {});
      // Persist run-state
      if (loadedChar) {
        runState.save(loadedChar.characterId, embers, 4, hearthlight.group.position, {
          inventorySlots: inventory.toJSON(),
          resourceSnapshot,
          abilityLoadoutSnapshot: {
            slots: abilitySystem.getEquippedSlots()
          },
          minimapSnapshot: serializeMinimapState(minimapState),
          storySnapshot: serializeAct1Progression(act1Progression)
        });
      }
    });

    // ── Audio ─────────────────────────────────────────────────────────────
    const audio = new AudioManager();
    addCleanup(() => { audio.dispose(); });
    const music = new MusicManager({
      tracks: Object.fromEntries(MUSIC_TRACK_DEFINITIONS.map((track) => [track.id, track])),
      masterVolume: 0.42,
      defaultFadeSeconds: 1.1
    });
    addCleanup(() => { music.dispose(); });
    let currentMusicBiome = chunkManager.sampleAtmosphereBiome(authoredSpawn.x, authoredSpawn.z);
    let currentBossMusicPhase = null;
    let bossMusicActive = false;
    let hearthlightMusicActive = false;
    let musicVictoryUntil = 0;
    let musicUnmadeUntil = 0;
    let bossIntroMusicUntil = 0;

    const updateMusic = (options = {}) => {
      const nowMs = performance.now();
      const musicContext = {
        appMode: ctx.mode,
        biome: currentMusicBiome,
        bossActive: bossMusicActive,
        bossPhase: currentBossMusicPhase,
        bossIntro: nowMs < bossIntroMusicUntil,
        bossVictory: nowMs < musicVictoryUntil,
        hearthlightResting: hearthlightMusicActive,
        unmade: nowMs < musicUnmadeUntil
      };
      const trackId = resolveMusicTrack(musicContext);
      const track = getMusicTrackDefinition(trackId);

      if (!track) return;

      music.setTrack(track, {
        crossfade: options.crossfade ?? 1.1,
        fadeIn: options.fadeIn,
        fadeOut: options.fadeOut,
        restart: options.restart === true
      });
    };

    // Wire audio to key game events
    uiBus.on("mode:changed", ({ to }) => {
      if (to !== AppMode.Menu) {
        hearthlightMusicActive = false;
      }
      updateMusic();
    });
    uiBus.on("hearthlight:opened", () => {
      hearthlightMusicActive = true;
      updateMusic({ crossfade: 0.65 });
    });
    uiBus.on("hearthlight:hidden", () => {
      hearthlightMusicActive = false;
      updateMusic({ crossfade: 0.65 });
    });
    uiBus.on("menu:closed", () => {
      hearthlightMusicActive = false;
      updateMusic({ crossfade: 0.65 });
    });
    uiBus.on("boss:entered", () => {
      bossMusicActive = true;
      currentBossMusicPhase = 1;
      updateMusic({ crossfade: 0.45 });
    });
    uiBus.on("boss:phaseChanged", ({ phase }) => {
      bossMusicActive = true;
      currentBossMusicPhase = phase;
      updateMusic({ crossfade: 0.55 });
    });
    uiBus.on("boss:defeated", () => {
      bossMusicActive = false;
      currentBossMusicPhase = null;
      bossIntroMusicUntil = 0;
      musicVictoryUntil = performance.now() + 3200;
      updateMusic({ crossfade: 0.35, restart: true });
    });
    uiBus.on("player:died", () => {
      bossMusicActive = false;
      currentBossMusicPhase = null;
      bossIntroMusicUntil = 0;
      musicUnmadeUntil = performance.now() + 2200;
      updateMusic({ crossfade: 0.25, restart: true });
    });
    uiBus.on("cinematic:started", () => {
      updateMusic({ crossfade: 0.75 });
    });
    uiBus.on("cinematic:bossReveal", ({ phase, visible }) => {
      if (phase === "start" && visible !== false) {
        bossIntroMusicUntil = Math.max(
          bossIntroMusicUntil,
          performance.now() + BOSS_INTRO_MUSIC_WINDOW_MS
        );
        bossMusicActive = true;
        updateMusic({ crossfade: 0.2, restart: true });
      }
    });
    uiBus.on("cinematic:ended", () => {
      bossIntroMusicUntil = 0;
      updateMusic({ crossfade: 0.75 });
    });
    uiBus.on("combat:hitLanded", () => { audio.play("hit"); });
    uiBus.on("combat:missed", () => { audio.play("swing"); });
    uiBus.on("player:iframesChanged", ({ active }) => { if (active) audio.play("dodge"); });
    uiBus.on("hearthlight:rested", () => { audio.play("hearthlight"); });
    uiBus.on("player:died", () => { audio.play("unmade"); });
    uiBus.on("boss:staggered", () => { audio.play("bossHit"); });
    uiBus.on("boss:phaseChanged", ({ phase }) => { if (phase > 1) audio.play("bossPhase"); });
    uiBus.on("cinematic:audio", ({ soundId, phase }) => {
      if (phase !== "start") return;

      audio.play(soundId === "bossIntro" ? "bossPhase" : soundId);
    });
    uiBus.on("boss:defeated", () => { audio.play("bossDefeat"); });
    uiBus.on("embers:recovered", () => { audio.play("embers"); });
    uiBus.on("boss:defeated", ({ bossId, arenaId, bossName, name }) => {
      const event = {
        type: QUEST_EVENT_TYPES.BOSS_DEFEATED,
        bossId,
        arenaId,
        bossName,
        name
      };

      applyQuestEvent(event);
      if (isHollowboundGuardDefeatEvent(event)) {
        applyAct1Event({ type: ACT1_EVENTS.BOSS_GUARD_DEFEATED });
      }
    });

    // ── Run-state restore ─────────────────────────────────────────────────
    if (loadedChar && savedRunState) {
      embers = savedRunState.embers;
      inventory.fromJSON(savedRunState.inventorySlots);
      uiBus.emit("embers:changed", { amount: embers });
    }

    await loadAbilityState();

    // ── HUD ──────────────────────────────────────────────────────────────
    const hud = new HUD(uiBus);
    addCleanup(() => { hud.dispose(); });
    const letterbox = new Letterbox(uiBus, { mount: appRoot });
    addCleanup(() => { letterbox.dispose(); });
    const subtitleLine = new SubtitleLine(uiBus, { mount: appRoot });
    addCleanup(() => { subtitleLine.dispose(); });
    emitQuestUpdate();

    const minimap = new Minimap(uiBus, { mount: appRoot });
    addCleanup(() => { minimap.dispose(); });
    updateMinimap(true);

    const bossHUD = new BossHUD(uiBus);
    addCleanup(() => { bossHUD.dispose(); });

    const inventoryUI = new InventoryUI(uiBus, { mount: appRoot, slots: getInventorySlots() });
    addCleanup(() => { inventoryUI.dispose(); });

    const craftingMenu = new CraftingMenu(uiBus, { mount: appRoot, recipes: getCraftingRecipes() });
    addCleanup(() => { craftingMenu.dispose(); });

    const hotbar = new Hotbar(uiBus, {
      mount: appRoot,
      slots: abilitySystem.getHotbarViewModel({ fp }),
      currentFp: fp.value,
      maxFp: fp.max
    });
    addCleanup(() => { hotbar.dispose(); });

    const abilityMenu = new AbilityMenu(uiBus, {
      mount: appRoot,
      abilities: buildAbilityMenuPayload().abilities,
      availableEmbers: embers,
      equippedSlots: abilitySystem.getEquippedSlots()
    });
    addCleanup(() => { abilityMenu.dispose(); });
    emitAbilityHotbarUpdate(true);

    const questLogUI = new QuestLogUI(uiBus, { mount: appRoot, view: buildCurrentQuestLogView() });
    addCleanup(() => { questLogUI.dispose(); });
    emitQuestUpdate();
    retryCompletedQuestRewards();

    // ── Dialogue UI (W-09) ────────────────────────────────────────────────
    const dialogueUI = new DialogueUI(uiBus, { mount: appRoot });
    addCleanup(() => { dialogueUI.dispose(); });

    // ── Options menu (Phase 5) ────────────────────────────────────────────
    const optionsMenu = new OptionsMenu(appRoot, [audio, music], () => {
      // On close, return to pause menu if we came from there
      if (ctx.mode === AppMode.Menu) {
        uiBus.emit("pause:opened", {});
      }
    });
    addCleanup(() => { optionsMenu.dispose(); });

    // Enable Options button in pause menu
    const btnOptions = document.getElementById("btn-options");
    if (btnOptions) {
      btnOptions.classList.remove("rf-menu-item--inactive");
      btnOptions.style.pointerEvents = "auto";
      btnOptions.style.opacity = "1";
      btnOptions.addEventListener("click", () => {
        uiBus.emit("menu:closed", {});
        optionsMenu.open();
      });
    }

    // ── Pause menu ───────────────────────────────────────────────────────
    uiBus.on("pause:opened", () => {
      if (ctx.mode === AppMode.Exploration) {
        ctx.transition(AppMode.Menu);
        uiBus.emit("menu:opened", { type: "pause" });
      }
    });
    let inventoryOpen = false;
    let craftingOpen = false;
    let questLogOpen = false;
    let dialogueOpen = false;
    let activeDialogue = null;
    let activeDialogueNpcId = null;

    uiBus.on("inventory:opened", () => {
      if (dialogueOpen) return;
      inventoryOpen = true;
      if (ctx.mode === AppMode.Exploration) {
        ctx.transition(AppMode.Menu);
        uiBus.emit("menu:opened", { type: "inventory" });
      }
    });
    uiBus.on("inventory:closed", () => {
      inventoryOpen = false;
      uiBus.emit("menu:closed", { type: "inventory" });
    });
    uiBus.on("crafting:opened", () => {
      if (dialogueOpen) return;
      craftingOpen = true;
      if (ctx.mode === AppMode.Exploration) {
        ctx.transition(AppMode.Menu);
        uiBus.emit("menu:opened", { type: "crafting" });
      }
    });
    uiBus.on("crafting:closed", () => {
      craftingOpen = false;
    });
    uiBus.on("questlog:opened", () => {
      if (dialogueOpen) {
        uiBus.emit("questlog:close", {});
        return;
      }

      questLogOpen = true;
      if (ctx.mode === AppMode.Exploration) {
        ctx.transition(AppMode.Menu);
        uiBus.emit("menu:opened", { type: "questlog" });
      }
    });
    uiBus.on("questlog:closed", () => {
      questLogOpen = false;
      uiBus.emit("menu:closed", { type: "questlog" });
    });
    uiBus.on("abilitymenu:opened", () => {
      if (dialogueOpen) {
        uiBus.emit("abilitymenu:close", {});
        return;
      }

      abilityMenuOpen = true;
      if (ctx.mode === AppMode.Exploration) {
        ctx.transition(AppMode.Menu);
      }
      uiBus.emit("menu:opened", { type: "abilities" });
    });
    uiBus.on("abilitymenu:closed", () => {
      abilityMenuOpen = false;
      if (returnToHearthlightAfterAbilityMenu && ctx.mode === AppMode.Menu) {
        returnToHearthlightAfterAbilityMenu = false;
        uiBus.emit("hearthlight:opened", {});
        return;
      }

      uiBus.emit("menu:closed", { type: "abilities" });
    });

    // ── Dialogue lifecycle (W-09) ─────────────────────────────────────────
    uiBus.on("npc:interact", ({ npcId, name, dialogueId }) => {
      const tree = getDialogueTree(dialogueId);
      if (!tree) return;
      activeDialogue = new DialogueEngine({ tree });
      activeDialogueNpcId = npcId;
      dialogueOpen = true;
      if (ctx.mode === AppMode.Exploration) ctx.transition(AppMode.Menu);
      const node = activeDialogue.currentNode;
      uiBus.emit("dialogue:open", {
        speaker: node.speaker,
        text: node.text,
        choices: activeDialogue.availableChoices(),
        npcName: name,
      });
    });

    uiBus.on("dialogue:choose", ({ index }) => {
      if (!activeDialogue) return;
      const result = activeDialogue.choose(index);
      if (result.effect) {
        uiBus.emit("dialogue:effect", { effect: result.effect, npcId: activeDialogueNpcId });
      }
      if (result.ended || activeDialogue.isComplete) {
        uiBus.emit("dialogue:close", {});
      } else {
        const node = activeDialogue.currentNode;
        uiBus.emit("dialogue:render", {
          speaker: node.speaker,
          text: node.text,
          choices: activeDialogue.availableChoices(),
        });
      }
    });

    uiBus.on("dialogue:close", () => {
      if (!dialogueOpen) return;
      dialogueOpen = false;
      const endedNpcId = activeDialogueNpcId;
      activeDialogue = null;
      activeDialogueNpcId = null;
      npcSpawner.onDialogueEnded(endedNpcId);
      if (ctx.mode === AppMode.Menu) {
        ctx.transition(AppMode.Exploration);
        uiBus.emit("menu:closed", { type: "dialogue" });
      }
    });

    // If an in-dialogue NPC's chunk unloads, Module 1 emits npc:dialogue_ended
    uiBus.on("npc:dialogue_ended", () => {
      if (dialogueOpen) uiBus.emit("dialogue:close", {});
    });

    // NPC nearby / left → interact prompt
    uiBus.on("npc:nearby", ({ name }) => {
      nearbyNpcName = name ?? "__npc__";
      hud.setInteractPromptVisible(true, `Talk to ${name}`);
    });
    uiBus.on("npc:left", () => {
      nearbyNpcName = null;
      hud.setInteractPromptVisible(false);
    });

    uiBus.on("menu:closed", () => {
      if (dialogueOpen) {
        uiBus.emit("dialogue:close", {});
        return;
      }

      if (craftingOpen) {
        uiBus.emit("crafting:close", {});
        return;
      }

      if (inventoryOpen) {
        uiBus.emit("inventory:close", {});
        return;
      }

      if (questLogOpen) {
        uiBus.emit("questlog:close", {});
        return;
      }

      if (abilityMenuOpen) {
        returnToHearthlightAfterAbilityMenu = false;
        uiBus.emit("abilitymenu:close", {});
        return;
      }

      if (ctx.mode === AppMode.Menu) {
        ctx.transition(AppMode.Exploration);
      }
      activeHearthlight = null;
    });

    // ── Resize ───────────────────────────────────────────────────────────
    const handleResize = () => {
      if (resizeRenderer(renderer, sceneRoot)) {
        updateCameraAspect(camera, sceneRoot);
      }
    };
    window.addEventListener("resize", handleResize);
    addCleanup(() => { window.removeEventListener("resize", handleResize); });

    // ── Ember orb state ───────────────────────────────────────────────────
    let emberOrb = null;

    // Spawn Embers orb when player dies
    uiBus.on("player:died", ({ position }) => {
      emberOrb?.dispose();
      const pos = new THREE.Vector3(position.x, position.y, position.z);
      emberOrb = new EmberOrb(scene, pos, embers);
    });

    // ── Lock-on state ─────────────────────────────────────────────────────
    let lockedOn = false;

    // ── Game loop ─────────────────────────────────────────────────────────
    const playerForward = new THREE.Vector3();
    const playerRight = new THREE.Vector3();
    const camForward = new THREE.Vector3();
    const camRight = new THREE.Vector3();

    const loop = startLoop({
      fixedUpdate: (dt) => {
        rapier.world.step();
        cinematicPlayer.update(dt);
      },
      render: (dt) => {
        let controlLocked = ctx.isControlLocked();
        const interactJustPressed = input.isJustPressed(Action.Interact);
        abilitySystem.update(dt);

        // ── Compute camera-relative axes ─────────────────────────────────
        camera.getWorldDirection(camForward);
        camForward.y = 0;
        if (camForward.lengthSq() > 0.001) camForward.normalize();
        camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0));
        if (camRight.lengthSq() > 0.001) camRight.normalize();

        // Player forward = the mesh's facing direction
        playerForward.set(Math.sin(player.group.rotation.y), 0, Math.cos(player.group.rotation.y));
        playerRight.set(playerForward.z, 0, -playerForward.x);

        let cutsceneSkippedThisFrame = false;
        if (cinematicPlayer.isPlaying && input.isJustPressed(Action.Pause)) {
          cinematicPlayer.skip();
          controlLocked = ctx.isControlLocked();
          cutsceneSkippedThisFrame = true;
        }

        // ── Handle pause ─────────────────────────────────────────────────
        if (!cutsceneSkippedThisFrame && input.isJustPressed(Action.Pause)) {
          if (dialogueOpen) {
            uiBus.emit("dialogue:close", {});
          } else if (abilityMenuOpen) {
            uiBus.emit("abilitymenu:close", {});
          } else if (craftingOpen) {
            uiBus.emit("crafting:close", {});
          } else if (inventoryOpen) {
            uiBus.emit("inventory:close", {});
          } else if (questLogOpen) {
            uiBus.emit("questlog:close", {});
          } else if (ctx.mode === AppMode.Exploration) {
            uiBus.emit("pause:opened", {});
          } else if (ctx.mode === AppMode.Menu) {
            uiBus.emit("menu:closed", {});
          }
        }

        // ── Inventory (W-05) ──────────────────────────────────────────────
        if (input.isJustPressed(Action.Inventory)) {
          if (inventoryOpen) {
            uiBus.emit("inventory:close", {});
          } else if (!dialogueOpen && ctx.mode === AppMode.Exploration) {
            uiBus.emit("inventory:open", { slots: getInventorySlots() });
          }
        }

        // ── Quest log (W-10) ──────────────────────────────────────────────
        if (input.isJustPressed(Action.QuestLog)) {
          if (questLogOpen) {
            uiBus.emit("questlog:close", {});
          } else if (!dialogueOpen && ctx.mode === AppMode.Exploration) {
            uiBus.emit("questlog:open", buildCurrentQuestLogView());
          }
        }

        if (!controlLocked && input.isJustPressed(Action.Minimap)) {
          uiBus.emit("minimap:toggle", {});
        }

        let activeBossArena = prefabLoader.getActiveBossArena?.() ?? null;

        // ── Lock-on toggle ────────────────────────────────────────────────
        if (input.isJustPressed(Action.LockOn) && !controlLocked) {
          lockedOn = !lockedOn;
          const lockTarget = activeBossArena?.active ? activeBossArena.bossPosition : enemy.position;
          if (lockedOn) {
            followCam.setLockOn(lockTarget);
          } else {
            followCam.setLockOn(null);
          }
          uiBus.emit("lockon:changed", { active: lockedOn });
        }
        if (lockedOn) {
          followCam.updateLockOnTarget(activeBossArena?.active ? activeBossArena.bossPosition : enemy.position);
        }

        // ── Player update ─────────────────────────────────────────────────
        player.update(dt, input, camForward, camRight, controlLocked);

        // ── Stream procedural world chunks around the player (W-01) ───────
        chunkManager.update(player.position.x, player.position.z);
        currentMusicBiome = chunkManager.sampleAtmosphereBiome(player.position.x, player.position.z);
        sceneBiomeAtmosphere?.applyBiome(
          currentMusicBiome,
          dt
        );
        updateMusic();

        const interactionTargetAtFrameStart = !controlLocked && (
          prefabLoader.isPlayerNearInteractable()
          || (typeof gatheringSystem.hasInteractable === "function"
            ? gatheringSystem.hasInteractable(player.position, playerForward)
            : nearbyResourceNodeId !== null)
          || (typeof npcSpawner.hasInteractable === "function"
            ? npcSpawner.hasInteractable(player.position, playerForward)
            : nearbyNpcName !== null)
        );

        // ── Authored prefab updates (W-03/W-08 Hearthmere camp + crypt) ──
        prefabLoader.update(
          dt,
          player.position,
          !controlLocked && interactJustPressed,
          { controlLocked, playerHasIframes: player.hasIframes }
        );
        controlLocked = ctx.isControlLocked();
        activeBossArena = prefabLoader.getActiveBossArena?.() ?? null;
        hud.setInteractPromptVisible(prefabLoader.isPlayerNearInteractable() && !controlLocked);
        updateMinimap();

        // ── Combat ────────────────────────────────────────────────────────
        // Exploration: attack the training dummy. Boss arena: attack the boss.
        const combatEnemies = activeBossArena?.active ? [] : [enemy];
        combat.update(dt, input, player.position, playerForward, combatEnemies, controlLocked);

        // Boss combat (in-arena only)
        if (activeBossArena?.active && activeBossArena.boss.isAlive && !controlLocked) {
          if (input.isJustPressed(Action.LightAttack)) {
            activeBossArena.tryHit(22, 0, player.position);
          }
          if (input.isJustPressed(Action.HeavyAttack)) {
            activeBossArena.tryHit(48, 40, player.position);
          }
        }

        // ── Enemy update (training dummy) ─────────────────────────────────
        if (!controlLocked) {
          enemy.update(dt);
        }

        // Simple proximity damage from the training dummy
        if (!controlLocked && enemy.alive) {
          const dx = player.position.x - enemy.position.x;
          const dz = player.position.z - enemy.position.z;
          if (dx * dx + dz * dz < 1.8 * 1.8) {
            // 5 damage per second when standing on the dummy
            player.takeDamage(5 * dt);
          }
        }

        // ── Embers orb pickup ─────────────────────────────────────────────
        if (emberOrb && !emberOrb.collected) {
          if (emberOrb.update(dt, player.position)) {
            embers += emberOrb.amount;
            uiBus.emit("embers:changed", { amount: embers });
            uiBus.emit("embers:recovered", { amount: emberOrb.amount });
            emberOrb = null;
          }
        }

        // ── Gathering (W-04) ──────────────────────────────────────────────
        if (!controlLocked) {
          gatheringSystem.update(player.position, playerForward, input);
        }

        // ── NPC proximity + interact (W-09) ───────────────────────────────
        if (!controlLocked) {
          npcSpawner.update(dt, player.position, playerForward, input);
        }

        // ── Abilities + hotbar (W-11) ────────────────────────────────────
        if (!controlLocked) {
          if (input.isJustPressed(Action.AbilityQ)) {
            tryUseAbilitySlot("Q", activeBossArena);
          }

          if (input.isJustPressed(Action.AbilityR)) {
            tryUseAbilitySlot("R", activeBossArena);
          }

          const interactHasPriority = interactionTargetAtFrameStart
            || prefabLoader.isPlayerNearInteractable()
            || nearbyResourceNodeId !== null
            || nearbyNpcName !== null;
          if (input.isJustPressed(Action.AbilityE) && !interactHasPriority) {
            tryUseAbilitySlot("E", activeBossArena);
          }
        }
        emitAbilityHotbarUpdate();

        // ── Wandering enemies (W-07) ──────────────────────────────────────
        if (!controlLocked) {
          enemySpawner.update(dt, player);
        }

        // -- HUD dodge phase cue ------------------------------------------
        hud.setIFrameIndicator(player.hasIframes);
        hud.updateGhost(dt);

        // ── Camera follow ─────────────────────────────────────────────────
        followCam.setFollowTarget(player.position);
        followCam.update();

        // ── Flush input (end of frame) ────────────────────────────────────
        input.flush();
        renderer.render(scene, camera);
      },
    });
    if (!addCleanup(() => { loop.stop(); })) return;

    // Transition to Exploration and signal ready
    ctx.transition(AppMode.Exploration);
    uiBus.emit("boot:ready", {
      message: "Ashfall Road  ·  Clear the Hollowborn  ·  Face the Caravan Guard",
    });
    updateMusic({ fadeIn: 1.2, crossfade: 1.2 });
    playOpeningCinematic();
    void initialTarget; // camera target is used by FollowCamera internally
  } catch (err) {
    if (isDisposed) return;
    const msg = err instanceof Error ? err.message : "Unknown boot error";
    uiBus.emit("boot:error", { message: msg });
  }
}

// ── Teardown ──────────────────────────────────────────────────────────────────

function teardown() {
  if (isDisposed) return;
  isDisposed = true;
  window.removeEventListener("beforeunload", teardown);
  let fn = cleanups.pop();
  while (fn) {
    fn();
    fn = cleanups.pop();
  }
  uiBus.clear();
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function addCleanup(fn) {
  if (isDisposed) {
    fn();
    return false;
  }
  cleanups.push(fn);
  return true;
}

function getWebpackHotContext() {
  return typeof module === "undefined" ? undefined : module.hot;
}

function getRequiredElement(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Missing required element: ${selector}`);
  return el;
}

function setBootStatus(message, ready) {
  if (!bootStatus) return;
  bootStatus.textContent = message;
  bootStatus.dataset.ready = String(ready);
}

function buildInventoryViewSlots(inventory) {
  return inventory.getSlots().map((slot) => {
    if (!slot.itemId) return slot;

    const definition = getItemDefinition(slot.itemId);
    if (!definition) return slot;

    return {
      ...slot,
      name: definition.name,
      category: titleCase(definition.category),
      rarity: titleCase(definition.rarity),
      description: definition.description,
      flavor: definition.flavorText
    };
  });
}

function titleCase(value) {
  if (typeof value !== "string" || value.length === 0) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function disposeSceneGraph(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    if (Array.isArray(obj.material)) {
      for (const m of obj.material) m.dispose();
    } else {
      obj.material?.dispose();
    }
  });
}

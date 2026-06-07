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
import { USE_AUTHORED_MAP, WORLD_SEED_DEFAULT } from "./world/gen/WorldConfig.js";
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
import { DummyEnemy } from "./gameplay/enemies/DummyEnemy.js";
import { BOSS_MAX_HP } from "./gameplay/enemies/BossController.js";
import { CombatSystem } from "./gameplay/combat/CombatSystem.js";
import { EmberOrb } from "./world/EmberOrb.js";
import { BossHUD } from "./ui/BossHUD.js";
import { LoginScreen } from "./ui/LoginScreen.js";
import { authService, deriveStats } from "./net/AuthService.js";
import { runState } from "./progression/RunState.js";
import { AudioManager } from "./audio/AudioManager.js";
import { OptionsMenu } from "./ui/OptionsMenu.js";
import { ResourceScatter } from "./world/resources/ResourceScatter.js";
import { GatheringSystem } from "./gameplay/gathering/GatheringSystem.js";
import { Inventory } from "./gameplay/items/Inventory.js";
import { getItemDefinition } from "./gameplay/items/ItemDefinitions.js";
import { CraftingSystem } from "./gameplay/crafting/CraftingSystem.js";
import { buildCraftingRecipeViews, describeCraftingResult } from "./gameplay/crafting/CraftingViewModel.js";
import { InventoryUI } from "./ui/InventoryUI.js";
import { CraftingMenu } from "./ui/CraftingMenu.js";
import { QuestLogUI } from "./ui/QuestLogUI.js";
import { EnemySpawner } from "./gameplay/enemies/EnemySpawner.js";
import { rollLoot } from "./gameplay/enemies/LootResolver.js";
import { mulberry32 } from "./world/gen/Rng.js";
import { NpcSpawner } from "./gameplay/npc/NpcSpawner.js";
import { DialogueUI } from "./ui/DialogueUI.js";
import { DialogueEngine } from "./gameplay/dialogue/DialogueEngine.js";
import { getDialogueTree } from "./gameplay/dialogue/DialogueDefinitions.js";
import {
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
let loadedChar = null;
let loadedStats = null;

const EMPTY_PLACEMENT_SOURCE = Object.freeze({
  getPlacementsForChunk: () => Object.freeze([])
});

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

// ── Phase 3: login gate ───────────────────────────────────────────────────────
// Try to resume a session silently; if that fails, show the login screen.
void (async () => {
  setBootStatus("Checking session…", false);
  const resumed = await authService.tryResume();

  if (resumed?.ok) {
    loadedChar = resumed.character;
    loadedStats = resumed.stats;
    uiBus.emit("character:loaded", {
      name: resumed.character.characterName,
      level: resumed.character.level,
      className: resumed.character.className,
    });
    void boot();
  } else {
    // Show login screen — boot is called from its onSuccess callback
    const loginScreen = new LoginScreen(appRoot, (result) => {
      loadedChar = result.character;
      loadedStats = result.stats;
      uiBus.emit("character:loaded", {
        name: result.character.characterName,
        level: result.character.level,
        className: result.character.className,
      });
      void boot();
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
    const defeatedBossIds = new Set(savedRunState?.bossSnapshot?.defeatedBossIds ?? []);
    let chunkManager = null;
    let player = null;
    const groundAt = (x, z) => chunkManager?.sampleHeight(x, z) ?? authoredMapSource?.heightAt?.(x, z) ?? 0;
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
      : new PrefabRegistry(WORLD_SEED_DEFAULT, { biomeSource, heightSource });
    const prefabLoader = new PrefabLoader(scene, rapier, prefabRegistry, {
      onHearthlightRest: () => {
        ctx.transition(AppMode.Menu);
        uiBus.emit("hearthlight:opened", {});
      },
      groundAt,
      isBossDefeated: (bossId) => defeatedBossIds.has(bossId),
      bossArenaCallbacks: {
        onArmed: () => {
          uiBus.emit("world:prompt", { message: "The crypt stirs..." });
        },
        onEntered: ({ name }) => {
          uiBus.emit("boss:entered", { name });
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

          embers += emberReward;
          uiBus.emit("embers:changed", { amount: embers });
          uiBus.emit("boss:defeated", {
            bossId,
            arenaId: bossEvent.arenaId ?? bossId,
            encounterId: bossEvent.encounterId ?? bossId,
            name: bossName,
            bossName
          });

          if (bossId) {
            defeatedBossIds.add(bossId);
            persistBossSnapshot();
          }

        }
      }
    });
    addCleanup(() => { prefabLoader.dispose(); });

    // ── Resources + Gathering (W-04) ────────────────────────────────────
    const resourceScatter = new ResourceScatter({
      worldSeed: WORLD_SEED_DEFAULT,
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

    chunkManager = new ChunkManager(scene, rapier, WORLD_SEED_DEFAULT, {
      biomeSource,
      heightSource,
      prefabSource: prefabRegistry,
      prefabLoader,
      gatheringSystem
    });

    // ── Wandering enemies (W-07) ─────────────────────────────────────────
    const enemySpawner = new EnemySpawner({
      scene,
      worldSeed: WORLD_SEED_DEFAULT,
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

    // ── Player resources — use backend-derived stats if available ─────────
    const stats = loadedStats;
    const stamina = new StaminaSystem({
      max: stats?.maxStamina ?? 100,
      regenRate: 30,
      regenDelay: 1.0,
    });
    const hp = new ResourceBar(stats?.maxHp ?? 120);
    const fp = new ResourceBar(stats?.maxFp ?? 60);

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
    });

    uiBus.on("dialogue:effect", ({ effect, npcId }) => {
      applyQuestEvent({
        type: QUEST_EVENT_TYPES.DIALOGUE_EFFECT,
        effect,
        npcId
      });
    });

    // Hearthlight rest action (from menu button)
    uiBus.on("hearthlight:rested", () => {
      const hearthlight = prefabLoader.getPrimaryHearthlight();
      if (!hearthlight) return;

      player.fullRestore();
      player.setRespawnPoint(hearthlight.group.position);
      enemy.respawn();
      gatheringSystem?.respawnAll();
      const resourceSnapshot = gatheringSystem?.serializeDepletionSnapshot();
      ctx.transition(AppMode.Exploration);
      uiBus.emit("menu:closed", {});
      // Persist run-state
      if (loadedChar) {
        runState.save(loadedChar.characterId, embers, 4, hearthlight.group.position, {
          inventorySlots: inventory.toJSON(),
          resourceSnapshot
        });
      }
    });

    // ── Audio ─────────────────────────────────────────────────────────────
    const audio = new AudioManager();
    addCleanup(() => { audio.dispose(); });

    // Wire audio to key game events
    uiBus.on("combat:hitLanded", () => { audio.play("hit"); });
    uiBus.on("combat:missed", () => { audio.play("swing"); });
    uiBus.on("player:iframesChanged", ({ active }) => { if (active) audio.play("dodge"); });
    uiBus.on("hearthlight:rested", () => { audio.play("hearthlight"); });
    uiBus.on("player:died", () => { audio.play("unmade"); });
    uiBus.on("boss:staggered", () => { audio.play("bossHit"); });
    uiBus.on("boss:phaseChanged", ({ phase }) => { if (phase > 1) audio.play("bossPhase"); });
    uiBus.on("boss:defeated", () => { audio.play("bossDefeat"); });
    uiBus.on("embers:recovered", () => { audio.play("embers"); });
    uiBus.on("boss:defeated", ({ bossId, arenaId, bossName, name }) => {
      applyQuestEvent({
        type: QUEST_EVENT_TYPES.BOSS_DEFEATED,
        bossId,
        arenaId,
        bossName,
        name
      });
    });

    // ── Run-state restore ─────────────────────────────────────────────────
    if (loadedChar && savedRunState) {
      embers = savedRunState.embers;
      inventory.fromJSON(savedRunState.inventorySlots);
      uiBus.emit("embers:changed", { amount: embers });
    }

    // ── HUD ──────────────────────────────────────────────────────────────
    const hud = new HUD(uiBus);
    addCleanup(() => { hud.dispose(); });
    emitQuestUpdate();

    const bossHUD = new BossHUD(uiBus);
    addCleanup(() => { bossHUD.dispose(); });

    const inventoryUI = new InventoryUI(uiBus, { mount: appRoot, slots: getInventorySlots() });
    addCleanup(() => { inventoryUI.dispose(); });

    const craftingMenu = new CraftingMenu(uiBus, { mount: appRoot, recipes: getCraftingRecipes() });
    addCleanup(() => { craftingMenu.dispose(); });

    const questLogUI = new QuestLogUI(uiBus, { mount: appRoot, view: buildCurrentQuestLogView() });
    addCleanup(() => { questLogUI.dispose(); });
    emitQuestUpdate();
    retryCompletedQuestRewards();

    // ── Dialogue UI (W-09) ────────────────────────────────────────────────
    const dialogueUI = new DialogueUI(uiBus, { mount: appRoot });
    addCleanup(() => { dialogueUI.dispose(); });

    // ── Options menu (Phase 5) ────────────────────────────────────────────
    const optionsMenu = new OptionsMenu(appRoot, audio, () => {
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
      hud.setInteractPromptVisible(true, `Talk to ${name}`);
    });
    uiBus.on("npc:left", () => {
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

      if (ctx.mode === AppMode.Menu) {
        ctx.transition(AppMode.Exploration);
      }
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
      fixedUpdate: () => {
        rapier.world.step();
      },
      render: (dt) => {
        const controlLocked = ctx.isControlLocked();

        // ── Compute camera-relative axes ─────────────────────────────────
        camera.getWorldDirection(camForward);
        camForward.y = 0;
        if (camForward.lengthSq() > 0.001) camForward.normalize();
        camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0));
        if (camRight.lengthSq() > 0.001) camRight.normalize();

        // Player forward = the mesh's facing direction
        playerForward.set(Math.sin(player.group.rotation.y), 0, Math.cos(player.group.rotation.y));
        playerRight.set(playerForward.z, 0, -playerForward.x);

        // ── Handle pause ─────────────────────────────────────────────────
        if (input.isJustPressed(Action.Pause)) {
          if (dialogueOpen) {
            uiBus.emit("dialogue:close", {});
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
        sceneBiomeAtmosphere?.applyBiome(
          chunkManager.sampleAtmosphereBiome(player.position.x, player.position.z),
          dt
        );

        // ── Authored prefab updates (W-03/W-08 Hearthmere camp + crypt) ──
        prefabLoader.update(
          dt,
          player.position,
          !controlLocked && input.isJustPressed(Action.Interact),
          { playerHasIframes: player.hasIframes }
        );
        activeBossArena = prefabLoader.getActiveBossArena?.() ?? null;
        hud.setInteractPromptVisible(prefabLoader.isPlayerNearInteractable() && !controlLocked);

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
        enemy.update(dt);

        // Simple proximity damage from the training dummy
        if (enemy.alive) {
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

        // ── Wandering enemies (W-07) ──────────────────────────────────────
        enemySpawner.update(dt, player);

        // ── HUD i-frame indicator ─────────────────────────────────────────
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

import "./styles.css";
import * as THREE from "three";
import { createCamera, updateCameraAspect } from "./engine/createCamera.js";
import { createRenderer, resizeRenderer } from "./engine/createRenderer.js";
import { createScene, getSceneBiomeAtmosphere } from "./engine/createScene.js";
import { startLoop } from "./engine/startLoop.js";
import { initRapier } from "./physics/initRapier.js";
import { ChunkManager } from "./world/chunk/ChunkManager.js";
import { BiomeMap } from "./world/gen/BiomeMap.js";
import { WORLD_SEED_DEFAULT } from "./world/gen/WorldConfig.js";
import { PrefabLoader } from "./world/prefab/PrefabLoader.js";
import { PrefabRegistry } from "./world/prefab/PrefabRegistry.js";
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
import { BossController, BOSS_MAX_HP } from "./gameplay/enemies/BossController.js";
import { CombatSystem } from "./gameplay/combat/CombatSystem.js";
import { EmberOrb } from "./world/EmberOrb.js";
import { FogGate } from "./world/FogGate.js";
import { BossHUD } from "./ui/BossHUD.js";
import { LoginScreen } from "./ui/LoginScreen.js";
import { authService } from "./net/AuthService.js";
import { runState } from "./progression/RunState.js";
import { AudioManager } from "./audio/AudioManager.js";
import { OptionsMenu } from "./ui/OptionsMenu.js";
import { ResourceScatter } from "./world/resources/ResourceScatter.js";
import { GatheringSystem } from "./gameplay/gathering/GatheringSystem.js";

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
let bossActive = false;

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

    setBootStatus("Loading biome map…", false);
    const biomeSource = new BiomeMap(WORLD_SEED_DEFAULT);

    const scene = createScene();
    addCleanup(() => { disposeSceneGraph(scene); scene.clear(); });
    const sceneBiomeAtmosphere = getSceneBiomeAtmosphere(scene);

    const { camera, target: initialTarget } = createCamera(sceneRoot);

    // ── Procedural world (W-01/W-03) ─────────────────────────────────────
    const prefabRegistry = new PrefabRegistry(WORLD_SEED_DEFAULT, { biomeSource });
    const prefabLoader = new PrefabLoader(scene, rapier, prefabRegistry, {
      onHearthlightRest: () => {
        ctx.transition(AppMode.Menu);
        uiBus.emit("hearthlight:opened", {});
      }
    });
    addCleanup(() => { prefabLoader.dispose(); });

    const chunkManager = new ChunkManager(scene, rapier, WORLD_SEED_DEFAULT, {
      biomeSource,
      prefabSource: prefabRegistry,
      prefabLoader
    });
    chunkManager.ensureSpawnArea(0, 3, 1); // solid ground under the spawn before the loop
    addCleanup(() => { chunkManager.dispose(); });
    const groundAt = (x, z) => chunkManager.sampleHeight(x, z);

    // ── Resources + Gathering (W-04) ────────────────────────────────────
    const resourceScatter = new ResourceScatter({ worldSeed: WORLD_SEED_DEFAULT, biomeMap: biomeSource });
    const gatheringSystem = new GatheringSystem({
      scene,
      rapier,
      resourceScatter,
      chunkManager,
      uiBus
    });
    // Register gatheringSystem with chunkManager so existing chunks can notify it
    chunkManager.gatheringSystem = gatheringSystem;
    addCleanup(() => { gatheringSystem.dispose(); });
    sceneBiomeAtmosphere?.applyBiome(chunkManager.sampleBiome(0, 3));

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
    const player = new PlayerController(
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
      { x: 0, y: groundAt(0, 3) + 1.5, z: 3 },
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

    // Hearthlight rest action (from menu button)
    uiBus.on("hearthlight:rested", () => {
      const hearthlight = prefabLoader.getPrimaryHearthlight();
      if (!hearthlight) return;

      player.fullRestore();
      player.setRespawnPoint(hearthlight.group.position);
      enemy.respawn();
      gatheringSystem?.respawnAll();
      ctx.transition(AppMode.Exploration);
      uiBus.emit("menu:closed", {});
      // Persist run-state
      if (loadedChar) {
        runState.save(loadedChar.characterId, embers, 4, hearthlight.group.position);
      }
    });

    // ── Fog gate + Boss ───────────────────────────────────────────────────
    const fogGate = new FogGate(scene, { x: 0, y: groundAt(0, -14), z: -14 }, () => {
      bossActive = true;
      uiBus.emit("boss:entered", { name: "Hollowbound Caravan Guard" });
    });
    addCleanup(() => { fogGate.dispose(); });

    const boss = new BossController(
      scene,
      rapier,
      { x: 0, y: groundAt(0, -20), z: -20 },
      {
        onHpChanged: (bossHp, max, phase) => {
          uiBus.emit("boss:hpChanged", { current: bossHp, max, phase });
        },
        onPhaseChanged: (phase) => {
          uiBus.emit("boss:hpChanged", {
            current: Math.round(boss.hpRatio * BOSS_MAX_HP),
            max: BOSS_MAX_HP,
            phase,
          });
        },
        onAttack: (_type, damage) => {
          if (damage > 0) player.takeDamage(damage);
        },
        onStaggered: () => {
          uiBus.emit("boss:staggered", {});
        },
        onDied: (emberReward) => {
          embers += emberReward;
          uiBus.emit("embers:changed", { amount: embers });
          uiBus.emit("boss:defeated", { name: "Hollowbound Caravan Guard" });
          bossActive = false;
          // Persist XP gain to backend
          if (loadedChar) {
            const xpGain = 300;
            const newXp = loadedChar.xp + xpGain;
            const newLvl = loadedChar.level + 1;
            void authService.saveXpGain(loadedChar.characterId, xpGain, loadedChar.xp, newLvl);
            loadedChar = { ...loadedChar, xp: newXp, level: newLvl };
            uiBus.emit("character:levelUp", { newLevel: newLvl, xpTotal: newXp });
          }
        },
      },
    );
    addCleanup(() => { boss.dispose(); });

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
    uiBus.on("boss:hpChanged", ({ phase }) => { if (phase > 1) audio.play("bossPhase"); });
    uiBus.on("boss:defeated", () => { audio.play("bossDefeat"); });
    uiBus.on("embers:recovered", () => { audio.play("embers"); });

    // ── Run-state restore ─────────────────────────────────────────────────
    if (loadedChar) {
      const saved = runState.load(loadedChar.characterId);
      if (saved) {
        embers = saved.embers;
        uiBus.emit("embers:changed", { amount: embers });
      }
    }

    // ── HUD ──────────────────────────────────────────────────────────────
    const hud = new HUD(uiBus);
    addCleanup(() => { hud.dispose(); });

    const bossHUD = new BossHUD(uiBus);
    addCleanup(() => { bossHUD.dispose(); });

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
    uiBus.on("menu:closed", () => {
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
          if (ctx.mode === AppMode.Exploration) {
            uiBus.emit("pause:opened", {});
          } else if (ctx.mode === AppMode.Menu) {
            uiBus.emit("menu:closed", {});
          }
        }

        // ── Lock-on toggle ────────────────────────────────────────────────
        if (input.isJustPressed(Action.LockOn) && !controlLocked) {
          lockedOn = !lockedOn;
          const lockTarget = bossActive ? boss.position : enemy.position;
          if (lockedOn) {
            followCam.setLockOn(lockTarget);
          } else {
            followCam.setLockOn(null);
          }
          uiBus.emit("lockon:changed", { active: lockedOn });
        }
        if (lockedOn) {
          followCam.updateLockOnTarget(bossActive ? boss.position : enemy.position);
        }

        // ── Player update ─────────────────────────────────────────────────
        player.update(dt, input, camForward, camRight, controlLocked);

        // ── Stream procedural world chunks around the player (W-01) ───────
        chunkManager.update(player.position.x, player.position.z);
        sceneBiomeAtmosphere?.applyBiome(
          chunkManager.sampleBiome(player.position.x, player.position.z),
          dt
        );

        // ── Combat ────────────────────────────────────────────────────────
        // Exploration: attack the training dummy. Boss arena: attack the boss.
        const combatEnemies = bossActive ? [] : [enemy];
        combat.update(dt, input, player.position, playerForward, combatEnemies, controlLocked);

        // Boss combat (in-arena only)
        if (bossActive && boss.isAlive && !controlLocked) {
          if (input.isJustPressed(Action.LightAttack)) {
            const toB = new THREE.Vector3().subVectors(boss.position, player.position);
            if (toB.length() < 3.0) boss.hit(22, 0);
          }
          if (input.isJustPressed(Action.HeavyAttack)) {
            const toB = new THREE.Vector3().subVectors(boss.position, player.position);
            if (toB.length() < 3.0) boss.hit(48, 40);
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

        // ── Boss update ───────────────────────────────────────────────────
        if (bossActive) {
          boss.update(dt, player.position, player.hasIframes);
        }

        // ── Fog gate ──────────────────────────────────────────────────────
        if (!bossActive) {
          fogGate.update(player.position);
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

        // ── Authored prefab updates (W-03 Hearthmere camp) ───────────────
        prefabLoader.update(dt, player.position, input.isJustPressed(Action.Interact));
        hud.setInteractPromptVisible(prefabLoader.isPlayerNearInteractable() && !controlLocked);

        // ── Gathering (W-04) ──────────────────────────────────────────────
        if (!controlLocked) {
          gatheringSystem.update(player.position, playerForward, input);
        }

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

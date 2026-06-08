import * as THREE from "three";
import { STATE } from "./WanderingEnemy.js";
import {
  HEARTHMERE_PALETTE,
  addMesh,
  createArtTracker
} from "../../world/art/HearthmereArtKit.js";

// ── Colours by state ──────────────────────────────────────────────────────────

const COLOR_NEUTRAL = 0x886644; // idle / wander — brownish
const COLOR_AGGRO   = 0xcc3322; // chase / attack — red
const COLOR_RETURN  = 0x4488aa; // retreating — blue
const COLOR_DEAD    = 0x333333; // dead — grey

// ── Geometry constants ────────────────────────────────────────────────────────

const SILHOUETTE_TOP_Y = 1.85;

// HP bar dimensions
const HP_BAR_WIDTH  = 0.9;
const HP_BAR_HEIGHT = 0.08;
const HP_BAR_Y      = SILHOUETTE_TOP_Y + 0.25;

// ── WanderingEnemyVisual ──────────────────────────────────────────────────────

/**
 * Three.js dark-fantasy representation of a WanderingEnemy.
 *
 * Owns all Three.js objects; delegates all AI/state logic to the injected
 * `enemy` (WanderingEnemy instance).
 *
 * The spawner/controller owns `enemy.position.y`; the visual preserves that
 * terrain-aligned value when syncing the Three.js group.
 */
export class WanderingEnemyVisual {
  #scene;
  #enemy;
  #artTracker;
  #group;
  #visualRoot;
  #stateMaterials;
  #hpBarFill;
  #hpBarBacking;
  #hpBarBackingWorldPosition;
  #hpBarFillWorldPosition;
  #animationTime;

  /**
   * @param {{ scene: THREE.Scene, enemy: import("./WanderingEnemy.js").WanderingEnemy }} opts
   */
  constructor({ scene, enemy }) {
    this.#scene = scene;
    this.#enemy = enemy;

    this.#artTracker = createArtTracker();
    this.#group = new THREE.Group();
    this.#visualRoot = new THREE.Group();
    this.#visualRoot.name = "hollow-briar-silhouette";
    this.#group.add(this.#visualRoot);
    this.#stateMaterials = [];
    this.#animationTime = 0;
    this.#hpBarBackingWorldPosition = new THREE.Vector3();
    this.#hpBarFillWorldPosition = new THREE.Vector3();

    this._buildSilhouette();

    // ── HP bar — white backing ────────────────────────────────────────────────
    const backGeo = new THREE.PlaneGeometry(HP_BAR_WIDTH, HP_BAR_HEIGHT);
    const backMat = this.#artTracker.trackMaterial(
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    );
    this.#hpBarBacking = addMesh(this.#group, this.#artTracker, backGeo, backMat, {
      position: [0, HP_BAR_Y, 0],
      castShadow: false,
      receiveShadow: false,
      name: "hollow-hp-backing"
    });

    // ── HP bar — red fill (anchored left) ─────────────────────────────────────
    const fillGeo = new THREE.PlaneGeometry(HP_BAR_WIDTH, HP_BAR_HEIGHT);
    const fillMat = this.#artTracker.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xdd1111,
        side: THREE.DoubleSide,
      }),
    );
    // Pivot the fill at its left edge so scale.x shrinks it rightward.
    fillGeo.translate(HP_BAR_WIDTH * 0.5, 0, 0);
    this.#hpBarFill = addMesh(this.#group, this.#artTracker, fillGeo, fillMat, {
      position: [-HP_BAR_WIDTH * 0.5, HP_BAR_Y, 0.001],
      castShadow: false,
      receiveShadow: false,
      name: "hollow-hp-fill"
    });

    scene.add(this.#group);

    // Sync position immediately so there's no one-frame pop.
    this._syncPosition();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Call every frame after the enemy's update() has run.
   * dt drives a subtle idle motion while all AI/state logic stays on the enemy.
   */
  update(dt) {
    if (this.#enemy.isDead) {
      this.#group.visible = false;
      return;
    }

    this.#group.visible = true;
    this._syncPosition();
    this._syncColor();
    this._syncHpBar();
    this._animate(dt);

    // Billboard HP bar to face world +Z; camera-facing work happens at scene level.
    this.#hpBarBacking.lookAt(
      this.#hpBarBacking.getWorldPosition(this.#hpBarBackingWorldPosition).setZ(
        this.#hpBarBackingWorldPosition.z + 1,
      ),
    );
    this.#hpBarFill.lookAt(
      this.#hpBarFill.getWorldPosition(this.#hpBarFillWorldPosition).setZ(
        this.#hpBarFillWorldPosition.z + 1,
      ),
    );
  }

  /** Remove all Three.js objects from the scene and dispose GPU resources. */
  dispose() {
    this.#scene.remove(this.#group);
    this.#artTracker.dispose();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _syncPosition() {
    const ep = this.#enemy.position;
    this.#group.position.set(ep.x, ep.y, ep.z);
  }

  _syncColor() {
    const label = this.#enemy.stateLabel;
    let color;
    switch (label) {
      case STATE.CHASE:
      case STATE.ATTACK:
        color = COLOR_AGGRO;
        break;
      case STATE.RETURN:
        color = COLOR_RETURN;
        break;
      case STATE.DEAD:
        color = COLOR_DEAD;
        break;
      default:
        // idle, wander
        color = COLOR_NEUTRAL;
        break;
    }
    for (const material of this.#stateMaterials) {
      material.color.setHex(color);
      material.emissive.setHex(color);
    }
  }

  _syncHpBar() {
    const ratio = this.#enemy.maxHp > 0
      ? Math.max(0, Math.min(1, this.#enemy.hp / this.#enemy.maxHp))
      : 0;
    this.#hpBarFill.scale.x = ratio;
  }

  _animate(dt) {
    this.#animationTime += dt;
    this.#visualRoot.rotation.y += dt * 0.45;
    const breath = 1 + Math.sin(this.#animationTime * 4.2) * 0.025;
    this.#visualRoot.scale.set(1, breath, 1);
  }

  _buildSilhouette() {
    const soot = this.#artTracker.material({
      color: HEARTHMERE_PALETTE.soot,
      roughness: 0.98,
      metalness: 0.02
    });
    const bark = this.#artTracker.material({
      color: 0x241b16,
      roughness: 0.96,
      metalness: 0.02
    });
    const cloth = this.#artTracker.material({
      color: 0x202329,
      roughness: 0.97,
      metalness: 0.01
    });
    const bone = this.#artTracker.material({
      color: 0x9d927d,
      roughness: 0.78,
      metalness: 0.02
    });
    const stateGlow = this.#artTracker.material({
      color: COLOR_NEUTRAL,
      emissive: COLOR_NEUTRAL,
      emissiveIntensity: 1.25,
      roughness: 0.44,
      metalness: 0.04
    });
    this.#stateMaterials.push(stateGlow);

    addMesh(this.#visualRoot, this.#artTracker, new THREE.ConeGeometry(0.48, 1.2, 7), cloth, {
      position: [0, 0.72, 0],
      rotation: [0.06, 0.22, -0.04],
      scale: [0.95, 1, 0.72],
      name: "ragged-hollow-cloak"
    });

    addMesh(this.#visualRoot, this.#artTracker, new THREE.DodecahedronGeometry(0.34, 0), soot, {
      position: [0.02, 1.04, 0.02],
      rotation: [0.1, -0.2, 0.08],
      scale: [0.82, 1.18, 0.64],
      name: "sunken-hollow-torso"
    });

    addMesh(this.#visualRoot, this.#artTracker, new THREE.SphereGeometry(0.25, 10, 8), soot, {
      position: [-0.02, 1.48, 0.03],
      rotation: [0.04, 0, 0.14],
      scale: [0.92, 1.1, 0.78],
      name: "hooded-hollow-skull"
    });

    addMesh(this.#visualRoot, this.#artTracker, new THREE.BoxGeometry(0.34, 0.18, 0.03), bark, {
      position: [0, 1.47, 0.2],
      rotation: [0.08, 0, 0],
      scale: [1, 1, 1],
      name: "hollow-face-void"
    });

    for (const x of [-0.075, 0.075]) {
      addMesh(this.#visualRoot, this.#artTracker, new THREE.SphereGeometry(0.035, 8, 6), stateGlow, {
        position: [x, 1.5, 0.225],
        scale: [1.25, 0.75, 0.65],
        castShadow: false,
        receiveShadow: false,
        name: "state-lit-hollow-eye"
      });
    }

    const armGeo = new THREE.CylinderGeometry(0.035, 0.07, 0.82, 6);
    addMesh(this.#visualRoot, this.#artTracker, armGeo, bark, {
      position: [-0.38, 0.93, 0.03],
      rotation: [0.28, 0.12, 0.78],
      scale: [1, 1.08, 1],
      name: "left-briar-arm"
    });
    addMesh(this.#visualRoot, this.#artTracker, armGeo.clone(), bark, {
      position: [0.4, 0.9, -0.02],
      rotation: [-0.22, -0.16, -0.84],
      scale: [0.86, 0.98, 0.86],
      name: "right-briar-arm"
    });

    const thornGeo = new THREE.ConeGeometry(0.035, 0.18, 5);
    for (const [x, y, z, rz] of [
      [-0.56, 0.87, 0.05, 0.75],
      [0.58, 0.82, -0.03, -0.8],
      [-0.28, 1.21, 0.08, -0.2],
      [0.24, 1.18, -0.06, 0.34]
    ]) {
      addMesh(this.#visualRoot, this.#artTracker, thornGeo.clone(), bone, {
        position: [x, y, z],
        rotation: [0.28, 0.12, rz],
        receiveShadow: false,
        name: "bone-briar-thorn"
      });
    }

    const antlerGeo = new THREE.CylinderGeometry(0.018, 0.04, 0.46, 5);
    for (const side of [-1, 1]) {
      addMesh(this.#visualRoot, this.#artTracker, antlerGeo.clone(), bark, {
        position: [side * 0.18, 1.72, -0.02],
        rotation: [0.32, side * 0.2, side * -0.56],
        name: "crooked-briar-horn"
      });
    }

    const rootGeo = new THREE.CylinderGeometry(0.03, 0.06, 0.56, 6);
    for (const [x, z, ry] of [
      [-0.24, 0.16, 0.88],
      [0.26, 0.08, -0.78],
      [0.02, -0.22, 0.08]
    ]) {
      addMesh(this.#visualRoot, this.#artTracker, rootGeo.clone(), bark, {
        position: [x, 0.15, z],
        rotation: [Math.PI * 0.5, 0.2, ry],
        scale: [0.88, 1, 0.88],
        name: "dragging-briar-root"
      });
    }

    addMesh(this.#visualRoot, this.#artTracker, new THREE.BoxGeometry(0.09, 0.32, 0.035), stateGlow, {
      position: [0, 1.16, 0.3],
      rotation: [0.12, 0, 0.12],
      scale: [1, 1, 1],
      castShadow: false,
      receiveShadow: false,
      name: "state-lit-hollow-rune"
    });
  }
}

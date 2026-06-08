import { describe, expect, it, jest } from "@jest/globals";
import * as THREE from "three";
import { WanderingEnemyVisual } from "../gameplay/enemies/WanderingEnemyVisual.js";
import { STATE } from "../gameplay/enemies/WanderingEnemy.js";

function makeEnemy(position = { x: 2, y: 7, z: -3 }) {
  return {
    position: { ...position },
    isDead: false,
    stateLabel: STATE.IDLE,
    hp: 20,
    maxHp: 30
  };
}

describe("WanderingEnemyVisual", () => {
  it("preserves the enemy terrain height when syncing the visual group", () => {
    const scene = new THREE.Scene();
    const enemy = makeEnemy();
    const visual = new WanderingEnemyVisual({ scene, enemy });
    const group = scene.children[0];

    expect(enemy.position.y).toBe(7);
    expect(group.position.y).toBe(7);

    enemy.position.y = 5;
    visual.update(0.016);

    expect(enemy.position.y).toBe(5);
    expect(group.position.y).toBe(5);

    visual.dispose();
  });

  it("keeps chase state readable on the Hollow silhouette glow", () => {
    const scene = new THREE.Scene();
    const enemy = makeEnemy();
    const visual = new WanderingEnemyVisual({ scene, enemy });

    enemy.stateLabel = STATE.CHASE;
    visual.update(0.016);

    const eyes = [];
    scene.traverse((child) => {
      if (child.name === "state-lit-hollow-eye") eyes.push(child);
    });

    expect(eyes.length).toBeGreaterThan(0);
    expect(eyes[0].material.color.getHex()).toBe(0xcc3322);
    expect(eyes[0].material.emissive.getHex()).toBe(0xcc3322);

    visual.dispose();
  });

  it("disposes generated Hollow geometry and materials", () => {
    const scene = new THREE.Scene();
    const enemy = makeEnemy();
    const visual = new WanderingEnemyVisual({ scene, enemy });
    const geometries = new Set();
    const materials = new Set();

    scene.traverse((child) => {
      if (!child.isMesh) return;
      geometries.add(child.geometry);
      materials.add(child.material);
    });

    const geometrySpies = [...geometries].map((geometry) => jest.spyOn(geometry, "dispose"));
    const materialSpies = [...materials].map((material) => jest.spyOn(material, "dispose"));

    visual.dispose();

    for (const spy of geometrySpies) expect(spy).toHaveBeenCalledTimes(1);
    for (const spy of materialSpies) expect(spy).toHaveBeenCalledTimes(1);
    expect(scene.children).toHaveLength(0);
  });
});

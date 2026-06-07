import { describe, expect, it } from "@jest/globals";
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
});

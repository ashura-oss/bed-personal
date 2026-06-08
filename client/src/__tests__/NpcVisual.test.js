import * as THREE from "three";
import { describe, expect, it, jest } from "@jest/globals";
import { NpcVisual } from "../gameplay/npc/NpcVisual.js";

function makeNpc(role = "traveller") {
  return {
    definition: {
      role,
      color: 0x446688
    },
    position: { x: 2, y: 0.5, z: -3 },
    facingAngle: Math.PI * 0.25
  };
}

function getVisualGroup(scene) {
  expect(scene.children).toHaveLength(1);
  return scene.children[0];
}

function meshNames(root) {
  const names = [];
  root.traverse((child) => {
    if (child.isMesh) names.push(child.name);
  });
  return names;
}

function collectResources(root) {
  const geometries = new Set();
  const materials = new Set();

  root.traverse((child) => {
    if (!child.isMesh) return;
    geometries.add(child.geometry);
    const materialList = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materialList) materials.add(material);
  });

  return { geometries, materials };
}

describe("NpcVisual", () => {
  it("builds role-specific Hearthmere silhouettes for every authored NPC role", () => {
    const expectedRoleFeature = {
      blacksmith: "blacksmith-leather-apron",
      guard: "guard-round-shield",
      trader: "trader-front-crate",
      wanderer: "wanderer-ragged-cloak",
      scout: "scout-short-bow",
      survivor: "survivor-chest-bandage",
      miner: "miner-cap-lamp",
      traveller: "traveller-backpack"
    };

    for (const [role, featureName] of Object.entries(expectedRoleFeature)) {
      const scene = new THREE.Scene();
      const visual = new NpcVisual({ scene, npc: makeNpc(role) });
      const names = meshNames(getVisualGroup(scene));

      expect(names).toContain("role-colored-torso");
      expect(names).toContain("face-direction-nose");
      expect(names).toContain("talk-marker");
      expect(names).toContain(featureName);

      visual.dispose();
    }
  });

  it("preserves transform sync and marker highlight/bob behavior", () => {
    const scene = new THREE.Scene();
    const npc = makeNpc("guard");
    const visual = new NpcVisual({ scene, npc });
    const group = getVisualGroup(scene);
    const marker = group.getObjectByName("talk-marker");
    const baseMarkerY = marker.position.y;

    expect(group.position.x).toBe(npc.position.x);
    expect(group.position.y).toBe(npc.position.y);
    expect(group.position.z).toBe(npc.position.z);
    expect(group.rotation.y).toBe(npc.facingAngle);

    visual.setHighlighted(true);
    expect(marker.scale.x).toBeCloseTo(1.35);
    expect(marker.material.color.getHex()).toBe(0xffffff);

    npc.position = { x: -1, y: 2, z: 4 };
    npc.facingAngle = -0.5;
    visual.update(0.5);

    expect(group.position.x).toBe(-1);
    expect(group.position.y).toBe(2);
    expect(group.position.z).toBe(4);
    expect(group.rotation.y).toBe(-0.5);
    expect(marker.position.y).not.toBe(baseMarkerY);

    visual.setHighlighted(false);
    expect(marker.scale.x).toBe(1);
    expect(marker.material.color.getHex()).toBe(0xffdd88);

    visual.dispose();
  });

  it("removes itself from the scene and disposes all observed mesh resources", () => {
    const scene = new THREE.Scene();
    const visual = new NpcVisual({ scene, npc: makeNpc("miner") });
    const group = getVisualGroup(scene);
    const { geometries, materials } = collectResources(group);
    const geometryDisposals = [...geometries].map((geometry) => jest.spyOn(geometry, "dispose"));
    const materialDisposals = [...materials].map((material) => jest.spyOn(material, "dispose"));

    visual.dispose();

    expect(scene.children).toHaveLength(0);
    for (const dispose of geometryDisposals) expect(dispose).toHaveBeenCalledTimes(1);
    for (const dispose of materialDisposals) expect(dispose).toHaveBeenCalledTimes(1);
  });
});

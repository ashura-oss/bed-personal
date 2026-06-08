import { describe, expect, it, jest } from "@jest/globals";
import * as THREE from "three";
import { Hearthlight } from "../world/Hearthlight.js";

describe("Hearthlight", () => {
  it("passes the rested Hearthlight instance to the rest callback", () => {
    const scene = new THREE.Scene();
    const onRest = jest.fn();
    const hearthlight = new Hearthlight(scene, { x: 2, y: 0, z: -3 }, { onRest });

    hearthlight.update(0.016, { x: 2, y: 0, z: -3 }, true);

    expect(onRest).toHaveBeenCalledTimes(1);
    expect(onRest).toHaveBeenCalledWith(hearthlight);

    hearthlight.dispose();
  });

  it("preserves proximity and point-light flicker behavior", () => {
    const scene = new THREE.Scene();
    const hearthlight = new Hearthlight(scene, { x: 2, y: 0, z: -3 }, { onRest: jest.fn() });
    const initialIntensity = hearthlight.light.intensity;

    const isNear = hearthlight.update(0.2, { x: 4, y: 0, z: -3 }, false);

    expect(isNear).toBe(true);
    expect(hearthlight.isPlayerNear).toBe(true);
    expect(hearthlight.light.intensity).not.toBe(initialIntensity);

    hearthlight.dispose();
  });

  it("disposes generated shrine geometry and materials", () => {
    const scene = new THREE.Scene();
    const hearthlight = new Hearthlight(scene, { x: 2, y: 0, z: -3 }, { onRest: jest.fn() });
    const geometries = new Set();
    const materials = new Set();

    scene.traverse((child) => {
      if (!child.isMesh) return;
      geometries.add(child.geometry);
      materials.add(child.material);
    });

    const geometrySpies = [...geometries].map((geometry) => jest.spyOn(geometry, "dispose"));
    const materialSpies = [...materials].map((material) => jest.spyOn(material, "dispose"));

    hearthlight.dispose();

    for (const spy of geometrySpies) expect(spy).toHaveBeenCalledTimes(1);
    for (const spy of materialSpies) expect(spy).toHaveBeenCalledTimes(1);
    expect(scene.children).toHaveLength(0);
  });
});

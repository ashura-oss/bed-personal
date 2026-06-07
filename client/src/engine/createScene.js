import {
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  MathUtils,
  Scene
} from "three";
import { normaliseBiome } from "../world/gen/heightField.js";

const ATMOSPHERE_TRANSITION_SPEED = 2.4;

export function createScene() {
  const scene = new Scene();
  scene.background = new Color(0x080b10);
  scene.fog = new FogExp2(0x101016, 0.038);

  // Cool sky / warm ground hemisphere gives a soft ambient gradient (replaces flat ambient).
  const skyFill = new HemisphereLight(0x536175, 0x2a1710, 0.72);
  scene.add(skyFill);

  // Warm key light from high front-right — the only shadow caster (keeps perf in budget).
  const keyLight = new DirectionalLight(0xffce86, 3.1);
  keyLight.position.set(7, 9, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 32;
  keyLight.shadow.camera.left = -12;
  keyLight.shadow.camera.right = 12;
  keyLight.shadow.camera.top = 12;
  keyLight.shadow.camera.bottom = -12;
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);

  // Cool fill/rim from the opposite side adds shape and warm/cool cinematic contrast (no shadow).
  const coolFill = new DirectionalLight(0x5d78a8, 0.95);
  coolFill.position.set(-8, 4, -7);
  scene.add(coolFill);

  const lowRim = new DirectionalLight(0x8b2b18, 0.55);
  lowRim.position.set(0, 2.5, -12);
  scene.add(lowRim);

  scene.userData.biomeAtmosphere = createBiomeAtmosphereController(scene);

  return scene;
}

export function getSceneBiomeAtmosphere(scene) {
  return scene.userData.biomeAtmosphere ?? null;
}

function createBiomeAtmosphereController(scene) {
  const targetBackground = new Color(scene.background);
  const targetFogColor = scene.fog?.isFogExp2 ? scene.fog.color.clone() : new Color(0x101016);

  return {
    applyBiome(rawBiome, dt = 0) {
      const biome = normaliseBiome(rawBiome);
      const blend = dt > 0 ? 1 - Math.exp(-dt * ATMOSPHERE_TRANSITION_SPEED) : 1;

      targetBackground.set(biome.atmosphere.background);
      targetFogColor.set(biome.atmosphere.fogColor);
      scene.background.lerp(targetBackground, blend);

      if (scene.fog?.isFogExp2) {
        scene.fog.color.lerp(targetFogColor, blend);
        scene.fog.density = MathUtils.lerp(scene.fog.density, biome.atmosphere.fogDensity, blend);
      }

      return biome;
    }
  };
}

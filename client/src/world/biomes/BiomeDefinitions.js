/**
 * BiomeDefinitions — authored biome parameters keyed by story region.
 *
 * These are data-only, deterministic inputs for later terrain, fog, audio,
 * resource, and enemy systems. Hearthmere is the default starter biome.
 */

export const STARTER_BIOME_ID = "hearthmere";

const BIOME_DEFINITION_LIST = [
  {
    id: "hearthmere",
    name: "Hearthmere Outpost",
    groundColor: "#4f4733",
    accentColor: "#b78962",
    backgroundColor: "#080706",
    fogColor: "#141009",
    fogDensity: 0.03,
    terrainAmplitude: 4.5,
    terrainBaseHeight: 1.5,
    roughness: 0.95,
    metalness: 0.03,
    musicId: "music.biome.hearthmere",
    resourceTableId: "resources.biome.hearthmere",
    enemyTableId: "enemies.biome.hearthmere"
  },
  {
    id: "ironvale",
    name: "Ironvale",
    groundColor: "#6a6e63",
    accentColor: "#8e7562",
    backgroundColor: "#08090b",
    fogColor: "#0e1014",
    fogDensity: 0.018,
    terrainAmplitude: 6.5,
    terrainBaseHeight: 4.5,
    roughness: 0.92,
    metalness: 0.1,
    musicId: "music.biome.ironvale",
    resourceTableId: "resources.biome.ironvale",
    enemyTableId: "enemies.biome.ironvale"
  },
  {
    id: "blackroot",
    name: "Blackroot Forest",
    groundColor: "#314a33",
    accentColor: "#6b7a45",
    backgroundColor: "#030604",
    fogColor: "#060d08",
    fogDensity: 0.028,
    terrainAmplitude: 7.5,
    terrainBaseHeight: 2.5,
    roughness: 0.98,
    metalness: 0.01,
    musicId: "music.biome.blackroot",
    resourceTableId: "resources.biome.blackroot",
    enemyTableId: "enemies.biome.blackroot"
  },
  {
    id: "sunken_temple",
    name: "Sunken Temple",
    groundColor: "#4a5b4d",
    accentColor: "#8cae8d",
    backgroundColor: "#04070d",
    fogColor: "#080c14",
    fogDensity: 0.032,
    terrainAmplitude: 3.5,
    terrainBaseHeight: -2.5,
    roughness: 0.93,
    metalness: 0.04,
    musicId: "music.biome.sunken_temple",
    resourceTableId: "resources.biome.sunken_temple",
    enemyTableId: "enemies.biome.sunken_temple"
  },
  {
    id: "dragon_coast",
    name: "Dragon Coast",
    groundColor: "#857a61",
    accentColor: "#c79763",
    backgroundColor: "#05070a",
    fogColor: "#0a0c10",
    fogDensity: 0.02,
    terrainAmplitude: 8.5,
    terrainBaseHeight: 0.5,
    roughness: 0.88,
    metalness: 0.08,
    musicId: "music.biome.dragon_coast",
    resourceTableId: "resources.biome.dragon_coast",
    enemyTableId: "enemies.biome.dragon_coast"
  },
  {
    id: "moonspire",
    name: "Moonspire",
    groundColor: "#7a8296",
    accentColor: "#b5bee0",
    backgroundColor: "#07050d",
    fogColor: "#0c0a14",
    fogDensity: 0.022,
    terrainAmplitude: 10,
    terrainBaseHeight: 12,
    roughness: 0.86,
    metalness: 0.12,
    musicId: "music.biome.moonspire",
    resourceTableId: "resources.biome.moonspire",
    enemyTableId: "enemies.biome.moonspire"
  },
  {
    id: "gravehold",
    name: "Gravehold Marsh",
    groundColor: "#514d48",
    accentColor: "#7a7d74",
    backgroundColor: "#050505",
    fogColor: "#0d0d0d",
    fogDensity: 0.03,
    terrainAmplitude: 5,
    terrainBaseHeight: -1,
    roughness: 0.97,
    metalness: 0.02,
    musicId: "music.biome.gravehold",
    resourceTableId: "resources.biome.gravehold",
    enemyTableId: "enemies.biome.gravehold"
  },
  {
    id: "ashen_wastes",
    name: "Ashen Wastes",
    groundColor: "#7d7468",
    accentColor: "#c7ab86",
    backgroundColor: "#080706",
    fogColor: "#141209",
    fogDensity: 0.026,
    terrainAmplitude: 6,
    terrainBaseHeight: 3.5,
    roughness: 0.91,
    metalness: 0.06,
    musicId: "music.biome.ashen_wastes",
    resourceTableId: "resources.biome.ashen_wastes",
    enemyTableId: "enemies.biome.ashen_wastes"
  }
];

export const BIOME_DEFINITIONS = Object.freeze(
  BIOME_DEFINITION_LIST.map((definition) => Object.freeze({ ...definition }))
);

export const BIOME_IDS = Object.freeze(BIOME_DEFINITIONS.map(({ id }) => id));

export const BIOMES_BY_ID = Object.freeze(
  Object.fromEntries(BIOME_DEFINITIONS.map((definition) => [definition.id, definition]))
);

export const STARTER_BIOME = BIOMES_BY_ID[STARTER_BIOME_ID];

export function getBiomeDefinition(id) {
  return BIOMES_BY_ID[id];
}

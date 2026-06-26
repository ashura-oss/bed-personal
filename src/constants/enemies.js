// Enemy and boss definitions used by combat and story progression.
export const ENEMY_DEFINITIONS = [
  {
    enemyId: "enemy_tax_knight",
    name: "Elven Tax Knight",
    regionId: "region_middle_earth",
    level: 1,
    maxHp: 42,
    attackMin: 5,
    attackMax: 10,
    damageRange: {
      min: 5,
      max: 10
    },
    defense: 1,
    xpReward: 18,
    goldReward: 6,
    isBoss: 0
  },
  {
    enemyId: "enemy_road_patrol",
    name: "Road Patrol Lancer",
    regionId: "region_kingsroad",
    level: 1,
    maxHp: 36,
    attackMin: 4,
    attackMax: 9,
    damageRange: {
      min: 4,
      max: 9
    },
    defense: 1,
    xpReward: 16,
    goldReward: 5,
    isBoss: 0
  },
  {
    enemyId: "enemy_orc_raider",
    name: "Broken Tusk Raider",
    regionId: "region_orc_hold",
    level: 2,
    maxHp: 52,
    attackMin: 6,
    attackMax: 12,
    damageRange: {
      min: 6,
      max: 12
    },
    defense: 2,
    xpReward: 22,
    goldReward: 8,
    isBoss: 0
  },
  {
    enemyId: "boss_orc_king",
    name: "Orc King",
    regionId: "region_orc_hold",
    level: 2,
    maxHp: 150,
    attackMin: 9,
    attackMax: 17,
    damageRange: {
      min: 9,
      max: 17
    },
    defense: 3,
    xpReward: 65,
    goldReward: 24,
    isBoss: 1,
    questId: "quest_orc_king_gate"
  },
  {
    enemyId: "enemy_eregion_guard",
    name: "Eregion Court Guard",
    regionId: "region_eregion",
    level: 3,
    maxHp: 68,
    attackMin: 8,
    attackMax: 14,
    damageRange: {
      min: 8,
      max: 14
    },
    defense: 3,
    xpReward: 30,
    goldReward: 10,
    isBoss: 0
  },
  {
    enemyId: "boss_celebrimbor",
    name: "Celebrimbor",
    regionId: "region_eregion",
    level: 3,
    maxHp: 190,
    attackMin: 11,
    attackMax: 20,
    damageRange: {
      min: 11,
      max: 20
    },
    defense: 4,
    xpReward: 85,
    goldReward: 30,
    isBoss: 1,
    questId: "quest_celebrimbor"
  },
  {
    enemyId: "boss_galadriel",
    name: "Galadriel",
    regionId: "region_eregion_road",
    level: 4,
    maxHp: 230,
    attackMin: 13,
    attackMax: 23,
    damageRange: {
      min: 13,
      max: 23
    },
    defense: 5,
    xpReward: 100,
    goldReward: 38,
    isBoss: 1,
    questId: "quest_galadriel_ambush"
  },
  {
    enemyId: "boss_high_king",
    name: "High King",
    regionId: "region_lindon",
    level: 5,
    maxHp: 280,
    attackMin: 16,
    attackMax: 28,
    damageRange: {
      min: 16,
      max: 28
    },
    defense: 6,
    xpReward: 140,
    goldReward: 60,
    isBoss: 1,
    questId: "quest_westhaven_siege"
  }
];

// Find enemy definition by id.
export function findEnemyDefinitionById(enemyId) {
  return ENEMY_DEFINITIONS.find((enemy) => enemy.enemyId === enemyId) || null;
}

// Check whether enemy definition exists.
export function hasEnemyDefinition(enemyId) {
  return findEnemyDefinitionById(enemyId) !== null;
}

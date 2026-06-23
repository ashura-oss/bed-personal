export const ENEMY_DEFINITIONS = Object.freeze([
  Object.freeze({
    enemyId: "enemy_ash_thrall",
    name: "Ash-wracked Thrall",
    regionId: "mordor",
    level: 1,
    maxHp: 30
  }),
  Object.freeze({
    enemyId: "enemy_warg_scout",
    name: "Warg Scout",
    regionId: "mordor",
    level: 1,
    maxHp: 20
  }),
  Object.freeze({
    enemyId: "mordor.boss.first_ring_guardian",
    name: "First Ring Gate Sentinel",
    regionId: "mordor",
    level: 2,
    maxHp: 180,
    questId: "mordor.black_road_reclamation"
  }),
  Object.freeze({
    enemyId: "enemy_black_road_levy",
    name: "Black Road Levy",
    regionId: "region_mordor_ring_gate",
    level: 1,
    maxHp: 35
  }),
  Object.freeze({
    enemyId: "boss_first_ring_guardian",
    name: "Ring Gate Captain",
    regionId: "region_mordor_ring_gate",
    level: 2,
    maxHp: 180,
    questId: "quest_first_ring_guardian"
  })
]);

export function hasEnemyDefinition(enemyId) {
  return ENEMY_DEFINITIONS.some((enemy) => enemy.enemyId === enemyId);
}

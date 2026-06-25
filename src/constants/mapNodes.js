export const MAP_NODE_DEFINITIONS = [
  {
    nodeId: "node_hearthvale_square",
    regionId: "region_middle_earth",
    name: "Hearthvale Square",
    nodeType: "settlement",
    description: "The burned village square where the player begins as a surviving soldier.",
    positionX: 10,
    positionY: 70,
    connectedNodeIds: ["node_tax_road", "node_old_mill"],
    travelDanger: 0,
    transitionEffect: "low smoke and grey village clouds",
    isUnlocked: 1
  },
  {
    nodeId: "node_old_mill",
    regionId: "region_middle_earth",
    name: "Old Mill Cache",
    nodeType: "gathering",
    description: "A hidden supply cache where useful early supplies can be found.",
    positionX: 18,
    positionY: 55,
    connectedNodeIds: ["node_hearthvale_square", "node_tax_road"],
    travelDanger: 1,
    transitionEffect: "dust clouds moving over wheat fields",
    isUnlocked: 1
  },
  {
    nodeId: "node_tax_road",
    regionId: "region_kingsroad",
    name: "Tax Road",
    nodeType: "road",
    description: "A road watched by elven tax patrols and useful for random travel events.",
    positionX: 28,
    positionY: 65,
    connectedNodeIds: ["node_hearthvale_square", "node_old_mill", "node_orc_gate"],
    travelDanger: 2,
    encounterEnemyId: "enemy_road_patrol",
    encounterChance: 100,
    transitionEffect: "dark road clouds crossing the screen",
    isUnlocked: 1
  },
  {
    nodeId: "node_orc_gate",
    regionId: "region_orc_hold",
    name: "Orc King's Gate",
    nodeType: "boss",
    enemyId: "boss_orc_king",
    questId: "quest_orc_king_gate",
    description: "The gate of the hill-fort where the Orc King blocks the westward march.",
    positionX: 42,
    positionY: 48,
    connectedNodeIds: ["node_tax_road", "node_eregion_bridge"],
    travelDanger: 3,
    encounterEnemyId: "enemy_orc_raider",
    encounterChance: 35,
    transitionEffect: "red dust and war smoke",
    isUnlocked: 1
  },
  {
    nodeId: "node_eregion_bridge",
    regionId: "region_eregion",
    name: "Eregion Bridge",
    nodeType: "city_gate",
    description: "The shining bridge into Eregion.",
    positionX: 56,
    positionY: 50,
    connectedNodeIds: ["node_orc_gate", "node_celebrimbor_hall"],
    travelDanger: 3,
    encounterEnemyId: "enemy_eregion_guard",
    encounterChance: 30,
    transitionEffect: "silver mist and white cloud fade",
    isUnlocked: 0
  },
  {
    nodeId: "node_celebrimbor_hall",
    regionId: "region_eregion",
    name: "Celebrimbor's Hall",
    nodeType: "boss",
    enemyId: "boss_celebrimbor",
    questId: "quest_celebrimbor",
    description: "The hall where Celebrimbor guards the first ring.",
    positionX: 64,
    positionY: 42,
    connectedNodeIds: ["node_eregion_bridge", "node_crownfield_camp"],
    travelDanger: 4,
    transitionEffect: "bright forge steam and silver clouds",
    isUnlocked: 0
  },
  {
    nodeId: "node_crownfield_camp",
    regionId: "region_crownfield",
    name: "Crownfield Camp",
    nodeType: "army",
    armyEncounterId: "army_lindon_road",
    description: "The army camp where command mechanics unlock after Eregion.",
    positionX: 70,
    positionY: 61,
    connectedNodeIds: ["node_celebrimbor_hall", "node_galadriel_front"],
    travelDanger: 2,
    transitionEffect: "banner shadows rolling through pale clouds",
    isUnlocked: 0
  },
  {
    nodeId: "node_galadriel_front",
    regionId: "region_eregion_road",
    name: "Galadriel's Front",
    nodeType: "boss",
    enemyId: "boss_galadriel",
    questId: "quest_galadriel_ambush",
    description: "The road front where Galadriel's army confronts mankind before Lindon.",
    positionX: 82,
    positionY: 38,
    connectedNodeIds: ["node_crownfield_camp", "node_lindon_gate"],
    travelDanger: 5,
    transitionEffect: "golden cloud curtains over marching banners",
    isUnlocked: 0
  },
  {
    nodeId: "node_lindon_gate",
    regionId: "region_lindon",
    name: "Lindon Gate",
    nodeType: "siege",
    description: "The sea-wall gate of Lindon's final elven stronghold.",
    positionX: 92,
    positionY: 54,
    connectedNodeIds: ["node_galadriel_front", "node_high_king_throne"],
    travelDanger: 5,
    transitionEffect: "sea fog and white tower silhouettes",
    isUnlocked: 0
  },
  {
    nodeId: "node_high_king_throne",
    regionId: "region_lindon",
    name: "High King's Throne",
    nodeType: "final_boss",
    enemyId: "boss_high_king",
    questId: "quest_westhaven_siege",
    description: "The final throne room where the last ring is held.",
    positionX: 96,
    positionY: 36,
    connectedNodeIds: ["node_lindon_gate"],
    travelDanger: 6,
    transitionEffect: "white clouds closing into a crown-shaped fade",
    isUnlocked: 0
  }
];

export function findMapNodeDefinitionById(nodeId) {
  return MAP_NODE_DEFINITIONS.find((node) => node.nodeId === nodeId) || null;
}

export function findMapNodeDefinitionByEnemyId(enemyId) {
  return MAP_NODE_DEFINITIONS.find((node) => node.enemyId === enemyId) || null;
}

export function hasMapNodeDefinition(nodeId) {
  return findMapNodeDefinitionById(nodeId) !== null;
}

// Region definitions used by map, quest, and region endpoints.
export const REGION_DEFINITIONS = [
  {
    regionId: "region_middle_earth",
    name: "Middle-earth",
    description:
      "A taxed human valley where the rebellion begins after elven tax knights destroy the player's family home.",
    dangerLevel: 1,
    recommendedLevel: 1,
    faction: "Hearthvale Survivors",
    shardName: "Village Oath",
    isUnlocked: 1
  },
  {
    regionId: "region_kingsroad",
    name: "King's Road",
    description:
      "A broken road between human villages, patrol towers, and raider camps where " +
      "travel events can trigger fights or supplies.",
    dangerLevel: 1,
    recommendedLevel: 1,
    faction: "Road Militia",
    shardName: "Road Banner",
    isUnlocked: 1
  },
  {
    regionId: "region_orc_hold",
    name: "Orc Hold",
    description:
      "A ruined hill-fort ruled by an orc king who blocks the first march out of the homeland.",
    dangerLevel: 2,
    recommendedLevel: 2,
    faction: "Broken Tusk Warband",
    shardName: "Orc King's Standard",
    isUnlocked: 1
  },
  {
    regionId: "region_eregion",
    name: "Eregion",
    description:
      "An elven forge-city where ringcraft, court law, and human tribute records are guarded by decorated soldiers.",
    dangerLevel: 3,
    recommendedLevel: 3,
    faction: "Eregion Court",
    shardName: "First Crown Ring",
    isUnlocked: 0
  },
  {
    regionId: "region_crownfield",
    name: "Crownfield",
    description:
      "A liberated plain where mankind crowns its first king and begins commanding armies " +
      "instead of fighting every skirmish alone.",
    dangerLevel: 3,
    recommendedLevel: 3,
    faction: "Army of Mankind",
    shardName: "King's Banner",
    isUnlocked: 0
  },
  {
    regionId: "region_eregion_road",
    name: "Road to Lindon",
    description:
      "A golden road where Galadriel and her army try to stop the human march before it reaches the western coast.",
    dangerLevel: 4,
    recommendedLevel: 4,
    faction: "Galadriel's Army",
    shardName: "Second Crown Ring",
    isUnlocked: 0
  },
  {
    regionId: "region_lindon",
    name: "Lindon",
    description:
      "A coastal elven stronghold of white towers, sea walls, and the final high king's army.",
    dangerLevel: 5,
    recommendedLevel: 5,
    faction: "Lindon Crown",
    shardName: "Last Crown Ring",
    isUnlocked: 0
  }
];

// Find region definition by id.
export function findRegionDefinitionById(regionId) {
  return REGION_DEFINITIONS.find((region) => region.regionId === regionId) || null;
}

// Check whether region definition exists.
export function hasRegionDefinition(regionId) {
  return findRegionDefinitionById(regionId) !== null;
}

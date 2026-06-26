// Faction definitions used by reputation and world state routes.
export const FACTION_DEFINITIONS = [
  {
    factionId: "faction_hearthvale_survivors",
    name: "Hearthvale Survivors",
    description: "Villagers and militia who survived the tax knight attack and form the first rebellion."
  },
  {
    factionId: "faction_road_militia",
    name: "Road Militia",
    description: "Scouts, hunters, and smugglers who know the King's Road between human settlements."
  },
  {
    factionId: "faction_broken_tusk",
    name: "Broken Tusk Warband",
    description: "Orc raiders holding the hill-fort that blocks the first march west."
  },
  {
    factionId: "faction_silver_court",
    name: "Eregion Court",
    description: "Elegant elven rulers, ring-makers, and court soldiers who control Eregion."
  },
  {
    factionId: "faction_army_of_mankind",
    name: "Army of Mankind",
    description: "The unified human army unlocked after the first Crown Ring is taken."
  },
  {
    factionId: "faction_dawn_court",
    name: "Galadriel's Army",
    description: "A golden elven host that tries to stop the human army before Lindon."
  },
  {
    factionId: "faction_westhaven_crown",
    name: "Lindon Crown",
    description: "The final elven crown, High King, and coastal stronghold guarding the last ring."
  }
];

// Find faction definition by id.
export function findFactionDefinitionById(factionId) {
  return FACTION_DEFINITIONS.find((faction) => faction.factionId === factionId) || null;
}

// Check whether faction definition exists.
export function hasFactionDefinition(factionId) {
  return findFactionDefinitionById(factionId) !== null;
}

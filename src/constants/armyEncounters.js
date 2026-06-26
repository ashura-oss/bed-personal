// Army encounter definitions used by army battle routes.
export const ARMY_ENCOUNTER_DEFINITIONS = [
  {
    armyEncounterId: "army_lindon_road",
    name: "Road to Lindon",
    requiredStoryPhase: "king_of_mankind",
    enemyForceName: "Elven Road Host",
    enemyForces: ["frontline", "archers", "cavalry", "commander"],
    enemyPower: 190,
    enemyPowerRange: {
      min: 170,
      max: 215
    },
    moraleReward: 12,
    unlockRegions: ["region_eregion_road"],
    storyPhase: "army_marching_to_lindon",
    revealMarkers: [
      {
        markerId: "marker_galadriel_front",
        regionId: "region_eregion_road",
        markerType: "boss",
        positionX: 82,
        positionY: 38
      }
    ],
    factionChanges: [
      { factionId: "faction_army_of_mankind", reputation: 15, rank: "marching" },
      { factionId: "faction_dawn_court", reputation: -10, rank: "challenged" }
    ]
  }
];

// Find army encounter by id.
export function findArmyEncounterById(armyEncounterId) {
  return (
    ARMY_ENCOUNTER_DEFINITIONS.find(
      (encounter) => encounter.armyEncounterId === armyEncounterId
    ) || null
  );
}

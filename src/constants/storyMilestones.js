export const STORY_MILESTONES = [
  {
    enemyId: "boss_orc_king",
    questId: "quest_orc_king_gate",
    storyPhase: "orc_king_defeated",
    moraleChange: 10,
    commandModeUnlocked: 0,
    unlockRegions: ["region_eregion"],
    revealMarkers: [
      {
        markerId: "marker_eregion_bridge",
        regionId: "region_eregion",
        markerType: "city_gate",
        positionX: 56,
        positionY: 50
      }
    ],
    factionChanges: [
      { factionId: "faction_hearthvale_survivors", reputation: 10, rank: "inspired" },
      { factionId: "faction_broken_tusk", reputation: -10, rank: "broken" }
    ],
    grantItems: [
      { itemId: "item_orc_cleaver", quantity: 1 }
    ]
  },
  {
    enemyId: "boss_celebrimbor",
    questId: "quest_celebrimbor",
    storyPhase: "king_of_mankind",
    moraleChange: 20,
    commandModeUnlocked: 1,
    unlockRegions: ["region_crownfield"],
    unlockArmy: {
      commandRank: "king",
      soldiers: 120,
      archers: 40,
      cavalry: 12,
      morale: 75,
      strategy: "hold"
    },
    grantItems: [
      { itemId: "item_crown_ring_shard", quantity: 1 },
      { itemId: "item_command_banner", quantity: 1 }
    ],
    revealMarkers: [
      {
        markerId: "marker_crownfield_camp",
        regionId: "region_crownfield",
        markerType: "army",
        positionX: 70,
        positionY: 61
      }
    ],
    factionChanges: [
      { factionId: "faction_army_of_mankind", reputation: 25, rank: "king" },
      { factionId: "faction_silver_court", reputation: -20, rank: "defeated" }
    ]
  },
  {
    enemyId: "boss_galadriel",
    questId: "quest_galadriel_ambush",
    storyPhase: "galadriel_defeated",
    moraleChange: 15,
    commandModeUnlocked: 1,
    unlockRegions: ["region_lindon"],
    revealMarkers: [
      {
        markerId: "marker_lindon_gate",
        regionId: "region_lindon",
        markerType: "siege",
        positionX: 92,
        positionY: 54
      }
    ],
    factionChanges: [
      { factionId: "faction_dawn_court", reputation: -25, rank: "routed" },
      { factionId: "faction_army_of_mankind", reputation: 35, rank: "conqueror" }
    ],
    grantItems: [
      { itemId: "item_lindon_spear", quantity: 1 }
    ]
  },
  {
    enemyId: "boss_high_king",
    questId: "quest_westhaven_siege",
    storyPhase: "lindon_conquered",
    moraleChange: 30,
    commandModeUnlocked: 1,
    unlockRegions: [],
    revealMarkers: [
      {
        markerId: "marker_high_king_throne",
        regionId: "region_lindon",
        markerType: "final_boss",
        positionX: 96,
        positionY: 36
      }
    ],
    factionChanges: [
      { factionId: "faction_westhaven_crown", reputation: -50, rank: "fallen" },
      { factionId: "faction_army_of_mankind", reputation: 60, rank: "victorious" }
    ]
  }
];

export function findStoryMilestoneByEnemyId(enemyId) {
  return STORY_MILESTONES.find((milestone) => milestone.enemyId === enemyId) || null;
}

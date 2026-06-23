export const REGION_DEFINITIONS = Object.freeze([
  Object.freeze({
    regionId: "mordor",
    name: "Mordor",
    description:
      "The Black Road, ash camps, shadow beacons, and volcanic war routes that form the first playable region.",
    dangerLevel: 1,
    recommendedLevel: 1,
    faction: "Mordor",
    shardName: "First Ring-Trace",
    isUnlocked: 1
  }),
  Object.freeze({
    regionId: "eregion",
    name: "Eregion",
    description:
      "A locked future campaign front holding ring-lore, smithcraft secrets, and the next march beyond Mordor.",
    dangerLevel: 3,
    recommendedLevel: 2,
    faction: "Eregion Smiths",
    shardName: "Ring-Lore Trace",
    isUnlocked: 0
  }),
  Object.freeze({
    regionId: "adar",
    name: "Adar",
    description:
      "A future unstable front shaped by broken alliances, scattered armies, and contested shadow claims.",
    dangerLevel: 3,
    recommendedLevel: 2,
    faction: "Adar's Host",
    shardName: "Broken Oath Trace",
    isUnlocked: 0
  }),
  Object.freeze({
    regionId: "lindon",
    name: "Lindon",
    description:
      "A future elven coastal front tied to hidden rings, high watchtowers, and guarded light.",
    dangerLevel: 4,
    recommendedLevel: 3,
    faction: "Lindon",
    shardName: "Elven Lord's Ring",
    isUnlocked: 0
  }),
  Object.freeze({
    regionId: "rhovanion",
    name: "Rhovanion",
    description:
      "A future wild-road front of forests, riders, ruins, and old northward paths.",
    dangerLevel: 4,
    recommendedLevel: 3,
    faction: "Wild Roads",
    shardName: "Wilderland Trace",
    isUnlocked: 0
  }),
  Object.freeze({
    regionId: "far_sea",
    name: "Far Sea",
    description:
      "A future distant throne front for sea routes, old grudges, and power beyond the known roads.",
    dangerLevel: 5,
    recommendedLevel: 4,
    faction: "Far Sea",
    shardName: "Distant Throne Trace",
    isUnlocked: 0
  }),
  Object.freeze({
    regionId: "barad_dur",
    name: "Barad-dur",
    description:
      "A future dark-tower front for the long campaign's seat of command.",
    dangerLevel: 5,
    recommendedLevel: 5,
    faction: "Mordor",
    shardName: "Dark Tower Trace",
    isUnlocked: 0
  }),
  Object.freeze({
    regionId: "region_mordor_ring_gate",
    name: "Ring Gate Encampment",
    description:
      "A fortified Mordor starter camp built from siege wagons, broken statues, and repaired stone walls along the Black Road.",
    dangerLevel: 1,
    recommendedLevel: 1,
    faction: "Black Road Host",
    shardName: "Minor Ring-Trace",
    isUnlocked: 1
  }),
  Object.freeze({
    regionId: "region_eregion_gatewatch",
    name: "Eregion Gatewatch",
    description:
      "A westward fortress gate where smith-envoys, scouts, and Mordor levies contest the next road toward Eregion.",
    dangerLevel: 3,
    recommendedLevel: 2,
    faction: "Eregion Gatewatch",
    shardName: "Ring-Lore Writ",
    isUnlocked: 1
  }),
  Object.freeze({
    regionId: "region_western_march",
    name: "Ashen Western March",
    description:
      "A poisoned western march where living paths shift and root-bound sentries hunt Mordor's scouts.",
    dangerLevel: 3,
    recommendedLevel: 2,
    faction: "Western Wardens",
    shardName: "Root-Bound Trace",
    isUnlocked: 1
  }),
  Object.freeze({
    regionId: "region_drowned_ring_vault",
    name: "Drowned Ring-Vault",
    description:
      "The drowned remains of the Temple of Seven Lamps, where sealed archives hide maps and warnings about Eregion's rings.",
    dangerLevel: 4,
    recommendedLevel: 3,
    faction: "Lamp-Vault Keepers",
    shardName: "Drowned Ring Record",
    isUnlocked: 1
  })
]);

export function findRegionDefinitionById(regionId) {
  return REGION_DEFINITIONS.find((region) => region.regionId === regionId) || null;
}

export function hasRegionDefinition(regionId) {
  return findRegionDefinitionById(regionId) !== null;
}

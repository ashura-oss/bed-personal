export const QUEST_DEFINITIONS = Object.freeze([
  Object.freeze({
    questId: "quest_black_road_reclamation",
    regionId: "region_mordor_ring_gate",
    title: "The Black Road Must Open",
    description: "Clear rebels and broken thralls from the Black Road so Mordor's supply march can reach the Ring Gate.",
    questType: "combat",
    requiredLevel: 1,
    difficulty: 1,
    requiredStat: "strength",
    requiredStatValue: 6,
    rewardXp: 30,
    rewardGold: 15,
    successText: "The last ambusher falls, and Mordor's banners advance beneath the ash.",
    failureText: "The rebels scatter into the smoke, leaving the Black Road unsafe for another night."
  }),
  Object.freeze({
    questId: "quest_eregion_gate_dispute",
    regionId: "region_eregion_gatewatch",
    title: "Eregion Gate Dispute",
    description: "Force a decision from the Gatewatch as smith-envoys and road levies argue over who may pass west.",
    questType: "dialogue",
    requiredLevel: 1,
    difficulty: 2,
    requiredStat: "charisma",
    requiredStatValue: 8,
    rewardXp: 35,
    rewardGold: 10,
    successText: "The gate captain relents, and the envoys pass under the westward arch.",
    failureText: "The guards hold their line, and the road levies camp outside the walls."
  }),
  Object.freeze({
    questId: "quest_western_march_scouting",
    regionId: "region_western_march",
    title: "The Ashen Western March",
    description: "Survive poisoned paths that shift around Mordor's western scouts when no one is watching.",
    questType: "exploration",
    requiredLevel: 1,
    difficulty: 2,
    requiredStat: "agility",
    requiredStatValue: 8,
    rewardXp: 35,
    rewardGold: 12,
    successText: "You read the rhythm of the roots and lead the scouts through before the grove can close.",
    failureText: "The path twists back on itself, and the ash maze returns you to where you began."
  }),
  Object.freeze({
    questId: "quest_drowned_ring_record",
    regionId: "region_drowned_ring_vault",
    title: "Drowned Ring Record",
    description: "Recover a damaged ring record from the flooded vaults beneath the old lamp-temple.",
    questType: "lore",
    requiredLevel: 2,
    difficulty: 3,
    requiredStat: "intelligence",
    requiredStatValue: 10,
    rewardXp: 45,
    rewardGold: 18,
    successText: "You surface with a record whose ink reforms into warnings about Eregion's craft.",
    failureText: "The flooded archive shifts, and the ring record sinks deeper into the black water."
  }),
  Object.freeze({
    questId: "quest_first_ring_guardian",
    regionId: "region_mordor_ring_gate",
    title: "Ring Gate Captain",
    description: "Face the ash-bound captain who still bars the Ring Gate after a march that ended in blood.",
    questType: "boss",
    requiredLevel: 2,
    difficulty: 3,
    requiredStat: "endurance",
    requiredStatValue: 10,
    rewardXp: 60,
    rewardGold: 25,
    successText: "The captain kneels as the binding breaks, and the Ring Gate opens to Mordor's march.",
    failureText: "The captain's broken oath drives you back from the gate."
  }),
  Object.freeze({
    questId: "quest_gatewatch_oath_trial",
    regionId: "region_eregion_gatewatch",
    title: "Gatewatch Oath Trial",
    description: "Prove yourself in an Eregion-facing military challenge watched by the road captain.",
    questType: "combat",
    requiredLevel: 2,
    difficulty: 3,
    requiredStat: "strength",
    requiredStatValue: 11,
    rewardXp: 55,
    rewardGold: 22,
    successText: "Your final strike rings across the yard, and the Gatewatch takes notice.",
    failureText: "The drillmaster lowers his blade and tells you the westward road demands harder discipline."
  }),
  Object.freeze({
    questId: "quest_wraith_whispers",
    regionId: "region_western_march",
    title: "Wraith Whispers",
    description: "Resist grove voices repeating the names of scouts lost on Mordor's western march.",
    questType: "magic",
    requiredLevel: 2,
    difficulty: 3,
    requiredStat: "faith",
    requiredStatValue: 10,
    rewardXp: 50,
    rewardGold: 16,
    successText: "You answer the voices with your own will, and the ash roots loosen their hold.",
    failureText: "The grove speaks with a familiar voice, and you lose the trail."
  }),
  Object.freeze({
    questId: "quest_ring_witness_below",
    regionId: "region_drowned_ring_vault",
    title: "The Ring-Witness Below",
    description: "Face a memory echo beneath the Temple of Seven Lamps that still remembers the road to Eregion.",
    questType: "boss",
    requiredLevel: 3,
    difficulty: 4,
    requiredStat: "intelligence",
    requiredStatValue: 13,
    rewardXp: 75,
    rewardGold: 30,
    successText: "The witness echo parts the water and leaves you with a warning that refuses to sleep.",
    failureText: "The witness closes the archive around you, and the road record remains beneath the waves."
  })
]);

export function findQuestDefinitionById(questId) {
  return QUEST_DEFINITIONS.find((quest) => quest.questId === questId) || null;
}

export function isAuthoredQuestId(questId) {
  return findQuestDefinitionById(questId) !== null;
}

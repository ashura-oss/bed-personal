// Quest definitions used by adventures, rewards, and progression.
export const QUEST_DEFINITIONS = [
  {
    questId: "quest_family_oath",
    regionId: "region_middle_earth",
    title: "The Family Oath",
    description:
      "Swear the first oath of rebellion after elven tax knights destroy the player's family home.",
    questType: "dialogue",
    requiredLevel: 1,
    difficulty: 1,
    requiredStat: "charisma",
    requiredStatValue: 5,
    rewardXp: 25,
    rewardGold: 0,
    successText: "The village hears the oath and begins to gather behind mankind's first banner.",
    failureText: "The words falter, but the grief still hardens into rebellion."
  },
  {
    questId: "quest_tax_knight_reckoning",
    regionId: "region_middle_earth",
    title: "Tax Knight Reckoning",
    description:
      "Confront the decorated elven tax knights who killed the player's family after the village failed to pay tribute.",
    questType: "combat",
    requiredLevel: 1,
    difficulty: 1,
    requiredStat: "strength",
    requiredStatValue: 6,
    rewardXp: 30,
    rewardGold: 12,
    successText: "The tax patrol breaks, and the village sees that elven armor can bleed.",
    failureText: "The patrol forces you back through the smoke, but the village still honors your stand."
  },
  {
    questId: "quest_rebellion_supplies",
    regionId: "region_kingsroad",
    title: "Rebellion Supplies",
    description:
      "Gather timber, iron scraps, herbs, and food from hidden road caches before the next patrol arrives.",
    questType: "gathering",
    requiredLevel: 1,
    difficulty: 1,
    requiredStat: "agility",
    requiredStatValue: 6,
    rewardXp: 25,
    rewardGold: 8,
    successText: "The caches are recovered and the village smith can arm more rebels.",
    failureText: "The patrol arrives early, forcing you to leave half the supplies behind."
  },
  {
    questId: "quest_orc_king_gate",
    regionId: "region_orc_hold",
    title: "The Orc King's Gate",
    description:
      "Defeat the orc king holding the old hill-fort so mankind can leave the homeland and march west.",
    questType: "boss",
    requiredLevel: 2,
    difficulty: 3,
    requiredStat: "endurance",
    requiredStatValue: 10,
    rewardXp: 65,
    rewardGold: 24,
    successText: "The orc king falls, and the road out of the homeland opens for the rebellion.",
    failureText: "The orc king's charge shatters the front line and drives your warband back."
  },
  {
    questId: "quest_eregion_infiltration",
    regionId: "region_eregion",
    title: "Eregion Infiltration",
    description:
      "Enter Eregion and expose the tribute ledgers that prove centuries of human exploitation.",
    questType: "exploration",
    requiredLevel: 2,
    difficulty: 3,
    requiredStat: "intelligence",
    requiredStatValue: 10,
    rewardXp: 45,
    rewardGold: 18,
    successText: "The ledgers are carried out under cloaks, and the rebellion gains proof of elven rule.",
    failureText: "The court guards seal the archive, forcing your scouts to escape empty-handed."
  },
  {
    questId: "quest_celebrimbor",
    regionId: "region_eregion",
    title: "Celebrimbor",
    description:
      "Challenge Celebrimbor, the elegant ring-maker who guards the first ring inside Eregion's highest hall.",
    questType: "boss",
    requiredLevel: 3,
    difficulty: 4,
    requiredStat: "charisma",
    requiredStatValue: 12,
    rewardXp: 85,
    rewardGold: 30,
    successText: "The first ring is seized, and mankind kneels to crown its own king.",
    failureText: "Celebrimbor's silver command breaks your charge before the throne steps."
  },
  {
    questId: "quest_crowned_king",
    regionId: "region_crownfield",
    title: "Crowned King of Mankind",
    description:
      "Unite village banners, road militia, and forge rebels into the first army of mankind.",
    questType: "strategy",
    requiredLevel: 3,
    difficulty: 3,
    requiredStat: "charisma",
    requiredStatValue: 11,
    rewardXp: 55,
    rewardGold: 20,
    successText: "The army answers your command, and the campaign changes from survival to conquest.",
    failureText: "The banners hesitate, and the army waits for a stronger sign of command."
  },
  {
    questId: "quest_galadriel_ambush",
    regionId: "region_eregion_road",
    title: "Galadriel's Ambush",
    description:
      "Break Galadriel's army as it blocks the road to Lindon.",
    questType: "boss",
    requiredLevel: 4,
    difficulty: 5,
    requiredStat: "faith",
    requiredStatValue: 14,
    rewardXp: 100,
    rewardGold: 38,
    successText: "Galadriel retreats, leaving the second ring in human hands.",
    failureText: "Golden spears close the pass, and the human army must regroup."
  },
  {
    questId: "quest_westhaven_siege",
    regionId: "region_lindon",
    title: "Siege of Lindon",
    description:
      "Lead mankind's army against Lindon and face the High King of the elven crown.",
    questType: "boss",
    requiredLevel: 5,
    difficulty: 6,
    requiredStat: "strength",
    requiredStatValue: 16,
    rewardXp: 140,
    rewardGold: 60,
    successText: "Lindon falls, and the last ring is taken from the High King's hand.",
    failureText: "The sea walls hold, and the final ring remains beyond mankind's reach."
  }
];

// Find quest definition by id.
export function findQuestDefinitionById(questId) {
  return QUEST_DEFINITIONS.find((quest) => quest.questId === questId) || null;
}

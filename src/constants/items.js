export const ITEM_DEFINITIONS = [
  {
    itemId: "item_oak_timber",
    name: "Oak Timber",
    itemType: "material",
    stackLimit: 99,
    description: "Common timber used for bows, barricades, and wagon repairs."
  },
  {
    itemId: "item_iron_scrap",
    name: "Iron Scrap",
    itemType: "material",
    stackLimit: 99,
    description: "Recovered metal that village smiths can turn into rebel weapons."
  },
  {
    itemId: "item_healing_herb",
    name: "Healing Herb",
    itemType: "material",
    stackLimit: 99,
    description: "A roadside herb used for bandages and field medicine."
  },
  {
    itemId: "item_linen_wrap",
    name: "Linen Wrap",
    itemType: "material",
    stackLimit: 99,
    description: "Clean cloth used to bind wounds after turn-based fights."
  },
  {
    itemId: "item_silver_fragment",
    name: "Silver Fragment",
    itemType: "material",
    stackLimit: 99,
    description: "A shard of elven craftwork recovered from Eregion patrols."
  },
  {
    itemId: "item_crown_ring_shard",
    name: "Crown Ring Shard",
    itemType: "material",
    stackLimit: 99,
    description: "A dangerous shard used for late-game command abilities."
  },
  {
    itemId: "item_field_ration",
    name: "Field Ration",
    itemType: "consumable",
    stackLimit: 20,
    consumeEffect: {
      supplies: 1
    },
    description: "Food for travel between 2D map nodes."
  },
  {
    itemId: "item_rebel_bandage",
    name: "Rebel Bandage",
    itemType: "consumable",
    stackLimit: 10,
    consumeEffect: {
      hp: 20
    },
    description: "A basic healing item made from herbs and linen."
  },
  {
    itemId: "item_village_sword",
    name: "Village Sword",
    itemType: "weapon",
    equipmentSlot: "mainHand",
    stackLimit: 1,
    damageRange: {
      min: 4,
      max: 8
    },
    statBonuses: {
      strength: 3
    },
    description: "A simple sword reforged for the first rebels of Hearthvale."
  },
  {
    itemId: "item_hunter_bow",
    name: "Hunter Bow",
    itemType: "weapon",
    equipmentSlot: "mainHand",
    stackLimit: 1,
    damageRange: {
      min: 3,
      max: 9
    },
    statBonuses: {
      agility: 3,
      strength: 1
    },
    description: "A light bow suited for scouts and hunters on the King's Road."
  },
  {
    itemId: "item_orc_cleaver",
    name: "Orc Cleaver",
    itemType: "weapon",
    equipmentSlot: "mainHand",
    stackLimit: 1,
    damageRange: {
      min: 7,
      max: 12
    },
    statBonuses: {
      strength: 4,
      endurance: 1
    },
    description: "A heavy blade taken from the hill-fort after the Orc King falls."
  },
  {
    itemId: "item_lindon_spear",
    name: "Lindon Spear",
    itemType: "weapon",
    equipmentSlot: "mainHand",
    stackLimit: 1,
    damageRange: {
      min: 10,
      max: 17
    },
    statBonuses: {
      strength: 3,
      charisma: 2
    },
    description: "A silver spear captured on the road before the final siege of Lindon."
  },
  {
    itemId: "item_rebel_cloak",
    name: "Rebel Cloak",
    itemType: "armor",
    equipmentSlot: "cloak",
    stackLimit: 1,
    statBonuses: {
      defense: 2,
      maxHp: 10
    },
    description: "A travel cloak marked inside with the first rebellion sigil."
  },
  {
    itemId: "item_command_banner",
    name: "Command Banner",
    itemType: "army",
    equipmentSlot: "banner",
    stackLimit: 1,
    armyBonuses: {
      morale: 8,
      commandPower: 15
    },
    description: "A banner used after Crownfield to command army formations."
  }
];

export function findItemDefinitionById(itemId) {
  return ITEM_DEFINITIONS.find((item) => item.itemId === itemId) || null;
}

export function hasItemDefinition(itemId) {
  return findItemDefinitionById(itemId) !== null;
}

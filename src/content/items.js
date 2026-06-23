export const ITEM_DEFINITIONS = Object.freeze([
  Object.freeze({
    itemId: "timber",
    name: "Black Ashwood",
    itemType: "material",
    stackLimit: 99,
    description: "Charred Mordor war-stock used for barricades, road frames, and first bindings."
  }),
  Object.freeze({
    itemId: "iron_ore",
    name: "Gorgoroth Iron",
    itemType: "material",
    stackLimit: 99,
    description: "Dense volcanic ore ready for smelting into weapons, fittings, and armor plates."
  }),
  Object.freeze({
    itemId: "ashleaf",
    name: "Mordor Cinderleaf",
    itemType: "material",
    stackLimit: 99,
    description: "A resilient herb crushed into bitter field remedies."
  }),
  Object.freeze({
    itemId: "mooncrystal",
    name: "Eregion Glass",
    itemType: "material",
    stackLimit: 99,
    description: "A clear smith-glass prized for ring-lore instruments and precise binding work."
  }),
  Object.freeze({
    itemId: "bone",
    name: "Bleached Bone",
    itemType: "material",
    stackLimit: 99,
    description: "Hard-worn bone useful for charms and grim fieldcraft."
  }),
  Object.freeze({
    itemId: "ember_coal",
    name: "Ember Coal",
    itemType: "material",
    stackLimit: 99,
    description: "Smoldering fuel for advanced smithing and ward braziers."
  }),
  Object.freeze({
    itemId: "ember_shard",
    name: "Ring-Trace Shard",
    itemType: "material",
    stackLimit: 99,
    description: "A brittle remnant of claimed power used for low-grade bindings."
  }),
  Object.freeze({
    itemId: "gorgoroth_root",
    name: "Gorgoroth Root",
    itemType: "material",
    stackLimit: 99,
    description: "A bitter rootstock used in alchemy and shadow-tonics."
  }),
  Object.freeze({
    itemId: "ring_seeking_focus",
    name: "Ring-Seeking Focus",
    itemType: "weapon",
    equipmentSlot: "mainHand",
    stackLimit: 1,
    description: "A Mordor-bound weapon-focus balanced for road work and close defense."
  }),
  Object.freeze({
    itemId: "black_cinder_war_draught",
    name: "Black-Cinder War Draught",
    itemType: "consumable",
    stackLimit: 10,
    description: "A bitter field remedy that closes shallow cuts and keeps a war march moving."
  }),
  Object.freeze({
    itemId: "item_emberleaf",
    name: "Blackroad Emberleaf",
    itemType: "ingredient",
    stackLimit: 99,
    description: "A heat-stubborn herb used in bitter field tonics for long Mordor marches."
  }),
  Object.freeze({
    itemId: "item_ash_iron_sword",
    name: "Black Road Sword",
    itemType: "weapon",
    equipmentSlot: "mainHand",
    stackLimit: 1,
    description: "A practical blackened-iron blade issued to guards along the Black Road."
  }),
  Object.freeze({
    itemId: "item_black_road_cloak",
    name: "Black Road Cloak",
    itemType: "armor",
    equipmentSlot: "cloak",
    stackLimit: 1,
    description: "Weathered march gear for ash storms, night watches, and sudden raids."
  })
]);

export function hasItemDefinition(itemId) {
  return ITEM_DEFINITIONS.some((item) => item.itemId === itemId);
}

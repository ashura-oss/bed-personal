const ITEM_CATEGORIES = Object.freeze({
  WEAPON: "weapon",
  CONSUMABLE: "consumable",
  MATERIAL: "material",
  KEY: "key",
  LORE: "lore",
  ARMOUR: "armour"
})

const DEFAULT_STACK_SIZE_BY_CATEGORY = Object.freeze({
  [ITEM_CATEGORIES.WEAPON]: 1,
  [ITEM_CATEGORIES.CONSUMABLE]: 10,
  [ITEM_CATEGORIES.MATERIAL]: 99,
  [ITEM_CATEGORIES.KEY]: 1,
  [ITEM_CATEGORIES.LORE]: 1,
  [ITEM_CATEGORIES.ARMOUR]: 1
})

function normalizeItemId(itemId) {
  return typeof itemId === "string" ? itemId.trim() : "";
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`)
  }

  return value.trim()
}

function assertKnownCategory(category, itemId) {
  if (!Object.values(ITEM_CATEGORIES).includes(category)) {
    throw new RangeError(`Item "${itemId}" uses an unknown category: ${category}`)
  }

  return category
}

function resolveStackSize(category, stackSize, itemId) {
  const resolved = stackSize ?? DEFAULT_STACK_SIZE_BY_CATEGORY[category]

  if (!Number.isInteger(resolved) || resolved <= 0) {
    throw new RangeError(`Item "${itemId}" requires a positive integer stackSize`)
  }

  return resolved
}

function createItemDefinition({
  id,
  name,
  category,
  rarity,
  description,
  flavorText,
  stackSize
}) {
  const normalizedId = normalizeItemId(id);
  if (!normalizedId) {
    throw new TypeError("Item definitions require a non-empty id");
  }

  const normalizedCategory = assertKnownCategory(category, normalizedId)

  return Object.freeze({
    id: normalizedId,
    name: assertNonEmptyString(name, `Item "${normalizedId}" name`),
    category: normalizedCategory,
    rarity: assertNonEmptyString(rarity, `Item "${normalizedId}" rarity`),
    description: assertNonEmptyString(description, `Item "${normalizedId}" description`),
    flavorText: assertNonEmptyString(flavorText, `Item "${normalizedId}" flavorText`),
    stackSize: resolveStackSize(normalizedCategory, stackSize, normalizedId)
  });
}

export const ITEM_DEFINITIONS = Object.freeze([
  createItemDefinition({
    id: "timber",
    name: "Timber",
    category: ITEM_CATEGORIES.MATERIAL,
    rarity: "common",
    description: "Cut lumber used for camp repairs, barricades, and simple tools.",
    flavorText: "Fresh-cut beams still carry the warmth of the grove."
  }),
  createItemDefinition({
    id: "iron_ore",
    name: "Iron Ore",
    category: ITEM_CATEGORIES.MATERIAL,
    rarity: "common",
    description: "Dense ore ready for smelting into weapons, fittings, and armor plates.",
    flavorText: "Raw stone veined with the dull shine of a forge not yet lit."
  }),
  createItemDefinition({
    id: "ashleaf",
    name: "Ashleaf",
    category: ITEM_CATEGORIES.MATERIAL,
    rarity: "uncommon",
    description: "A resilient herb used in poultices, tinctures, and smoke-cured remedies.",
    flavorText: "Its edges look singed, but the veins still run bright."
  }),
  createItemDefinition({
    id: "mooncrystal",
    name: "Mooncrystal",
    category: ITEM_CATEGORIES.MATERIAL,
    rarity: "rare",
    description: "Luminous crystal prized for enchantment work and precise arcane instruments.",
    flavorText: "Even in shadow, it remembers a colder sky."
  }),
  createItemDefinition({
    id: "bone",
    name: "Bleached Bone",
    category: ITEM_CATEGORIES.MATERIAL,
    rarity: "common",
    description: "Hard-worn bone useful for needles, charms, and grim fieldcraft.",
    flavorText: "Weather stripped it clean long before you found it."
  }),
  createItemDefinition({
    id: "ember_coal",
    name: "Ember Coal",
    category: ITEM_CATEGORIES.MATERIAL,
    rarity: "uncommon",
    description: "Smoldering fuel that burns hot enough for advanced smithing and ward braziers.",
    flavorText: "The cinder core keeps its temper better than most soldiers."
  }),
  createItemDefinition({
    id: "ember_shard",
    name: "Ember Shard",
    category: ITEM_CATEGORIES.MATERIAL,
    rarity: "uncommon",
    description: "A brittle remnant of carried fire, used for low-grade charms and field repairs.",
    flavorText: "It glows only when the hand closes around it."
  }),
  createItemDefinition({
    id: "blackroot",
    name: "Blackroot",
    category: ITEM_CATEGORIES.MATERIAL,
    rarity: "uncommon",
    description: "A bitter rootstock used in alchemy, preserving salts, and shadow-tonics.",
    flavorText: "It stains the hand before it ever touches the tongue."
  }),
  createItemDefinition({
    id: "hearthlight_hatchet",
    name: "Hearthlight Hatchet",
    category: ITEM_CATEGORIES.WEAPON,
    rarity: "common",
    description: "A camp-forged hatchet balanced for chopping, prying, and close defense.",
    flavorText: "Its head still smells faintly of resin and forge smoke."
  }),
  createItemDefinition({
    id: "ashleaf_poultice",
    name: "Ashleaf Poultice",
    category: ITEM_CATEGORIES.CONSUMABLE,
    rarity: "common",
    description: "A wrapped field remedy that closes shallow cuts and keeps a traveler moving.",
    flavorText: "The bitter paste warms against the skin before the pain recedes."
  })
]);

const ITEM_DEFINITION_MAP = new Map(ITEM_DEFINITIONS.map((definition) => [definition.id, definition]));

export const ITEM_DEFINITIONS_BY_ID = Object.freeze(Object.fromEntries(ITEM_DEFINITION_MAP));
export const MATERIAL_ITEM_IDS = Object.freeze(
  ITEM_DEFINITIONS
    .filter((definition) => definition.category === ITEM_CATEGORIES.MATERIAL)
    .map((definition) => definition.id)
);

export function getItemDefinition(itemId) {
  const normalizedId = normalizeItemId(itemId);
  return normalizedId ? ITEM_DEFINITION_MAP.get(normalizedId) ?? null : null;
}

export function hasItemDefinition(itemId) {
  return getItemDefinition(itemId) !== null;
}

export function assertKnownItemId(itemId) {
  const normalizedId = normalizeItemId(itemId);
  if (!normalizedId) {
    throw new TypeError("Item id must be a non-empty string");
  }

  const definition = ITEM_DEFINITION_MAP.get(normalizedId);
  if (!definition) {
    throw new RangeError(`Unknown item id: ${normalizedId}`);
  }

  return definition;
}

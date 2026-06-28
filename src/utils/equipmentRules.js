// Pure equipment helper functions used to apply item stat and army bonuses.
// These helpers read item constants only; they do not read or write saved inventory rows.
import { findItemDefinitionById } from "../constants/items.js";

const characterStatFields = [
  "hp",
  "strength",
  "intelligence",
  "agility",
  "faith",
  "endurance",
  "charisma"
];

// Applies equipped item stat bonuses to a copy of the character used for combat.
export function applyEquipmentBonuses(character, equipment = []) {
  const combatCharacter = {
    ...character,
    defense: 0,
    weaponDamageRange: null,
    equipmentBonuses: []
  };

  for (const equippedItem of equipment) {
    const item = findItemDefinitionById(equippedItem.itemId);

    if (!item?.statBonuses && !item?.damageRange) {
      continue;
    }

    const appliedBonuses = {};

    for (const [statName, value] of Object.entries(item.statBonuses || {})) {
      if (characterStatFields.includes(statName)) {
        combatCharacter[statName] += value;
        appliedBonuses[statName] = value;
      }

      if (statName === "maxHp") {
        combatCharacter.hp += value;
        appliedBonuses.maxHp = value;
      }

      if (statName === "defense") {
        combatCharacter.defense += value;
        appliedBonuses.defense = value;
      }
    }

    if (item.damageRange) {
      combatCharacter.weaponDamageRange = combineDamageRanges(
        combatCharacter.weaponDamageRange,
        item.damageRange
      );
      appliedBonuses.damageRange = item.damageRange;
    }

    combatCharacter.equipmentBonuses.push({
      itemId: item.itemId,
      name: item.name,
      equipmentSlot: equippedItem.equipmentSlot,
      bonuses: appliedBonuses
    });
  }

  return combatCharacter;
}

// Combines multiple weapon damage ranges into one total range.
function combineDamageRanges(currentRange, addedRange) {
  if (!currentRange) {
    return {
      min: addedRange.min,
      max: addedRange.max
    };
  }

  return {
    min: currentRange.min + addedRange.min,
    max: currentRange.max + addedRange.max
  };
}

// Calculates army command bonuses from equipped items that affect army battles.
export function calculateArmyEquipmentBonus(equipment = []) {
  let commandPower = 0;
  let morale = 0;

  for (const equippedItem of equipment) {
    const item = findItemDefinitionById(equippedItem.itemId);

    if (!item?.armyBonuses) {
      continue;
    }

    commandPower += Number(item.armyBonuses.commandPower || 0);
    morale += Number(item.armyBonuses.morale || 0);
  }

  return { commandPower, morale };
}

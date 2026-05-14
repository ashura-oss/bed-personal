import { createHttpError } from "./httpError.js";

const validAbilityTypes = new Set([
  "opener",
  "chain",
  "finisher",
  "defensive",
  "utility",
  "ultimate"
]);

const finalAbilityTypes = new Set(["finisher", "ultimate"]);

export function resolveComboBattle({ character, abilities, quest = null, enemyId = null }) {
  validateComboInput(character, abilities);
  validateComboOrder(abilities);
  validateAbilityCompatibility(character, abilities);

  const basePower = abilities.reduce((total, ability) => total + Number(ability.power || 0), 0);
  const statBonus = Math.floor(getHighestCombatStat(character).value / 2);
  const levelBonus = Math.max(Number(character.level || 1) - 1, 0) * 2;
  const triggeredBonuses = buildTriggeredBonuses(character, abilities);
  const bonusPower = triggeredBonuses.reduce((total, bonus) => total + bonus.value, 0);
  const totalPower = basePower + statBonus + levelBonus + bonusPower;
  const target = buildTargetResult({ quest, enemyId, totalPower });

  return {
    character: buildCharacterSummary(character),
    selectedAbilities: abilities.map(buildAbilitySummary),
    basePower,
    statBonus,
    levelBonus,
    bonusPower,
    totalPower,
    totalDamage: totalPower,
    comboRating: getComboRating(totalPower),
    triggeredBonuses,
    target,
    narrationText: buildNarration({ character, abilities, totalPower, target })
  };
}

function validateComboInput(character, abilities) {
  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  if (!Array.isArray(abilities) || abilities.length === 0) {
    throw createHttpError(
      400,
      "Bad Request",
      "abilityIds must include at least one unlocked ability."
    );
  }
}

function validateComboOrder(abilities) {
  let hasOpener = false;
  let hasOffensiveAbility = false;
  let finalAbilityIndex = -1;

  abilities.forEach((ability, index) => {
    const abilityType = ability.abilityType;

    if (!validAbilityTypes.has(abilityType)) {
      throw createHttpError(
        400,
        "Bad Request",
        `Ability ${ability.name} has unsupported abilityType ${abilityType}.`
      );
    }

    if (finalAbilityIndex !== -1) {
      throw createHttpError(
        400,
        "Bad Request",
        "No ability can be placed after a finisher or ultimate."
      );
    }

    if (abilityType === "opener") {
      if (hasOpener) {
        throw createHttpError(400, "Bad Request", "A combo can only include one opener.");
      }

      hasOpener = true;
      hasOffensiveAbility = true;
    }

    if (abilityType === "chain") {
      if (!hasOpener) {
        throw createHttpError(400, "Bad Request", "A chain ability must come after an opener.");
      }

      hasOffensiveAbility = true;
    }

    if (finalAbilityTypes.has(abilityType)) {
      if (!hasOpener) {
        throw createHttpError(
          400,
          "Bad Request",
          "A finisher or ultimate requires an opener earlier in the combo."
        );
      }

      if (index !== abilities.length - 1) {
        throw createHttpError(
          400,
          "Bad Request",
          "A finisher or ultimate must be the final ability in the combo."
        );
      }

      finalAbilityIndex = index;
      hasOffensiveAbility = true;
    }
  });

  if (!hasOffensiveAbility) {
    throw createHttpError(
      400,
      "Bad Request",
      "A combo must include at least one opener, chain, finisher, or ultimate."
    );
  }
}

function validateAbilityCompatibility(character, abilities) {
  abilities.forEach((ability) => {
    if (Number(character.level || 1) < Number(ability.requiredLevel || 1)) {
      throw createHttpError(
        400,
        "Bad Request",
        `Character level ${character.level} is too low for ${ability.name}. Required level is ${ability.requiredLevel}.`
      );
    }

    if (ability.className !== null && ability.className !== character.className) {
      throw createHttpError(
        400,
        "Bad Request",
        `${ability.name} requires className ${ability.className}.`
      );
    }

    if (ability.affinity !== null && ability.affinity !== character.affinity) {
      throw createHttpError(
        400,
        "Bad Request",
        `${ability.name} requires affinity ${ability.affinity}.`
      );
    }
  });
}

function buildTriggeredBonuses(character, abilities) {
  const bonuses = [];
  const classMatches = abilities.filter((ability) => ability.className === character.className);
  const affinityMatches = abilities.filter((ability) => ability.affinity === character.affinity);
  const hasOpener = abilities.some((ability) => ability.abilityType === "opener");
  const hasChain = abilities.some((ability) => ability.abilityType === "chain");
  const firstAbility = abilities[0];
  const finalAbility = abilities[abilities.length - 1];
  const strongestFamily = getStrongestComboFamily(abilities);

  if (classMatches.length > 0) {
    bonuses.push({
      name: "Class Synergy",
      value: classMatches.length * 2,
      description: `${classMatches.length} abilities match ${character.className}.`
    });
  }

  if (affinityMatches.length > 0) {
    bonuses.push({
      name: "Affinity Synergy",
      value: affinityMatches.length * 2,
      description: `${affinityMatches.length} abilities match ${character.affinity}.`
    });
  }

  if (hasOpener && hasChain) {
    bonuses.push({
      name: "Structured Combo",
      value: 4,
      description: "The combo uses an opener before a chain ability."
    });
  }

  if (strongestFamily.count >= 2) {
    bonuses.push({
      name: "Combo Tag Resonance",
      value: 5,
      description: `${strongestFamily.family} tags connect ${strongestFamily.count} abilities.`
    });
  }

  if (firstAbility && ["utility", "defensive"].includes(firstAbility.abilityType) && hasOpener) {
    bonuses.push({
      name: "Setup Tempo",
      value: 2,
      description: "A support ability prepares the opener."
    });
  }

  if (finalAbility?.abilityType === "finisher") {
    bonuses.push({
      name: "Finisher",
      value: 6,
      description: `${finalAbility.name} closes the sequence.`
    });
  }

  if (finalAbility?.abilityType === "ultimate") {
    bonuses.push({
      name: "Ultimate",
      value: 10,
      description: `${finalAbility.name} ends the combo with ultimate force.`
    });
  }

  return bonuses;
}

function getHighestCombatStat(character) {
  const combatStats = ["strength", "intelligence", "agility", "faith", "endurance"];

  return combatStats
    .map((statName) => ({ statName, value: Number(character[statName] || 0) }))
    .sort((left, right) => right.value - left.value)[0];
}

function getStrongestComboFamily(abilities) {
  const families = new Map();

  abilities.forEach((ability) => {
    const family = getComboFamily(ability.comboTag);

    if (!family || family === "movement") {
      return;
    }

    families.set(family, (families.get(family) || 0) + 1);
  });

  return [...families.entries()]
    .map(([family, count]) => ({ family, count }))
    .sort((left, right) => right.count - left.count)[0] || { family: null, count: 0 };
}

function getComboFamily(comboTag) {
  if (typeof comboTag !== "string" || comboTag.trim().length === 0) {
    return null;
  }

  return comboTag.split("-")[0];
}

function buildTargetResult({ quest, enemyId, totalPower }) {
  if (quest) {
    const requiredPower = Number(quest.difficulty || 1) * 8 + Number(quest.requiredLevel || 1) * 4;
    const outcome = totalPower >= requiredPower ? "combo_success" : "combo_pressure";

    return {
      type: "quest",
      questId: quest.questId,
      title: quest.title,
      questType: quest.questType,
      requiredPower,
      outcome,
      rewardPreview: {
        xp: outcome === "combo_success" ? Number(quest.rewardXp || 0) : Math.floor(Number(quest.rewardXp || 0) * 0.25),
        gold: outcome === "combo_success" ? Number(quest.rewardGold || 0) : 0,
        isAwarded: false
      }
    };
  }

  if (enemyId) {
    return {
      type: "enemy",
      enemyId,
      outcome: "simulated",
      rewardPreview: null
    };
  }

  return {
    type: "training",
    outcome: "simulated",
    rewardPreview: null
  };
}

function getComboRating(totalPower) {
  if (totalPower >= 55) {
    return "S";
  }

  if (totalPower >= 40) {
    return "A";
  }

  if (totalPower >= 25) {
    return "B";
  }

  return "C";
}

function buildNarration({ character, abilities, totalPower, target }) {
  const sequence = abilities.map((ability) => ability.name).join(" -> ");
  const targetText = target.type === "quest" ? ` against ${target.title}` : "";

  return `${character.characterName} threads ${sequence}${targetText}, releasing ${totalPower} combo power.`;
}

function buildCharacterSummary(character) {
  return {
    characterId: character.characterId,
    characterName: character.characterName,
    level: character.level,
    className: character.className,
    affinity: character.affinity
  };
}

function buildAbilitySummary(ability) {
  return {
    abilityId: ability.abilityId,
    name: ability.name,
    abilityType: ability.abilityType,
    power: ability.power,
    comboTag: ability.comboTag,
    className: ability.className,
    affinity: ability.affinity
  };
}

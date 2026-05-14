export const abilityTypeOrder = [
  "opener",
  "chain",
  "finisher",
  "defensive",
  "utility",
  "ultimate"
];

const abilityTypeLabels = {
  opener: "Opener",
  chain: "Chain",
  finisher: "Finisher",
  defensive: "Defensive",
  utility: "Utility",
  ultimate: "Ultimate"
};

export function groupAbilitiesByType(abilities) {
  const groups = Object.fromEntries(abilityTypeOrder.map((type) => [type, []]));

  (Array.isArray(abilities) ? abilities : []).forEach((ability) => {
    const type = ability?.abilityType;

    if (!groups[type]) {
      groups[type] = [];
    }

    groups[type].push(ability);
  });

  return groups;
}

export function getAbilityTypeLabel(type) {
  return abilityTypeLabels[type] || "Ability";
}

export function isAbilityUnlocked(ability, unlockedAbilities) {
  return (Array.isArray(unlockedAbilities) ? unlockedAbilities : []).some(
    (unlockedAbility) => unlockedAbility.abilityId === ability?.abilityId
  );
}

export function getAbilityUnlockState(character, ability, unlockedAbilities) {
  const isUnlocked = isAbilityUnlocked(ability, unlockedAbilities);
  const levelMatches = Number(character?.level || 0) >= Number(ability?.requiredLevel || 1);
  const classMatches = !ability?.className || ability.className === character?.className;
  const affinityMatches = !ability?.affinity || ability.affinity === character?.affinity;
  const reasons = [];

  if (!character) {
    reasons.push("Select a character first.");
  }

  if (!levelMatches) {
    reasons.push(`Requires level ${Number(ability?.requiredLevel || 1)}.`);
  }

  if (!classMatches) {
    reasons.push(`Requires ${ability.className}.`);
  }

  if (!affinityMatches) {
    reasons.push(`Requires ${ability.affinity}.`);
  }

  return {
    isUnlocked,
    canUnlock: Boolean(character && !isUnlocked && levelMatches && classMatches && affinityMatches),
    levelMatches,
    classMatches,
    affinityMatches,
    reasons
  };
}

export function getComboSlotKey(ability) {
  if (ability?.abilityType === "opener") {
    return "opener";
  }

  if (ability?.abilityType === "chain") {
    return "chain";
  }

  if (ability?.abilityType === "finisher" || ability?.abilityType === "ultimate") {
    return "finisher";
  }

  return null;
}

export function buildComboSequence(selectedComboSlots) {
  return [
    selectedComboSlots?.opener?.abilityId,
    selectedComboSlots?.chain?.abilityId,
    selectedComboSlots?.finisher?.abilityId
  ].filter(Boolean);
}

export function getRequirementSummary(ability) {
  const requirements = [];

  requirements.push(`Level ${Number(ability?.requiredLevel || 1)}+`);
  requirements.push(ability?.className || "Any class");
  requirements.push(ability?.affinity || "Any affinity");

  return requirements;
}

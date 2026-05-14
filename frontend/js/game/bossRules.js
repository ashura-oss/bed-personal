export function isBossQuest(quest) {
  return quest?.questType === "boss";
}

export function getBossRequiredPower(quest) {
  return Number(quest?.difficulty || 1) * 8 + Number(quest?.requiredLevel || 1) * 4;
}

export function buildBossPreview(quest, region = null) {
  return {
    bossName: quest?.title || "Unknown Boss",
    regionName: region?.name || "Unknown Region",
    hp: getBossRequiredPower(quest),
    difficulty: Number(quest?.difficulty || 1),
    requiredLevel: Number(quest?.requiredLevel || 1),
    weakness: quest?.requiredStat || "unknown",
    resistance: getBossResistance(quest),
    lore: quest?.description || "No boss record loaded.",
    rewardXp: Number(quest?.rewardXp || 0),
    rewardGold: Number(quest?.rewardGold || 0)
  };
}

export function getBossOutcome(result) {
  if (result?.outcome === "success" || result?.target?.outcome === "combo_success") {
    return "victory";
  }

  if (result?.outcome === "failure" || result?.target?.outcome === "combo_pressure") {
    return "defeat";
  }

  return "training";
}

function getBossResistance(quest) {
  const difficulty = Number(quest?.difficulty || 1);

  if (difficulty >= 4) {
    return "Worldheart pressure";
  }

  if (difficulty >= 3) {
    return "Shard corruption";
  }

  return "Broken oath";
}

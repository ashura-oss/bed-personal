export const statLabels = {
  strength: "STR",
  intelligence: "INT",
  agility: "AGI",
  faith: "FAI",
  endurance: "END",
  charisma: "CHA"
};

export function getStatLabel(statName) {
  return statLabels[statName] || String(statName || "").toUpperCase();
}

export function getCharacterStat(character, statName) {
  const value = Number(character?.[statName]);
  return Number.isFinite(value) ? value : 0;
}

export function buildQuestReadiness(character, quest) {
  if (!quest) {
    return {
      canAttempt: false,
      title: "No quest selected",
      message: "Choose a quest contract first."
    };
  }

  if (!character) {
    return {
      canAttempt: false,
      title: "No hero selected",
      message: "Select a character before attempting this contract."
    };
  }

  const level = Number(character.level || 1);
  const requiredLevel = Number(quest.requiredLevel || 1);
  const characterStat = getCharacterStat(character, quest.requiredStat);
  const levelBonus = Math.max(level - 1, 0);
  const totalScore = characterStat + levelBonus;
  const requiredStatValue = Number(quest.requiredStatValue || 0);

  if (level < requiredLevel) {
    return {
      canAttempt: true,
      title: "Level risk",
      message: `Backend will reject this if ${character.characterName} is below level ${requiredLevel}.`,
      characterStat,
      levelBonus,
      totalScore,
      requiredStatValue,
      expectedOutcome: "blocked"
    };
  }

  return {
    canAttempt: true,
    title: totalScore >= requiredStatValue ? "Favorable odds" : "Dangerous odds",
    message: `${getStatLabel(quest.requiredStat)} ${totalScore} vs ${requiredStatValue}.`,
    characterStat,
    levelBonus,
    totalScore,
    requiredStatValue,
    expectedOutcome: totalScore >= requiredStatValue ? "success" : "failure"
  };
}

export function getAttemptErrorMessage(error) {
  if (error?.status === 400) {
    return error.message || "The selected hero cannot attempt this quest yet.";
  }

  if (error?.status === 401) {
    return "Your session expired. Login again before attempting a quest.";
  }

  if (error?.status === 403) {
    return "This quest attempt is not allowed for the current profile.";
  }

  if (error?.status === 404) {
    return "The selected quest or hero no longer exists on the backend.";
  }

  if (error?.status >= 500) {
    return "The backend did not complete the quest attempt. Check the server and try again.";
  }

  return error?.message || "Quest attempt failed. Try again.";
}

export const logOutcomeFilters = [
  { id: "all", label: "All" },
  { id: "success", label: "Success" },
  { id: "failure", label: "Failure" },
  { id: "boss", label: "Boss" }
];

export function filterAdventureLogs(logs, { outcomeFilter = "all", regionId = "all" } = {}) {
  return toLogList(logs).filter((log) => {
    const matchesOutcome =
      outcomeFilter === "all" ||
      (outcomeFilter === "boss" && log.questType === "boss") ||
      log.outcome === outcomeFilter;
    const matchesRegion = regionId === "all" || log.regionId === regionId;

    return matchesOutcome && matchesRegion;
  });
}

export function buildLogSummary(logs) {
  const logList = toLogList(logs);

  return logList.reduce(
    (summary, log) => {
      summary.total += 1;
      summary.xp += Number(log.xpGained || 0);
      summary.gold += Number(log.goldGained || 0);

      if (log.outcome === "success") {
        summary.success += 1;
      }

      if (log.outcome === "failure") {
        summary.failure += 1;
      }

      if (log.questType === "boss") {
        summary.boss += 1;
      }

      return summary;
    },
    { total: 0, success: 0, failure: 0, boss: 0, xp: 0, gold: 0 }
  );
}

export function getRegionOptions(logs) {
  const regionMap = new Map();

  toLogList(logs).forEach((log) => {
    if (log.regionId && log.regionName && !regionMap.has(log.regionId)) {
      regionMap.set(log.regionId, log.regionName);
    }
  });

  return [...regionMap.entries()]
    .map(([regionId, regionName]) => ({ regionId, regionName }))
    .sort((left, right) => left.regionName.localeCompare(right.regionName));
}

export function getCharacterOptions(logs, characters) {
  const characterMap = new Map();

  toCharacterList(characters).forEach((character) => {
    characterMap.set(character.characterId, {
      characterId: character.characterId,
      characterName: character.characterName
    });
  });

  toLogList(logs).forEach((log) => {
    if (log.characterId && log.characterName && !characterMap.has(log.characterId)) {
      characterMap.set(log.characterId, {
        characterId: log.characterId,
        characterName: log.characterName
      });
    }
  });

  return [...characterMap.values()].sort((left, right) =>
    left.characterName.localeCompare(right.characterName)
  );
}

export function buildCharacterProgress(character) {
  const xp = Number(character?.xp || 0);
  const xpProgress = xp % 100;

  return {
    level: Number(character?.level || 1),
    totalXp: xp,
    xpProgress,
    xpPercent: Math.min(100, Math.max(0, xpProgress))
  };
}

function toLogList(logs) {
  return Array.isArray(logs) ? logs : [];
}

function toCharacterList(characters) {
  return Array.isArray(characters) ? characters : [];
}

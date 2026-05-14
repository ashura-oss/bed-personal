const xpPerLevel = 100;

export function calculateLevelFromXp(xp) {
  return Math.floor(xp / xpPerLevel) + 1;
}

export function buildCharacterProgression(character, xpGained) {
  const previousXp = character.xp;
  const previousLevel = character.level;
  const previousHp = character.hp;
  const nextXp = previousXp + xpGained;
  const calculatedLevel = calculateLevelFromXp(nextXp);
  const nextLevel = Math.max(previousLevel, calculatedLevel);
  const levelsGained = nextLevel - previousLevel;
  const nextHp = previousHp + levelsGained * 10;

  return {
    updates: {
      xp: nextXp,
      level: nextLevel,
      hp: nextHp
    },
    summary: {
      previousXp,
      nextXp,
      previousLevel,
      nextLevel,
      levelsGained,
      previousHp,
      nextHp
    }
  };
}

export function buildUserProgression(user, xpGained, goldGained) {
  const previousXp = user.xp;
  const previousGold = user.gold;
  const previousLevel = user.level;
  const nextXp = previousXp + xpGained;
  const nextGold = previousGold + goldGained;
  const calculatedLevel = calculateLevelFromXp(nextXp);
  const nextLevel = Math.max(previousLevel, calculatedLevel);
  const levelsGained = nextLevel - previousLevel;

  return {
    updates: {
      xp: nextXp,
      gold: nextGold,
      level: nextLevel
    },
    summary: {
      previousXp,
      nextXp,
      previousGold,
      nextGold,
      previousLevel,
      nextLevel,
      levelsGained
    }
  };
}

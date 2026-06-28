// Pure leveling helper functions for XP, level, and gold rewards.
// These helpers do not touch the database; models decide when to save the returned updates.
const xpPerLevel = 100;

// Calculates a level from total XP using the same rule for users and characters.
export function calculateLevelFromXp(xp) {
  return Math.floor(xp / xpPerLevel) + 1;
}

// Builds the character update object and summary after XP is awarded.
// The summary is returned to the API response so the caller can show what changed.
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

// Builds the user update object and summary after XP and gold are awarded.
// Keeping this pure makes adventure and combat reward code use the same calculation.
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

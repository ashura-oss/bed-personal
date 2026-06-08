import { api, ApiError } from "./ApiClient.js";

const KEY_USER_ID = "rf_userId";
const KEY_CHAR_ID = "rf_charId";

// ── Stat derivation ────────────────────────────────────────────────────────────

/**
 * Translate backend character stats into the 3D game's runtime numbers.
 *
 * Formulas are our own (not lifted from any existing game).
 * They will be tuned during Phase 3 playtesting.
 */
export function deriveStats(char) {
  return {
    maxHp: char.hp + char.endurance * 6,
    maxFp: 30 + char.intelligence * 4 + char.faith * 2,
    maxStamina: 70 + char.endurance * 4 + char.agility * 2,
    lightDmg: 18 + Math.floor(char.agility * 1.2) + Math.floor(char.strength * 0.5),
    heavyDmg: 40 + char.strength * 2 + Math.floor(char.agility * 0.4),
    rollSpeed: 1 + (char.agility - 5) * 0.04
  };
}

function normalizeNonNegativeInteger(value, fallback = 0) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function calculateLevelFromXp(xp) {
  return Math.floor(normalizeNonNegativeInteger(xp) / 100) + 1;
}

function buildAbilityQuery(filters = {}) {
  const params = [];

  for (const key of ["className", "affinity"]) {
    const value = typeof filters?.[key] === "string" ? filters[key].trim() : "";
    if (value) {
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }

  const query = params.join("&");
  return query ? `?${query}` : "";
}

function buildNeedsCharacterCreationResult(user) {
  localStorage.removeItem(KEY_CHAR_ID);
  return {
    ok: true,
    user,
    needsCharacterCreation: true
  };
}

function buildCharacterResult(user, character) {
  localStorage.setItem(KEY_CHAR_ID, character.characterId);
  return {
    ok: true,
    user,
    character,
    stats: deriveStats(character)
  };
}

async function loadFirstCharacterForUser(user) {
  const chars = await api.get(`/users/${user.userId}/characters`);
  if (chars.length === 0) {
    return buildNeedsCharacterCreationResult(user);
  }

  return buildCharacterResult(user, chars[0]);
}

// ── AuthService ────────────────────────────────────────────────────────────────

export class AuthService {
  /** Log in, store JWT, load the user's first character. */
  async login(username, password) {
    try {
      const res = await api.post("/auth/login", { username, password });
      api.setToken(res.token);
      localStorage.setItem(KEY_USER_ID, res.user.userId);

      return await loadFirstCharacterForUser(res.user);
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          ok: false,
          message: err.payload.message
        };
      }

      return {
        ok: false,
        message: "Could not reach the server. Is the backend running?"
      };
    }
  }

  /** Try to resume a previous session from localStorage. */
  async tryResume() {
    if (!api.hasToken) {
      return null;
    }

    try {
      const user = await api.get("/auth/me");
      localStorage.setItem(KEY_USER_ID, user.userId);

      const charId = localStorage.getItem(KEY_CHAR_ID);
      let char;
      if (charId) {
        try {
          char = await api.get(`/characters/${charId}`);
        } catch (err) {
          if (!(err instanceof ApiError) || (err.status !== 403 && err.status !== 404)) {
            throw err;
          }

          localStorage.removeItem(KEY_CHAR_ID);
        }
      }

      return char ? buildCharacterResult(user, char) : await loadFirstCharacterForUser(user);
    } catch {
      api.clearToken();
      return null;
    }
  }

  /** Create and select a character for an authenticated user. */
  async createCharacter({ userId, characterName, origin, className, affinity }) {
    try {
      const character = await api.post("/characters", {
        userId,
        characterName,
        origin,
        className,
        affinity
      });
      localStorage.setItem(KEY_CHAR_ID, character.characterId);

      return {
        ok: true,
        character,
        stats: deriveStats(character)
      };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof ApiError
          ? err.payload.message
          : "Could not reach the server. Is the backend running?"
      };
    }
  }

  logout() {
    api.clearToken();
    localStorage.removeItem(KEY_USER_ID);
    localStorage.removeItem(KEY_CHAR_ID);
  }

  /**
   * Persist character XP gain after boss victory.
   * Uses PUT /progression/characters/:id to update xp and optionally level.
   */
  async saveXpGain(characterId, xpDelta, currentXp, newLevel) {
    const nextXp = normalizeNonNegativeInteger(currentXp) + normalizeNonNegativeInteger(xpDelta);

    try {
      await api.put(`/progression/characters/${characterId}`, {
        xp: nextXp,
        level: newLevel
      });
    } catch {
      // Non-fatal — game continues even if the save fails
      console.warn("[AuthService] Failed to persist XP gain");
    }
  }

  /**
   * Claim an idempotent backend-owned quest completion reward.
   * Returns awarded/rewards/character/characterProgression from the server.
   */
  async claimQuestCompletionReward(characterId, questId) {
    return api.put(
      `/progression/characters/${characterId}/quest-completions/${encodeURIComponent(questId)}`
    );
  }

  /** Load the backend ability catalog, optionally filtered by className/affinity. */
  async listAbilities(filters = {}) {
    return api.get(`/abilities${buildAbilityQuery(filters)}`);
  }

  /** Load the backend-owned ability unlocks for a character. */
  async getCharacterAbilities(characterId) {
    return api.get(`/characters/${encodeURIComponent(characterId)}/abilities`);
  }

  /** Unlock an ability for a character through the existing backend route. */
  async unlockCharacterAbility(characterId, abilityId) {
    return api.post(
      `/characters/${encodeURIComponent(characterId)}/unlock-ability`,
      { abilityId }
    );
  }

  /**
   * Persist XP awarded by a claimed quest reward.
   * Returns an explicit result so callers can mark rewards claimed only after persistence succeeds.
   */
  async saveQuestRewardXpGain(characterId, rewardXp, currentXp, currentLevel) {
    const nextXp = normalizeNonNegativeInteger(currentXp) + normalizeNonNegativeInteger(rewardXp);
    const nextLevel = Math.max(
      normalizeNonNegativeInteger(currentLevel, 1),
      calculateLevelFromXp(nextXp)
    );

    try {
      const progression = await api.put(`/progression/characters/${characterId}`, {
        xp: nextXp,
        level: nextLevel
      });

      return {
        ok: true,
        progression,
        xp: nextXp,
        level: nextLevel
      };
    } catch (err) {
      const message = err instanceof ApiError
        ? err.payload.message
        : "Could not persist quest reward XP.";

      console.warn("[AuthService] Failed to persist quest reward XP");
      return {
        ok: false,
        message
      };
    }
  }
}

export const authService = new AuthService();

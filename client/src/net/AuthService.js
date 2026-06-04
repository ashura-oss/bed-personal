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

// ── AuthService ────────────────────────────────────────────────────────────────

export class AuthService {
  /** Log in, store JWT, load the user's first character. */
  async login(username, password) {
    try {
      const res = await api.post("/auth/login", { username, password });
      api.setToken(res.token);
      localStorage.setItem(KEY_USER_ID, res.user.userId);

      const chars = await api.get(`/users/${res.user.userId}/characters`);
      if (chars.length === 0) {
        return {
          ok: false,
          message: "No characters found for this account."
        };
      }

      const char = chars[0];
      localStorage.setItem(KEY_CHAR_ID, char.characterId);
      return {
        ok: true,
        user: res.user,
        character: char,
        stats: deriveStats(char)
      };
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
        char = await api.get(`/characters/${charId}`);
      } else {
        const chars = await api.get(`/users/${user.userId}/characters`);
        if (chars.length === 0) {
          return null;
        }
        char = chars[0];
        localStorage.setItem(KEY_CHAR_ID, char.characterId);
      }

      return {
        ok: true,
        user,
        character: char,
        stats: deriveStats(char)
      };
    } catch {
      api.clearToken();
      return null;
    }
  }

  logout() {
    api.clearToken();
    localStorage.removeItem(KEY_USER_ID);
    localStorage.removeItem(KEY_CHAR_ID);
  }

  /**
   * Persist character XP gain after boss victory.
   * Uses PUT /characters/:id to update xp and optionally level.
   */
  async saveXpGain(characterId, xpDelta, currentXp, newLevel) {
    try {
      await api.put(`/characters/${characterId}`, {
        xp: currentXp + xpDelta,
        level: newLevel
      });
    } catch {
      // Non-fatal — game continues even if the save fails
      console.warn("[AuthService] Failed to persist XP gain");
    }
  }
}

export const authService = new AuthService();

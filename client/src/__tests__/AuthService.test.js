import { beforeEach, describe, expect, it, jest } from "@jest/globals";

class MemoryStorage {
  constructor() {
    this.items = new Map();
  }

  getItem(key) {
    return this.items.has(key) ? this.items.get(key) : null;
  }

  setItem(key, value) {
    this.items.set(key, String(value));
  }

  removeItem(key) {
    this.items.delete(key);
  }
}

async function loadAuthServiceWithApi() {
  const apiModule = await import("../net/ApiClient.js");
  const authModule = await import("../net/AuthService.js");

  return {
    api: apiModule.api,
    ApiError: apiModule.ApiError,
    AuthService: authModule.AuthService
  };
}

beforeEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
  globalThis.localStorage = new MemoryStorage();
});

const user = Object.freeze({
  userId: "user-a",
  username: "demo"
});

const character = Object.freeze({
  characterId: "char-a",
  userId: "user-a",
  characterName: "Aster",
  origin: "Hearthmere",
  className: "Ranger",
  affinity: "Nature",
  level: 1,
  xp: 0,
  hp: 42,
  endurance: 7,
  intelligence: 5,
  faith: 4,
  agility: 8,
  strength: 6
});

describe("AuthService character creation flow", () => {
  it("returns a character-creation result when login finds no characters", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    jest.spyOn(api, "post").mockResolvedValue({ token: "jwt-a", user });
    jest.spyOn(api, "get").mockResolvedValue([]);
    localStorage.setItem("rf_charId", "stale-char");

    const result = await new AuthService().login("demo", "password");

    expect(result).toEqual({
      ok: true,
      user,
      needsCharacterCreation: true
    });
    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      username: "demo",
      password: "password"
    });
    expect(api.get).toHaveBeenCalledWith("/users/user-a/characters");
    expect(localStorage.getItem("rf_userId")).toBe("user-a");
    expect(localStorage.getItem("rf_charId")).toBeNull();
  });

  it("keeps the existing login character path unchanged", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    jest.spyOn(api, "post").mockResolvedValue({ token: "jwt-a", user });
    jest.spyOn(api, "get").mockResolvedValue([character]);

    const result = await new AuthService().login("demo", "password");

    expect(result.ok).toBe(true);
    expect(result.user).toBe(user);
    expect(result.character).toBe(character);
    expect(result.needsCharacterCreation).toBeUndefined();
    expect(result.stats).toEqual({
      maxHp: 84,
      maxFp: 58,
      maxStamina: 114,
      lightDmg: 30,
      heavyDmg: 55,
      rollSpeed: 1.12
    });
    expect(localStorage.getItem("rf_charId")).toBe("char-a");
  });

  it("returns a character-creation result when resume has a valid token and no characters", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    api.setToken("jwt-a");
    const getSpy = jest.spyOn(api, "get")
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce([]);

    const result = await new AuthService().tryResume();

    expect(result).toEqual({
      ok: true,
      user,
      needsCharacterCreation: true
    });
    expect(getSpy).toHaveBeenNthCalledWith(1, "/auth/me");
    expect(getSpy).toHaveBeenNthCalledWith(2, "/users/user-a/characters");
    expect(localStorage.getItem("rf_charId")).toBeNull();
  });

  it("resumes a stored character id without listing characters", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    api.setToken("jwt-a");
    localStorage.setItem("rf_charId", "char-a");
    const getSpy = jest.spyOn(api, "get")
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(character);

    const result = await new AuthService().tryResume();

    expect(result.ok).toBe(true);
    expect(result.character).toBe(character);
    expect(getSpy).toHaveBeenNthCalledWith(1, "/auth/me");
    expect(getSpy).toHaveBeenNthCalledWith(2, "/characters/char-a");
    expect(getSpy).not.toHaveBeenCalledWith("/users/user-a/characters");
  });

  it("falls back to the character list when a stored resume character is stale", async () => {
    const { api, ApiError, AuthService } = await loadAuthServiceWithApi();
    api.setToken("jwt-a");
    localStorage.setItem("rf_charId", "stale-char");
    const getSpy = jest.spyOn(api, "get")
      .mockResolvedValueOnce(user)
      .mockRejectedValueOnce(new ApiError(404, {
        error: "Not Found",
        message: "Character was not found."
      }))
      .mockResolvedValueOnce([character]);

    const result = await new AuthService().tryResume();

    expect(result.ok).toBe(true);
    expect(result.character).toBe(character);
    expect(getSpy).toHaveBeenNthCalledWith(1, "/auth/me");
    expect(getSpy).toHaveBeenNthCalledWith(2, "/characters/stale-char");
    expect(getSpy).toHaveBeenNthCalledWith(3, "/users/user-a/characters");
    expect(localStorage.getItem("rf_charId")).toBe("char-a");
  });

  it("creates and selects a character", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    jest.spyOn(api, "post").mockResolvedValue(character);

    const result = await new AuthService().createCharacter({
      userId: "user-a",
      characterName: "Aster",
      origin: "Hearthmere",
      className: "Ranger",
      affinity: "Nature"
    });

    expect(api.post).toHaveBeenCalledWith("/characters", {
      userId: "user-a",
      characterName: "Aster",
      origin: "Hearthmere",
      className: "Ranger",
      affinity: "Nature"
    });
    expect(result.ok).toBe(true);
    expect(result.character).toBe(character);
    expect(result.stats.maxHp).toBe(84);
    expect(localStorage.getItem("rf_charId")).toBe("char-a");
  });

  it("surfaces character creation API failures", async () => {
    const { api, ApiError, AuthService } = await loadAuthServiceWithApi();
    jest.spyOn(api, "post").mockRejectedValue(new ApiError(400, {
      error: "Bad Request",
      message: "Invalid character origin."
    }));

    await expect(new AuthService().createCharacter({
      userId: "user-a",
      characterName: "Aster",
      origin: "Bad",
      className: "Ranger",
      affinity: "Nature"
    })).resolves.toEqual({
      ok: false,
      message: "Invalid character origin."
    });
  });

  it("surfaces character creation network failures", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    jest.spyOn(api, "post").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(new AuthService().createCharacter({
      userId: "user-a",
      characterName: "Aster",
      origin: "Hearthmere",
      className: "Ranger",
      affinity: "Nature"
    })).resolves.toEqual({
      ok: false,
      message: "Could not reach the server. Is the backend running?"
    });
  });
});

describe("AuthService XP persistence", () => {
  it("persists boss XP gains through the progression character route", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    const putSpy = jest.spyOn(api, "put").mockResolvedValue({
      character: {
        characterId: "char-a",
        xp: 150,
        level: 2
      }
    });

    await new AuthService().saveXpGain("char-a", 50, 100, 2);

    expect(putSpy).toHaveBeenCalledWith("/progression/characters/char-a", {
      xp: 150,
      level: 2
    });
  });

  it("claims quest completion rewards through the idempotent progression route", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    const rewardResult = {
      awarded: true,
      rewards: {
        xp: 35
      },
      quest: {
        questId: "hearthmere.tessa_gather",
        regionId: "hearthmere",
        title: "Fuel for the Emberwright",
        rewardXp: 35
      },
      character: {
        characterId: "char-a",
        xp: 125,
        level: 2
      },
      characterProgression: {
        previousLevel: 1,
        nextLevel: 2,
        previousXp: 90,
        nextXp: 125,
        xpAwarded: 35
      },
      questCompletion: {
        characterQuestCompletionId: "char_quest_completion-a",
        characterId: "char-a",
        questId: "hearthmere.tessa_gather",
        rewardXp: 35,
        awardedAt: "2026-06-07T00:00:00.000Z"
      }
    };
    jest.spyOn(api, "put").mockResolvedValue(rewardResult);

    await expect(
      new AuthService().claimQuestCompletionReward("char-a", "hearthmere.tessa_gather")
    ).resolves.toBe(rewardResult);

    expect(api.put).toHaveBeenCalledWith(
      "/progression/characters/char-a/quest-completions/hearthmere.tessa_gather"
    );
  });

  it("surfaces quest completion reward claim failures from the API", async () => {
    const { api, ApiError, AuthService } = await loadAuthServiceWithApi();
    const error = new ApiError(403, {
      error: "Forbidden",
      message: "Character does not belong to this user."
    });
    jest.spyOn(api, "put").mockRejectedValue(error);

    await expect(
      new AuthService().claimQuestCompletionReward("char-a", "hearthmere.tessa_gather")
    ).rejects.toBe(error);
  });

  it("encodes quest ids when claiming quest completion rewards", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    jest.spyOn(api, "put").mockResolvedValue({ awarded: false });

    await new AuthService().claimQuestCompletionReward("char-a", "hearthmere/special quest");

    expect(api.put).toHaveBeenCalledWith(
      "/progression/characters/char-a/quest-completions/hearthmere%2Fspecial%20quest"
    );
  });

  it("loads the ability catalog with optional filters", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    const abilityList = [{ abilityId: "ability_thornbind" }];
    jest.spyOn(api, "get").mockResolvedValue(abilityList);

    await expect(
      new AuthService().listAbilities({ className: "Ranger", affinity: "Nature" })
    ).resolves.toBe(abilityList);

    expect(api.get).toHaveBeenCalledWith("/abilities?className=Ranger&affinity=Nature");
  });

  it("loads character ability unlocks through the character route", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    const abilityList = [{ abilityId: "ability_thornbind" }];
    jest.spyOn(api, "get").mockResolvedValue(abilityList);

    await expect(
      new AuthService().getCharacterAbilities("char/a")
    ).resolves.toBe(abilityList);

    expect(api.get).toHaveBeenCalledWith("/characters/char%2Fa/abilities");
  });

  it("unlocks character abilities through the backend ability route", async () => {
    const { api, AuthService } = await loadAuthServiceWithApi();
    const unlockResult = {
      characterAbility: {
        characterId: "char-a",
        abilityId: "ability_thornbind"
      }
    };
    jest.spyOn(api, "post").mockResolvedValue(unlockResult);

    await expect(
      new AuthService().unlockCharacterAbility("char-a", "ability_thornbind")
    ).resolves.toBe(unlockResult);

    expect(api.post).toHaveBeenCalledWith(
      "/characters/char-a/unlock-ability",
      { abilityId: "ability_thornbind" }
    );
  });
});

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
});

import { describe, expect, it } from "@jest/globals";
import {
  affinityBonuses,
  allowedAffinities,
  allowedClasses,
  allowedOrigins,
  baseStats,
  calculateCharacterStats,
  classBonuses,
  createCharacterWorldSeed,
  originBonuses,
  previewStats,
  validateAffinity,
  validateCharacterName,
  validateClassName,
  validateOrigin
} from "../gameplay/characters/CharacterRules.js";

describe("CharacterRules", () => {
  it("mirrors the character creation catalog sizes", () => {
    expect(allowedOrigins).toHaveLength(8);
    expect(allowedClasses).toHaveLength(10);
    expect(allowedAffinities).toHaveLength(9);
    expect(baseStats).toEqual({
      hp: 100,
      strength: 5,
      intelligence: 5,
      agility: 5,
      faith: 5,
      endurance: 5,
      charisma: 5
    });
    expect(originBonuses.Mercenary).toEqual({ strength: 1, endurance: 2 });
    expect(classBonuses.Warrior).toEqual({ strength: 3, endurance: 2, hp: 15 });
    expect(affinityBonuses.Fire).toEqual({ strength: 1 });
  });

  it("calculates base, origin, class, affinity, and level stats", () => {
    expect(
      calculateCharacterStats({
        origin: "Exiled Noble",
        className: "Warrior",
        affinity: "Fire",
        level: 3
      })
    ).toEqual({
      hp: 135,
      strength: 9,
      intelligence: 6,
      agility: 5,
      faith: 5,
      endurance: 7,
      charisma: 7
    });
  });

  it("previews level-one stats only for complete valid choices", () => {
    expect(previewStats({ origin: "Exiled Noble", className: "Warrior", affinity: "Fire" }))
      .toMatchObject({ hp: 115, strength: 9, intelligence: 6 });
    expect(previewStats({ origin: "Exiled Noble", className: "Warrior" })).toBeNull();
    expect(previewStats({ origin: "Unknown", className: "Warrior", affinity: "Fire" })).toBeNull();
  });

  it("validates allowed rule values and character names", () => {
    expect(() => validateOrigin("Village Hunter")).not.toThrow();
    expect(() => validateClassName("Spellblade")).not.toThrow();
    expect(() => validateAffinity("Storm")).not.toThrow();
    expect(() => validateOrigin("Dragon")).toThrow("origin must be one of");
    expect(validateCharacterName("")).toBe("Character name is required.");
    expect(validateCharacterName("A")).toBe("Character name must be at least 2 characters.");
    expect(validateCharacterName("a".repeat(41))).toBe("Character name must be 40 characters or fewer.");
    expect(validateCharacterName("Mira Ashstep")).toBeNull();
  });

  it("creates deterministic positive integer world seeds from ids and names", () => {
    const seedFromId = createCharacterWorldSeed("char-001");
    const seedFromObjectId = createCharacterWorldSeed({
      characterId: "char-001",
      characterName: "Different Name"
    });
    const seedFromName = createCharacterWorldSeed({ characterName: "Mira Ashstep" });

    expect(Number.isInteger(seedFromId)).toBe(true);
    expect(seedFromId).toBeGreaterThan(0);
    expect(seedFromId).toBe(createCharacterWorldSeed("char-001"));
    expect(seedFromObjectId).toBe(seedFromId);
    expect(seedFromName).toBe(createCharacterWorldSeed({ name: "Mira Ashstep" }));
    expect(seedFromName).not.toBe(seedFromId);
  });
});

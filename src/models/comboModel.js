import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { abilities, characterAbilities } from "../db/schema.js";

const unlockedAbilityColumns = {
  characterAbilityId: characterAbilities.characterAbilityId,
  unlockedAt: characterAbilities.unlockedAt,
  abilityId: abilities.abilityId,
  name: abilities.name,
  className: abilities.className,
  affinity: abilities.affinity,
  abilityType: abilities.abilityType,
  power: abilities.power,
  comboTag: abilities.comboTag,
  requiredLevel: abilities.requiredLevel,
  description: abilities.description
};

export async function findUnlockedAbilitiesByCharacterId(characterId) {
  return db
    .select(unlockedAbilityColumns)
    .from(characterAbilities)
    .innerJoin(abilities, eq(characterAbilities.abilityId, abilities.abilityId))
    .where(eq(characterAbilities.characterId, characterId))
    .orderBy(asc(characterAbilities.unlockedAt));
}

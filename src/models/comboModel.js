import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { abilities, characterAbilities } from "../db/schema.js";
import { findAbilityDefinitionById } from "../content/index.js";

export async function findUnlockedAbilitiesByCharacterId(characterId) {
  const unlockRows = await db
    .select({
      id: characterAbilities.id,
      characterAbilityId: characterAbilities.id,
      unlockedAt: characterAbilities.unlockedAt,
      abilityId: abilities.abilityKey
    })
    .from(characterAbilities)
    .innerJoin(abilities, eq(characterAbilities.abilityId, abilities.id))
    .where(eq(characterAbilities.characterId, characterId))
    .orderBy(asc(characterAbilities.unlockedAt));

  return unlockRows
    .map((unlockRow) => {
      const ability = findAbilityDefinitionById(unlockRow.abilityId);

      if (!ability) {
        return null;
      }

      return {
        characterAbilityId: unlockRow.characterAbilityId,
        unlockedAt: unlockRow.unlockedAt,
        ...ability
      };
    })
    .filter(Boolean);
}

import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { abilities, characterAbilities } from "../db/schema.js";
import { ABILITY_DEFINITIONS, findAbilityDefinitionById } from "../content/index.js";

const characterAbilityColumns = {
  id: characterAbilities.id,
  characterAbilityId: characterAbilities.id,
  characterId: characterAbilities.characterId,
  abilityId: abilities.abilityKey,
  unlockedAt: characterAbilities.unlockedAt
};

export async function findAbilities(filters = {}) {
  return ABILITY_DEFINITIONS.filter((ability) => {
    if (filters.className !== undefined && ability.className !== filters.className) {
      return false;
    }

    if (filters.affinity !== undefined && ability.affinity !== filters.affinity) {
      return false;
    }

    return true;
  }).sort((left, right) => left.requiredLevel - right.requiredLevel);
}

export async function findAbilityById(abilityId) {
  return findAbilityDefinitionById(abilityId);
}

export async function findCharacterAbility(characterId, abilityId) {
  const abilityRow = await findAbilityRowByKey(abilityId);

  if (!abilityRow) {
    return null;
  }

  const result = await db
    .select(characterAbilityColumns)
    .from(characterAbilities)
    .innerJoin(abilities, eq(characterAbilities.abilityId, abilities.id))
    .where(
      and(
        eq(characterAbilities.characterId, characterId),
        eq(characterAbilities.abilityId, abilityRow.id)
      )
    )
    .limit(1);

  return result[0] || null;
}

export async function createCharacterAbility({ characterId, abilityId }) {
  const abilityRow = await findAbilityRowByKey(abilityId);

  const result = await db
    .insert(characterAbilities)
    .values({
      characterId,
      abilityId: abilityRow.id,
      unlockedAt: new Date().toISOString()
    })
    .returning({
      id: characterAbilities.id,
      characterAbilityId: characterAbilities.id,
      characterId: characterAbilities.characterId,
      unlockedAt: characterAbilities.unlockedAt
    });

  return {
    ...result[0],
    abilityId
  };
}

async function findAbilityRowByKey(abilityId) {
  const result = await db
    .select({ id: abilities.id })
    .from(abilities)
    .where(eq(abilities.abilityKey, abilityId))
    .limit(1);

  return result[0] || null;
}

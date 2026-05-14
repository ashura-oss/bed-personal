import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { abilities, characterAbilities } from "../db/schema.js";
import { generateId } from "../utils/id.js";

const abilityColumns = {
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

const characterAbilityColumns = {
  characterAbilityId: characterAbilities.characterAbilityId,
  characterId: characterAbilities.characterId,
  abilityId: characterAbilities.abilityId,
  unlockedAt: characterAbilities.unlockedAt
};

export async function findAbilities(filters = {}) {
  const conditions = [];

  if (filters.className !== undefined) {
    conditions.push(eq(abilities.className, filters.className));
  }

  if (filters.affinity !== undefined) {
    conditions.push(eq(abilities.affinity, filters.affinity));
  }

  const query = db.select(abilityColumns).from(abilities).orderBy(asc(abilities.requiredLevel));

  if (conditions.length === 0) {
    return query;
  }

  if (conditions.length === 1) {
    return query.where(conditions[0]);
  }

  return query.where(and(...conditions));
}

export async function findAbilityById(abilityId) {
  const result = await db
    .select(abilityColumns)
    .from(abilities)
    .where(eq(abilities.abilityId, abilityId))
    .limit(1);

  return result[0] || null;
}

export async function findCharacterAbility(characterId, abilityId) {
  const result = await db
    .select(characterAbilityColumns)
    .from(characterAbilities)
    .where(
      and(
        eq(characterAbilities.characterId, characterId),
        eq(characterAbilities.abilityId, abilityId)
      )
    )
    .limit(1);

  return result[0] || null;
}

export async function createCharacterAbility({ characterId, abilityId }) {
  const result = await db
    .insert(characterAbilities)
    .values({
      characterAbilityId: generateId("char_ability"),
      characterId,
      abilityId,
      unlockedAt: new Date().toISOString()
    })
    .returning(characterAbilityColumns);

  return result[0];
}

// Ability model functions read and save unlocked character abilities.
import { and, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterAbilities, characterInventory, characters } from "../db/schema.js";

// Find character ability.
export async function findCharacterAbility(characterId, abilityId) {
  const result = await db
    .select({
      characterAbilityId: characterAbilities.id,
      characterId: characterAbilities.characterId,
      abilityId: characterAbilities.abilityKey,
      unlockedAt: characterAbilities.unlockedAt
    })
    .from(characterAbilities)
    .where(
      and(
        eq(characterAbilities.characterId, characterId),
        eq(characterAbilities.abilityKey, abilityId)
      )
    )
    .limit(1);

  return result[0] || null;
}

// Find character ability rows by character id.
export async function findCharacterAbilityRowsByCharacterId(characterId) {
  return db
    .select({
      characterAbilityId: characterAbilities.id,
      characterId: characterAbilities.characterId,
      abilityId: characterAbilities.abilityKey,
      unlockedAt: characterAbilities.unlockedAt
    })
    .from(characterAbilities)
    .where(eq(characterAbilities.characterId, characterId));
}

// Create character ability.
export async function createCharacterAbility({ character, ability }) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const xpCost = Number(ability.xpCost || 0);
    const requiredItems = ability.requiredItems || [];
    let updatedCharacter = character;
    const spentItems = [];

    if (xpCost > 0) {
      const characterResult = await tx
        .update(characters)
        .set({
          xp: character.xp - xpCost
        })
        .where(eq(characters.id, character.characterId))
        .returning({
          characterId: characters.id,
          userId: characters.userId,
          characterName: characters.characterName,
          origin: characters.origin,
          className: characters.className,
          affinity: characters.affinity,
          level: characters.level,
          xp: characters.xp,
          hp: characters.hp,
          strength: characters.strength,
          intelligence: characters.intelligence,
          agility: characters.agility,
          faith: characters.faith,
          endurance: characters.endurance,
          charisma: characters.charisma,
          createdAt: characters.createdAt
        });

      updatedCharacter = characterResult[0] || character;
    }

    for (const requiredItem of requiredItems) {
      const inventoryResult = await tx
        .select({
          characterInventoryId: characterInventory.id,
          characterId: characterInventory.characterId,
          itemId: characterInventory.itemKey,
          quantity: characterInventory.quantity,
          acquiredAt: characterInventory.acquiredAt,
          updatedAt: characterInventory.updatedAt
        })
        .from(characterInventory)
        .where(
          and(
            eq(characterInventory.characterId, character.characterId),
            eq(characterInventory.itemKey, requiredItem.itemId)
          )
        )
        .limit(1);
      const inventoryItem = inventoryResult[0];
      const nextQuantity = inventoryItem.quantity - requiredItem.quantity;

      if (nextQuantity > 0) {
        await tx
          .update(characterInventory)
          .set({
            quantity: nextQuantity,
            updatedAt: now
          })
          .where(eq(characterInventory.id, inventoryItem.characterInventoryId));
      } else {
        await tx
          .delete(characterInventory)
          .where(eq(characterInventory.id, inventoryItem.characterInventoryId));
      }

      spentItems.push({
        itemId: requiredItem.itemId,
        quantity: requiredItem.quantity
      });
    }

    const result = await tx
      .insert(characterAbilities)
      .values({
        characterId: character.characterId,
        abilityKey: ability.abilityId,
        unlockedAt: now
      })
      .returning({
        characterAbilityId: characterAbilities.id,
        characterId: characterAbilities.characterId,
        unlockedAt: characterAbilities.unlockedAt
      });

    return {
      characterAbility: {
        ...result[0],
        abilityId: ability.abilityId
      },
      character: updatedCharacter,
      spent: {
        xp: xpCost,
        items: spentItems
      }
    };
  });
}

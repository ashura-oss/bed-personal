// Ability controller functions validate requests and prepare ability responses.
import * as abilityModel from "../models/abilityModel.js";
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import { ABILITY_DEFINITIONS, findAbilityDefinitionById } from "../constants/abilities.js";
import { validateAffinity, validateClassName } from "../utils/gameRules.js";

// ------------------------------------------------------------
// READ CONTROLLERS
// ------------------------------------------------------------

// Return fixed ability definitions, optionally filtered by class or affinity.
export async function getAbilities(req, res, next) {
  try {
    let className = req.query.className;
    let affinity = req.query.affinity;

    if (className !== undefined) {
      if (typeof className !== "string" || className.trim().length === 0) {
        return res.status(400).json({ message: "className must be a non-empty string." });
      }

      className = className.trim();
    }

    if (affinity !== undefined) {
      if (typeof affinity !== "string" || affinity.trim().length === 0) {
        return res.status(400).json({ message: "affinity must be a non-empty string." });
      }

      affinity = affinity.trim();
    }

    if (className !== undefined) {
      const classNameError = validateClassName(className);

      if (classNameError) {
        return res.status(400).json({ message: classNameError });
      }
    }

    if (affinity !== undefined) {
      const affinityError = validateAffinity(affinity);

      if (affinityError) {
        return res.status(400).json({ message: affinityError });
      }
    }

    const abilityList = ABILITY_DEFINITIONS.filter((ability) => {
      if (className !== undefined && ability.className !== className) {
        return false;
      }

      if (affinity !== undefined && ability.affinity !== affinity) {
        return false;
      }

      return true;
    }).sort((left, right) => left.requiredLevel - right.requiredLevel);

    res.locals.data = abilityList;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// CREATE AND ACTION CONTROLLERS
// ------------------------------------------------------------

// Unlock an ability after checking character level, class, affinity, and cost.
export async function unlockCharacterAbility(req, res, next) {
  try {
    const characterId = Number(req.params.characterId);

    if (!Number.isInteger(characterId) || characterId < 1) {
      return res.status(400).json({ message: "characterId must be a positive integer id." });
    }

    if (typeof req.body?.abilityId !== "string" || req.body.abilityId.trim().length === 0) {
      return res.status(400).json({ message: "abilityId is required." });
    }

    const abilityId = req.body.abilityId.trim();
    const character = res.locals.character;

    const ability = findAbilityDefinitionById(abilityId);

    if (!ability) {
      return res.status(404).json({ message: "Ability was not found." });
    }

    if (!validateAbilityUnlock(character, ability, res)) {
      return;
    }

    const existingUnlock = await abilityModel.findCharacterAbility(characterId, abilityId);

    if (existingUnlock) {
      return res.status(409).json({ message: "Character already unlocked this ability." });
    }

    const hasAbilityCost = await validateAbilityCost(character, ability, res);

    if (!hasAbilityCost) {
      return;
    }

    const unlockResult = await abilityModel.createCharacterAbility({ character, ability });

    res.locals.data = {
      characterAbility: unlockResult.characterAbility,
      ability,
      character: unlockResult.character,
      spent: unlockResult.spent
    };
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// READ CONTROLLERS
// ------------------------------------------------------------

// Return abilities already unlocked by one character.
export async function getCharacterAbilities(req, res, next) {
  try {
    const unlockedAbilityRows = await abilityModel.findCharacterAbilityRowsByCharacterId(
      res.locals.character.characterId
    );
    const unlockedAbilities = unlockedAbilityRows
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
      .filter(Boolean)
      .sort((left, right) => left.requiredLevel - right.requiredLevel);

    res.locals.data = unlockedAbilities;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// PRIVATE HELPERS
// ------------------------------------------------------------

// Validate XP and item costs before unlocking an ability.
async function validateAbilityCost(character, ability, res) {
  const xpCost = Number(ability.xpCost || 0);

  if (character.xp < xpCost) {
    res.status(400).json({ message: `Character needs ${xpCost} XP to unlock this ability.` });
    return false;
  }

  for (const requiredItem of ability.requiredItems || []) {
    const inventoryItem = await characterInventoryModel.findInventoryItemByCharacterId(
      character.characterId,
      requiredItem.itemId
    );

    if (!inventoryItem || inventoryItem.quantity < requiredItem.quantity) {
      res.status(400).json({ message: `Character needs ${requiredItem.quantity} ${requiredItem.itemId} to unlock this ability.` });
      return false;
    }
  }

  return true;
}

// Validate level, class, and affinity requirements for an ability.
function validateAbilityUnlock(character, ability, res) {
  if (character.level < ability.requiredLevel) {
    res.status(400).json({ message: `Character level ${character.level} is too low for this ability. Required level is ${ability.requiredLevel}.` });
    return false;
  }

  if (ability.className !== null && ability.className !== character.className) {
    res.status(400).json({ message: `Ability requires className ${ability.className}.` });
    return false;
  }

  if (ability.affinity !== null && ability.affinity !== character.affinity) {
    res.status(400).json({ message: `Ability requires affinity ${ability.affinity}.` });
    return false;
  }

  return true;
}

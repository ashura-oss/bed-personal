// Combat controller functions create sessions, resolve turns, and apply rewards.
// Combat rules calculate the turn; models save sessions, logs, rewards, and story effects.
import { findAbilityDefinitionById } from "../constants/abilities.js";
import { findEnemyDefinitionById } from "../constants/enemies.js";
import { findMapNodeDefinitionByEnemyId } from "../constants/mapNodes.js";
import { findQuestDefinitionById } from "../constants/quests.js";
import { findStoryMilestoneByEnemyId } from "../constants/storyMilestones.js";
import * as abilityModel from "../models/abilityModel.js";
import * as adventureModel from "../models/adventureModel.js";
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import * as characterModel from "../models/characterModel.js";
import * as combatModel from "../models/combatModel.js";
import * as mapModel from "../models/mapModel.js";
import * as stateModel from "../models/stateModel.js";
import * as storyModel from "../models/storyModel.js";
import * as userModel from "../models/userModel.js";
import { resolveCombatTurn } from "../utils/combatRules.js";
import { applyEquipmentBonuses } from "../utils/equipmentRules.js";
import { buildCharacterProgression, buildUserProgression } from "../utils/leveling.js";
import {
  createHttpError,
  getOptionalString,
  getRequiredId,
  getRequiredIdParam,
  getRequiredString,
  sendErrorResponse
} from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Gets one combat session together with its turn logs.
export async function getCombatSession(req, res) {
  try {
    const combatSessionId = getRequiredIdParam(req.params, "combatSessionId");
    const combatSession = await combatModel.findCombatSessionById(combatSessionId);

    if (!combatSession) {
      throw createHttpError(404, "Not Found", "Combat session was not found.");
    }

    const turnLogs = await combatModel.findCombatLogsBySessionId(combatSessionId);

    return res.status(200).json({
      message: "Combat session retrieved.",
      data: {
        combatSession,
        turnLogs
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Starts one combat session against an enemy or boss.
export async function postCombatSession(req, res) {
  try {
    const characterId = getRequiredId(req.body, "characterId");
    const enemyId = getRequiredString(req.body, "enemyId");
    const requestedQuestId = getOptionalString(req.body, "questId") ?? null;
    let nodeId = getOptionalString(req.body, "nodeId") ?? null;
    const character = await findRequiredCharacter(characterId);
    const enemy = findEnemyDefinitionById(enemyId);
    const activeCombatSession = await combatModel.findActiveCombatSessionByCharacterId(
      character.characterId
    );

    if (activeCombatSession) {
      throw createHttpError(409, "Conflict", "Character already has an active combat session.");
    }

    if (!enemy) {
      throw createHttpError(404, "Not Found", "Enemy definition was not found.");
    }

    const questId = requestedQuestId ?? enemy.questId ?? null;

    if (questId !== null && !findQuestDefinitionById(questId)) {
      throw createHttpError(404, "Not Found", "Quest was not found.");
    }

    if (enemy.isBoss === 1) {
      const bossNode = await findBossNodeForEnemy(enemy.enemyId);
      const location = await mapModel.findCharacterLocation(character.characterId);

      if (!location || location.nodeId !== bossNode.nodeId) {
        throw createHttpError(
          403,
          "Forbidden",
          `Character must be at ${bossNode.nodeId} before starting this boss combat.`
        );
      }

      if (nodeId !== null && nodeId !== bossNode.nodeId) {
        throw createHttpError(400, "Bad Request", "nodeId does not match this boss encounter.");
      }

      nodeId = bossNode.nodeId;

      const bossState = await stateModel.findBossStateByCharacterId(
        character.characterId,
        enemy.enemyId
      );

      if (bossState?.status === "defeated") {
        throw createHttpError(409, "Conflict", "Boss has already been defeated.");
      }

      await stateModel.upsertBossState({
        characterId: character.characterId,
        bossId: enemy.enemyId,
        status: "active",
        attempts: (bossState?.attempts || 0) + 1,
        defeats: bossState?.defeats || 0,
        bestTimeSeconds: bossState?.bestTimeSeconds ?? null,
        lastOutcome: "started"
      });
    }

    const combatCharacter = await buildCombatCharacter(character);
    const combatSession = await combatModel.createCombatSession({
      characterId: character.characterId,
      enemyId,
      questId,
      regionId: enemy.regionId,
      nodeId,
      playerHp: combatCharacter.hp,
      enemyHp: enemy.maxHp
    });

    return res.status(201).json({
      message: "Combat session started.",
      data: {
        combatSession,
        enemy,
        equipmentBonuses: combatCharacter.equipmentBonuses
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Resolves one player action and saves resulting turn logs.
export async function postCombatTurn(req, res) {
  try {
    const combatSessionId = getRequiredIdParam(req.params, "combatSessionId");
    const characterId = getRequiredId(req.body, "characterId");
    const actionType = getRequiredString(req.body, "actionType");
    const abilityId = getOptionalString(req.body, "abilityId") ?? null;
    const combatSession = await combatModel.findCombatSessionById(combatSessionId);

    if (!combatSession) {
      throw createHttpError(404, "Not Found", "Combat session was not found.");
    }

    const character = await findRequiredCharacter(characterId);

    if (combatSession.characterId !== character.characterId) {
      throw createHttpError(403, "Forbidden", "Combat session does not belong to this character.");
    }

    const enemy = findEnemyDefinitionById(combatSession.enemyId);

    if (!enemy) {
      throw createHttpError(404, "Not Found", "Enemy definition was not found.");
    }

    const combatCharacter = await buildCombatCharacter(character);
    const ability = abilityId === null ? null : await findUnlockedAbility(character.characterId, abilityId);
    const turnResult = resolveCombatTurn({
      session: combatSession,
      character: combatCharacter,
      enemy,
      actionType,
      ability
    });

    if (turnResult.error) {
      throw createHttpError(turnResult.error.status, "Bad Request", turnResult.error.message);
    }

    const savedTurn = await combatModel.saveCombatTurn({
      combatSessionId,
      sessionUpdates: turnResult.sessionUpdates,
      turnLogs: turnResult.turnLogs
    });
    let rewardResult = null;

    if (savedTurn.session.status === "won") {
      rewardResult = await awardCombatWin({ character, enemy, combatSession: savedTurn.session });
    }

    if (savedTurn.session.status === "lost" && enemy.isBoss === 1) {
      const bossState = await stateModel.findBossStateByCharacterId(
        character.characterId,
        enemy.enemyId
      );

      await stateModel.upsertBossState({
        characterId: character.characterId,
        bossId: enemy.enemyId,
        status: "active",
        attempts: bossState?.attempts || 1,
        defeats: bossState?.defeats || 0,
        bestTimeSeconds: bossState?.bestTimeSeconds ?? null,
        lastOutcome: "failure"
      });
    }

    return res.status(200).json({
      message: "Combat turn resolved.",
      data: {
        combatSession: savedTurn.session,
        turnLogs: savedTurn.turnLogs,
        rewardResult,
        equipmentBonuses: combatCharacter.equipmentBonuses
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// Finds the map node connected to a boss enemy.
// Boss sessions use this to make sure the fight is started from the correct map location.
async function findBossNodeForEnemy(enemyId) {
  const bossNode = findMapNodeDefinitionByEnemyId(enemyId);

  if (!bossNode) {
    throw createHttpError(404, "Not Found", "Boss map node was not found.");
  }

  return bossNode;
}

// Applies equipment bonuses before combat damage is calculated.
// The returned copy of the character includes weapon range, defence, and stat bonuses.
async function buildCombatCharacter(character) {
  const equipment = await characterInventoryModel.findEquipmentByCharacterId(character.characterId);

  return applyEquipmentBonuses(character, equipment);
}

// Finds an ability only if the character already unlocked it.
// The fixed ability definition is returned after the saved unlock row is confirmed.
async function findUnlockedAbility(characterId, abilityId) {
  const unlockedAbility = await abilityModel.findCharacterAbility(characterId, abilityId);
  const ability = unlockedAbility ? findAbilityDefinitionById(abilityId) : null;

  if (!ability) {
    throw createHttpError(403, "Forbidden", "Character has not unlocked this ability.");
  }

  return ability;
}

// Applies XP, gold, adventure log, and story updates after a combat win.
// Boss wins can also apply story milestones and update saved world state.
async function awardCombatWin({ character, enemy, combatSession }) {
  const user = await userModel.findUserById(character.userId);

  if (!user) {
    throw createHttpError(404, "Not Found", "User was not found.");
  }

  const xpGained = Number(enemy.xpReward || 0);
  const goldGained = Number(enemy.goldReward || 0);
  const characterProgression = buildCharacterProgression(character, xpGained);
  const userProgression = buildUserProgression(user, xpGained, goldGained);
  const questId = combatSession.questId || `combat.${enemy.enemyId}`;
  const savedAttempt = await adventureModel.recordAdventureAttempt({
    userId: character.userId,
    characterId: character.characterId,
    questId,
    outcome: "success",
    xpGained,
    goldGained,
    resultText: `${character.characterName} defeated ${enemy.name}.`,
    characterUpdates: characterProgression.updates,
    userUpdates: userProgression.updates
  });
  const storyResult =
    enemy.isBoss === 1
      ? await storyModel.applyCombatVictoryStory({
          characterId: character.characterId,
          enemy,
          questId,
          milestone: findStoryMilestoneByEnemyId(enemy.enemyId)
        })
      : null;

  return {
    rewards: {
      xp: xpGained,
      gold: goldGained
    },
    characterProgression: characterProgression.summary,
    userProgression: userProgression.summary,
    character: savedAttempt.character,
    user: savedAttempt.user,
    adventureLog: savedAttempt.adventureLog,
    storyResult
  };
}

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}

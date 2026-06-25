import * as abilityModel from "../models/abilityModel.js";
import * as adventureModel from "../models/adventureModel.js";
import * as bossStateModel from "../models/bossStateModel.js";
import * as characterEquipmentModel from "../models/characterEquipmentModel.js";
import * as combatModel from "../models/combatModel.js";
import * as mapModel from "../models/mapModel.js";
import * as storyModel from "../models/storyModel.js";
import * as userModel from "../models/userModel.js";
import { findAbilityDefinitionById } from "../constants/abilities.js";
import { findEnemyDefinitionById } from "../constants/enemies.js";
import { findMapNodeDefinitionByEnemyId } from "../constants/mapNodes.js";
import { findQuestDefinitionById } from "../constants/quests.js";
import { findStoryMilestoneByEnemyId } from "../constants/storyMilestones.js";
import { applyEquipmentBonuses } from "../utils/equipmentRules.js";
import { resolveCombatTurn } from "../utils/combatRules.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";
import { buildCharacterProgression, buildUserProgression } from "../utils/leveling.js";

export async function postCombatSession(req, res, next) {
  try {
    const character = res.locals.character;

    if (typeof req.body.enemyId !== "string" || req.body.enemyId.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "enemyId is required and must be a non-empty string.");
    }

    if (req.body.questId !== undefined && (typeof req.body.questId !== "string" || req.body.questId.trim().length === 0)) {
      throw createHttpError(400, "Bad Request", "questId must be a non-empty string when provided.");
    }

    if (req.body.nodeId !== undefined && (typeof req.body.nodeId !== "string" || req.body.nodeId.trim().length === 0)) {
      throw createHttpError(400, "Bad Request", "nodeId must be a non-empty string when provided.");
    }

    const enemyId = req.body.enemyId.trim();
    const requestedQuestId = req.body.questId === undefined ? null : req.body.questId.trim();
    let nodeId = req.body.nodeId === undefined ? null : req.body.nodeId.trim();
    const enemy = findEnemyDefinitionById(enemyId);
    const activeCombatSession = await combatModel.findActiveCombatSessionByCharacterId(
      character.characterId
    );

    if (activeCombatSession) {
      throw createHttpError(
        409,
        "Conflict",
        "Character already has an active combat session.",
        { combatSessionId: activeCombatSession.combatSessionId }
      );
    }

    if (!enemy) {
      throw createHttpError(404, "Not Found", "Enemy definition was not found.");
    }

    const questId = requestedQuestId ?? enemy.questId ?? null;

    if (questId !== null) {
      const quest = findQuestDefinitionById(questId);

      if (!quest) {
        throw createHttpError(404, "Not Found", "Quest was not found.");
      }
    }

    if (enemy.isBoss === 1) {
      const bossNode = await findBossNodeForEnemy(enemy.enemyId);
      const location = await mapModel.findCharacterLocation(character.characterId);

      if (!location || location.nodeId !== bossNode.nodeId) {
        throw createHttpError(
          400,
          "Bad Request",
          `Character must be at ${bossNode.nodeId} before starting this boss combat.`
        );
      }

      if (nodeId !== null && nodeId !== bossNode.nodeId) {
        throw createHttpError(400, "Bad Request", "nodeId does not match this boss encounter.");
      }

      nodeId = bossNode.nodeId;

      const bossState = await bossStateModel.findBossStateByCharacterId(
        character.characterId,
        enemy.enemyId
      );

      if (bossState?.status === "defeated") {
        throw createHttpError(409, "Conflict", "Boss has already been defeated.");
      }

      await bossStateModel.upsertBossState({
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

    res.locals.data = {
      combatSession,
      enemy,
      equipmentBonuses: combatCharacter.equipmentBonuses
    };
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getCombatSession(req, res, next) {
  try {
    const combatSessionId = Number(req.params.combatSessionId);

    if (!Number.isInteger(combatSessionId) || combatSessionId < 1) {
      throw createHttpError(400, "Bad Request", "combatSessionId must be a positive integer id.");
    }

    const combatSession = await combatModel.findCombatSessionById(combatSessionId);

    if (!combatSession) {
      throw createHttpError(404, "Not Found", "Combat session was not found.");
    }

    const turnLogs = await combatModel.findCombatLogsBySessionId(combatSessionId);

    res.locals.data = {
      combatSession,
      turnLogs
    };
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function postCombatTurn(req, res, next) {
  try {
    const combatSessionId = Number(req.params.combatSessionId);

    if (!Number.isInteger(combatSessionId) || combatSessionId < 1) {
      throw createHttpError(400, "Bad Request", "combatSessionId must be a positive integer id.");
    }

    if (typeof req.body.actionType !== "string" || req.body.actionType.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "actionType is required and must be a non-empty string.");
    }

    if (req.body.abilityId !== undefined && (typeof req.body.abilityId !== "string" || req.body.abilityId.trim().length === 0)) {
      throw createHttpError(400, "Bad Request", "abilityId must be a non-empty string when provided.");
    }

    const actionType = req.body.actionType.trim();
    const abilityId = req.body.abilityId === undefined ? null : req.body.abilityId.trim();
    const combatSession = await combatModel.findCombatSessionById(combatSessionId);

    if (!combatSession) {
      throw createHttpError(404, "Not Found", "Combat session was not found.");
    }

    const character = res.locals.character;

    if (combatSession.characterId !== character.characterId) {
      throw createHttpError(400, "Bad Request", "Combat session does not belong to this character.");
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
      const bossState = await bossStateModel.findBossStateByCharacterId(
        character.characterId,
        enemy.enemyId
      );

      await bossStateModel.upsertBossState({
        characterId: character.characterId,
        bossId: enemy.enemyId,
        status: "active",
        attempts: bossState?.attempts || 1,
        defeats: bossState?.defeats || 0,
        bestTimeSeconds: bossState?.bestTimeSeconds ?? null,
        lastOutcome: "failure"
      });
    }

    res.locals.data = {
      combatSession: savedTurn.session,
      turnLogs: savedTurn.turnLogs,
      rewardResult,
      equipmentBonuses: combatCharacter.equipmentBonuses
    };
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

async function findBossNodeForEnemy(enemyId) {
  const bossNode = findMapNodeDefinitionByEnemyId(enemyId);

  if (!bossNode) {
    throw createHttpError(404, "Not Found", "Boss map node was not found.");
  }

  return bossNode;
}

async function buildCombatCharacter(character) {
  const equipment = await characterEquipmentModel.findEquipmentByCharacterId(character.characterId);

  return applyEquipmentBonuses(character, equipment);
}

async function findUnlockedAbility(characterId, abilityId) {
  const unlockedAbility = await abilityModel.findCharacterAbility(characterId, abilityId);
  const ability = unlockedAbility ? findAbilityDefinitionById(abilityId) : null;

  if (!ability) {
    throw createHttpError(400, "Bad Request", "Character has not unlocked this ability.");
  }

  return ability;
}

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

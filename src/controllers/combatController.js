// Combat controller functions create sessions, resolve turns, and apply rewards.
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
import { buildCharacterProgression, buildUserProgression } from "../utils/leveling.js";

// Start a new session after validating enemy, quest, and boss location rules.
export async function postCombatSession(req, res, next) {
  try {
    const character = res.locals.character;

    if (typeof req.body.enemyId !== "string" || req.body.enemyId.trim().length === 0) {
      return res.status(400).json({ message: "enemyId is required and must be a non-empty string." });
    }

    if (req.body.questId !== undefined && (typeof req.body.questId !== "string" || req.body.questId.trim().length === 0)) {
      return res.status(400).json({ message: "questId must be a non-empty string when provided." });
    }

    if (req.body.nodeId !== undefined && (typeof req.body.nodeId !== "string" || req.body.nodeId.trim().length === 0)) {
      return res.status(400).json({ message: "nodeId must be a non-empty string when provided." });
    }

    const enemyId = req.body.enemyId.trim();
    const requestedQuestId = req.body.questId === undefined ? null : req.body.questId.trim();
    let nodeId = req.body.nodeId === undefined ? null : req.body.nodeId.trim();
    const enemy = findEnemyDefinitionById(enemyId);
    const activeCombatSession = await combatModel.findActiveCombatSessionByCharacterId(
      character.characterId
    );

    if (activeCombatSession) {
      return res.status(409).json({ message: "Character already has an active combat session." });
    }

    if (!enemy) {
      return res.status(404).json({ message: "Enemy definition was not found." });
    }

    const questId = requestedQuestId ?? enemy.questId ?? null;

    if (questId !== null) {
      const quest = findQuestDefinitionById(questId);

      if (!quest) {
        return res.status(404).json({ message: "Quest was not found." });
      }
    }

    if (enemy.isBoss === 1) {
      const bossNode = await findBossNodeForEnemy(enemy.enemyId, res);

      if (!bossNode) {
        return;
      }

      const location = await mapModel.findCharacterLocation(character.characterId);

      if (!location || location.nodeId !== bossNode.nodeId) {
        return res.status(400).json({ message: `Character must be at ${bossNode.nodeId} before starting this boss combat.` });
      }

      if (nodeId !== null && nodeId !== bossNode.nodeId) {
        return res.status(400).json({ message: "nodeId does not match this boss encounter." });
      }

      nodeId = bossNode.nodeId;

      const bossState = await bossStateModel.findBossStateByCharacterId(
        character.characterId,
        enemy.enemyId
      );

      if (bossState?.status === "defeated") {
        return res.status(409).json({ message: "Boss has already been defeated." });
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
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Read current session state together with previous turn logs.
export async function getCombatSession(req, res, next) {
  try {
    const combatSessionId = Number(req.params.combatSessionId);

    if (!Number.isInteger(combatSessionId) || combatSessionId < 1) {
      return res.status(400).json({ message: "combatSessionId must be a positive integer id." });
    }

    const combatSession = await combatModel.findCombatSessionById(combatSessionId);

    if (!combatSession) {
      return res.status(404).json({ message: "Combat session was not found." });
    }

    const turnLogs = await combatModel.findCombatLogsBySessionId(combatSessionId);

    res.locals.data = {
      combatSession,
      turnLogs
    };
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Resolve one player action and save resulting turn logs.
export async function postCombatTurn(req, res, next) {
  try {
    const combatSessionId = Number(req.params.combatSessionId);

    if (!Number.isInteger(combatSessionId) || combatSessionId < 1) {
      return res.status(400).json({ message: "combatSessionId must be a positive integer id." });
    }

    if (typeof req.body.actionType !== "string" || req.body.actionType.trim().length === 0) {
      return res.status(400).json({ message: "actionType is required and must be a non-empty string." });
    }

    if (req.body.abilityId !== undefined && (typeof req.body.abilityId !== "string" || req.body.abilityId.trim().length === 0)) {
      return res.status(400).json({ message: "abilityId must be a non-empty string when provided." });
    }

    const actionType = req.body.actionType.trim();
    const abilityId = req.body.abilityId === undefined ? null : req.body.abilityId.trim();
    const combatSession = await combatModel.findCombatSessionById(combatSessionId);

    if (!combatSession) {
      return res.status(404).json({ message: "Combat session was not found." });
    }

    const character = res.locals.character;

    if (combatSession.characterId !== character.characterId) {
      return res.status(400).json({ message: "Combat session does not belong to this character." });
    }

    const enemy = findEnemyDefinitionById(combatSession.enemyId);

    if (!enemy) {
      return res.status(404).json({ message: "Enemy definition was not found." });
    }

    const combatCharacter = await buildCombatCharacter(character);
    const ability = abilityId === null ? null : await findUnlockedAbility(character.characterId, abilityId, res);

    if (abilityId !== null && !ability) {
      return;
    }

    const turnResult = resolveCombatTurn({
      session: combatSession,
      character: combatCharacter,
      enemy,
      actionType,
      ability
    });

    if (turnResult.error) {
      return res.status(turnResult.error.status).json({ message: turnResult.error.message });
    }

    const savedTurn = await combatModel.saveCombatTurn({
      combatSessionId,
      sessionUpdates: turnResult.sessionUpdates,
      turnLogs: turnResult.turnLogs
    });
    let rewardResult = null;

    if (savedTurn.session.status === "won") {
      rewardResult = await awardCombatWin({ character, enemy, combatSession: savedTurn.session, res });

      if (!rewardResult) {
        return;
      }
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
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Private helpers keep the controller flow readable.
async function findBossNodeForEnemy(enemyId, res) {
  const bossNode = findMapNodeDefinitionByEnemyId(enemyId);

  if (!bossNode) {
    res.status(404).json({ message: "Boss map node was not found." });
    return null;
  }

  return bossNode;
}

// Build combat character.
async function buildCombatCharacter(character) {
  const equipment = await characterEquipmentModel.findEquipmentByCharacterId(character.characterId);

  return applyEquipmentBonuses(character, equipment);
}

// Find unlocked ability.
async function findUnlockedAbility(characterId, abilityId, res) {
  const unlockedAbility = await abilityModel.findCharacterAbility(characterId, abilityId);
  const ability = unlockedAbility ? findAbilityDefinitionById(abilityId) : null;

  if (!ability) {
    res.status(400).json({ message: "Character has not unlocked this ability." });
    return null;
  }

  return ability;
}

// Apply XP, gold, adventure log, and story updates after a combat win.
async function awardCombatWin({ character, enemy, combatSession, res }) {
  const user = await userModel.findUserById(character.userId);

  if (!user) {
    res.status(404).json({ message: "User was not found." });
    return null;
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

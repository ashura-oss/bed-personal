// Enemy controller functions return fixed enemy and boss data.
// Enemy rows are not stored in the database because they are fixed game definitions.
import { ENEMY_DEFINITIONS, findEnemyDefinitionById } from "../constants/enemies.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// ENEMY LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets enemy definitions, optionally filtered by region or boss flag.
export async function getEnemies(_req, res, next) {
  try {
    const { regionId, isBoss } = res.locals;

    res.locals.data = ENEMY_DEFINITIONS.filter((enemy) => {
      if (regionId !== undefined && enemy.regionId !== regionId) {
        return false;
      }

      if (isBoss !== undefined && enemy.isBoss !== isBoss) {
        return false;
      }

      return true;
    }).sort((left, right) => left.level - right.level);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one enemy definition by id.
export async function getEnemyById(_req, res, next) {
  try {
    const enemy = findEnemyDefinitionById(res.locals.enemyId);

    if (!enemy) {
      throw createHttpError(404, "Not Found", "Enemy definition was not found.");
    }

    res.locals.data = enemy;
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

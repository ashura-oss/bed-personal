// Enemy controller functions return fixed enemy and boss data.
import { ENEMY_DEFINITIONS, findEnemyDefinitionById } from "../constants/enemies.js";
import { createError, sendError } from "../utils/errorCode.js";

// Get enemies.
export async function getEnemies(req, res, next) {
  try {
    let regionId = req.query.regionId;
    const isBoss = readOptionalBinaryQuery(req.query, "isBoss");

    if (regionId !== undefined) {
      if (typeof regionId !== "string" || regionId.trim().length === 0) {
        throw createError(400, "Bad Request", "regionId must be a non-empty string.");
      }

      regionId = regionId.trim();
    }

    const enemies = ENEMY_DEFINITIONS.filter((enemy) => {
      if (regionId !== undefined && enemy.regionId !== regionId) {
        return false;
      }

      if (isBoss !== undefined && enemy.isBoss !== isBoss) {
        return false;
      }

      return true;
    }).sort((left, right) => left.level - right.level);

    res.locals.data = enemies;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Read one enemy definition by id.
export async function getEnemyById(req, res, next) {
  try {
    const enemy = findEnemyDefinitionById(req.params.enemyId);

    if (!enemy) {
      throw createError(404, "Not Found", "Enemy definition was not found.");
    }

    res.locals.data = enemy;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Read optional binary query.
function readOptionalBinaryQuery(query, fieldName) {
  const value = query?.[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (value !== "0" && value !== "1") {
    throw createError(400, "Bad Request", `${fieldName} query must be 0 or 1.`);
  }

  return Number(value);
}

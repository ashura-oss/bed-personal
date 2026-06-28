// Enemy controller functions return fixed enemy and boss data.
// Enemy rows are not stored in the database because they are fixed game definitions.
import { ENEMY_DEFINITIONS, findEnemyDefinitionById } from "../constants/enemies.js";
import { createHttpError, getOptionalString, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Gets enemy definitions, optionally filtered by region or boss flag.
export async function getEnemies(req, res) {
  try {
    const regionId = getOptionalString(req.query, "regionId");
    const isBoss = readOptionalBinaryQuery(req.query, "isBoss");
    const enemies = ENEMY_DEFINITIONS.filter((enemy) => {
      if (regionId !== undefined && enemy.regionId !== regionId) {
        return false;
      }

      if (isBoss !== undefined && enemy.isBoss !== isBoss) {
        return false;
      }

      return true;
    }).sort((left, right) => left.level - right.level);

    return res.status(200).json({
      message: "Enemies retrieved.",
      data: enemies
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one enemy definition by id.
export async function getEnemyById(req, res) {
  try {
    const enemy = findEnemyDefinitionById(req.params.enemyId);

    if (!enemy) {
      throw createHttpError(404, "Not Found", "Enemy definition was not found.");
    }

    return res.status(200).json({
      message: "Enemy retrieved.",
      data: enemy
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// Reads optional 0/1 query values.
// This is used for filters such as isBoss, where only 0 or 1 is valid.
function readOptionalBinaryQuery(query, fieldName) {
  const value = query?.[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (value !== "0" && value !== "1") {
    throw createHttpError(400, "Bad Request", `${fieldName} query must be 0 or 1.`);
  }

  return Number(value);
}

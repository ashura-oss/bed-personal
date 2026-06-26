// Enemy controller functions return fixed enemy and boss data.
import { ENEMY_DEFINITIONS, findEnemyDefinitionById } from "../constants/enemies.js";

// Get enemies.
export async function getEnemies(req, res, next) {
  try {
    let regionId = req.query.regionId;
    const isBoss = readOptionalBinaryQuery(req.query, "isBoss", res);

    if (isBoss === null) {
      return;
    }

    if (regionId !== undefined) {
      if (typeof regionId !== "string" || regionId.trim().length === 0) {
        return res.status(400).json({ message: "regionId must be a non-empty string." });
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
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Read one enemy definition by id.
export async function getEnemyById(req, res, next) {
  try {
    const enemy = findEnemyDefinitionById(req.params.enemyId);

    if (!enemy) {
      return res.status(404).json({ message: "Enemy definition was not found." });
    }

    res.locals.data = enemy;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Read optional binary query.
function readOptionalBinaryQuery(query, fieldName, res) {
  const value = query?.[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (value !== "0" && value !== "1") {
    res.status(400).json({ message: `${fieldName} query must be 0 or 1.` });
    return null;
  }

  return Number(value);
}

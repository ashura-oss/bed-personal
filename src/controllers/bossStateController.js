import * as bossStateModel from "../models/bossStateModel.js";
import { hasEnemyDefinition } from "../constants/enemies.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

export async function putBossState(req, res, next) {
  try {
    const character = res.locals.character;
    const status = req.body?.status;
    const attempts = req.body?.attempts;
    const defeats = req.body?.defeats;
    const bestTimeSeconds = req.body?.bestTimeSeconds;
    const lastOutcome = req.body?.lastOutcome;

    if (!hasEnemyDefinition(req.params.bossId)) {
      throw createHttpError(404, "Not Found", "Enemy or boss definition was not found.");
    }

    if (status !== undefined && (typeof status !== "string" || status.trim().length === 0)) {
      throw createHttpError(400, "Bad Request", "status must be a non-empty string.");
    }

    if (attempts !== undefined && (!Number.isInteger(attempts) || attempts < 0)) {
      throw createHttpError(400, "Bad Request", "attempts must be a non-negative integer.");
    }

    if (defeats !== undefined && (!Number.isInteger(defeats) || defeats < 0)) {
      throw createHttpError(400, "Bad Request", "defeats must be a non-negative integer.");
    }

    if (
      bestTimeSeconds !== undefined &&
      bestTimeSeconds !== null &&
      (typeof bestTimeSeconds !== "number" ||
        Number.isNaN(bestTimeSeconds) ||
        !Number.isFinite(bestTimeSeconds))
    ) {
      throw createHttpError(400, "Bad Request", "bestTimeSeconds must be a finite number.");
    }

    if (lastOutcome !== undefined && (typeof lastOutcome !== "string" || lastOutcome.trim().length === 0)) {
      throw createHttpError(400, "Bad Request", "lastOutcome must be a non-empty string.");
    }

    const bossState = await bossStateModel.upsertBossState({
      characterId: character.characterId,
      bossId: req.params.bossId,
      status: status?.trim(),
      attempts,
      defeats,
      bestTimeSeconds,
      lastOutcome: lastOutcome?.trim()
    });

    res.locals.data = bossState;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

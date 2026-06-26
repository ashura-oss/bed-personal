// Boss state controller functions save boss progress for a character.
import * as bossStateModel from "../models/bossStateModel.js";
import { hasEnemyDefinition } from "../constants/enemies.js";

// ------------------------------------------------------------
// SAVE CONTROLLERS
// ------------------------------------------------------------

// Save one character's progress against a boss.
export async function putBossState(req, res, next) {
  try {
    const character = res.locals.character;
    const status = req.body?.status;
    const attempts = req.body?.attempts;
    const defeats = req.body?.defeats;
    const bestTimeSeconds = req.body?.bestTimeSeconds;
    const lastOutcome = req.body?.lastOutcome;

    if (!hasEnemyDefinition(req.params.bossId)) {
      return res.status(404).json({ message: "Enemy or boss definition was not found." });
    }

    if (status !== undefined && (typeof status !== "string" || status.trim().length === 0)) {
      return res.status(400).json({ message: "status must be a non-empty string." });
    }

    if (attempts !== undefined && (!Number.isInteger(attempts) || attempts < 0)) {
      return res.status(400).json({ message: "attempts must be a non-negative integer." });
    }

    if (defeats !== undefined && (!Number.isInteger(defeats) || defeats < 0)) {
      return res.status(400).json({ message: "defeats must be a non-negative integer." });
    }

    if (
      bestTimeSeconds !== undefined &&
      bestTimeSeconds !== null &&
      (typeof bestTimeSeconds !== "number" ||
        Number.isNaN(bestTimeSeconds) ||
        !Number.isFinite(bestTimeSeconds))
    ) {
      return res.status(400).json({ message: "bestTimeSeconds must be a finite number." });
    }

    if (lastOutcome !== undefined && (typeof lastOutcome !== "string" || lastOutcome.trim().length === 0)) {
      return res.status(400).json({ message: "lastOutcome must be a non-empty string." });
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
    next(error);
  }
}

import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterDialogueFlags } from "../db/schema.js";

export function findDialogueFlagsByCharacterId(characterId) {
  return db
    .select({
      characterDialogueFlagId: characterDialogueFlags.id,
      characterId: characterDialogueFlags.characterId,
      flagId: characterDialogueFlags.flagKey,
      flagValue: characterDialogueFlags.flagValue,
      setAt: characterDialogueFlags.setAt
    })
    .from(characterDialogueFlags)
    .where(eq(characterDialogueFlags.characterId, characterId))
    .orderBy(asc(characterDialogueFlags.flagKey));
}

export async function upsertDialogueFlag({ characterId, flagId, flagValue }) {
  const now = new Date();
  const existingResult = await db
    .select({
      characterDialogueFlagId: characterDialogueFlags.id
    })
    .from(characterDialogueFlags)
    .where(
      and(
        eq(characterDialogueFlags.characterId, characterId),
        eq(characterDialogueFlags.flagKey, flagId)
      )
    )
    .limit(1);
  const existing = existingResult[0] || null;
  const query = existing
    ? db
        .update(characterDialogueFlags)
        .set({
          flagValue,
          setAt: now
        })
        .where(eq(characterDialogueFlags.id, existing.characterDialogueFlagId))
    : db.insert(characterDialogueFlags).values({
        characterId,
        flagKey: flagId,
        flagValue,
        setAt: now
      });
  const result = await query
    .returning({
      characterDialogueFlagId: characterDialogueFlags.id,
      characterId: characterDialogueFlags.characterId,
      flagId: characterDialogueFlags.flagKey,
      flagValue: characterDialogueFlags.flagValue,
      setAt: characterDialogueFlags.setAt
    });

  return result[0];
}

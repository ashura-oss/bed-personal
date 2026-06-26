// Faction reputation model functions read and save reputation rows.
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { characterFactionReputation } from "../db/schema.js";

// Find faction reputation by character id.
export function findFactionReputationByCharacterId(characterId) {
  return db
    .select({
      characterFactionReputationId: characterFactionReputation.id,
      characterId: characterFactionReputation.characterId,
      factionId: characterFactionReputation.factionKey,
      reputation: characterFactionReputation.reputation,
      rank: characterFactionReputation.rank,
      updatedAt: characterFactionReputation.updatedAt
    })
    .from(characterFactionReputation)
    .where(eq(characterFactionReputation.characterId, characterId))
    .orderBy(asc(characterFactionReputation.factionKey));
}

// Insert or update faction reputation.
export async function upsertFactionReputation({ characterId, factionId, reputation, rank }) {
  const now = new Date();
  const existing = await findFactionReputation(characterId, factionId);
  const nextReputation = reputation ?? existing?.reputation ?? 0;
  const nextRank = rank ?? existing?.rank ?? "neutral";
  const query = existing
    ? db
        .update(characterFactionReputation)
        .set({
          reputation: nextReputation,
          rank: nextRank,
          updatedAt: now
        })
        .where(eq(characterFactionReputation.id, existing.characterFactionReputationId))
    : db.insert(characterFactionReputation).values({
        characterId,
        factionKey: factionId,
        reputation: nextReputation,
        rank: nextRank,
        updatedAt: now
      });
  const result = await query
    .returning({
      characterFactionReputationId: characterFactionReputation.id,
      characterId: characterFactionReputation.characterId,
      factionId: characterFactionReputation.factionKey,
      reputation: characterFactionReputation.reputation,
      rank: characterFactionReputation.rank,
      updatedAt: characterFactionReputation.updatedAt
    });

  return result[0];
}

// Find faction reputation.
async function findFactionReputation(characterId, factionId) {
  const result = await db
    .select({
      characterFactionReputationId: characterFactionReputation.id,
      characterId: characterFactionReputation.characterId,
      factionId: characterFactionReputation.factionKey,
      reputation: characterFactionReputation.reputation,
      rank: characterFactionReputation.rank,
      updatedAt: characterFactionReputation.updatedAt
    })
    .from(characterFactionReputation)
    .where(
      and(
        eq(characterFactionReputation.characterId, characterId),
        eq(characterFactionReputation.factionKey, factionId)
      )
    )
    .limit(1);

  return result[0] || null;
}

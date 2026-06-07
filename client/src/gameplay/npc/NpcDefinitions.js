import { DIALOGUE_TREES } from "../dialogue/DialogueDefinitions.js";

/**
 * NpcDefinitions — catalogue mapping NPC key (tag[0]) → display + dialogue data.
 *
 * All colours are hex integers for MeshStandardMaterial.
 * dialogueId references a tree in DialogueDefinitions.js.
 */

export const NPC_DEFINITIONS = Object.freeze({
  tessa: Object.freeze({
    key: "tessa",
    name: "Tessa the Emberwright",
    color: 0xb5651d,
    dialogueId: "tessa.intro",
    role: "blacksmith"
  }),
  aldric: Object.freeze({
    key: "aldric",
    name: "Warden Aldric",
    color: 0x4a6a8a,
    dialogueId: "aldric.intro",
    role: "guard"
  }),
  marn: Object.freeze({
    key: "marn",
    name: "Marn the Trader",
    color: 0x6a8a4a,
    dialogueId: "marn.intro",
    role: "trader"
  }),
  wanderer: Object.freeze({
    key: "wanderer",
    name: "The Unbound Wanderer",
    color: 0x8a7a9a,
    dialogueId: "wanderer.intro",
    role: "wanderer"
  }),
  scout: Object.freeze({
    key: "scout",
    name: "Road Scout Pell",
    color: 0x7a7a5a,
    dialogueId: "scout.intro",
    role: "scout"
  }),
  survivor: Object.freeze({
    key: "survivor",
    name: "Hollow Survivor",
    color: 0x5a5a5a,
    dialogueId: "survivor.intro",
    role: "survivor"
  }),
  foreman: Object.freeze({
    key: "foreman",
    name: "Foreman Brek",
    color: 0x8a5a3a,
    dialogueId: "foreman.intro",
    role: "miner"
  }),
  traveller: Object.freeze({
    key: "traveller",
    name: "Weary Traveller",
    color: 0x6a6a7a,
    dialogueId: "traveller.intro",
    role: "traveller"
  })
});

/**
 * Resolve an NPC definition from a placement's tags array.
 * Uses tags[0] as the NPC key. Falls back to traveller if not found.
 *
 * @param {readonly string[]} tags
 * @returns {object} NPC definition
 */
export function getNpcDefinition(tags) {
  if (!tags || tags.length === 0) return NPC_DEFINITIONS.traveller;
  const key = tags[0];
  return NPC_DEFINITIONS[key] ?? NPC_DEFINITIONS.traveller;
}

/**
 * Cross-check: every dialogueId in NPC_DEFINITIONS must resolve in DIALOGUE_TREES.
 * Called lazily at runtime (dev-mode guard, not in hot path).
 */
export function validateNpcDefinitions() {
  for (const def of Object.values(NPC_DEFINITIONS)) {
    if (!DIALOGUE_TREES[def.dialogueId]) {
      console.warn(`[NpcDefinitions] Missing dialogue tree for "${def.dialogueId}"`);
    }
  }
}

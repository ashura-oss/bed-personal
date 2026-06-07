import { describe, expect, test } from "@jest/globals";
import { NPC_DEFINITIONS, getNpcDefinition } from "../gameplay/npc/NpcDefinitions.js";
import { getDialogueTree } from "../gameplay/dialogue/DialogueDefinitions.js";

describe("NpcDefinitions", () => {
  test("1. getNpcDefinition(['tessa','blacksmith']) returns tessa definition", () => {
    const def = getNpcDefinition(["tessa", "blacksmith"]);
    expect(def.key).toBe("tessa");
    expect(def.name).toBe("Tessa the Emberwright");
  });

  test("2. getNpcDefinition(['unknown']) returns traveller fallback", () => {
    const def = getNpcDefinition(["unknown"]);
    expect(def.key).toBe("traveller");
  });

  test("3. getNpcDefinition([]) returns traveller fallback", () => {
    const def = getNpcDefinition([]);
    expect(def.key).toBe("traveller");
  });

  test("4. every NPC_DEFINITIONS entry has key, name, color (number), dialogueId, role", () => {
    for (const [k, def] of Object.entries(NPC_DEFINITIONS)) {
      expect(typeof def.key).toBe("string");
      expect(typeof def.name).toBe("string");
      expect(typeof def.color).toBe("number");
      expect(typeof def.dialogueId).toBe("string");
      expect(typeof def.role).toBe("string");
      // key field must match object key
      expect(def.key).toBe(k);
    }
  });

  test("5. every dialogueId in NPC_DEFINITIONS resolves to a real tree in DIALOGUE_TREES", () => {
    for (const def of Object.values(NPC_DEFINITIONS)) {
      const tree = getDialogueTree(def.dialogueId);
      expect(tree).not.toBeNull();
    }
  });
});

import { describe, expect, test } from "@jest/globals";
import { DIALOGUE_TREES, getDialogueTree } from "../gameplay/dialogue/DialogueDefinitions.js";

describe("DialogueDefinitions", () => {
  test("1. every tree has a start that exists in nodes", () => {
    for (const [, tree] of Object.entries(DIALOGUE_TREES)) {
      expect(tree.start).toBeDefined();
      expect(tree.nodes[tree.start]).toBeDefined();
    }
  });

  test("2. every node has speaker, text, and a choices array", () => {
    for (const [, tree] of Object.entries(DIALOGUE_TREES)) {
      for (const [, node] of Object.entries(tree.nodes)) {
        expect(typeof node.speaker).toBe("string");
        expect(typeof node.text).toBe("string");
        expect(Array.isArray(node.choices)).toBe(true);
      }
    }
  });

  test("3. every choice.next is null or a valid node id in the same tree", () => {
    for (const [, tree] of Object.entries(DIALOGUE_TREES)) {
      for (const [, node] of Object.entries(tree.nodes)) {
        for (const choice of node.choices) {
          if (choice.next !== null && choice.next !== undefined) {
            expect(tree.nodes[choice.next]).toBeDefined();
          }
        }
      }
    }
  });

  test("4. getDialogueTree('tessa.intro') returns a tree; getDialogueTree('nope') returns null", () => {
    const tree = getDialogueTree("tessa.intro");
    expect(tree).not.toBeNull();
    expect(tree.start).toBe("root");

    const missing = getDialogueTree("nope");
    expect(missing).toBeNull();
  });
});

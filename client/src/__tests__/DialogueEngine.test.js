import { describe, expect, test } from "@jest/globals";
import { DialogueEngine } from "../gameplay/dialogue/DialogueEngine.js";

// ── Minimal test tree ─────────────────────────────────────────────────────────

const TREE = {
  start: "root",
  nodes: {
    root: {
      speaker: "Test Speaker",
      text: "Hello, traveller.",
      choices: [
        { label: "Continue",       next: "page2" },
        { label: "Locked choice",  next: "page2", requires: "flag.locked" },
        { label: "Goodbye",        next: null }
      ]
    },
    page2: {
      speaker: "Test Speaker",
      text: "Good to meet you.",
      choices: [
        { label: "With effect", next: null, effect: "quest.test.trigger" },
        { label: "Back",        next: "root" }
      ]
    }
  }
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DialogueEngine", () => {
  test("1. starts at tree.start node", () => {
    const engine = new DialogueEngine({ tree: TREE });
    expect(engine.currentNodeId).toBe("root");
    expect(engine.isComplete).toBe(false);
  });

  test("2. currentNode returns correct speaker and text", () => {
    const engine = new DialogueEngine({ tree: TREE });
    expect(engine.currentNode.speaker).toBe("Test Speaker");
    expect(engine.currentNode.text).toBe("Hello, traveller.");
  });

  test("3. choose() advances to next node", () => {
    const engine = new DialogueEngine({ tree: TREE });
    engine.choose(0); // "Continue" → page2
    expect(engine.currentNodeId).toBe("page2");
    expect(engine.isComplete).toBe(false);
  });

  test("4. choose() with next:null sets isComplete and returns ended:true", () => {
    const engine = new DialogueEngine({ tree: TREE });
    // availableChoices when no predicates: all 3 choices shown (requires with no predicate = visible)
    // choices: [0] Continue, [1] Locked choice, [2] Goodbye (next:null)
    const result = engine.choose(2); // "Goodbye" → next:null
    expect(result.ended).toBe(true);
    expect(engine.isComplete).toBe(true);
  });

  test("5. choose() returns effect string when choice has effect", () => {
    const engine = new DialogueEngine({ tree: TREE });
    engine.choose(0); // → page2
    const result = engine.choose(0); // "With effect"
    expect(result.effect).toBe("quest.test.trigger");
    expect(result.ended).toBe(true);
  });

  test("6. invalid choice index throws RangeError", () => {
    const engine = new DialogueEngine({ tree: TREE });
    expect(() => engine.choose(99)).toThrow(RangeError);
    expect(() => engine.choose(-1)).toThrow(RangeError);
  });

  test("7. availableChoices filters out choices whose requires predicate returns false", () => {
    const engine = new DialogueEngine({
      tree: TREE,
      predicates: { "flag.locked": () => false }
    });
    const choices = engine.availableChoices();
    expect(choices.every(c => c.label !== "Locked choice")).toBe(true);
  });

  test("8. availableChoices includes choices whose requires predicate returns true", () => {
    const engine = new DialogueEngine({
      tree: TREE,
      predicates: { "flag.locked": () => true }
    });
    const choices = engine.availableChoices();
    expect(choices.some(c => c.label === "Locked choice")).toBe(true);
  });

  test("9. reset() returns to start and clears isComplete", () => {
    const engine = new DialogueEngine({ tree: TREE });
    engine.choose(0); // → page2
    engine.choose(0); // → ended
    expect(engine.isComplete).toBe(true);

    engine.reset();
    expect(engine.currentNodeId).toBe("root");
    expect(engine.isComplete).toBe(false);
  });

  test("10. constructor throws on invalid tree — no start", () => {
    expect(() => new DialogueEngine({ tree: { nodes: { root: {} } } }))
      .toThrow();
  });

  test("10b. constructor throws on invalid tree — no nodes", () => {
    expect(() => new DialogueEngine({ tree: { start: "root" } }))
      .toThrow();
  });

  test("10c. constructor throws when start node is missing from nodes", () => {
    expect(() => new DialogueEngine({ tree: { start: "missing", nodes: {} } }))
      .toThrow();
  });
});

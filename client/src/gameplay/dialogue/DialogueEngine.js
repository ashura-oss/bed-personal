/**
 * DialogueEngine — pure state machine for branching dialogue.
 *
 * Zero Three.js imports. Fully unit-testable in Node/Jest.
 *
 * Usage:
 *   const engine = new DialogueEngine({ tree: DIALOGUE_TREES['tessa.intro'] });
 *   engine.currentNode   // { speaker, text, choices }
 *   engine.availableChoices()
 *   const result = engine.choose(0);  // { effect?, ended }
 */

export class DialogueEngine {
  /**
   * @param {{ tree: object, predicates?: Record<string, () => boolean> }} opts
   * @throws {Error} if tree is invalid (missing start or nodes)
   */
  constructor({ tree, predicates = {} }) {
    if (!tree || typeof tree.start !== "string" || !tree.nodes || typeof tree.nodes !== "object") {
      throw new Error("[DialogueEngine] Invalid tree: must have { start: string, nodes: object }");
    }
    if (!(tree.start in tree.nodes)) {
      throw new Error(`[DialogueEngine] Invalid tree: start node "${tree.start}" not found in nodes`);
    }

    this._tree = tree;
    this._predicates = predicates;
    this._currentNodeId = tree.start;
    this._isComplete = false;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** The current node object { speaker, text, choices }. */
  get currentNode() {
    return this._tree.nodes[this._currentNodeId];
  }

  /** The id string of the current node. */
  get currentNodeId() {
    return this._currentNodeId;
  }

  /**
   * True after a choice with next === null has been taken.
   * Once complete the engine sits idle; call reset() to restart.
   */
  get isComplete() {
    return this._isComplete;
  }

  /**
   * Choices visible to the player after gating by `requires` predicates.
   * A choice is omitted when its requires key maps to a predicate that returns false.
   * Choices with no requires are always included.
   *
   * @returns {Array<object>} filtered choices (original objects, not copies)
   */
  availableChoices() {
    if (this._isComplete) return [];
    const node = this.currentNode;
    if (!node || !Array.isArray(node.choices)) return [];

    return node.choices.filter(choice => {
      if (!choice.requires) return true;
      const pred = this._predicates[choice.requires];
      if (typeof pred !== "function") return true; // unknown predicate = show
      return pred();
    });
  }

  /**
   * Advance the engine by selecting a choice from availableChoices().
   *
   * @param {number} choiceIndex  — index into availableChoices()
   * @returns {{ effect?: string, ended: boolean }}
   * @throws {RangeError} if choiceIndex is out of bounds
   */
  choose(choiceIndex) {
    if (this._isComplete) {
      return { ended: true };
    }

    const choices = this.availableChoices();
    if (choiceIndex < 0 || choiceIndex >= choices.length) {
      throw new RangeError(
        `[DialogueEngine] choiceIndex ${choiceIndex} out of range (0..${choices.length - 1})`
      );
    }

    const choice = choices[choiceIndex];
    const result = { ended: false };

    if (choice.effect) {
      result.effect = choice.effect;
    }

    if (choice.next === null || choice.next === undefined) {
      this._isComplete = true;
      result.ended = true;
    } else {
      this._currentNodeId = choice.next;
    }

    return result;
  }

  /**
   * Reset the engine to the start node.
   * Clears isComplete so the NPC can be talked to again.
   */
  reset() {
    this._currentNodeId = this._tree.start;
    this._isComplete = false;
  }
}

import {
  formatGatheringPrompt,
  formatHarvestFeedback,
  formatQuestObjectiveText,
  resolveInteractPromptState
} from "../ui/HUD.js";
import { describe, expect, it } from "@jest/globals";

describe("HUD gathering helpers", () => {
  it("prefers the Hearthlight prompt when both prompt sources are active", () => {
    expect(
      resolveInteractPromptState({
        hearthlightVisible: true,
        hearthlightText: "Rest at Hearthlight",
        gatheringVisible: true,
        gatheringText: "Gather Timber"
      })
    ).toEqual({
      visible: true,
      text: "Rest at Hearthlight"
    });
  });

  it("shows the gathering prompt when Hearthlight is not interactable", () => {
    expect(
      resolveInteractPromptState({
        gatheringVisible: true,
        gatheringText: "Gather Ashleaf"
      })
    ).toEqual({
      visible: true,
      text: "Gather Ashleaf"
    });
  });

  it("hides the prompt while controls are locked", () => {
    expect(
      resolveInteractPromptState({
        controlsLocked: true,
        hearthlightVisible: true,
        gatheringVisible: true,
        gatheringText: "Gather Timber"
      })
    ).toEqual({
      visible: false,
      text: "Rest at Hearthlight"
    });
  });

  it("formats gathering prompt text from the resource definition name", () => {
    expect(formatGatheringPrompt({ name: "Mooncrystal" })).toBe("Gather Mooncrystal");
    expect(formatGatheringPrompt(null)).toBe("Gather Resource");
  });

  it("formats harvest feedback from the node definition when available", () => {
    expect(
      formatHarvestFeedback({
        count: 2,
        itemId: "timber",
        nodeDef: { name: "Timber" }
      })
    ).toBe("Gathered +2 Timber");
  });

  it("falls back to a humanized item id for harvest feedback", () => {
    expect(
      formatHarvestFeedback({
        count: 1,
        itemId: "iron_ore",
        nodeDef: null
      })
    ).toBe("Gathered +1 Iron Ore");
  });

  it("formats quest objective progress when a quest objective is active", () => {
    expect(
      formatQuestObjectiveText({
        summary: "Gather supplies.",
        objective: {
          label: "Gather timber",
          current: 2,
          requiredCount: 3
        }
      })
    ).toBe("Gather timber: 2/3");
  });

  it("falls back to quest text when no objective is active", () => {
    expect(formatQuestObjectiveText({ text: "The shrine path is clear." }))
      .toBe("The shrine path is clear.");
  });
});

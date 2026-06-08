/**
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { CharacterCreation } from "../ui/CharacterCreation.js";

function changeInput(input, value) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function submitForm(root) {
  root.querySelector("[data-character-form]").dispatchEvent(
    new Event("submit", { bubbles: true, cancelable: true })
  );
}

function findButton(root, text) {
  return Array.from(root.querySelectorAll("button")).find((button) => {
    return button.textContent.includes(text);
  });
}

describe("CharacterCreation", () => {
  let mount;
  let authService;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = "";
    mount = document.createElement("div");
    document.body.appendChild(mount);
    authService = {
      createCharacter: jest.fn()
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = "";
  });

  it("renders an accessible full-screen character creation overlay", () => {
    const ui = new CharacterCreation(mount, {
      user: { userId: "user-1" },
      authService,
      onSuccess: jest.fn(),
      onCancel: jest.fn()
    });

    const root = mount.querySelector("#character-creation");
    expect(root.getAttribute("role")).toBe("dialog");
    expect(root.getAttribute("aria-modal")).toBe("true");
    expect(root.querySelector("[role='main']")).not.toBeNull();
    expect(root.querySelector("[aria-live='assertive']")).not.toBeNull();
    expect(root.querySelector("[role='status']")).not.toBeNull();
    expect(root.querySelectorAll("[data-character-options='origin'] button")).toHaveLength(8);
    expect(root.querySelectorAll("[data-character-options='className'] button")).toHaveLength(10);
    expect(root.querySelectorAll("[data-character-options='affinity'] button")).toHaveLength(9);

    ui.dispose();
  });

  it("updates selected choices and live stat preview", () => {
    const ui = new CharacterCreation(mount, {
      user: { userId: "user-1" },
      authService,
      onSuccess: jest.fn()
    });
    const root = mount.querySelector("#character-creation");

    findButton(root, "Street Thief").click();
    changeInput(root.querySelector("[data-character-name]"), "Lysa Quickhand");

    expect(findButton(root, "Street Thief").getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("[data-character-preview-title]").textContent).toBe("Lysa Quickhand");
    expect(root.querySelector("[data-character-preview-summary]").textContent)
      .toBe("Street Thief / Warrior / Fire affinity");
    expect(root.querySelector("[data-character-stats]").textContent).toContain("115");
    expect(root.querySelector("[data-character-stats]").textContent).toContain("AGI");

    ui.dispose();
  });

  it("validates name before calling authService.createCharacter", async () => {
    const ui = new CharacterCreation(mount, {
      user: { userId: "user-1" },
      authService,
      onSuccess: jest.fn()
    });
    const root = mount.querySelector("#character-creation");

    changeInput(root.querySelector("[data-character-name]"), "A");
    submitForm(root);
    await Promise.resolve();

    expect(authService.createCharacter).not.toHaveBeenCalled();
    expect(root.querySelector("[data-character-error]").textContent)
      .toBe("Character name must be at least 2 characters.");

    ui.dispose();
  });

  it("submits the selected character payload and removes itself on success", async () => {
    const result = { ok: true, character: { characterId: "char-1" } };
    const onSuccess = jest.fn();
    authService.createCharacter.mockResolvedValue(result);
    new CharacterCreation(mount, {
      user: { userId: "user-1" },
      authService,
      onSuccess
    });
    const root = mount.querySelector("#character-creation");

    findButton(root, "Temple Acolyte").click();
    findButton(root, "Cleric").click();
    findButton(root, "Holy").click();
    changeInput(root.querySelector("[data-character-name]"), "Sera Dawn");
    submitForm(root);
    await Promise.resolve();

    expect(authService.createCharacter).toHaveBeenCalledWith({
      userId: "user-1",
      characterName: "Sera Dawn",
      origin: "Temple Acolyte",
      className: "Cleric",
      affinity: "Holy"
    });

    jest.advanceTimersByTime(240);

    expect(onSuccess).toHaveBeenCalledWith(result);
    expect(mount.querySelector("#character-creation")).toBeNull();
    expect(mount.classList.contains("character-creation-active")).toBe(false);
  });

  it("shows backend errors and keeps the overlay mounted", async () => {
    authService.createCharacter.mockResolvedValue({
      ok: false,
      message: "A character with that name already exists."
    });
    const ui = new CharacterCreation(mount, {
      user: { userId: "user-1" },
      authService,
      onSuccess: jest.fn()
    });
    const root = mount.querySelector("#character-creation");

    changeInput(root.querySelector("[data-character-name]"), "Sera Dawn");
    submitForm(root);
    await Promise.resolve();

    expect(root.querySelector("[data-character-error]").textContent)
      .toBe("A character with that name already exists.");
    expect(mount.querySelector("#character-creation")).not.toBeNull();

    ui.dispose();
  });
});

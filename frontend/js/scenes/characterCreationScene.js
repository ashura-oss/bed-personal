import { requestJson, ApiError } from "../api.js";
import { getToken, setFlashMessage, clearSession } from "../state.js";
import {
  getCurrentUser,
  setCurrentCharacter,
  setCurrentUser
} from "../game/gameState.js";
import {
  allowedAffinities,
  allowedClasses,
  allowedOrigins,
  affinityDescriptions,
  classDescriptions,
  originDescriptions,
  baseStats,
  previewStats,
  validateCharacterName
} from "../game/characterRules.js";
import { animateCardEntrance, animatePanelSwap } from "../animations/waapi.js";
import { setButtonLoading, showAlert } from "../ui.js";

const STEP_ORDER = ["origin", "class", "affinity", "name", "confirm"];

const selection = {
  origin: null,
  className: null,
  affinity: null,
  characterName: ""
};

let currentStepIndex = 0;
let isSubmitting = false;

document.addEventListener("DOMContentLoaded", initCharacterCreationScene);

async function initCharacterCreationScene() {
  if (!getToken()) {
    setFlashMessage("Login is required before forging a hero.", "info");
    window.location.replace("./login.html");
    return;
  }

  try {
    const user = await requestJson("/auth/me");
    setCurrentUser(user);
    renderUserBadge(user);
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearSession();
      setFlashMessage("Your session expired. Login again to forge a hero.", "error");
      window.location.replace("./login.html");
      return;
    }

    showAlert(
      document.querySelector("[data-scene-alert]"),
      "Could not confirm your profile. Check the backend is running.",
      "error"
    );
    return;
  }

  renderOriginOptions();
  renderClassOptions();
  renderAffinityOptions();
  bindNavigation();
  bindNameField();
  bindSubmit();
  updateStepIndicator();
  updatePreview();
}

function renderUserBadge(user) {
  const badge = document.querySelector("[data-scene-username]");

  if (badge) {
    badge.textContent = user?.username || "Unbound";
  }
}

function renderOriginOptions() {
  const grid = document.querySelector("[data-options='origin']");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";
  allowedOrigins.forEach((origin) => {
    grid.append(
      createOptionCard({
        value: origin,
        title: origin,
        description: originDescriptions[origin],
        onSelect: () => selectOrigin(origin)
      })
    );
  });
}

function renderClassOptions() {
  const grid = document.querySelector("[data-options='class']");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";
  allowedClasses.forEach((className) => {
    grid.append(
      createOptionCard({
        value: className,
        title: className,
        description: classDescriptions[className],
        onSelect: () => selectClass(className)
      })
    );
  });
}

function renderAffinityOptions() {
  const grid = document.querySelector("[data-options='affinity']");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";
  allowedAffinities.forEach((affinity) => {
    grid.append(
      createOptionCard({
        value: affinity,
        title: affinity,
        description: affinityDescriptions[affinity],
        onSelect: () => selectAffinity(affinity)
      })
    );
  });
}

function createOptionCard({ value, title, description, onSelect }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "option-card";
  button.dataset.value = value;
  button.innerHTML = `
    <span class="badge">Choice</span>
    <strong>${escapeHtml(title)}</strong>
    <span class="option-card-body">${escapeHtml(description || "")}</span>
  `;
  button.addEventListener("click", () => {
    onSelect();
    markSelected(button);
  });
  return button;
}

function markSelected(selectedButton) {
  const parent = selectedButton.parentElement;

  if (!parent) {
    return;
  }

  parent.querySelectorAll(".option-card").forEach((card) => {
    card.classList.toggle("is-selected", card === selectedButton);
  });
}

function selectOrigin(origin) {
  selection.origin = origin;
  updatePreview();
  updateStepIndicator();
  enableAdvance();
}

function selectClass(className) {
  selection.className = className;
  updatePreview();
  updateStepIndicator();
  enableAdvance();
}

function selectAffinity(affinity) {
  selection.affinity = affinity;
  updatePreview();
  updateStepIndicator();
  enableAdvance();
}

function bindNameField() {
  const input = document.querySelector("[data-name-input]");

  if (!input) {
    return;
  }

  input.addEventListener("input", () => {
    selection.characterName = input.value;
    updateStepIndicator();
    enableAdvance();
  });
}

function bindNavigation() {
  document.querySelectorAll("[data-step-next]").forEach((button) => {
    button.addEventListener("click", () => goToStep(currentStepIndex + 1));
  });

  document.querySelectorAll("[data-step-back]").forEach((button) => {
    button.addEventListener("click", () => goToStep(currentStepIndex - 1));
  });
}

function goToStep(nextIndex) {
  if (nextIndex < 0 || nextIndex >= STEP_ORDER.length) {
    return;
  }

  if (nextIndex > currentStepIndex && !canAdvanceFromStep(currentStepIndex)) {
    return;
  }

  const oldStep = getStepElement(currentStepIndex);
  const nextStep = getStepElement(nextIndex);

  if (oldStep) {
    oldStep.classList.remove("is-active");
  }

  if (nextStep) {
    nextStep.classList.add("is-active");
    animatePanelSwap(oldStep, nextStep);
  }

  currentStepIndex = nextIndex;

  if (STEP_ORDER[currentStepIndex] === "confirm") {
    renderConfirmSummary();
  }

  updateStepIndicator();
  enableAdvance();
}

function getStepElement(index) {
  const stepName = STEP_ORDER[index];

  if (!stepName) {
    return null;
  }

  return document.querySelector(`[data-step='${stepName}']`);
}

function canAdvanceFromStep(stepIndex) {
  const stepName = STEP_ORDER[stepIndex];

  if (stepName === "origin") {
    return Boolean(selection.origin);
  }

  if (stepName === "class") {
    return Boolean(selection.className);
  }

  if (stepName === "affinity") {
    return Boolean(selection.affinity);
  }

  if (stepName === "name") {
    return validateCharacterName(selection.characterName) === null;
  }

  return true;
}

function enableAdvance() {
  const nextButton = getStepElement(currentStepIndex)?.querySelector("[data-step-next]");

  if (!nextButton) {
    return;
  }

  nextButton.disabled = !canAdvanceFromStep(currentStepIndex);
}

function updateStepIndicator() {
  document.querySelectorAll("[data-step-indicator]").forEach((indicator) => {
    const stepName = indicator.dataset.stepIndicator;
    const stepIndex = STEP_ORDER.indexOf(stepName);
    indicator.classList.toggle("is-active", stepIndex === currentStepIndex);
    indicator.classList.toggle("is-complete", stepIndex < currentStepIndex);
  });
}

function updatePreview() {
  const stats = previewStats(selection);
  const target = document.querySelector("[data-stat-preview]");

  if (!target) {
    return;
  }

  const display = stats || baseStats;
  const isLive = Boolean(stats);

  target.innerHTML = `
    <header class="preview-header">
      <p class="eyebrow">${isLive ? "Forged Stats" : "Base Stats"}</p>
      <h3>${escapeHtml(selection.characterName || "Unnamed Hero")}</h3>
      <p class="preview-tagline">${describeSelection()}</p>
    </header>
    <div class="stat-grid compact-stat-grid">
      <span><strong>${display.hp}</strong>HP</span>
      <span><strong>${display.strength}</strong>STR</span>
      <span><strong>${display.intelligence}</strong>INT</span>
      <span><strong>${display.agility}</strong>AGI</span>
      <span><strong>${display.faith}</strong>FAI</span>
      <span><strong>${display.endurance}</strong>END</span>
      <span><strong>${display.charisma}</strong>CHA</span>
    </div>
    <p class="preview-footnote">${
      isLive
        ? "Live preview from origin + class + affinity. Backend will recalculate on save."
        : "Pick origin, class, and affinity to see your hero's forged stats."
    }</p>
  `;
}

function describeSelection() {
  const parts = [];

  if (selection.origin) {
    parts.push(selection.origin);
  }

  if (selection.className) {
    parts.push(selection.className);
  }

  if (selection.affinity) {
    parts.push(`${selection.affinity} affinity`);
  }

  return parts.length ? parts.join(" | ") : "No path chosen yet";
}

function renderConfirmSummary() {
  const target = document.querySelector("[data-confirm-summary]");

  if (!target) {
    return;
  }

  const stats = previewStats(selection);

  if (!stats) {
    target.innerHTML = "<p>Step back and complete every choice.</p>";
    return;
  }

  target.innerHTML = `
    <div class="confirm-card game-panel">
      <p class="eyebrow">Hero Forge Ready</p>
      <h2>${escapeHtml(selection.characterName || "Unnamed Hero")}</h2>
      <p class="confirm-tagline">${escapeHtml(describeSelection())}</p>
      <div class="stat-grid compact-stat-grid">
        <span><strong>${stats.hp}</strong>HP</span>
        <span><strong>${stats.strength}</strong>STR</span>
        <span><strong>${stats.intelligence}</strong>INT</span>
        <span><strong>${stats.agility}</strong>AGI</span>
        <span><strong>${stats.faith}</strong>FAI</span>
        <span><strong>${stats.endurance}</strong>END</span>
        <span><strong>${stats.charisma}</strong>CHA</span>
      </div>
    </div>
  `;

  animateCardEntrance(target.querySelector(".confirm-card"));
}

function bindSubmit() {
  const submitButton = document.querySelector("[data-confirm-submit]");

  if (!submitButton) {
    return;
  }

  submitButton.addEventListener("click", submitCharacter);
}

async function submitCharacter() {
  if (isSubmitting) {
    return;
  }

  const submitButton = document.querySelector("[data-confirm-submit]");
  const messageTarget = document.querySelector("[data-scene-alert]");
  const user = getCurrentUser();

  if (!user) {
    showAlert(messageTarget, "Profile missing. Refresh and try again.", "error");
    return;
  }

  const nameError = validateCharacterName(selection.characterName);

  if (nameError) {
    goToStep(STEP_ORDER.indexOf("name"));
    showAlert(messageTarget, nameError, "error");
    return;
  }

  if (!selection.origin || !selection.className || !selection.affinity) {
    showAlert(messageTarget, "Complete every step before forging.", "error");
    return;
  }

  isSubmitting = true;
  setButtonLoading(submitButton, true, "Forging");

  try {
    const character = await requestJson("/characters", {
      method: "POST",
      body: {
        userId: user.userId,
        characterName: selection.characterName.trim(),
        origin: selection.origin,
        className: selection.className,
        affinity: selection.affinity
      }
    });

    setCurrentCharacter(character);
    setFlashMessage(
      `${character.characterName} stands forged. The guild logs it.`,
      "success"
    );
    window.location.href = "./dashboard.html";
  } catch (error) {
    setButtonLoading(submitButton, false);
    isSubmitting = false;
    showAlert(messageTarget, getFriendlyCreateError(error), "error");

    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearSession();
      setFlashMessage("Your session expired. Login again.", "error");
      window.setTimeout(() => window.location.replace("./login.html"), 600);
    }
  }
}

function getFriendlyCreateError(error) {
  if (!(error instanceof ApiError)) {
    return "Network issue. Check the server and try again.";
  }

  if (error.status === 400) {
    return error.message || "One of the choices failed validation. Step back and review.";
  }

  if (error.status === 401) {
    return "Session expired. Sending you back to login.";
  }

  if (error.status === 403) {
    return "That request was not allowed for this profile.";
  }

  if (error.status === 404) {
    return "Your user profile is missing on the server. Logout and login again.";
  }

  if (error.status === 409) {
    return "A character with that name already exists in the guild ledger.";
  }

  if (error.status >= 500) {
    return "The realm did not answer. Start the backend, then try again.";
  }

  return error.message || "Forging failed. Try again.";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

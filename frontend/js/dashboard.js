import { requestJson } from "./api.js";
import {
  clearSession,
  getToken,
  setCurrentUser,
  setFlashMessage
} from "./state.js";
import {
  setCharacters as setGameCharacters,
  setCurrentCharacter as setGameCurrentCharacter,
  setCurrentUser as setGameCurrentUser
} from "./game/gameState.js";
import { validateCharacterName } from "./game/characterRules.js";
import {
  buildQuestReadiness,
  getAttemptErrorMessage,
  getStatLabel
} from "./game/adventureRules.js";
import {
  buildCharacterProgress,
  buildLogSummary,
  filterAdventureLogs,
  getCharacterOptions,
  getRegionOptions,
  logOutcomeFilters
} from "./game/logRules.js";
import {
  abilityTypeOrder,
  buildComboSequence,
  getAbilityTypeLabel,
  getAbilityUnlockState,
  getComboSlotKey,
  getRequirementSummary,
  groupAbilitiesByType
} from "./game/abilityRules.js";
import {
  buildBossPreview,
  getBossOutcome,
  isBossQuest
} from "./game/bossRules.js";
import {
  animateBossEntrance,
  animateCardEntrance,
  animateComboSequence,
  animateQuestResult,
  animateRewardPopup
} from "./animations/waapi.js";
import { setButtonLoading, showAlert } from "./ui.js";

document.addEventListener("DOMContentLoaded", initDashboard);

const regionPositions = {
  region_hearthmere_outpost: { left: "12%", top: "58%", tone: "hearth" },
  region_ironvale_city: { left: "60%", top: "34%", tone: "iron" },
  region_blackroot_forest: { left: "27%", top: "22%", tone: "root" },
  region_sunken_temple: { left: "72%", top: "68%", tone: "temple" },
  region_dragon_coast: { left: "84%", top: "44%", tone: "dragon" },
  region_moonspire: { left: "44%", top: "12%", tone: "moonspire" },
  region_gravehold: { left: "20%", top: "82%", tone: "gravehold" },
  region_ashen_wastes: { left: "66%", top: "84%", tone: "ashen" }
};

function getRegionTone(region) {
  const direct = regionPositions[region?.regionId]?.tone;
  if (direct) return direct;
  const name = String(region?.name || "").toLowerCase();
  if (name.includes("iron")) return "iron";
  if (name.includes("blackroot") || name.includes("forest")) return "root";
  if (name.includes("temple") || name.includes("sunken")) return "temple";
  if (name.includes("dragon")) return "dragon";
  if (name.includes("moon")) return "moonspire";
  if (name.includes("grave")) return "gravehold";
  if (name.includes("ash")) return "ashen";
  return "hearth";
}

let currentRegions = [];
let currentCharacters = [];
let currentUser = null;
let currentLogs = [];
let selectedCharacterId = null;
let selectedRegionId = null;
let selectedRegionQuests = [];
let selectedQuestId = null;
let questBoardIsLoading = false;
let questBoardMessage = "";
let isAttemptingQuest = false;
let activeLogFilter = "all";
let activeLogRegionId = "all";
let activeLogCharacterId = "all";
let logsAreLoading = false;
let logLoadErrorMessage = "";
let allAbilities = [];
let unlockedAbilities = [];
let selectedAbilityCharacterId = null;
let unlockedAbilitiesAreLoading = false;
let abilityLoadErrorMessage = "";
let unlockedAbilityErrorMessage = "";
let selectedComboSlots = { opener: null, chain: null, finisher: null };
let isUnlockingAbility = false;
let isResolvingCombo = false;
let comboResult = null;
let comboErrorMessage = "";
let activeBossQuest = null;
let activeBossRegion = null;

async function initDashboard() {
  bindDashboardLogout();

  if (!getToken()) {
    redirectToLogin("Login is required before entering the guild dashboard.", "info");
    return;
  }

  try {
    setDashboardLoading(true);
    const user = await requestJson("/auth/me");
    currentUser = user;
    setCurrentUser(user);
    setGameCurrentUser(user);
    renderUserHud(user);
    await loadDashboardData(user);
    showAlert(
      document.querySelector("[data-dashboard-alert]"),
      "Profile loaded. Hearthmere command table is online.",
      "success"
    );
  } catch (error) {
    handleDashboardError(error);
  } finally {
    setDashboardLoading(false);
  }
}

function bindDashboardLogout() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      clearSession();
      setFlashMessage("You left the guild dashboard. Login again to return.", "info");
      window.location.href = "./login.html";
    });
  });
}

async function loadDashboardData(user) {
  const [charactersResult, regionsResult, logsResult, abilitiesResult] = await Promise.allSettled([
    requestJson(`/users/${user.userId}/characters`),
    requestJson("/regions"),
    requestJson(`/users/${user.userId}/adventure-logs`),
    requestJson("/abilities")
  ]);

  if (charactersResult.status === "fulfilled") {
    renderCharacters(charactersResult.value);
  } else {
    renderCharacterError(charactersResult.reason);
  }

  if (regionsResult.status === "fulfilled") {
    renderRegions(regionsResult.value);
  } else {
    renderRegionError(regionsResult.reason);
  }

  if (logsResult.status === "fulfilled") {
    renderLogSummary(logsResult.value);
  } else {
    renderLogSummary(null);
  }

  if (abilitiesResult.status === "fulfilled") {
    allAbilities = Array.isArray(abilitiesResult.value) ? abilitiesResult.value : [];
    abilityLoadErrorMessage = "";
  } else {
    allAbilities = [];
    abilityLoadErrorMessage = getFriendlyDashboardError(
      abilitiesResult.reason,
      "Ability records could not be loaded."
    );
  }

  renderAbilityScreen();
  await loadUnlockedAbilitiesForSelectedCharacter();
}

function renderUserHud(user) {
  const username = user.username || "Unbound Adventurer";
  const level = Number(user.level || 1);
  const xp = Number(user.xp || 0);
  const gold = Number(user.gold || 0);
  const xpProgress = xp % 100;
  const xpPercent = Math.min(100, Math.max(0, xpProgress));

  setText("[data-dashboard-username]", username);
  setText("[data-session-label]", username);
  setText("[data-dashboard-initial]", username.charAt(0).toUpperCase() || "U");
  setText("[data-user-level]", level);
  setText("[data-user-gold]", gold);
  setText("[data-user-xp]", `${xpProgress} / 100`);
  setText("[data-user-total-xp]", xp);

  const xpFill = document.querySelector("[data-user-xp-fill]");
  if (xpFill) {
    xpFill.style.width = `${xpPercent}%`;
  }
}

function renderCharacters(characters) {
  const characterList = Array.isArray(characters) ? characters : [];
  const characterCount = characterList.length;
  currentCharacters = characterList;
  if (
    activeLogCharacterId !== "all" &&
    !characterList.some((character) => character.characterId === activeLogCharacterId)
  ) {
    activeLogCharacterId = "all";
  }
  setGameCharacters(characterList);
  setText("[data-character-count]", characterCount);
  setText("[data-nav-character-status]", characterCount > 0 ? "Forge More" : "Forge");

  const summaryTarget = document.querySelector("[data-current-character]");
  const listTarget = document.querySelector("[data-character-list]");

  if (!summaryTarget || !listTarget) {
    return;
  }

  summaryTarget.innerHTML = "";
  listTarget.innerHTML = "";

  if (characterCount === 0) {
    selectedCharacterId = null;
    selectedAbilityCharacterId = null;
    unlockedAbilities = [];
    clearAbilityCombo();
    setGameCurrentCharacter(null);
    summaryTarget.append(
      createEmptyPanel(
        "No hero forged yet.",
        "Use the Hero Forge to create your first saved character."
      )
    );
    listTarget.append(
      createEmptyPanel(
        "No character records found.",
        "Open the Hero Forge and save a character through the backend."
      )
    );
    renderAdventureLogScreen();
    renderQuestBoard();
    renderAbilityScreen();
    return;
  }

  const currentCharacter = getSelectedCharacter() || selectCurrentCharacter(characterList);
  selectedCharacterId = currentCharacter.characterId;
  if (
    !selectedAbilityCharacterId ||
    !characterList.some((character) => character.characterId === selectedAbilityCharacterId)
  ) {
    selectedAbilityCharacterId = currentCharacter.characterId;
    clearAbilityCombo();
  }
  setGameCurrentCharacter(currentCharacter);
  summaryTarget.append(createCharacterCard(currentCharacter, true));
  characterList.forEach((character) =>
    listTarget.append(createCharacterCard(character, false, { withActions: true }))
  );
  renderAdventureLogScreen();
  renderQuestBoard();
  renderAbilityScreen();
}

function renderCharacterError(error) {
  const message = getFriendlyDashboardError(error, "Character data could not be loaded.");
  const target = document.querySelector("[data-current-character]");
  currentCharacters = [];
  selectedCharacterId = null;

  if (target) {
    target.innerHTML = "";
    target.append(createEmptyPanel("Character data unavailable.", message));
  }

  renderAdventureLogScreen();
  renderQuestBoard();
  renderAbilityScreen();
}

function renderRegions(regions) {
  const regionList = Array.isArray(regions) ? regions : [];
  currentRegions = regionList;
  setText("[data-region-count]", regionList.length);

  const previewTarget = document.querySelector("[data-region-preview]");
  const panelTarget = document.querySelector("[data-region-list]");
  const mapTarget = document.querySelector("[data-world-map-nodes]");

  if (!previewTarget || !panelTarget || !mapTarget) {
    return;
  }

  previewTarget.innerHTML = "";
  panelTarget.innerHTML = "";
  mapTarget.innerHTML = "";

  if (regionList.length === 0) {
    previewTarget.append(createEmptyPanel("No regions seeded.", "Run npm run db:seed to restore the world map data."));
    panelTarget.append(createEmptyPanel("No map records found.", "The region table returned an empty list."));
    renderRegionDetail(null, { message: "No region records were returned by the backend." });
    renderQuestBoard();
    return;
  }

  regionList.slice(0, 4).forEach((region) => previewTarget.append(createRegionCard(region)));
  regionList.forEach((region) => {
    panelTarget.append(createRegionCard(region, { interactive: true }));
    mapTarget.append(createMapNode(region));
  });

  const firstUnlockedRegion = regionList.find(isRegionUnlocked);

  if (firstUnlockedRegion) {
    selectRegion(firstUnlockedRegion);
    return;
  }

  renderRegionDetail(null, { message: "All regions are currently locked." });
  renderQuestBoard();
}

function renderRegionError(error) {
  const message = getFriendlyDashboardError(error, "Region data could not be loaded.");
  const target = document.querySelector("[data-region-preview]");
  const regionListTarget = document.querySelector("[data-region-list]");
  const mapTarget = document.querySelector("[data-world-map-nodes]");

  if (target) {
    target.innerHTML = "";
    target.append(createEmptyPanel("World map unavailable.", message));
  }

  if (regionListTarget) {
    regionListTarget.innerHTML = "";
    regionListTarget.append(createEmptyPanel("Map records unavailable.", message));
  }

  if (mapTarget) {
    mapTarget.innerHTML = "";
  }

  renderRegionDetail(null, { message });
  currentRegions = [];
  selectedRegionId = null;
  selectedRegionQuests = [];
  questBoardMessage = message;
  renderQuestBoard();
}

function renderLogSummary(logs) {
  const logList = Array.isArray(logs) ? logs : [];
  currentLogs = logList;
  logLoadErrorMessage = "";
  setText("[data-log-count]", logList.length);
  setText("[data-nav-log-status]", logList.length > 0 ? `${logList.length} Logs` : "Empty");

  renderAdventureLogScreen();
}

function renderAdventureLogScreen() {
  ensureActiveLogFilters();
  renderLogProgressSummary();
  renderLogFilters();
  renderLogRegionFilter();
  renderLogCharacterFilter();
  renderLogCharacterProgress();
  renderLogTimeline();
}

function renderLogProgressSummary() {
  const target = document.querySelector("[data-log-progress-summary]");

  if (!target) {
    return;
  }

  const summary = buildLogSummary(currentLogs);
  const filteredSummary = buildLogSummary(
    filterAdventureLogs(currentLogs, {
      outcomeFilter: activeLogFilter,
      regionId: activeLogRegionId
    })
  );

  target.innerHTML = "";
  target.append(
    createLogMetric("Completed", summary.total),
    createLogMetric("Success", summary.success),
    createLogMetric("Failure", summary.failure),
    createLogMetric("Boss", summary.boss),
    createLogMetric("XP Earned", summary.xp),
    createLogMetric("Gold Earned", summary.gold)
  );

  const scopeTarget = document.querySelector("[data-log-scope-summary]");
  if (scopeTarget) {
    scopeTarget.textContent = `${filteredSummary.total} visible in current filters`;
  }
}

function createLogMetric(label, value) {
  const item = document.createElement("div");
  item.className = "log-metric";
  item.innerHTML = `
    <strong>${Number(value || 0)}</strong>
    <span>${escapeHtml(label)}</span>
  `;
  return item;
}

function renderLogFilters() {
  const target = document.querySelector("[data-log-filter-buttons]");

  if (!target) {
    return;
  }

  target.innerHTML = "";
  logOutcomeFilters.forEach((filter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "log-filter-button";
    button.classList.toggle("is-selected", filter.id === activeLogFilter);
    button.setAttribute("aria-pressed", String(filter.id === activeLogFilter));
    button.textContent = filter.label;
    button.addEventListener("click", () => {
      activeLogFilter = filter.id;
      renderAdventureLogScreen();
    });
    target.append(button);
  });
}

function renderLogRegionFilter() {
  const target = document.querySelector("[data-log-region-filter]");

  if (!target) {
    return;
  }

  const regionOptions = getRegionOptions(currentLogs);
  target.innerHTML = `
    <option value="all">All regions</option>
    ${regionOptions
      .map(
        (region) =>
          `<option value="${escapeHtml(region.regionId)}">${escapeHtml(region.regionName)}</option>`
      )
      .join("")}
  `;
  target.value = activeLogRegionId;
  target.onchange = () => {
    activeLogRegionId = target.value;
    renderAdventureLogScreen();
  };
}

function renderLogCharacterFilter() {
  const target = document.querySelector("[data-log-character-filter]");

  if (!target) {
    return;
  }

  const characterOptions = getCharacterOptions(currentLogs, currentCharacters);
  target.innerHTML = `
    <option value="all">All heroes</option>
    ${characterOptions
      .map(
        (character) =>
          `<option value="${escapeHtml(character.characterId)}">${escapeHtml(character.characterName)}</option>`
      )
      .join("")}
  `;
  target.value = activeLogCharacterId;
  target.onchange = async () => {
    activeLogCharacterId = target.value;
    activeLogRegionId = "all";
    await loadAdventureLogsForSelectedScope();
  };
}

function renderLogCharacterProgress() {
  const target = document.querySelector("[data-log-character-progress]");

  if (!target) {
    return;
  }

  target.innerHTML = "";

  if (currentCharacters.length === 0) {
    target.append(createStatusBlock("No hero progress yet.", "Forge a character before the journal can track growth."));
    return;
  }

  currentCharacters.forEach((character) => {
    const progress = buildCharacterProgress(character);
    const item = document.createElement("article");
    item.className = "character-progress-card";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(character.characterName)}</strong>
        <span>${escapeHtml(character.className)} | ${escapeHtml(character.affinity)}</span>
      </div>
      <div class="progress-label">
        <span>Level ${progress.level}</span>
        <span>${progress.xpProgress} / 100 XP</span>
      </div>
      <div class="progress-track mini-progress-track" aria-hidden="true">
        <span style="width: ${progress.xpPercent}%"></span>
      </div>
    `;
    target.append(item);
  });
}

function renderLogTimeline() {
  const target = document.querySelector("[data-log-summary]");

  if (!target) {
    return;
  }

  const filteredLogs = filterAdventureLogs(currentLogs, {
    outcomeFilter: activeLogFilter,
    regionId: activeLogRegionId
  });

  target.innerHTML = "";

  if (logsAreLoading) {
    appendTimelineStatus(target, "Reading the journal.", "Guild records are loading from the backend.");
    return;
  }

  if (logLoadErrorMessage) {
    appendTimelineStatus(target, "Adventure logs unavailable.", logLoadErrorMessage);
    return;
  }

  if (filteredLogs.length === 0) {
    const message =
      currentLogs.length === 0
        ? "The journal is blank. Quest attempts will be written here after they resolve."
        : "No journal entries match these filters yet.";
    appendTimelineStatus(target, "No matching records.", message);
    return;
  }

  filteredLogs.forEach((log) => {
    const item = document.createElement("li");
    item.className = `journal-entry journal-entry-${log.outcome}`;
    item.innerHTML = `
      <span class="timeline-dot" aria-hidden="true"></span>
      <article>
        <div class="journal-entry-header">
          <div>
            <strong>${escapeHtml(log.questTitle || "Recorded Quest")}</strong>
            <span>${escapeHtml(formatLogDate(log.createdAt))}</span>
          </div>
          <span class="badge ${log.outcome === "success" ? "" : "badge-ember"}">${escapeHtml(log.outcome)}</span>
        </div>
        <div class="journal-badge-row">
          <span class="badge badge-steel">${escapeHtml(log.regionName || "Unknown Region")}</span>
          <span class="badge ${log.questType === "boss" ? "badge-ember" : ""}">${escapeHtml(log.questType || "quest")}</span>
          <span class="badge">${escapeHtml(log.characterName || "Unknown Hero")}</span>
        </div>
        <p>${escapeHtml(log.resultText || "Adventure result saved.")}</p>
        <div class="reward-row journal-reward-row">
          <span>+${Number(log.xpGained || 0)} XP</span>
          <span>+${Number(log.goldGained || 0)} Gold</span>
        </div>
      </article>
    `;
    target.append(item);
    animateCardEntrance(item);
  });
}

function appendTimelineStatus(target, title, message) {
  const item = document.createElement("li");
  item.className = "timeline-status-entry";
  item.append(createEmptyPanel(title, message));
  target.append(item);
}

async function loadAdventureLogsForSelectedScope() {
  if (!currentUser?.userId) {
    return;
  }

  logsAreLoading = true;
  logLoadErrorMessage = "";
  renderAdventureLogScreen();

  try {
    const endpoint =
      activeLogCharacterId === "all"
        ? `/users/${currentUser.userId}/adventure-logs`
        : `/characters/${activeLogCharacterId}/adventure-logs`;
    const logs = await requestJson(endpoint);
    logsAreLoading = false;
    renderLogSummary(logs);
  } catch (error) {
    logsAreLoading = false;
    logLoadErrorMessage = getFriendlyDashboardError(error, "Adventure logs could not be loaded.");
    renderAdventureLogScreen();
  }
}

function ensureActiveLogFilters() {
  const regionOptions = getRegionOptions(currentLogs);
  if (
    activeLogRegionId !== "all" &&
    !regionOptions.some((region) => region.regionId === activeLogRegionId)
  ) {
    activeLogRegionId = "all";
  }

  const characterOptions = getCharacterOptions(currentLogs, currentCharacters);
  if (
    activeLogCharacterId !== "all" &&
    !characterOptions.some((character) => character.characterId === activeLogCharacterId)
  ) {
    activeLogCharacterId = "all";
  }
}

function formatLogDate(value) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function createCharacterCard(character, isPrimary, options = {}) {
  const card = document.createElement("article");
  card.className = isPrimary ? "character-card character-card-primary" : "character-card";
  card.dataset.characterId = character.characterId;
  card.innerHTML = `
    <div class="character-card-header">
      <span class="portrait-token" aria-hidden="true">${escapeHtml(character.characterName.charAt(0).toUpperCase())}</span>
      <div>
        <span class="badge">${escapeHtml(character.className)}</span>
        <h3 data-character-name>${escapeHtml(character.characterName)}</h3>
        <p>${escapeHtml(character.origin)} | ${escapeHtml(character.affinity)}</p>
      </div>
    </div>
    <div class="stat-grid compact-stat-grid">
      <span><strong>${Number(character.level || 1)}</strong>Level</span>
      <span><strong>${Number(character.hp || 0)}</strong>HP</span>
      <span><strong>${Number(character.xp || 0)}</strong>XP</span>
      <span><strong>${Number(character.strength || 0)}</strong>STR</span>
      <span><strong>${Number(character.intelligence || 0)}</strong>INT</span>
      <span><strong>${Number(character.agility || 0)}</strong>AGI</span>
    </div>
  `;

  if (options.withActions) {
    const actions = document.createElement("div");
    actions.className = "character-card-actions";
    actions.innerHTML = `
      <button class="btn btn-secondary" type="button" data-character-edit>Edit</button>
      <button class="btn btn-secondary character-delete-button" type="button" data-character-delete>Delete</button>
    `;
    const message = document.createElement("p");
    message.className = "character-card-message";
    message.hidden = true;
    actions.append(message);

    actions.querySelector("[data-character-edit]").addEventListener("click", () => {
      openCharacterEditForm(card, character);
    });
    actions.querySelector("[data-character-delete]").addEventListener("click", () => {
      confirmDeleteCharacter(card, character);
    });

    card.append(actions);
  }

  animateCardEntrance(card);
  return card;
}

function openCharacterEditForm(card, character) {
  const existing = card.querySelector(".character-edit-form");
  if (existing) {
    existing.remove();
    return;
  }

  const form = document.createElement("form");
  form.className = "character-edit-form";
  form.innerHTML = `
    <label class="field compact-field">
      <span>Hero Name</span>
      <input type="text" name="characterName" value="${escapeHtml(character.characterName)}" maxlength="40" required />
    </label>
    <p class="character-edit-hint">Only the hero name can be changed. Origin, class, and affinity are permanent forge choices.</p>
    <p class="character-edit-message" role="alert" hidden></p>
    <div class="character-edit-actions">
      <button class="btn btn-primary" type="submit">Save</button>
      <button class="btn btn-secondary" type="button" data-character-edit-cancel>Cancel</button>
    </div>
  `;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = form.querySelector("input[name='characterName']");
    const messageEl = form.querySelector(".character-edit-message");
    const submitBtn = form.querySelector("button[type='submit']");
    const newName = input.value.trim();
    const validationError = validateCharacterName(newName);

    if (validationError) {
      messageEl.hidden = false;
      messageEl.textContent = validationError;
      return;
    }

    if (newName === character.characterName) {
      form.remove();
      return;
    }

    messageEl.hidden = true;
    setButtonLoading(submitBtn, true, "Saving");

    try {
      const updated = await requestJson(`/characters/${character.characterId}`, {
        method: "PUT",
        body: { characterName: newName }
      });
      currentCharacters = replaceCharacter(currentCharacters, updated);
      if (selectedCharacterId === character.characterId) {
        setGameCurrentCharacter(updated);
      }
      renderCharacters(currentCharacters);
      showAlert(
        document.querySelector("[data-dashboard-alert]"),
        `${updated.characterName} has been renamed.`,
        "success"
      );
    } catch (error) {
      handleCharacterSessionError(error);
      messageEl.hidden = false;
      messageEl.textContent = getCharacterEditErrorMessage(error);
      setButtonLoading(submitBtn, false);
    }
  });

  form.querySelector("[data-character-edit-cancel]").addEventListener("click", () => {
    form.remove();
  });

  card.append(form);
  animateCardEntrance(form);
}

async function confirmDeleteCharacter(card, character) {
  const confirmed = window.confirm(`Dismiss this hero forever?\n\n${character.characterName} will be removed permanently.`);
  if (!confirmed) {
    return;
  }

  const deleteButton = card.querySelector("[data-character-delete]");
  const editButton = card.querySelector("[data-character-edit]");
  setButtonLoading(deleteButton, true, "Dismissing");
  if (editButton) {
    editButton.disabled = true;
  }

  try {
    await requestJson(`/characters/${character.characterId}`, { method: "DELETE" });
    await fadeOutAndRemove(card);
    currentCharacters = currentCharacters.filter(
      (item) => item.characterId !== character.characterId
    );
    if (selectedCharacterId === character.characterId) {
      selectedCharacterId = null;
    }
    if (selectedAbilityCharacterId === character.characterId) {
      selectedAbilityCharacterId = null;
      unlockedAbilities = [];
      clearAbilityCombo();
    }
    renderCharacters(currentCharacters);
    showAlert(
      document.querySelector("[data-dashboard-alert]"),
      `${character.characterName} has been dismissed.`,
      "info"
    );
  } catch (error) {
    handleCharacterSessionError(error);
    setButtonLoading(deleteButton, false);
    if (editButton) {
      editButton.disabled = false;
    }
    const messageEl = card.querySelector(".character-card-message");
    if (messageEl) {
      messageEl.hidden = false;
      messageEl.textContent = getCharacterDeleteErrorMessage(error);
    }
  }
}

function fadeOutAndRemove(element) {
  return new Promise((resolve) => {
    if (!element || typeof element.animate !== "function") {
      element?.remove();
      resolve();
      return;
    }
    const animation = element.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(-6px) scale(0.98)" }
      ],
      { duration: 280, easing: "ease-in", fill: "forwards" }
    );
    animation.onfinish = () => {
      element.remove();
      resolve();
    };
    animation.oncancel = () => {
      element.remove();
      resolve();
    };
  });
}

function handleCharacterSessionError(error) {
  if (error?.status === 401) {
    clearSession();
    setFlashMessage("Your session expired. Login again to manage your heroes.", "error");
    window.setTimeout(() => window.location.replace("./login.html"), 700);
  }
}

function getCharacterEditErrorMessage(error) {
  if (error?.status === 403) {
    return "This hero does not belong to your account.";
  }
  if (error?.status === 404) {
    return "This hero is no longer on record. Refresh the dashboard.";
  }
  if (error?.status === 400) {
    return error.message || "The chosen name was rejected by the realm.";
  }
  if (error?.status >= 500) {
    return "The backend did not answer. Try again in a moment.";
  }
  return error?.message || "The hero could not be renamed.";
}

function getCharacterDeleteErrorMessage(error) {
  if (error?.status === 403) {
    return "This hero does not belong to your account.";
  }
  if (error?.status === 404) {
    return "This hero is no longer on record.";
  }
  if (error?.status >= 500) {
    return "The backend did not answer. Try again in a moment.";
  }
  return error?.message || "The hero could not be dismissed.";
}

function createRegionCard(region, options = {}) {
  const card = document.createElement(options.interactive ? "button" : "article");
  card.className = `region-preview-card ${options.interactive ? "region-preview-button" : ""}`;
  if (options.interactive) {
    card.type = "button";
    card.dataset.regionId = region.regionId;
    card.disabled = !isRegionUnlocked(region);
    card.setAttribute("aria-pressed", "false");
    card.addEventListener("click", () => selectRegion(region));
  }
  card.innerHTML = `
    <div class="region-card-topline">
      <span class="badge ${Number(region.dangerLevel) >= 4 ? "badge-ember" : "badge-steel"}">Danger ${Number(region.dangerLevel || 0)}</span>
      <span>${isRegionUnlocked(region) ? "Unlocked" : "Locked"}</span>
    </div>
    <h3>${escapeHtml(region.name)}</h3>
    <p>${escapeHtml(region.description)}</p>
    <div class="reward-row">
      <span>Level ${Number(region.recommendedLevel || 1)}+</span>
      <span>${escapeHtml(region.shardName || "Shard unknown")}</span>
    </div>
  `;
  animateCardEntrance(card);
  return card;
}

function createMapNode(region) {
  const position = regionPositions[region.regionId] || getFallbackRegionPosition(region);
  const tone = getRegionTone(region);
  const unlocked = isRegionUnlocked(region);
  const node = document.createElement("button");
  node.type = "button";
  node.className = `map-node map-node-${tone} ${unlocked ? "" : "is-locked"}`;
  node.dataset.regionId = region.regionId;
  node.style.left = position.left;
  node.style.top = position.top;
  node.disabled = !unlocked;
  node.setAttribute("aria-pressed", "false");
  node.title = `${region.name} — Danger ${Number(region.dangerLevel || 0)} | Recommended Level ${Number(region.recommendedLevel || 1)}+`;
  node.setAttribute(
    "aria-label",
    `${region.name}, ${unlocked ? "unlocked" : "locked"}, danger ${Number(region.dangerLevel || 0)}, recommended level ${Number(region.recommendedLevel || 1)}`
  );
  node.innerHTML = `
    <span>${escapeHtml(region.name)}</span>
    <small>Level ${Number(region.recommendedLevel || 1)}+</small>
  `;
  node.addEventListener("click", () => selectRegion(region));
  return node;
}

function getFallbackRegionPosition(region) {
  const index = Math.max(0, currentRegions.findIndex((item) => item.regionId === region.regionId));
  const fallbackPositions = [
    { left: "12%", top: "58%", tone: "hearth" },
    { left: "60%", top: "34%", tone: "iron" },
    { left: "27%", top: "22%", tone: "root" },
    { left: "72%", top: "68%", tone: "temple" },
    { left: "42%", top: "46%", tone: "neutral" }
  ];

  return fallbackPositions[index % fallbackPositions.length];
}

async function selectRegion(region) {
  if (!region || !isRegionUnlocked(region)) {
    return;
  }

  selectedRegionId = region.regionId;
  const requestRegionId = region.regionId;
  selectedRegionQuests = [];
  selectedQuestId = null;
  questBoardIsLoading = true;
  questBoardMessage = "";
  updateSelectedRegionNodes();
  renderRegionDetail(region, { isLoading: true });
  renderQuestBoard();

  try {
    const quests = await requestJson(`/regions/${region.regionId}/quests`);

    if (selectedRegionId !== requestRegionId) {
      return;
    }

    selectedRegionQuests = Array.isArray(quests) ? quests : [];
    selectedQuestId = selectedRegionQuests[0]?.questId || null;
    questBoardIsLoading = false;
    questBoardMessage = "";
    renderRegionDetail(region, { quests });
    renderQuestBoard();
  } catch (error) {
    if (selectedRegionId !== requestRegionId) {
      return;
    }

    selectedRegionQuests = [];
    selectedQuestId = null;
    questBoardIsLoading = false;
    questBoardMessage = getFriendlyDashboardError(error, "Region quests could not be loaded.");
    renderRegionDetail(region, {
      message: questBoardMessage
    });
    renderQuestBoard();
  }
}

function updateSelectedRegionNodes() {
  document.querySelectorAll("[data-region-id]").forEach((node) => {
    const isSelected = node.dataset.regionId === selectedRegionId;
    node.classList.toggle("is-selected", isSelected);
    node.setAttribute("aria-pressed", String(isSelected));
  });
}

function renderRegionDetail(region, { quests = null, isLoading = false, message = "" } = {}) {
  const target = document.querySelector("[data-region-detail]");

  if (!target) {
    return;
  }

  if (!region) {
    target.innerHTML = `
      <span class="badge">World Map</span>
      <h3>Select a region</h3>
      <p>${escapeHtml(message || "Region details and available quests will load from the backend.")}</p>
    `;
    return;
  }

  target.innerHTML = `
    <div class="region-detail-header">
      <span class="badge ${Number(region.dangerLevel) >= 4 ? "badge-ember" : "badge-steel"}">
        Danger ${Number(region.dangerLevel || 0)}
      </span>
      <span>${isRegionUnlocked(region) ? "Unlocked" : "Locked"}</span>
    </div>
    <h3>${escapeHtml(region.name)}</h3>
    <p>${escapeHtml(region.description)}</p>
    <div class="region-meta-grid">
      <span><strong>${Number(region.recommendedLevel || 1)}+</strong>Recommended Level</span>
      <span><strong>${escapeHtml(region.faction || "Unaffiliated")}</strong>Faction</span>
      <span><strong>${escapeHtml(region.shardName || "Unknown")}</strong>Shard</span>
    </div>
    <div class="section-heading compact-section-heading">
      <p class="eyebrow">Available Quests</p>
      <h2>${isLoading ? "Loading contracts" : "Quest Signals"}</h2>
    </div>
    <div class="region-quest-list" data-region-quest-list></div>
  `;

  const questTarget = target.querySelector("[data-region-quest-list]");

  if (isLoading) {
    questTarget.append(createStatusBlock("Reading guild contracts.", "The quest board is loading this region's records."));
    return;
  }

  if (message) {
    questTarget.append(createStatusBlock("Quest data unavailable.", message));
    return;
  }

  if (!Array.isArray(quests) || quests.length === 0) {
    questTarget.append(createStatusBlock("No quests posted.", "This region has no available contracts yet."));
    return;
  }

  quests.forEach((quest) => questTarget.append(createQuestPreview(quest)));
  animateCardEntrance(target);
}

function createQuestPreview(quest) {
  const card = document.createElement("article");
  card.className = `quest-card quest-preview-card ${quest.questType === "boss" ? "quest-card-boss" : ""}`;
  card.innerHTML = `
    <span class="badge ${quest.questType === "boss" ? "badge-ember" : ""}">${escapeHtml(quest.questType)}</span>
    <h3>${escapeHtml(quest.title)}</h3>
    <p>${escapeHtml(quest.description)}</p>
    <div class="reward-row">
      <span>${escapeHtml(quest.requiredStat)} ${Number(quest.requiredStatValue || 0)}</span>
      <span>XP ${Number(quest.rewardXp || 0)} / Gold ${Number(quest.rewardGold || 0)}</span>
    </div>
  `;
  animateCardEntrance(card);
  return card;
}

function renderQuestBoard() {
  const regionSummaryTarget = document.querySelector("[data-quest-region-summary]");
  const regionSwitcherTarget = document.querySelector("[data-quest-region-switcher]");
  const characterTarget = document.querySelector("[data-quest-character-list]");
  const questTarget = document.querySelector("[data-quest-list]");

  if (!regionSummaryTarget || !regionSwitcherTarget || !characterTarget || !questTarget) {
    return;
  }

  const selectedRegion = getSelectedRegion();

  renderQuestRegionSummary(regionSummaryTarget, selectedRegion);
  renderQuestRegionSwitcher(regionSwitcherTarget);
  renderQuestCharacterChoices(characterTarget);
  renderQuestContracts(questTarget, selectedRegion);
}

function renderQuestRegionSummary(target, region) {
  if (!region) {
    target.innerHTML = `
      <span class="badge badge-ember">No Region</span>
      <h3>Select a region</h3>
      <p>The quest board follows the currently selected map region.</p>
    `;
    return;
  }

  target.innerHTML = `
    <span class="badge ${Number(region.dangerLevel) >= 4 ? "badge-ember" : "badge-steel"}">Danger ${Number(region.dangerLevel || 0)}</span>
    <h3>${escapeHtml(region.name)}</h3>
    <p>${escapeHtml(region.faction || "Unaffiliated")} | ${escapeHtml(region.shardName || "Shard unknown")}</p>
  `;
}

function renderQuestRegionSwitcher(target) {
  target.innerHTML = "";

  if (currentRegions.length === 0) {
    target.append(createStatusBlock("No regions loaded.", "The quest board needs region records before it can show contracts."));
    return;
  }

  currentRegions.forEach((region) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quest-pill";
    button.dataset.regionId = region.regionId;
    button.classList.toggle("is-selected", region.regionId === selectedRegionId);
    button.disabled = !isRegionUnlocked(region);
    button.textContent = region.name;
    button.addEventListener("click", () => {
      clearQuestResult();
      selectRegion(region);
    });
    target.append(button);
  });
}

function renderQuestCharacterChoices(target) {
  target.innerHTML = "";

  if (currentCharacters.length === 0) {
    const panel = createStatusBlock("No hero selected.", "Forge a character before attempting quests.");
    const link = document.createElement("a");
    link.className = "btn btn-primary compact-link-button";
    link.href = "./characterCreation.html";
    link.textContent = "Forge Hero";
    target.append(panel, link);
    return;
  }

  currentCharacters.forEach((character) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quest-character-card";
    button.dataset.characterId = character.characterId;
    button.classList.toggle("is-selected", character.characterId === selectedCharacterId);
    button.setAttribute("aria-pressed", String(character.characterId === selectedCharacterId));
    button.innerHTML = `
      <strong>${escapeHtml(character.characterName)}</strong>
      <span>${escapeHtml(character.className)} | ${escapeHtml(character.affinity)}</span>
      <small>Level ${Number(character.level || 1)} | XP ${Number(character.xp || 0)}</small>
    `;
    button.addEventListener("click", () => {
      selectedCharacterId = character.characterId;
      setGameCurrentCharacter(character);
      renderQuestBoard();
    });
    target.append(button);
  });
}

function renderQuestContracts(target, region) {
  target.innerHTML = "";

  if (!region) {
    target.append(createEmptyPanel("No region selected.", "Choose a region from the map or quest board."));
    return;
  }

  if (questBoardIsLoading) {
    target.append(createEmptyPanel("Reading guild contracts.", "Quest records are loading from the backend."));
    return;
  }

  if (questBoardMessage) {
    target.append(createEmptyPanel("Quest board unavailable.", questBoardMessage));
    return;
  }

  if (selectedRegionQuests.length === 0) {
    target.append(createEmptyPanel("No contracts posted.", "This region has no quests available yet."));
    return;
  }

  selectedRegionQuests.forEach((quest) => {
    target.append(createQuestAttemptCard(quest));
  });
}

function createQuestAttemptCard(quest) {
  const selectedCharacter = getSelectedCharacter();
  const readiness = buildQuestReadiness(selectedCharacter, quest);
  const bossQuest = isBossQuest(quest);
  const card = document.createElement("article");
  card.className = `quest-card quest-attempt-card ${bossQuest ? "quest-card-boss" : ""}`;
  card.classList.toggle("is-selected", quest.questId === selectedQuestId);
  card.innerHTML = `
    <div class="quest-card-topline">
      <span class="badge ${bossQuest ? "badge-ember" : ""}">${escapeHtml(quest.questType)}</span>
      <span>Difficulty ${Number(quest.difficulty || 0)}</span>
    </div>
    <h3>${escapeHtml(quest.title)}</h3>
    <p>${escapeHtml(quest.description)}</p>
    <div class="quest-requirement-grid">
      <span><strong>${Number(quest.requiredLevel || 1)}+</strong>Level</span>
      <span><strong>${getStatLabel(quest.requiredStat)} ${Number(quest.requiredStatValue || 0)}</strong>Required Stat</span>
      <span><strong>${Number(quest.rewardXp || 0)}</strong>XP</span>
      <span><strong>${Number(quest.rewardGold || 0)}</strong>Gold</span>
    </div>
    <div class="status-block quest-readiness">
      <strong>${escapeHtml(readiness.title)}</strong>
      <span>${escapeHtml(readiness.message)}</span>
    </div>
    <div class="quest-action-row">
      <button class="btn btn-primary" type="button" data-attempt-quest>
        ${bossQuest ? "Start Boss Battle" : "Attempt Quest"}
      </button>
    </div>
  `;

  const attemptButton = card.querySelector("[data-attempt-quest]");
  attemptButton.disabled = isAttemptingQuest || !readiness.canAttempt;
  attemptButton.addEventListener("click", () => {
    if (bossQuest) {
      startBossBattle(quest);
      return;
    }

    attemptQuest(quest, attemptButton);
  });
  animateCardEntrance(card);
  return card;
}

async function startBossBattle(quest) {
  const selectedCharacter = getSelectedCharacter();

  selectedQuestId = quest?.questId || null;

  if (!selectedCharacter) {
    renderQuestBoard();
    renderQuestError("Select a character before starting a boss battle.");
    return;
  }

  if (Number(selectedCharacter.level || 1) < Number(quest.requiredLevel || 1)) {
    renderQuestBoard();
    renderQuestError(
      `${selectedCharacter.characterName} must reach level ${Number(quest.requiredLevel || 1)} before facing this boss.`
    );
    return;
  }

  activeBossQuest = quest;
  activeBossRegion = getSelectedRegion();
  selectedAbilityCharacterId = selectedCharacter.characterId;
  clearAbilityCombo();
  comboErrorMessage = "";
  comboResult = null;
  openAbilitiesPanel();
  renderAbilityScreen();
  await loadUnlockedAbilitiesForSelectedCharacter();

  showAlert(
    document.querySelector("[data-dashboard-alert]"),
    `${quest.title} is armed as a combo boss encounter.`,
    "info"
  );
}

async function attemptQuest(quest, triggerButton) {
  const selectedCharacter = getSelectedCharacter();

  selectedQuestId = quest?.questId || null;

  if (!currentUser) {
    renderQuestBoard();
    renderQuestError("Profile missing. Refresh the dashboard and try again.");
    return;
  }

  if (!selectedCharacter) {
    renderQuestBoard();
    renderQuestError("Select a character before attempting a quest.");
    return;
  }

  isAttemptingQuest = true;
  renderQuestBoard();
  setButtonLoading(triggerButton, true, "Questing");
  renderQuestResultShell("Quest started", "The contract is being resolved by the backend.");

  try {
    const result = await requestJson("/adventures/attempt", {
      method: "POST",
      body: {
        userId: currentUser.userId,
        characterId: selectedCharacter.characterId,
        questId: quest.questId
      }
    });

    currentUser = result.user || currentUser;
    setCurrentUser(currentUser);
    setGameCurrentUser(currentUser);
    renderUserHud(currentUser);

    if (result.character) {
      selectedCharacterId = result.character.characterId;
      currentCharacters = replaceCharacter(currentCharacters, result.character);
      setGameCurrentCharacter(result.character);
      renderCharacters(currentCharacters);
    }

    await refreshAdventureLogs();
    renderQuestResult(result);
    showAlert(
      document.querySelector("[data-dashboard-alert]"),
      `${result.quest?.title || "Quest"} resolved: ${result.outcome}.`,
      result.outcome === "success" ? "success" : "info"
    );
  } catch (error) {
    const message = getAttemptErrorMessage(error);
    renderQuestError(message);

    if (error?.status === 401) {
      clearSession();
      setFlashMessage(message, "error");
      window.setTimeout(() => window.location.replace("./login.html"), 700);
    }
  } finally {
    isAttemptingQuest = false;
    setButtonLoading(triggerButton, false);
    renderQuestBoard();
  }
}

function renderQuestResultShell(title, message) {
  const target = document.querySelector("[data-quest-result]");

  if (!target) {
    return;
  }

  target.innerHTML = `
    <section class="game-panel quest-result-panel">
      <span class="badge badge-steel">Resolving</span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
    </section>
  `;
  animateCardEntrance(target.querySelector(".quest-result-panel"));
}

function renderQuestResult(result) {
  const target = document.querySelector("[data-quest-result]");

  if (!target) {
    return;
  }

  const outcomeClass = result.outcome === "success" ? "quest-result-success" : "quest-result-failure";
  const characterLevelsGained = Number(result.characterProgression?.levelsGained || 0);
  const userLevelsGained = Number(result.userProgression?.levelsGained || 0);

  target.innerHTML = `
    <section class="game-panel quest-result-panel ${outcomeClass}">
      <span class="badge ${result.outcome === "success" ? "" : "badge-ember"}">${escapeHtml(result.outcome)}</span>
      <h3>${escapeHtml(result.quest?.title || "Quest Result")}</h3>
      <p>${escapeHtml(result.resultText || "The quest has been resolved.")}</p>
      <div class="reward-popup-row">
        <span class="reward-popup">+${Number(result.rewards?.xp || 0)} XP</span>
        <span class="reward-popup">+${Number(result.rewards?.gold || 0)} Gold</span>
      </div>
      <div class="quest-requirement-grid">
        <span><strong>${Number(result.challenge?.totalScore || 0)}</strong>Total Score</span>
        <span><strong>${Number(result.challenge?.requiredStatValue || 0)}</strong>Target</span>
        <span><strong>${characterLevelsGained}</strong>Hero Levels</span>
        <span><strong>${userLevelsGained}</strong>Profile Levels</span>
      </div>
      <div class="quest-action-row">
        <button class="btn btn-secondary" type="button" data-open-logs>View Logs</button>
      </div>
    </section>
  `;

  const panel = target.querySelector(".quest-result-panel");
  animateQuestResult(panel, result.outcome);
  target.querySelectorAll(".reward-popup").forEach((element) => animateRewardPopup(element));
  target.querySelector("[data-open-logs]")?.addEventListener("click", openLogsPanel);
}

function renderQuestError(message) {
  const target = document.querySelector("[data-quest-result]");

  if (!target) {
    return;
  }

  target.innerHTML = `
    <section class="game-panel quest-result-panel quest-result-error">
      <span class="badge badge-ember">Quest Blocked</span>
      <h3>Quest attempt failed</h3>
      <p>${escapeHtml(message)}</p>
    </section>
  `;
  animateQuestResult(target.querySelector(".quest-result-panel"), "failure");
}

function clearQuestResult() {
  const target = document.querySelector("[data-quest-result]");

  if (target) {
    target.innerHTML = "";
  }
}

function renderAbilityScreen() {
  const summaryTarget = document.querySelector("[data-ability-character-summary]");
  const characterTarget = document.querySelector("[data-ability-character-list]");
  const statusTarget = document.querySelector("[data-ability-status]");
  const bossTarget = document.querySelector("[data-boss-encounter]");
  const abilityTarget = document.querySelector("[data-ability-list]");
  const slotTarget = document.querySelector("[data-combo-slots]");
  const resultTarget = document.querySelector("[data-combo-result]");
  const resolveButton = document.querySelector("[data-resolve-combo]");
  const clearButton = document.querySelector("[data-clear-combo]");

  if (!summaryTarget || !characterTarget || !statusTarget || !abilityTarget || !slotTarget || !resultTarget) {
    return;
  }

  const selectedCharacter = getSelectedAbilityCharacter();
  renderAbilityCharacterSummary(summaryTarget, selectedCharacter);
  renderAbilityCharacterChoices(characterTarget);
  renderAbilityStatus(statusTarget, selectedCharacter);
  renderBossEncounterPanel(bossTarget, selectedCharacter);
  renderComboSlots(slotTarget);
  renderAbilityGrid(abilityTarget, selectedCharacter);
  renderComboResult(resultTarget);

  const abilityIds = buildComboSequence(selectedComboSlots);
  if (resolveButton) {
    resolveButton.disabled =
      isResolvingCombo || !selectedCharacter || !selectedComboSlots.opener || abilityIds.length === 0;
    resolveButton.textContent = isResolvingCombo
      ? "Resolving"
      : activeBossQuest
        ? "Strike Boss"
        : "Resolve Combo";
    resolveButton.onclick = () => resolveSelectedCombo();
  }

  if (clearButton) {
    clearButton.disabled = isResolvingCombo || abilityIds.length === 0;
    clearButton.onclick = () => {
      clearAbilityCombo();
      renderAbilityScreen();
    };
  }
}

function renderAbilityCharacterSummary(target, character) {
  if (!character) {
    target.innerHTML = `
      <span class="badge badge-ember">No Hero</span>
      <h3>Select a character</h3>
      <p>Ability progression needs a saved character record before unlocks can be read.</p>
    `;
    return;
  }

  target.innerHTML = `
    <span class="badge">${escapeHtml(character.affinity)}</span>
    <h3>${escapeHtml(character.characterName)}</h3>
    <p>${escapeHtml(character.className)} | Level ${Number(character.level || 1)}</p>
    <div class="ability-mini-stat-grid">
      <span><strong>${Number(character.strength || 0)}</strong>STR</span>
      <span><strong>${Number(character.intelligence || 0)}</strong>INT</span>
      <span><strong>${Number(character.agility || 0)}</strong>AGI</span>
      <span><strong>${Number(character.faith || 0)}</strong>FAI</span>
    </div>
  `;
}

function renderAbilityCharacterChoices(target) {
  target.innerHTML = "";

  if (currentCharacters.length === 0) {
    const panel = createStatusBlock("No heroes available.", "Forge a character before unlocking abilities.");
    const link = document.createElement("a");
    link.className = "btn btn-primary compact-link-button";
    link.href = "./characterCreation.html";
    link.textContent = "Forge Hero";
    target.append(panel, link);
    return;
  }

  currentCharacters.forEach((character) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ability-character-card";
    button.classList.toggle("is-selected", character.characterId === selectedAbilityCharacterId);
    button.setAttribute("aria-pressed", String(character.characterId === selectedAbilityCharacterId));
    button.innerHTML = `
      <strong>${escapeHtml(character.characterName)}</strong>
      <span>${escapeHtml(character.className)} | ${escapeHtml(character.affinity)}</span>
      <small>Level ${Number(character.level || 1)} | ${Number(character.xp || 0)} XP</small>
    `;
    button.addEventListener("click", () => selectAbilityCharacter(character.characterId));
    target.append(button);
  });
}

function renderAbilityStatus(target, character) {
  const unlockedCount = unlockedAbilities.length;
  const unlockableCount = character
    ? allAbilities.filter((ability) => getAbilityUnlockState(character, ability, unlockedAbilities).canUnlock).length
    : 0;

  const statusMessage =
    unlockedAbilitiesAreLoading
      ? "Reading this hero's unlocked abilities from the backend."
      : unlockedAbilityErrorMessage || abilityLoadErrorMessage || "Unlock abilities, then place opener, chain, and finisher skills into the combo sequence.";

  target.innerHTML = `
    <div class="ability-status-header">
      <div>
        <span class="badge ${unlockedAbilityErrorMessage || abilityLoadErrorMessage ? "badge-ember" : "badge-steel"}">Progression</span>
        <h3>${character ? "Shardcraft Board" : "No character selected"}</h3>
        <p>${escapeHtml(statusMessage)}</p>
      </div>
      <div class="ability-status-metrics">
        <span><strong>${unlockedCount}</strong>Unlocked</span>
        <span><strong>${unlockableCount}</strong>Ready</span>
        <span><strong>${allAbilities.length}</strong>Total</span>
      </div>
    </div>
  `;
}

function renderBossEncounterPanel(target, character) {
  if (!target) {
    return;
  }

  target.innerHTML = "";

  if (!activeBossQuest) {
    return;
  }

  const boss = buildBossPreview(activeBossQuest, activeBossRegion);
  const canResolve = Boolean(character && selectedComboSlots.opener);

  target.innerHTML = `
    <section class="game-panel boss-encounter-panel">
      <div class="boss-encounter-header">
        <div>
          <span class="badge badge-ember">Boss Encounter</span>
          <h3>${escapeHtml(boss.bossName)}</h3>
          <p>${escapeHtml(boss.lore)}</p>
        </div>
        <button class="slot-clear-button" type="button" data-cancel-boss>Cancel</button>
      </div>
      <div class="boss-stat-grid">
        <span><strong>${Number(boss.hp)}</strong>Boss HP</span>
        <span><strong>${Number(boss.difficulty)}</strong>Difficulty</span>
        <span><strong>${Number(boss.requiredLevel)}+</strong>Level</span>
        <span><strong>${escapeHtml(getStatLabel(boss.weakness))}</strong>Weakness</span>
        <span><strong>${escapeHtml(boss.resistance)}</strong>Resistance</span>
        <span><strong>${Number(boss.rewardXp)} XP / ${Number(boss.rewardGold)} Gold</strong>Reward</span>
      </div>
      <div class="boss-health-track" aria-hidden="true">
        <span style="width: ${Math.min(100, Math.max(18, boss.hp))}%"></span>
      </div>
      <p class="boss-encounter-note">
        ${canResolve
          ? "Build the combo below, then strike the boss. The result is saved to the adventure log."
          : "Select an opener to prepare the first attack sequence."}
      </p>
    </section>
  `;

  target.querySelector("[data-cancel-boss]")?.addEventListener("click", cancelBossBattle);
  animateBossEntrance(target.querySelector(".boss-encounter-panel"));
}

function renderAbilityGrid(target, character) {
  target.innerHTML = "";

  if (abilityLoadErrorMessage) {
    target.append(createEmptyPanel("Ability records unavailable.", abilityLoadErrorMessage));
    return;
  }

  if (!character) {
    target.append(createEmptyPanel("Select a hero.", "Saved characters will show unlockable and locked abilities here."));
    return;
  }

  if (allAbilities.length === 0) {
    target.append(createEmptyPanel("No abilities seeded.", "Run npm run db:seed to restore the ability table."));
    return;
  }

  if (unlockedAbilitiesAreLoading) {
    target.append(createEmptyPanel("Reading ability unlocks.", "The backend is checking this character's progression."));
    return;
  }

  const groupedAbilities = groupAbilitiesByType(allAbilities);

  abilityTypeOrder.forEach((type) => {
    const abilities = groupedAbilities[type] || [];

    if (abilities.length === 0) {
      return;
    }

    const section = document.createElement("section");
    section.className = "ability-type-section";
    section.innerHTML = `
      <div class="ability-type-heading">
        <span class="badge">${escapeHtml(getAbilityTypeLabel(type))}</span>
        <h3>${escapeHtml(getAbilityTypeLabel(type))}</h3>
      </div>
    `;

    const grid = document.createElement("div");
    grid.className = "ability-card-grid";
    abilities.forEach((ability) => grid.append(createAbilityCard(ability, character)));
    section.append(grid);
    target.append(section);
  });
}

function createAbilityCard(ability, character) {
  const unlockState = getAbilityUnlockState(character, ability, unlockedAbilities);
  const slotKey = getComboSlotKey(ability);
  const isSelectedForCombo =
    slotKey !== null && selectedComboSlots[slotKey]?.abilityId === ability.abilityId;
  const card = document.createElement("article");
  const stateClass = unlockState.isUnlocked ? "is-unlocked" : unlockState.canUnlock ? "is-ready" : "is-locked";
  card.className = `ability-card ability-progress-card ${stateClass}`;
  card.classList.toggle("is-selected", isSelectedForCombo);
  card.dataset.abilityId = ability.abilityId;

  const requirementSummary = getRequirementSummary(ability);
  const actionLabel = getAbilityActionLabel({ unlockState, slotKey });
  const reasonText = getAbilityReasonText({ unlockState, slotKey });

  card.innerHTML = `
    <div class="ability-card-topline">
      <span class="badge ${unlockState.isUnlocked ? "" : "badge-steel"}">${escapeHtml(getAbilityTypeLabel(ability.abilityType))}</span>
      <span>${unlockState.isUnlocked ? "Unlocked" : unlockState.canUnlock ? "Ready" : "Locked"}</span>
    </div>
    <h3>${escapeHtml(ability.name)}</h3>
    <p>${escapeHtml(ability.description)}</p>
    <div class="ability-meta-grid">
      <span><strong>${Number(ability.power || 0)}</strong>Power</span>
      <span><strong>${Number(ability.requiredLevel || 1)}+</strong>Level</span>
      <span><strong>${escapeHtml(ability.className || "Any")}</strong>Class</span>
      <span><strong>${escapeHtml(ability.affinity || "Any")}</strong>Affinity</span>
    </div>
    <div class="ability-requirement-row">
      ${requirementSummary.map((requirement) => `<span>${escapeHtml(requirement)}</span>`).join("")}
    </div>
    <p class="ability-reason">${escapeHtml(reasonText)}</p>
    <button class="btn ${unlockState.isUnlocked ? "btn-secondary" : "btn-primary"}" type="button" data-ability-action>
      ${escapeHtml(actionLabel)}
    </button>
  `;

  const actionButton = card.querySelector("[data-ability-action]");
  const canSelectForCombo = unlockState.isUnlocked && slotKey !== null;
  actionButton.disabled = isUnlockingAbility || isResolvingCombo || (!unlockState.canUnlock && !canSelectForCombo);

  if (canSelectForCombo) {
    actionButton.addEventListener("click", () => selectAbilityForCombo(ability));
  } else if (unlockState.canUnlock) {
    actionButton.addEventListener("click", () => unlockAbility(ability));
  }

  animateCardEntrance(card);
  return card;
}

function renderComboSlots(target) {
  const slots = [
    { key: "opener", label: "Opener" },
    { key: "chain", label: "Chain" },
    { key: "finisher", label: "Finisher" }
  ];

  target.innerHTML = "";

  slots.forEach((slot) => {
    const ability = selectedComboSlots[slot.key];
    const item = document.createElement("article");
    item.className = `combo-slot ${ability ? "is-filled" : ""}`;
    item.dataset.comboSlot = slot.key;
    item.innerHTML = `
      <span>${escapeHtml(slot.label)}</span>
      <strong>${ability ? escapeHtml(ability.name) : "Empty"}</strong>
      <small>${ability ? `${Number(ability.power || 0)} power | ${escapeHtml(ability.comboTag || "no tag")}` : "Select an unlocked ability."}</small>
    `;

    if (ability) {
      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "slot-clear-button";
      clearButton.textContent = "Clear";
      clearButton.addEventListener("click", () => {
        selectedComboSlots = { ...selectedComboSlots, [slot.key]: null };
        comboResult = null;
        comboErrorMessage = "";
        renderAbilityScreen();
      });
      item.append(clearButton);
    }

    target.append(item);
  });
}

function renderComboResult(target) {
  target.innerHTML = "";

  if (isResolvingCombo) {
    target.innerHTML = `
      <section class="game-panel combo-result-panel">
        <span class="badge badge-steel">Resolving</span>
        <h3>Combo in motion</h3>
        <p>The selected sequence is being checked against the backend combo rules.</p>
      </section>
    `;
    animateCardEntrance(target.querySelector(".combo-result-panel"));
    return;
  }

  if (comboErrorMessage) {
    target.innerHTML = `
      <section class="game-panel combo-result-panel quest-result-error">
        <span class="badge badge-ember">Combo Blocked</span>
        <h3>Sequence failed</h3>
        <p>${escapeHtml(comboErrorMessage)}</p>
      </section>
    `;
    animateQuestResult(target.querySelector(".combo-result-panel"), "failure");
    return;
  }

  if (!comboResult) {
    return;
  }

  if (activeBossQuest && comboResult.target?.type === "quest") {
    renderBossComboResult(target, comboResult);
    return;
  }

  const bonuses = Array.isArray(comboResult.triggeredBonuses) ? comboResult.triggeredBonuses : [];

  target.innerHTML = `
    <section class="game-panel combo-result-panel quest-result-success">
      <span class="badge">Rating ${escapeHtml(comboResult.comboRating || "C")}</span>
      <h3>${escapeHtml(comboResult.character?.characterName || "Hero")} resolves a combo</h3>
      <p>${escapeHtml(comboResult.narrationText || "The combo resolved through the backend.")}</p>
      <div class="reward-popup-row">
        <span class="reward-popup" data-combo-popup>${Number(comboResult.totalDamage || 0)} Damage</span>
        <span class="reward-popup" data-combo-popup>${Number(comboResult.totalPower || 0)} Power</span>
        <span class="reward-popup" data-combo-popup>+${Number(comboResult.bonusPower || 0)} Bonus</span>
      </div>
      <div class="quest-requirement-grid combo-metric-grid">
        <span><strong>${Number(comboResult.basePower || 0)}</strong>Base</span>
        <span><strong>${Number(comboResult.statBonus || 0)}</strong>Stat</span>
        <span><strong>${Number(comboResult.levelBonus || 0)}</strong>Level</span>
        <span><strong>${escapeHtml(comboResult.target?.outcome || "simulated")}</strong>Target</span>
      </div>
      <div class="combo-bonus-list">
        ${bonuses.length === 0
          ? "<span>No extra bonuses triggered.</span>"
          : bonuses
              .map(
                (bonus) => `
                  <span>
                    <strong>${escapeHtml(bonus.name)} +${Number(bonus.value || 0)}</strong>
                    ${escapeHtml(bonus.description || "")}
                  </span>
                `
              )
              .join("")}
      </div>
    </section>
  `;

  animateQuestResult(target.querySelector(".combo-result-panel"), "success");
  target.querySelectorAll("[data-combo-popup]").forEach((element) => animateRewardPopup(element));
}

function renderBossComboResult(target, result) {
  const outcome = getBossOutcome(result);
  const isVictory = outcome === "victory";
  const bonuses = Array.isArray(result.triggeredBonuses) ? result.triggeredBonuses : [];
  const rewardXp = Number(result.rewards?.xp || result.target?.rewardPreview?.xp || 0);
  const rewardGold = Number(result.rewards?.gold || result.target?.rewardPreview?.gold || 0);
  const requiredPower = Number(result.target?.requiredPower || 0);
  const panelClass = isVictory ? "quest-result-success" : "quest-result-failure";

  target.innerHTML = `
    <section class="game-panel combo-result-panel boss-result-panel ${panelClass}">
      <span class="badge ${isVictory ? "" : "badge-ember"}">${isVictory ? "Victory" : "Defeat"}</span>
      <h3>${escapeHtml(result.quest?.title || activeBossQuest?.title || "Boss Battle")}</h3>
      <p>${escapeHtml(result.resultText || result.narrationText || "The boss encounter resolved through the combo system.")}</p>
      <div class="reward-popup-row">
        <span class="reward-popup" data-combo-popup>${Number(result.totalDamage || 0)} Damage</span>
        <span class="reward-popup" data-combo-popup>${Number(result.totalPower || 0)} Power</span>
        <span class="reward-popup" data-combo-popup>+${rewardXp} XP</span>
        <span class="reward-popup" data-combo-popup>+${rewardGold} Gold</span>
      </div>
      <div class="quest-requirement-grid combo-metric-grid">
        <span><strong>${Number(result.basePower || 0)}</strong>Base</span>
        <span><strong>${Number(result.statBonus || 0)}</strong>Stat</span>
        <span><strong>${Number(result.levelBonus || 0)}</strong>Level</span>
        <span><strong>${requiredPower}</strong>Boss HP</span>
      </div>
      <div class="combo-bonus-list">
        ${bonuses.length === 0
          ? "<span>No extra bonuses triggered.</span>"
          : bonuses
              .map(
                (bonus) => `
                  <span>
                    <strong>${escapeHtml(bonus.name)} +${Number(bonus.value || 0)}</strong>
                    ${escapeHtml(bonus.description || "")}
                  </span>
                `
              )
              .join("")}
      </div>
      <div class="quest-action-row">
        <button class="btn btn-secondary" type="button" data-open-logs>View Logs</button>
        <button class="btn btn-primary" type="button" data-return-quests>Return to Quests</button>
      </div>
    </section>
  `;

  const panel = target.querySelector(".boss-result-panel");
  animateBossEntrance(panel);
  animateQuestResult(panel, isVictory ? "success" : "failure");
  target.querySelectorAll("[data-combo-popup]").forEach((element) => animateRewardPopup(element));
  target.querySelector("[data-open-logs]")?.addEventListener("click", openLogsPanel);
  target.querySelector("[data-return-quests]")?.addEventListener("click", () => {
    cancelBossBattle();
    openQuestsPanel();
  });
}

async function selectAbilityCharacter(characterId) {
  if (selectedAbilityCharacterId === characterId) {
    return;
  }

  selectedAbilityCharacterId = characterId;
  unlockedAbilities = [];
  unlockedAbilityErrorMessage = "";
  clearAbilityCombo();
  renderAbilityScreen();
  await loadUnlockedAbilitiesForSelectedCharacter();
}

async function loadUnlockedAbilitiesForSelectedCharacter() {
  const selectedCharacter = getSelectedAbilityCharacter();

  if (!selectedCharacter) {
    unlockedAbilities = [];
    unlockedAbilitiesAreLoading = false;
    unlockedAbilityErrorMessage = "";
    renderAbilityScreen();
    return;
  }

  const requestCharacterId = selectedCharacter.characterId;
  unlockedAbilitiesAreLoading = true;
  unlockedAbilityErrorMessage = "";
  renderAbilityScreen();

  try {
    const abilityList = await requestJson(`/characters/${requestCharacterId}/abilities`);

    if (selectedAbilityCharacterId !== requestCharacterId) {
      return;
    }

    unlockedAbilities = Array.isArray(abilityList) ? abilityList : [];
    unlockedAbilityErrorMessage = "";
  } catch (error) {
    unlockedAbilities = [];
    unlockedAbilityErrorMessage = getFriendlyDashboardError(
      error,
      "Unlocked abilities could not be loaded."
    );
    handleAbilitySessionError(error);
  } finally {
    if (selectedAbilityCharacterId === requestCharacterId) {
      unlockedAbilitiesAreLoading = false;
      renderAbilityScreen();
    }
  }
}

async function unlockAbility(ability) {
  const selectedCharacter = getSelectedAbilityCharacter();

  if (!selectedCharacter) {
    comboErrorMessage = "Select a character before unlocking abilities.";
    renderAbilityScreen();
    return;
  }

  isUnlockingAbility = true;
  comboErrorMessage = "";
  renderAbilityScreen();

  try {
    await requestJson(`/characters/${selectedCharacter.characterId}/unlock-ability`, {
      method: "POST",
      body: {
        abilityId: ability.abilityId
      }
    });
    await loadUnlockedAbilitiesForSelectedCharacter();
    showAlert(
      document.querySelector("[data-dashboard-alert]"),
      `${ability.name} unlocked for ${selectedCharacter.characterName}.`,
      "success"
    );
  } catch (error) {
    comboErrorMessage = getFriendlyDashboardError(error, "Ability could not be unlocked.");
    handleAbilitySessionError(error);
  } finally {
    isUnlockingAbility = false;
    renderAbilityScreen();
  }
}

function selectAbilityForCombo(ability) {
  const slotKey = getComboSlotKey(ability);

  if (!slotKey) {
    comboErrorMessage = "This support ability is unlocked, but the current combo builder uses opener, chain, and finisher slots.";
    renderAbilityScreen();
    return;
  }

  selectedComboSlots = {
    ...selectedComboSlots,
    [slotKey]: ability
  };
  comboResult = null;
  comboErrorMessage = "";
  renderAbilityScreen();
  animateSelectedComboSlots();
}

async function resolveSelectedCombo() {
  const selectedCharacter = getSelectedAbilityCharacter();
  const abilityIds = buildComboSequence(selectedComboSlots);

  if (!selectedCharacter) {
    comboErrorMessage = "Select a character before resolving a combo.";
    renderAbilityScreen();
    return;
  }

  if (!selectedComboSlots.opener) {
    comboErrorMessage = "Choose an opener before resolving the combo.";
    renderAbilityScreen();
    return;
  }

  if (abilityIds.length === 0) {
    comboErrorMessage = "Select at least one unlocked ability.";
    renderAbilityScreen();
    return;
  }

  isResolvingCombo = true;
  comboResult = null;
  comboErrorMessage = "";
  renderAbilityScreen();

  try {
    const requestBody = {
      characterId: selectedCharacter.characterId,
      abilityIds
    };

    if (activeBossQuest) {
      requestBody.questId = activeBossQuest.questId;
    }

    comboResult = await requestJson("/combos/resolve", {
      method: "POST",
      body: requestBody
    });

    if (comboResult.user) {
      currentUser = comboResult.user;
      setCurrentUser(currentUser);
      setGameCurrentUser(currentUser);
      renderUserHud(currentUser);
    }

    if (comboResult.character?.userId) {
      selectedCharacterId = comboResult.character.characterId;
      selectedAbilityCharacterId = comboResult.character.characterId;
      currentCharacters = replaceCharacter(currentCharacters, comboResult.character);
      setGameCurrentCharacter(comboResult.character);
      renderCharacters(currentCharacters);
    }

    if (comboResult.adventureLog) {
      await refreshAdventureLogs();
    }

    showAlert(
      document.querySelector("[data-dashboard-alert]"),
      activeBossQuest
        ? `${activeBossQuest.title}: ${comboResult.outcome || "resolved"}.`
        : `Combo resolved with rating ${comboResult.comboRating || "C"}.`,
      comboResult.outcome === "failure" ? "info" : "success"
    );
  } catch (error) {
    comboErrorMessage = getFriendlyDashboardError(error, "Combo could not be resolved.");
    handleAbilitySessionError(error);
  } finally {
    isResolvingCombo = false;
    renderAbilityScreen();
    animateSelectedComboSlots();
  }
}

function getAbilityActionLabel({ unlockState, slotKey }) {
  if (unlockState.isUnlocked && slotKey) {
    const slotLabel = slotKey === "finisher" ? "Finisher" : getAbilityTypeLabel(slotKey);
    return `Set ${slotLabel}`;
  }

  if (unlockState.isUnlocked) {
    return "Unlocked";
  }

  if (isUnlockingAbility) {
    return "Unlocking";
  }

  return unlockState.canUnlock ? "Unlock" : "Locked";
}

function getAbilityReasonText({ unlockState, slotKey }) {
  if (unlockState.isUnlocked && slotKey) {
    return "Unlocked. Select it to place it in the combo sequence.";
  }

  if (unlockState.isUnlocked) {
    return "Unlocked support ability. Future battle scenes can use this as setup.";
  }

  if (unlockState.canUnlock) {
    return "This hero meets the level, class, and affinity requirements.";
  }

  return unlockState.reasons.join(" ");
}

function clearAbilityCombo() {
  selectedComboSlots = { opener: null, chain: null, finisher: null };
  comboResult = null;
  comboErrorMessage = "";
}

function getSelectedAbilityCharacter() {
  return currentCharacters.find((character) => character.characterId === selectedAbilityCharacterId) || null;
}

function animateSelectedComboSlots() {
  window.requestAnimationFrame(() => {
    animateComboSequence([...document.querySelectorAll("[data-combo-slot].is-filled")]);
  });
}

function handleAbilitySessionError(error) {
  if (error?.status === 401) {
    clearSession();
    setFlashMessage("Your session expired. Login again to manage abilities.", "error");
    window.setTimeout(() => window.location.replace("./login.html"), 700);
  }
}

async function refreshAdventureLogs() {
  if (!currentUser?.userId) {
    return;
  }

  await loadAdventureLogsForSelectedScope();
}

function openLogsPanel() {
  const logsLink = document.querySelector("[data-panel-link='logs']");

  if (logsLink) {
    logsLink.click();
  }
}

function openAbilitiesPanel() {
  const abilitiesLink = document.querySelector("[data-panel-link='abilities']");

  if (abilitiesLink) {
    abilitiesLink.click();
  }
}

function openQuestsPanel() {
  const questsLink = document.querySelector("[data-panel-link='quests']");

  if (questsLink) {
    questsLink.click();
  }
}

function cancelBossBattle() {
  activeBossQuest = null;
  activeBossRegion = null;
  comboResult = null;
  comboErrorMessage = "";
  clearAbilityCombo();
  renderAbilityScreen();
}

function getSelectedRegion() {
  return currentRegions.find((region) => region.regionId === selectedRegionId) || null;
}

function getSelectedCharacter() {
  return currentCharacters.find((character) => character.characterId === selectedCharacterId) || null;
}

function replaceCharacter(characters, updatedCharacter) {
  const characterList = Array.isArray(characters) ? characters : [];
  const exists = characterList.some(
    (character) => character.characterId === updatedCharacter.characterId
  );

  if (!exists) {
    return [...characterList, updatedCharacter];
  }

  return characterList.map((character) =>
    character.characterId === updatedCharacter.characterId ? updatedCharacter : character
  );
}

function createStatusBlock(title, message) {
  const block = document.createElement("div");
  block.className = "status-block";
  block.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(message)}</span>
  `;
  return block;
}

function isRegionUnlocked(region) {
  return Number(region?.isUnlocked || 0) === 1;
}

function createEmptyPanel(title, message) {
  const panel = document.createElement("div");
  panel.className = "game-panel empty-state compact-empty-state";
  panel.innerHTML = `
    <span class="badge">Status</span>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(message)}</p>
  `;
  animateCardEntrance(panel);
  return panel;
}

function selectCurrentCharacter(characters) {
  return [...characters].sort((left, right) => {
    if (right.level !== left.level) {
      return Number(right.level) - Number(left.level);
    }

    return Number(right.xp) - Number(left.xp);
  })[0];
}

function setDashboardLoading(isLoading) {
  document.querySelectorAll("[data-dashboard-loading]").forEach((element) => {
    element.hidden = !isLoading;
  });
}

function handleDashboardError(error) {
  if (error.status === 401 || error.status === 403) {
    clearSession();
    redirectToLogin("Your session expired. Login again to return to the dashboard.", "error");
    return;
  }

  showAlert(
    document.querySelector("[data-dashboard-alert]"),
    getFriendlyDashboardError(error, "Dashboard data could not be loaded."),
    "error"
  );
}

function getFriendlyDashboardError(error, fallback) {
  if (error?.status >= 500) {
    return "The backend did not answer. Start the server, then refresh the dashboard.";
  }

  return error?.message || fallback;
}

function redirectToLogin(message, type) {
  setFlashMessage(message, type);
  window.location.replace("./login.html");
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = String(value);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

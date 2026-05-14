import { getHealth } from "./api.js";
import { getSessionLabel } from "./state.js";
import { animateCardEntrance, animatePanelSwap } from "./animations/waapi.js";
import { startAmbientParticles } from "./animations/particles.js";

document.addEventListener("DOMContentLoaded", initPageShell);

export function initPageShell() {
  startParticleCanvases();
  bindHealthStatus();
  bindDashboardPanels();
  bindSessionLabels();
  animateInitialCards();
}

export function showAlert(container, message, type = "info") {
  if (!container) {
    return;
  }

  container.className = `alert alert-${type}`;
  container.textContent = message;
  container.hidden = false;
  animateCardEntrance(container);
}

export function setButtonLoading(button, isLoading, loadingText = "Working") {
  if (!button) {
    return;
  }

  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    return;
  }

  button.textContent = button.dataset.originalText || button.textContent;
  button.disabled = false;
}

function startParticleCanvases() {
  document.querySelectorAll("[data-particles]").forEach((canvas) => {
    startAmbientParticles(canvas);
  });
}

async function bindHealthStatus() {
  const statusElements = document.querySelectorAll("[data-health-status]");

  if (statusElements.length === 0) {
    return;
  }

  setStatus(statusElements, "pending", "Checking backend signal");

  try {
    await getHealth();
    setStatus(statusElements, "success", "Backend online");
  } catch (_error) {
    setStatus(statusElements, "error", "Backend unavailable");
  }
}

function setStatus(elements, type, message) {
  elements.forEach((element) => {
    element.innerHTML = "";

    const dot = document.createElement("span");
    dot.className = `status-dot status-dot-${type}`;
    dot.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.textContent = message;

    element.append(dot, text);
  });
}

function bindDashboardPanels() {
  const panels = Array.from(document.querySelectorAll("[data-panel]"));

  if (panels.length === 0) {
    return;
  }

  const links = Array.from(document.querySelectorAll("[data-panel-link]"));

  function activatePanel(panelId) {
    const nextPanel = panels.find((panel) => panel.dataset.panel === panelId);

    if (!nextPanel) {
      return;
    }

    const activePanel = panels.find((panel) => panel.classList.contains("is-active"));

    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel === nextPanel);
    });

    links.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.panelLink === panelId);
    });

    animatePanelSwap(activePanel, nextPanel);
  }

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const panelId = link.dataset.panelLink;

      if (!panelId) {
        return;
      }

      event.preventDefault();
      window.history.replaceState(null, "", `#${panelId}`);
      activatePanel(panelId);
    });
  });

  const initialPanel = window.location.hash.replace("#", "") || "overview";
  activatePanel(initialPanel);
}

function bindSessionLabels() {
  document.querySelectorAll("[data-session-label]").forEach((element) => {
    element.textContent = getSessionLabel();
  });
}

function animateInitialCards() {
  document
    .querySelectorAll(".game-panel, .nav-card, .quest-card, .ability-card, .auth-card")
    .forEach((element) => animateCardEntrance(element));
}

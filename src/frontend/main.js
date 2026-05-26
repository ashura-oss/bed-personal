/**
 * Frontend dashboard for template status checks.
 *
 * The previous task example depended on routes that may no longer exist.
 * This script now only checks endpoints that are available in the base template.
 */

const HEALTH_URL = '/api/health';

const refreshButton = document.getElementById('refresh-btn');
const healthStatus = document.getElementById('health-status');
const healthMessage = document.getElementById('health-message');
const lastChecked = document.getElementById('last-checked');

/**
 * Format a readable local timestamp.
 * @returns {string}
 */
const getTimestamp = () => {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Update the health card UI state.
 * @param {'ok' | 'error' | 'loading'} state
 * @param {string} summary
 * @param {string} details
 */
const setStatus = (state, summary, details) => {
  healthStatus.classList.remove('ok', 'error', 'loading');
  healthStatus.classList.add(state);
  healthStatus.textContent = summary;
  healthMessage.textContent = details;
  lastChecked.textContent = `Last checked: ${getTimestamp()}`;
};

/**
 * Fetch and display API health state.
 */
const loadHealth = async () => {
  setStatus('loading', 'Checking...', 'Waiting for response from /api/health');

  try {
    const response = await fetch(HEALTH_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const statusValue = typeof data.status === 'string' ? data.status : 'unknown';
    setStatus('ok', 'Online', `API responded with status: ${statusValue}`);
  } catch (error) {
    setStatus('error', 'Unavailable', `Could not reach API health endpoint (${error.message}).`);
  }
};

refreshButton.addEventListener('click', loadHealth);

document.addEventListener('DOMContentLoaded', () => {
  loadHealth();
  setInterval(loadHealth, 30000);
});

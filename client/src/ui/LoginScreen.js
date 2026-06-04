import { authService } from "../net/AuthService.js";

/**
 * LoginScreen — shown before the game boots.
 *
 * Supports manual login and a demo shortcut.
 * On success, calls `onSuccess(result)` and removes itself from the DOM.
 */
export class LoginScreen {
  constructor(container, onSuccess) {
    this.container = container;
    this.onSuccess = onSuccess;

    container.classList.add("login-active");
    this.root = this.buildDOM();
    container.appendChild(this.root);
  }

  buildDOM() {
    const el = document.createElement("div");
    el.id = "login-screen";
    el.setAttribute("role", "main");
    el.innerHTML = `
      <div class="rf-panel login-panel">
        <div class="login-crest" aria-hidden="true">
          <span class="login-crest__sigil">&lt;&gt;</span>
        </div>
        <p class="login-kicker">Ashfall Road / Hearthmere Outpost</p>
        <h1 class="rf-title login-title">REALMFORGE</h1>
        <p class="login-sub">Shards of the Worldheart</p>
        <div class="login-seal" aria-hidden="true">
          <span class="login-seal__label">Worldheart Writ</span>
          <span class="login-seal__value">Unbound Passage</span>
        </div>

        <form id="login-form" autocomplete="off" novalidate>
          <div class="login-field">
            <label class="login-label" for="login-username">UNBOUND NAME</label>
            <input
              class="login-input"
              id="login-username"
              type="text"
              placeholder="Username"
              value="demoUnbound"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="login-field">
            <label class="login-label" for="login-password">PASSPHRASE</label>
            <input
              class="login-input"
              id="login-password"
              type="password"
              placeholder="Password"
              value="demo-password-ca1"
              autocomplete="off"
            />
          </div>
          <p class="login-error" id="login-error" aria-live="assertive"></p>
          <div class="login-actions">
            <button class="login-btn" id="btn-login" type="submit">Enter Ashfall Road</button>
            <button class="login-btn login-btn--demo" id="btn-demo" type="button">
              Use Demo Writ
            </button>
          </div>
        </form>
      </div>
    `;

    const form = el.querySelector("#login-form");
    const btnDemo = el.querySelector("#btn-demo");
    const errEl = el.querySelector("#login-error");

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const username = el.querySelector("#login-username")?.value ?? "";
      const password = el.querySelector("#login-password")?.value ?? "";
      void this.attempt(username, password, errEl);
    });

    btnDemo?.addEventListener("click", () => {
      void this.attempt("demoUnbound", "demo-password-ca1", errEl);
    });

    return el;
  }

  async attempt(username, password, errEl) {
    if (errEl) {
      errEl.textContent = "";
    }

    const submitBtn = this.root.querySelector("#btn-login");
    const demoBtn = this.root.querySelector("#btn-demo");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Crossing the Gate...";
    }
    if (demoBtn) {
      demoBtn.disabled = true;
    }

    const res = await authService.login(username, password);
    if (!res.ok) {
      if (errEl) {
        errEl.textContent = res.message;
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Enter Ashfall Road";
      }
      if (demoBtn) {
        demoBtn.disabled = false;
      }
      return;
    }

    this.root.style.transition = "opacity 0.5s ease";
    this.root.style.opacity = "0";
    setTimeout(() => {
      this.container.classList.remove("login-active");
      this.root.remove();
      this.onSuccess({
        user: res.user,
        character: res.character,
        stats: res.stats
      });
    }, 500);
  }

  dispose() {
    this.container.classList.remove("login-active");
    this.root.remove();
  }
}

import { requestJson } from "./api.js";
import { clearSession, consumeFlashMessage, setCurrentUser, setToken } from "./state.js";
import { setButtonLoading, showAlert } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  showStoredAuthMessage();
  bindAuthForms();
  bindLogoutButtons();
});

function showStoredAuthMessage() {
  const storedMessage = consumeFlashMessage();

  if (!storedMessage?.message) {
    return;
  }

  showAlert(
    document.querySelector("[data-auth-shell-message]"),
    storedMessage.message,
    storedMessage.type || "info"
  );
}

function bindAuthForms() {
  document.querySelectorAll("[data-auth-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const messageTarget = document.querySelector("[data-auth-shell-message]");
      const button = form.querySelector("button[type='submit']");
      const action = form.dataset.authForm;
      const usernameInput = form.elements.username;
      const passwordInput = form.elements.password;
      const username = usernameInput?.value.trim() || "";
      const password = passwordInput?.value || "";

      if (!username || !password) {
        clearPassword(passwordInput);
        showAlert(messageTarget, "Enter both username and password.", "error");
        return;
      }

      setButtonLoading(button, true, action === "register" ? "Forging" : "Entering");
      showAlert(messageTarget, action === "register" ? "Forging your profile..." : "Opening the gateway...", "info");

      try {
        const authResult = await submitAuthForm(action, { username, password });

        setToken(authResult.token);
        setCurrentUser(authResult.user);
        clearPassword(passwordInput);
        showAlert(messageTarget, "Gateway opened. Sending you to the dashboard.", "success");

        window.setTimeout(() => {
          window.location.href = "./dashboard.html";
        }, 450);
      } catch (error) {
        clearPassword(passwordInput);
        showAlert(messageTarget, getFriendlyAuthError(error, action), "error");
      } finally {
        setButtonLoading(button, false);
      }
    });
  });
}

async function submitAuthForm(action, credentials) {
  const endpoint = action === "register" ? "/auth/register" : "/auth/login";
  const result = await requestJson(endpoint, {
    method: "POST",
    body: credentials
  });

  if (!result?.token || !result?.user) {
    throw new Error("Auth response was missing the token or user profile.");
  }

  return result;
}

function getFriendlyAuthError(error, action) {
  if (error.status === 409) {
    return "That username is already taken. Try a different adventurer name.";
  }

  if (error.status === 400) {
    return "Enter both username and password.";
  }

  if (error.status === 401) {
    return "Username or password is incorrect.";
  }

  if (error.status >= 500) {
    return "The realm did not answer. Try again after the server is running.";
  }

  if (action === "register") {
    return "The profile forge failed. Check your details and try again.";
  }

  return "The gateway stayed shut. Check your details and try again.";
}

function clearPassword(passwordInput) {
  if (passwordInput) {
    passwordInput.value = "";
  }
}

function bindLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      clearSession();
      window.location.href = "./login.html";
    });
  });
}

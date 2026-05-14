const tokenKey = "realmforge.authToken";
const userKey = "realmforge.currentUser";
const flashKey = "realmforge.flashMessage";

export function getToken() {
  return localStorage.getItem(tokenKey);
}

export function setToken(token) {
  if (!token) {
    clearSession();
    return;
  }

  localStorage.setItem(tokenKey, token);
}

export function getCurrentUser() {
  const rawUser = localStorage.getItem(userKey);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (_error) {
    localStorage.removeItem(userKey);
    return null;
  }
}

export function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(userKey);
    return;
  }

  localStorage.setItem(userKey, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
}

export function hasSession() {
  return Boolean(getToken());
}

export function getSessionLabel() {
  const user = getCurrentUser();

  if (user?.username) {
    return user.username;
  }

  if (hasSession()) {
    return "Token Stored";
  }

  return "Guest Adventurer";
}

export function setFlashMessage(message, type = "info") {
  if (!message) {
    localStorage.removeItem(flashKey);
    return;
  }

  localStorage.setItem(flashKey, JSON.stringify({ message, type }));
}

export function consumeFlashMessage() {
  const rawMessage = localStorage.getItem(flashKey);

  if (!rawMessage) {
    return null;
  }

  localStorage.removeItem(flashKey);

  try {
    return JSON.parse(rawMessage);
  } catch (_error) {
    return null;
  }
}

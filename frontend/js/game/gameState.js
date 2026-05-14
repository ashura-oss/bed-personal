// Central in-memory store for the live game session.
// Hydrated from localStorage on import. Mutators write through so values
// survive a hard reload. Designed to be reused by future Phaser scenes.

import {
  clearSession as clearStoredSession,
  getCurrentUser as getStoredUser,
  setCurrentUser as setStoredUser,
  setToken as setStoredToken
} from "../state.js";

const characterKey = "realmforge.currentCharacter";

const state = {
  currentUser: getStoredUser(),
  currentCharacter: readStoredCharacter(),
  characters: []
};

const listeners = new Set();

export function getCurrentUser() {
  return state.currentUser;
}

export function setCurrentUser(user) {
  state.currentUser = user || null;
  setStoredUser(user || null);
  notify();
}

export function getCurrentCharacter() {
  return state.currentCharacter;
}

export function setCurrentCharacter(character) {
  state.currentCharacter = character || null;

  if (character) {
    localStorage.setItem(characterKey, JSON.stringify(character));
  } else {
    localStorage.removeItem(characterKey);
  }

  notify();
}

export function getCharacters() {
  return state.characters;
}

export function setCharacters(characters) {
  state.characters = Array.isArray(characters) ? characters : [];

  if (!state.currentCharacter && state.characters.length > 0) {
    setCurrentCharacter(selectPrimaryCharacter(state.characters));
    return;
  }

  notify();
}

export function setSession({ user, token }) {
  if (token !== undefined) {
    setStoredToken(token);
  }

  if (user !== undefined) {
    setCurrentUser(user);
  }
}

export function clearGameSession() {
  state.currentUser = null;
  state.currentCharacter = null;
  state.characters = [];
  localStorage.removeItem(characterKey);
  clearStoredSession();
  notify();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (_error) {
      // listeners must not break the store
    }
  });
}

function readStoredCharacter() {
  const raw = localStorage.getItem(characterKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    localStorage.removeItem(characterKey);
    return null;
  }
}

function selectPrimaryCharacter(characters) {
  return [...characters].sort((left, right) => {
    if (right.level !== left.level) {
      return Number(right.level) - Number(left.level);
    }

    return Number(right.xp) - Number(left.xp);
  })[0];
}

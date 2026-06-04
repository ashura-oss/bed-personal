const EVENT_NAME = "realmforge:combat-feedback";

export function emitCombatFeedback(signal) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: signal }));
}

export function subscribeCombatFeedback(listener) {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return () => undefined;
  }

  const handleEvent = event => {
    const feedbackEvent = event;
    if (!feedbackEvent.detail) return;
    listener(feedbackEvent.detail);
  };

  window.addEventListener(EVENT_NAME, handleEvent);

  return () => {
    window.removeEventListener(EVENT_NAME, handleEvent);
  };
}

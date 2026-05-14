export function animateCardEntrance(element) {
  if (!canAnimate(element)) {
    return null;
  }

  return element.animate(
    [
      { opacity: 0, transform: "translateY(10px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    {
      duration: 260,
      easing: "ease-out"
    }
  );
}

export function animatePanelSwap(_oldPanel, newPanel) {
  return animateCardEntrance(newPanel);
}

export function animateRewardPopup(element) {
  if (!canAnimate(element)) {
    return null;
  }

  return element.animate(
    [
      { opacity: 0, transform: "translateY(8px) scale(0.98)" },
      { opacity: 1, transform: "translateY(0) scale(1)" }
    ],
    {
      duration: 220,
      easing: "ease-out"
    }
  );
}

export function animateQuestResult(element, outcome) {
  if (!canAnimate(element)) {
    return null;
  }

  const color = outcome === "success" ? "rgba(93, 143, 104, 0.45)" : "rgba(185, 62, 69, 0.45)";

  return element.animate(
    [
      { boxShadow: "0 0 0 rgba(0, 0, 0, 0)" },
      { boxShadow: `0 0 28px ${color}` },
      { boxShadow: "0 0 0 rgba(0, 0, 0, 0)" }
    ],
    {
      duration: 520,
      easing: "ease-out"
    }
  );
}

export function animateBossEntrance(element) {
  if (!canAnimate(element)) {
    return null;
  }

  return element.animate(
    [
      { opacity: 0, transform: "translateY(18px) scale(0.98)" },
      { opacity: 1, transform: "translateY(0) scale(1)" }
    ],
    {
      duration: 360,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
    }
  );
}

export function animateComboSequence(elements) {
  if (!Array.isArray(elements)) {
    return [];
  }

  return elements
    .filter(canAnimate)
    .map((element, index) =>
      element.animate(
        [
          { transform: "translateY(0)", borderColor: "rgba(216, 175, 98, 0.23)" },
          { transform: "translateY(-3px)", borderColor: "rgba(216, 175, 98, 0.8)" },
          { transform: "translateY(0)", borderColor: "rgba(216, 175, 98, 0.23)" }
        ],
        {
          duration: 280,
          delay: index * 90,
          easing: "ease-out"
        }
      )
    );
}

function canAnimate(element) {
  return Boolean(
    element &&
      typeof element.animate === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

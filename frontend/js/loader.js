const loreLines = [
  "Awakening the Worldheart shards.",
  "Lighting beacons over Hearthmere.",
  "Listening for echoes in Blackroot Forest.",
  "Polishing steel in the Ironvale forges.",
  "Reading omens from the Sunken Temple.",
  "Counting embers on the night wind."
];

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.querySelector("[data-game-loader]");
  if (!loader) {
    return;
  }

  const loreTarget = loader.querySelector("[data-game-loader-lore]");
  let index = 0;
  if (loreTarget) {
    loreTarget.textContent = loreLines[0];
    const rotate = window.setInterval(() => {
      index = (index + 1) % loreLines.length;
      loreTarget.style.opacity = "0";
      window.setTimeout(() => {
        loreTarget.textContent = loreLines[index];
        loreTarget.style.opacity = "1";
      }, 200);
    }, 1400);
    loader.dataset.rotateId = String(rotate);
  }

  const hide = () => {
    if (loader.hidden) {
      return;
    }
    loader.classList.add("is-fading");
    window.setTimeout(() => {
      loader.hidden = true;
      if (loader.dataset.rotateId) {
        window.clearInterval(Number(loader.dataset.rotateId));
      }
    }, 420);
  };

  window.addEventListener("load", () => {
    window.setTimeout(hide, 320);
  });

  window.setTimeout(hide, 3200);
});

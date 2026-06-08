export const OPENING_ASHFALL_ROAD_FLAG = "opening_ashfall_road";
export const BOSS_INTRO_PLAYED_FLAG = "boss_intro_played";
export const FIRST_SHARD_ABSORBED_FLAG = "shard_absorbed_first";
export const HEARTHMERE_REACHED_FLAG = "hearthmere_reached";

export function createOpeningAshfallRoadSequence({ cameraFrom, cameraTo } = {}) {
  return {
    id: "opening_ashfall_road",
    commands: [
      { type: "fade", direction: "out", color: "#050403", duration: 0.45 },
      {
        type: "subtitle",
        text: "The Ashfall Road. One hundred years after the Shattering.",
        duration: 2.7,
        position: "lower-third"
      },
      { type: "fade", direction: "in", color: "#050403", duration: 0.9 },
      cameraFrom && cameraTo
        ? {
            type: "cameraPan",
            from: cameraFrom,
            to: cameraTo,
            duration: 1.6,
            easing: "ease-in-out"
        }
        : { type: "wait", duration: 1.6 },
      { type: "callback", fn: () => {} },
      { type: "subtitle", text: "The Heart remembers you.", duration: 1.8, position: "center" },
      { type: "setFlag", flagId: FIRST_SHARD_ABSORBED_FLAG },
      {
        type: "subtitle",
        text: "Hearthmere's last fire burns ahead.",
        duration: 2.1,
        position: "lower-third"
      },
      { type: "setFlag", flagId: HEARTHMERE_REACHED_FLAG },
      { type: "subtitle", text: "SURVIVE.", duration: 1.4, position: "center" },
      { type: "setFlag", flagId: OPENING_ASHFALL_ROAD_FLAG }
    ]
  };
}

export function createBossIntroFlag(bossId) {
  const id = typeof bossId === "string" && bossId.trim() ? bossId.trim() : "unknown";
  return `boss_intro:${id}`;
}

export function createHollowboundBossIntroSequence({
  bossId,
  bossName = "Hollowbound Caravan Guard",
  subtitle = "Last shield of the Ashfall Road",
  cameraFrom,
  cameraTo
} = {}) {
  return {
    id: createBossIntroFlag(bossId ?? bossName),
    commands: [
      { type: "letterbox", enter: true, duration: 0.4 },
      { type: "desaturate", amount: 0.6, duration: 0.8 },
      cameraFrom && cameraTo
        ? {
            type: "cameraPan",
            from: cameraFrom,
            to: cameraTo,
            duration: 1.5,
            easing: "ease-in-out"
          }
        : { type: "wait", duration: 1.5 },
      { type: "wait", duration: 0.3 },
      { type: "bossReveal", name: bossName, subtitle, duration: 0 },
      { type: "playAudio", soundId: "bossIntro" },
      { type: "wait", duration: 0.8 },
      { type: "desaturate", amount: 0, duration: 0.4 },
      { type: "letterbox", enter: false, duration: 0.3 },
      { type: "setFlag", flagId: BOSS_INTRO_PLAYED_FLAG },
      { type: "setFlag", flagId: createBossIntroFlag(bossId ?? bossName) }
    ]
  };
}

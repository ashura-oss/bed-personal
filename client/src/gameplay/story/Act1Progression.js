export const ACT1_PROGRESS_VERSION = 1;

export const ACT1_MAIN_QUEST_ID = "hearthmere.road_that_still_stands";
export const ACT1_HOLLOWBOUND_GUARD_BOSS_ID = "hearthmere.boss.hollowbound_guard";
export const ACT1_HOLLOWBOUND_GUARD_BOSS_NAME = "Hollowbound Caravan Guard";

export const ACT1_FLAGS = Object.freeze({
  ACT1_STARTED: "act1_started",
  SHARD_ABSORBED_FIRST: "shard_absorbed_first",
  HEARTHMERE_REACHED: "hearthmere_reached",
  QUEST_ROAD_STARTED: "quest_road_started",
  TESSA_MET: "tessa_met",
  TESSA_FORGE_TUTORIAL_COMPLETE: "tessa_forge_tutorial_complete",
  BOSS_GUARD_DEFEATED: "boss_guard_defeated",
  WORLD_MAP_UNLOCKED: "world_map_unlocked",
  ACT1_COMPLETE: "act1_complete"
});

export const ACT1_EVENTS = Object.freeze({
  OPENING_COMPLETED: "act1:opening_completed",
  SHARD_ABSORBED: "act1:shard_absorbed",
  HEARTHMERE_REACHED: "act1:hearthmere_reached",
  ROAD_QUEST_STARTED: "act1:road_quest_started",
  TESSA_MET: "act1:tessa_met",
  TESSA_FORGE_TUTORIAL_COMPLETED: "act1:tessa_forge_tutorial_completed",
  BOSS_GUARD_DEFEATED: "act1:boss_guard_defeated",
  WORLD_MAP_UNLOCKED: "act1:world_map_unlocked"
});

const FLAG_KEYS = Object.freeze(Object.values(ACT1_FLAGS));
const FLAG_KEY_SET = new Set(FLAG_KEYS);
const HOLLOWBOUND_GUARD_ALIASES = Object.freeze([
  ACT1_HOLLOWBOUND_GUARD_BOSS_ID,
  ACT1_HOLLOWBOUND_GUARD_BOSS_NAME,
  "hearthmere.encounter.hollowbound_guard",
  "Hollowbound Guard"
]);

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function createDefaultFlags() {
  return Object.fromEntries(FLAG_KEYS.map((flag) => [flag, false]));
}

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function readFlagsInput(snapshot) {
  if (!isPlainObject(snapshot)) return {};
  if (isPlainObject(snapshot.flags)) return snapshot.flags;
  return snapshot;
}

function normalizeFlags(snapshot) {
  const flags = createDefaultFlags();
  const input = readFlagsInput(snapshot);

  for (const [key, value] of Object.entries(input)) {
    if (FLAG_KEY_SET.has(key)) {
      flags[key] = value === true;
    }
  }

  return applyDerivedFlags(flags);
}

function applyDerivedFlags(flags) {
  const next = {
    ...createDefaultFlags(),
    ...flags
  };

  if (next[ACT1_FLAGS.TESSA_FORGE_TUTORIAL_COMPLETE]) {
    next[ACT1_FLAGS.TESSA_MET] = true;
  }

  if (next[ACT1_FLAGS.BOSS_GUARD_DEFEATED]) {
    next[ACT1_FLAGS.ACT1_COMPLETE] = true;
    next[ACT1_FLAGS.WORLD_MAP_UNLOCKED] = true;
  }

  if (next[ACT1_FLAGS.ACT1_COMPLETE]) {
    next[ACT1_FLAGS.BOSS_GUARD_DEFEATED] = true;
    next[ACT1_FLAGS.WORLD_MAP_UNLOCKED] = true;
  }

  if (
    next[ACT1_FLAGS.QUEST_ROAD_STARTED] ||
    next[ACT1_FLAGS.TESSA_MET] ||
    next[ACT1_FLAGS.BOSS_GUARD_DEFEATED]
  ) {
    next[ACT1_FLAGS.HEARTHMERE_REACHED] = true;
  }

  if (
    next[ACT1_FLAGS.HEARTHMERE_REACHED] ||
    next[ACT1_FLAGS.WORLD_MAP_UNLOCKED] ||
    next[ACT1_FLAGS.ACT1_COMPLETE]
  ) {
    next[ACT1_FLAGS.SHARD_ABSORBED_FIRST] = true;
  }

  if (
    next[ACT1_FLAGS.SHARD_ABSORBED_FIRST] ||
    next[ACT1_FLAGS.HEARTHMERE_REACHED] ||
    next[ACT1_FLAGS.QUEST_ROAD_STARTED]
  ) {
    next[ACT1_FLAGS.ACT1_STARTED] = true;
  }

  return Object.freeze(next);
}

function freezeProgression(flags) {
  return Object.freeze({
    version: ACT1_PROGRESS_VERSION,
    flags: Object.freeze({ ...flags })
  });
}

function normalizeAct1Progression(snapshot) {
  return freezeProgression(normalizeFlags(snapshot));
}

function normalizeEventType(event) {
  return typeof event === "string" ? event : normalizeText(event?.type);
}

function setFlags(state, updates) {
  const current = normalizeAct1Progression(state).flags;
  return freezeProgression(applyDerivedFlags({
    ...current,
    ...updates
  }));
}

export function createAct1Progression(snapshot = null) {
  return normalizeAct1Progression(snapshot);
}

export function serializeAct1Progression(state) {
  return normalizeAct1Progression(state);
}

export function reduceAct1Event(state, event) {
  const eventType = normalizeEventType(event);

  switch (eventType) {
    case ACT1_EVENTS.OPENING_COMPLETED:
      return setFlags(state, {
        [ACT1_FLAGS.ACT1_STARTED]: true,
        [ACT1_FLAGS.SHARD_ABSORBED_FIRST]: true,
        [ACT1_FLAGS.HEARTHMERE_REACHED]: true,
        [ACT1_FLAGS.QUEST_ROAD_STARTED]: true
      });

    case ACT1_EVENTS.SHARD_ABSORBED:
      return setFlags(state, {
        [ACT1_FLAGS.SHARD_ABSORBED_FIRST]: true
      });

    case ACT1_EVENTS.HEARTHMERE_REACHED:
      return setFlags(state, {
        [ACT1_FLAGS.HEARTHMERE_REACHED]: true
      });

    case ACT1_EVENTS.ROAD_QUEST_STARTED:
      return setFlags(state, {
        [ACT1_FLAGS.QUEST_ROAD_STARTED]: true
      });

    case ACT1_EVENTS.TESSA_MET:
      return setFlags(state, {
        [ACT1_FLAGS.TESSA_MET]: true
      });

    case ACT1_EVENTS.TESSA_FORGE_TUTORIAL_COMPLETED:
      return setFlags(state, {
        [ACT1_FLAGS.TESSA_MET]: true,
        [ACT1_FLAGS.TESSA_FORGE_TUTORIAL_COMPLETE]: true
      });

    case ACT1_EVENTS.BOSS_GUARD_DEFEATED:
      return setFlags(state, {
        [ACT1_FLAGS.BOSS_GUARD_DEFEATED]: true,
        [ACT1_FLAGS.WORLD_MAP_UNLOCKED]: true,
        [ACT1_FLAGS.ACT1_COMPLETE]: true
      });

    case ACT1_EVENTS.WORLD_MAP_UNLOCKED:
      return setFlags(state, {
        [ACT1_FLAGS.WORLD_MAP_UNLOCKED]: true
      });

    default:
      return normalizeAct1Progression(state);
  }
}

export function hasAct1Flag(state, flag) {
  const normalizedFlag = normalizeText(flag);
  if (!FLAG_KEY_SET.has(normalizedFlag)) return false;

  return normalizeAct1Progression(state).flags[normalizedFlag] === true;
}

export function isAct1Complete(state) {
  return hasAct1Flag(state, ACT1_FLAGS.ACT1_COMPLETE);
}

export function isAct1WorldMapUnlocked(state) {
  return hasAct1Flag(state, ACT1_FLAGS.WORLD_MAP_UNLOCKED);
}

export function isHollowboundGuardDefeatEvent(event) {
  if (!event || typeof event !== "object") return false;

  const aliases = new Set(HOLLOWBOUND_GUARD_ALIASES.map(normalizeKey).filter(Boolean));
  const values = [
    event.bossId,
    event.id,
    event.arenaId,
    event.encounterId,
    event.name,
    event.bossName
  ];

  return values.some((value) => aliases.has(normalizeKey(value)));
}

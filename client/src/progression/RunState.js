/**
 * RunState — lightweight run persistence via localStorage.
 *
 * Stores the minimal in-session state that must survive a page reload:
 * carried Embers, last Hearthlight position, flask charges, character id,
 * lightweight inventory slot snapshot, normalized quest snapshot,
 * normalized quest reward claim snapshot, and normalized resource depletion
 * snapshot, and ability hotbar loadout snapshot.
 *
 * Full character progression (XP, level, abilities) lives in the backend.
 * This layer only covers the transient "between reloads" state.
 *
 * Schema is versioned so future fields can be added safely.
 */
const STORAGE_KEY = "rf_run_v1";
const SCHEMA_VER = 1;
const DEFAULTS = {
  schemaVersion: SCHEMA_VER,
  embers: 0,
  flaskCharges: 4,
  lastHearthlightX: -5,
  lastHearthlightY: 0,
  lastHearthlightZ: 4,
  inventorySlots: Object.freeze([]),
  questSnapshot: null,
  questRewardSnapshot: null,
  resourceSnapshot: null,
  bossSnapshot: null,
  abilityLoadoutSnapshot: null
};
const UNSAFE_QUEST_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const QUEST_REWARD_SNAPSHOT_VERSION = 1;
const ABILITY_LOADOUT_SNAPSHOT_VERSION = 1;
const ABILITY_LOADOUT_SLOT_IDS = Object.freeze(["q", "e", "r", "1", "2", "3", "4"]);

export function normalizeInventorySlots(slots) {
  if (!Array.isArray(slots)) return [];

  return slots
    .map((slot) => {
      const itemId = typeof slot?.itemId === "string" ? slot.itemId.trim() : "";
      const count = Number.isInteger(slot?.count) ? slot.count : 0;

      if (!itemId || count <= 0) return null;
      return Object.freeze({ itemId, count });
    })
    .filter(Boolean);
}

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function normalizeQuestValue(value, seen) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) return undefined;

    seen.add(value);
    const normalized = value
      .map((entry) => normalizeQuestValue(entry, seen))
      .filter((entry) => entry !== undefined);
    seen.delete(value);
    return Object.freeze(normalized);
  }

  if (isPlainObject(value)) {
    if (seen.has(value)) return undefined;

    seen.add(value);
    const normalized = {};
    for (const [key, entry] of Object.entries(value)) {
      if (UNSAFE_QUEST_KEYS.has(key)) continue;

      const normalizedEntry = normalizeQuestValue(entry, seen);
      if (normalizedEntry !== undefined) {
        normalized[key] = normalizedEntry;
      }
    }
    seen.delete(value);
    return Object.freeze(normalized);
  }

  return undefined;
}

export function normalizeQuestSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) return null;

  return normalizeQuestValue(snapshot, new WeakSet()) ?? null;
}

function normalizeStringIds(ids) {
  if (!Array.isArray(ids)) return null;

  const seen = new Set();
  const normalized = [];

  for (const id of ids) {
    const normalizedId = typeof id === "string" ? id.trim() : "";
    if (!normalizedId || seen.has(normalizedId)) continue;

    seen.add(normalizedId);
    normalized.push(normalizedId);
  }

  return Object.freeze(normalized);
}

export function normalizeQuestRewardSnapshot(snapshot) {
  if (!Array.isArray(snapshot) && !isPlainObject(snapshot)) return null;

  const claimedRewardIds = Array.isArray(snapshot)
    ? normalizeStringIds(snapshot)
    : normalizeStringIds(
      snapshot.claimedRewardIds ??
      snapshot.claimedQuestRewardIds ??
      snapshot.claimedIds
    );

  if (!claimedRewardIds) return null;

  return Object.freeze({
    version: QUEST_REWARD_SNAPSHOT_VERSION,
    claimedRewardIds
  });
}

function normalizeDepletedNodeKeys(keys) {
  if (!Array.isArray(keys)) return null;

  const seen = new Set();
  const normalized = [];

  for (const key of keys) {
    const normalizedKey = typeof key === "string" ? key.trim() : "";
    if (!normalizedKey || seen.has(normalizedKey)) continue;

    seen.add(normalizedKey);
    normalized.push(normalizedKey);
  }

  return Object.freeze(normalized);
}

export function normalizeResourceSnapshot(snapshot) {
  if (!Array.isArray(snapshot) && !isPlainObject(snapshot)) return null;

  const depletedNodes = Array.isArray(snapshot)
    ? normalizeDepletedNodeKeys(snapshot)
    : normalizeDepletedNodeKeys(snapshot.depletedNodes ?? snapshot.depletedKeys);

  if (!depletedNodes) return null;

  return Object.freeze({ depletedNodes });
}

function normalizeBossIds(ids) {
  if (!Array.isArray(ids)) return null;

  const seen = new Set();
  const normalized = [];

  for (const id of ids) {
    const bossId = typeof id === "string" ? id.trim() : "";
    if (!bossId || seen.has(bossId)) continue;

    seen.add(bossId);
    normalized.push(bossId);
  }

  return Object.freeze(normalized);
}

export function normalizeBossSnapshot(snapshot) {
  if (!Array.isArray(snapshot) && !isPlainObject(snapshot)) return null;

  const defeatedBossIds = Array.isArray(snapshot)
    ? normalizeBossIds(snapshot)
    : normalizeBossIds(snapshot.defeatedBossIds ?? snapshot.defeated);

  if (!defeatedBossIds) return null;

  return Object.freeze({ defeatedBossIds });
}

function normalizeAbilitySlotId(value) {
  const slotId = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ABILITY_LOADOUT_SLOT_IDS.includes(slotId) ? slotId : "";
}

function normalizeAbilityId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAbilitySlots(slots) {
  if (!isPlainObject(slots)) return null;

  const normalized = {};
  for (const [rawSlotId, rawAbilityId] of Object.entries(slots)) {
    const slotId = normalizeAbilitySlotId(rawSlotId);
    const abilityId = normalizeAbilityId(rawAbilityId);
    if (!slotId || !abilityId) continue;

    normalized[slotId] = abilityId;
  }

  return Object.freeze(normalized);
}

export function normalizeAbilityLoadoutSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) return null;

  const rawSlots = isPlainObject(snapshot.slots)
    ? snapshot.slots
    : isPlainObject(snapshot.equippedSlots)
      ? snapshot.equippedSlots
      : isPlainObject(snapshot.hotbar)
        ? snapshot.hotbar
        : snapshot;
  const slots = normalizeAbilitySlots(rawSlots);

  if (!slots) return null;

  return Object.freeze({
    version: ABILITY_LOADOUT_SNAPSHOT_VERSION,
    slots
  });
}

function hasQuestSnapshotOption(options) {
  return Object.prototype.hasOwnProperty.call(options ?? {}, "questSnapshot");
}

function hasQuestRewardSnapshotOption(options) {
  return Object.prototype.hasOwnProperty.call(options ?? {}, "questRewardSnapshot");
}

function hasResourceSnapshotOption(options) {
  return Object.prototype.hasOwnProperty.call(options ?? {}, "resourceSnapshot");
}

function hasBossSnapshotOption(options) {
  return Object.prototype.hasOwnProperty.call(options ?? {}, "bossSnapshot");
}

function hasAbilityLoadoutSnapshotOption(options) {
  return Object.prototype.hasOwnProperty.call(options ?? {}, "abilityLoadoutSnapshot");
}

function preservedQuestSnapshot(data, characterId) {
  if (data?.characterId !== characterId) return DEFAULTS.questSnapshot;
  return normalizeQuestSnapshot(data.questSnapshot);
}

function preservedQuestRewardSnapshot(data, characterId) {
  if (data?.characterId !== characterId) return DEFAULTS.questRewardSnapshot;
  return normalizeQuestRewardSnapshot(data.questRewardSnapshot);
}

function preservedResourceSnapshot(data, characterId) {
  if (data?.characterId !== characterId) return DEFAULTS.resourceSnapshot;
  return normalizeResourceSnapshot(data.resourceSnapshot);
}

function preservedBossSnapshot(data, characterId) {
  if (data?.characterId !== characterId) return DEFAULTS.bossSnapshot;
  return normalizeBossSnapshot(data.bossSnapshot);
}

function preservedAbilityLoadoutSnapshot(data, characterId) {
  if (data?.characterId !== characterId) return DEFAULTS.abilityLoadoutSnapshot;
  return normalizeAbilityLoadoutSnapshot(data.abilityLoadoutSnapshot);
}

export class RunState {
  constructor() {
    this.data = null;
  }

  /** Load saved run state for `characterId`, or null if none / wrong schema. */
  load(characterId) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.data = null;
        return null;
      }

      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== SCHEMA_VER || parsed.characterId !== characterId) {
        this.data = null;
        return null;
      }

      this.data = {
        ...DEFAULTS,
        ...parsed,
        inventorySlots: normalizeInventorySlots(parsed.inventorySlots),
        questSnapshot: normalizeQuestSnapshot(parsed.questSnapshot),
        questRewardSnapshot: normalizeQuestRewardSnapshot(parsed.questRewardSnapshot),
        resourceSnapshot: normalizeResourceSnapshot(parsed.resourceSnapshot),
        bossSnapshot: normalizeBossSnapshot(parsed.bossSnapshot),
        abilityLoadoutSnapshot: normalizeAbilityLoadoutSnapshot(parsed.abilityLoadoutSnapshot)
      };
      return this.data;
    } catch {
      this.data = null;
      return null;
    }
  }

  /** Save current run state. */
  save(characterId, embers, flaskCharges, hearthlightPos, options = {}) {
    const saveOptions = options ?? {};
    const questSnapshot = hasQuestSnapshotOption(saveOptions)
      ? normalizeQuestSnapshot(saveOptions.questSnapshot)
      : preservedQuestSnapshot(this.data, characterId);
    const questRewardSnapshot = hasQuestRewardSnapshotOption(saveOptions)
      ? normalizeQuestRewardSnapshot(saveOptions.questRewardSnapshot)
      : preservedQuestRewardSnapshot(this.data, characterId);
    const resourceSnapshot = hasResourceSnapshotOption(saveOptions)
      ? normalizeResourceSnapshot(saveOptions.resourceSnapshot)
      : preservedResourceSnapshot(this.data, characterId);
    const bossSnapshot = hasBossSnapshotOption(saveOptions)
      ? normalizeBossSnapshot(saveOptions.bossSnapshot)
      : preservedBossSnapshot(this.data, characterId);
    const abilityLoadoutSnapshot = hasAbilityLoadoutSnapshotOption(saveOptions)
      ? normalizeAbilityLoadoutSnapshot(saveOptions.abilityLoadoutSnapshot)
      : preservedAbilityLoadoutSnapshot(this.data, characterId);

    this.data = {
      ...DEFAULTS,
      characterId,
      embers,
      flaskCharges,
      lastHearthlightX: hearthlightPos.x,
      lastHearthlightY: hearthlightPos.y,
      lastHearthlightZ: hearthlightPos.z,
      inventorySlots: normalizeInventorySlots(saveOptions.inventorySlots ?? this.data?.inventorySlots),
      questSnapshot,
      questRewardSnapshot,
      resourceSnapshot,
      bossSnapshot,
      abilityLoadoutSnapshot,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  /** Persist just the inventory snapshot, preserving current run data. */
  saveInventory(characterId, inventorySlots, options = {}) {
    const saveOptions = options ?? {};
    const questSnapshot = hasQuestSnapshotOption(saveOptions)
      ? normalizeQuestSnapshot(saveOptions.questSnapshot)
      : preservedQuestSnapshot(this.data, characterId);
    const questRewardSnapshot = hasQuestRewardSnapshotOption(saveOptions)
      ? normalizeQuestRewardSnapshot(saveOptions.questRewardSnapshot)
      : preservedQuestRewardSnapshot(this.data, characterId);
    const resourceSnapshot = hasResourceSnapshotOption(saveOptions)
      ? normalizeResourceSnapshot(saveOptions.resourceSnapshot)
      : preservedResourceSnapshot(this.data, characterId);
    const bossSnapshot = hasBossSnapshotOption(saveOptions)
      ? normalizeBossSnapshot(saveOptions.bossSnapshot)
      : preservedBossSnapshot(this.data, characterId);
    const abilityLoadoutSnapshot = hasAbilityLoadoutSnapshotOption(saveOptions)
      ? normalizeAbilityLoadoutSnapshot(saveOptions.abilityLoadoutSnapshot)
      : preservedAbilityLoadoutSnapshot(this.data, characterId);

    this.data = {
      ...DEFAULTS,
      ...(this.data?.characterId === characterId ? this.data : {}),
      characterId,
      inventorySlots: normalizeInventorySlots(inventorySlots),
      questSnapshot,
      questRewardSnapshot,
      resourceSnapshot,
      bossSnapshot,
      abilityLoadoutSnapshot,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  /** Persist just the quest snapshot, preserving current run data. */
  saveQuestSnapshot(characterId, questSnapshot, options = {}) {
    const saveOptions = options ?? {};
    const questRewardSnapshot = hasQuestRewardSnapshotOption(saveOptions)
      ? normalizeQuestRewardSnapshot(saveOptions.questRewardSnapshot)
      : preservedQuestRewardSnapshot(this.data, characterId);
    const resourceSnapshot = hasResourceSnapshotOption(saveOptions)
      ? normalizeResourceSnapshot(saveOptions.resourceSnapshot)
      : preservedResourceSnapshot(this.data, characterId);
    const bossSnapshot = hasBossSnapshotOption(saveOptions)
      ? normalizeBossSnapshot(saveOptions.bossSnapshot)
      : preservedBossSnapshot(this.data, characterId);
    const abilityLoadoutSnapshot = hasAbilityLoadoutSnapshotOption(saveOptions)
      ? normalizeAbilityLoadoutSnapshot(saveOptions.abilityLoadoutSnapshot)
      : preservedAbilityLoadoutSnapshot(this.data, characterId);

    this.data = {
      ...DEFAULTS,
      ...(this.data?.characterId === characterId ? this.data : {}),
      characterId,
      questSnapshot: normalizeQuestSnapshot(questSnapshot),
      questRewardSnapshot,
      resourceSnapshot,
      bossSnapshot,
      abilityLoadoutSnapshot,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  /** Persist just the quest reward claim snapshot, preserving current run data. */
  saveQuestRewardSnapshot(characterId, questRewardSnapshot, options = {}) {
    const saveOptions = options ?? {};
    const questSnapshot = hasQuestSnapshotOption(saveOptions)
      ? normalizeQuestSnapshot(saveOptions.questSnapshot)
      : preservedQuestSnapshot(this.data, characterId);
    const resourceSnapshot = hasResourceSnapshotOption(saveOptions)
      ? normalizeResourceSnapshot(saveOptions.resourceSnapshot)
      : preservedResourceSnapshot(this.data, characterId);
    const bossSnapshot = hasBossSnapshotOption(saveOptions)
      ? normalizeBossSnapshot(saveOptions.bossSnapshot)
      : preservedBossSnapshot(this.data, characterId);
    const abilityLoadoutSnapshot = hasAbilityLoadoutSnapshotOption(saveOptions)
      ? normalizeAbilityLoadoutSnapshot(saveOptions.abilityLoadoutSnapshot)
      : preservedAbilityLoadoutSnapshot(this.data, characterId);

    this.data = {
      ...DEFAULTS,
      ...(this.data?.characterId === characterId ? this.data : {}),
      characterId,
      questSnapshot,
      questRewardSnapshot: normalizeQuestRewardSnapshot(questRewardSnapshot),
      resourceSnapshot,
      bossSnapshot,
      abilityLoadoutSnapshot,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  /** Persist just the resource depletion snapshot, preserving current run data. */
  saveResourceSnapshot(characterId, resourceSnapshot) {
    this.data = {
      ...DEFAULTS,
      ...(this.data?.characterId === characterId ? this.data : {}),
      characterId,
      resourceSnapshot: normalizeResourceSnapshot(resourceSnapshot),
      bossSnapshot: preservedBossSnapshot(this.data, characterId),
      questSnapshot: preservedQuestSnapshot(this.data, characterId),
      questRewardSnapshot: preservedQuestRewardSnapshot(this.data, characterId),
      abilityLoadoutSnapshot: preservedAbilityLoadoutSnapshot(this.data, characterId),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  /** Persist just the boss snapshot, preserving current run data. */
  saveBossSnapshot(characterId, bossSnapshot) {
    this.data = {
      ...DEFAULTS,
      ...(this.data?.characterId === characterId ? this.data : {}),
      characterId,
      bossSnapshot: normalizeBossSnapshot(bossSnapshot),
      questSnapshot: preservedQuestSnapshot(this.data, characterId),
      questRewardSnapshot: preservedQuestRewardSnapshot(this.data, characterId),
      resourceSnapshot: preservedResourceSnapshot(this.data, characterId),
      abilityLoadoutSnapshot: preservedAbilityLoadoutSnapshot(this.data, characterId),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  /** Persist just the ability hotbar loadout snapshot, preserving current run data. */
  saveAbilityLoadoutSnapshot(characterId, abilityLoadoutSnapshot) {
    this.data = {
      ...DEFAULTS,
      ...(this.data?.characterId === characterId ? this.data : {}),
      characterId,
      abilityLoadoutSnapshot: normalizeAbilityLoadoutSnapshot(abilityLoadoutSnapshot),
      questSnapshot: preservedQuestSnapshot(this.data, characterId),
      questRewardSnapshot: preservedQuestRewardSnapshot(this.data, characterId),
      resourceSnapshot: preservedResourceSnapshot(this.data, characterId),
      bossSnapshot: preservedBossSnapshot(this.data, characterId),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  /** Clear run state (on logout or fresh start). */
  clear() {
    this.data = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  get current() {
    return this.data;
  }
}

export const runState = new RunState();

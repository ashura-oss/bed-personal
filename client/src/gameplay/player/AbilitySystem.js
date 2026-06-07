import {
  ABILITY_DEFINITIONS,
  ABILITY_SLOT_IDS,
  buildAbilityDefinitionView,
  getAbilityDefinition
} from "./AbilityDefinitions.js";

const VALID_SLOT_SET = new Set(ABILITY_SLOT_IDS);

export class AbilitySystem {
  constructor(options = {}) {
    this.definitions = options.definitions ?? ABILITY_DEFINITIONS;
    this.definitionById = new Map(this.definitions.map((definition) => [definition.abilityId, definition]));
    this.unlockedAbilityIds = new Set();
    this.equippedSlots = createEmptySlots();
    this.cooldownEnds = new Map();
    this.time = Number.isFinite(options.time) ? options.time : 0;
    this.fp = options.fp ?? null;

    this.unlockAbilities(options.unlockedAbilityIds ?? []);

    const equippedSlots = options.equippedSlots ?? options.slots;
    if (equippedSlots) {
      this.loadEquippedSlots(equippedSlots);
    }

    if (options.cooldowns) {
      this.loadCooldowns(options.cooldowns);
    }
  }

  get slotIds() {
    return ABILITY_SLOT_IDS;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.time += dt;
    this.pruneExpiredCooldowns();
  }

  getAbility(abilityId) {
    return this.definitionById.get(abilityId) ?? getAbilityDefinition(abilityId);
  }

  unlockAbility(abilityId) {
    this.assertKnownAbility(abilityId);
    this.unlockedAbilityIds.add(abilityId);
    return this.getAbility(abilityId);
  }

  unlockAbilities(abilityIds) {
    for (const abilityId of abilityIds) {
      if (this.getAbility(abilityId)) {
        this.unlockedAbilityIds.add(abilityId);
      }
    }
    return this.getUnlockedAbilityIds();
  }

  lockAbility(abilityId) {
    this.unlockedAbilityIds.delete(abilityId);
    for (const slot of ABILITY_SLOT_IDS) {
      if (this.equippedSlots[slot] === abilityId) {
        this.equippedSlots[slot] = null;
      }
    }
  }

  isUnlocked(abilityId) {
    return this.unlockedAbilityIds.has(abilityId);
  }

  equipAbility(slot, abilityId) {
    const normalizedSlot = normalizeSlot(slot);
    this.assertKnownAbility(abilityId);

    if (!this.isUnlocked(abilityId)) {
      return { ok: false, reason: "locked", slot: normalizedSlot, ability: this.getAbility(abilityId) };
    }

    this.equippedSlots[normalizedSlot] = abilityId;
    return { ok: true, slot: normalizedSlot, ability: this.getAbility(abilityId) };
  }

  unequipSlot(slot) {
    const normalizedSlot = normalizeSlot(slot);
    const abilityId = this.equippedSlots[normalizedSlot];
    this.equippedSlots[normalizedSlot] = null;
    return abilityId;
  }

  loadEquippedSlots(equippedSlots) {
    for (const slot of ABILITY_SLOT_IDS) {
      const abilityId = equippedSlots[slot] ?? null;
      if (!abilityId) {
        this.equippedSlots[slot] = null;
      } else if (this.getAbility(abilityId) && this.isUnlocked(abilityId)) {
        this.equippedSlots[slot] = abilityId;
      }
    }
  }

  getEquippedAbility(slot) {
    const abilityId = this.equippedSlots[normalizeSlot(slot)];
    return abilityId ? this.getAbility(abilityId) : null;
  }

  getEquippedSlots() {
    return { ...this.equippedSlots };
  }

  getUnlockedAbilityIds() {
    return this.definitions
      .map((definition) => definition.abilityId)
      .filter((abilityId) => this.unlockedAbilityIds.has(abilityId));
  }

  getUnlockedAbilities() {
    return this.getUnlockedAbilityIds().map((abilityId) => this.getAbility(abilityId));
  }

  getCooldownRemaining(abilityId) {
    const cooldownEnd = this.cooldownEnds.get(abilityId) ?? 0;
    return Math.max(0, cooldownEnd - this.time);
  }

  isOnCooldown(abilityId) {
    return this.getCooldownRemaining(abilityId) > 0;
  }

  resetCooldown(abilityId) {
    this.cooldownEnds.delete(abilityId);
  }

  resetCooldowns() {
    this.cooldownEnds.clear();
  }

  pruneExpiredCooldowns() {
    for (const [abilityId, cooldownEnd] of this.cooldownEnds.entries()) {
      if (cooldownEnd <= this.time) {
        this.cooldownEnds.delete(abilityId);
      }
    }
  }

  canUseSlot(slot, options = {}) {
    const normalizedSlot = normalizeSlot(slot);
    const ability = this.getEquippedAbility(normalizedSlot);

    if (!ability) {
      return { ok: false, reason: "empty-slot", slot: normalizedSlot, ability: null };
    }

    if (!this.isUnlocked(ability.abilityId)) {
      return { ok: false, reason: "locked", slot: normalizedSlot, ability };
    }

    const cooldownRemaining = this.getCooldownRemaining(ability.abilityId);
    if (cooldownRemaining > 0) {
      return {
        ok: false,
        reason: "cooldown",
        slot: normalizedSlot,
        ability,
        cooldownRemaining
      };
    }

    const fp = options.fp ?? this.fp;
    if (!canSpendFp(fp, ability.fpCost)) {
      return {
        ok: false,
        reason: "fp",
        slot: normalizedSlot,
        ability,
        fpCost: ability.fpCost,
        fpAvailable: getFpValue(fp)
      };
    }

    return { ok: true, slot: normalizedSlot, ability };
  }

  useSlot(slot, options = {}) {
    const gate = this.canUseSlot(slot, options);
    if (!gate.ok) return gate;

    const ability = gate.ability;
    const fp = options.fp ?? this.fp;
    const target = ability.damage > 0 ? this.selectTarget(ability, options) : null;

    if (ability.damage > 0 && !target) {
      return { ok: false, reason: "no-target", slot: gate.slot, ability };
    }

    if (!spendFp(fp, ability.fpCost)) {
      return {
        ok: false,
        reason: "fp",
        slot: gate.slot,
        ability,
        fpCost: ability.fpCost,
        fpAvailable: getFpValue(fp)
      };
    }

    const application = target ? applyAbilityToTarget(ability, target) : null;
    this.cooldownEnds.set(ability.abilityId, this.time + ability.cooldown);

    return {
      ok: true,
      slot: gate.slot,
      ability,
      target,
      application,
      cooldownRemaining: ability.cooldown,
      fpCost: ability.fpCost
    };
  }

  selectTarget(abilityOrId, options = {}) {
    const ability = typeof abilityOrId === "string" ? this.getAbility(abilityOrId) : abilityOrId;
    if (!ability) return null;

    if (options.target && isDamageableTarget(options.target)) {
      return isTargetInRange(options.target, ability, options) ? options.target : null;
    }

    const targets = Array.isArray(options.targets) ? options.targets : [];
    let selected = null;
    let selectedDistance = Infinity;

    for (const target of targets) {
      if (!isDamageableTarget(target) || !isTargetAlive(target)) continue;

      const distance = distanceToTarget(target, options.origin ?? options.playerPosition);
      if (distance > ability.range) continue;
      if (!isInsideDirectionCone(target, options)) continue;

      if (distance < selectedDistance) {
        selected = target;
        selectedDistance = distance;
      }
    }

    return selected;
  }

  getHotbarViewModel(options = {}) {
    return ABILITY_SLOT_IDS.map((slot) => {
      const ability = this.getEquippedAbility(slot);
      const cooldownRemaining = ability ? this.getCooldownRemaining(ability.abilityId) : 0;
      const fp = options.fp ?? this.fp;

      return {
        slot,
        keyGlyph: slot,
        ability: buildAbilityDefinitionView(ability, slot),
        abilityId: ability?.abilityId ?? null,
        icon: ability?.icon ?? null,
        glyph: ability?.glyph ?? null,
        fpCost: ability?.fpCost ?? 0,
        cooldown: ability?.cooldown ?? 0,
        cooldownRemaining,
        isEmpty: !ability,
        isUnlocked: ability ? this.isUnlocked(ability.abilityId) : false,
        canUse: ability ? cooldownRemaining <= 0 && canSpendFp(fp, ability.fpCost) : false
      };
    });
  }

  getAbilityMenuViewModel(options = {}) {
    const fp = options.fp ?? this.fp;
    return this.definitions.map((ability) => {
      const slot = getEquippedSlotForAbility(this.equippedSlots, ability.abilityId);
      const cooldownRemaining = this.getCooldownRemaining(ability.abilityId);
      const isUnlocked = this.isUnlocked(ability.abilityId);

      return {
        ...buildAbilityDefinitionView(ability, slot),
        isUnlocked,
        isEquipped: Boolean(slot),
        cooldownRemaining,
        canEquip: isUnlocked,
        canUse: isUnlocked && cooldownRemaining <= 0 && canSpendFp(fp, ability.fpCost)
      };
    });
  }

  serializeLoadout() {
    this.pruneExpiredCooldowns();

    return {
      unlockedAbilityIds: this.getUnlockedAbilityIds(),
      equippedSlots: this.getEquippedSlots(),
      cooldowns: Array.from(this.cooldownEnds.entries())
        .map(([abilityId, cooldownEnd]) => ({
          abilityId,
          remaining: Math.max(0, cooldownEnd - this.time)
        }))
        .filter((entry) => entry.remaining > 0)
    };
  }

  loadLoadout(state = {}) {
    this.unlockedAbilityIds.clear();
    this.equippedSlots = createEmptySlots();
    this.cooldownEnds.clear();

    this.unlockAbilities(state.unlockedAbilityIds ?? []);
    this.loadEquippedSlots(state.equippedSlots ?? {});
    this.loadCooldowns(state.cooldowns ?? []);
  }

  loadCooldowns(cooldowns) {
    const entries = Array.isArray(cooldowns)
      ? cooldowns
      : Object.entries(cooldowns).map(([abilityId, remaining]) => ({ abilityId, remaining }));

    for (const entry of entries) {
      const abilityId = entry.abilityId;
      const remaining = Number(entry.remaining ?? entry.cooldownRemaining ?? entry[1] ?? 0);
      if (this.getAbility(abilityId) && remaining > 0) {
        this.cooldownEnds.set(abilityId, this.time + remaining);
      }
    }
  }

  assertKnownAbility(abilityId) {
    if (!this.getAbility(abilityId)) {
      throw new Error(`Unknown ability id: ${abilityId}`);
    }
  }
}

export function applyAbilityToTarget(ability, target) {
  const damage = Number(ability.damage ?? 0);
  if (damage <= 0 || !target) return { damage: 0, died: false, method: "none" };

  if (typeof target.hit === "function") {
    const result = target.hit(damage);
    return normalizeApplicationResult(result, damage, "hit");
  }

  if (typeof target.takeDamage === "function") {
    const hpBefore = Number.isFinite(target.hp) ? target.hp : null;
    target.takeDamage(damage);
    const hpAfter = Number.isFinite(target.hp) ? target.hp : null;

    return {
      damage: hpBefore !== null && hpAfter !== null ? Math.max(0, hpBefore - hpAfter) : damage,
      died: target.isDead === true || target.alive === false || target.isAlive === false,
      method: "takeDamage"
    };
  }

  return { damage: 0, died: false, method: "none" };
}

export function canSpendFp(fp, amount) {
  if (amount <= 0) return true;
  if (!fp) return false;
  if (typeof fp.canSpend === "function") return fp.canSpend(amount);

  const value = getFpValue(fp);
  return value !== null && value >= amount;
}

export function spendFp(fp, amount) {
  if (amount <= 0) return true;
  if (!canSpendFp(fp, amount)) return false;

  if (typeof fp.spend === "function") return fp.spend(amount) !== false;

  const value = getFpValue(fp);
  if (value === null) return false;

  if (typeof fp.set === "function") {
    fp.set(value - amount);
    return true;
  }

  if ("value" in fp) {
    fp.value = value - amount;
    return true;
  }

  if ("_value" in fp) {
    fp._value = value - amount;
    return true;
  }

  return false;
}

export function getFpValue(fp) {
  if (!fp) return null;
  if (Number.isFinite(fp.value)) return fp.value;
  if (Number.isFinite(fp._value)) return fp._value;
  return null;
}

function createEmptySlots() {
  return Object.fromEntries(ABILITY_SLOT_IDS.map((slot) => [slot, null]));
}

function normalizeSlot(slot) {
  const normalizedSlot = String(slot).toUpperCase();
  if (!VALID_SLOT_SET.has(normalizedSlot)) {
    throw new Error(`Invalid ability slot: ${slot}`);
  }
  return normalizedSlot;
}

function getEquippedSlotForAbility(equippedSlots, abilityId) {
  return ABILITY_SLOT_IDS.find((slot) => equippedSlots[slot] === abilityId) ?? null;
}

function normalizeApplicationResult(result, fallbackDamage, method) {
  if (result && typeof result === "object") {
    return {
      ...result,
      damage: Number.isFinite(result.damage) ? result.damage : fallbackDamage,
      died: result.died === true || result.killed === true,
      method
    };
  }

  return {
    damage: fallbackDamage,
    died: false,
    method
  };
}

function isDamageableTarget(target) {
  return Boolean(target && (typeof target.hit === "function" || typeof target.takeDamage === "function"));
}

function isTargetAlive(target) {
  if (target.isDead === true) return false;
  if (target.alive === false) return false;
  if (target.isAlive === false) return false;
  return true;
}

function isTargetInRange(target, ability, options) {
  if (!isTargetAlive(target)) return false;
  if (!Number.isFinite(ability.range) || ability.range <= 0) return true;
  return distanceToTarget(target, options.origin ?? options.playerPosition) <= ability.range;
}

function distanceToTarget(target, origin) {
  if (!origin) return 0;
  const position = getPosition(target);
  if (!position) return Infinity;

  const dx = numberOrZero(position.x) - numberOrZero(origin.x);
  const dy = numberOrZero(position.y) - numberOrZero(origin.y);
  const dz = numberOrZero(position.z) - numberOrZero(origin.z);
  return Math.hypot(dx, dy, dz);
}

function isInsideDirectionCone(target, options) {
  const direction = options.direction ?? options.playerForward;
  const origin = options.origin ?? options.playerPosition;
  const coneDot = options.coneDot ?? 0;

  if (!direction || !origin) return true;

  const position = getPosition(target);
  if (!position) return false;

  const toTarget = {
    x: numberOrZero(position.x) - numberOrZero(origin.x),
    y: numberOrZero(position.y) - numberOrZero(origin.y),
    z: numberOrZero(position.z) - numberOrZero(origin.z)
  };
  const toTargetLength = Math.hypot(toTarget.x, toTarget.y, toTarget.z);
  const directionLength = Math.hypot(
    numberOrZero(direction.x),
    numberOrZero(direction.y),
    numberOrZero(direction.z)
  );

  if (toTargetLength === 0 || directionLength === 0) return true;

  const dot = (
    toTarget.x * numberOrZero(direction.x)
    + toTarget.y * numberOrZero(direction.y)
    + toTarget.z * numberOrZero(direction.z)
  ) / (toTargetLength * directionLength);

  return dot >= coneDot;
}

function getPosition(entity) {
  return entity.position ?? entity;
}

function numberOrZero(value) {
  return Number.isFinite(value) ? value : 0;
}

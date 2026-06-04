/**
 * StaminaSystem — pure stamina resource with spend / regen logic.
 *
 * No WebGL or UIBus dependency — fully testable with Jest.
 * Callers emit UIBus events when `update()` returns true (value changed).
 */
export class StaminaSystem {
  constructor(config = {}) {
    this.regenTimer = 0;
    this.max = config.max ?? 100;
    this.regenRate = config.regenRate ?? 30;
    this.regenDelay = config.regenDelay ?? 1.0;
    this._value = this.max;
  }

  get value() {
    return this._value;
  }

  get ratio() {
    return this._value / this.max;
  }

  get isEmpty() {
    return this._value <= 0;
  }

  /** True if current stamina is at least `amount`. */
  canSpend(amount) {
    return this._value >= amount;
  }

  /**
   * Deduct `amount` from stamina and reset the regen timer.
   * Returns false (no-op) if there is insufficient stamina.
   */
  spend(amount) {
    if (this._value < amount) return false;
    this._value = Math.max(0, this._value - amount);
    this.regenTimer = this.regenDelay;
    return true;
  }

  /**
   * Advance the regen timer and regenerate stamina.
   * Returns `true` if the value changed — caller should emit UIBus events.
   */
  update(dt) {
    const before = this._value;

    if (this.regenTimer > 0) {
      this.regenTimer = Math.max(0, this.regenTimer - dt);
    } else if (this._value < this.max) {
      this._value = Math.min(this.max, this._value + this.regenRate * dt);
    }

    return this._value !== before;
  }

  /** Instantly restore stamina to full and cancel the regen delay. */
  restoreAll() {
    this._value = this.max;
    this.regenTimer = 0;
  }
}

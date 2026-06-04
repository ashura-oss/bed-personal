/**
 * ResourceBar — generic bounded resource (HP, FP, flask charges, Embers).
 *
 * Pure class, no WebGL dependency. Callers emit UIBus events when the value changes.
 */
export class ResourceBar {
  constructor(max, initial) {
    this.max = max;
    this._value = initial ?? max;
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

  get isFull() {
    return this._value >= this.max;
  }

  damage(amount) {
    this._value = Math.max(0, this._value - amount);
  }

  heal(amount) {
    this._value = Math.min(this.max, this._value + amount);
  }

  set(value) {
    this._value = Math.max(0, Math.min(this.max, value));
  }

  restoreAll() {
    this._value = this.max;
  }
}

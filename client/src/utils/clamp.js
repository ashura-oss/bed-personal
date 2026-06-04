export function clamp(value, min, max) {
  if (min > max) {
    throw new RangeError("clamp min cannot be greater than max");
  }

  return Math.min(Math.max(value, min), max);
}

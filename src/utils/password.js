// Password helper functions keep password hashing out of controllers and models.
// The backend stores only salted password hashes, never plain text passwords.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Hashes one plain text password with a random salt.
// The returned value stores the salt and hash together for later login checks.
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

// Compares one plain text password against a stored salted hash.
// timingSafeEqual avoids returning faster for partially matching hashes.
export function verifyPassword(password, storedPasswordHash) {
  const [salt, storedHash] = storedPasswordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const passwordHash = scryptSync(password, salt, 64);
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  if (passwordHash.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(passwordHash, storedHashBuffer);
}

// Checks password rules before hashing.
// Kept simple for CA1 while still rejecting blank or very short passwords.
export function validatePassword(password) {
  if (typeof password !== "string" || password.trim().length === 0) {
    return "password is required and must be a non-empty string.";
  }

  if (password.length < 6) {
    return "password must be at least 6 characters long.";
  }

  return null;
}

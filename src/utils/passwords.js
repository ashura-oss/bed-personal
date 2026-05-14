import bcrypt from "bcrypt";

const saltRounds = 10;

export function isBcryptHash(password) {
  return typeof password === "string" && /^\$2[aby]\$\d{2}\$/.test(password);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(plainPassword, storedPassword) {
  if (!isBcryptHash(storedPassword)) {
    return false;
  }

  return bcrypt.compare(plainPassword, storedPassword);
}

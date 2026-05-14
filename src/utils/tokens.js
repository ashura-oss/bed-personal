import jwt from "jsonwebtoken";

const defaultJwtSecret = "realmforge-local-development-secret-change-me";
const defaultTokenExpiry = "2h";

export function getTokenExpiry() {
  return process.env.JWT_EXPIRES_IN || defaultTokenExpiry;
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      username: user.username
    },
    getJwtSecret(),
    {
      expiresIn: getTokenExpiry()
    }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function getJwtSecret() {
  return process.env.JWT_SECRET || defaultJwtSecret;
}

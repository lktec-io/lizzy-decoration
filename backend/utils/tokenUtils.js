import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Algorithm pinned explicitly on both sign and verify — defense in depth
// against algorithm-confusion attacks (a token crafted with a different
// algorithm than the server intends to check). jsonwebtoken defaults to
// HS256 for a string secret regardless, but relying on that default instead
// of stating it is exactly the kind of gap a security pass should close.
const JWT_ALGORITHM = 'HS256';

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn, algorithm: JWT_ALGORITHM });
}

export function signRefreshToken(payload, expiresIn) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn, algorithm: JWT_ALGORITHM });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret, { algorithms: [JWT_ALGORITHM] });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret, { algorithms: [JWT_ALGORITHM] });
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

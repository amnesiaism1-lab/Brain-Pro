import { randomBytes } from 'crypto';

let cachedEphemeralSecret: string | null = null;
let hasWarnedMissingSecret = false;

/**
 * Returns the configured JWT signing secret from `process.env.JWT_SECRET`.
 * Falls back to a process-scoped 256-bit cryptographically random secret so
 * the server never ships a predictable hardcoded key in source control.
 */
export function getJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  if (!cachedEphemeralSecret) {
    cachedEphemeralSecret = randomBytes(32).toString('hex');
  }

  if (!hasWarnedMissingSecret) {
    hasWarnedMissingSecret = true;
    console.warn(
      '[SECURITY] JWT_SECRET environment variable is not set; using an ephemeral runtime secret. Tokens will invalidate across restarts.'
    );
  }

  return cachedEphemeralSecret;
}

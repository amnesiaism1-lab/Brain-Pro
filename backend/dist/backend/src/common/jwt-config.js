"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = getJwtSecret;
const crypto_1 = require("crypto");
let cachedEphemeralSecret = null;
let hasWarnedMissingSecret = false;
function getJwtSecret() {
    const configuredSecret = process.env.JWT_SECRET?.trim();
    if (configuredSecret) {
        return configuredSecret;
    }
    if (!cachedEphemeralSecret) {
        cachedEphemeralSecret = (0, crypto_1.randomBytes)(32).toString('hex');
    }
    if (!hasWarnedMissingSecret) {
        hasWarnedMissingSecret = true;
        console.warn('[SECURITY] JWT_SECRET environment variable is not set; using an ephemeral runtime secret. Tokens will invalidate across restarts.');
    }
    return cachedEphemeralSecret;
}
//# sourceMappingURL=jwt-config.js.map
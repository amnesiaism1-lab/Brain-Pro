const { Client } = require('pg');

/**
 * Creates a PostgreSQL client from environment variables (`DATABASE_URL` or
 * `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
 * Fails closed if credentials are missing so secrets are never hardcoded.
 */
function createPgClient() {
  const connectionString = process.env.DATABASE_URL && process.env.DATABASE_URL.trim();
  if (connectionString) {
    return new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  }

  const host = process.env.DB_HOST && process.env.DB_HOST.trim();
  const user = process.env.DB_USER && process.env.DB_USER.trim();
  const password = process.env.DB_PASSWORD;
  const database = (process.env.DB_NAME && process.env.DB_NAME.trim()) || 'postgres';
  const port = parseInt(process.env.DB_PORT || '6543', 10);

  if (!host || !user || !password) {
    throw new Error(
      'Missing PostgreSQL credentials. Set DATABASE_URL or (DB_HOST, DB_USER, DB_PASSWORD) in your environment.'
    );
  }

  return new Client({
    host,
    port,
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false }
  });
}

module.exports = { createPgClient };

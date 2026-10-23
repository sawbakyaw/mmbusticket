import { Pool } from 'pg';

declare global {
  var postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL?.trim());

export const pool = globalThis.postgresPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});

if (process.env.NODE_ENV !== 'production') globalThis.postgresPool = pool;

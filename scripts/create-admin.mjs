import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcryptjs';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running this script.');

const readline = createInterface({ input, output });
const email = (await readline.question('Admin email: ')).trim().toLowerCase();
const name = (await readline.question('Admin name: ')).trim();
const password = await readline.question('Admin password (minimum 12 characters): ');
readline.close();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || password.length < 12 || password.length > 72) {
  throw new Error('Enter a valid email and name, and a password between 12 and 72 characters.');
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const { rows } = await client.query(
    'INSERT INTO app_users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
    [email, await bcrypt.hash(password, 12), name],
  );
  const { rows: roles } = await client.query("SELECT id FROM roles WHERE name = 'super_admin'");
  await client.query('INSERT INTO user_profiles (user_id, role_id) VALUES ($1, $2)', [rows[0].id, roles[0].id]);
  await client.query('COMMIT');
  console.log(`Created administrator ${email}.`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}

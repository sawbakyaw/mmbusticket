import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';
import { createSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 72 || !name || name.length > 120) {
    return NextResponse.json({ error: 'Enter a valid email, name, and password of at least 10 characters.' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO app_users (email, password_hash, phone, name) VALUES ($1, $2, $3, $4) RETURNING id, email, phone, name',
      [email, await bcrypt.hash(password, 12), phone || null, name],
    );
    const user = rows[0];
    const role = await client.query("SELECT id FROM roles WHERE name = 'customer'");
    await client.query('INSERT INTO user_profiles (user_id, role_id) VALUES ($1, $2)', [user.id, role.rows[0]?.id ?? null]);
    await client.query('INSERT INTO wallets (user_id, wallet_type) VALUES ($1, \'user\')', [user.id]);
    await client.query('COMMIT');
    const token = await createSession(user.id);
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.code === '23505' ? 'An account with this email already exists.' : 'Unable to create account.' }, { status: error.code === '23505' ? 409 : 500 });
  } finally {
    client.release();
  }
}

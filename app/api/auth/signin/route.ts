import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';
import { createSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const { rows } = await pool.query('SELECT id, email, password_hash, phone, name FROM app_users WHERE email = $1 AND is_active', [email]);
  if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }
  const user = { id: rows[0].id, email: rows[0].email, phone: rows[0].phone, name: rows[0].name };
  await pool.query('UPDATE user_profiles SET last_login_at = now(), last_login_ip = $2, failed_login_attempts = 0 WHERE user_id = $1', [user.id, request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null]);
  const token = await createSession(user.id);
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

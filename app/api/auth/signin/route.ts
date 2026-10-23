import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';
import { createSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.password_hash, u.phone, u.name, p.failed_login_attempts, p.locked_until
     FROM app_users u LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.email = $1 AND u.is_active`, [email],
  );
  const account = rows[0];
  if (!account || (account.locked_until && new Date(account.locked_until) > new Date()) || !(await bcrypt.compare(password, account.password_hash))) {
    if (account && (!account.locked_until || new Date(account.locked_until) <= new Date())) {
      await pool.query(
        `UPDATE user_profiles SET failed_login_attempts = failed_login_attempts + 1,
         locked_until = CASE WHEN failed_login_attempts >= 4 THEN now() + interval '15 minutes' ELSE locked_until END
         WHERE user_id = $1`, [account.id],
      );
    }
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }
  const user = { id: account.id, email: account.email, phone: account.phone, name: account.name };
  await pool.query('UPDATE user_profiles SET last_login_at = now(), last_login_ip = $2, failed_login_attempts = 0, locked_until = NULL WHERE user_id = $1', [user.id, request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null]);
  const token = await createSession(user.id);
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

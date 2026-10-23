import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { hashSessionToken, SESSION_COOKIE } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [hashSessionToken(token)]);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}

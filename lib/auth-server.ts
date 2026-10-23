import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { pool } from '@/lib/db';

export const SESSION_COOKIE = 'mmbus_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export function newSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function sessionCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: SESSION_MAX_AGE };
}

export async function createSession(userId: string) {
  const token = newSessionToken();
  await pool.query('INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval \'7 days\')', [userId, hashSessionToken(token)]);
  return token;
}

export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.phone, u.name, r.name AS role, r.permissions, p.id AS profile_id, p.role_id,
            p.company_name, p.phone_verified, p.email_verified, p.two_factor_enabled, p.avatar_url,
            p.address, p.city, p.country, p.timezone, p.language, p.notification_preferences,
            p.is_active, p.last_login_at, p.last_login_ip, p.failed_login_attempts, p.locked_until,
            p.created_at, p.updated_at,
            (SELECT json_build_object('id', w.id, 'user_id', w.user_id, 'wallet_type', w.wallet_type,
              'balance', w.balance, 'frozen_balance', w.frozen_balance, 'currency', w.currency,
              'is_active', w.is_active, 'min_balance', w.min_balance, 'max_balance', w.max_balance,
              'created_at', w.created_at, 'updated_at', w.updated_at) FROM wallets w WHERE w.user_id = u.id LIMIT 1) AS wallet,
            (SELECT operator_id FROM operator_users ou WHERE ou.user_id = u.id AND ou.is_active LIMIT 1) AS operator_id,
            (SELECT agent_id FROM agent_users au WHERE au.user_id = u.id AND au.is_active LIMIT 1) AS agent_id
     FROM user_sessions s
     JOIN app_users u ON u.id = s.user_id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     LEFT JOIN roles r ON r.id = p.role_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND u.is_active AND COALESCE(p.is_active, true)
     LIMIT 1`,
    [hashSessionToken(token)],
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    name: row.name,
    role: row.role || 'customer',
    profile: row.profile_id ? {
      id: row.profile_id,
      user_id: row.id,
      role_id: row.role_id,
      role: row.role ? { name: row.role, permissions: row.permissions ?? [] } : null,
      company_name: row.company_name,
      phone_verified: row.phone_verified,
      email_verified: row.email_verified,
      two_factor_enabled: row.two_factor_enabled,
      avatar_url: row.avatar_url,
      address: row.address,
      city: row.city,
      country: row.country,
      timezone: row.timezone,
      language: row.language,
      notification_preferences: row.notification_preferences,
      is_active: row.is_active,
      last_login_at: row.last_login_at,
      last_login_ip: row.last_login_ip,
      failed_login_attempts: row.failed_login_attempts,
      locked_until: row.locked_until,
      created_at: row.created_at,
      updated_at: row.updated_at,
    } : null,
    wallet: row.wallet,
    operatorId: row.operator_id,
    agentId: row.agent_id,
  };
}

export async function requireRole(roles: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  if (!roles.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { isDatabaseConfigured, pool } from '@/lib/db';

const TABLES = new Set([
  'cities', 'operators', 'buses', 'routes', 'trips', 'seats', 'seat_locks', 'bookings',
  'user_profiles', 'roles', 'wallets', 'operator_users', 'agent_users', 'agents',
  'refund_requests', 'payment_gateways', 'commission_rules', 'commission_payouts',
  'notifications', 'notification_templates', 'audit_logs', 'wallet_transactions', 'cms_pages', 'cms_settings', 'passengers', 'payments',
]);
const PUBLIC_TABLES = new Set(['cities', 'operators', 'buses', 'routes', 'trips', 'seats', 'seat_locks']);
const ADMIN_ROLES = new Set(['super_admin', 'admin']);
const OPERATIONS = new Set(['select', 'update', 'delete']);
const OPERATORS = new Set(['eq', 'neq', 'in', 'gt', 'gte', 'lt', 'lte']);
const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 });
  try {
    const body = await request.json();
    if (!TABLES.has(body.table) || !OPERATIONS.has(body.operation)) return NextResponse.json({ error: 'Unsupported database request.' }, { status: 400 });
    if (body.operation !== 'select' && body.table === 'bookings') return NextResponse.json({ error: 'Use the booking API for booking changes.' }, { status: 403 });
    if (body.operation === 'delete') return NextResponse.json({ error: 'Delete is not permitted.' }, { status: 403 });
    if (body.operation === 'update' && !['payment_gateways', 'refund_requests'].includes(body.table)) return NextResponse.json({ error: 'Update is not permitted.' }, { status: 403 });

    const user = await getCurrentUser();
    const isAdmin = !!user && ADMIN_ROLES.has(user.role);
    const publicRead = body.operation === 'select' && PUBLIC_TABLES.has(body.table);
    if (!user && !publicRead) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (user && !isAdmin && !publicRead && !['operator_admin', 'operator_staff', 'agent_admin', 'agent_staff', 'customer'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    if (user && !isAdmin && !publicRead) {
      const roleTables: Record<string, string[]> = {
        operator_admin: ['operators', 'buses', 'trips', 'bookings'],
        operator_staff: ['operators', 'buses', 'trips', 'bookings'],
        agent_admin: ['agents', 'agent_users', 'bookings', 'wallets'],
        agent_staff: ['agents', 'agent_users', 'bookings', 'wallets'],
        customer: ['user_profiles', 'wallets'],
      };
      if (!roleTables[user.role]?.includes(body.table)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    if (body.operation !== 'select' && (!user || !isAdmin)) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });

    const filters = Array.isArray(body.filters) ? body.filters : [];
    if (body.table === 'bookings' && !isAdmin && !['operator_admin', 'operator_staff', 'agent_admin', 'agent_staff'].includes(user?.role || '')) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    if (body.table === 'seat_locks' && body.operation === 'select' && !filters.some((item: any) => item.column === 'trip_id' && item.operator === 'eq')) {
      return NextResponse.json({ error: 'A trip filter is required.' }, { status: 400 });
    }
    if (body.table === 'user_profiles' && user && !isAdmin && !filters.some((item: any) => item.column === 'user_id' && item.operator === 'eq' && item.value === user.id)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    if (body.table === 'roles' && !isAdmin) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });

    const values: unknown[] = [];
    const conditions: string[] = [];
    const addFilter = (filter: any) => {
      if (!filter || !IDENTIFIER.test(filter.column) || !OPERATORS.has(filter.operator)) throw new Error('Invalid filter.');
      if (filter.operator === 'in') {
        if (!Array.isArray(filter.value) || filter.value.length > 100) throw new Error('Invalid filter.');
        if (filter.value.length === 0) { conditions.push('FALSE'); return; }
        const slots = filter.value.map((value: unknown) => { values.push(value); return `$${values.length}`; });
        conditions.push(`"${filter.column}" IN (${slots.join(',')})`);
        return;
      }
      values.push(filter.value);
      const op = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' }[filter.operator as 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'];
      conditions.push(`"${filter.column}" ${op} $${values.length}`);
    };
    filters.forEach(addFilter);

    if (user && !isAdmin && ['operator_admin', 'operator_staff'].includes(user.role)) {
      if (!user.operatorId) return NextResponse.json({ error: 'No operator account is assigned.' }, { status: 403 });
      if (['operators', 'buses', 'trips', 'bookings'].includes(body.table)) {
        values.push(user.operatorId);
        conditions.push(`"${body.table === 'operators' ? 'id' : 'operator_id'}" = $${values.length}`);
      }
    }
    if (user && !isAdmin && ['agent_admin', 'agent_staff'].includes(user.role)) {
      if (!user.agentId) return NextResponse.json({ error: 'No agent account is assigned.' }, { status: 403 });
      if (['agents', 'agent_users', 'bookings', 'wallets'].includes(body.table)) {
        values.push(user.agentId);
        conditions.push(`"${body.table === 'agents' ? 'id' : 'agent_id'}" = $${values.length}`);
      }
    }
    if (user && !isAdmin && body.table === 'wallets' && user.role === 'customer') {
      values.push(user.id);
      conditions.push(`"user_id" = $${values.length}`);
    }

    if (body.table === 'seat_locks' && body.operation === 'select') conditions.push('expires_at > now()');
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    if (body.operation === 'select') {
      const countResult = body.count ? await pool.query(`SELECT count(*)::int AS count FROM "${body.table}"${where}`, values) : null;
      if (body.head) return NextResponse.json({ data: null, count: countResult?.rows[0]?.count ?? null });
      const orderBy = Array.isArray(body.orders) ? body.orders.map((order: any) => {
        if (!IDENTIFIER.test(order.column)) throw new Error('Invalid order.');
        return `"${order.column}" ${order.ascending === false ? 'DESC' : 'ASC'}`;
      }).join(', ') : '';
      const limit = Number.isInteger(body.limit) ? Math.min(Math.max(body.limit, 0), 500) : 250;
      const selectedColumns = body.table === 'seat_locks' ? 'id, seat_id, trip_id, locked_at, expires_at, created_at' : body.table === 'cms_settings' ? 'setting_key AS key, setting_value AS value' : '*';
      const { rows } = await pool.query(`SELECT ${selectedColumns} FROM "${body.table}"${where}${orderBy ? ` ORDER BY ${orderBy}` : ''} LIMIT ${limit}`, values);
      const data = await attachRelations(body.table, rows, isAdmin);
      return NextResponse.json({ data, count: countResult?.rows[0]?.count ?? null });
    }

    if (body.operation === 'update') {
      if (!body.values || typeof body.values !== 'object' || Array.isArray(body.values)) return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
      const columns = Object.keys(body.values);
      const updateable = body.table === 'payment_gateways' ? ['is_active'] : ['status', 'processed_at'];
      if (!columns.length || columns.some(column => !IDENTIFIER.test(column) || !updateable.includes(column))) return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
      const assignments = columns.map(column => { values.push(body.values[column]); return `"${column}" = $${values.length}`; });
      const { rows } = await pool.query(`UPDATE "${body.table}" SET ${assignments.join(', ')}${where} RETURNING *`, values);
      return NextResponse.json({ data: await attachRelations(body.table, rows), count: rows.length });
    }

    if (!conditions.length) return NextResponse.json({ error: 'A filter is required.' }, { status: 400 });
    const { rows } = await pool.query(`DELETE FROM "${body.table}"${where} RETURNING *`, values);
    return NextResponse.json({ data: rows, count: rows.length });
  } catch (error: any) {
    const status = error.message === 'UNAUTHORIZED' ? 401 : error.message === 'FORBIDDEN' ? 403 : error.message === 'Invalid filter.' || error.message === 'Invalid order.' ? 400 : 500;
    return NextResponse.json({ error: status === 500 ? 'Database request failed.' : error.message }, { status });
  }
}

async function attachRelations(table: string, rows: any[], includePaymentDetails = false) {
  if (!rows.length) return rows;
  if (table === 'trips') {
    const routeIds = Array.from(new Set(rows.map(row => row.route_id)));
    const cityIds = Array.from(new Set((await pool.query('SELECT from_city_id, to_city_id FROM routes WHERE id = ANY($1::uuid[])', [routeIds])).rows.flatMap(row => [row.from_city_id, row.to_city_id])));
    const [operators, buses, routes, cities] = await Promise.all([
      pool.query('SELECT * FROM operators WHERE id = ANY($1::uuid[])', [Array.from(new Set(rows.map(row => row.operator_id)))]),
      pool.query('SELECT * FROM buses WHERE id = ANY($1::uuid[])', [Array.from(new Set(rows.map(row => row.bus_id)))]),
      pool.query('SELECT * FROM routes WHERE id = ANY($1::uuid[])', [Array.from(new Set(rows.map(row => row.route_id)))]),
      cityIds.length ? pool.query('SELECT * FROM cities WHERE id = ANY($1::uuid[])', [cityIds]) : Promise.resolve({ rows: [] }),
    ]);
    const operatorById = new Map(operators.rows.map(row => [row.id, row]));
    const busById = new Map(buses.rows.map(row => [row.id, row]));
    const cityById = new Map(cities.rows.map((row: any) => [row.id, row]));
    const routeById = new Map(routes.rows.map((row: any) => [row.id, { ...row, from_city: cityById.get(row.from_city_id), to_city: cityById.get(row.to_city_id) }]));
    return rows.map(row => ({ ...row, operators: operatorById.get(row.operator_id), buses: busById.get(row.bus_id), routes: routeById.get(row.route_id) }));
  }
  if (table === 'bookings' && includePaymentDetails) {
    const bookingIds = rows.map(row => row.id);
    const { rows: payments } = await pool.query(
      `SELECT DISTINCT ON (booking_id) id, booking_id, payment_method, transaction_ref, payment_status, created_at, verified_at, verified_by
       FROM payments WHERE booking_id = ANY($1::uuid[]) ORDER BY booking_id, created_at DESC, id DESC`, [bookingIds],
    );
    const latestByBooking = new Map(payments.map(payment => [payment.booking_id, payment]));
    return rows.map(row => ({ ...row, latest_payment: latestByBooking.get(row.id) ?? null }));
  }
  if (table === 'user_profiles') {
    const roleIds = Array.from(new Set(rows.map(row => row.role_id).filter(Boolean)));
    const roles = roleIds.length ? await pool.query('SELECT * FROM roles WHERE id = ANY($1::uuid[])', [roleIds]) : { rows: [] };
    const roleById = new Map(roles.rows.map(row => [row.id, row]));
    return rows.map(row => ({ ...row, roles: roleById.get(row.role_id) ?? null, role: roleById.get(row.role_id) ?? null }));
  }
  if (table === 'refund_requests') {
    const bookingIds = Array.from(new Set(rows.map(row => row.booking_id)));
    const bookings = await pool.query('SELECT * FROM bookings WHERE id = ANY($1::uuid[])', [bookingIds]);
    const bookingById = new Map(bookings.rows.map(row => [row.id, row]));
    return rows.map(row => ({ ...row, bookings: bookingById.get(row.booking_id) }));
  }
  if (table === 'payment_gateways') return rows.map(({ secret_key_encrypted, ...row }) => row);
  return rows;
}

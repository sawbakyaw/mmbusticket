# PostgreSQL setup for MM-BusTicket

This project connects to PostgreSQL from Next.js API routes. The database URL is server-only; never expose it as a `NEXT_PUBLIC_` variable or connect to PostgreSQL from browser code.

## 1. Install PostgreSQL on the VPS

Use a supported Linux VPS and install PostgreSQL 16 or newer. Keep PostgreSQL on a private interface. If the Next.js app runs on the same VPS, bind Postgres to `127.0.0.1` and do not open port 5432 in the public firewall. If the app runs in a separate environment, use a private network/VPN or restrict TLS database access to a known application-server IP. Do not expose port 5432 to the whole internet.

Create an application role and database from the VPS terminal:

```bash
sudo -u postgres psql
```

In the PostgreSQL prompt, replace the example password with a long unique secret:

```sql
CREATE ROLE mmbus_app LOGIN PASSWORD 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
CREATE DATABASE mmbusticket OWNER mmbus_app;
\q
```

Keep the password in a password manager or protected deployment secret; do not commit it or paste it into browser-visible settings.

## 2. Create the tables and starter cities

Copy `database/schema.sql` and `database/seed.sql` to the VPS using your normal private file-transfer method. Run them as the database owner:

```bash
psql "postgresql://mmbus_app@127.0.0.1:5432/mmbusticket" -W -f database/schema.sql
psql "postgresql://mmbus_app@127.0.0.1:5432/mmbusticket" -W -f database/seed.sql
```

`-W` prompts for the password rather than embedding it in the command. The schema creates the app's tables, indexes, role records, and seat-lock functions. The seed file inserts starter city names only; add real operators, buses, routes, trips, and seats before offering tickets.

Create the first administrator on a machine that can reach the database and has the project dependencies installed. Set `DATABASE_URL` in that machine's protected environment, then run:

```bash
npm run create-admin
```

The script asks for the admin email, display name, and password. Use a unique password of at least 12 characters. Do not expose this administrator to the public until you have changed any demo data and tested access.

## 3. Connect the live workspace

In the Builder workspace's server environment settings, add:

```text
DATABASE_URL=postgresql://mmbus_app:<password>@<database-host>:5432/mmbusticket
DATABASE_SSL=true
```

Use the actual VPS hostname and password. Keep `DATABASE_URL` private—never prefix it with `NEXT_PUBLIC_`. Set `DATABASE_SSL=true` only when PostgreSQL has a valid TLS certificate trusted by the Node.js runtime. For local development against Postgres on the same machine, use `DATABASE_SSL=false`.

The workspace's server runtime must be able to reach the VPS. Prefer a private network or a firewall allowlist for a fixed app-server egress IP. If Builder's live runtime has no fixed egress IP, do not open PostgreSQL broadly; deploy the Next.js server beside PostgreSQL or provide a private network/API gateway first. After changing workspace environment variables, rebuild/restart the live app so the API routes receive the new settings.

For local development, copy `.env.example` to `.env.local`, set `DATABASE_URL`, then run `npm run dev`.

## 4. Verify the connection

1. Confirm the database is reachable from the Next.js server—not just from your laptop.
2. Open the home page and confirm the city selector loads.
3. Add a test operator, bus, route, trip, and seats; verify search and seat selection.
4. Open the same trip in two browser sessions and verify a seat lock prevents the second session from reserving the same seat.
5. Complete a test booking and confirm it remains `pending` until a real payment provider is integrated and verifies payment.
6. Create a regular customer account and the admin account; verify admin pages reject the customer account.

Seat availability refreshes by polling the API; it does not use PostgreSQL's native push/realtime feature. Payment method selection is only recorded as a preference: this project does not currently integrate or verify a payment gateway.

## 5. Backups and operation

Schedule encrypted, off-VPS backups of the database and test restoring one before storing real passenger data. Keep PostgreSQL and the operating system updated, limit database roles and firewall access, monitor disk space, and rotate credentials if they are exposed. Do not use production passenger data in the live preview environment.

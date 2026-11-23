# MM-BusTicket database setup

This project uses PostgreSQL through the Next.js server and the `pg` package. Supabase can host the PostgreSQL database, but the app does not use Supabase Auth or the Supabase JavaScript client for its database connection. Keep the database connection string server-side. Never name it `NEXT_PUBLIC_DATABASE_URL` or put it in browser code.

## What you need

- Access to a Supabase project, or a reachable PostgreSQL 16+ server.
- The database password and connection details for that database.
- The project files `database/schema.sql`, `database/seed.sql`, and `database/migrations/202606280001_guest_checkout.sql`.

The Supabase publishable/anon key and service-role/secret key are not database passwords and are not needed by this app's PostgreSQL connection.

## 1. Create a Supabase project

1. In Supabase, create a new project in the organization where you want to keep this database.
2. Choose a project name and a region close to the application server.
3. Set a strong database password. Save it in a password manager; Supabase will not show it again in plain text. This is the PostgreSQL password, not an API key.
4. Wait for the project and database to finish provisioning.
5. In the project settings, find the database connection details. For an app server that connects over IPv4 or does not have a fixed outbound IP, use the **Transaction pooler** connection string. Note its host, port, database name, and username. Supabase pooler usernames commonly include the project reference after `postgres.`.

Do not make the database publicly accessible to all IP addresses just to make a connection work. Use the provider's pooler and network access controls appropriate to your hosting environment.

## 2. Create the application schema

Use the Supabase SQL Editor for the new project. Run the following project files in this order, one at a time:

1. Open `database/schema.sql`, copy its complete contents into a new SQL Editor query, and run it. This creates the app tables, indexes, roles, and seat-management functions.
2. Open `database/seed.sql`, copy its complete contents into a new query, and run it. This adds starter city names only.
3. Open `database/migrations/202606280001_guest_checkout.sql`, copy its complete contents into a new query, and run it. This adds guest-checkout fields, passenger/payment tables, and the booking function.

Run these against a fresh project database before connecting the app. Do not run the files in `supabase/migrations/` as an additional setup sequence; the three files above are the database setup sequence maintained for this app. Do not run `DROP` or reset commands against a database that contains data you need to keep.

After setup, open the SQL Editor and verify the `cities`, `operators`, `routes`, `trips`, `seats`, and `bookings` tables exist. The seed inserts city names only, so an empty operators or trips section is expected until you add operator, bus, route, trip, and seat records.

## 3. Configure the app's database connection

Build the connection string using the values from your Supabase project's Transaction pooler details. Its shape is:

```text
postgresql://<pooler-username>:<URL-ENCODED-DATABASE-PASSWORD>@<pooler-host>:6543/postgres?pgbouncer=true
```

Replace every placeholder with the values for your project. URL-encode reserved characters in the password (for example, `@`, `:`, `/`, `?`, `#`, and `%`) before putting it in the URI. Do not include angle brackets in the final value.

Set these server-side variables:

```text
DATABASE_URL=<your-complete-pooler-connection-string>
DATABASE_SSL=true
```

### Local development

1. In the repository root, create or update `.env.local` (it is ignored by Git).
2. Add `DATABASE_URL` and `DATABASE_SSL=true` there. Do not commit the file or share its contents in chat or screenshots.
3. Restart the local Next.js development server so it reloads the environment.
4. Keep the real database password only in this local file or a protected secret manager.

### Builder-hosted runtime

Add `DATABASE_URL` and `DATABASE_SSL=true` in the project's secure server environment settings. Do not rely on `.env` or `.env.local` being deployed; local environment files are not a substitute for hosted runtime variables. Rebuild or restart the hosted app after changing them so the server receives the new settings.

## 4. Verify the connection

1. Start the app with `npm run dev` locally, or open the rebuilt hosted app.
2. Open the home page and check that the city selector can load the seeded cities without a database error.
3. In the browser's developer tools, inspect the Network request to `/api/data`. A successful public `cities` read should return HTTP 200. A missing `DATABASE_URL` returns HTTP 503; a connection or schema failure may return HTTP 500.
4. Add test operator, bus, route, trip, and seat records using the app's admin workflow or trusted SQL. The seed file does not create these records.
5. Test trip search and seat selection with test data before enabling real bookings.

Create the first administrator only after the schema is installed and the server can reach the database. Set `DATABASE_URL` and `DATABASE_SSL` in the terminal environment used for the command, then run `npm run create-admin`. The script prompts for the admin email, name, and password; use a unique password of at least 12 characters. Do not place an administrator password in source control or a public environment variable.

## 5. Troubleshooting

| Symptom | Check |
| --- | --- |
| `/api/data` returns 503 with `DATABASE_URL is not configured.` | Add `DATABASE_URL` to the environment of the running server and restart/rebuild it. |
| `/api/data` returns 500 `Database request failed.` | Check the pooler host, username, port, database password, network access, and that the schema files ran successfully. Confirm the password is URL-encoded in the connection string. |
| Authentication error from PostgreSQL | The database password or pooler username is wrong. Use the database password and exact username shown in the project's pooler connection details; API keys will not work here. |
| TLS or certificate error | Keep `DATABASE_SSL=true` for Supabase. Verify the configured host is the provider's pooler host and that the runtime trusts its certificate. |
| Error says a relation/table does not exist | Run `database/schema.sql`, `database/seed.sql`, and the guest-checkout migration in the order above. |
| Cities load but operators/routes/trips are empty | This is expected after the starter seed; add the corresponding records before testing route search. |
| Local app works but hosted app fails | Configure the variables in the hosted server environment, not only in `.env.local`, and confirm the hosted runtime can reach the database. |

The API intentionally returns a generic database error to browsers rather than exposing database credentials or internal connection details. Use the server runtime logs to investigate further, and never paste a full connection string into public logs or support messages.

## Optional: self-hosted PostgreSQL

If PostgreSQL is installed on a private VPS instead of Supabase, use PostgreSQL 16 or newer. Keep it on a private interface; do not expose port 5432 to the public internet. Create a dedicated application role and database, run the same three SQL files above as the database owner, and set `DATABASE_URL` to the private host and database. Enable `DATABASE_SSL=true` only when the server has a valid TLS certificate trusted by the Node.js runtime; for local development against a local PostgreSQL instance, use `DATABASE_SSL=false`.

Use a private network, VPN, or a strict firewall allowlist between the application and database. If the hosted app has no stable outbound IP, do not open PostgreSQL to all addresses; use a supported pooler/network path or host the app and database within a reachable private network.

## Operations and safety

- Use a separate database and credentials for development and production.
- Back up the database regularly and test restoring a backup before storing real passenger data.
- Limit database and administrator access; rotate credentials if exposed.
- Keep production passenger data out of preview and test environments.
- Seat availability is refreshed by API polling; PostgreSQL realtime is not used. Guest payment submissions are recorded for manual administrator verification and do not automatically mark a booking as paid.

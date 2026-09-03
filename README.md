# RinsePoint Carwash Management System

RinsePoint is a web-based foundation for a carwash management system. It provides a public customer check-in entry point and a protected admin shell for three focused modules: Sales, Clients, and Inventory, plus a separate catalog configuration area.

Phase 2 adds the Supabase connection, PostgreSQL profile foundation, cookie-based Supabase Auth, protected admin routes, and row-level security. Phase 3 adds the vehicle category, service, and service-price configuration foundation. Customer transactions, checkout, and business workflows are intentionally not part of this phase.

## Tech stack

- Next.js 16.3.4 with the App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- `@supabase/supabase-js` and `@supabase/ssr`
- Zod server-side form validation
- ESLint
- npm

## Supabase setup

Create a Supabase project before using the authenticated admin workspace. The application uses only the public project URL and public client key in the browser. Never put a service role key, database password, or other secret in a `NEXT_PUBLIC_*` variable.

### Environment variables

Create a local environment file from the checked-in template:

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```bash
cp .env.example .env.local
```

Set these values in `.env.local` using Supabase Dashboard > Project Settings > API:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` when the dashboard provides a publishable key. If the project only provides the legacy anon key, leave the publishable key empty and set `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead. Do not commit `.env.local`.

### Run the migrations

Run the migration files in timestamp order:

- `supabase/migrations/20260902000000_create_profiles.sql`
- `supabase/migrations/20260902010000_create_catalog.sql`

The simplest setup is the Supabase Dashboard:

1. Open the project in Supabase Dashboard.
2. Open SQL Editor and create a new query.
3. Paste and run each complete migration file in timestamp order.
4. Confirm that `public.profiles`, `public.vehicle_categories`, `public.services`, and `public.service_prices` exist in Table Editor.

If the Supabase CLI is already installed and the project is linked, run this from the repository root instead:

```bash
npx supabase db push
```

Do not run both methods for the same migration unless the CLI migration history confirms it has not already been applied.

The catalog migration seeds vehicle categories with these documented defaults: `Sedan` and `Hatchback` -> `small`, `MPV` -> `medium`, `SUV` -> `large`, and `Pickup` and `Van` -> `xl`. It also seeds the example services `Basic Wash`, `Premium Wash`, `Interior Vacuum`, `Wax`, and `Tire Shine`, but no service prices. Prices are stored in Philippine Peso (PHP) and remain empty for an operator to configure.

### Create the first Auth user

There is no public registration page. To keep the admin workspace invitation-only, disable public signups in Supabase Dashboard > Authentication > Configuration > User Signups (the exact menu label may vary by dashboard version) before creating users. Then create the first user from the dashboard:

1. Open Supabase Dashboard > Authentication > Users.
2. Select **Add user**.
3. Enter the operator email and a strong password.
4. Enable **Auto Confirm User** for a local or controlled first account, if available.
5. Select **Create user**.

The database trigger creates a matching `public.profiles` row with the conservative `staff` role. The migration also backfills users that existed before it was run.

### Assign the admin role

Promotion is intentionally not available through the client application. After creating the first Auth user, open Supabase Dashboard > SQL Editor and run the following query with the real email address:

```sql
update public.profiles
set role = 'admin'::public.app_role,
    active = true
where id = (
  select id
  from auth.users
  where email = 'operator@example.com'
);
```

Verify the result in Table Editor > `public.profiles`. Only a database owner or privileged dashboard session should change `role` or `active`.

## RLS foundation

Row-level security is enabled on `public.profiles`:

- **Authenticated users can read their own active profile**: allows an active admin or staff user to read only their own `id`, `full_name`, `role`, and `active` values. Anonymous users have no table privileges.
- **Authenticated users can update their own full name**: allows an active admin or staff user to update only `full_name`. The `role`, `active`, identity, and timestamp columns are not granted for client updates.

There are no insert or delete grants for browser clients. The database-side Auth trigger creates profiles, and role or active-state changes require a privileged dashboard/database-owner operation.

Catalog tables also use row-level security:

- Active admin and staff profiles can read vehicle categories, services, and service prices.
- Only active admin profiles can insert or update catalog records and prices.
- Anonymous users have no catalog table privileges, and catalog records are disabled instead of deleted.

## Run locally

Install dependencies, configure `.env.local`, and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Restart the development server after changing environment variables.

## Routes

- `/` - Public landing page
- `/check-in` - Public customer check-in placeholder
- `/admin/login` - Public admin sign-in
- `/admin` - Protected admin dashboard foundation
- `/admin/sales` - Protected Sales placeholder
- `/admin/clients` - Protected Clients placeholder
- `/admin/inventory` - Protected Inventory placeholder
- `/admin/catalog` - Protected catalog and pricing configuration

Both `admin` and `staff` profiles may enter the admin shell when `active` is true. The main navigation remains limited to Sales, Clients, and Inventory. Catalog settings are available separately; staff can view them, while only admins can edit them.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

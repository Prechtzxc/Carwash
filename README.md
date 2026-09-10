# Cool Car Centrale Carwash Management System

Cool Car Centrale is a web-based carwash management system. It provides a public customer check-in entry point and a protected single-admin shell for three focused modules: Sales, Clients, and Inventory, plus a separate catalog configuration area.

Phase 2 adds the Supabase connection, PostgreSQL profile foundation, cookie-based Supabase Auth, protected admin routes, and row-level security. Phase 3 adds the vehicle category, service, and service-price configuration foundation. Phase 4 adds admin-only inventory items, an atomic stock movement ledger, and service consumable recipes. Phase 5 adds the public customer check-in wizard and pending submission foundation. Phase 6 adds the protected admin transaction review, pending-request revision, confirmation, and cancellation workflow. Later phases add Sales, Clients, inventory reporting, and the production-ready public check-in doorway. Phase 11 adds a protected printable customer QR utility, tablet-safe check-in behavior, and an installable PWA foundation without offline transaction storage or a service worker. The authentication cleanup keeps one admin account only; customers do not have accounts. Payment, completion, and inventory deduction remain outside the public check-in flow.

## Tech stack

- Next.js 16.3.4 with the App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- `@supabase/supabase-js` and `@supabase/ssr`
- Zod server-side form validation
- `qrcode` for the protected customer QR utility
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
NEXT_PUBLIC_APP_URL=https://coolcarcentrale.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`NEXT_PUBLIC_APP_URL` is the public application origin used to create the customer QR destination. Use the deployed HTTPS origin in production; do not use localhost. Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` when the dashboard provides a publishable key. If the project only provides the legacy anon key, leave the publishable key empty and set `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead. Do not commit `.env.local`.

### Run the migrations

Run the migration files in timestamp order:

- `supabase/migrations/20260902000000_create_profiles.sql`
- `supabase/migrations/20260902010000_create_catalog.sql`
- `supabase/migrations/20260903000000_admin_only_auth.sql`
- `supabase/migrations/20260903010000_require_explicit_admin_activation.sql`
- `supabase/migrations/20260903020000_create_inventory.sql`
- `supabase/migrations/20260903030000_create_customer_check_in.sql`
- `supabase/migrations/20260904000000_create_transaction_review.sql`
- `supabase/migrations/20260904010000_complete_transaction.sql`
- `supabase/migrations/20260904020000_create_sales_reporting.sql`
- `supabase/migrations/20260908000000_create_client_directory.sql`
- `supabase/migrations/20260908010000_finalize_inventory_reporting.sql`

The simplest setup is the Supabase Dashboard:

1. Open the project in Supabase Dashboard.
2. Open SQL Editor and create a new query.
3. Paste and run each complete migration file in timestamp order.
4. Confirm that `public.profiles`, `public.vehicle_categories`, `public.services`, `public.service_prices`, `public.inventory_items`, `public.inventory_movements`, `public.service_inventory_requirements`, `public.customers`, `public.customer_vehicles`, `public.transactions`, `public.transaction_services`, and `public.transaction_products` exist in Table Editor.

If the Supabase CLI is already installed and the project is linked, run this from the repository root instead:

```bash
npx supabase db push
```

Do not run both methods for the same migration unless the CLI migration history confirms it has not already been applied.

The catalog migration seeds vehicle categories with these documented defaults: `Sedan` and `Hatchback` -> `small`, `MPV` -> `medium`, `SUV` -> `large`, and `Pickup` and `Van` -> `xl`. It also seeds the example services `Basic Wash`, `Premium Wash`, `Interior Vacuum`, `Wax`, and `Tire Shine`, but no service prices. Prices are stored in Philippine Peso (PHP) and remain empty for an operator to configure.

The inventory migration intentionally seeds no items. Add consumables and optional shop products from `/admin/inventory`. Consumables do not have selling prices; shop products require a PHP selling price. New items start at zero stock, and current stock can only change through the admin movement form, which records an atomic ledger entry. Service consumable requirements are configured from `/admin/catalog#service-requirements` and do not deduct stock in this phase.

The customer check-in migration seeds no customer, vehicle, service-price, or product data. The public page reads the safe active catalog through `public.get_public_check_in_catalog` and submits through `public.submit_public_check_in`; it never receives direct table reads. Submissions are stored as `pending`, use a server-generated check-in number such as `CW-20260903-0001`, and use a submission idempotency key so retries return the original submission. The database function recalculates prices and writes the customer, vehicle, transaction, display snapshots, and all line snapshots atomically.

The transaction review migration adds `confirmed_at`, `cancelled_at`, and an optional cancellation reason. Only the active admin can use the protected revision, confirmation, and cancellation functions. Pending revisions recalculate current active catalog prices and replace the stored line snapshots atomically. Confirmation and cancellation do not complete a sale, change inventory stock, or create payment records.

### Create the single admin account

Customers do not have accounts and there is no public registration page. Disable public signups in Supabase Dashboard > Authentication > Configuration > User Signups, then provision only the one admin account in Supabase Dashboard > Authentication > Users:

1. Open Supabase Dashboard > Authentication > Users.
2. Select **Add user**.
3. Enter the operator email and a strong password.
4. Enable **Auto Confirm User** for a local or controlled first account, if available.
5. Select **Create user**.

The admin-only trigger creates a matching inactive `public.profiles` row. It does not grant usable protected access until the owner explicitly activates the intended account.

### Promote an existing profile, if needed

For the one intended admin account, or for an account created before this cleanup, open Supabase Dashboard > SQL Editor and run the following query with the real email address:

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

Verify the result in Table Editor > `public.profiles`. Only a database owner or privileged dashboard session should change `role` or `active`; there is no user-management UI.

Do not provision additional Auth users. The database may retain an older enum value for migration compatibility, but the application and policies use only the active `admin` profile.

## RLS foundation

Row-level security is enabled on `public.profiles`:

- **Active admins can read their own profile**: allows the authenticated admin to read only the admin profile values needed by the workspace. Anonymous users have no table privileges.
- **Active admins can update their own full name**: allows the authenticated admin to update only `full_name`. The `role`, `active`, identity, and timestamp columns are not granted for client updates.

There are no insert or delete grants for browser clients. The database-side Auth trigger creates profiles, and role or active-state changes require a privileged dashboard/database-owner operation.

Catalog tables also use row-level security:

- Active admin profiles can read vehicle categories, services, and service prices.
- Only active admin profiles can insert or update catalog records and prices.
- Anonymous users have no catalog table privileges, and catalog records are disabled instead of deleted.

Inventory tables also use row-level security:

- Only the active admin can read inventory items, stock movements, and service consumable requirements.
- Only the active admin can edit inventory details or service recipes. Inventory item status can be disabled instead of deleting the item.
- Browser clients do not receive direct stock or movement-insert privileges. Stock changes use the atomic `public.apply_inventory_movement` function, limited to stock-in and adjustment movement types.
- Anonymous users have no inventory table or function privileges. Service usage and product sale movement types remain reserved for a later workflow phase.

Customer check-in tables also use row-level security:

- Anonymous clients have no direct table privileges for customers, vehicles, transactions, or line items.
- Only active admins can read those tables directly. The public check-in flow uses only the narrowly scoped catalog and submission functions.
- The public catalog function returns active vehicle category names, active services and descriptions, category-specific prices, and active shop product names/prices. It does not return stock, recipes, operator-facing product descriptions, profiles, inactive records, or customer data.
- Public submission resolves customers by a normalized Philippine mobile number without making the number globally unique. It never overwrites an existing canonical customer or vehicle from an unverified public form; an exact plate/category/details match may be reused, otherwise a new vehicle record is created. Prior customer data is never returned to the form.
- Only the active admin can execute the transaction review functions. Direct browser writes to transaction and line-item tables are not granted; review mutations use the guarded database functions and status-transition trigger.

## Production deployment

Deploy the Next.js application to Vercel and use a separate production Supabase project or the approved production project:

1. Apply every migration in timestamp order before deploying the application. Use either the Supabase SQL Editor or `npx supabase db push`, not both for the same migration history.
2. In Vercel, open Project Settings > Environment Variables and add `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the Production environment. Add the legacy anon key only when the project does not provide a publishable key.
3. Set `NEXT_PUBLIC_APP_URL` to `https://coolcarcentrale.com`. The protected `/admin/qr` page shows a configuration warning instead of generating a QR code when the value is missing, malformed, or points to localhost in production.
4. Deploy with the repository build command (`npm run build`) and redeploy after changing any `NEXT_PUBLIC_*` variable because these values are read during the application build/runtime setup.
5. In Supabase Dashboard > Authentication > URL Configuration, set the Site URL to the deployed origin and add the deployed origin to the allowed redirect URLs if a future redirect-based Auth flow is enabled. The current email/password admin form does not use an OAuth callback.
6. Disable public signups and provision only the intended active admin account as described above. Never add a service role key or database password to Vercel client-visible environment variables.

The PWA uses the app manifest and the project-owned `public/img/logo.jpg`. It intentionally does not register a service worker or cache customer data. Customers can install the `/check-in` doorway from a supported browser, but submission still requires a live connection. If the shared tablet loses connectivity, the current form remains only in memory and no queue is created; reconnect before submitting. After a successful submission, use **New check-in** so the customer, vehicle, services, products, result, and idempotency key are cleared.

## Run locally

Install dependencies, configure `.env.local`, and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Restart the development server after changing environment variables.

## Routes

- `/` - Public landing page
- `/check-in` - Public five-step customer check-in wizard
- `/admin/login` - Public admin sign-in
- `/admin` - Protected admin dashboard with pending counts, confirmed counts, and recent submissions
- `/admin/sales` - Protected Sales placeholder
- `/admin/clients` - Protected Clients placeholder
- `/admin/inventory` - Protected inventory items, stock movements, and movement history
- `/admin/catalog` - Protected catalog and pricing configuration
- `/admin/qr` - Protected customer check-in QR display, download, and print utility
- `/admin/transactions/[id]` - Protected transaction review, pending edits, confirmation, and cancellation

Only an active `admin` profile may enter the admin shell. The main navigation remains limited to Sales, Clients, and Inventory. Catalog settings and service consumable recipes are available separately and are fully editable by the admin. The public check-in flow does not require an account and does not collect payment. Transaction review is limited to pending edits, confirmation, and cancellation; completion, sales, payment, and inventory deduction are not implemented.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
git diff --check
```

# RinsePoint Carwash Management System

RinsePoint is a simple web-based foundation for a carwash management system. It provides a customer check-in entry point and a focused admin shell for the three future operational modules: Sales, Clients, and Inventory.

Phase 1 establishes the application structure and responsive placeholder experiences. It intentionally does not connect a backend or implement forms, pricing, transactions, authentication, or payment features.

## Tech stack

- Next.js 16 with the App Router
- TypeScript
- Tailwind CSS
- ESLint
- npm

Supabase, PostgreSQL, and Supabase Auth are planned for a future phase and are not configured yet.

## Getting started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Routes

- `/` - Landing page
- `/check-in` - Customer check-in placeholder
- `/admin` - Admin dashboard shell
- `/admin/sales` - Sales placeholder
- `/admin/clients` - Clients placeholder
- `/admin/inventory` - Inventory placeholder

# Backend

Express + Prisma API for the Dietitian Support Platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from template:
   ```bash
   cp .env.example .env
   ```
3. Run migrations and generate Prisma client:
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```
4. Seed database:
   ```bash
   npm run prisma:seed
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

Server starts on `http://localhost:4000` and health is available at `GET /health`.

## Demo Accounts (Seeded)

- Admin: `admin@example.com`
- Dietitian: `dietitian@example.com`
- Dietitian (extra): `dietitian2@example.com`
- Password for all demo users: `Demo12345!`

## Core API Groups

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/foods`, `GET /api/equivalences`, `GET /api/equivalences/:foodId`
- `POST /api/reports/generate`, `GET /api/reports`
- `POST /api/diet-plans`, `GET /api/diet-plans`, `GET /api/diet-plans/:id`
- Admin-only: `/api/admin/users`, `/api/admin/diet-plans`, `/api/admin/foods`, `/api/admin/equivalences`, `/api/admin/reports`

## Deployment Notes

- Set `NODE_ENV=production` and provide strong `JWT_SECRET`.
- Point `DATABASE_URL` to a managed PostgreSQL instance.
- Restrict `CORS_ORIGIN` to the deployed frontend URL.
- Build/start:
  ```bash
  npm run build
  npm run start
  ```

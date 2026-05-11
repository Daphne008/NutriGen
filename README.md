# Dietitian Support Platform

Monorepo for a university demo project with:

- `frontend/`: Next.js + React + Tailwind user interface
- `backend/`: Express + Prisma + PostgreSQL REST API

## Quick Start (Local)

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
npm run dev
```

### 2) Frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:4000`.

### Start both servers without retyping commands (Windows)

After the one-time setup above (`npm install`, `.env` files, migrate, seed), you can start backend and frontend with a single action:

1. **Double-click** `scripts/start-dev.bat`  
   - Opens two PowerShell windows (backend on port 4000, frontend on 3000).  
   - Frontend runs **`npm run build` then `next start`** (not `next dev`) so CSS and `/_next/static` stay consistent on Windows. The first launch waits for the build.  
   - Close those windows when you want to stop.

If the site suddenly looks like **plain HTML with no styling**, stop anything on port 3000, then **double-click** `scripts/repair-frontend.bat` (or run `scripts/repair-frontend.ps1`). That deletes `.next`, rebuilds, and starts the production server again. Avoid running `npm run dev` and `npm run start` on the same port at the same time.

2. **Or** run once from PowerShell:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
   ```

3. **Optional (Cursor / VS Code):** Terminal → Run Task → create a task that runs the same script or two `npm run dev` tasks in split terminals.

## Demo Login Credentials

Created by the backend seed script:

- `admin@example.com` / `Demo12345!`
- `dietitian@example.com` / `Demo12345!`
- `dietitian2@example.com` / `Demo12345!`

## Presentation Demo Script

1. Open landing page and explain the project purpose (AI-like report + diet planning + admin oversight).
2. Login as `dietitian@example.com` and go to dashboard.
3. Choose a patient category and generate a report.
4. Build a diet plan with foods and show equivalence suggestions.
5. Finish plan and show evaluation screen:
   - total calories vs required calories
   - macro distribution chart
   - overall score + suggestions
6. Logout and login as `admin@example.com`.
7. Show admin tabs:
   - users
   - foods dataset
   - equivalence rules
   - generated reports and plans

## Deployment Checklist

- Backend:
  - Configure `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`
  - Run `npm run build && npm run start`
- Frontend:
  - Set `NEXT_PUBLIC_API_BASE_URL` to deployed backend URL
  - Run `npm run build && npm run start`
- Database:
  - Run Prisma migrations and seed once in target environment

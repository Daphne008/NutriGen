# Frontend

Next.js App Router frontend for the Dietitian Support Platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template:
   ```bash
   cp .env.local.example .env.local
   ```
3. Run the app locally:

   - **Stable (recommended on Windows, includes Tailwind/CSS):** builds then serves production mode  
     ```bash
     npm run demo
     ```
   - **Hot reload dev server** (if static assets 404 or CSS disappears, delete `.next` and use `npm run demo` instead):  
     ```bash
     npm run dev
     ```

## Project Structure

- `app/`: App Router pages, layouts, and global styles
- `components/ui/`: Shared UI primitives (`Button`, `Card`, `Input`, `Badge`)
- `lib/api.ts`: Typed API client with credentials-enabled requests
- `lib/types.ts`: Shared DTO-like frontend types
- `lib/utils.ts`: Common utility functions (`cn`)

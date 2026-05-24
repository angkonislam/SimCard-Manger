# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000 (HMR enabled)
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run lint      # TypeScript type check only (tsc --noEmit) — no ESLint configured
npm run clean     # Remove dist/
```

**Environment setup:** Copy `.env.example` to `.env.local` and fill in Supabase credentials:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The app gracefully falls back to mock data when Supabase is not configured.

## Architecture

This is a **mobile-first React SPA** for managing SIM card / telecom distribution business — invoices, customers, inventory, and financial transactions. The UI targets a fixed 430px-wide mobile viewport.

### Monolithic structure

Almost all business logic and UI lives in a single file: **`src/App.tsx`** (~3,400 lines). Navigation, data fetching, state management, and every view are co-located there. There is only one extracted sub-component: `src/components/CustomDatePicker.tsx`.

### Navigation model

The app has two levels of navigation tracked in React state:
- **`activeModule`** — top-level section: `analytics | invoices | customers | inventory | money`
- **`view`** / **`dashboardSubView`** — inner views within each module (e.g., invoice list → create details → create items → create review)

### Data layer

- **`src/lib/supabase.ts`** — initializes the Supabase client; exports `isSupabaseConfigured` boolean
- **`src/types.ts`** — all domain TypeScript interfaces: `Invoice`, `Customer`, `InventoryItem`, `Transaction`, `LineItem`
- On mount, `App.tsx` fetches from four Supabase tables and sets up real-time subscriptions; any remote change triggers a refetch
- When Supabase is not configured, mock data defined inline in `App.tsx` is used instead

### State management

Pure React hooks — no Redux, Zustand, or Context. Key state buckets:
- **Data collections:** `customers`, `invoices`, `inventory`, `transactions`
- **Editing drafts:** `draftInvoice`, `tempCustomer`, `tempInventoryItem`, `tempTransaction`
- **Navigation:** `view`, `activeModule`, `dashboardSubView`
- **UI:** `isLoading`, `isMenuOpen`, `isSupabaseConfigured`, plus per-list search/filter/sort state

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js`). Custom utilities and Recharts overrides are in `src/index.css`. Interactive elements use `active:scale-95` for touch feedback.

### Patch scripts

`patch.js`, `patch2.cjs`, `patch3.cjs` are standalone regex-based code transformation scripts used during development for one-off integrations (e.g., wiring up `CustomDatePicker`). They are not part of the build pipeline and are run manually when needed.

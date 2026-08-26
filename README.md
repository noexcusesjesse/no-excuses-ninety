# No Excuses Ninety

90-Day Reset Protocol — daily check-in, workouts, and tracking.

Built for the Loadline Fitness client program: tirzepatide-aware, resistance-band-only, calibrated for Arizona heat. One app, two surfaces: **client view** and **coach view**.

## Tech stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **shadcn-style** primitives (hand-rolled; no shadcn CLI install)
- **Inter** + **JetBrains Mono** via `next/font/google`
- **Lucide React** icons (pinned to 0.460+)
- **SQLite + Railway Volume** (Sprint 1)
- **@react-pdf/renderer** for client PDF export (Sprint 1)

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run start        # serve production build
```

Requires **Node 22** (better-sqlite3 prebuild coverage).

## Project structure

```
src/
├── app/
│   ├── page.tsx           # Landing — routes to client or coach
│   ├── client/page.tsx    # Client dashboard (today's plan)
│   ├── coach/page.tsx     # Coach dashboard (roster, needs attention)
│   ├── layout.tsx         # Root layout, fonts
│   └── globals.css        # Design tokens (HSL CSS variables)
├── components/
│   ├── ui/                # Button, Card primitives (cva)
│   └── app-header.tsx     # Shared top nav
└── lib/
    ├── utils.ts           # cn() helper
    └── mock-data.ts       # Sprint 0 fixtures
```

## Design tokens

All colors live in `globals.css` as HSL CSS variables and are mapped to Tailwind tokens in `tailwind.config.ts`. No hex literals in components. Brand red is reserved for the band icon, active CTAs, and streaks.

## Sprint status

- ✅ **Sprint 0** — scaffold + design tokens + mock client/coach dashboards. **Sign-off required before Sprint 1.**
- ⏭ **Sprint 1** — SQLite schema, auth, real data
- ⏭ **Sprint 2** — coach → client messaging, program assignment
- ⏭ **Sprint 3** — PDF export with @react-pdf/renderer
- ⏭ **Sprint 4** — Railway deploy + custom domain

## Deploy

See [`DEPLOY_RAILWAY.md`](./DEPLOY_RAILWAY.md) for step-by-step Railway setup.

## Program reference

The full 90-day program specification lives outside this repo at `/home/markusbot/no-excuses-ninety/PROGRAM_REVISED.md`. v1.1 includes physician clearance, hydration target, deload weeks, band calibration, mood/energy logging, and the Day 90 exit interview.

## License

Private — Loadline Fitness internal.

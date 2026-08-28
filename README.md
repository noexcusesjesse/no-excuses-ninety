# No Excuses Reset Program

Daily check-in, workouts, and tracking for the LoadLine Fitness **No Excuses Reset Program** (15-month Reset + Basic Training). One Next.js app, three role houses:

| Role | Home | What it is |
|------|------|------------|
| **Client** | `/client` | Daily house — dashboard, log, progress, month, assigned-coach thread |
| **Coach** | `/coach` | Roster and client files |
| **Staff** | `/staff` | Program ops (broadcasts, clearance, missing logs). **Client never sees Staff.** |

The Ninety is a block inside the 15-month Reset (days 1–90), not the product name. Fasting: overnight in Basic Training and The Ninety; 24h from Month 7 and 36h from Month 8, both physician-gated. LoadLine does not prescribe, dose, or adjust medications.

## Tech stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **shadcn-style** primitives (hand-rolled; no shadcn CLI install)
- **Inter** + **JetBrains Mono** via `next/font/google`
- **Lucide React** icons (pinned to 0.460+)
- **Postgres** via `DATABASE_URL` (Drizzle + postgres.js)

## Local development

```bash
npm install
cp .env.example .env   # set DATABASE_URL + SESSION_SECRET (32+ chars)
npm run db:migrate
npm run db:seed
npm run dev          # http://localhost:3000
npm run build        # production build
npm run start        # serve production build
```

Requires **Node 22**. Demo logins after seed: `staff@loadlinefitness.com` / `staff-demo`, `coach@loadlinefitness.com` / `loadline-demo`, `marcus@example.com` / `client-demo`.

## Project structure

```
src/
├── app/
│   ├── page.tsx             # Marketing landing → housePath(role) if signed in
│   ├── login/               # Shared login
│   ├── client/              # Client house (/client)
│   ├── coach/               # Coach house (/coach)
│   ├── staff/               # Staff house (/staff)
│   └── api/                 # health, fasting, coach, messages
├── components/              # Header, client tab nav, UI primitives
├── db/                      # Drizzle schema, queries, seed
└── lib/
    ├── session-config.ts    # housePath + iron-session (Edge-safe)
    ├── auth.ts              # Node auth (staff → coach → client)
    └── program-position.ts  # 15-month day math + fasting month gates
```

Old `/app/*` URLs redirect into `/client` (see `next.config.mjs`).

## Design tokens

All colors live in `globals.css` as HSL CSS variables and are mapped to Tailwind tokens in `tailwind.config.ts`. No hex literals in components. Brand red is reserved for the band icon, active CTAs, and streaks.

## Deploy

See [`DEPLOY.md`](./DEPLOY.md) for Railway + Postgres setup.

## License

Private — LoadLine Fitness internal.

# No Excuses Reset — Deployment Guide

Production is **Postgres on Railway**. SQLite, `DATABASE_PATH`, and Railway volumes are gone. Local and Railway both use `DATABASE_URL`.

## Prerequisites

- A Railway account with the **existing Postgres** database already created
- This repo on GitHub
- Node.js 22+ and npm for local testing

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. Railway sets this when you connect Postgres to the app service. |
| `SESSION_SECRET` | Yes | iron-session cookie secret. **32+ characters.** Generate with `openssl rand -base64 32`. |

Do not commit `.env` or production secrets.

---

## Local Development

```bash
# 1. Install dependencies (Node 22)
npm install

# 2. Copy the env template
cp .env.example .env
# Set DATABASE_URL to your local Postgres
# Set SESSION_SECRET to a 32+ character string

# 3. Create a local database (example)
# createdb noexcuses
# or: docker run --name noexcuses-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=noexcuses -p 5432:5432 -d postgres:16

# 4. Migrate + seed
npm run db:migrate
npm run db:seed
# Wipe and reseed: npm run db:reset   (drops the public schema in DATABASE_URL)

# 5. Start
npm run dev
# Open http://localhost:3000
```

### Demo credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Staff | `staff@loadlinefitness.com` | `staff-demo` |
| Coach | `coach@loadlinefitness.com` | `loadline-demo` |
| Client | `marcus@example.com` | `client-demo` |
| Client | `diane@example.com` | `client-demo` |
| Client | `robert@example.com` | `client-demo` |
| Client | `patricia@example.com` | `client-demo` |
| Client | `james@example.com` | `client-demo` |
| Client | `linda@example.com` | `client-demo` |

Only Marcus (`marcus@example.com`) is physician-cleared for extended fasts.

---

## Deploy to Railway (Jesse)

You already have Postgres. Do **not** add a volume. Do **not** set `DATABASE_PATH`.

### 1. Push to GitHub

Deploy from this GitHub repo (new project → Deploy from GitHub, or connect the existing Railway service to this repo).

### 2. Connect the existing Railway Postgres

1. Open the app service in Railway
2. **Variables** → connect / reference the existing Postgres plugin
3. Confirm `DATABASE_URL` is present (Railway injects it from the plugin)
4. Add `SESSION_SECRET` — 32+ characters: `openssl rand -base64 32`

Use the **internal** `DATABASE_URL` from the linked Postgres (not a public proxy URL) when the app and database are in the same Railway project.

### 3. Deploy

Nixpacks (`nixpacks.toml`) pins **Node 22** and:

1. `npm ci`
2. `npm run build` (Next.js production build)
3. `npm run db:migrate` (creates staffs, messages, clients, coaches, program_days, check-ins, etc.)
4. Start: `npm start`
5. Health check: `GET /api/health` (200 only if Postgres answers)

No `python3` / `node-gyp` / `better-sqlite3` compile.

### 4. Seed once (first deploy only)

After the first successful deploy:

```bash
npm install -g @railway/cli
railway link
railway run npm run db:seed
```

This creates:

- Staff: `staff@loadlinefitness.com` / `staff-demo`
- Coach: `coach@loadlinefitness.com` / `loadline-demo`
- 6 demo clients (`client-demo`), including Marcus
- 90-day program template
- Sample check-ins, weights, one LoadLine broadcast, Marcus 1:1 thread

Seed is idempotent: running it again will not duplicate the coach/clients. Do **not** run `npm run db:reset` on production — that drops the public schema.

### 5. Verify

1. Open the Railway URL
2. Login: staff → `/staff`, coach → `/coach`, Marcus (`client-demo`) → `/client`
3. Client never sees Staff. Broadcasts show as **LoadLine**. Fasting gates and the 15-month position helper are unchanged.
4. Visiting `/staff` as a client must not show ops. Visiting `/client` as coach/staff must bounce to their house.
5. `GET /api/health` → `{"ok": true, "db": "connected", ...}`

---

## Custom Domain

1. Railway dashboard → service → **Settings** → **Networking**
2. Add a custom domain
3. CNAME in DNS to the Railway URL
4. Railway handles SSL

---

## Production Security Checklist

- [ ] `SESSION_SECRET` is a secure 32+ character string (not the local default)
- [ ] `DATABASE_URL` points at the linked Railway Postgres (internal)
- [ ] No SQLite volume, no `DATABASE_PATH`
- [ ] `NODE_ENV` is `production` (Railway sets this)
- [ ] HTTPS is on (Railway)
- [ ] Demo passwords changed after first login if this is a real roster
- [ ] `.env` is not in git
- [ ] `/api/health` returns 200
- [ ] Rate limiting: consider `@upstash/ratelimit` on login
- [ ] CSP: consider `next-secure-headers` or middleware CSP

---

## Troubleshooting

### Build fails on migrate

1. Confirm Postgres is linked and `DATABASE_URL` is set on the **app** service (available at build time)
2. Confirm you are not still setting `DATABASE_PATH`
3. Rebuild after linking Postgres

### Login doesn't work after deploy

1. Run `railway run npm run db:seed` once
2. `curl https://your-app.up.railway.app/api/health` — must show `"db": "connected"`
3. Confirm `SESSION_SECRET` is 32+ characters and has not rotated (rotation logs everyone out)

### Session expires immediately

`SESSION_SECRET` missing, too short, or changed. Set a stable 32+ character value.

---

## Architecture

```
Client (browser)
  ↓ HTTPS
Next.js 14 (App Router)
  ├── Middleware (iron-session cookie check)
  ├── Server Components (async DB queries via Drizzle)
  ├── API Routes (/api/health, /api/fasting/*, /api/coach/*, /api/messages/*)
  └── Postgres (postgres.js + Drizzle)
        ↓
  DATABASE_URL (Railway Postgres plugin)
```

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| Database | Postgres via `DATABASE_URL` (postgres.js) |
| ORM | Drizzle ORM 0.45 |
| Auth | iron-session 8 (encrypted cookies) |
| Password hashing | bcryptjs |
| Styling | Tailwind CSS 3.4 |
| Icons | lucide-react |
| Deployment | Railway (Nixpacks, Node 22) |
| Health check | GET /api/health (verifies Postgres) |

---

## License

© 2026 LoadLine Fitness. All rights reserved.

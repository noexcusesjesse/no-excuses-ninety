# No Excuses Ninety — Deployment Guide

## Prerequisites

- A Railway account (railway.app)
- This repo pushed to GitHub
- Node.js 20+ and npm for local testing

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template
cp .env.example .env
# Edit .env — set SESSION_SECRET to a secure 32+ character string

# 3. Run database migration + seed
npm run db:reset

# 4. Start dev server
npm run dev
# Open http://localhost:3000
```

### Demo credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Coach | `coach@loadlinefitness.com` | `loadline-demo` |
| Client | `marcus@example.com` | `client-demo` |
| Client | `diane@example.com` | `client-demo` |
| Client | `robert@example.com` | `client-demo` |
| Client | `patricia@example.com` | `client-demo` |
| Client | `james@example.com` | `client-demo` |
| Client | `linda@example.com` | `client-demo` |

Only Marcus (`marcus@example.com`) is physician-cleared for extended fasts.

---

## Deploy to Railway

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-org>/no-excuses-ninety.git
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo
3. Railway detects the Node.js app automatically (`package.json` has a `start` script)

### Step 3: Add a Persistent Volume

SQLite stores data in a file. Railway's filesystem is wiped on every redeploy, so **you must add a volume** to keep data:

1. In Railway dashboard → your service → **Settings** → **Volumes**
2. Add a volume mounted at `/data`
3. This ensures `app.db` survives redeploys

### Step 4: Set Environment Variables

In Railway dashboard → your service → **Variables**, add:

| Variable | Value | Required |
|---|---|---|
| `DATABASE_PATH` | `/data/app.db` | Yes — points to the persistent volume |
| `SESSION_SECRET` | A secure 32+ character string | Yes — generates with `openssl rand -base64 32` |

**Generate a session secret:**
```bash
openssl rand -base64 32
```

### Step 5: Deploy

1. Railway will build automatically using Nixpacks (`nixpacks.toml`)
2. The build runs `npm run build` (Next.js production build)
3. The build also runs `npm run db:migrate` (creates/migrates the DB schema)
4. The start command is `npm start` (Next.js production server)
5. The health check hits `/api/health` (returns 200 if app + DB are running)

### Step 6: Seed the Database (first deploy only)

After the first successful deploy, run the seed script:

```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Link to your project
railway link

# Run the seed
railway run npm run db:seed
```

This creates:
- 1 coach account (`coach@loadlinefitness.com` / `loadline-demo`)
- 6 demo client accounts (`/client-demo`)
- 90-day program template (90 program_days rows)
- ~206 daily check-ins + ~32 weight entries

### Step 7: Verify

1. Visit your Railway URL (e.g., `https://your-app.up.railway.app`)
2. You should see the LoadLine Fitness marketing landing page
3. Click "Start Your Journey" → login page
4. Login with coach credentials → see the roster
5. Login with client credentials → see the 5-tab dashboard
6. Check `/api/health` — should return `{"ok": true, "db": "connected", ...}`

---

## Custom Domain

1. In Railway dashboard → your service → **Settings** → **Networking**
2. Add a custom domain (e.g., `app.loadlinefitness.com`)
3. Add a CNAME record in your DNS pointing to the Railway URL
4. Railway handles SSL automatically

---

## Production Security Checklist

- [ ] `SESSION_SECRET` is set to a secure 32+ character string (NOT the default)
- [ ] `DATABASE_PATH` points to `/data/app.db` (persistent volume)
- [ ] Volume is mounted at `/data` in Railway
- [ ] `NODE_ENV` is set to `production` (Railway sets this automatically)
- [ ] HTTPS is enforced (Railway does this automatically)
- [ ] Default passwords (`client-demo`, `loadline-demo`) are changed after first login
- [ ] `SESSION_SECRET` is not committed to the repo
- [ ] `.env` is in `.gitignore` (verify)
- [ ] Health check endpoint (`/api/health`) responds with 200
- [ ] Rate limiting: consider adding `@upstash/ratelimit` for the login endpoint
- [ ] CSP headers: consider adding `next-secure-headers` or manual CSP middleware

---

## Troubleshooting

### Build fails with `better-sqlite3` error

The `nixpacks.toml` includes `python3` so `node-gyp` can compile `better-sqlite3` from source if prebuilds aren't available. If this still fails:

1. Check the Node.js version — the nixpacks config pins Node 22
2. Make sure `python3` is in `nixPkgs` (it is in the current config)
3. Try rebuilding in Railway (Settings → Rebuild)

### Database is empty after redeploy

You need a persistent volume. Without it, Railway wipes the filesystem on every redeploy:

1. Railway dashboard → Settings → Volumes
2. Add a volume at `/data`
3. Set `DATABASE_PATH=/data/app.db`

### Login doesn't work after deploy

1. Make sure you ran `npm run db:seed` (via Railway CLI) after the first deploy
2. Check that `DATABASE_PATH` points to the volume path
3. Verify the health check: `curl https://your-app.up.railway.app/api/health`

### Session expires immediately

1. Check that `SESSION_SECRET` is set and is 32+ characters
2. If the secret changes, all existing sessions are invalidated (by design)

---

## Architecture

```
Client (browser)
  ↓ HTTPS
Next.js 14 (App Router)
  ├── Middleware (iron-session cookie check)
  ├── Server Components (async DB queries via Drizzle)
  ├── API Routes (/api/health, /api/coach, /api/fasting/*, /api/coach/*)
  └── SQLite (better-sqlite3)
        ↓
  /data/app.db (Railway persistent volume)
```

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| Database | SQLite (better-sqlite3) |
| ORM | Drizzle ORM 0.45 |
| Auth | iron-session 8 (encrypted cookies) |
| Password hashing | bcryptjs |
| Styling | Tailwind CSS 3.4 |
| Icons | lucide-react |
| Deployment | Railway (Nixpacks) |
| Health check | GET /api/health |

---

## License

© 2026 LoadLine Fitness. All rights reserved.

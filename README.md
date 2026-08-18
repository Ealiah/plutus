# Plutus — Finance OS

Monthly finance management for creative agencies, plus a public work gallery.

- `/` — public landing page (served from `landing.html`)
- `/gallary` — public work page: hero reel, filterable post grid, and live-preview website cards
- `/admin` — the dashboard (login required)

Stack: Next.js 15 (App Router, `output: "standalone"`), React 19, SQLite via `better-sqlite3`,
iron-session cookies, Tailwind v4, framer-motion, recharts.

## Requirements

- Node.js 20+
- A host with a **persistent filesystem** (VPS, Fly, Railway, Render, Docker).
  SQLite and the uploads directory are both on disk, so serverless platforms
  with ephemeral storage will lose data between invocations.

## Local development

```bash
npm install
cp .env.example .env.local     # then fill in the values below
npm run db:init                # creates data/plutus.db + default roles
npm run db:seed                # creates the first owner account
npm run dev                    # http://localhost:3000
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `IRON_SESSION_PASSWORD` | Session cookie encryption key. **32+ chars.** Generate with `openssl rand -base64 48`. |
| `DATABASE_PATH` | SQLite file. Use an absolute path in production, e.g. `/var/lib/plutus/plutus.db`. |
| `UPLOADS_DIR` | Where gallery images are written. Absolute in production, e.g. `/var/lib/plutus/uploads`. |
| `SEED_ADMIN_USERNAME` | Only read by `npm run db:seed`. |
| `SEED_ADMIN_PASSWORD` | Only read by `npm run db:seed`. Change it after first login. |

## Deploy

**Build on the server, not on your laptop.** `better-sqlite3` and `sharp` are native
modules — they compile to a binary for one specific OS and CPU. A bundle built on
macOS will not run on a Linux host. `package-lock.json` pins every version, so
`npm ci` reproduces the exact same dependency tree with the correct binaries.

Upload the repo (git push/clone, or copy the ~74 project files). **Never copy
`node_modules`, `.next`, `data/`, or `.env.local`** — the first two are rebuilt,
the last two are per-environment.

On the server:

```bash
npm ci
npm run build

export IRON_SESSION_PASSWORD=...        # fresh value, never reuse the dev one
export DATABASE_PATH=/var/lib/plutus/plutus.db
export UPLOADS_DIR=/var/lib/plutus/uploads

npm run db:init
npm run db:seed                          # creates the owner account, then unset the SEED_* vars

# assemble the standalone bundle (Next does not copy these two itself)
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

node .next/standalone/server.js          # listens on PORT, default 3000
```

Run it under systemd or pm2 so it survives reboots, and put nginx/Caddy in front
for TLS.

If you would rather build once and ship an artifact, build it inside a Linux
Docker image (`node:20-slim`) so the native modules match the target — then the
`.next/standalone` directory is self-contained and safe to copy.

Back up `DATABASE_PATH` (plus the `-wal`/`-shm` siblings) and `UPLOADS_DIR`
together — the gallery rows and the image files are a pair.

## Roles

`owner` sees everything. `accountant`, `manager`, and `viewer` are seeded with
narrower tab access and are editable from the Users tab. Only an owner can reach Users.

## Gallery admin

The Gallery tab drives the public `/gallary` page:

- **Hero** — the top 5 scattered photos
- **Grid** — the filterable wall (automotive / medical / foody / clothes / cosmetics)
- **Website Work** — cards for sites you've built; each one renders a live `<iframe>`
  preview of the URL. Sites that send `X-Frame-Options: DENY` or a restrictive
  `frame-ancestors` CSP can't be embedded — those cards fall back to a lettermark
  and still link out.

With no rows in the database, `/gallary` renders placeholder content so the page
is never empty.

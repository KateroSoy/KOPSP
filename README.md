# Koperasi Simpan Pinjam MVP

Backend and frontend MVP for a cooperative savings and loans app. The project uses a Vite React client, an Express + TypeScript API, Prisma ORM, and PostgreSQL with Supabase support.

## Stack

- Node.js 20+
- React + Vite + TypeScript
- Express + TypeScript
- Prisma ORM
- PostgreSQL or Supabase Postgres
- Zod validation
- JWT authentication
- Vitest + Supertest

## Core Features

- Admin and member login with JWT bearer auth
- Member dashboard, notifications, profile, and loan application flow
- Admin dashboard, members CRUD, savings products CRUD, loan products CRUD
- Loan application review, active loan listing, payment posting
- Announcements with notification fan-out
- Transaction history and summary endpoints
- Prisma schema, SQL migration, and seed data

## Environment Variables

Copy `.env.example` to `.env` and adjust the values for your machine.

```env
NODE_ENV=development
PORT=4000
APP_ORIGIN=http://127.0.0.1:3000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
ADMIN_CODE=ADM-001
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/simpan_pinjam?schema=public
VITE_API_PROXY_TARGET=http://127.0.0.1:4000
VITE_API_BASE_URL=
RUN_DB_TESTS=false
```

## Local Development

1. Install dependencies.

```bash
npm install
```

2. Create `.env` from `.env.example`.

3. Make sure PostgreSQL is running locally or your Supabase database is reachable, and that the database in `DATABASE_URL` exists.

4. Generate Prisma client and apply migrations.

```bash
npm run db:generate
npm run db:migrate
```

5. Seed demo data. On a non-empty database, the seed script now stops unless you explicitly set `SEED_RESET=true`.

```bash
npm run db:seed
```

6. Start the full app.

```bash
npm run dev
```

The frontend runs on `http://127.0.0.1:3000` and proxies `/api` to the backend on `http://127.0.0.1:4000`.

## Production Build

```bash
npm run build
npm start
```

The production server serves the built frontend from `dist/` and the API from the same Express process.

## Production Deployment

This app is suitable for:

- VPS with Ubuntu or Debian
- PaaS or hosting that supports Node.js apps
- Control-panel hosting with Node.js support

This app is not suitable for plain shared hosting that only supports PHP or static files.

### Option 1: VPS with Nginx + PM2

Recommended stack:

- Ubuntu 22.04+
- Node.js 20+
- PostgreSQL or Supabase Postgres
- Nginx
- PM2

#### 1. Install system packages

```bash
sudo apt update
sudo apt install -y nginx git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

#### 2. Prepare the production database

Create a Supabase project, copy the direct Postgres connection string, and make sure the target database is ready to accept Prisma migrations. The production `DATABASE_URL` should use the direct database host on port `5432` with SSL enabled, for example:

```env
DATABASE_URL=postgresql://postgres:your-supabase-password@db.your-project-ref.supabase.co:5432/postgres?schema=public&sslmode=require
```

#### 3. Upload or clone the project
```bash
cd /var/www
sudo git clone <your-repo-url> simpan-pinjam
sudo chown -R $USER:$USER /var/www/simpan-pinjam
cd /var/www/simpan-pinjam
```

#### 4. Create the production env file

Use [.env.production.example](/D:/digital%20product/SASS/simpan-pinjam/.env.production.example) as the template:

```bash
cp .env.production.example .env
```

Set at least:

- `NODE_ENV=production`
- `PORT=4000`
- `APP_ORIGIN=https://your-domain.com`
- `JWT_SECRET=<long-random-secret>`
- `DATABASE_URL=postgresql://postgres:your-supabase-password@db.your-project-ref.supabase.co:5432/postgres?schema=public&sslmode=require`

#### 5. Install dependencies and build

```bash
npm ci
npm run build
```

#### 6. Run database migrations

```bash
npm run db:migrate
```

Seed demo data only for first setup or demo server. If the database already contains rows and you intentionally want to wipe and reseed it, run with `SEED_RESET=true` first:

```bash
npm run db:seed
```

#### 7. Start with PM2

Use [ecosystem.config.cjs](/D:/digital%20product/SASS/simpan-pinjam/ecosystem.config.cjs):

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs simpan-pinjam
pm2 restart simpan-pinjam
pm2 stop simpan-pinjam
```

#### 8. Configure Nginx reverse proxy

Copy the example config from [nginx.simpan-pinjam.conf.example](/D:/digital%20product/SASS/simpan-pinjam/nginx.simpan-pinjam.conf.example) and replace the domain:

```bash
sudo cp nginx.simpan-pinjam.conf.example /etc/nginx/sites-available/simpan-pinjam
sudo nano /etc/nginx/sites-available/simpan-pinjam
sudo ln -s /etc/nginx/sites-available/simpan-pinjam /etc/nginx/sites-enabled/simpan-pinjam
sudo nginx -t
sudo systemctl reload nginx
```

#### 9. Enable HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### 10. Verify production

Check:

- `http://127.0.0.1:4000/api/health` on the server
- `https://your-domain.com`
- admin login
- member login
- create, update, and delete flows

### Option 2: Node.js Hosting Panel

If your hosting provider supports Node.js apps:

1. Upload the project files
2. Set the startup file to `build/server/server.index.js`
3. Set the build command to `npm run build`
4. Set environment variables from `.env.production.example`
5. Run `npm run db:migrate`
6. Point the domain to the Node.js application port

If the panel supports a post-deploy command, use:

```bash
npm ci && npm run build && npm run db:migrate
```

### Production Update Flow

For each update on VPS:

```bash
cd /var/www/simpan-pinjam
git pull
npm ci
npm run build
npm run db:migrate
pm2 restart simpan-pinjam
```

### Production Checklist

- `.env` uses production values
- `JWT_SECRET` is long and unique
- Supabase or PostgreSQL credentials are stored only in `.env` and not hardcoded
- Nginx is enabled
- HTTPS is active
- PM2 is running
- `npm run db:migrate` has been applied
- `db:seed` is not run on live production unless you want demo data
- firewall allows `80` and `443`

## Database Workflow

Generate Prisma client:

```bash
npm run db:generate
```

Apply checked-in migrations:

```bash
npm run db:migrate
```

Push schema directly without a migration:

```bash
npm run db:push
```

Seed demo data:

```bash
npm run db:seed
```

Regenerate the initial SQL migration script from the Prisma schema:

```bash
npm run db:sql
```

## Demo Accounts

- Admin: `08111111111` / `admin`
- Member: `08222222222` / `user`
- Member: `08333333333` / `user`

## Tests

Run the default API and type-level test suite:

```bash
npm test
```

Run lint and type checks:

```bash
npm run lint
```

Run the opt-in database-backed integration suite:

1. Set `RUN_DB_TESTS=true`
2. Point `DATABASE_URL` at a test database
3. Apply migrations and seed that test database
4. Run:

```bash
npm run test:db
```

## API Summary

- `POST /api/auth/login`
- `GET /api/health`
- `GET /api/me`
- `PUT /api/me/profile`
- `PUT /api/me/password`
- `GET /api/member/dashboard`
- `POST /api/member/loan-applications`
- `GET /api/admin/dashboard`
- `GET /api/admin/bundle`
- `GET /api/admin/reports/summary`
- `GET /api/admin/reports/members`
- `GET /api/admin/reports/savings`
- `GET /api/admin/reports/loans`
- `GET /api/admin/reports/installments`
- `GET /api/admin/reports/arrears`
- `GET /api/admin/reports/cashflow`
- `GET /api/admin/reports/daily-transactions`
- `GET /api/admin/reports/monthly-recap`
- `GET /api/admin/reports/member-detail/:memberCode`
- `GET /api/admin/members`
- `POST /api/admin/members`
- `PUT /api/admin/members/:id`
- `DELETE /api/admin/members/:id`
- `GET /api/admin/savings-products`
- `POST /api/admin/savings-products`
- `PUT /api/admin/savings-products/:id`
- `DELETE /api/admin/savings-products/:id`
- `GET /api/admin/loan-products`
- `POST /api/admin/loan-products`
- `PUT /api/admin/loan-products/:id`
- `DELETE /api/admin/loan-products/:id`
- `GET /api/admin/announcements`
- `POST /api/admin/announcements`
- `PUT /api/admin/announcements/:id`
- `DELETE /api/admin/announcements/:id`
- `GET /api/admin/loan-applications`
- `PATCH /api/admin/loan-applications/:id/status`
- `GET /api/admin/loans`
- `POST /api/admin/loans/:id/payments`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `GET /api/transactions`

## Notes

- Prisma migration files live in [prisma/migrations](/D:/digital%20product/SASS/simpan-pinjam/prisma/migrations).
- Seed data intentionally includes active loans, pending applications, announcements, transactions, and notifications so the UI is populated immediately after setup.




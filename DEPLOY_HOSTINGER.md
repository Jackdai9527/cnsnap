# Hostinger Deployment Guide

This project can be maintained cleanly with:

- `GitHub` private repository for source control
- `Hostinger` Node.js deployment for app runtime
- `Hostinger MySQL` for production data
- external upload storage via `STORAGE_ROOT`

## Recommended architecture

- Local development:
  - SQLite via `prisma/schema.prisma`
  - `.env.example` / `.env`
- Production on Hostinger:
  - MySQL via `prisma/schema.mysql.prisma`
  - `.env.hostinger.example`
  - upload files stored outside the deploy/build directory

## Before pushing to GitHub

This repo now ignores:

- `.env*` production/local secrets
- `.next`
- `node_modules`
- local DB files
- local uploads
- temporary output and caches

Still do this manually before first push:

1. Open `.env` and make sure it contains only local/dev values.
2. Do not commit any real API keys, SMTP passwords, or payment secrets.
3. If you used the local demo admin account before, plan a fresh production admin account.

## 1. Create the GitHub private repository

On GitHub:

1. Create a new private repository.
2. Do not initialize it with README or `.gitignore`.

In local terminal:

```bash
git init
git add .
git commit -m "Initial project import"
git branch -M main
git remote add origin git@github.com:YOUR_NAME/YOUR_PRIVATE_REPO.git
git push -u origin main
```

If you prefer HTTPS:

```bash
git remote add origin https://github.com/YOUR_NAME/YOUR_PRIVATE_REPO.git
```

## 2. Prepare Hostinger MySQL

In Hostinger hPanel:

1. Create a new MySQL database.
2. Create a dedicated DB user.
3. Record:
   - database host
   - database name
   - database user
   - database password

Build your production `DATABASE_URL` like:

```env
DATABASE_URL="mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/DB_NAME"
```

## 3. Connect Hostinger to the GitHub private repository

In Hostinger Node.js deployment:

1. Create a new Node.js app.
2. Connect GitHub.
3. Authorize access to the private repository.
4. Select the repo and branch, normally `main`.

## 4. Set the Hostinger environment variables

Copy values from `.env.hostinger.example`.

Minimum required production values:

```env
NODE_ENV=production
DATABASE_URL=mysql://...
APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=very-long-random-secret
STORAGE_ROOT=/home/your-hostinger-user/storage
UPLOADS_BASE_URL=/uploads
SEED_DEMO_DATA=false
SEED_ADMIN_EMAIL=admin@your-domain.com
SEED_ADMIN_PASSWORD=strong-random-password
```

Important notes:

- `NEXTAUTH_SECRET` must be long and random.
- `APP_URL` and `NEXTAUTH_URL` must be the final HTTPS domain.
- `STORAGE_ROOT` should not point into the build output directory.
- Leave demo buyer credentials empty in production unless you intentionally want test accounts.

## 5. Use the correct build and start commands

Recommended install/build commands for Hostinger:

```bash
npm install
npm run prisma:generate:mysql
npm run build
```

Recommended start command:

```bash
npm run start
```

If Hostinger asks for a single build command, use:

```bash
npm install && npm run prisma:generate:mysql && npm run build
```

## 6. Initialize the production database

Before first launch, run database sync against MySQL:

```bash
npm run prisma:push:mysql
```

Then seed the minimum required data:

```bash
npm run prisma:seed:mysql
```

Production seed behavior:

- creates required settings and base configuration
- creates an admin account only if `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set
- does not create demo orders/users unless `SEED_DEMO_DATA=true`

## 7. Upload persistence

The app now stores generated uploads under:

```bash
$STORAGE_ROOT/uploads
```

Public URLs still stay under:

```bash
/uploads/...
```

This is important because it means:

- redeploying code should not wipe uploaded files
- content editors can continue to use uploaded images and attachments after updates
- media and help attachments are separated from Git-tracked source files

Suggested directories on Hostinger:

```bash
/home/your-hostinger-user/storage
/home/your-hostinger-user/storage/uploads
/home/your-hostinger-user/storage/uploads/media
/home/your-hostinger-user/storage/uploads/help
```

## 8. First production checks

After deployment:

1. Open the homepage.
2. Open `/admin-login`.
3. Log in with the production admin account.
4. Verify that:
   - settings pages load
   - uploads work
   - media library works
   - database writes succeed
   - emails and payment settings are configured correctly

## 9. Day-to-day update workflow

Recommended workflow:

1. Develop locally.
2. Test locally with `npm run dev`.
3. Run:

```bash
npm run prisma:generate
npm run build:ci
```

4. Commit and push to GitHub:

```bash
git add .
git commit -m "Describe the update"
git push origin main
```

5. Hostinger auto-redeploys from GitHub.

## 10. When the database schema changes

Because production uses MySQL schema, every schema change should be followed by:

Local verification:

```bash
npm run prisma:generate
```

Production sync:

```bash
npm run prisma:push:mysql
```

Then redeploy or restart the app.

## 11. Ongoing maintenance checklist

Use this checklist for safer iteration:

- keep `.env.hostinger.example` updated when new env vars are introduced
- never store production secrets in Git
- back up the MySQL database before major releases
- back up `$STORAGE_ROOT/uploads` before large content migrations
- use a staging branch before risky changes if traffic grows
- rotate admin and third-party credentials periodically

## Official references

I verified the deployment direction against official documentation and platform docs:

- [Hostinger tutorials](https://www.hostinger.com/tutorials)
- [Hostinger support](https://www.hostinger.com/support)
- [Next.js self-hosting docs](https://nextjs.org/docs)
- [Prisma docs](https://www.prisma.io/docs)

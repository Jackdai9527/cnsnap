# Haitao Agent System

Next.js 16 + Prisma based purchasing-agent system.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create the local env file:

```bash
cp .env.example .env
```

3. Initialize the local SQLite database:

```bash
npm run db:init
```

4. Start the app:

```bash
npm run dev
```

## Production target

For Hostinger deployment, use:

- GitHub private repository
- Hostinger Node.js app deployment
- Hostinger MySQL database
- `prisma/schema.mysql.prisma`
- `STORAGE_ROOT` outside the app build directory

See [DEPLOY_HOSTINGER.md](/Users/jack/Documents/Purchasing%20agent%20system/DEPLOY_HOSTINGER.md) for the full setup.

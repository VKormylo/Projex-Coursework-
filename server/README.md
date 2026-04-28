# Projex Backend (Phase 1)

Backend for IT project/task management system based on:

- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- JWT + RBAC

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/projex
JWT_SECRET=change-me
PORT=4000
```

3. Generate Prisma client and apply migration:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Seed roles:

```bash
npm run prisma:seed
```

5. Apply DB business logic (procedures/trigger):

```bash
psql -U postgres -d projex -f prisma/sql/business_logic.sql
```

6. Run server:

```bash
npm run dev
```

Клієнт (React/Vite) — **окремий проєкт** у каталозі `../client`: там свій `package.json`, залежності та команда `npm run dev`. Запускайте сервер і клієнт у двох терміналах незалежно один від одного.

## API

- Health: `GET /health`
- Swagger: `GET /api/docs`
- Base path: `/api`

## Implemented modules

- Auth (`/api/auth`)
- Roles/Users (`/api/roles`, `/api/users`)
- Teams (`/api/teams`)
- Projects (`/api/projects`)
- Sprints (`/api/sprints`)
- Tasks (`/api/tasks`)
- Task comments (`/api/comments`)
- Releases (`/api/releases`)

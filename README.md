# Shopping Cart — Backend

REST API that simulates a shopping cart, built with **NestJS**, **TypeScript**, **Prisma ORM** and **PostgreSQL**.

> Project scaffolding stage: tooling, configuration, database setup and the shared error-handling foundation.
> The product catalog, cart and coupon endpoints land in the next stage.

## Tech stack

- **NestJS 11** + **TypeScript** (strict)
- **Prisma ORM** + **PostgreSQL** (tested against [Neon](https://neon.tech))
- **Swagger / OpenAPI**, **Jest**, **Docker** / **docker-compose**
- ESLint (flat config) + Prettier + Husky + lint-staged

## Running locally

```bash
npm install
cp .env.example .env   # then set DATABASE_URL to your PostgreSQL instance
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

Or with Docker: `docker compose up --build`.

## Environment variables

| Variable       | Description                                | Default                 |
|-----------------|----------------------------------------------|--------------------------|
| `NODE_ENV`      | `development` \| `production` \| `test`      | `development`            |
| `PORT`          | HTTP port                                     | `3000`                   |
| `DATABASE_URL`  | PostgreSQL connection string (Prisma)          | — (required)              |
| `FRONTEND_URL`  | Allowed CORS origin for the frontend            | `http://localhost:3001`  |

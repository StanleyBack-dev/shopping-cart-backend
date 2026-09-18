# Shopping Cart — Backend

REST API that simulates a shopping cart: product catalog, cart items, coupons, totals and checkout.

Built with **NestJS**, **TypeScript**, **Prisma ORM** and **PostgreSQL**, following a layered/clean-architecture
style (domain → application → infrastructure → presentation) per module, so business rules stay independent of
HTTP and persistence concerns.

## Tech stack

- **NestJS 11** + **TypeScript** (strict)
- **Prisma ORM** + **PostgreSQL** (tested against [Neon](https://neon.tech))
- **class-validator** / **class-transformer** for request validation
- **Swagger / OpenAPI** for API documentation
- **Jest** for unit and e2e tests
- **Docker** / **docker-compose** for containerized local runs
- ESLint (flat config) + Prettier + Husky + lint-staged

## Architecture

Each business module (`products`, `coupons`, `cart`) is organized in four layers:

```
src/modules/<module>/
├── domain/            # Entities and business rules — no framework/ORM imports
│   ├── entities/
│   └── enums/
├── application/        # Use cases + repository "ports" (interfaces)
│   ├── use-cases/
│   └── ports/
├── infrastructure/     # Port implementations (Prisma repositories)
│   └── persistence/prisma/
└── presentation/       # REST controllers and DTOs
    └── rest/
        ├── controllers/
        └── dtos/
```

- **Domain** entities (`Cart`, `CartItem`, `Product`, `Coupon`) own every business rule (stock validation, quantity
  rules, coupon replacement, subtotal/discount/total calculation, the "finalized carts can't change" rule) and
  throw a typed `AppException` when a rule is violated. They have zero knowledge of NestJS, HTTP or Prisma.
- **Application** use cases orchestrate a single action (e.g. `AddItemToCartUseCase`): they load data through a
  repository **port** (an interface), call the domain entity, and persist the result. Use cases from one module can
  depend on another module's use cases (e.g. the cart module reuses `GetProductByIdUseCase` and
  `FindCouponByCodeUseCase`) instead of duplicating "not found" handling.
- **Infrastructure** implements each port with Prisma (`ProductPrismaRepository`, `CartPrismaRepository`, ...).
  Swapping persistence technology later only means writing a new adapter for the same port.
- **Presentation** exposes REST controllers, request DTOs (validated with `class-validator`) and response DTOs
  (documented with `@nestjs/swagger`), and never touches Prisma directly.

Cross-cutting concerns live in `src/common/`:

- `common/exceptions/` — an `AppErrorDefinition` + `AppException.from(...)` pattern with a per-domain error
  **catalog** (`cart-errors.catalog.ts`, `product-errors.catalog.ts`, `coupon-errors.catalog.ts`), aggregated into
  `APP_ERRORS`. Every business error carries a stable machine-readable `code` (e.g. `CART_INSUFFICIENT_STOCK`) and a
  human-readable `message`. A global `HttpExceptionFilter` turns any thrown error (`AppException`, validation
  errors, or anything unexpected) into one consistent JSON shape.

## Business rules implemented

- **Add item** (`POST /v1/carts/:id/items`): if the product isn't in the cart yet, it's added with the requested
  quantity (defaults to `1` when omitted); if it's already there, the requested quantity is **summed** onto the
  existing one. The item's line total (`unitPrice * quantity`) and the cart's subtotal/discount/total are always
  recomputed in the response.
- **Remove item** (`DELETE /v1/carts/:id/items/:productId`): returns a treated `404 CART_ITEM_NOT_FOUND` if the
  product isn't in the cart.
- **Update quantity** (`PATCH /v1/carts/:id/items/:productId`): sets the *exact* quantity (not a delta).
- Quantities `<= 0` are always rejected (`400 CART_INVALID_QUANTITY`).
- **Stock validation**: adding to the cart or setting a quantity above `Product.stockQuantity` returns
  `422 CART_INSUFFICIENT_STOCK` with the requested and available amounts. Stock is **not decremented** by adding to
  a cart or by checkout — see [Pending / possible next steps](#pending--possible-next-steps).
- Product and cart-item responses always expose the product's current **net unit price** and **available stock**.
- **Coupons**: `10OFF` (10%) and `15OFF` (15%) are seeded. Applying a coupon **replaces** any previously applied one
  — only one can be active at a time. An unknown code returns `404 COUPON_NOT_FOUND`. The coupon can be removed.
- **Totals**: `subtotal` = sum of `unitPrice * quantity` over all items; `discount` = coupon percentage over the
  subtotal (`0` when no coupon is applied); `total` = `subtotal - discount`. All three are recomputed on every
  read and after every mutation.
- **Checkout** (`POST /v1/carts/:id/checkout`): sets the cart's status to `FINALIZED`. A finalized cart rejects any
  further mutation (`422 CART_ALREADY_FINALIZED`) — adding/removing items, changing quantity, and
  applying/removing a coupon are all blocked.

## API

Full REST surface (all under `/v1`, versioned via URI versioning):

| Method | Path                          | Description                                      |
|--------|-------------------------------|---------------------------------------------------|
| GET    | `/products`                   | List the catalog                                   |
| GET    | `/products/:id`                | Get a single product                               |
| GET    | `/coupons`                     | List the available coupons                         |
| POST   | `/carts`                       | Create a new, empty, open cart                      |
| GET    | `/carts/:id`                   | Get a cart (items, coupon, totals)                  |
| POST   | `/carts/:id/items`             | Add a product (body: `{ productId, quantity? }`)    |
| PATCH  | `/carts/:id/items/:productId`  | Set the exact quantity (body: `{ quantity }`)       |
| DELETE | `/carts/:id/items/:productId`  | Remove a product from the cart                      |
| POST   | `/carts/:id/coupon`            | Apply a coupon (body: `{ code }`)                   |
| DELETE | `/carts/:id/coupon`            | Remove the applied coupon                            |
| POST   | `/carts/:id/checkout`          | Finalize the cart                                    |

Interactive Swagger docs are served at **`/docs`** once the app is running (e.g. `http://localhost:3000/docs`).
A ready-to-use [`requests.http`](./requests.http) file (works with the VS Code "REST Client" extension) covers the
full flow end to end, including the treated-error scenarios.

Every error response has the same shape:

```json
{
  "success": false,
  "code": "CART_INSUFFICIENT_STOCK",
  "message": "Apenas 8 unidade(s) do produto 5 estão disponíveis em estoque (solicitado: 100).",
  "timestamp": "2026-09-18T19:59:04.737Z",
  "path": "/v1/carts/.../items"
}
```

> **Language note:** code, identifiers, comments and docs are in English; `code` values are stable English
> identifiers for clients to branch on. The `message` shown to end users, and the product catalog itself, are in
> **Portuguese**, since the target application/audience is Brazilian.

## Running locally (without Docker)

Requirements: Node.js 22+, npm, and a PostgreSQL database (local or [Neon](https://neon.tech)).

```bash
npm install
cp .env.example .env   # then set DATABASE_URL to your PostgreSQL instance
npm run prisma:migrate:dev   # applies migrations
npm run prisma:seed          # seeds the 10 products and the 2 coupons
npm run start:dev
```

The API starts on `http://localhost:3000` (`PORT` in `.env`), docs at `/docs`.

## Running with Docker

```bash
docker compose up --build
```

This starts a local PostgreSQL container and the API container. On boot, the API container runs
`prisma migrate deploy`, seeds the catalog, then starts the server on `http://localhost:3000`. To point the
Docker Compose stack at Neon instead of the bundled Postgres container, set `DATABASE_URL` under the `api` service
in `docker-compose.yml` to your Neon connection string and remove the `postgres` dependency.

## Environment variables

| Variable       | Description                                              | Default                 |
|-----------------|------------------------------------------------------------|--------------------------|
| `NODE_ENV`      | `development` \| `production` \| `test`                    | `development`            |
| `PORT`          | HTTP port                                                   | `3000`                   |
| `DATABASE_URL`  | PostgreSQL connection string (Prisma)                       | — (required)              |
| `FRONTEND_URL`  | Allowed CORS origin for the frontend                         | `http://localhost:3001`  |

## Tests

```bash
npm test          # unit tests (domain rules, use cases)
npm run test:cov  # unit tests with coverage
npm run test:e2e  # end-to-end tests against a real running app + database
```

`test:e2e` needs a reachable, migrated and seeded `DATABASE_URL` (same as running the app locally). Unit tests
have no external dependencies and are what CI runs.

## Design decisions & assumptions

- **Database naming standard**: tables are prefixed `tb_` and every primary/foreign key column is prefixed
  `idtb_` (e.g. `tb_products.idtb_products`, `tb_cart_items.idtb_carts`), per the requested convention. This is
  purely a physical database naming choice, applied through Prisma's `@map`/`@@map` — the TypeScript code
  (models, fields, variables) stays in idiomatic English camelCase.
- **Catalog & coupon source data**: the original test's `produtos.json` / `cupons.json` files weren't available, so
  [`prisma/data/products.json`](./prisma/data/products.json) and
  [`prisma/data/coupons.json`](./prisma/data/coupons.json) were authored to match the exact shape described in the
  spec (id, description, stock, net price / id, code, discount percentage) and are applied via `prisma db seed`,
  matching the "persist via seed/migration" requirement. Product descriptions are in Portuguese (the coupon
  `code`s stay as the exact `10OFF`/`15OFF` values the spec mandates).
- **"Add item" with no explicit quantity**: the spec's wording is ambiguous about whether a brand-new item always
  starts at quantity `1` or starts at the requested quantity. This implementation treats `1` as the **default**
  when `quantity` is omitted from the request, and uses the requested quantity otherwise — new and existing items
  both honor whatever quantity is sent, which generalizes the spec's example instead of contradicting it.
- **Cart item pricing is always live**: `CartItem` doesn't persist a price snapshot — the unit price and available
  stock shown for an item always reflect the product's *current* catalog values, re-read on every request. This
  avoids the cart silently drifting from the catalog if a product's price or stock changes after it's added to a
  cart.
- **Totals are computed, not stored**: `subtotal`, `discount` and `total` are derived on every read from the
  items + coupon rather than persisted columns, so they can never go stale relative to the cart's actual contents.
- **No authentication / no user ownership**: the spec doesn't ask for it, and a cart is addressed purely by its own
  `id` (a UUID), same as a typical anonymous/guest cart.
- **Global exception filter**: every thrown error — `AppException`, NestJS validation errors, or anything
  unexpected — is normalized into the same `{ success, code, message, timestamp, path }` shape, so the frontend
  never has to special-case error formats.

## Pending / possible next steps

Given the 2-day scope, the following were intentionally left out — noted here rather than left unexplained:

- **Stock is not decremented** when items are added to a cart or on checkout, and isn't restored if a cart is
  abandoned. The spec only asks that adding/updating be *blocked* above the available stock, not that stock be
  reserved or committed — implementing real reservation would need a decision on cart expiry/abandonment and
  concurrency handling (e.g. optimistic locking) that felt out of scope here.
- **No pagination** on `GET /products` — the catalog is fixed at 10 items, so it wasn't needed, but it's the first
  thing to add if the catalog grows.
- **Coupon rules are minimal** (flat percentage off the subtotal, single active coupon) since only `10OFF`/`15OFF`
  were required; there's no coupon validity window, minimum-subtotal rule, or usage limit.
- **CI does not run `test:e2e`**, since it needs a live, migrated, seeded database and no such secret is wired into
  GitHub Actions for this exercise. `npm test` (unit) runs on every push/PR instead.

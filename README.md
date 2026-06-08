# 1MinuteShop — Production-Ready E-Commerce Backend

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)
![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D)

---

## Project Description

**1MinuteShop** is a production-grade e-commerce backend data layer built as the final submission for **DBS302 — Database Systems**. The system pairs **MongoDB Atlas** as the primary document store with **Upstash Redis** as a managed in-memory key-value store, demonstrating the complementary roles of a document database and a cache/real-time store in a real-world application.

The backend exposes a REST API built with the **Hono** framework on Node.js, typed end-to-end with TypeScript, and modelled through **Prisma ORM** (MongoDB provider). The frontend is a **Next.js 16** application styled with Tailwind CSS 4 and deployed to Netlify.

Core capabilities include: a multi-category product catalogue with full-text search and filtering, Redis-backed shopping cart and session management, transactional order processing with atomic stock decrement, real-time trending leaderboards and unique-visitor analytics, and MongoDB aggregation-pipeline reports for sales and revenue.

---

## System Architecture Overview

<!-- SCREENSHOT: Insert system architecture diagram showing Frontend → Backend API → MongoDB Atlas + Upstash Redis layers -->
![System Architecture](./assets/screenshots/architecture-diagram.png)

```
┌──────────────────────────────────────────────────────────┐
│                       Client Layer                        │
│   Next.js 16 + React 19 (Netlify — final-dbs.netlify.app)│
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP / REST (CORS-gated)
┌────────────────────────▼─────────────────────────────────┐
│                    Backend API Layer                       │
│      Hono v4 · TypeScript · Node.js · Port 8080           │
│  Routes: /auth  /products  /cart  /orders  /analytics     │
│          /users                                           │
│  Middleware: requestLogger · CORS · authMiddleware ·      │
│             loginRateLimiter                              │
└────────────┬──────────────────────────┬───────────────────┘
             │ Prisma ORM (read/write)  │ Native Driver
             │ + native driver          │ (transactions,
             │ (analytics/orders)       │  aggregations)
┌────────────▼──────────┐  ┌───────────▼───────────────────┐
│    MongoDB Atlas       │  │       Upstash Redis            │
│  Primary Document Store│  │  In-Memory Key-Value Store     │
│  Collections:          │  │  Keys:                         │
│  · User                │  │  · product:{id}  (String)      │
│  · Product             │  │  · cart:{userId} (Hash)        │
│  · Category            │  │  · session:{uid} (Hash)        │
│  · Order               │  │  · trending:*    (Sorted Set)  │
│  · OrderItem           │  │  · recentlyViewed:* (List)     │
│  · Review              │  │  · visits:{pid}  (HyperLogLog) │
│  · Inventory           │  │  · ratelimit:*   (String)      │
│  · AccessToken         │  │                                │
│  · RefreshToken        │  └────────────────────────────────┘
└───────────────────────┘
```

The backend follows a layered architecture: route handlers delegate to service classes, services call repositories or the native MongoDB driver for transactions and aggregations, and Prisma handles all standard CRUD against MongoDB Atlas. Redis is accessed directly through the `@upstash/redis` REST client.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | Next.js + React | 16.2.7 / 19 | SSR/SSG storefront UI |
| Frontend Styling | Tailwind CSS | 4.x | Utility-first styling |
| Frontend Deployment | Netlify | — | CDN hosting + edge |
| Backend Framework | Hono | 4.x | Lightweight HTTP API on Node.js |
| Backend Language | TypeScript | 5.x | End-to-end type safety |
| ORM | Prisma | 6.x | Schema-first MongoDB modelling |
| Primary Database | MongoDB Atlas | 7.x driver | Document store — products, users, orders |
| Cache / Real-Time | Upstash Redis | REST SDK 1.x | Cart, sessions, trending, rate limiting |
| Authentication | Custom JWT (HS256) | — | HMAC-signed tokens, refresh rotation |
| Password Hashing | PBKDF2 / SHA-512 | Node.js crypto | 100,000 iterations, per-user salts |
| Performance Testing | k6 | — | Load benchmarks for cache-aside strategy |
| API Testing | REST client / curl | — | Manual endpoint verification |

---

## Features

### User Management
- User registration with PBKDF2/SHA-512 password hashing and per-user salts
- Login with timing-safe comparison and Redis-backed rate limiting (5 attempts / 60 s per IP)
- JWT access tokens (15 min TTL) and refresh tokens (7 day TTL) signed with HMAC-SHA-256
- Token hashes stored in MongoDB — raw tokens never persisted
- Refresh token rotation on each `/auth/refresh` call
- Role-based model: `CUSTOMER`, `SELLER`, `ADMIN`
- User session cached in Redis Hash (`session:{userId}`, 24 hr TTL) to reduce MongoDB reads on every authenticated request
- Logout revokes all tokens and deletes the Redis session

### Product Catalogue
- Paginated product listing with category filter (parent + subcategory resolution)
- Full-text search index on `(name, description, tags)` via Prisma schema directive
- Compound index `(categoryId, price)` for efficient filtered browsing
- Flexible `attributes` JSON field for category-specific metadata
- Per-product `variants` (size, colour, SKU, stock, price) stored as embedded documents
- Cache-aside caching: product detail cached in Redis String (`product:{id}`) with 1 hr base TTL + random 0–300 s jitter to prevent cache stampede
- `X-Cache: HIT / MISS` response header on `GET /products/:id`
- Cache invalidated on `PATCH /products/:id`

### Shopping Cart & Sessions
- Cart stored in a Redis Hash (`cart:{userId}`): field = `productId`, value = quantity string
- 7-day sliding TTL reset on every cart mutation
- Cart retrieval hydrates product details from MongoDB in a single `findMany` call
- Session data (user id, email, role, name) cached as a Redis Hash (`session:{userId}`, 24 hr TTL) to serve authenticated requests without hitting MongoDB

### Order Processing
- Order placement runs inside a native MongoDB transaction (`session.withTransaction`) with `readConcern: "majority"` and `writeConcern: { w: "majority" }`
- Atomic inventory decrement: `updateOne({ quantity: { $gte: requested } }, { $inc: { quantity: -n } })` — fails if stock is insufficient, rolling back the entire transaction
- Order status workflow: `PLACED → CONFIRMED → SHIPPED → DELIVERED` (or `CANCELLED` / `RETURNED`)
- Duplicate product IDs in a single order request are merged before processing

### Real-Time Features
- **Trending leaderboard**: Redis Sorted Set (`trending:products:{YYYY-MM-DD}`) incremented by `ZINCRBY` on every product view; top 10 returned via `ZRANGE … REV WITHSCORES`; 24 hr TTL per daily key
- **Recently viewed**: Redis List (`recentlyViewed:{userId}`) updated with `LPUSH` + `LTRIM` to maintain the last 10 product IDs
- **Unique visitor count**: Redis HyperLogLog (`visits:{productId}`) tracks distinct visitors (user ID or IP) with `PFADD`; estimated unique count read with `PFCOUNT`
- **Rate limiting**: Redis String counter (`ratelimit:login:{ip}`) with `INCR` + `EXPIRE`; returns HTTP 429 after threshold

### Analytics
- **Monthly revenue report** (`GET /analytics/revenue`): aggregation pipeline over the `Order` collection — `$match` DELIVERED, `$group` by year/month, `$project` rounded revenue and order count, `$sort` chronologically
- **Top 10 products by volume** (`GET /analytics/top-products`): aggregation over `OrderItem` — `$group` by `productId`, sum quantity and revenue, `$sort`, `$limit 10`, `$lookup` to join Product names

---

## Local Setup Instructions

### 1. Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| Node.js | 20.x | Use nvm or volta to manage versions |
| npm | 10.x | Bundled with Node 20 |
| MongoDB Atlas account | — | Free M0 cluster is sufficient |
| Upstash account | — | Free tier Redis database |
| Git | 2.x | — |

> MongoDB and Redis are cloud-hosted (Atlas + Upstash). No local Docker installation is required.

### 2. Clone the Repository

```bash
git clone <repository-url>
cd dbs-finals
```

### 3. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in the values (see [Environment Variables](#environment-variables) section):

```bash
DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
AUTH_TOKEN_SECRET=
```

For the frontend:

```bash
cd ../frontend
cp .env.local.example .env.local
```

Open `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Generate Prisma Client

```bash
cd backend
npx prisma generate
```

### 6. Run Database Seed Scripts

The seed script populates MongoDB Atlas with:
- **12 users** — 1 admin (`admin@1minuteshop.com`), 1 seller (`seller@1minuteshop.com`), 10 customers
- **15 categories** — 5 parent categories (Electronics, Clothing, Books, Home & Kitchen, Sports) with 2 subcategories each
- **50 products** — 10 per parent category, each with 2 variants (Black / White, with optional size)
- **50 inventory records** — one per product
- **20 orders** — 2 per customer, spread across the last 6 months with mixed statuses
- **30 reviews** — left by customers on delivered orders

```bash
cd backend
npm run seed
# or: npx prisma db seed
```

**Default seed credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@1minuteshop.com | admin123 |
| Seller | seller@1minuteshop.com | seller123 |
| Customer | karma.dorji@example.com | customer123 |

### 7. Start the Development Servers

Backend (port **8080**):

```bash
cd backend
npm run dev
```

Frontend (port **3000**):

```bash
cd frontend
npm run dev
```

### 8. Verify the API

```bash
# Health check
curl http://localhost:8080/

# List products
curl http://localhost:8080/products

# Get trending
curl http://localhost:8080/products/trending
```

API base URL: `http://localhost:8080`  
Frontend dev URL: `http://localhost:3000`  
Production frontend: `https://final-dbs.netlify.app`

---

## Environment Variables

### Backend (`backend/.env`)

```dotenv
# MongoDB Atlas SRV connection string (includes database name)
DATABASE_URL=

# Upstash Redis REST endpoint (https://...)
UPSTASH_REDIS_REST_URL=

# Upstash Redis REST auth token
UPSTASH_REDIS_REST_TOKEN=

# HMAC secret for JWT signing — change from default in production
AUTH_TOKEN_SECRET=
```

| Variable | Description | Example format |
|---|---|---|
| `DATABASE_URL` | MongoDB Atlas SRV URI with database name | `mongodb+srv://user:pass@cluster.mongodb.net/dbname?appName=…` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis HTTPS REST endpoint | `https://<name>.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis bearer auth token | `AX…` |
| `AUTH_TOKEN_SECRET` | HMAC-SHA-256 secret for JWT signing | Any long random string |

### Frontend (`frontend/.env.local`)

| Variable | Description | Example format |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL accessible from the browser | `http://localhost:8080` |

---

## API Documentation

The API is documented through this README and accompanying Postman collection. All endpoints return JSON. Protected endpoints require a `Bearer` token in the `Authorization` header.

> 📬 [Postman Collection](#) — *Replace `#` with the actual Postman public link*

### Endpoint Reference

#### Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new customer account |
| `POST` | `/auth/login` | Public (rate-limited) | Login; returns access + refresh tokens |
| `POST` | `/auth/refresh` | Refresh token | Rotate refresh token; issue new token pair |
| `POST` | `/auth/logout` | Access token | Revoke all tokens, delete Redis session |

#### Products — `/products`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/products` | Public | Paginated product list (`?category=&page=&limit=`) |
| `GET` | `/products/trending` | Public | Top 10 trending products (Redis Sorted Set) |
| `GET` | `/products/:id` | Public | Product detail — cache-aside with `X-Cache` header |
| `GET` | `/products/:id/stats` | Public | Unique visitor count (HyperLogLog `PFCOUNT`) |
| `PATCH` | `/products/:id` | Access token | Update product fields; invalidates Redis cache |
| `POST` | `/products/:id/view` | Access token | Record product view in recently-viewed list |

#### Cart — `/cart`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/cart` | Access token | Retrieve cart with hydrated product details |
| `POST` | `/cart/items` | Access token | Add item (`{ productId, quantity }`) |
| `PATCH` | `/cart/items/:productId` | Access token | Update quantity (`{ newQuantity }`) |
| `DELETE` | `/cart/items/:productId` | Access token | Remove item from cart |

#### Orders — `/orders`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/orders` | Access token | Place order — ACID transaction, atomic stock decrement |
| `GET` | `/orders` | Access token | List authenticated user's order history |

#### Analytics — `/analytics`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/analytics/revenue` | Public | Monthly revenue & order count (aggregation pipeline) |
| `GET` | `/analytics/top-products` | Public | Top 10 products by units sold (aggregation pipeline) |

#### Users — `/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | Access token | Get authenticated user's profile |
| `PATCH` | `/users/me` | Access token | Update profile fields |

---

## Screenshots

### User Authentication

<!-- SCREENSHOT: Show the registration form with name/email/password fields, then the login form. Capture both empty state and a filled example. -->
![User Registration & Login](./assets/screenshots/login-registration.png)

### Product Listing with Filters

<!-- SCREENSHOT: Product grid page showing category filter chips/dropdown, pagination controls, and at least 6 product cards with name, price, and image. -->
![Product Listing with Filters](./assets/screenshots/product-listing.png)

### Product Detail Page

<!-- SCREENSHOT: Single product page showing name, description, price, variants (size/colour), stock status, add-to-cart button, and reviews section. -->
![Product Detail Page](./assets/screenshots/product-detail.png)

### Shopping Cart

<!-- SCREENSHOT: Cart page showing line items (product name, quantity selector, price), subtotal, and checkout button. -->
![Shopping Cart](./assets/screenshots/cart.png)

### Order Placement (Checkout Flow)

<!-- SCREENSHOT: Checkout form with delivery address fields, order summary, and confirm button. Optionally show the success response or confirmation page. -->
![Order Placement](./assets/screenshots/order-placement.png)

### Order History

<!-- SCREENSHOT: List of past orders for a logged-in customer — show order ID, date, status badge (PLACED / DELIVERED etc.), and total. -->
![Order History](./assets/screenshots/order-history.png)

### Admin Dashboard / Analytics

<!-- SCREENSHOT: Analytics page showing monthly revenue chart and top-10 products table rendered from the aggregation pipeline responses. -->
![Admin Dashboard / Analytics](./assets/screenshots/admin-analytics.png)

### Trending Leaderboard (Real-Time)

<!-- SCREENSHOT: Trending products section showing top products ranked by view count, sourced from the Redis Sorted Set endpoint GET /products/trending. -->
![Trending Leaderboard](./assets/screenshots/trending-leaderboard.png)

### MongoDB Compass — Collections Overview

<!-- SCREENSHOT: MongoDB Compass connected to the Atlas cluster, showing the database with all 9 collections (User, Product, Category, Order, OrderItem, Review, Inventory, AccessToken, RefreshToken) and approximate document counts. -->
![MongoDB Compass — Collections Overview](./assets/screenshots/mongodb-compass.png)

### Redis CLI / RedisInsight — Key Structures

<!-- SCREENSHOT: RedisInsight or redis-cli output showing the key types in use: a product:{id} String, a cart:{userId} Hash, the trending:products:{date} Sorted Set with scores, a recentlyViewed:{userId} List, and a visits:{productId} HyperLogLog key. -->
![Redis CLI / RedisInsight — Key Structures](./assets/screenshots/redis-insight.png)

### Docker Compose / Cloud Services — All Services Healthy

<!-- SCREENSHOT: For this project, services are cloud-hosted. Show the MongoDB Atlas cluster overview (Primary + 2 Secondaries, all green) and the Upstash Redis database dashboard (status: active) side by side or as two captures. -->
![Services Health Overview](./assets/screenshots/docker-services.png)

### Redis High Availability Configuration

<!-- SCREENSHOT: Upstash Redis database page showing region, replication, and HA/durability settings. If on a self-hosted setup, show redis-sentinel.conf or the Sentinel INFO output confirming quorum. -->
![Redis HA Configuration](./assets/screenshots/redis-ha.png)

### MongoDB Replica Set Status

<!-- SCREENSHOT: MongoDB Atlas cluster topology view or Atlas Metrics page showing 3 nodes. If using mongosh, run `rs.status()` and capture the output showing primary and secondary members with health:1 and stateStr. -->
![MongoDB Replica Set Status](./assets/screenshots/mongo-replica-set.png)

### Performance Benchmark Results (Cache-Aside)

<!-- SCREENSHOT: k6 output from running backend/src/scripts/benchmark.js showing the p95 latency comparison between cold cache (X-Cache: MISS) and warm cache (X-Cache: HIT) for GET /products/:id. -->
![Performance Benchmark Results](./assets/screenshots/benchmark-results.png)

---

## Database Design Summary

### MongoDB Collections

| Collection | Purpose | Key Fields |
|---|---|---|
| `User` | Stores customers, sellers, and admins. Embeds `addresses[]` and `wishlist[]` directly on the document. | `email` (unique), `passwordHash`, `passwordSalt`, `role`, `addresses`, `wishlist` |
| `AccessToken` | Persists SHA-256 hashes of issued JWT access tokens for revocation checks. | `tokenHash` (unique), `userId`, `expiresAt`, `revokedAt` |
| `RefreshToken` | Persists SHA-256 hashes of refresh tokens; `revokedAt` enforces single-use rotation. | `tokenHash` (unique), `userId`, `expiresAt`, `revokedAt` |
| `Category` | Hierarchical product categories. Self-referential `parentId` supports one level of subcategories. | `name` (unique), `parentId` |
| `Product` | Core product catalogue. Embeds `variants[]` (size, colour, SKU, stock, price) and flexible `attributes` JSON. Full-text index on `(name, description, tags)`. Compound index `(categoryId, price)`. | `name`, `price`, `categoryId`, `tags[]`, `attributes`, `variants[]`, `stock`, `sellerId` |
| `Order` | Order lifecycle document. Status enum drives the fulfilment workflow. Delivery address is an embedded sub-document. Index on `(userId, status)`. | `userId`, `status`, `total`, `deliveryAddress`, `createdAt` |
| `OrderItem` | Individual line items referencing Order and Product. Created inside the order placement transaction. | `orderId`, `productId`, `quantity`, `price` |
| `Review` | Customer ratings (1–5) and text comments. Only written after a DELIVERED order. Index on `productId`. | `userId`, `productId`, `rating`, `comment`, `createdAt` |
| `Inventory` | Separate stock-tracking collection for atomic decrements during order transactions. Decoupled from Product to avoid document-level write contention. | `productId` (unique), `quantity`, `updatedAt` |

### Redis Key Space

| Redis Type | Key Pattern | TTL | Use Case |
|---|---|---|---|
| **String** | `product:{productId}` | 1 hr + 0–300 s jitter | Product detail cache-aside. Serialised JSON. Deleted on product update. |
| **Hash** | `cart:{userId}` | 7 days (sliding) | Shopping cart — field per `productId`, value = quantity string. Reset on every mutation. |
| **Hash** | `session:{userId}` | 24 hr | Authenticated user session cache (id, email, role, name). Avoids MongoDB lookup on every request. |
| **Sorted Set** | `trending:products:{YYYY-MM-DD}` | 24 hr | Daily trending leaderboard. Score = view count. `ZINCRBY` on each product detail request. |
| **List** | `recentlyViewed:{userId}` | No explicit TTL | Last 10 viewed product IDs. `LPUSH` + `LTRIM 0 9` on each view. |
| **HyperLogLog** | `visits:{productId}` | No explicit TTL | Probabilistic unique visitor count. `PFADD` on each view (user ID or IP). `PFCOUNT` to read. |
| **String (counter)** | `ratelimit:login:{ip}` | 60 s | Login rate limiter. `INCR` per request; `EXPIRE` set on first increment. Rejects after 5 attempts. |

---

## Caching Strategy

1MinuteShop uses a **cache-aside (lazy loading)** pattern between MongoDB Atlas and Upstash Redis for product detail reads. When `GET /products/:id` is called, the handler first checks Redis for the key `product:{id}`. On a cache **hit**, the cached JSON is returned immediately and the `X-Cache: HIT` header is set. On a cache **miss**, the handler queries MongoDB via Prisma, serialises the result to JSON, writes it to Redis with `SET … EX`, and sets `X-Cache: MISS`. The TTL is randomised between 3,600 and 3,900 seconds per product to prevent a cache stampede when many products expire simultaneously. Cache **invalidation** is explicit: `PATCH /products/:id` deletes the Redis key with `DEL` before returning the updated document, ensuring the next read repopulates from the source of truth. Writes that affect business correctness — order placement and stock decrement — bypass Redis entirely and go directly through a MongoDB transaction with majority write concern, keeping Redis as a reconstructable acceleration layer rather than a system of record.

---

## Running Tests

> Tests are not yet included in this release. The following commands are reserved for future use.

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# k6 performance benchmark (cold vs warm cache)
# First ensure backend is running on port 8080
cd backend
redis-cli DEL product:<PRODUCT_ID>
k6 run -e BASE_URL=http://localhost:8080 -e PRODUCT_ID=<PRODUCT_ID> src/scripts/benchmark.js
```

MongoDB explain analysis:

```bash
cd backend
npx tsx src/scripts/explain.ts
```

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

## Author

| Field | Detail |
|---|---|
| **Name** | Chimi Gyeltshen |
| **Roll Number** | 02230279 |
| **Course** | DBS302 — Database Systems |
| **Institution** | Royal University of Bhutan, College of Science and Technology |
| **Submission Date** | June 2026 |

---

*Built with MongoDB Atlas, Upstash Redis, Hono, Prisma, Next.js, and TypeScript.*

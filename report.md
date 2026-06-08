# TeachStack — Project Report

## 1. Project Overview

TeachStack is a full-stack multi-role e-commerce platform built as a Database Systems final project. It simulates a real-world online marketplace where three types of users interact with the system: customers who browse and purchase products, sellers who list and manage their inventory, and administrators who oversee the entire platform. The project demonstrates practical application of database design principles, query optimization, caching strategies, and transactional integrity using MongoDB as the primary database.

The application is named after its academic context but functions as a general-purpose shop platform, branded internally as "1MinuteShop."

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js (App Router) | React-based UI framework |
| Styling | Tailwind CSS | Utility-first CSS |
| Animation | Motion (formerly Framer Motion) | UI animations and transitions |
| Backend | Hono | Lightweight TypeScript web framework |
| ORM | Prisma (Prisma Client JS) | Type-safe MongoDB query layer |
| Database | MongoDB | Primary persistent data store |
| Cache / Session | Upstash Redis | In-memory caching, sessions, cart |
| Runtime | Node.js | Backend execution environment |

---

## 3. System Architecture

```
Browser (Next.js frontend — port 3000)
        │
        │ HTTP / REST (Bearer token)
        ▼
Hono API server (port 8080)
        │
        ├──► Prisma ──► MongoDB Atlas (primary data)
        │
        └──► Upstash Redis (cache, sessions, cart, trending)
```

The frontend and backend are fully decoupled. The frontend communicates exclusively through a REST API. Authentication uses short-lived JWT access tokens (15 minutes) and long-lived refresh tokens (7 days), both stored hashed in MongoDB and with active sessions cached in Redis.

---

## 4. Database Design

### 4.1 Data Models (Prisma Schema)

**User**
Stores registered users. The `role` enum (`CUSTOMER`, `SELLER`, `ADMIN`) drives access control across the platform. Passwords are never stored in plaintext — a PBKDF2-SHA512 hash (100,000 iterations) and a random 16-byte salt are stored separately. Users have an embedded array of `Address` objects for delivery locations and a `wishlist` of product IDs.

**AccessToken / RefreshToken**
Token records are stored as SHA-256 hashes of the actual token string. This means even if the database is compromised, raw tokens cannot be extracted. Tokens carry an `expiresAt` timestamp and a nullable `revokedAt` field for explicit invalidation (e.g., on logout).

**Category**
Hierarchical category model using a self-referencing `parentId`. Supports parent and child categories (e.g., "Electronics" → "Laptops").

**Product**
Products belong to a category and a seller. They carry a flexible `attributes` JSON field to accommodate heterogeneous product types (e.g., `{ "ram": "16GB" }` for electronics, `{ "fabric": "Cotton" }` for clothing). An embedded `Variant` array handles SKU-level variations by size, color, and per-variant stock and price. A compound index on `(categoryId, price)` optimises filtered browsing queries. A full-text index across `name`, `description`, and `tags` enables search.

**Order / OrderItem**
Orders are linked to a user and contain a delivery address snapshot (embedded `Address` type — not a foreign key, so address changes after order placement do not affect historical records). An `OrderStatus` enum tracks the order lifecycle: `PLACED → CONFIRMED → SHIPPED → DELIVERED → CANCELLED / RETURNED`. A compound index on `(userId, status)` supports efficient per-user order filtering. `OrderItem` stores the price at time of purchase (denormalised), so subsequent product price changes do not affect historical order totals.

**Review**
User reviews on products with a numeric rating and comment. Indexed on `productId` for fast per-product review lookups.

**Inventory**
Separate inventory collection tracking quantity per product. Decoupled from the `Product` model to allow atomic stock decrements during checkout without touching the full product document.

### 4.2 Redis Data Structures

| Key Pattern | Structure | Purpose |
|---|---|---|
| `session:{userId}` | Hash | Cached user profile (24-hour TTL) |
| `cart:{userId}` | Hash | Cart items `{ productId: quantity }` (7-day TTL) |
| `product:{productId}` | String (JSON) | Cached product document (1-hour TTL + jitter) |
| `trending:products:{date}` | Sorted Set | Daily trending score per product (24-hour TTL) |
| `visits:{productId}` | HyperLogLog | Unique visitor count per product |
| `recentlyViewed:{userId}` | List | Last 10 viewed product IDs (capped with LTRIM) |
| `ratelimit:login:{ip}` | String (counter) | Login rate limit counter (60-second window) |
| `ratelimit:checkout:{userId}` | String (counter) | Checkout rate limit counter (60-second window) |

---

## 5. Backend Implementation

The backend is a Hono application running on port 8080. It registers six route groups under a global CORS and request-logging middleware.

### 5.1 Authentication (`/auth`)

| Endpoint | Method | Description |
|---|---|---|
| `/auth/signup` | POST | Register a new customer account |
| `/auth/login` | POST | Authenticate and issue token pair |
| `/auth/refresh` | POST | Exchange a valid refresh token for a new token pair |
| `/auth/logout` | POST | Revoke all tokens and delete the Redis session |
| `/auth/me` | GET | Return the currently authenticated user |

**Implementation details:**

- Passwords are hashed with `pbkdf2Sync` (Node.js `crypto`) — 100,000 iterations, SHA-512, 64-byte output. A fresh random salt is generated per user.
- Password verification uses `timingSafeEqual` to prevent timing-based attacks.
- JWTs are hand-rolled (no external library): header and payload are base64url-encoded JSON, signed with HMAC-SHA256 using a server secret.
- Token strings are never stored. Only SHA-256 hashes of tokens are persisted in MongoDB (`AccessToken` / `RefreshToken` collections).
- On every authenticated request, the auth service checks the Redis session cache first. If no cache entry exists, it queries MongoDB and repopulates the cache. This means a typical authenticated request hits Redis once, not MongoDB.
- Login is rate-limited to 5 attempts per IP per 60-second window via a Redis counter.

### 5.2 Products (`/products`)

| Endpoint | Method | Description |
|---|---|---|
| `/products` | GET | Paginated product list with optional category filter |
| `/products/trending` | GET | Top 10 trending products (Redis sorted set) |
| `/products/:id` | GET | Single product with caching and view tracking |
| `/products/:id/stats` | GET | Unique visitor count via HyperLogLog |
| `/products/:id` | PATCH | Update a product and invalidate its cache entry |
| `/products/:id/view` | POST | Record a product view in the recently-viewed list |

**Caching strategy:** Single product fetches check Redis first (`X-Cache: HIT` / `MISS` header returned). On a cache miss, the product is fetched from MongoDB and stored in Redis with a base TTL of 3,600 seconds plus a random jitter of up to 300 seconds. The jitter prevents thundering-herd cache expiry when many products are loaded at the same time. On a product update, the cache entry is explicitly deleted to ensure consistency.

**Trending products:** Every product page view increments a per-product score in a Redis sorted set keyed by the current date (`trending:products:YYYY-MM-DD`). The `ZRANGE ... REV WITHSCORES` command retrieves the top 10 products by score. The sorted set expires after 24 hours, so trending resets daily.

**Unique visitors:** Redis HyperLogLog (`PFADD` / `PFCOUNT`) provides approximate unique visitor counts per product without storing individual visitor IDs. Authenticated users are tracked by user ID; unauthenticated users are tracked by IP address.

**Category filtering:** The product list endpoint resolves both the named category and all its child categories before querying, so filtering by a parent category (e.g., "Electronics") returns products in all subcategories.

**Pagination:** The endpoint returns `page`, `limit`, `total`, `totalPages`, and `hasNextPage` fields alongside the product array, enabling cursor-free offset pagination with a configurable page size (default 12, max 50).

### 5.3 Cart (`/cart`)

All cart endpoints require authentication via the `authMiddleware`.

| Endpoint | Method | Description |
|---|---|---|
| `/cart` | GET | Retrieve cart with full product details |
| `/cart/add` | POST | Add an item or increment quantity |
| `/cart/update` | PATCH | Set an item to a specific quantity |
| `/cart/remove` | DELETE | Remove an item from the cart |

The cart is stored entirely in Redis as a hash (`cart:{userId}`), where each field is a product ID and the value is the quantity string. The cart has a 7-day TTL, refreshed on every write. On `GET /cart`, product details are hydrated via a single `prisma.product.findMany` call using the product IDs from the hash, avoiding N+1 queries.

### 5.4 Orders (`/orders`)

| Endpoint | Method | Description |
|---|---|---|
| `/orders` | POST | Place a new order |

Placing an order is the most critical write operation in the system. It is implemented using a **MongoDB multi-document transaction** with `readConcern: majority` and `writeConcern: majority` to guarantee that all or none of the following steps are committed:

1. Validate that all product IDs exist.
2. For each item, attempt an atomic inventory decrement using a conditional update: `{ $inc: { quantity: -n } }` with the filter `{ quantity: { $gte: n } }`. If `modifiedCount !== 1`, the item is out of stock and the transaction is aborted with a 409 status.
3. Insert the `Order` document.
4. Insert all `OrderItem` documents with price snapshotted at time of purchase.

Checkout is rate-limited to 3 attempts per user per 60 seconds to prevent abuse.

### 5.5 Analytics (`/analytics`)

| Endpoint | Method | Description |
|---|---|---|
| `/analytics/revenue` | GET | Monthly revenue breakdown (delivered orders only) |
| `/analytics/top-products` | GET | Top 10 products by total units sold |

Analytics routes use the native MongoDB driver (not Prisma) to run aggregation pipelines directly.

**Revenue pipeline:** Filters orders with status `DELIVERED`, groups by year and month with `$sum` on `total`, and sorts chronologically. Demonstrates `$match → $group → $project → $sort`.

**Top products pipeline:** Groups `OrderItem` documents by `productId`, sums quantity and revenue, sorts descending, limits to 10, and performs a `$lookup` join to the `Product` collection to attach product names. Demonstrates cross-collection aggregation with `$lookup → $unwind → $project`.

### 5.6 Users (`/users`)

| Endpoint | Method | Description |
|---|---|---|
| `/users/me/recently-viewed` | GET | Last 10 products viewed by the authenticated user |

Product IDs are retrieved from the Redis list (`LRANGE`), deduplicated, then hydrated with a single `prisma.product.findMany` call, maintaining the original view order in the response.

### 5.7 Middleware

**Auth Middleware:** Extracts the Bearer token from the `Authorization` header, delegates validation to `authService.getUserFromToken`, and attaches the resolved `PublicUser` to the Hono context for downstream handlers.

**Rate Limiter:** A generic factory function (`createRateLimiter`) that accepts a key resolver, a max count, and a window duration. Implemented with a Redis `INCR` + `EXPIRE` pattern. Two instances are configured: login (5 per 60s per IP) and checkout (3 per 60s per user ID).

**Request Logger:** Logs every incoming request with method, path, and duration.

**CORS:** Configured to accept requests from `localhost:3000` and `localhost:3001` with `Authorization` and `Content-Type` headers allowed.

---

## 6. Frontend Implementation

The frontend is a Next.js application using the App Router. It is structured around three distinct user experiences: the customer storefront, the seller dashboard, and the admin dashboard.

### 6.1 Pages

| Route | Component | Description |
|---|---|---|
| `/` | `app/page.tsx` | Main customer storefront |
| `/login` | `app/login/page.tsx` | Customer login page |
| `/signup` | `app/signup/page.tsx` | Customer signup page |
| `/seller/login` | `app/seller/login/page.tsx` | Seller login page |
| `/seller/dashboard` | `app/seller/dashboard/page.tsx` | Seller product and order management |
| `/admin/login` | `app/admin/login/page.tsx` | Admin login page |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | Admin platform overview |

### 6.2 Customer Storefront (`/`)

The main page is the most feature-rich in the application. It implements the full shopping flow:

**Layout:** A responsive three-region layout: `TopBar` (navigation and cart), a left `Sidebar` (category navigation), and a main content area with a `HeroBanner`, `PromoColumn`, and `ProductGrid`.

**Category filtering:** The `Sidebar` component exposes category links. Selecting a category passes the active category down to `ProductGrid`, which passes it as a query parameter to `GET /products?category=...` to fetch filtered results from the backend.

**Cart management:**
- Cart state is held in React component state.
- If the user is unauthenticated, items are stored locally (guest cart).
- If the user is authenticated, every add/update/remove operation calls the backend API immediately, keeping Redis and the UI in sync.
- On authentication status change, the cart is fetched from the backend and replaces local state.

**Multi-step checkout flow:**

The checkout is a multi-step wizard rendered inside a slide-over cart drawer:

1. **Cart** — Review items, adjust quantities, remove items. Shows a running total.
2. **Address** — Collect delivery address (street, city, zip, country).
3. **Auth** (conditional) — If the user is not authenticated, they can log in or sign up inline without leaving the checkout flow. The tab switcher toggles between login and signup modes.
4. **Placing** — Loading state while the order API call is in flight.
5. **Success** — Confirms the order with the returned order ID. Cart is cleared.

**Token refresh:** If an API call fails (e.g., access token expired), the cart operations attempt a transparent token refresh via `refreshSession()` and retry the operation once before surfacing an error.

**Animation system:** The page uses the Motion library for:
- Entrance choreography (staggered fade-in + slide-up for the bar, hero, categories, and product cards on page load).
- Hover lift and image tilt on product cards.
- Press spring effect on all `[data-press]` elements.
- Gentle floating animation on the hero product image.
- Toast notification entrance animation.
- Cart badge bounce when an item is added.

### 6.3 Auth Provider

`AuthProvider` is a React context that wraps the entire application. It manages:
- `status`: `'loading' | 'authenticated' | 'unauthenticated'`
- `accessToken` and `user` data in memory (never persisted to `localStorage` directly as the raw token).
- `login`, `signup`, `logout` methods that call the backend auth endpoints.
- `refreshSession` — exchanges the stored refresh token for a new access token, used transparently by cart operations.

`ProtectedRoute` is a wrapper component that redirects unauthenticated users to the login page.

### 6.4 Seller Dashboard (`/seller/dashboard`)

The seller dashboard provides full CRUD over a seller's products and orders via a local React state machine (the seller CRUD is not wired to the backend API — it demonstrates the UI pattern with in-memory data).

**Products table:** Displays name, category, price, stock, and status (Active/Draft). Each row has Edit and Delete actions. Editing a row pre-fills the form on the left.

**Orders table:** Displays order ID, customer, product, quantity, total, and status. Supports the same inline edit and delete pattern.

**Stats bar:** Dynamically computes total products, active listings, open orders (any status other than DELIVERED or CANCELLED), and total revenue from current state.

### 6.5 Admin Dashboard (`/admin/dashboard`)

The admin dashboard provides a platform-wide overview with a tabbed interface (Customers / Products / Sellers) and a live search filter.

**Stats bar:** Shows total customers, products, sellers, and inventory units.

**Tabbed tables:** Each tab renders a full data table with relevant columns. The search input filters all visible rows client-side across name, email, and category fields simultaneously.

The admin data is currently seeded with static mock data to demonstrate the UI.

### 6.6 Frontend Library Modules

| File | Purpose |
|---|---|
| `lib/api.ts` | Exports the `API_BASE_URL` constant |
| `lib/products.ts` | `Product` type and product fetch functions |
| `lib/cart.ts` | Cart API wrappers (get, add, update, remove) |
| `lib/orders.ts` | Order placement API wrapper and types |

---

## 7. Key Database Concepts Demonstrated

### 7.1 Indexing
- Compound index `(categoryId, price)` on `Product` for filtered and sorted browsing.
- Compound index `(userId, status)` on `Order` for per-user order history filtering.
- Unique index on `User.email` for fast login lookups.
- Full-text index on `Product (name, description, tags)` for search.
- Index on `Review.productId` for fast per-product review queries.

### 7.2 Transactions
The order placement flow uses MongoDB multi-document ACID transactions to atomically validate stock, decrement inventory, and insert Order and OrderItem documents. A failed stock check causes the entire transaction to abort, leaving no partial state in the database.

### 7.3 Aggregation Pipelines
Two analytics endpoints use native MongoDB aggregation:
- Revenue report: `$match → $group → $project → $sort`
- Top products: `$group → $sort → $limit → $lookup → $unwind → $project`

### 7.4 Caching Strategies
- **Cache-aside (lazy):** Product documents are cached in Redis on first fetch and invalidated on update.
- **TTL jitter:** Cache entries for products use a randomised TTL (base + random offset) to spread expiry across time and prevent cache stampedes.
- **Write-through:** Cart operations always write to Redis as the primary store; the database is not involved for cart reads.
- **Session caching:** User profiles are cached as Redis hashes on login and invalidated on logout, so most authenticated requests avoid a MongoDB query.

### 7.5 Approximate Counting (HyperLogLog)
Redis HyperLogLog (`PFADD` / `PFCOUNT`) is used to count unique product page visitors. This provides an O(1) space-bounded estimate (typically < 1% error) regardless of how many visitors a product has had, without storing individual visitor records.

### 7.6 Sorted Sets for Trending
A Redis sorted set keyed by date accumulates view counts as scores per product ID. The top-N trending products can be retrieved in O(log N) time using `ZRANGE ... REV`. The daily key rotation means trending data resets automatically each day without any scheduled cleanup job.

### 7.7 Denormalisation
Order items store the product price at time of purchase directly in the `OrderItem` document. This is an intentional denormalisation: it ensures historical order totals remain accurate even if product prices change later, reflecting how real-world e-commerce systems handle purchase history.

---

## 8. Security Measures

- Passwords hashed with PBKDF2-SHA512 (100,000 iterations) with a per-user random salt.
- Password comparison uses `timingSafeEqual` to prevent timing side-channel attacks.
- Tokens stored as SHA-256 hashes; raw token strings never persist to the database.
- Rate limiting on login (5 per 60s per IP) and checkout (3 per 60s per user).
- JWT signature verified on every authenticated request using HMAC-SHA256.
- Bearer token required for all cart, order, and user endpoints.
- CORS restricted to known frontend origins.

---

## 9. Project Structure

```
dbs-finals/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Data model definitions
│   │   └── seed.ts             # Database seeding script
│   └── src/
│       ├── index.ts            # Server entry point, route registration
│       ├── controller/
│       │   └── authController.ts
│       ├── middleware/
│       │   ├── authMiddleware.ts
│       │   ├── rateLimiter.ts
│       │   └── logger.ts
│       ├── routes/
│       │   ├── authRoutes.ts
│       │   ├── productRoutes.ts
│       │   ├── cartRoutes.ts
│       │   ├── orderRoutes.ts
│       │   ├── userRoutes.ts
│       │   └── analyticsRoutes.ts
│       ├── services/
│       │   ├── authService.ts
│       │   ├── cartService.ts
│       │   └── orderService.ts
│       ├── repository/
│       │   ├── userRepository.ts
│       │   └── tokenRepository.ts
│       ├── lib/
│       │   ├── prisma.ts       # Prisma client singleton
│       │   ├── redis.ts        # Upstash Redis client
│       │   └── mongo.ts        # Native MongoDB client
│       └── types/
│           ├── auth.ts
│           └── context.ts
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx              # Main storefront
        │   ├── login/page.tsx
        │   ├── signup/page.tsx
        │   ├── seller/
        │   │   ├── login/page.tsx
        │   │   └── dashboard/page.tsx
        │   └── admin/
        │       ├── login/page.tsx
        │       └── dashboard/page.tsx
        ├── components/
        │   ├── AuthProvider.tsx       # Auth context and token management
        │   ├── ProtectedRoute.tsx
        │   ├── TopBar.tsx
        │   ├── Sidebar.tsx
        │   ├── HeroBanner.tsx
        │   ├── PromoColumn.tsx
        │   ├── ProductGrid.tsx
        │   ├── SellerDashboard.tsx
        │   ├── AdminDashboard.tsx
        │   ├── AuthCard.tsx
        │   ├── Toast.tsx
        │   ├── Footer.tsx
        │   ├── AppProviders.tsx
        │   └── icons.tsx
        └── lib/
            ├── api.ts
            ├── products.ts
            ├── cart.ts
            └── orders.ts
```

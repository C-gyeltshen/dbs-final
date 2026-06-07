# Non-Functional Requirements Report

Project: 1MinuteShop  
Stack: Hono, Next.js, TypeScript, Prisma ORM, MongoDB Atlas, Upstash Redis

## NFR1 — Performance Analysis

### Benchmark Plan

The product detail endpoint uses Redis cache-aside with the key `product:{id}`. Performance should be measured twice: first with a cold cache, then with a warm cache.

Cold cache benchmark:

```bash
redis-cli DEL product:<PRODUCT_ID>
cd backend
k6 run -e BASE_URL=http://localhost:8080 -e PRODUCT_ID=<PRODUCT_ID> src/scripts/benchmark.js
```

Warm cache benchmark:

```bash
curl http://localhost:8080/products/<PRODUCT_ID>
cd backend
k6 run -e BASE_URL=http://localhost:8080 -e PRODUCT_ID=<PRODUCT_ID> src/scripts/benchmark.js
```

The benchmark script is located at:

```text
backend/src/scripts/benchmark.js
```

### Benchmark Result Template

| Endpoint | Cold Response Time p95 | Warm Response Time p95 | Cache Hit Ratio | Notes |
|---|---:|---:|---:|---|
| `GET /products/:id` | `<fill>` | `<fill>` | `<fill>` | Redis cache-aside with `X-Cache` header |

### MongoDB Explain

Use the explain script:

```bash
cd backend
npx tsx src/scripts/explain.ts
```

Optional environment variables:

```bash
EXPLAIN_CATEGORY_ID=<categoryId> EXPLAIN_USER_ID=<userId> EXPLAIN_PRODUCT_ID=<productId> npx tsx src/scripts/explain.ts
```

In `executionStats`, compare `nReturned` with `totalDocsExamined`. A good indexed query should examine close to the number of documents returned. If `totalDocsExamined` is much larger than `nReturned`, the query may need a better index or query shape.

## NFR2 — Sharding Plan

| Collection | Recommended Shard Key | Strategy | Justification | Hotspot Risk |
|---|---|---|---|---|
| `Product` | `{ categoryId: 1, _id: 1 }` | Ranged compound | Product listing commonly filters by category, and `_id` improves cardinality inside each category. | A category-only shard key could create hot chunks for popular categories. Adding `_id` reduces this risk. |
| `Order` | `{ userId: "hashed" }` or `{ userId: 1, createdAt: 1 }` | Hashed for distribution; ranged compound for user history | Orders are frequently queried by user. Hashed `userId` gives strong write distribution. Ranged `{ userId, createdAt }` supports user order-history locality. | Pure `createdAt` would hotspot recent writes. Pure `userId` ranged could hotspot very active users. |
| `User` | `{ email: "hashed" }` | Hashed | Login looks up by email. Email is unique and high-cardinality, making it a strong shard key. | Hashed email avoids alphabetical/ranged hotspots. |

Ranged sharding keeps nearby shard key values together and is useful for range queries. Hashed sharding distributes writes more evenly but does not preserve range locality. For 1MinuteShop, products benefit from ranged category filtering, while users benefit from hashed email distribution. Orders can use hashed `userId` for write scalability or compound ranged `{ userId, createdAt }` if order-history locality is more important.

## NFR3 — High Availability Configuration

MongoDB Atlas provides a managed replica set. A typical Atlas replica set has one primary and two secondary nodes. Writes go to the primary, secondaries replicate changes through the oplog, and Atlas automatically elects a new primary if the current primary fails.

Upstash Redis provides managed high availability. In managed Redis, replication, failover, and node health are handled by the provider. In a self-hosted Redis deployment, this requirement would normally require one primary, two replicas, and three Sentinel processes to monitor the primary and coordinate failover.

### Screenshot Checklist

MongoDB Atlas:

- Cluster overview showing 3 nodes or replica set topology.
- Cluster provider/region page.
- Metrics page showing primary/secondary nodes.
- Network access page showing configured allowed IPs.
- Security page or connection modal showing TLS/SRV connection string.

Upstash:

- Redis database overview page.
- Endpoint/REST URL page.
- Region/provider/status section.
- Persistence/durability or backup page if available.
- Replication/high availability section if exposed by your plan.

Browser/API:

- `GET /products/:id` response with `X-Cache: MISS`.
- Second `GET /products/:id` response with `X-Cache: HIT`.
- `POST /auth/login` rate-limit response after exceeding attempts.
- `POST /orders` out-of-stock transaction failure response.

## NFR4 — Consistency Model and CAP Theorem Analysis

CAP theorem states that a distributed system must trade off consistency, availability, and partition tolerance during network partitions. MongoDB replica sets are generally CP-oriented with tunable consistency: the application can choose stronger read/write guarantees when needed. For order placement, 1MinuteShop uses `readConcern: "majority"` and `writeConcern: { w: "majority" }` so stock decrements, order creation, and order-item creation are acknowledged by a majority before success is returned.

Product listing uses default read concern because minor staleness is acceptable for catalog browsing. Redis caching also accepts eventual consistency for reads: product cache may be stale until invalidated or expired. Writes that affect business correctness, such as order placement and inventory decrement, go through MongoDB transactions rather than Redis.

## NFR5 — Durability Configuration

MongoDB Atlas durability is provided by persistent storage, journaling, and replica-set replication. For critical order placement, majority write concern means the write is acknowledged only after a majority of voting replica set members accept it.

Upstash documents durable storage as always enabled, storing data in memory and cloud block storage so it can survive restarts or failures. For this project, Redis stores reconstructable or short-lived data: product cache entries, carts, sessions, rate-limit counters, trending scores, and HyperLogLog visit estimates. If Redis loses recent data, the source of truth remains MongoDB for users, products, orders, and inventory.

RDB-style snapshot persistence is acceptable for Redis use cases in 1MinuteShop because Redis is not the system of record for orders or payments. AOF would be more appropriate for audit logs, financial ledgers, or any data where every Redis write must be replayable after failure.

## NFR6 — Security Implementation

Implemented security controls:

- PBKDF2 password hashing with SHA-512.
- Per-user password salts.
- Timing-safe password hash comparison.
- JWT signing with HMAC SHA-256.
- Token hashes stored in MongoDB instead of raw tokens.
- Refresh token rotation.
- Role-aware auth model: `CUSTOMER`, `SELLER`, `ADMIN`.
- Role-based frontend route protection.
- Redis-backed login rate limiting.
- Redis-backed checkout rate limiting.
- Bearer-token auth middleware for protected API routes.

Recommended but not fully implemented:

- Store tokens in HTTP-only secure cookies instead of `localStorage`.
- Add backend route-level role authorization middleware.
- Configure strict MongoDB Atlas IP access lists.
- Use VPC/network peering for production.
- Rotate JWT secrets and Redis/Mongo credentials.
- Add CSRF protection if cookie auth is adopted.

MongoDB Atlas TLS verification:

1. Open Atlas.
2. Select the cluster.
3. Click `Connect`.
4. Confirm the SRV connection string uses `mongodb+srv://`.
5. In Atlas documentation/security settings, note that Atlas enables TLS for cluster traffic by default.

Upstash TLS verification:

1. Open Upstash Console.
2. Select the Redis database.
3. Confirm the REST URL starts with `https://`.
4. Confirm backend uses `UPSTASH_REDIS_REST_URL` and token-based auth.

## NFR7 — Observability and Monitoring

### Hono Request Logging

The backend includes:

```text
backend/src/middleware/logger.ts
```

It logs method, path, status, and response time:

```text
GET /products/abc123 200 12.41ms
```

The middleware is mounted globally in `backend/src/index.ts`.

### MongoDB Slow Query Monitoring

In Atlas:

1. Open the cluster.
2. Go to `Performance Advisor`.
3. Review slow query shapes and index suggestions.
4. Use Query Profiler or Performance Advisor to inspect operations above the selected threshold.
5. For this report, use a 100 ms threshold if your Atlas tier exposes configurable slow operation thresholds.

Explain output interpretation:

- `nReturned`: documents returned to the application.
- `totalDocsExamined`: documents MongoDB scanned.
- `totalKeysExamined`: index keys scanned.
- Good index usage generally means `totalDocsExamined` is close to `nReturned`.
- A collection scan or high `totalDocsExamined` indicates an index or query-shape issue.

### Redis INFO From Upstash

Use the REST API:

```bash
curl -X GET "$UPSTASH_REDIS_REST_URL/info" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

Useful fields include memory usage, keyspace hits/misses, connected clients, command stats, and evicted keys.

## NFR8 — Data Integrity and Transaction Design

Order placement uses a native MongoDB transaction with `session.withTransaction()`. In one transaction, the backend creates the order document, creates order item documents, and decrements inventory for every item. If any item is out of stock, the service throws an error and MongoDB rolls back the whole transaction.

This means partial failure does not create inconsistent data. The order is not created, order items are not created, and inventory is not decremented. Majority write concern increases durability by requiring replica-set majority acknowledgement before the transaction is considered successful.

### Integrity Test Scenario

1. Create a product and inventory record with quantity `1`.
2. Send:

```json
{
  "items": [
    {
      "productId": "<productId>",
      "quantity": 2
    }
  ]
}
```

3. Expected response:

```json
{
  "error": "Product <productId> is out of stock."
}
```

4. Verify:

```js
db.Order.find({ userId: ObjectId("<userId>") })
db.OrderItem.find({ productId: ObjectId("<productId>") })
db.Inventory.findOne({ productId: ObjectId("<productId>") })
```

The order and order items should not exist, and inventory quantity should remain unchanged.

## Sources

- MongoDB Atlas Performance Advisor: https://www.mongodb.com/docs/atlas/performance-advisor/
- MongoDB Atlas TLS: https://www.mongodb.com/docs/atlas/architecture/current/data-encryption/
- MongoDB oplog replication: https://www.mongodb.com/docs/manual/core/replica-set-oplog/
- Upstash durable storage: https://upstash.com/docs/redis/features/durability
- Redis eviction policies: https://redis.io/docs/latest/develop/reference/eviction/

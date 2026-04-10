---
title: Use Connection Pooling
impact: CRITICAL
impactDescription: Eliminates per-request connection overhead, prevents connection exhaustion under load
tags: connections, pooling, performance, valkey
---

## Use Connection Pooling

Creating a new Valkey connection per request adds TCP + TLS handshake latency to every operation and risks exhausting the 65,000 connection limit per node. Reuse connections through a pool.

**Incorrect (new connection per request):**

```python
import valkey

def get_user(user_id):
    # New connection every call — TCP + TLS handshake each time
    r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True)
    data = r.get(f'user:{user_id}')
    r.close()
    return data
```

```javascript
import Redis from 'ioredis';

async function getUser(userId) {
  // New connection every call
  const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });
  const data = await redis.get(`user:${userId}`);
  redis.disconnect();
  return data;
}
```

**Correct (shared connection pool):**

```python
import valkey

# Create pool once at module level — reused across all requests
pool = valkey.ConnectionPool(
    host='mycluster.cache.amazonaws.com',
    port=6379,
    ssl=True,
    max_connections=50,
    decode_responses=True,
)
r = valkey.Valkey(connection_pool=pool)

def get_user(user_id):
    return r.get(f'user:{user_id}')
```

```javascript
import Redis from 'ioredis';

// Create once at module level — ioredis manages connection internally
const redis = new Redis({
  host: 'mycluster.cache.amazonaws.com',
  tls: {},
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Good for Lambda — connects on first command
});

async function getUser(userId) {
  return redis.get(`user:${userId}`);
}
```

For Lambda or short-lived processes, use `lazyConnect: true` (ioredis) to avoid connecting on import. The connection is established on the first command and reused across warm invocations.

Reference: [Best practices: Valkey clients and Amazon ElastiCache](https://aws.amazon.com/blogs/database/best-practices-valkey-redis-oss-clients-and-amazon-elasticache/)

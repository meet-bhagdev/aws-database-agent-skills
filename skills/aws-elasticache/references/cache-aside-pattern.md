---
title: Implement Cache-Aside Pattern Correctly
impact: HIGH
impactDescription: Prevents stale data, cache misses causing cascading database load, and silent failures
tags: caching, cache-aside, lazy-loading, ttl, valkey
---

## Implement Cache-Aside Pattern Correctly

Cache-aside (lazy loading) is the most common caching pattern: read from cache first, on miss read from database and populate cache. The most common mistakes are missing TTLs, no error handling, and not treating cache as optional.

**Incorrect (no TTL, no error handling, cache failure crashes the app):**

```python
import valkey
import json

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True,
                  decode_responses=True)

def get_product(product_id):
    cached = r.get(f'product:{product_id}')  # Crashes if cache is down
    if cached:
        return json.loads(cached)

    product = db.query('SELECT * FROM products WHERE id = %s', product_id)
    r.set(f'product:{product_id}', json.dumps(product))  # No TTL — lives forever
    return product
```

**Correct (TTL, error handling, cache is optional):**

```python
import valkey
import json
import logging

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True,
                  decode_responses=True, socket_timeout=1)

def get_product(product_id):
    # Cache is optional — never let cache failure break the app
    try:
        cached = r.get(f'product:{product_id}')
        if cached:
            return json.loads(cached)
    except valkey.ValkeyError as e:
        logging.warning(f'Cache read failed: {e}')

    product = db.query('SELECT * FROM products WHERE id = %s', product_id)

    try:
        r.set(f'product:{product_id}', json.dumps(product), ex=300)  # 5 min TTL
    except valkey.ValkeyError as e:
        logging.warning(f'Cache write failed: {e}')

    return product
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'mycluster.cache.amazonaws.com', tls: {},
  commandTimeout: 1000,
});

async function getProduct(productId) {
  try {
    const cached = await redis.get(`product:${productId}`);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('Cache read failed:', err.message);
  }

  const product = await db.query('SELECT * FROM products WHERE id = $1', [productId]);

  try {
    await redis.set(`product:${productId}`, JSON.stringify(product), 'EX', 300);
  } catch (err) {
    console.warn('Cache write failed:', err.message);
  }

  return product;
}
```

Key rules:
- **Always set a TTL** — even if you also invalidate on writes. TTL is your safety net against stale data.
- **Cache is optional** — wrap all cache operations in try/catch. The database is the source of truth.
- **Short command timeout** — fail fast (500ms-1s) so cache misses don't add latency.

Reference: [Caching design patterns](https://docs.aws.amazon.com/whitepapers/latest/scale-performance-elasticache/caching-design-patterns.html)

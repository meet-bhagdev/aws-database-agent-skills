---
title: Implement Cache Invalidation Correctly
impact: HIGH
impactDescription: Prevents serving stale data after writes, which causes data consistency bugs
tags: caching, invalidation, ttl, consistency, valkey
---

## Implement Cache Invalidation Correctly

The two hardest problems in computer science: cache invalidation, naming things, and off-by-one errors. Without a clear invalidation strategy, your cache serves stale data after writes.

**Incorrect (no invalidation — cache serves stale data after updates):**

```python
def update_product(product_id, new_price):
    db.execute('UPDATE products SET price = %s WHERE id = %s', new_price, product_id)
    # Cache still has the old price — stale until TTL expires
```

**Correct (delete on write + TTL as safety net):**

```python
import valkey

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True)

def update_product(product_id, new_price):
    db.execute('UPDATE products SET price = %s WHERE id = %s', new_price, product_id)
    # Delete cached entry — next read will fetch fresh data
    r.delete(f'product:{product_id}')
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });

async function updateProduct(productId, newPrice) {
  await db.query('UPDATE products SET price = $1 WHERE id = $2', [newPrice, productId]);
  await redis.del(`product:${productId}`);
}
```

Invalidation strategies ranked by consistency:
1. **Delete on write** (shown above) — simplest, most common. Next read repopulates from DB.
2. **Write-through** — update cache and DB together. More complex but avoids cache miss after write.
3. **TTL-only** — acceptable when eventual consistency is fine (e.g., product catalog, not inventory counts).
4. **Event-driven** — use DynamoDB Streams, database CDC, or SNS to invalidate across services.

Prefer **delete** over **update** when invalidating. Deleting is idempotent and avoids race conditions where two concurrent writes leave the cache with the wrong value.

Reference: [Caching design patterns](https://docs.aws.amazon.com/whitepapers/latest/scale-performance-elasticache/caching-design-patterns.html)

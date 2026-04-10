---
title: Prevent Thundering Herd (Cache Stampede)
impact: HIGH
impactDescription: Prevents database overload when a popular cache key expires and hundreds of requests hit the DB simultaneously
tags: caching, thundering-herd, stampede, locking, valkey
---

## Prevent Thundering Herd (Cache Stampede)

When a popular cache key expires, all concurrent requests see a cache miss and simultaneously query the database. This "thundering herd" can overwhelm the database. The solution is to ensure only one request repopulates the cache while others wait or get a stale value.

**Incorrect (naive cache-aside — all requests hit DB on miss):**

```python
def get_popular_item(item_id):
    cached = r.get(f'item:{item_id}')
    if cached:
        return json.loads(cached)
    # 100 concurrent requests all reach here at the same time
    data = db.query('SELECT * FROM items WHERE id = %s', item_id)
    r.set(f'item:{item_id}', json.dumps(data), ex=60)
    return data
```

**Correct (lock-based cache repopulation):**

```python
import valkey
import json
import time

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True,
                  decode_responses=True, socket_timeout=1)

def get_popular_item(item_id):
    cached = r.get(f'item:{item_id}')
    if cached:
        return json.loads(cached)

    lock_key = f'lock:item:{item_id}'
    # SET NX with short TTL — only one request wins the lock
    if r.set(lock_key, '1', nx=True, ex=10):
        try:
            data = db.query('SELECT * FROM items WHERE id = %s', item_id)
            r.set(f'item:{item_id}', json.dumps(data), ex=60)
            return data
        finally:
            r.delete(lock_key)
    else:
        # Another request is repopulating — wait briefly and retry from cache
        time.sleep(0.1)
        cached = r.get(f'item:{item_id}')
        if cached:
            return json.loads(cached)
        # Fallback to DB if lock holder failed
        return db.query('SELECT * FROM items WHERE id = %s', item_id)
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });

async function getPopularItem(itemId) {
  const cached = await redis.get(`item:${itemId}`);
  if (cached) return JSON.parse(cached);

  const lockKey = `lock:item:${itemId}`;
  const acquired = await redis.set(lockKey, '1', 'NX', 'EX', 10);

  if (acquired) {
    try {
      const data = await db.query('SELECT * FROM items WHERE id = $1', [itemId]);
      await redis.set(`item:${itemId}`, JSON.stringify(data), 'EX', 60);
      return data;
    } finally {
      await redis.del(lockKey);
    }
  }

  // Wait for lock holder to populate cache
  await new Promise(r => setTimeout(r, 100));
  const retried = await redis.get(`item:${itemId}`);
  return retried ? JSON.parse(retried) : db.query('SELECT * FROM items WHERE id = $1', [itemId]);
}
```

Alternative approaches:
- **Probabilistic early expiration** — refresh the cache before TTL expires based on a random probability. Avoids the stampede entirely.
- **Background refresh** — a separate process refreshes popular keys before they expire.

Reference: [Caching design patterns](https://docs.aws.amazon.com/whitepapers/latest/scale-performance-elasticache/caching-design-patterns.html)

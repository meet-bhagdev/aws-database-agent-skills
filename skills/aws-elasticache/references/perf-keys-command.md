---
title: Never Use KEYS in Production
impact: CRITICAL
impactDescription: KEYS blocks the single-threaded engine for seconds on large keyspaces, causing timeouts for all clients
tags: performance, keys, scan, blocking-commands, valkey
---

## Never Use KEYS in Production

`KEYS pattern` scans the entire keyspace in a single blocking operation. On a node with millions of keys, this takes seconds — during which Valkey cannot serve any other client. This causes cascading timeouts across your application.

**Incorrect (KEYS blocks everything):**

```python
import valkey

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True)

# Blocks the entire server while scanning millions of keys
keys = r.keys('session:*')
for key in keys:
    r.delete(key)
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });

// Blocks the entire server
const keys = await redis.keys('session:*');
await Promise.all(keys.map(k => redis.del(k)));
```

**Correct (SCAN iterates without blocking):**

```python
import valkey

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True)

# SCAN returns a cursor + batch of keys, non-blocking
cursor = 0
while True:
    cursor, keys = r.scan(cursor, match='session:*', count=100)
    if keys:
        r.delete(*keys)
    if cursor == 0:
        break
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });

// scanStream handles cursor iteration automatically
const stream = redis.scanStream({ match: 'session:*', count: 100 });
stream.on('data', (keys) => {
  if (keys.length) {
    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.del(key));
    pipeline.exec();
  }
});
await new Promise(resolve => stream.on('end', resolve));
```

Also avoid `SMEMBERS`, `HGETALL`, and `LRANGE 0 -1` on large collections. Use `SSCAN`, `HSCAN`, and paginated `LRANGE` instead.

Reference: [ElastiCache overall best practices](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WorkingWithRedis.html)

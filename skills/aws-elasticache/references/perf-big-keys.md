---
title: Avoid Big Keys
impact: CRITICAL
impactDescription: Big keys cause uneven memory distribution, slow operations, and network saturation
tags: performance, big-keys, memory, valkey
---

## Avoid Big Keys

A "big key" is any key whose value exceeds ~1 MB or contains more than 10,000 elements in a collection. Big keys cause:
- **Slow operations**: Serializing/deserializing large values blocks the event loop
- **Uneven memory**: In cluster mode, one shard gets disproportionate memory pressure
- **Network saturation**: Fetching a 10 MB value saturates the network link
- **Slow deletes**: `DEL` on a big key blocks the server (use `UNLINK` for async deletion)

**Incorrect (storing a huge list in one key):**

```python
import valkey
import json

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True)

# Storing 100K items in a single list — big key
for i in range(100_000):
    r.rpush('events:all', json.dumps({'id': i, 'data': 'x' * 100}))

# Fetching all 100K items blocks the server
all_events = r.lrange('events:all', 0, -1)
```

**Correct (chunk into smaller keys):**

```python
import valkey
import json

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True)

CHUNK_SIZE = 1000

# Split into chunks: events:chunk:0, events:chunk:1, etc.
for i in range(100_000):
    chunk_id = i // CHUNK_SIZE
    r.rpush(f'events:chunk:{chunk_id}', json.dumps({'id': i, 'data': 'x' * 100}))

# Fetch only the chunk you need
page_events = r.lrange('events:chunk:5', 0, -1)
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });

const CHUNK_SIZE = 1000;

// Store in chunks
for (let i = 0; i < 100000; i++) {
  const chunkId = Math.floor(i / CHUNK_SIZE);
  await redis.rpush(`events:chunk:${chunkId}`, JSON.stringify({ id: i }));
}

// Fetch one chunk
const pageEvents = await redis.lrange('events:chunk:5', 0, -1);
```

For deleting big keys, use `UNLINK` instead of `DEL` — it removes the key from the keyspace immediately but frees memory asynchronously in a background thread.

To find existing big keys: `valkey-cli --bigkeys` or use CloudWatch `BytesUsedForCache` per node to detect imbalance.

Reference: [ElastiCache best practices](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/BestPractices.html)

---
title: Use Hash Tags for Multi-Key Operations in Cluster Mode
impact: MEDIUM
impactDescription: Enables transactions, Lua scripts, and MGET/MSET across related keys in cluster mode
tags: cluster-mode, hash-tags, multi-key, transactions, valkey
---

## Use Hash Tags for Multi-Key Operations in Cluster Mode

In cluster mode, each key is assigned to one of 16,384 hash slots based on the key name. Multi-key operations (`MGET`, `MSET`, `MULTI`/`EXEC`, Lua scripts) require all keys to be on the same slot. Hash tags `{...}` force Valkey to hash only the portion inside the braces, co-locating related keys.

**Incorrect (multi-key operation across different slots):**

```python
from valkey.cluster import ValkeyCluster

rc = ValkeyCluster(host='mycluster.cache.amazonaws.com', port=6379, ssl=True)

# These keys hash to different slots — MGET fails with CROSSSLOT error
rc.mget('user:123:name', 'user:123:email', 'user:123:prefs')
```

```javascript
import Redis from 'ioredis';

const cluster = new Redis.Cluster([{ host: 'mycluster.cache.amazonaws.com' }],
  { redisOptions: { tls: {} } });

// CROSSSLOT error — keys are on different slots
await cluster.mget('user:123:name', 'user:123:email', 'user:123:prefs');
```

**Correct (hash tags co-locate keys on the same slot):**

```python
from valkey.cluster import ValkeyCluster

rc = ValkeyCluster(host='mycluster.cache.amazonaws.com', port=6379, ssl=True,
                   decode_responses=True)

# {user:123} is the hash tag — all three keys hash to the same slot
rc.mget('{user:123}:name', '{user:123}:email', '{user:123}:prefs')

# Transactions also work with hash tags
pipe = rc.pipeline()
pipe.set('{order:456}:status', 'confirmed')
pipe.set('{order:456}:updated_at', '2026-01-01')
pipe.execute()
```

```javascript
import Redis from 'ioredis';

const cluster = new Redis.Cluster([{ host: 'mycluster.cache.amazonaws.com' }],
  { redisOptions: { tls: {} } });

// Hash tags ensure same slot
await cluster.mget('{user:123}:name', '{user:123}:email', '{user:123}:prefs');

// Transactions work with hash tags
const pipeline = cluster.pipeline();
pipeline.set('{order:456}:status', 'confirmed');
pipeline.set('{order:456}:updated_at', '2026-01-01');
await pipeline.exec();
```

Guidelines:
- Only the first `{...}` in a key name is used for hashing. `{user:123}:name` and `{user:123}:email` hash the same.
- Don't use the same hash tag for unrelated data — it creates a hot slot.
- If you don't need multi-key operations, don't use hash tags — let keys distribute evenly.

Reference: [Valkey cluster specification — hash tags](https://valkey.io/topics/cluster-spec/)

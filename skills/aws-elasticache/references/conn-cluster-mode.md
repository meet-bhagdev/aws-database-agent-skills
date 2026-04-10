---
title: Use Cluster-Aware Clients for Cluster Mode
impact: CRITICAL
impactDescription: Prevents MOVED/ASK errors and ensures requests route to the correct shard
tags: cluster-mode, connections, hash-slots, valkey
---

## Use Cluster-Aware Clients for Cluster Mode

When cluster mode is enabled, data is distributed across shards via 16,384 hash slots. A non-cluster-aware client sends all commands to a single node, which returns `MOVED` redirect errors for keys on other shards. This adds a round-trip per redirect and breaks multi-key operations entirely.

**Incorrect (standalone client against a cluster):**

```python
import valkey

# Standalone client — doesn't understand cluster topology
r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True)
r.get('user:123')  # May get MOVED error if key is on a different shard
```

```javascript
import Redis from 'ioredis';

// Standalone client — doesn't follow MOVED redirects automatically
const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });
await redis.get('user:123'); // MOVED error if key is on another shard
```

**Correct (cluster-aware client):**

```python
from valkey.cluster import ValkeyCluster

rc = ValkeyCluster(
    host='mycluster.cache.amazonaws.com',
    port=6379,
    ssl=True,
    decode_responses=True,
    skip_full_coverage_check=True,
)
rc.get('user:123')  # Automatically routes to the correct shard
```

```javascript
import Redis from 'ioredis';

const cluster = new Redis.Cluster(
  [{ host: 'mycluster.cache.amazonaws.com', port: 6379 }],
  {
    dnsLookup: (address, callback) => callback(null, address),
    redisOptions: { tls: {} },
    slotsRefreshTimeout: 2000,
  }
);
await cluster.get('user:123'); // Routes to correct shard automatically
```

Cluster-aware clients maintain a slot map and route commands directly to the node owning each key's hash slot, avoiding redirects entirely.

Reference: [ElastiCache cluster mode](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Replication.Redis-RedisCluster.html)

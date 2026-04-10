---
title: Use Pipelining for Batch Operations
impact: HIGH
impactDescription: 5-10x throughput improvement by eliminating per-command round-trip latency
tags: performance, pipelining, throughput, valkey
---

## Use Pipelining for Batch Operations

Each Valkey command requires a network round-trip. If your application sends 100 commands sequentially, it waits for 100 round-trips. Pipelining sends multiple commands in a single network write and reads all responses at once, eliminating per-command latency.

**Incorrect (sequential commands — 100 round-trips):**

```python
import valkey

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True,
                  decode_responses=True)

# 100 sequential round-trips
results = {}
for user_id in user_ids:  # 100 user IDs
    results[user_id] = r.get(f'user:{user_id}')
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });

// 100 sequential awaits = 100 round-trips
const results = {};
for (const userId of userIds) {
  results[userId] = await redis.get(`user:${userId}`);
}
```

**Correct (pipeline — 1 round-trip):**

```python
import valkey

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True,
                  decode_responses=True)

# All commands sent in one batch, one round-trip
pipe = r.pipeline()
for user_id in user_ids:
    pipe.get(f'user:{user_id}')
responses = pipe.execute()

results = dict(zip(user_ids, responses))
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });

// Pipeline sends all commands at once
const pipeline = redis.pipeline();
userIds.forEach(id => pipeline.get(`user:${id}`));
const responses = await pipeline.exec();

const results = Object.fromEntries(
  userIds.map((id, i) => [id, responses[i][1]])
);
```

Guidelines:
- Pipeline 50-1000 commands at a time. Very large pipelines consume server memory.
- In cluster mode, ioredis automatically splits pipelines by slot. `valkey-py` `ClusterPipeline` does the same.
- Pipelines are not atomic. If you need atomicity, use `MULTI`/`EXEC` transactions or Lua scripts.

Reference: [Valkey pipelining](https://valkey.io/topics/pipelining/)

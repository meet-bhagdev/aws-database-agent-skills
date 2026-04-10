---
title: Choose the Right Data Structure
impact: HIGH
impactDescription: 50-90% memory savings and faster access by using native data structures instead of serialized strings
tags: data-structures, hashes, sorted-sets, memory, valkey
---

## Choose the Right Data Structure

Storing everything as JSON strings wastes memory and forces full deserialization for every read. Valkey's native data structures let you read/write individual fields without deserializing the entire object.

**Incorrect (everything as JSON strings):**

```python
import valkey
import json

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True,
                  decode_responses=True)

# Storing user as JSON string — must deserialize entire object to read one field
user = {'name': 'Alice', 'email': 'alice@example.com', 'score': 100, 'role': 'admin'}
r.set('user:123', json.dumps(user))

# To update score, must read, deserialize, modify, serialize, write
data = json.loads(r.get('user:123'))
data['score'] += 10
r.set('user:123', json.dumps(data))
```

**Correct (use hashes for objects, sorted sets for rankings):**

```python
import valkey

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True,
                  decode_responses=True)

# Hash — read/write individual fields without deserializing
r.hset('user:123', mapping={'name': 'Alice', 'email': 'alice@example.com',
                            'score': '100', 'role': 'admin'})

# Update one field atomically — no read-modify-write cycle
r.hincrby('user:123', 'score', 10)

# Read just the field you need
score = r.hget('user:123', 'score')
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });

// Hash for objects
await redis.hset('user:123', { name: 'Alice', email: 'alice@example.com',
                                score: '100', role: 'admin' });
await redis.hincrby('user:123', 'score', 10);
const score = await redis.hget('user:123', 'score');

// Sorted set for leaderboards
await redis.zadd('leaderboard', 110, 'user:123');
const topTen = await redis.zrevrange('leaderboard', 0, 9, 'WITHSCORES');
```

Quick reference for data structure selection:
- **Objects with fields** → Hash (`HSET`, `HGET`, `HINCRBY`)
- **Rankings / leaderboards** → Sorted Set (`ZADD`, `ZREVRANGE`)
- **Unique membership** → Set (`SADD`, `SISMEMBER`)
- **Queues** → List (`LPUSH`, `BRPOP`) or Stream (`XADD`, `XREAD`)
- **Counters** → String with `INCR`/`INCRBY`
- **Cardinality estimation** → HyperLogLog (`PFADD`, `PFCOUNT`)
- **Simple values / serialized blobs** → String (`SET`, `GET`)

Reference: [Valkey data types](https://valkey.io/topics/data-types-intro/)

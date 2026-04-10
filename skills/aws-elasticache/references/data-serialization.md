---
title: Minimize Serialization Overhead
impact: MEDIUM
impactDescription: 2-5x reduction in payload size and CPU usage with efficient serialization
tags: serialization, json, msgpack, performance, valkey
---

## Minimize Serialization Overhead

JSON is human-readable but verbose. For high-throughput caching, the serialization format directly impacts network bandwidth, memory usage, and CPU time. Choose the format based on your access pattern.

**Incorrect (JSON for everything, including high-throughput paths):**

```python
import valkey
import json

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True)

# Large object serialized as JSON on every write/read
data = {'items': [{'id': i, 'value': f'data_{i}'} for i in range(1000)]}
r.set('catalog:items', json.dumps(data), ex=300)

# Full deserialization on every read
catalog = json.loads(r.get('catalog:items'))
```

**Correct (use Valkey hashes for partial access, or compact formats for full objects):**

```python
import valkey
import json

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True,
                  decode_responses=True)

# Option 1: Use hashes when you need partial field access
r.hset('product:456', mapping={'name': 'Widget', 'price': '29.99', 'stock': '150'})
price = r.hget('product:456', 'price')  # No deserialization needed

# Option 2: For full-object caching, JSON is fine — keep objects small
small_obj = {'id': 456, 'name': 'Widget', 'price': 29.99}
r.set('product:456:summary', json.dumps(small_obj), ex=300)
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });

// Use hashes for partial access
await redis.hset('product:456', { name: 'Widget', price: '29.99', stock: '150' });
const price = await redis.hget('product:456', 'price');

// JSON is fine for small, full-object reads
await redis.set('product:456:summary', JSON.stringify({ id: 456, name: 'Widget' }), 'EX', 300);
```

Guidelines:
- **Partial field access** → Use Valkey hashes. No serialization needed.
- **Small objects (< 1 KB) read in full** → JSON is fine. Readability matters for debugging.
- **Large objects or high throughput** → Consider MessagePack or Protocol Buffers for 30-50% size reduction.
- **Never store data you don't need** — cache only the fields the consumer requires.

Reference: [Performance at Scale with Amazon ElastiCache](https://docs.aws.amazon.com/whitepapers/latest/scale-performance-elasticache/caching-design-patterns.html)

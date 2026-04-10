---
title: Configure Connect and Command Timeouts
impact: HIGH
impactDescription: Prevents application threads from hanging indefinitely on unresponsive cache nodes
tags: connections, timeouts, reliability, valkey
---

## Configure Connect and Command Timeouts

Without timeouts, a network partition or unresponsive node causes your application threads to hang indefinitely waiting for a response. Always set both a connect timeout (how long to wait for TCP connection) and a command timeout (how long to wait for a response).

**Incorrect (no timeouts — default is often infinite or very long):**

```python
import valkey

r = valkey.Valkey(host='mycluster.cache.amazonaws.com', port=6379, ssl=True)
# If the node is unreachable, this hangs for minutes
r.get('user:123')
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({ host: 'mycluster.cache.amazonaws.com', tls: {} });
// Default connectTimeout is 10s, commandTimeout is none — commands can hang
await redis.get('user:123');
```

**Correct (explicit timeouts):**

```python
import valkey

r = valkey.Valkey(
    host='mycluster.cache.amazonaws.com',
    port=6379,
    ssl=True,
    socket_connect_timeout=2,   # 2 seconds to establish connection
    socket_timeout=1,           # 1 second per command
    retry_on_timeout=True,
    decode_responses=True,
)
```

```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'mycluster.cache.amazonaws.com',
  tls: {},
  connectTimeout: 2000,       // 2 seconds to establish connection
  commandTimeout: 1000,       // 1 second per command
  maxRetriesPerRequest: 2,
  retryStrategy(times) {
    return Math.min(times * 200, 2000); // Exponential backoff, max 2s
  },
});
```

Guidelines for timeout values:
- **Connect timeout**: 1-3 seconds. If a node can't be reached in this time, it's likely down.
- **Command timeout**: 500ms-2s for typical operations. Increase for `SCAN` or Lua scripts.
- **Always implement retry with backoff** — transient network issues are common in cloud environments.

Reference: [ElastiCache best practices](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/BestPractices.html)

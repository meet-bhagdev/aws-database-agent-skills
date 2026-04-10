---
name: aws-elasticache
description: "Use when doing ANY task involving Amazon ElastiCache or Valkey. Triggers: caching layers, session stores, leaderboards, rate limiters, pub/sub, real-time analytics; Valkey or Redis OSS commands and data structures; ElastiCache client libraries (ioredis, redis-py, valkey-py, Lettuce, Jedis); connection pooling, pipelining, cluster mode, hash slots; latency issues, memory pressure, big keys, hot keys; choosing between serverless and self-designed (node-based) clusters."
license: MIT
metadata:
  author: aws-database-agent-skills
  version: "0.1.0"
---

# Amazon ElastiCache with Valkey

## Core Principles

**1. Valkey is single-threaded — every slow command blocks everything.**
Valkey processes commands sequentially on a single thread. A single `KEYS *` or `SMEMBERS` on a large set blocks all other clients. Always use `SCAN`-family commands for iteration and avoid O(N) commands on large collections in production.

**2. Always set TTLs on cache entries.**
Cache entries without TTLs accumulate until memory is full, triggering eviction of potentially important keys. Set explicit TTLs on every key. Use `EXPIRE`, `PEXPIRE`, or set TTLs inline with `SET key value EX seconds`.

**3. Use the right data structure for the job.**
Valkey offers strings, hashes, lists, sets, sorted sets, streams, and more. Storing everything as serialized JSON strings wastes memory and forces full deserialization for partial reads. Use hashes for objects, sorted sets for leaderboards, sets for membership checks, HyperLogLog for cardinality estimation.

**4. Connection management is critical.**
Each Valkey node supports up to 65,000 connections, but performance degrades well before that. Reuse connections through pooling. Never create a new connection per request. Configure connect and command timeouts to fail fast rather than hang.

**5. Understand cluster mode before using multi-key operations.**
In cluster mode, keys are distributed across hash slots. Multi-key operations (`MGET`, `MSET`, transactions, Lua scripts) only work when all keys hash to the same slot. Use hash tags `{tag}` to co-locate related keys.

**6. Verify your work.**
After implementing any caching change, verify it works: check that keys are being set with correct TTLs, that cache hits are occurring, and that fallback to the source of truth works when the cache is empty or unavailable.

## Serverless vs Self-Designed Clusters

**Choose ElastiCache Serverless when:**
- You want zero capacity planning — it auto-scales based on traffic
- Your workload has unpredictable or spiky traffic patterns
- You want to get started in under a minute
- You prefer pay-per-use pricing

**Choose self-designed (node-based) clusters when:**
- You need fine-grained control over node types, placement, and configuration
- You have predictable, steady-state workloads where reserved instances save cost
- You need specific parameter group settings
- You need to control exact replica placement across AZs

## Security Checklist

When working on any ElastiCache task, verify:

- **Encryption in transit (TLS)** — Always enable TLS for production. Clients must connect with TLS enabled. Without it, data travels in plaintext within your VPC.
- **Encryption at rest** — Enable for compliance requirements. Cannot be changed after cluster creation.
- **AUTH token / IAM authentication** — Use IAM-based authentication for ElastiCache when possible. For AUTH tokens, rotate them before expiry using the modify-replication-group API with `--auth-token` and `--auth-token-update-strategy ROTATE`.
- **Security groups** — Restrict inbound access to only the application security groups that need cache access. Never use `0.0.0.0/0`.
- **VPC placement** — ElastiCache clusters must be in a VPC. Place them in private subnets with no internet access.

## Client Library Guidance

**Python:**
- Use `valkey-py` (or `redis-py` for Redis OSS compatibility) with connection pooling enabled by default
- For cluster mode: use `valkey-py`'s `ValkeyCluster` class (or `RedisCluster`)
- Always pass `decode_responses=True` unless working with binary data

**Node.js:**
- Use `ioredis` — it supports cluster mode, pipelining, and Lua scripting out of the box
- For cluster mode: use `new Redis.Cluster([...nodes])`
- Configure `lazyConnect: true` for serverless environments to avoid connection on import

**Java:**
- Use Lettuce (reactive, non-blocking) or Jedis (simpler, blocking)
- Lettuce is preferred for high-concurrency applications

## Reference Guides

Read individual rule files for detailed explanations and code examples:

- **Connection Management** → [references/conn-pooling.md](references/conn-pooling.md), [references/conn-cluster-mode.md](references/conn-cluster-mode.md), [references/conn-timeouts.md](references/conn-timeouts.md)
- **Performance** → [references/perf-keys-command.md](references/perf-keys-command.md), [references/perf-big-keys.md](references/perf-big-keys.md), [references/perf-pipelining.md](references/perf-pipelining.md)
- **Data Structures** → [references/data-structure-selection.md](references/data-structure-selection.md), [references/data-serialization.md](references/data-serialization.md)
- **Caching Patterns** → [references/cache-aside-pattern.md](references/cache-aside-pattern.md), [references/cache-invalidation.md](references/cache-invalidation.md), [references/cache-thundering-herd.md](references/cache-thundering-herd.md)
- **Cluster Mode** → [references/cluster-hash-tags.md](references/cluster-hash-tags.md)
- **Provisioning** → [references/provision-gotchas.md](references/provision-gotchas.md)

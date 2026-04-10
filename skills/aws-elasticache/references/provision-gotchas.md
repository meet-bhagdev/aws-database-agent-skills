---
title: ElastiCache Provisioning Gotchas
impact: MEDIUM
impactDescription: Avoids common infrastructure mistakes that cause outages, data loss, or unnecessary cost
tags: provisioning, cluster-mode, encryption, parameter-groups, serverless, valkey
---

## ElastiCache Provisioning Gotchas

These are the most common mistakes when creating ElastiCache clusters. Most cannot be changed after creation.

### 1. Cluster mode cannot be changed after creation

You cannot enable or disable cluster mode on an existing replication group. If you need cluster mode later, you must create a new cluster and migrate data.

**Decision framework:**
- **Cluster mode disabled** — simpler, supports all multi-key operations natively, max 1 shard (up to 5 replicas). Good for < 200 GB data, < 500K ops/sec.
- **Cluster mode enabled** — scales horizontally across shards, required for > 200 GB or > 500K ops/sec. Multi-key operations require hash tags.

### 2. Encryption in transit (TLS) cannot be changed after creation

Enable TLS at creation time. Adding TLS later requires creating a new cluster. All clients must be configured to connect with TLS.

### 3. Encryption at rest cannot be changed after creation

Same as TLS — must be set at creation. Enable for any workload with compliance requirements.

### 4. Node type selection

- **Don't over-provision** — start with `cache.r7g.large` for most workloads and scale based on CloudWatch metrics.
- **Memory rule of thumb** — your dataset should use < 75% of available memory to leave room for replication buffers, Lua scripts, and fragmentation.
- **Network-bound workloads** — if you're saturating network bandwidth, scale up node type (more network capacity) rather than adding shards.

### 5. Parameter groups

- Create a custom parameter group instead of using the default. The default cannot be modified.
- Key parameters to tune: `maxmemory-policy` (default `volatile-lru` — consider `allkeys-lru` if all keys should be evictable), `timeout` (idle connection timeout), `tcp-keepalive`.

### 6. Serverless configuration

- Serverless auto-scales but has a maximum ECPU (ElastiCache Compute Units) and data storage limit per cache.
- Set appropriate maximum limits to prevent unexpected cost spikes.
- Serverless does not support all Valkey commands (e.g., some cluster management commands are unavailable).

### 7. Multi-AZ with automatic failover

Always enable Multi-AZ with automatic failover for production. Without it, a node failure requires manual intervention.

### 8. Backup and snapshot

Enable automatic backups with an appropriate retention period. Snapshots are taken from replicas (no performance impact on primary) when Multi-AZ is enabled.

Reference: [Creating an ElastiCache cluster](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Clusters.Create.html)

---
title: Set Serverless v2 Min ACU High Enough for Buffer Cache
impact: CRITICAL
impactDescription: Min ACU too low causes cold buffer cache on scale-up — 10-100x latency spike
tags: serverless-v2, acu, buffer-cache, scaling, latency
---

## Set Serverless v2 Min ACU High Enough for Buffer Cache

When Aurora Serverless v2 scales up from a low min ACU, the buffer cache is cold — your working dataset isn't in memory. Every query hits storage instead of cache, causing massive latency spikes until the cache warms up.

**Incorrect (min ACU 0.5 for production — cold cache on scale-up):**

```python
import boto3

rds = boto3.client('rds')

# Min 0.5 ACU saves money during idle periods but...
# When traffic arrives, Aurora scales up with an EMPTY buffer cache
# Every query hits storage — 10-100x slower until cache warms
rds.modify_db_cluster(
    DBClusterIdentifier='my-cluster',
    ServerlessV2ScalingConfiguration={
        'MinCapacity': 0.5,   # Too low for production!
        'MaxCapacity': 64,
    },
)
```

**Correct (min ACU sized for buffer cache):**

```python
import boto3

rds = boto3.client('rds')

# Set min ACU high enough to keep working dataset in memory
# Rule of thumb: 1 ACU ≈ 2 GB memory. If your working set is 8 GB, min ACU ≥ 4
rds.modify_db_cluster(
    DBClusterIdentifier='my-cluster',
    ServerlessV2ScalingConfiguration={
        'MinCapacity': 4,     # Keeps buffer cache warm
        'MaxCapacity': 64,
    },
)
```

How to determine the right min ACU:
1. Check `BufferCacheHitRatio` in CloudWatch — it should be > 99%
2. Check `ACUUtilization` — if it's consistently > 80% at min ACU, increase the minimum
3. Check `ServerlessDatabaseCapacity` — if it never drops to min, your min is already appropriate

```sql
-- PostgreSQL: check buffer cache hit ratio
SELECT
  sum(blks_hit) * 100.0 / nullif(sum(blks_hit) + sum(blks_read), 0) AS cache_hit_ratio
FROM pg_stat_database;
```

For development/staging environments, 0.5 min ACU is fine. For production with consistent traffic, set min ACU to match your steady-state workload.

Reference: [Aurora Serverless v2 scaling](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html)

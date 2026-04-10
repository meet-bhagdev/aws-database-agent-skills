---
title: Understand Aurora Storage Scaling and I/O Costs
impact: MEDIUM
impactDescription: Choosing the wrong storage type can double your I/O costs
tags: storage, io-optimized, scaling, cost
---

## Understand Aurora Storage Scaling and I/O Costs

Aurora storage auto-scales up to 128 TiB. Storage never shrinks — even if you delete data, allocated storage remains. Choose the right storage type based on your I/O pattern.

**Aurora I/O-Optimized vs Standard:**

| Feature | Standard | I/O-Optimized |
|---------|----------|---------------|
| Storage cost | Lower | ~30% higher |
| I/O cost | Per-I/O charge | No I/O charges |
| Best for | Low-I/O workloads | I/O-heavy workloads |
| Break-even | < 25% I/O cost of total | > 25% I/O cost of total |

**How to check if I/O-Optimized saves money:**

```sql
-- Check your current I/O volume (PostgreSQL)
SELECT * FROM aurora_stat_io();
```

Check CloudWatch: if `VolumeReadIOPs` + `VolumeWriteIOPs` costs exceed 25% of your total Aurora bill, switch to I/O-Optimized.

```python
import boto3

rds = boto3.client('rds')

# Switch to I/O-Optimized (no downtime)
rds.modify_db_cluster(
    DBClusterIdentifier='my-cluster',
    StorageType='aurora-iopt1',
    ApplyImmediately=True,
)
```

You can switch between Standard and I/O-Optimized without downtime, but can only switch once every 30 days.

Reference: [Aurora storage and I/O](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html)

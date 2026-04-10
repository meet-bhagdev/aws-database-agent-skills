---
title: Use Performance Insights to Find Slow Queries
impact: HIGH
impactDescription: Identifies actual slow queries and wait events instead of guessing
tags: performance-insights, monitoring, slow-queries, wait-events
---

## Use Performance Insights to Find Slow Queries

Don't guess which queries are slow or add random indexes. Performance Insights shows top SQL by database load, broken down by wait events (CPU, I/O, lock waits).

**Incorrect (guessing and adding random indexes):**

```sql
-- "The app is slow, let me add some indexes"
CREATE INDEX idx_orders_everything ON orders (customer_id, status, created_at, total);
-- This might not help at all if the bottleneck is lock contention, not missing indexes
```

**Correct (use Performance Insights to identify the actual bottleneck):**

1. Enable Performance Insights (free tier: 7 days retention):

```python
import boto3

rds = boto3.client('rds')
rds.modify_db_instance(
    DBInstanceIdentifier='my-instance',
    EnablePerformanceInsights=True,
    PerformanceInsightsRetentionPeriod=7,  # 7 days free, 731 days paid
    ApplyImmediately=True,
)
```

2. Query PI programmatically to find top SQL:

```python
pi = boto3.client('pi')

response = pi.get_resource_metrics(
    ServiceType='RDS',
    Identifier='db-XXXXXXXXXXXXXXXXXXXX',
    MetricQueries=[{
        'Metric': 'db.load.avg',
        'GroupBy': {'Group': 'db.sql', 'Limit': 10},
    }],
    StartTime=datetime.utcnow() - timedelta(hours=1),
    EndTime=datetime.utcnow(),
    PeriodInSeconds=300,
)
```

3. For PostgreSQL, also enable `pg_stat_statements`:

```sql
-- Check top queries by total time
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

Wait event categories to watch:
- **CPU** — query is compute-bound. Optimize the query or scale up.
- **IO** — query is reading from storage. Add indexes or increase buffer cache (ACU/instance size).
- **Lock** — query is waiting for a lock. Check for long-running transactions or deadlocks.

Reference: [Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_PerfInsights.html)

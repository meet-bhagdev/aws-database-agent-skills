---
title: Avoid Long-Running Transactions on Replicas
impact: HIGH
impactDescription: Long transactions on replicas force the writer to retain MVCC history, degrading writer performance
tags: transactions, mvcc, replicas, performance
---

## Avoid Long-Running Transactions on Replicas

Aurora's shared storage uses MVCC (Multi-Version Concurrency Control). When a replica has a long-running transaction, the writer must retain old row versions that the replica's transaction might need. This bloats storage and degrades writer performance.

**Incorrect (ETL query on replica with no timeout):**

```python
# Long-running analytics query on a replica — holds MVCC history for hours
reader_conn = psycopg2.connect(
    host='mycluster.cluster-ro-xxx.us-east-1.rds.amazonaws.com',
    port=5432, database='mydb', user='app', password='secret',
)
cur = reader_conn.cursor()
# This 2-hour query forces the writer to retain all row versions created during that time
cur.execute('SELECT * FROM events WHERE created_at > now() - interval \'90 days\'')
```

**Correct (statement timeout + dedicated replica for analytics):**

```python
# Option 1: Set statement timeout on the connection
reader_conn = psycopg2.connect(
    host='mycluster.cluster-ro-xxx.us-east-1.rds.amazonaws.com',
    port=5432, database='mydb', user='app', password='secret',
    options='-c statement_timeout=300000',  # 5 minute timeout
)

# Option 2: Use a dedicated analytics replica with a custom endpoint
# This isolates the MVCC impact to a replica you can afford to restart
analytics_conn = psycopg2.connect(
    host='my-analytics-endpoint.cluster-custom-xxx.us-east-1.rds.amazonaws.com',
    port=5432, database='mydb', user='analytics', password='secret',
    options='-c statement_timeout=1800000',  # 30 min timeout for analytics
)
```

```javascript
import pg from 'pg';

// Set statement_timeout to prevent runaway queries
const reader = new pg.Pool({
  host: 'mycluster.cluster-ro-xxx.us-east-1.rds.amazonaws.com',
  port: 5432, database: 'mydb', user: 'app', password: 'secret',
  ssl: true,
  statement_timeout: 300000, // 5 minutes
});
```

For heavy analytics, consider Aurora zero-ETL integration with Redshift instead of running analytics directly on Aurora replicas.

Reference: [Aurora best practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)

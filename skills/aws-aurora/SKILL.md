---
name: aws-aurora
description: "Use when doing ANY task involving Amazon Aurora (MySQL or PostgreSQL). Triggers: Aurora cluster setup, Serverless v2, read replicas, reader/writer endpoints; connection pooling, RDS Proxy; failover, high availability, Global Database; Performance Insights, query optimization; IAM database authentication; psycopg2, pymysql, pg, mysql2 client libraries."
license: MIT
metadata:
  author: aws-database-agent-skills
  version: "0.1.0"
---

# Amazon Aurora (MySQL and PostgreSQL)

## Core Principles

**1. Aurora is not vanilla MySQL/PostgreSQL.**
Aurora has a shared distributed storage layer. Replicas share storage with the writer (no replication lag for data, but buffer cache is per-instance). Long-running transactions on replicas can impact writer performance through MVCC history retention. Don't assume vanilla MySQL/PostgreSQL behavior.

**2. Always use reader endpoints for read traffic.**
The reader endpoint load-balances connections across replicas. Sending all queries to the writer wastes replica capacity and overloads the writer. Implement read/write splitting in your application.

**3. Connection management is critical.**
Aurora has hard connection limits based on instance class (`max_connections` ≈ instance memory / 9531000 for PostgreSQL). Use RDS Proxy for Lambda/serverless workloads. Use application-level connection pooling for long-running services. Never open unlimited connections.

**4. Monitor with Performance Insights.**
Don't guess which queries are slow. Performance Insights shows top SQL by wait events (CPU, I/O, lock waits), helping you identify the actual bottleneck. Enable it on every production instance.

**5. Serverless v2 ACU configuration matters.**
Setting min ACU too low causes cold buffer cache on scale-up — every query hits storage instead of memory, causing 10-100x latency spikes. Set min ACU high enough to keep your working dataset in the buffer cache. Monitor `BufferCacheHitRatio` — it should be > 99%.

**6. Verify your work.**
After any configuration change, verify with a test query and check Performance Insights for unexpected behavior.

## Security Checklist

- **IAM database authentication** — eliminates password management for programmatic access. Use for Lambda, ECS, EC2 with IAM roles.
- **Enforce SSL/TLS** — PostgreSQL: set `rds.force_ssl=1`. MySQL: set `require_secure_transport=ON`. Download the [RDS CA bundle](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html).
- **Security groups** — restrict inbound to application security groups only. Never use `0.0.0.0/0`.
- **Encryption at rest** — enable at creation time. Cannot be changed after creation.
- **Deletion protection** — enable for production clusters.
- **Secrets Manager** — use for password rotation if not using IAM auth. Rotate every 30 days.

## Client Library Guidance

**Aurora PostgreSQL:**
- Python: `psycopg2` or `psycopg` (v3). Use connection pooling (`psycopg2.pool.ThreadedConnectionPool` or SQLAlchemy).
- Node.js: `pg` (node-postgres). Use `pg.Pool` for connection pooling.

**Aurora MySQL:**
- Python: `pymysql` or `mysql-connector-python`. Use SQLAlchemy for pooling.
- Node.js: `mysql2` with promise wrapper. Use `mysql2.createPool()`.

**For Lambda:** Always use RDS Proxy instead of direct connections.

```python
# Aurora PostgreSQL with IAM auth
import boto3
import psycopg2

client = boto3.client('rds')
token = client.generate_db_auth_token(
    DBHostname='mycluster.cluster-ro-xxx.us-east-1.rds.amazonaws.com',
    Port=5432,
    DBUsername='iam_user',
    Region='us-east-1',
)
conn = psycopg2.connect(
    host='mycluster.cluster-ro-xxx.us-east-1.rds.amazonaws.com',
    port=5432, database='mydb', user='iam_user', password=token,
    sslmode='require', sslrootcert='global-bundle.pem',
)
```

## Reference Guides

- **Connection Management** → [references/conn-reader-endpoints.md](references/conn-reader-endpoints.md), [references/conn-rds-proxy.md](references/conn-rds-proxy.md), [references/conn-connection-limits.md](references/conn-connection-limits.md)
- **Scaling** → [references/scale-serverless-v2-acu.md](references/scale-serverless-v2-acu.md), [references/scale-read-replicas.md](references/scale-read-replicas.md), [references/scale-storage-scaling.md](references/scale-storage-scaling.md)
- **Query Patterns** → [references/query-long-running-transactions.md](references/query-long-running-transactions.md), [references/query-performance-insights.md](references/query-performance-insights.md)
- **High Availability** → [references/ha-failover.md](references/ha-failover.md), [references/ha-global-database.md](references/ha-global-database.md)
- **Provisioning** → [references/provision-gotchas.md](references/provision-gotchas.md)

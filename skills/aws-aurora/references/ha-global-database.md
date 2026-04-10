---
title: Aurora Global Database for Cross-Region DR
impact: MEDIUM
impactDescription: Enables cross-region disaster recovery with less than 1 second replication lag
tags: global-database, cross-region, disaster-recovery, rpo
---

## Aurora Global Database for Cross-Region DR

Aurora Global Database replicates from a primary region to up to 5 secondary regions with typically < 1 second replication lag. The secondary regions serve read traffic and can be promoted to full read-write in a disaster.

**Incorrect (trying to write to a secondary region):**

```python
# Secondary region cluster is READ-ONLY — writes fail
secondary_conn = psycopg2.connect(
    host='mycluster-secondary.cluster-xxx.eu-west-1.rds.amazonaws.com',
    port=5432, database='mydb', user='app', password='secret',
)
cur = secondary_conn.cursor()
cur.execute('INSERT INTO orders ...')  # ERROR: cannot execute INSERT in a read-only transaction
```

**Correct (writes to primary, reads from any region):**

```python
# Writes always go to the primary region
primary_conn = psycopg2.connect(
    host='mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',
    port=5432, database='mydb', user='app', password='secret',
)

# Reads can go to the nearest region for lower latency
local_reader = psycopg2.connect(
    host='mycluster-secondary.cluster-ro-xxx.eu-west-1.rds.amazonaws.com',
    port=5432, database='mydb', user='app', password='secret',
)
```

Key characteristics:
- **RPO** < 1 second (typical replication lag)
- **RTO** < 1 minute for managed planned failover
- **Unplanned failover** (detach and promote) takes minutes and may have data loss up to the replication lag
- Secondary regions are read-only until promoted
- Storage-level replication — no impact on writer performance

Reference: [Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)

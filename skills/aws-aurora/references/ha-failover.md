---
title: Handle Failover with Connection Retry Logic
impact: HIGH
impactDescription: Unhandled failover causes 30-60 seconds of application downtime
tags: failover, high-availability, retry, dns-caching
---

## Handle Failover with Connection Retry Logic

During an Aurora failover, the cluster endpoint DNS record updates to point to the new writer. Without retry logic, your application gets connection errors for 30-60 seconds. With RDS Proxy, failover is < 1 second.

**Incorrect (no retry — failover causes errors):**

```python
import psycopg2

conn = psycopg2.connect(host='mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',
                        port=5432, database='mydb', user='app', password='secret')

def get_user(user_id):
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE id = %s', (user_id,))  # Fails during failover
    return cur.fetchone()
```

**Correct (retry with backoff and fresh connections):**

```python
import psycopg2
import time

def get_connection():
    return psycopg2.connect(
        host='mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',
        port=5432, database='mydb', user='app', password='secret',
        connect_timeout=5,
    )

def execute_with_retry(query, params, max_retries=3):
    for attempt in range(max_retries):
        try:
            conn = get_connection()
            conn.autocommit = True
            cur = conn.cursor()
            cur.execute(query, params)
            result = cur.fetchall()
            conn.close()
            return result
        except psycopg2.OperationalError as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # 1s, 2s, 4s backoff
```

```javascript
import pg from 'pg';

async function executeWithRetry(query, params, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const client = new pg.Client({
        host: 'mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',
        port: 5432, database: 'mydb', user: 'app', password: 'secret',
        connectionTimeoutMillis: 5000, ssl: true,
      });
      await client.connect();
      const result = await client.query(query, params);
      await client.end();
      return result.rows;
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 2 ** attempt * 1000));
    }
  }
}
```

Key points:
- **Don't cache DNS** — set JVM `networkaddress.cache.ttl=5` or use short DNS TTL. Stale DNS points to the old writer.
- **Use RDS Proxy** for fastest failover (< 1 second) — it handles connection draining and rerouting automatically.
- **Failover priority tiers** — set higher priority (lower number) on instances you want to become the new writer.

Reference: [Aurora failover](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.AuroraHighAvailability.html)

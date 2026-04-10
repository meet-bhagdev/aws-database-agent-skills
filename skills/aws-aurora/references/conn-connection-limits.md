---
title: Respect Connection Limits
impact: HIGH
impactDescription: Exceeding max_connections causes immediate connection refused errors
tags: connections, max-connections, pooling, instance-class
---

## Respect Connection Limits

Aurora's `max_connections` is determined by instance class memory. Exceeding it causes `FATAL: too many connections` errors. Always use connection pooling with a max size below Aurora's limit.

**Aurora PostgreSQL max_connections by instance class (approximate):**
- `db.r6g.large` (16 GB): ~1,600
- `db.r6g.xlarge` (32 GB): ~3,300
- `db.r6g.2xlarge` (64 GB): ~5,000
- Serverless v2 at 8 ACU: ~1,000

**Incorrect (no pooling, no limit):**

```python
import psycopg2

# Each request opens a new connection — no limit, no reuse
def handle_request(user_id):
    conn = psycopg2.connect(host='mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',
                            port=5432, database='mydb', user='app', password='secret')
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE id = %s', (user_id,))
    result = cur.fetchone()
    conn.close()
    return result
```

**Correct (connection pool with bounded size):**

```python
from psycopg2 import pool

# Pool created once at startup — reused across all requests
db_pool = pool.ThreadedConnectionPool(
    minconn=5,
    maxconn=20,  # Well below Aurora's max_connections
    host='mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',
    port=5432, database='mydb', user='app', password='secret',
)

def handle_request(user_id):
    conn = db_pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute('SELECT * FROM users WHERE id = %s', (user_id,))
        return cur.fetchone()
    finally:
        db_pool.putconn(conn)
```

```javascript
import pg from 'pg';

const pool = new pg.Pool({
  host: 'mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',
  port: 5432, database: 'mydb', user: 'app', password: 'secret',
  max: 20,              // Pool size — well below Aurora's limit
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: true,
});

async function handleRequest(userId) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0];
}
```

Rule of thumb: if you have N application instances each with a pool of size P, total connections = N × P. Keep this below 75% of `max_connections` to leave room for admin connections and monitoring.

Reference: [Aurora connection management](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Managing.Performance.html)

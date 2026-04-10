---
title: Use Reader Endpoints for Read Traffic
impact: CRITICAL
impactDescription: Reduces writer load by 50-80% by distributing reads across replicas
tags: reader-endpoint, read-write-splitting, connections, replicas
---

## Use Reader Endpoints for Read Traffic

Aurora provides two endpoints: the cluster (writer) endpoint and the reader endpoint. The reader endpoint load-balances connections across all read replicas. Sending all queries to the writer wastes replica capacity.

**Incorrect (all queries to writer endpoint):**

```python
import psycopg2

# All traffic goes to the writer — replicas sit idle
conn = psycopg2.connect(
    host='mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',  # Writer endpoint
    port=5432, database='mydb', user='app', password='secret',
)

# Reads AND writes all go to the writer
cur = conn.cursor()
cur.execute('SELECT * FROM products WHERE category = %s', ('electronics',))
cur.execute('INSERT INTO orders (product_id, qty) VALUES (%s, %s)', (123, 1))
```

**Correct (read/write splitting):**

```python
import psycopg2

# Writer connection for writes
writer = psycopg2.connect(
    host='mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',  # Writer endpoint
    port=5432, database='mydb', user='app', password='secret',
)

# Reader connection for reads
reader = psycopg2.connect(
    host='mycluster.cluster-ro-xxx.us-east-1.rds.amazonaws.com',  # Reader endpoint
    port=5432, database='mydb', user='app', password='secret',
)

# Route reads to reader, writes to writer
reader.cursor().execute('SELECT * FROM products WHERE category = %s', ('electronics',))
writer.cursor().execute('INSERT INTO orders (product_id, qty) VALUES (%s, %s)', (123, 1))
```

```javascript
import pg from 'pg';

const writer = new pg.Pool({
  host: 'mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',
  port: 5432, database: 'mydb', user: 'app', password: 'secret', ssl: true,
});

const reader = new pg.Pool({
  host: 'mycluster.cluster-ro-xxx.us-east-1.rds.amazonaws.com',
  port: 5432, database: 'mydb', user: 'app', password: 'secret', ssl: true,
});

// Route reads to reader pool
const products = await reader.query('SELECT * FROM products WHERE category = $1', ['electronics']);
// Route writes to writer pool
await writer.query('INSERT INTO orders (product_id, qty) VALUES ($1, $2)', [123, 1]);
```

Important: the reader endpoint uses DNS round-robin. Once a connection is established, it's sticky to one replica. To distribute load, create new connections periodically or use RDS Proxy (which handles this automatically).

Reference: [Aurora endpoints](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.Endpoints.html)

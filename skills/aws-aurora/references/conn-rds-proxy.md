---
title: Use RDS Proxy for Lambda and Serverless
impact: CRITICAL
impactDescription: Eliminates connection exhaustion from Lambda and reduces failover time to under 1 second
tags: rds-proxy, lambda, serverless, connection-pooling
---

## Use RDS Proxy for Lambda and Serverless

Each Lambda invocation opens a new database connection. With hundreds of concurrent invocations, you quickly exhaust Aurora's `max_connections` limit. RDS Proxy pools and reuses connections, and also provides faster failover (< 1 second).

**Incorrect (Lambda connecting directly to Aurora):**

```python
import psycopg2

def handler(event, context):
    # Each invocation opens a new connection — 1000 concurrent Lambdas = 1000 connections
    conn = psycopg2.connect(
        host='mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',
        port=5432, database='mydb', user='app', password='secret',
    )
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE id = %s', (event['user_id'],))
    result = cur.fetchone()
    conn.close()
    return result
```

**Correct (Lambda connecting through RDS Proxy with IAM auth):**

```python
import boto3
import psycopg2

rds_client = boto3.client('rds')

def handler(event, context):
    token = rds_client.generate_db_auth_token(
        DBHostname='my-proxy.proxy-xxx.us-east-1.rds.amazonaws.com',
        Port=5432,
        DBUsername='iam_user',
        Region='us-east-1',
    )
    conn = psycopg2.connect(
        host='my-proxy.proxy-xxx.us-east-1.rds.amazonaws.com',  # RDS Proxy endpoint
        port=5432, database='mydb', user='iam_user', password=token,
        sslmode='require', sslrootcert='global-bundle.pem',
    )
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE id = %s', (event['user_id'],))
    result = cur.fetchone()
    conn.close()
    return result
```

```javascript
import pg from 'pg';
import { RDSClient, GenerateDBAuthTokenCommand } from '@aws-sdk/client-rds';

const rds = new RDSClient({ region: 'us-east-1' });

export async function handler(event) {
  const token = await rds.send(new GenerateDBAuthTokenCommand({
    hostname: 'my-proxy.proxy-xxx.us-east-1.rds.amazonaws.com',
    port: 5432,
    username: 'iam_user',
  }));

  const client = new pg.Client({
    host: 'my-proxy.proxy-xxx.us-east-1.rds.amazonaws.com',
    port: 5432, database: 'mydb', user: 'iam_user', password: token,
    ssl: { rejectUnauthorized: true },
  });

  await client.connect();
  const result = await client.query('SELECT * FROM users WHERE id = $1', [event.user_id]);
  await client.end();
  return result.rows[0];
}
```

RDS Proxy benefits:
- **Connection pooling** — multiplexes thousands of application connections into a small pool of database connections
- **Faster failover** — detects failures and routes to the new writer in < 1 second (vs 30-60s with DNS)
- **IAM authentication** — no database passwords in your code

Reference: [Using Amazon RDS Proxy](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.html)

---
title: AWS SDK Client Configuration
impact: HIGH
impactDescription: Default SDK settings are often wrong for production — missing timeouts cause hangs
tags: sdk, boto3, aws-sdk-v3, retries, timeouts
---

## AWS SDK Client Configuration

Default SDK settings are designed for general use, not production database workloads. Configure retries, timeouts, and connection settings explicitly.

### Python (boto3)

```python
import boto3
from botocore.config import Config

# Production configuration for DynamoDB
config = Config(
    region_name='us-east-1',
    retries={
        'mode': 'adaptive',  # Adaptive retry with token bucket
        'max_attempts': 5,
    },
    connect_timeout=5,       # 5 seconds to establish connection
    read_timeout=10,         # 10 seconds to read response
    max_pool_connections=50, # Connection pool size
)

dynamodb = boto3.resource('dynamodb', config=config)
```

**Incorrect (default config — no timeouts, standard retry):**

```python
# Default boto3 — 60s connect timeout, 60s read timeout, 5 retries with legacy mode
dynamodb = boto3.resource('dynamodb')
# If DynamoDB is slow, your Lambda times out waiting
```

### Node.js (AWS SDK v3)

```javascript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { NodeHttpHandler } from '@smithy/node-http-handler';

const client = new DynamoDBClient({
  region: 'us-east-1',
  maxAttempts: 5,
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 5000,  // 5 seconds
    requestTimeout: 10000,    // 10 seconds
  }),
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});
```

**Incorrect (default config):**

```javascript
// Default SDK v3 — 3 retries, no explicit timeouts
const client = new DynamoDBClient({ region: 'us-east-1' });
```

### Key settings by service

| Setting | DynamoDB | ElastiCache | Aurora |
|---------|----------|-------------|--------|
| Connect timeout | 5s | 2s | 5s |
| Read/command timeout | 10s | 1s | 30s |
| Retries | 5 (adaptive) | 3 | 3 |
| Connection pool | 50 | 50 | 20 |

ElastiCache needs shorter timeouts because it's a cache — if it's slow, fall back to the source of truth. Aurora needs longer read timeouts because SQL queries can legitimately take seconds.

Reference: [boto3 configuration](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/configuration.html), [AWS SDK v3 configuration](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/configuring-the-jssdk.html)

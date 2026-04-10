---
title: IAM Database Authentication
impact: CRITICAL
impactDescription: Eliminates password management and enables fine-grained access control
tags: iam, authentication, security, cross-service
---

## IAM Database Authentication

IAM authentication eliminates database passwords from your code and enables fine-grained access control through IAM policies.

### DynamoDB — IAM is the only authentication method

```python
import boto3

# DynamoDB always uses IAM — no passwords
# boto3 automatically uses the IAM role attached to EC2/Lambda/ECS
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('Users')
table.get_item(Key={'user_id': 'user-123'})
```

```javascript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// SDK v3 automatically uses IAM credentials from the environment
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
await docClient.send(new GetCommand({ TableName: 'Users', Key: { user_id: 'user-123' } }));
```

### Aurora — IAM DB authentication (opt-in)

```python
import boto3
import psycopg2

rds = boto3.client('rds')
token = rds.generate_db_auth_token(
    DBHostname='mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',
    Port=5432, DBUsername='iam_user', Region='us-east-1',
)
conn = psycopg2.connect(
    host='mycluster.cluster-xxx.us-east-1.rds.amazonaws.com',
    port=5432, database='mydb', user='iam_user', password=token,
    sslmode='require',
)
```

### ElastiCache — IAM authentication (Valkey 7.2+)

```python
import valkey

# ElastiCache IAM auth uses a short-lived token
# Requires ElastiCache user with IAM authentication enabled
creds_provider = valkey.CredentialProvider(...)  # IAM-based provider
r = valkey.Valkey(
    host='mycluster.cache.amazonaws.com', port=6379,
    ssl=True, credential_provider=creds_provider,
)
```

For all services: never embed AWS credentials in code. Use IAM roles for compute services (Lambda, EC2, ECS, EKS).

Reference: [IAM database authentication](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/UsingWithRDS.IAMDBAuth.html)

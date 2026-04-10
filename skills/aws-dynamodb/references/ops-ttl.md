---
title: Use TTL for Automatic Expiration
impact: HIGH
impactDescription: TTL is free and automatic — manual deletion is expensive and error-prone
tags: ttl, expiration, cost, operations
---

## Use TTL for Automatic Expiration

DynamoDB TTL automatically deletes expired items at no cost (no WCU consumed). Manual deletion requires scanning for expired items and paying for both the scan and the deletes.

**Incorrect (scheduled Lambda to delete expired items):**

```python
# Expensive: scan entire table, pay for reads + writes
def cleanup_handler(event, context):
    now = int(time.time())
    response = table.scan(
        FilterExpression=Attr('expires_at').lt(now),
    )
    for item in response['Items']:
        table.delete_item(Key={'id': item['id']})  # Pays WCUs per delete
```

**Correct (TTL attribute — free automatic deletion):**

```python
import boto3
import time

# Step 1: Enable TTL on the table (one-time setup)
client = boto3.client('dynamodb')
client.update_time_to_live(
    TableName='Sessions',
    TimeToLiveSpecification={
        'Enabled': True,
        'AttributeName': 'expires_at',  # Must be a Number attribute with Unix epoch
    }
)

# Step 2: Set TTL when writing items
table = boto3.resource('dynamodb').Table('Sessions')
table.put_item(Item={
    'session_id': 'sess-abc-123',
    'user_id': 'user-789',
    'expires_at': int(time.time()) + 3600,  # Expires in 1 hour — MUST be Unix epoch seconds
})
```

```javascript
import { PutCommand } from '@aws-sdk/lib-dynamodb';

await docClient.send(new PutCommand({
  TableName: 'Sessions',
  Item: {
    session_id: 'sess-abc-123',
    user_id: 'user-789',
    expires_at: Math.floor(Date.now() / 1000) + 3600, // Unix epoch SECONDS, not milliseconds
  },
}));
```

Important notes:
- TTL attribute MUST be a `Number` type containing Unix epoch in **seconds** (not milliseconds)
- Deletion is eventually consistent — items may persist up to 48 hours past expiry
- Expired items still appear in queries until actually deleted — filter them in your application
- TTL deletes generate DynamoDB Streams events (useful for cleanup workflows)

Reference: [DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)

---
title: Design GSIs to Avoid Back-Pressure Throttling
impact: CRITICAL
impactDescription: GSI back-pressure throttles the base table even when the base table has capacity
tags: gsi, back-pressure, throttling, data-modeling
---

## Design GSIs to Avoid Back-Pressure Throttling

GSIs are separate tables maintained by DynamoDB. When a GSI can't keep up with writes (because its partition key is hot or its capacity is insufficient), DynamoDB throttles writes to the base table. This is called back-pressure.

**Incorrect (GSI with low-cardinality partition key):**

```python
import boto3

client = boto3.client('dynamodb')

# GSI partition key is 'status' — only a few values
# All writes to orders with status='pending' overwhelm one GSI partition
client.create_table(
    TableName='Orders',
    KeySchema=[{'AttributeName': 'order_id', 'KeyType': 'HASH'}],
    AttributeDefinitions=[
        {'AttributeName': 'order_id', 'AttributeType': 'S'},
        {'AttributeName': 'status', 'AttributeType': 'S'},
    ],
    GlobalSecondaryIndexes=[{
        'IndexName': 'status-index',
        'KeySchema': [{'AttributeName': 'status', 'KeyType': 'HASH'}],  # Hot GSI!
        'Projection': {'ProjectionType': 'ALL'},
    }],
    BillingMode='PAY_PER_REQUEST',
)
```

**Correct (GSI with high-cardinality key, or sparse index):**

```python
import boto3

client = boto3.client('dynamodb')

# Option 1: Composite GSI key with high cardinality
# GSI PK: customer_id (high cardinality), GSI SK: created_at
client.create_table(
    TableName='Orders',
    KeySchema=[{'AttributeName': 'order_id', 'KeyType': 'HASH'}],
    AttributeDefinitions=[
        {'AttributeName': 'order_id', 'AttributeType': 'S'},
        {'AttributeName': 'customer_id', 'AttributeType': 'S'},
        {'AttributeName': 'created_at', 'AttributeType': 'S'},
    ],
    GlobalSecondaryIndexes=[{
        'IndexName': 'customer-orders-index',
        'KeySchema': [
            {'AttributeName': 'customer_id', 'KeyType': 'HASH'},
            {'AttributeName': 'created_at', 'KeyType': 'RANGE'},
        ],
        'Projection': {'ProjectionType': 'ALL'},
    }],
    BillingMode='PAY_PER_REQUEST',
)
```

```python
# Option 2: Sparse index — only items with the GSI attribute get indexed
# Add 'pending_since' attribute only to pending orders
# GSI on 'pending_since' only indexes pending orders — much smaller, no hot partition
table.put_item(Item={
    'order_id': 'ord-123',
    'status': 'pending',
    'pending_since': '2026-01-15T10:00:00Z',  # GSI key — only on pending orders
})

# When order ships, remove the attribute to remove it from the GSI
table.update_item(
    Key={'order_id': 'ord-123'},
    UpdateExpression='SET #s = :s REMOVE pending_since',
    ExpressionAttributeNames={'#s': 'status'},
    ExpressionAttributeValues={':s': 'shipped'},
)
```

Key rules:
- GSI partition keys follow the same rules as table partition keys — high cardinality, uniform distribution
- In on-demand mode, GSI capacity scales independently but can still throttle on hot partitions
- In provisioned mode, set GSI capacity to match expected write throughput — don't rely on base table capacity
- Use sparse indexes to keep GSIs small and focused

Reference: [GSI write throttling and back pressure](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/gsi-throttling.html)

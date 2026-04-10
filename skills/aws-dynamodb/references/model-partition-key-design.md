---
title: Design High-Cardinality Partition Keys
impact: CRITICAL
impactDescription: Poor partition keys cause throttling even with excess capacity — the #1 DynamoDB mistake
tags: partition-key, data-modeling, hot-partitions, throttling
---

## Design High-Cardinality Partition Keys

Each DynamoDB partition supports max 3,000 RCUs and 1,000 WCUs. If most items share the same partition key, all traffic hits one partition while others sit idle. This causes throttling even when overall table capacity is underutilized.

**Incorrect (low-cardinality partition key — hot partition):**

```python
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Orders')

# Partition key is 'status' — only a few distinct values (pending, shipped, delivered)
# All new orders write to the 'pending' partition — hot partition
table.put_item(Item={
    'status': 'pending',       # PK — only 3-5 distinct values!
    'order_id': 'ord-12345',   # SK
    'customer_id': 'cust-789',
    'total': 99.99,
})
```

```javascript
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Partition key is 'status' — creates hot partition
await docClient.send(new PutCommand({
  TableName: 'Orders',
  Item: {
    status: 'pending',       // PK — hot partition
    order_id: 'ord-12345',   // SK
    customer_id: 'cust-789',
    total: 99.99,
  },
}));
```

**Correct (high-cardinality partition key — uniform distribution):**

```python
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Orders')

# Partition key is 'order_id' — unique per order, uniform distribution
table.put_item(Item={
    'order_id': 'ord-12345',     # PK — high cardinality
    'customer_id': 'cust-789',
    'status': 'pending',
    'total': 99.99,
})

# To query by status, use a GSI with a composite key
# GSI PK: status, GSI SK: created_at (for time-range queries within a status)
```

```javascript
await docClient.send(new PutCommand({
  TableName: 'Orders',
  Item: {
    order_id: 'ord-12345',     // PK — high cardinality
    customer_id: 'cust-789',
    status: 'pending',
    total: 99.99,
  },
}));
```

Good partition keys: `userId`, `orderId`, `deviceId`, `sessionId` — values with many distinct entries and roughly even access.

Bad partition keys: `status`, `date`, `region`, `category` — few distinct values, causing hot partitions.

Reference: [Designing partition keys](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html)

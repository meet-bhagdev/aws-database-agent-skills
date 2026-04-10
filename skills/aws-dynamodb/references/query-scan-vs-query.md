---
title: Use Query Instead of Scan
impact: CRITICAL
impactDescription: Scan reads every item in the table — 100-1000x more expensive than Query
tags: query, scan, performance, cost
---

## Use Query Instead of Scan

`Scan` reads every item in the table and optionally filters results. `Query` reads only items matching a partition key (and optionally a sort key condition). On a table with 1 million items, a Scan reads all 1 million; a Query reads only the items in one partition.

**Incorrect (Scan with filter — reads entire table):**

```python
import boto3
from boto3.dynamodb.conditions import Attr

table = boto3.resource('dynamodb').Table('Orders')

# Scans ALL items, then filters — reads and pays for every item in the table
response = table.scan(
    FilterExpression=Attr('customer_id').eq('cust-789')
)
orders = response['Items']
```

```javascript
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Scans entire table — expensive
const response = await docClient.send(new ScanCommand({
  TableName: 'Orders',
  FilterExpression: 'customer_id = :cid',
  ExpressionAttributeValues: { ':cid': 'cust-789' },
}));
```

**Correct (Query with key condition — reads only matching partition):**

```python
import boto3
from boto3.dynamodb.conditions import Key

table = boto3.resource('dynamodb').Table('Orders')

# Query reads only items in the 'cust-789' partition — fast and cheap
response = table.query(
    IndexName='customer-orders-index',
    KeyConditionExpression=Key('customer_id').eq('cust-789'),
)
orders = response['Items']
```

```javascript
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const response = await docClient.send(new QueryCommand({
  TableName: 'Orders',
  IndexName: 'customer-orders-index',
  KeyConditionExpression: 'customer_id = :cid',
  ExpressionAttributeValues: { ':cid': 'cust-789' },
}));
```

When Scan IS appropriate:
- One-time data export or migration
- Analytics on small tables (< 10K items)
- Backfill operations (use parallel scan with `Segment`/`TotalSegments`)

For any recurring application query, always use Query with a properly designed key schema or GSI.

Reference: [Query and Scan operations](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-query-scan.html)

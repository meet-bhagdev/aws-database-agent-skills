---
title: Always Retry UnprocessedItems in Batch Operations
impact: CRITICAL
impactDescription: Ignoring UnprocessedItems silently drops writes — data loss in production
tags: batch, unprocessed-items, retry, data-loss
---

## Always Retry UnprocessedItems in Batch Operations

`BatchWriteItem` writes up to 25 items but may return some as `UnprocessedItems` due to throttling or capacity limits. `BatchGetItem` similarly returns `UnprocessedKeys`. If you don't retry these, you silently lose writes or miss reads.

**Incorrect (single call, no retry):**

```python
import boto3

dynamodb = boto3.resource('dynamodb')

# If any items are throttled, they're silently dropped
dynamodb.batch_write_item(RequestItems={
    'Orders': [
        {'PutRequest': {'Item': {'order_id': f'ord-{i}', 'total': 99.99}}}
        for i in range(25)
    ]
})
```

**Correct (retry loop with exponential backoff):**

```python
import boto3
import time

dynamodb = boto3.resource('dynamodb')

def batch_write_with_retry(table_name, items, max_retries=5):
    request_items = {
        table_name: [{'PutRequest': {'Item': item}} for item in items]
    }

    for attempt in range(max_retries):
        response = dynamodb.batch_write_item(RequestItems=request_items)
        unprocessed = response.get('UnprocessedItems', {})

        if not unprocessed:
            return  # All items written successfully

        request_items = unprocessed
        time.sleep(2 ** attempt * 0.1)  # Exponential backoff

    raise Exception(f'Failed to write {len(request_items)} items after {max_retries} retries')
```

```javascript
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

async function batchWriteWithRetry(tableName, items, maxRetries = 5) {
  let requestItems = {
    [tableName]: items.map(item => ({ PutRequest: { Item: item } })),
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await docClient.send(new BatchWriteCommand({
      RequestItems: requestItems,
    }));

    const unprocessed = response.UnprocessedItems;
    if (!unprocessed || !unprocessed[tableName]?.length) return;

    requestItems = unprocessed;
    await new Promise(r => setTimeout(r, 2 ** attempt * 100));
  }

  throw new Error(`Failed to write items after ${maxRetries} retries`);
}
```

The same pattern applies to `BatchGetItem` — always check `UnprocessedKeys` and retry.

Reference: [BatchWriteItem](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.BatchOperations)

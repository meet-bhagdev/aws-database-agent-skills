---
title: Use Transactions Only for Multi-Item Atomicity
impact: HIGH
impactDescription: Transactions cost 2x capacity — don't waste them on single-item operations
tags: transactions, acid, idempotency, cost
---

## Use Transactions Only for Multi-Item Atomicity

`TransactWriteItems` and `TransactGetItems` provide ACID guarantees across up to 100 items. But they consume 2x the WCUs/RCUs of standard operations. Use them only when you need atomic multi-item operations.

**Incorrect (transaction for a single item — 2x cost for no benefit):**

```python
client = boto3.client('dynamodb')

# Single item write — TransactWriteItems costs 2x WCUs for no atomicity benefit
client.transact_write_items(TransactItems=[{
    'Put': {
        'TableName': 'Orders',
        'Item': {'order_id': {'S': 'ord-123'}, 'total': {'N': '99.99'}},
    }
}])
```

**Correct (transaction for multi-item atomicity):**

```python
client = boto3.client('dynamodb')

# Transfer funds: debit + credit must both succeed or both fail
client.transact_write_items(
    TransactItems=[
        {
            'Update': {
                'TableName': 'Accounts',
                'Key': {'account_id': {'S': 'acct-sender'}},
                'UpdateExpression': 'SET balance = balance - :amount',
                'ConditionExpression': 'balance >= :amount',
                'ExpressionAttributeValues': {':amount': {'N': '50'}},
            }
        },
        {
            'Update': {
                'TableName': 'Accounts',
                'Key': {'account_id': {'S': 'acct-receiver'}},
                'UpdateExpression': 'SET balance = balance + :amount',
                'ExpressionAttributeValues': {':amount': {'N': '50'}},
            }
        },
    ],
    ClientRequestToken='transfer-abc-123',  # Idempotency token — safe to retry
)
```

```javascript
import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';

await client.send(new TransactWriteItemsCommand({
  TransactItems: [
    {
      Update: {
        TableName: 'Accounts',
        Key: { account_id: { S: 'acct-sender' } },
        UpdateExpression: 'SET balance = balance - :amount',
        ConditionExpression: 'balance >= :amount',
        ExpressionAttributeValues: { ':amount': { N: '50' } },
      },
    },
    {
      Update: {
        TableName: 'Accounts',
        Key: { account_id: { S: 'acct-receiver' } },
        UpdateExpression: 'SET balance = balance + :amount',
        ExpressionAttributeValues: { ':amount': { N: '50' } },
      },
    },
  ],
  ClientRequestToken: 'transfer-abc-123',
}));
```

Always use `ClientRequestToken` for idempotency — if a transaction is retried (e.g., network timeout), DynamoDB returns the original result instead of executing twice.

Reference: [DynamoDB Transactions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html)

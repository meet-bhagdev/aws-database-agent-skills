---
title: Always Paginate Query Results
impact: HIGH
impactDescription: Missing pagination causes incomplete results — DynamoDB returns max 1 MB per request
tags: query, pagination, last-evaluated-key
---

## Always Paginate Query Results

DynamoDB returns a maximum of 1 MB of data per Query or Scan request. If there's more data, the response includes `LastEvaluatedKey`. You must loop until `LastEvaluatedKey` is absent to get all results.

**Incorrect (single call — may miss results):**

```python
table = boto3.resource('dynamodb').Table('Orders')

response = table.query(
    KeyConditionExpression=Key('customer_id').eq('cust-789'),
)
orders = response['Items']  # May be incomplete if > 1 MB of data!
```

```javascript
const response = await docClient.send(new QueryCommand({
  TableName: 'Orders',
  KeyConditionExpression: 'customer_id = :cid',
  ExpressionAttributeValues: { ':cid': 'cust-789' },
}));
const orders = response.Items; // May be incomplete!
```

**Correct (paginate until no LastEvaluatedKey):**

```python
table = boto3.resource('dynamodb').Table('Orders')

orders = []
last_key = None

while True:
    kwargs = {
        'KeyConditionExpression': Key('customer_id').eq('cust-789'),
    }
    if last_key:
        kwargs['ExclusiveStartKey'] = last_key

    response = table.query(**kwargs)
    orders.extend(response['Items'])

    last_key = response.get('LastEvaluatedKey')
    if not last_key:
        break
```

```javascript
let orders = [];
let lastKey = undefined;

do {
  const response = await docClient.send(new QueryCommand({
    TableName: 'Orders',
    KeyConditionExpression: 'customer_id = :cid',
    ExpressionAttributeValues: { ':cid': 'cust-789' },
    ExclusiveStartKey: lastKey,
  }));
  orders.push(...response.Items);
  lastKey = response.LastEvaluatedKey;
} while (lastKey);
```

For API pagination (returning pages to a client), use `Limit` to control page size and return `LastEvaluatedKey` as an opaque cursor to the client.

Reference: [Paginating table query results](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Pagination.html)

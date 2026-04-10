---
title: Filter Expressions Don't Reduce Read Costs
impact: HIGH
impactDescription: A common and expensive misconception — filters are applied after reads, not before
tags: query, filter-expression, cost, performance
---

## Filter Expressions Don't Reduce Read Costs

`FilterExpression` is applied AFTER DynamoDB reads items from the table. It reduces the response size but consumes the same RCUs as reading without the filter. Using filters as your primary access strategy means you're paying to read data you throw away.

**Incorrect (filter as primary access pattern — paying for full read):**

```python
# Reading ALL orders for a customer, then filtering by status
# If customer has 1000 orders and 5 are 'pending', you pay for reading 1000 items
response = table.query(
    KeyConditionExpression=Key('customer_id').eq('cust-789'),
    FilterExpression=Attr('status').eq('pending'),
)
# Returns 5 items but consumed RCUs for 1000 items
```

**Correct (design keys so KeyConditionExpression returns only what you need):**

```python
# Option 1: Composite sort key includes status
# SK = STATUS#pending#2026-01-15T10:00:00Z
response = table.query(
    KeyConditionExpression=(
        Key('customer_id').eq('cust-789') &
        Key('sk').begins_with('STATUS#pending')
    ),
)
# Reads only pending orders — pays for 5 items, not 1000

# Option 2: GSI with status as sort key
response = table.query(
    IndexName='customer-status-index',
    KeyConditionExpression=(
        Key('customer_id').eq('cust-789') &
        Key('status').eq('pending')
    ),
)
```

```javascript
// Correct: use KeyConditionExpression to narrow results
const response = await docClient.send(new QueryCommand({
  TableName: 'Orders',
  IndexName: 'customer-status-index',
  KeyConditionExpression: 'customer_id = :cid AND #status = :s',
  ExpressionAttributeNames: { '#status': 'status' },
  ExpressionAttributeValues: { ':cid': 'cust-789', ':s': 'pending' },
}));
```

When FilterExpression IS appropriate:
- Removing a small percentage of results (< 10-20%) from an already-narrow Query
- Ad-hoc queries during development or debugging
- When adding a GSI isn't justified for an infrequent access pattern

Reference: [Filter expressions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.FilterExpression.html)

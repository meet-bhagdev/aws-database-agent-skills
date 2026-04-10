---
title: Avoid Hot Partitions
impact: CRITICAL
impactDescription: Hot partitions cause throttling even when overall table capacity is underutilized
tags: hot-partitions, throttling, write-sharding, adaptive-capacity
---

## Avoid Hot Partitions

DynamoDB distributes data across partitions based on the partition key. Each partition supports max 3,000 RCUs and 1,000 WCUs. If most traffic targets the same partition key, that partition throttles while others sit idle.

**Incorrect (all writes to the same partition key):**

```python
# Counter table with a single partition key — all increments hit one partition
table.update_item(
    Key={'counter_name': 'page_views'},  # Every request hits this one key
    UpdateExpression='SET #c = #c + :inc',
    ExpressionAttributeNames={'#c': 'count'},
    ExpressionAttributeValues={':inc': 1},
)
# At > 1000 writes/sec, this throttles
```

**Correct (write sharding — distribute across multiple partitions):**

```python
import random

SHARD_COUNT = 10

def increment_counter(counter_name):
    shard = random.randint(0, SHARD_COUNT - 1)
    table.update_item(
        Key={'counter_name': f'{counter_name}#shard-{shard}'},
        UpdateExpression='SET #c = if_not_exists(#c, :zero) + :inc',
        ExpressionAttributeNames={'#c': 'count'},
        ExpressionAttributeValues={':inc': 1, ':zero': 0},
    )

def get_counter(counter_name):
    total = 0
    for shard in range(SHARD_COUNT):
        response = table.get_item(Key={'counter_name': f'{counter_name}#shard-{shard}'})
        total += response.get('Item', {}).get('count', 0)
    return total
```

```javascript
const SHARD_COUNT = 10;

async function incrementCounter(counterName) {
  const shard = Math.floor(Math.random() * SHARD_COUNT);
  await docClient.send(new UpdateCommand({
    TableName: 'Counters',
    Key: { counter_name: `${counterName}#shard-${shard}` },
    UpdateExpression: 'SET #c = if_not_exists(#c, :zero) + :inc',
    ExpressionAttributeNames: { '#c': 'count' },
    ExpressionAttributeValues: { ':inc': 1, ':zero': 0 },
  }));
}
```

DynamoDB adaptive capacity helps by automatically isolating hot keys to dedicated partitions, but it's a mitigation, not a solution. Design for uniform distribution from the start.

Reference: [Designing partition keys to distribute workloads](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-uniform-load.html)

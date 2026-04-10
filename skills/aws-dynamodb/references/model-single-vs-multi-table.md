---
title: Single-Table vs Multi-Table Design
impact: HIGH
impactDescription: Wrong table strategy increases complexity without proportional benefit
tags: data-modeling, single-table, multi-table, access-patterns
---

## Single-Table vs Multi-Table Design

This is not a "one right answer" question. Both approaches are valid — the choice depends on your access patterns, team experience, and operational needs.

### When to use single-table design

- Entities are frequently queried together (e.g., "get user and their recent orders in one query")
- You need to minimize round-trips and cost by fetching related data in a single Query
- Your team is experienced with DynamoDB and comfortable with overloaded keys (PK/SK patterns)

```python
# Single-table: Users and Orders in one table
# PK=USER#<userId>, SK=PROFILE         → user profile
# PK=USER#<userId>, SK=ORDER#<orderId> → user's order

table.put_item(Item={
    'PK': 'USER#cust-789', 'SK': 'PROFILE',
    'name': 'Alice', 'email': 'alice@example.com',
})
table.put_item(Item={
    'PK': 'USER#cust-789', 'SK': 'ORDER#ord-123',
    'total': 99.99, 'status': 'shipped',
})

# One query gets user + all their orders
response = table.query(KeyConditionExpression=Key('PK').eq('USER#cust-789'))
```

### When to use multi-table design

- Entities are independent — queried separately, different lifecycles
- Different capacity, TTL, backup, or encryption needs per entity
- Team is new to DynamoDB — multi-table is easier to reason about
- You need different table classes (Standard vs Standard-IA) per entity

```python
# Multi-table: separate tables for Users and Orders
users_table = dynamodb.Table('Users')
orders_table = dynamodb.Table('Orders')

users_table.put_item(Item={
    'user_id': 'cust-789', 'name': 'Alice', 'email': 'alice@example.com',
})
orders_table.put_item(Item={
    'order_id': 'ord-123', 'user_id': 'cust-789',
    'total': 99.99, 'status': 'shipped',
})
```

### Decision framework

| Factor | Single-table | Multi-table |
|--------|-------------|-------------|
| Related entity queries | ✅ One round-trip | ❌ Multiple calls |
| Team familiarity | Requires DynamoDB expertise | Easier to learn |
| Per-entity settings | ❌ Shared capacity/TTL/backups | ✅ Independent settings |
| Schema evolution | Harder to change | Easier to evolve |
| Debugging | Harder to read raw data | Easier to inspect |

Most teams should start with multi-table and move to single-table only when they have a clear performance reason.

Reference: [Single-table vs. multi-table design](https://aws.amazon.com/blogs/database/single-table-vs-multi-table-design-in-amazon-dynamodb/)

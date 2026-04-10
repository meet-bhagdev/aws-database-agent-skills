---
name: aws-dynamodb
description: "Use when doing ANY task involving Amazon DynamoDB. Triggers: table design, partition keys, sort keys, GSIs, LSIs; queries, scans, batch operations, transactions; DynamoDB Streams, TTL, CDC; throttling, hot partitions, capacity planning; single-table vs multi-table design; boto3 DynamoDB resource/client, AWS SDK v3 DynamoDBClient/DynamoDBDocumentClient."
license: MIT
metadata:
  author: aws-database-agent-skills
  version: "0.1.0"
---

# Amazon DynamoDB

## Core Principles

**1. Design for access patterns first — DynamoDB is not a relational database.**
You must know your query patterns before designing the schema. You cannot add arbitrary queries later without adding GSIs. Start by listing every access pattern your application needs, then design keys to support them.

**2. Partition key design determines everything.**
Choose high-cardinality keys with uniform distribution (userId, orderId). Low-cardinality keys (status, date, region) create hot partitions that throttle even with excess capacity. Each partition supports max 3,000 RCUs and 1,000 WCUs.

**3. Always handle unprocessed items.**
`BatchWriteItem` and `BatchGetItem` can return partial results. You MUST retry `UnprocessedItems`/`UnprocessedKeys` with exponential backoff. Ignoring them silently drops writes — data loss in production.

**4. Use on-demand capacity unless you understand provisioned.**
On-demand handles spiky workloads without throttling. Provisioned is cheaper for steady-state but requires auto-scaling configuration and has a 5-15 minute reaction lag. On-demand can still throttle if traffic more than doubles within 30 minutes of the previous peak.

**5. Filter expressions don't reduce read costs.**
Filters are applied AFTER data is read from the table. They reduce response size but consume the same RCUs. Design your key schema so `KeyConditionExpression` returns only what you need.

**6. Verify your work.**
After any schema change or new access pattern, run a test query to confirm it works and check consumed capacity to ensure it's efficient.

## Security Checklist

- **IAM fine-grained access** — use IAM policy condition keys (`dynamodb:LeadingKeys`) to restrict access to specific partition key values per user/role.
- **Encryption at rest** — enabled by default with AWS owned key. Use a customer managed KMS key (CMK) for compliance requirements.
- **VPC endpoints** — use a gateway VPC endpoint for DynamoDB to keep traffic off the public internet. Gateway endpoints are free.
- **Point-in-time recovery (PITR)** — enable for production tables. You cannot recover data if PITR was not enabled before the data loss event.
- **Never embed credentials** — use IAM roles for EC2/Lambda/ECS. Use environment variables or Secrets Manager for local development.

## SDK Guidance

**Python (boto3):**
- Use the **resource** API (`dynamodb.Table`) for application code — it handles type marshalling automatically
- Use the **client** API (`dynamodb.client`) only when you need low-level control (e.g., `TransactWriteItems`)
- Always pass `ReturnConsumedCapacity='TOTAL'` during development to understand cost

**Node.js (AWS SDK v3):**
- Use `@aws-sdk/lib-dynamodb` `DynamoDBDocumentClient` — it wraps `DynamoDBClient` with automatic marshalling/unmarshalling
- Never use raw `DynamoDBClient` for application code — you'll have to manually marshal every attribute
- Configure `maxAttempts` and use the built-in retry strategy

```javascript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1', maxAttempts: 3 });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});
```

## Reference Guides

- **Data Modeling** → [references/model-partition-key-design.md](references/model-partition-key-design.md), [references/model-single-vs-multi-table.md](references/model-single-vs-multi-table.md), [references/model-gsi-design.md](references/model-gsi-design.md)
- **Query Patterns** → [references/query-scan-vs-query.md](references/query-scan-vs-query.md), [references/query-pagination.md](references/query-pagination.md), [references/query-filter-expressions.md](references/query-filter-expressions.md)
- **Performance** → [references/perf-hot-partitions.md](references/perf-hot-partitions.md), [references/perf-batch-operations.md](references/perf-batch-operations.md)
- **Operations** → [references/ops-transactions.md](references/ops-transactions.md), [references/ops-ttl.md](references/ops-ttl.md), [references/ops-streams.md](references/ops-streams.md)
- **Provisioning** → [references/provision-gotchas.md](references/provision-gotchas.md)

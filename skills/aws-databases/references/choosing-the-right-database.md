---
title: Choosing the Right AWS Database
impact: CRITICAL
impactDescription: Wrong database choice leads to re-architecture — the most expensive mistake
tags: service-selection, architecture, access-patterns
---

## Choosing the Right AWS Database

### Decision Matrix

| Criteria | DynamoDB | ElastiCache (Valkey) | Aurora | Neptune | DocumentDB | DSQL |
|----------|----------|---------------------|--------|---------|------------|------|
| **Data model** | Key-value, document | Key-value, data structures | Relational (SQL) | Graph (property/RDF) | Document (MongoDB) | Relational (SQL) |
| **Latency** | Single-digit ms | Microseconds | Low ms | Low ms | Low ms | Low ms |
| **Max throughput** | Millions req/s | Millions req/s | 100K+ req/s | 100K+ req/s | 100K+ req/s | Millions req/s |
| **Consistency** | Eventually or strong | Eventually | Strong (ACID) | Strong (ACID) | Strong (ACID) | Strong (ACID) |
| **Serverless option** | Yes (on-demand) | Yes (Serverless) | Yes (Serverless v2) | Yes (Serverless) | Yes (Elastic Clusters) | Yes (native) |
| **Multi-region writes** | Yes (Global Tables) | No (single writer) | No (Global DB read) | No | No | Yes (native) |
| **Complex queries/joins** | No | No | Yes | Graph traversals | Aggregation pipeline | Yes |

### When to Use Each Service

**DynamoDB** — Your default for new services that need:
- Simple key-value or document access patterns
- Predictable single-digit millisecond latency at any scale
- Serverless, pay-per-request pricing
- Global tables for multi-region writes
- Avoid if: you need complex joins, ad-hoc queries, or strong relational integrity

**ElastiCache (Valkey)** — Use as a caching layer or for ephemeral data:
- Cache-aside pattern in front of any database
- Session stores, rate limiters, leaderboards
- Pub/sub messaging, real-time analytics
- Any workload needing microsecond latency
- Avoid if: you need data durability as the primary store (use as cache, not database)

**Aurora** — Use for relational workloads:
- Complex SQL queries with joins across tables
- ACID transactions across multiple tables
- Existing MySQL/PostgreSQL applications migrating to AWS
- Workloads needing strong relational integrity (foreign keys, constraints)
- Avoid if: you need simple key-value access at massive scale (use DynamoDB)

**Neptune** — Use for graph workloads:
- Social networks, recommendation engines, fraud detection
- Knowledge graphs, identity graphs
- Any workload where relationships between entities are the primary query pattern
- Avoid if: your queries don't traverse relationships (use Aurora or DynamoDB)

**DocumentDB** — Use for MongoDB compatibility:
- Existing MongoDB applications migrating to AWS
- Document-oriented workloads with MongoDB drivers and tools
- Avoid if: starting fresh (consider DynamoDB for documents, Aurora for relational)

**Aurora DSQL** — Use for distributed SQL:
- Multi-region active-active SQL workloads
- Strong consistency across regions
- PostgreSQL-compatible distributed transactions
- Avoid if: single-region is sufficient (use Aurora, it's simpler)

Reference: [AWS Database Services](https://aws.amazon.com/products/databases/)

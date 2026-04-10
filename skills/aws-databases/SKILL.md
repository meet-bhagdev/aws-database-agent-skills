---
name: aws-databases
description: "Use when choosing an AWS database service or handling cross-cutting concerns. Triggers: deciding between DynamoDB, Aurora, ElastiCache, Neptune, DocumentDB, DSQL; IAM database authentication; VPC connectivity, security groups, subnet groups; AWS SDK client configuration (boto3, AWS SDK v3) with retries and timeouts."
license: MIT
metadata:
  author: aws-database-agent-skills
  version: "0.1.0"
---

# AWS Databases — Service Selection and Cross-Cutting Concerns

## When to Use This Skill

Use this skill when you need to:
- Choose the right AWS database service for a workload
- Set up IAM authentication across database services
- Configure VPC connectivity, security groups, or subnet groups
- Initialize AWS SDK clients with proper retry and timeout settings

For service-specific best practices, use the dedicated skills:
- [aws-elasticache](../aws-elasticache/SKILL.md) — ElastiCache with Valkey
- [aws-dynamodb](../aws-dynamodb/SKILL.md) — DynamoDB
- [aws-aurora](../aws-aurora/SKILL.md) — Aurora MySQL/PostgreSQL

## Quick Decision Framework

| If you need... | Use |
|----------------|-----|
| Key-value lookups at any scale, serverless | **DynamoDB** |
| Sub-millisecond caching, session stores, leaderboards | **ElastiCache (Valkey)** |
| Complex SQL queries, joins, transactions, relational data | **Aurora** |
| Graph traversals, relationship queries | **Neptune** |
| MongoDB-compatible document store (managed) | **DocumentDB** |
| Distributed SQL with strong consistency, multi-region | **Aurora DSQL** |

## Core Principles

**1. Choose based on access patterns, not familiarity.**
Don't default to a relational database because it's what you know. DynamoDB is better for simple key-value access at scale. ElastiCache is better for ephemeral data that needs microsecond latency. Choose the service that matches your data access patterns.

**2. Security is not optional.**
Every AWS database should have: encryption at rest, encryption in transit (TLS), IAM-based authentication where supported, VPC placement in private subnets, and security groups restricting access to application subnets only.

**3. SDK configuration matters.**
Default SDK settings are often wrong for production. Configure retries, timeouts, and connection pooling explicitly. A missing timeout can cause your application to hang indefinitely.

## Reference Guides

- [references/choosing-the-right-database.md](references/choosing-the-right-database.md) — Detailed decision matrix
- [references/iam-authentication.md](references/iam-authentication.md) — IAM auth patterns across services
- [references/vpc-connectivity.md](references/vpc-connectivity.md) — VPC, security groups, subnet groups
- [references/sdk-setup.md](references/sdk-setup.md) — boto3 and AWS SDK v3 configuration

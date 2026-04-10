# AWS Database Agent Skills

Agent Skills to help developers using AI agents with AWS database services. Agent Skills are folders of instructions, scripts, and resources that agents can discover and use to build on AWS databases correctly. Compatible with 18+ AI agents including Claude Code, GitHub Copilot, Cursor, Cline, and many others.

The skills in this repo follow the [Agent Skills](https://agentskills.io/) format.

## Installation

### Install all skills

```bash
npx skills add meet-bhagdev/aws-database-agent-skills
```

### Install a specific skill

```bash
npx skills add meet-bhagdev/aws-database-agent-skills --skill aws-elasticache
npx skills add meet-bhagdev/aws-database-agent-skills --skill aws-dynamodb
npx skills add meet-bhagdev/aws-database-agent-skills --skill aws-aurora
npx skills add meet-bhagdev/aws-database-agent-skills --skill aws-databases
```

## Available Skills

### aws-elasticache

Best practices for Amazon ElastiCache with Valkey — connection management, data structure selection, caching patterns, cluster mode, and performance optimization.

**Use when:**
- Building caching layers with ElastiCache or Valkey
- Implementing session stores, leaderboards, rate limiters, or pub/sub
- Troubleshooting latency, connection issues, or memory pressure
- Choosing between serverless and self-designed (node-based) clusters
- Working with cluster mode, hash slots, or pipelining

### aws-dynamodb

Best practices for Amazon DynamoDB — data modeling, query patterns, performance tuning, and operational patterns.

**Use when:**
- Designing DynamoDB table schemas or choosing partition keys
- Writing queries, scans, or batch operations
- Troubleshooting throttling, hot partitions, or GSI back-pressure
- Implementing DynamoDB Streams, TTL, or transactions
- Deciding between single-table and multi-table designs

### aws-aurora

Best practices for Amazon Aurora (MySQL and PostgreSQL) — connection management, scaling, high availability, and query optimization.

**Use when:**
- Setting up Aurora clusters or Serverless v2
- Implementing read/write splitting with reader endpoints
- Configuring connection pooling with RDS Proxy
- Troubleshooting failover, replication lag, or scaling issues
- Optimizing queries with Performance Insights

### aws-databases

Umbrella skill for choosing the right AWS database and cross-cutting concerns like IAM authentication, VPC connectivity, and SDK configuration.

**Use when:**
- Deciding which AWS database service to use for a workload
- Setting up IAM database authentication
- Configuring VPC connectivity, security groups, or subnet groups
- Initializing AWS SDK clients (boto3, AWS SDK v3) with proper retry and timeout settings

## Skill Structure

Each skill follows the [Agent Skills Open Standard](https://agentskills.io/):
- `SKILL.md` — Required skill manifest with frontmatter (name, description, metadata)
- `references/` — Reference files for detailed best practices, loaded on demand

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding new rules or services.

## License

[MIT](LICENSE)

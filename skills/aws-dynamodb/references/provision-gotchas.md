---
title: DynamoDB Provisioning Gotchas
impact: MEDIUM
impactDescription: Common provisioning mistakes that cause throttling, data loss, or unnecessary cost
tags: provisioning, capacity, auto-scaling, pitr, table-class
---

## DynamoDB Provisioning Gotchas

### 1. On-demand can still throttle

On-demand mode throttles if traffic more than doubles within 30 minutes of the previous peak. For new tables, the initial capacity is 4,000 WCUs / 12,000 RCUs. Ramp up gradually if you expect a large initial load.

### 2. Auto-scaling has a 5-15 minute lag

Provisioned mode with auto-scaling reacts to CloudWatch alarms, which take minutes to trigger. Not suitable for sudden traffic spikes. Use on-demand for unpredictable workloads.

### 3. GSI capacity is independent

In provisioned mode, each GSI needs its own capacity settings. A GSI with insufficient capacity throttles the base table through back-pressure. In on-demand mode, GSIs scale independently but can still have hot partition issues.

### 4. Table class selection

- **DynamoDB Standard** — default, optimized for throughput cost
- **DynamoDB Standard-IA** — 60% lower storage cost, 25% higher read/write cost. Use for tables where storage cost dominates (large items, infrequent access)

You can switch table class without downtime.

### 5. Point-in-time recovery (PITR)

Enable PITR for all production tables. You cannot recover data if PITR was not enabled before the data loss event. PITR allows recovery to any second in the last 35 days.

### 6. Deletion protection

Enable deletion protection on production tables to prevent accidental deletion via console, CLI, or IaC. Must be explicitly disabled before a table can be deleted.

### 7. Contributor Insights

Enable Contributor Insights to identify the most accessed and throttled partition keys. Essential for diagnosing hot partition issues. Costs $0.02 per 100K events.

Reference: [DynamoDB best practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

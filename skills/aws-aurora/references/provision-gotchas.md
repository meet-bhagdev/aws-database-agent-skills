---
title: Aurora Provisioning Gotchas
impact: MEDIUM
impactDescription: Common provisioning mistakes that cause outages, performance issues, or unnecessary cost
tags: provisioning, instance-class, encryption, parameter-groups, monitoring
---

## Aurora Provisioning Gotchas

### 1. Use the same instance class for all instances in a cluster

Mixed instance sizes cause uneven load distribution. The reader endpoint distributes connections equally, so a smaller replica gets the same connection count as a larger one but can't handle the same load.

### 2. Encryption at rest cannot be changed after creation

Enable encryption when creating the cluster. To encrypt an existing unencrypted cluster, you must create an encrypted snapshot and restore from it.

### 3. I/O-Optimized vs Standard storage

Check your I/O costs before choosing. If I/O charges exceed 25% of your total Aurora bill, I/O-Optimized saves money. You can switch without downtime but only once every 30 days.

### 4. Create custom parameter groups

Don't use the default parameter group — it can't be modified. Create a custom parameter group and tune key settings:
- PostgreSQL: `shared_buffers`, `work_mem`, `max_connections`, `statement_timeout`
- MySQL: `innodb_buffer_pool_size`, `max_connections`, `wait_timeout`

### 5. Enable Enhanced Monitoring

Enhanced Monitoring provides 1-second granularity OS-level metrics (CPU, memory, disk I/O, network). CloudWatch only provides 1-minute granularity. Essential for diagnosing performance issues.

### 6. Enable deletion protection

Prevents accidental cluster deletion via console, CLI, or IaC. Must be explicitly disabled before deletion.

### 7. Set backup retention to at least 7 days

Default is 1 day. For production, set 7-35 days. Backups are continuous and incremental — cost is minimal.

### 8. Enable minor version auto-upgrade

Keeps your cluster patched with security fixes. Aurora applies minor version upgrades during the maintenance window.

Reference: [Aurora best practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)

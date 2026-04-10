# Section Definitions

---

## 1. Data Modeling (model)

**Impact:** CRITICAL

**Description:** Partition key design, sort key patterns, GSI design, single-table vs multi-table. The foundation of every DynamoDB application — get this wrong and no amount of capacity fixes it.

## 2. Query Patterns (query)

**Impact:** CRITICAL

**Description:** Query vs Scan, pagination, filter expressions, projections. Understanding how DynamoDB reads data is essential to avoiding expensive full-table scans.

## 3. Performance & Throttling (perf)

**Impact:** CRITICAL

**Description:** Hot partitions, batch operations, adaptive capacity. DynamoDB throttles at the partition level, not the table level — even with excess overall capacity.

## 4. Operations (ops)

**Impact:** HIGH

**Description:** Transactions, TTL, DynamoDB Streams, error handling. Operational patterns that are easy to get wrong with subtle consequences.

## 5. Provisioning Gotchas (provision)

**Impact:** MEDIUM

**Description:** Capacity modes, auto-scaling lag, table class, PITR, GSI capacity, deletion protection.

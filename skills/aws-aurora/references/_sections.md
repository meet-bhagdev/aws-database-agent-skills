# Section Definitions

---

## 1. Connection Management (conn)

**Impact:** CRITICAL

**Description:** Reader endpoints, RDS Proxy, connection limits, and pooling. Aurora has hard connection limits based on instance class — exceeding them causes immediate failures.

## 2. Scaling & Serverless v2 (scale)

**Impact:** CRITICAL

**Description:** ACU configuration, read replicas, auto-scaling, and storage. Serverless v2 min ACU misconfiguration is the #1 cause of latency spikes.

## 3. Query Patterns (query)

**Impact:** HIGH

**Description:** Long-running transactions, Performance Insights, and query optimization. Aurora's shared storage model means replica behavior differs from vanilla MySQL/PostgreSQL.

## 4. High Availability & Replicas (ha)

**Impact:** HIGH

**Description:** Failover behavior, Global Database, and connection retry logic. Unhandled failover causes 30-60 seconds of application downtime.

## 5. Provisioning Gotchas (provision)

**Impact:** MEDIUM

**Description:** Instance class consistency, storage type, parameter groups, encryption, monitoring, and deletion protection.

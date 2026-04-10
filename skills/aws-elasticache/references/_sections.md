# Section Definitions

This file defines the rule categories for ElastiCache (Valkey) best practices.
Rules are assigned to sections based on their filename prefix.

---

## 1. Connection Management (conn)

**Impact:** CRITICAL

**Description:** Connection pooling, cluster-aware clients, timeout configuration, and TLS setup. Misconfigured connections are the #1 cause of ElastiCache production incidents.

## 2. Performance (perf)

**Impact:** CRITICAL

**Description:** Avoiding blocking commands (KEYS), big keys, hot keys, and using pipelining. Single-threaded Valkey means one slow command blocks all clients.

## 3. Data Structure Patterns (data)

**Impact:** HIGH

**Description:** Choosing the right Valkey data structure for the use case and efficient serialization. Using strings for everything wastes memory and forces full deserialization.

## 4. Caching Patterns (cache)

**Impact:** HIGH

**Description:** Cache-aside, write-through, invalidation strategies, and thundering herd prevention. Incorrect caching patterns cause stale data, cache stampedes, or unnecessary load on the source of truth.

## 5. Cluster Mode (cluster)

**Impact:** MEDIUM

**Description:** Hash slot awareness, hash tags for multi-key operations, and cluster topology. Required knowledge when using cluster mode enabled configurations.

## 6. Provisioning Gotchas (provision)

**Impact:** MEDIUM

**Description:** Common infrastructure mistakes when creating ElastiCache clusters — cluster mode settings, node types, parameter groups, encryption, and serverless configuration.

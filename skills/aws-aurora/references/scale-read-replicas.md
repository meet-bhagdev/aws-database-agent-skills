---
title: Use Aurora Auto Scaling for Read Replicas
impact: HIGH
impactDescription: Auto-scaling readers handle traffic spikes without manual intervention
tags: read-replicas, auto-scaling, custom-endpoints, scaling
---

## Use Aurora Auto Scaling for Read Replicas

A single writer instance handling all traffic is a single point of bottleneck. Aurora Auto Scaling adds and removes read replicas based on CloudWatch metrics (CPU, connections).

**Incorrect (single instance, no replicas):**

A single `db.r6g.xlarge` writer handling both reads and writes. When traffic spikes, the instance maxes out CPU and queries slow down.

**Correct (writer + auto-scaling readers):**

```python
import boto3

appautoscaling = boto3.client('application-autoscaling')

# Register the Aurora cluster as a scalable target
appautoscaling.register_scalable_target(
    ServiceNamespace='rds',
    ResourceId='cluster:my-cluster',
    ScalableDimension='rds:cluster:ReadReplicaCount',
    MinCapacity=1,
    MaxCapacity=5,
)

# Scale based on average CPU utilization
appautoscaling.put_scaling_policy(
    PolicyName='aurora-cpu-scaling',
    ServiceNamespace='rds',
    ResourceId='cluster:my-cluster',
    ScalableDimension='rds:cluster:ReadReplicaCount',
    PolicyType='TargetTrackingScaling',
    TargetTrackingScalingPolicyConfiguration={
        'TargetValue': 60.0,  # Target 60% CPU
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'RDSReaderAverageCPUUtilization',
        },
        'ScaleInCooldown': 300,
        'ScaleOutCooldown': 300,
    },
)
```

For routing specific workloads (analytics, reporting) to dedicated replicas, use custom endpoints:

```python
rds = boto3.client('rds')

rds.create_db_cluster_endpoint(
    DBClusterIdentifier='my-cluster',
    DBClusterEndpointIdentifier='analytics-endpoint',
    EndpointType='READER',
    StaticMembers=['my-cluster-analytics-replica'],
)
```

Reference: [Aurora Auto Scaling](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Integrating.AutoScaling.html)

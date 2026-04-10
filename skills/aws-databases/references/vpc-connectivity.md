---
title: VPC Connectivity for AWS Databases
impact: HIGH
impactDescription: Misconfigured VPC settings are the #1 cause of "can't connect to database" issues
tags: vpc, security-groups, subnet-groups, connectivity
---

## VPC Connectivity for AWS Databases

### Security Groups

Every AWS database (except DynamoDB) requires a security group. The most common connectivity issue is a missing or misconfigured security group rule.

**Incorrect (overly permissive):**

```python
# NEVER do this — allows all traffic from anywhere
ec2.authorize_security_group_ingress(
    GroupId='sg-database',
    IpPermissions=[{
        'IpProtocol': '-1',
        'IpRanges': [{'CidrIp': '0.0.0.0/0'}],  # Open to the world!
    }],
)
```

**Correct (restrict to application security group):**

```python
import boto3

ec2 = boto3.client('ec2')

# Allow only the application security group to access the database
ec2.authorize_security_group_ingress(
    GroupId='sg-database',
    IpPermissions=[{
        'IpProtocol': 'tcp',
        'FromPort': 5432,  # PostgreSQL (3306 for MySQL, 6379 for Valkey)
        'ToPort': 5432,
        'UserIdGroupPairs': [{'GroupId': 'sg-application'}],
    }],
)
```

### VPC Endpoints

- **DynamoDB** — use a gateway VPC endpoint (free). Keeps traffic off the public internet.
- **ElastiCache** — always in a VPC, no endpoint needed. Access from within the VPC only.
- **Aurora** — always in a VPC. Use RDS Proxy for Lambda access.

```python
ec2 = boto3.client('ec2')

# Create a gateway endpoint for DynamoDB (free)
ec2.create_vpc_endpoint(
    VpcId='vpc-xxx',
    ServiceName='com.amazonaws.us-east-1.dynamodb',
    VpcEndpointType='Gateway',
    RouteTableIds=['rtb-xxx'],
)
```

### Subnet Groups

Aurora and ElastiCache require subnet groups spanning at least 2 AZs for high availability.

```python
rds = boto3.client('rds')

rds.create_db_subnet_group(
    DBSubnetGroupName='my-db-subnets',
    DBSubnetGroupDescription='Private subnets for Aurora',
    SubnetIds=['subnet-az1-private', 'subnet-az2-private'],
)
```

Reference: [VPC and database connectivity](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_VPC.html)

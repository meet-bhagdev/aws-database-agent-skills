---
title: Handle DynamoDB Streams Errors Correctly
impact: HIGH
impactDescription: Unhandled stream errors cause infinite retry loops or data loss
tags: streams, lambda, error-handling, dlq
---

## Handle DynamoDB Streams Errors Correctly

When a Lambda function processing DynamoDB Streams throws an error, Lambda retries the entire batch until it succeeds or the record expires (24 hours). A single poison record blocks all subsequent records in that shard.

**Incorrect (any error retries the entire batch forever):**

```python
def handler(event, context):
    for record in event['Records']:
        item = record['dynamodb']['NewImage']
        process_item(item)  # If this throws on one record, ALL records retry forever
```

**Correct (bisect on error, DLQ, max retries):**

```python
import json
import logging

logger = logging.getLogger()

def handler(event, context):
    failures = []
    for record in event['Records']:
        try:
            item = record['dynamodb'].get('NewImage', {})
            process_item(item)
        except Exception as e:
            logger.error(f"Failed to process record {record['eventID']}: {e}")
            failures.append({'itemIdentifier': record['eventID']})

    # Return failed items — Lambda retries only these (requires ReportBatchItemFailures)
    return {'batchItemFailures': failures}
```

```javascript
export async function handler(event) {
  const failures = [];

  for (const record of event.Records) {
    try {
      const item = record.dynamodb?.NewImage;
      await processItem(item);
    } catch (err) {
      console.error(`Failed record ${record.eventID}:`, err);
      failures.push({ itemIdentifier: record.eventID });
    }
  }

  return { batchItemFailures: failures };
}
```

Event source mapping configuration (CloudFormation/CDK):

```yaml
# Enable partial batch failure reporting and configure error handling
EventSourceMapping:
  Type: AWS::Lambda::EventSourceMapping
  Properties:
    FunctionName: !Ref ProcessorFunction
    EventSourceArn: !GetAtt Table.StreamArn
    StartingPosition: TRIM_HORIZON
    BatchSize: 100
    MaximumRetryAttempts: 3
    BisectBatchOnFunctionError: true
    MaximumRecordAgeInSeconds: 3600
    FunctionResponseTypes:
      - ReportBatchItemFailures
    DestinationConfig:
      OnFailure:
        Destination: !GetAtt DLQ.Arn
```

Key settings:
- `FunctionResponseTypes: [ReportBatchItemFailures]` — enables partial batch failure reporting
- `BisectBatchOnFunctionError: true` — splits the batch in half on error to isolate the poison record
- `MaximumRetryAttempts: 3` — limits retries instead of retrying for 24 hours
- `DestinationConfig.OnFailure` — sends failed records to a DLQ for investigation

Reference: [DynamoDB Streams and Lambda](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html)

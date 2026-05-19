#!/bin/sh
set -eu

# Provisions the EventBridge bus the API publishes to, plus a rule per
# bounded context that filters by detail-type and forwards to the
# consumer's SQS queue. Mirrors what would live in Terraform in prod.

BUS_NAME="boilerplate-bus"
NOTIFICATION_QUEUE_NAME="notification-emails"
NOTIFICATION_RULE_NAME="notification-quote-sent"
AWS_REGION_DEFAULT="${AWS_DEFAULT_REGION:-eu-west-1}"
AWS_ACCOUNT_ID="000000000000"

awslocal events create-event-bus --name "$BUS_NAME" >/dev/null
echo "[localstack-init] event bus '$BUS_NAME' ready"

QUEUE_ARN="arn:aws:sqs:${AWS_REGION_DEFAULT}:${AWS_ACCOUNT_ID}:${NOTIFICATION_QUEUE_NAME}"

awslocal events put-rule \
    --name "$NOTIFICATION_RULE_NAME" \
    --event-bus-name "$BUS_NAME" \
    --event-pattern '{"detail-type":["quote.sent"]}' \
    >/dev/null

awslocal events put-targets \
    --rule "$NOTIFICATION_RULE_NAME" \
    --event-bus-name "$BUS_NAME" \
    --targets "Id=1,Arn=${QUEUE_ARN}" \
    >/dev/null

echo "[localstack-init] rule '$NOTIFICATION_RULE_NAME' → queue '$NOTIFICATION_QUEUE_NAME' ready"

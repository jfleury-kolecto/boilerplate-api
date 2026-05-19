#!/bin/sh
set -eu

# LocalStack runs this on container readiness. Creates the per-context
# SQS queues that EventBridge rules target (see 02-init-eventbridge.sh).
awslocal sqs create-queue --queue-name notification-emails
echo "[localstack-init] queue 'notification-emails' ready"

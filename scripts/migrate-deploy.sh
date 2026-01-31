#!/bin/bash

echo "Checking for failed migrations..."

# Check migrate status and look for failed migrations
MIGRATE_OUTPUT=$(npx prisma migrate status 2>&1 || true)

# Extract failed migration name if any (compatible with both macOS and Linux)
FAILED_MIGRATION=$(echo "$MIGRATE_OUTPUT" | grep "migration.*failed" | sed -n 's/.*`\([^`]*\)` migration.*failed.*/\1/p' | head -1 || true)

if [ -n "$FAILED_MIGRATION" ]; then
    echo "Found failed migration: $FAILED_MIGRATION"
    echo "Marking as rolled back to retry..."
    npx prisma migrate resolve --rolled-back "$FAILED_MIGRATION"
    echo "Resolved."
fi

echo "Running prisma migrate deploy..."
DEPLOY_OUTPUT=$(npx prisma migrate deploy 2>&1) || {
    # If deploy failed, check if it's due to a failed migration
    echo "$DEPLOY_OUTPUT"
    FAILED_MIGRATION=$(echo "$DEPLOY_OUTPUT" | grep "migration.*failed" | sed -n 's/.*`\([^`]*\)` migration.*failed.*/\1/p' | head -1 || true)

    if [ -n "$FAILED_MIGRATION" ]; then
        echo "Found failed migration in deploy output: $FAILED_MIGRATION"
        echo "Marking as rolled back to retry..."
        npx prisma migrate resolve --rolled-back "$FAILED_MIGRATION"
        echo "Retrying deploy..."
        npx prisma migrate deploy
    else
        exit 1
    fi
}

echo "$DEPLOY_OUTPUT"

echo "Running custom migrations..."
cd scripts && bash custom_migration.sh

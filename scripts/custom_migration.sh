#!/bin/bash

# Custom Migration Script
# Runs any .sql files in prisma/custom_migrations/ via psql

set -e

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

CUSTOM_DIR="$PROJECT_ROOT/prisma/custom_migrations"

if [ ! -d "$CUSTOM_DIR" ]; then
    echo "No custom_migrations directory found, skipping."
    exit 0
fi

SQL_FILES=$(find "$CUSTOM_DIR" -name "*.sql" -type f | sort)

if [ -z "$SQL_FILES" ]; then
    echo "No custom migration SQL files found."
    exit 0
fi

# Parse DIRECT_URL for psql connection
if [ -z "$DIRECT_URL" ]; then
    echo "DIRECT_URL is not set, skipping custom migrations."
    exit 0
fi

echo "Running custom migrations..."
for sql_file in $SQL_FILES; do
    echo "  Executing: $(basename "$sql_file")"
    psql "$DIRECT_URL" -f "$sql_file"
done

echo "Custom migrations complete."

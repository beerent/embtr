#!/bin/bash

# Get the script's directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

INPUT_FILE="$PROJECT_ROOT/prisma/schema.ts"
OUTPUT_FILE="$PROJECT_ROOT/prisma/raw_schema.ts"

gsed -E \
  -e 's/^(\s*export interface\s+)([A-Za-z]+Model)/\1Raw\2/g' \
  -e 's/(\s+[a-zA-Z_][a-zA-Z0-9_]*): /\1?: /g' \
  -e 's/(\?: )([A-Z][a-zA-Z0-9_]*Model)(\[\])?/\1Raw\2\3/g' \
  "$INPUT_FILE" > "$OUTPUT_FILE"

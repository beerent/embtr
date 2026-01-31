#!/bin/bash

# Get the script's directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"
pal schema typescript -o "$PROJECT_ROOT/prisma"
gsed -i 's/ | null//g' "$PROJECT_ROOT/prisma/schema.ts"

# First, update the interface declarations
gsed -i 's/interface \([a-zA-Z0-9_]\+\)/interface \1Model/g' "$PROJECT_ROOT/prisma/schema.ts"

# Then, update the references to these interfaces in array types and properties, excluding Date
gsed -i 's/\(?\?: \)\([A-Z][a-zA-Z0-9_]*\)\(\[\]\)\?/\1\2Model\3/g; s/DateModel/Date/g' "$PROJECT_ROOT/prisma/schema.ts"

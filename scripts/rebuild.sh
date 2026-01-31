#!/bin/bash

# Get the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$SCRIPT_DIR/rebuild_core.sh"
"$SCRIPT_DIR/rebuild_raw.sh"

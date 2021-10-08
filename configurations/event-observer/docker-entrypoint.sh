#!/bin/sh

# Abort on any error (including if wait-for-it fails).
set -e

./wait-for-it.sh "$CHAINLINK_HOST:${CHAINLINK_PORT:-6688}" --strict --timeout=300

# Run the main container command.
exec "$@"

#!/bin/sh

# Abort on any error (including if wait-for-it fails).
set -e

# Wait for the chainlink node to be up, if we know where it is.
# echo "Here is $STACKS_BLOCKCHAIN_API_HOST"
# if [ -n "$STACKS_BLOCKCHAIN_API_HOST" ]; then
#   ./wait-for-it.sh "$STACKS_BLOCKCHAIN_API_HOST:${STACKS_BLOCKCHAIN_API_PORT:-3999}" --strict --timeout=300
# fi

./wait-for-it.sh "$CHAINLINK_HOST:${CHAINLINK_PORT:-6688}" --strict --timeout=300

# if [ -n "$CHAINLINK_HOST" ]; then
#   ./wait-for-it.sh "$CHAINLINK_HOST:${CHAINLINK_PORT:-6688}" --strict --timeout=300
# fi

# if [ -n "$STACKS_BLOCKCHAIN_HOST" ]; then
#   ./wait-for-it.sh "$STACKS_BLOCKCHAIN_HOST:${STACKS_BLOCKCHAIN_PORT:-20443}" --strict --timeout=300
# fi

# Run the main container command.
exec "$@"

#!/usr/bin/env bash
# Comprehensive setup script for Whisper WebGPU
# This script installs Node.js (via nvm if needed), installs npm dependencies,
# and runs linting and tests to verify the environment.
set -euo pipefail

REQUIRED_NODE_MAJOR=18

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Load nvm if available
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
fi

if ! command_exists node; then
  echo "Node.js not found. Installing via nvm..."
  if ! command_exists nvm; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    # shellcheck source=/dev/null
    . "$HOME/.nvm/nvm.sh"
  fi
  nvm install $REQUIRED_NODE_MAJOR
  nvm use $REQUIRED_NODE_MAJOR
else
  NODE_MAJOR=$(node -v | sed -E 's/v([0-9]+).*/\1/')
  if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
    echo "Node.js version < $REQUIRED_NODE_MAJOR. Installing required version via nvm..."
    if ! command_exists nvm; then
      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
      # shellcheck source=/dev/null
      . "$HOME/.nvm/nvm.sh"
    fi
    nvm install $REQUIRED_NODE_MAJOR
    nvm use $REQUIRED_NODE_MAJOR
  fi
fi

# Install dependencies
if [ ! -d node_modules ]; then
  echo "Installing npm dependencies..."
  npm install
fi

# Run lint and tests
npm run lint
npm test

echo "Setup complete." 

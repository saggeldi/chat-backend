#!/bin/bash

# Create the directory structure
mkdir -p \
  src/domain/entities \
  src/domain/repositories \
  src/domain/services \
  src/application/use-cases \
  src/application/dtos \
  src/infrastructure/socket-io \
  src/infrastructure/fcm \
  src/infrastructure/database \
  src/presentation/http \
  src/presentation/websocket

# Create empty .gitkeep files in each directory to preserve structure in Git
find src -type d -exec touch {}/.gitkeep \;

# Display created structure
echo "Folder structure created:"
tree src

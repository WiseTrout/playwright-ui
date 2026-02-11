#!/bin/sh

# 1. If the mounted ui-lib is empty, copy the library files into it
if [ -z "$(ls -A /app/ui-lib)" ]; then
   echo "Populating ui-lib..."
   cp -r /app/ui-lib-backup/. /app/ui-lib/
fi

cd /app

# Optionally install dependencies.
if [ ! -d "/app/node_modules" ] || [ -z "$(ls -A /app/node_modules 2>/dev/null)" ]; then
  echo "Installing dependencies..."
  npm install
fi

chown -R ubuntu /app

# 3. Execute the CMD (by default, "node app.js")
exec gosu ubuntu "$@"
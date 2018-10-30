#!/usr/bin/env bash

if [ ! -d "./node_modules" ]; then
    echo "Node modules not found. Installing."
    npm install
else
    echo "Running npm update check."
    $( npm update )
fi

echo "Ready. Running tests."
node ./tests/config.js

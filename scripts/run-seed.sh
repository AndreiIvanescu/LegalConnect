#!/bin/bash

# Install node-fetch if needed
npm install node-fetch@2

# Run the seed script
NODE_ENV=development node scripts/seed-providers.js
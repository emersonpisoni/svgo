#!/bin/bash

echo ""
echo "========================================="
echo "  Build Tool: WITH SVGO vs WITHOUT SVGO"
echo "========================================="
echo ""

echo "Building WITHOUT SVGO..."
npx vite build --config vite.config.no-svgo.ts --outDir dist-no-svgo --logLevel silent 2>/dev/null
NO_SVGO=$(du -sh dist-no-svgo/assets/*.js | awk '{print $1}')
NO_SVGO_BYTES=$(wc -c < dist-no-svgo/assets/*.js | tr -d ' ')

echo "Building WITH SVGO..."
npx vite build --outDir dist-with-svgo --logLevel silent 2>/dev/null
WITH_SVGO=$(du -sh dist-with-svgo/assets/*.js | awk '{print $1}')
WITH_SVGO_BYTES=$(wc -c < dist-with-svgo/assets/*.js | tr -d ' ')

# Result
DIFF=$((NO_SVGO_BYTES - WITH_SVGO_BYTES))

echo ""
echo "-----------------------------------------"
echo "  WITHOUT SVGO (JS bundle):  $NO_SVGO ($NO_SVGO_BYTES bytes)"
echo "  WITH SVGO (JS bundle):     $WITH_SVGO ($WITH_SVGO_BYTES bytes)"
echo "  Difference:                $DIFF bytes less"
echo "-----------------------------------------"
echo ""

# Cleanup
rm -rf dist-no-svgo dist-with-svgo
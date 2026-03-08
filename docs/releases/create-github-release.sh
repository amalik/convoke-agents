#!/bin/bash

# Convoke v1.0.3-alpha Release Creation Script
# Run this after: git push

echo "Creating GitHub release for v1.0.3-alpha..."
echo ""

# Create the release using gh CLI
gh release create v1.0.3-alpha \
  --title "Convoke v1.0.3-alpha - User-Friendly npx Installation" \
  --notes-file RELEASE-NOTES-v1.0.3-alpha.md \
  --prerelease \
  --target main

echo ""
echo "✅ Release created successfully!"
echo ""
echo "View at: https://github.com/amalik/convoke-agents/releases/tag/v1.0.3-alpha"

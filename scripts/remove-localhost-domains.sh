#!/bin/bash
# Remove localhost entries for marketing sites

echo "Removing localhost entries for tipjar.live and djdash.net..."
sudo sed -i '' '/tipjar.live/d' /etc/hosts
sudo sed -i '' '/djdash.net/d' /etc/hosts
echo "Done! Entries removed."

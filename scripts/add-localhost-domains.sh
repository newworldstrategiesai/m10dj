#!/bin/bash
# Add localhost entries for marketing sites

echo "Adding localhost entries for tipjar.live and djdash.net..."
echo "127.0.0.1    tipjar.live" | sudo tee -a /etc/hosts
echo "127.0.0.1    www.tipjar.live" | sudo tee -a /etc/hosts
echo "127.0.0.1    djdash.net" | sudo tee -a /etc/hosts
echo "127.0.0.1    www.djdash.net" | sudo tee -a /etc/hosts
echo "Done! You can now access:"
echo "  - http://tipjar.live:3002"
echo "  - http://djdash.net:3002"

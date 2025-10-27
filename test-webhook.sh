#!/bin/bash

# Test Messenger Webhook Verification
echo "Testing Messenger webhook verification..."
curl "https://www.m10djcompany.com/api/messenger/webhook?hub.mode=subscribe&hub.verify_token=4dc7fdb1e875ce0c8b97570e2c7b9d3d12545c23038e3f7fc88a4cf855988616&hub.challenge=test_challenge_123"

echo -e "\n\n"

# Test Instagram Webhook Verification  
echo "Testing Instagram webhook verification..."
curl "https://www.m10djcompany.com/api/instagram/webhook?hub.mode=subscribe&hub.verify_token=f46e19ef1587bf5f6800224810eb48f354ad225958941197a4d186d2c4444202&hub.challenge=test_challenge_456"

echo -e "\n\nDone!"


#!/usr/bin/env node

/**
 * Test Webhook Script
 * Simulates incoming Instagram and Messenger webhook notifications
 * for testing and demo purposes
 */

const axios = require('axios');

const WEBHOOK_BASE_URL = process.env.WEBHOOK_URL || 'https://www.m10djcompany.com';

// Sample Instagram webhook payloads
const instagramMessages = [
  {
    object: "instagram",
    entry: [{
      id: "17841400008460056",
      time: Date.now() - 3600000,
      messaging: [{
        sender: { id: "123456789" },
        recipient: { id: "17841400008460056" },
        timestamp: Date.now() - 3600000,
        message: {
          mid: "msg_ig_001",
          text: "Hi! Do you have availability for a wedding on June 15th?"
        }
      }]
    }]
  },
  {
    object: "instagram",
    entry: [{
      id: "17841400008460056",
      time: Date.now() - 7200000,
      messaging: [{
        sender: { id: "987654321" },
        recipient: { id: "17841400008460056" },
        timestamp: Date.now() - 7200000,
        message: {
          mid: "msg_ig_002",
          text: "What are your rates for a corporate event in downtown Memphis?"
        }
      }]
    }]
  },
  {
    object: "instagram",
    entry: [{
      id: "17841400008460056",
      time: Date.now() - 10800000,
      messaging: [{
        sender: { id: "456789123" },
        recipient: { id: "17841400008460056" },
        timestamp: Date.now() - 10800000,
        message: {
          mid: "msg_ig_003",
          text: "I'm interested in booking you for my daughter's sweet 16 party. Can you send me more info?"
        }
      }]
    }]
  },
  {
    object: "instagram",
    entry: [{
      id: "17841400008460056",
      time: Date.now() - 14400000,
      messaging: [{
        sender: { id: "789123456" },
        recipient: { id: "17841400008460056" },
        timestamp: Date.now() - 14400000,
        message: {
          mid: "msg_ig_004",
          text: "Do you provide sound equipment for outdoor events? We're planning a graduation party."
        }
      }]
    }]
  },
  {
    object: "instagram",
    entry: [{
      id: "17841400008460056",
      time: Date.now() - 18000000,
      messaging: [{
        sender: { id: "321654987" },
        recipient: { id: "17841400008460056" },
        timestamp: Date.now() - 18000000,
        message: {
          mid: "msg_ig_005",
          text: "Hey! Loved your work at my friend's wedding. Looking to book you for ours on October 12th!"
        }
      }]
    }]
  }
];

// Sample Messenger webhook payloads
const messengerMessages = [
  {
    object: "page",
    entry: [{
      id: "PAGE_ID",
      time: Date.now() - 21600000,
      messaging: [{
        sender: { id: "111222333" },
        recipient: { id: "PAGE_ID" },
        timestamp: Date.now() - 21600000,
        message: {
          mid: "msg_fb_001",
          text: "Hi there! I'm planning my wedding and need a DJ for March 20th. Are you available?"
        }
      }]
    }]
  },
  {
    object: "page",
    entry: [{
      id: "PAGE_ID",
      time: Date.now() - 25200000,
      messaging: [{
        sender: { id: "444555666" },
        recipient: { id: "PAGE_ID" },
        timestamp: Date.now() - 25200000,
        message: {
          mid: "msg_fb_002",
          text: "Can you handle a corporate holiday party for about 200 people?"
        }
      }]
    }]
  },
  {
    object: "page",
    entry: [{
      id: "PAGE_ID",
      time: Date.now() - 28800000,
      messaging: [{
        sender: { id: "777888999" },
        recipient: { id: "PAGE_ID" },
        timestamp: Date.now() - 28800000,
        message: {
          mid: "msg_fb_003",
          text: "What's included in your wedding DJ package? Looking for someone for July 4th weekend."
        }
      }]
    }]
  }
];

async function sendTestWebhooks() {
  console.log('🎵 M10 DJ Company - Webhook Test Script\n');
  console.log(`Sending test webhooks to: ${WEBHOOK_BASE_URL}\n`);

  let successCount = 0;
  let errorCount = 0;

  // Send Instagram messages
  console.log('📸 Sending Instagram test messages...');
  for (const payload of instagramMessages) {
    try {
      const response = await axios.post(
        `${WEBHOOK_BASE_URL}/api/instagram/webhook`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': 'sha256=test_signature'
          }
        }
      );
      console.log(`  ✅ Sent: "${payload.entry[0].messaging[0].message.text.substring(0, 50)}..."`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Send Messenger messages
  console.log('\n💬 Sending Messenger test messages...');
  for (const payload of messengerMessages) {
    try {
      const response = await axios.post(
        `${WEBHOOK_BASE_URL}/api/messenger/webhook`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': 'sha256=test_signature'
          }
        }
      );
      console.log(`  ✅ Sent: "${payload.entry[0].messaging[0].message.text.substring(0, 50)}..."`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✨ Test Complete!`);
  console.log(`   Success: ${successCount} messages`);
  console.log(`   Errors: ${errorCount} messages`);
  console.log('='.repeat(60));
  console.log('\n📊 View results at:');
  console.log(`   ${WEBHOOK_BASE_URL}/admin/instagram\n`);
}

// Run the script
sendTestWebhooks().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


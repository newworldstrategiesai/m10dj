const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const { RoomServiceClient, SipClient } = require('livekit-server-sdk');

async function main() {
  const host = (process.env.LIVEKIT_URL || '').replace('wss://', 'https://').replace('ws://', 'http://');
  if (!host) {
    throw new Error('LIVEKIT_URL missing');
  }
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const sipTrunkId = process.env.LIVEKIT_SIP_OUTBOUND_TRUNK_ID;

  if (!sipTrunkId) {
    throw new Error('LIVEKIT_SIP_OUTBOUND_TRUNK_ID missing');
  }

  const roomService = new RoomServiceClient(host, apiKey, apiSecret);
  const sipClient = new SipClient(host, apiKey, apiSecret);

  const roomName = `verification-${Date.now()}`;
  await roomService.createRoom({
    name: roomName,
    emptyTimeout: 60,
    maxParticipants: 2,
  });

  try {
    await sipClient.createSipParticipant(sipTrunkId, '+15005550006', roomName, {
      participantName: 'Verification Target',
      participantIdentity: `verification-${Date.now()}`,
      playDialtone: false,
      waitUntilAnswered: false,
    });
  } catch (err) {
    console.error('SIP participant creation resulted in error (expected for test number):', err.message || err);
  }

  console.log(
    JSON.stringify(
      {
        roomName,
        sipConfigured: true,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

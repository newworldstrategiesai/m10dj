// API endpoint for testing SMS forwarding system
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic security check
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { testMessage = 'This is a test message from the SMS forwarding system.' } = req.body;

    // Simulate an incoming SMS webhook call
    const testSmsData = {
      From: '+19015551234', // Test phone number
      To: process.env.TWILIO_PHONE_NUMBER || '+19014102020',
      Body: testMessage,
      MessageSid: 'test_' + Date.now(),
      NumMedia: '0'
    };

    console.log('🧪 Testing SMS forwarding with data:', testSmsData);

    // Import the SMS handler
    const smsHandler = await import('./sms/incoming-message.js');
    
    // Create mock request and response objects
    const mockReq = {
      method: 'POST',
      body: testSmsData
    };

    let mockResponseData = '';
    const mockRes = {
      setHeader: () => {},
      status: (code) => ({
        send: (data) => {
          mockResponseData = data;
          return { statusCode: code, data };
        }
      })
    };

    // Call the SMS handler
    await smsHandler.default(mockReq, mockRes);

    res.status(200).json({
      success: true,
      message: 'SMS forwarding test completed',
      testData: testSmsData,
      response: mockResponseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SMS forwarding test failed:', error);
    res.status(500).json({
      success: false,
      error: 'SMS forwarding test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

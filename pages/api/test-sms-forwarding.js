// API endpoint for testing SMS forwarding system
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { logger } from '@/utils/logger';

export default async function handler(req, res) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here

    const { testMessage = 'This is a test message from the SMS forwarding system.' } = req.body;

    // Simulate an incoming SMS webhook call
    const testSmsData = {
      From: '+19015551234', // Test phone number
      To: process.env.TWILIO_PHONE_NUMBER || '+19014102020', // TODO: Use getEnv() for consistency
      Body: testMessage,
      MessageSid: 'test_' + Date.now(),
      NumMedia: '0'
    };

    logger.info('Testing SMS forwarding', { testData: testSmsData });

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
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('SMS forwarding test failed', error);
    res.status(500).json({
      success: false,
      error: 'SMS forwarding test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

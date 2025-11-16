import { sendAdminNotification } from '../../../utils/admin-notifications';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventType, data } = req.body;

  if (!eventType || !data) {
    return res.status(400).json({ error: 'eventType and data are required' });
  }

  try {
    // Send notification (non-blocking)
    sendAdminNotification(eventType, data).catch(err => {
      console.error('Notification error:', err);
    });

    res.status(200).json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Error in admin notification API:', error);
    res.status(500).json({ error: 'Failed to send notification', details: error.message });
  }
}


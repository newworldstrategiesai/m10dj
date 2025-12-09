/**
 * Stream Alerts Helper Functions
 * Use these functions to broadcast alerts from your webhooks and payment handlers
 */

interface TipAlertData {
  amount: number;
  name: string;
  message?: string;
}

interface SongRequestAlertData {
  song_title: string;
  artist: string;
  name: string;
}

interface MerchPurchaseAlertData {
  item_name: string;
  name: string;
}

interface FollowerAlertData {
  name: string;
}

interface SubscriberAlertData {
  name: string;
  tier?: string;
}

type AlertEventData = 
  | TipAlertData 
  | SongRequestAlertData 
  | MerchPurchaseAlertData 
  | FollowerAlertData 
  | SubscriberAlertData;

/**
 * Broadcast a stream alert
 */
export async function broadcastStreamAlert(
  userId: string,
  eventType: 'tip' | 'song_request' | 'merch_purchase' | 'follower' | 'subscriber',
  eventData: AlertEventData
): Promise<{ success: boolean; alert_id?: string; error?: string }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${apiUrl}/api/tipjar/stream-alerts/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to broadcast alert:', errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return { success: true, alert_id: data.alert_id };
  } catch (error) {
    console.error('Error broadcasting alert:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Helper function to broadcast a tip alert
 */
export async function broadcastTipAlert(
  userId: string,
  amount: number,
  name: string,
  message?: string
) {
  return broadcastStreamAlert(userId, 'tip', { amount, name, message });
}

/**
 * Helper function to broadcast a song request alert
 */
export async function broadcastSongRequestAlert(
  userId: string,
  songTitle: string,
  artist: string,
  name: string
) {
  return broadcastStreamAlert(userId, 'song_request', { song_title: songTitle, artist, name });
}

/**
 * Helper function to broadcast a merch purchase alert
 */
export async function broadcastMerchPurchaseAlert(
  userId: string,
  itemName: string,
  name: string
) {
  return broadcastStreamAlert(userId, 'merch_purchase', { item_name: itemName, name });
}

/**
 * Helper function to broadcast a follower alert
 */
export async function broadcastFollowerAlert(userId: string, name: string) {
  return broadcastStreamAlert(userId, 'follower', { name });
}

/**
 * Helper function to broadcast a subscriber alert
 */
export async function broadcastSubscriberAlert(userId: string, name: string, tier?: string) {
  return broadcastStreamAlert(userId, 'subscriber', { name, tier });
}


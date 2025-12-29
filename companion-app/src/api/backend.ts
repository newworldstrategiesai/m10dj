/**
 * Backend API Client
 * 
 * Communicates with the SaaS backend to send track events
 * and maintain connection status.
 */

import { logger } from '../utils/logger';
import { getPlatform } from '../utils/paths';

export interface TrackEvent {
  artist: string;
  title: string;
  played_at: string;
  deck?: string;
  bpm?: number;
}

export interface SendTrackOptions {
  detection_method: 'text_file' | 'serato_history' | 'live_playlists' | 'websocket' | 'manual';
  source_file?: string;
}

export interface BackendResponse {
  success: boolean;
  play_id?: string;
  matched?: boolean;
  matched_request_id?: string;
  error?: string;
}

export class BackendAPI {
  private apiUrl: string;
  private authToken: string | null = null;
  private appVersion: string;
  private platform: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(apiUrl: string, appVersion: string = '1.0.0') {
    this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.appVersion = appVersion;
    this.platform = getPlatform();
  }

  /**
   * Set the authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    logger.debug('Auth token set');
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.authToken !== null;
  }

  /**
   * Send a "Now Playing" event to the backend
   */
  async sendNowPlaying(
    track: TrackEvent,
    options: SendTrackOptions
  ): Promise<BackendResponse> {
    if (!this.authToken) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    const payload = {
      track: {
        artist: track.artist,
        title: track.title,
        played_at: track.played_at,
        deck: track.deck,
        bpm: track.bpm
      },
      detection_method: options.detection_method,
      source_file: options.source_file,
      platform: this.platform,
      app_version: this.appVersion
    };

    logger.debug('Sending track to backend', payload);

    try {
      const response = await fetch(`${this.apiUrl}/api/serato/now-playing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json() as {
        error?: string;
        play_id?: string;
        matched?: boolean;
        matched_request_id?: string;
      };

      if (!response.ok) {
        logger.error('Backend error', data);
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`
        };
      }

      logger.info('Track sent to backend', {
        play_id: data.play_id,
        matched: data.matched
      });

      return {
        success: true,
        play_id: data.play_id,
        matched: data.matched,
        matched_request_id: data.matched_request_id
      };

    } catch (error: any) {
      logger.error('Failed to send track to backend', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send a heartbeat to maintain connection status
   */
  async sendHeartbeat(): Promise<boolean> {
    if (!this.authToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/serato/connection-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          platform: this.platform,
          app_version: this.appVersion
        })
      });

      return response.ok;

    } catch (error) {
      // Silent fail for heartbeat - don't spam logs
      return false;
    }
  }

  /**
   * Start sending periodic heartbeats
   * @param intervalMs Interval between heartbeats in milliseconds (default: 30s)
   */
  startHeartbeat(intervalMs: number = 30000): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Send initial heartbeat
    this.sendHeartbeat();

    // Schedule periodic heartbeats
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, intervalMs);

    logger.debug(`Heartbeat started (every ${intervalMs / 1000}s)`);
  }

  /**
   * Stop sending heartbeats
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      logger.debug('Heartbeat stopped');
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    
    // Optionally notify backend of disconnect
    if (this.authToken) {
      try {
        await fetch(`${this.apiUrl}/api/serato/connection-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          body: JSON.stringify({
            platform: this.platform,
            app_version: this.appVersion,
            disconnecting: true
          })
        });
      } catch {
        // Ignore errors on disconnect
      }
    }

    this.authToken = null;
  }
}


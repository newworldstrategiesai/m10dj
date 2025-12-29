"use strict";
/**
 * Backend API Client
 *
 * Communicates with the SaaS backend to send track events
 * and maintain connection status.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendAPI = void 0;
const logger_1 = require("../utils/logger");
const paths_1 = require("../utils/paths");
class BackendAPI {
    apiUrl;
    authToken = null;
    appVersion;
    platform;
    heartbeatInterval = null;
    constructor(apiUrl, appVersion = '1.0.0') {
        this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
        this.appVersion = appVersion;
        this.platform = (0, paths_1.getPlatform)();
    }
    /**
     * Set the authentication token
     */
    setAuthToken(token) {
        this.authToken = token;
        logger_1.logger.debug('Auth token set');
    }
    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return this.authToken !== null;
    }
    /**
     * Send a "Now Playing" event to the backend
     */
    async sendNowPlaying(track, options) {
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
        logger_1.logger.debug('Sending track to backend', payload);
        try {
            const response = await fetch(`${this.apiUrl}/api/serato/now-playing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                logger_1.logger.error('Backend error', data);
                return {
                    success: false,
                    error: data.error || `HTTP ${response.status}`
                };
            }
            logger_1.logger.info('Track sent to backend', {
                play_id: data.play_id,
                matched: data.matched
            });
            return {
                success: true,
                play_id: data.play_id,
                matched: data.matched,
                matched_request_id: data.matched_request_id
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to send track to backend', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Send a heartbeat to maintain connection status
     */
    async sendHeartbeat() {
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
        }
        catch (error) {
            // Silent fail for heartbeat - don't spam logs
            return false;
        }
    }
    /**
     * Start sending periodic heartbeats
     * @param intervalMs Interval between heartbeats in milliseconds (default: 30s)
     */
    startHeartbeat(intervalMs = 30000) {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        // Send initial heartbeat
        this.sendHeartbeat();
        // Schedule periodic heartbeats
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, intervalMs);
        logger_1.logger.debug(`Heartbeat started (every ${intervalMs / 1000}s)`);
    }
    /**
     * Stop sending heartbeats
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            logger_1.logger.debug('Heartbeat stopped');
        }
    }
    /**
     * Disconnect and cleanup
     */
    async disconnect() {
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
            }
            catch {
                // Ignore errors on disconnect
            }
        }
        this.authToken = null;
    }
}
exports.BackendAPI = BackendAPI;
//# sourceMappingURL=backend.js.map
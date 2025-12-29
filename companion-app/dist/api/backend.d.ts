/**
 * Backend API Client
 *
 * Communicates with the SaaS backend to send track events
 * and maintain connection status.
 */
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
export declare class BackendAPI {
    private apiUrl;
    private authToken;
    private appVersion;
    private platform;
    private heartbeatInterval;
    constructor(apiUrl: string, appVersion?: string);
    /**
     * Set the authentication token
     */
    setAuthToken(token: string): void;
    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Send a "Now Playing" event to the backend
     */
    sendNowPlaying(track: TrackEvent, options: SendTrackOptions): Promise<BackendResponse>;
    /**
     * Send a heartbeat to maintain connection status
     */
    sendHeartbeat(): Promise<boolean>;
    /**
     * Start sending periodic heartbeats
     * @param intervalMs Interval between heartbeats in milliseconds (default: 30s)
     */
    startHeartbeat(intervalMs?: number): void;
    /**
     * Stop sending heartbeats
     */
    stopHeartbeat(): void;
    /**
     * Disconnect and cleanup
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=backend.d.ts.map
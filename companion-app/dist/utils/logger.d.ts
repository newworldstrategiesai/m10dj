/**
 * Simple logger for companion app
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
declare class Logger {
    private minLevel;
    setLevel(level: LogLevel): void;
    private shouldLog;
    private format;
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
    track(artist: string, title: string): void;
    banner(): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map
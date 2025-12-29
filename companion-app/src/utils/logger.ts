/**
 * Simple logger for companion app
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
};

const LOG_ICONS = {
  debug: '🔍',
  info: '✅',
  warn: '⚠️',
  error: '❌',
};

class Logger {
  private minLevel: LogLevel = 'info';

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private format(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toLocaleTimeString();
    const color = LOG_COLORS[level];
    const icon = LOG_ICONS[level];
    const reset = LOG_COLORS.reset;
    
    let output = `${color}[${timestamp}] ${icon} ${message}${reset}`;
    
    if (data !== undefined) {
      output += '\n' + JSON.stringify(data, null, 2);
    }
    
    return output;
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, data));
    }
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message, data));
    }
  }

  // Special formatting for track detection
  track(artist: string, title: string): void {
    console.log(`\n🎵 ${LOG_COLORS.info}Now Playing:${LOG_COLORS.reset}`);
    console.log(`   ${title}`);
    console.log(`   by ${artist}\n`);
  }

  // Banner for startup
  banner(): void {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║     🎵 Serato Play Detection Companion 🎵     ║');
    console.log('║                                               ║');
    console.log('║  Detects "Now Playing" and notifies requesters║');
    console.log('╚═══════════════════════════════════════════════╝');
    console.log('\n');
  }
}

export const logger = new Logger();


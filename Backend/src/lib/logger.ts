import { env } from '../config/env';

type Level = 'info' | 'warn' | 'error' | 'debug';

const LEVELS: Record<Level, number> = {
  info: 0,
  warn: 1,
  error: 2,
  debug: 3,
};

const MIN_LEVEL = LEVELS[env.NODE_ENV === 'production' ? 'error' : 'debug'];

function format(level: Level, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] ${level.toUpperCase()}`;
  return meta ? `${base} ${message} ${JSON.stringify(meta)}` : `${base} ${message}`;
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    if (LEVELS.info >= MIN_LEVEL) console.log(format('info', message, meta));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (LEVELS.warn >= MIN_LEVEL) console.warn(format('warn', message, meta));
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    if (LEVELS.error >= MIN_LEVEL) console.error(format('error', message, meta));
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (LEVELS.debug >= MIN_LEVEL) console.debug(format('debug', message, meta));
  },
};

import pino from 'pino';

const isBrowser = typeof window !== 'undefined';
const mode = import.meta.env.MODE;
const level = import.meta.env.VITE_LOG_LEVEL || 'info';

export const logger = pino({
  level,

  transport:
    !isBrowser && mode !== 'production'
      ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
      : undefined
});

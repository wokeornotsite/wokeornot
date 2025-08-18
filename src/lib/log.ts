// Lightweight logging wrapper. Uses console in dev, structured logs in prod.
export type LogFields = Record<string, unknown>;

const isProd = process.env.NODE_ENV === 'production';

function base(fields?: LogFields) {
  return {
    ts: new Date().toISOString(),
    ...(fields || {}),
  };
}

export const log = {
  info(msg: string, fields?: LogFields) {
    if (isProd) {
      console.log(JSON.stringify({ level: 'info', msg, ...base(fields) }));
    } else {
      console.info('[info]', msg, fields || '');
    }
  },
  warn(msg: string, fields?: LogFields) {
    if (isProd) {
      console.warn(JSON.stringify({ level: 'warn', msg, ...base(fields) }));
    } else {
      console.warn('[warn]', msg, fields || '');
    }
  },
  error(msg: string, fields?: LogFields) {
    if (isProd) {
      console.error(JSON.stringify({ level: 'error', msg, ...base(fields) }));
    } else {
      console.error('[error]', msg, fields || '');
    }
  },
};

import { log } from './log';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const SCORE_THRESHOLD = 0.5;

export type RecaptchaResult =
  | { ok: true; reason: 'not_configured' | 'verified' | 'network_error_failed_open'; score?: number }
  | { ok: false; reason: 'no_token' | 'low_score' | 'invalid_token'; score?: number; errorCodes?: string[] };

export async function verifyRecaptchaToken(token: string | undefined, remoteIp?: string): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return { ok: true, reason: 'not_configured' };
  }

  if (!token) {
    return { ok: false, reason: 'no_token' };
  }

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', token);
  if (remoteIp) params.set('remoteip', remoteIp);

  let data: any;
  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    data = await res.json();
  } catch (err) {
    // Fail open on network errors — don't lock real users out due to a Google outage
    log.warn('reCAPTCHA siteverify network error, failing open', { err: String(err) });
    return { ok: true, reason: 'network_error_failed_open' };
  }

  if (!data?.success) {
    return { ok: false, reason: 'invalid_token', errorCodes: data?.['error-codes'] };
  }

  const score = typeof data.score === 'number' ? data.score : 0;
  log.info('reCAPTCHA verified', { score, action: data.action, hostname: data.hostname });

  if (score < SCORE_THRESHOLD) {
    return { ok: false, reason: 'low_score', score };
  }

  return { ok: true, reason: 'verified', score };
}

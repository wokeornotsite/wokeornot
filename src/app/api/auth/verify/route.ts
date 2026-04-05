import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';
import { parseJson, schemas } from '@/lib/validation';
import { getWelcomeEmailHtml } from '@/lib/email-templates';
import { getPostHogClient } from '@/lib/posthog-server';

export async function GET(req: NextRequest) {
  const rl = rateLimitCheck(req as any, { limit: 20, windowMs: 60_000, route: 'auth_verify_get' });
  if (!rl.allowed && !rl.shadowed) {
    const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
    setRateLimitHeaders(res, rl);
    return res;
  }
  const token = req.nextUrl.searchParams.get('token');
  const email = req.nextUrl.searchParams.get('email');
  if (!token || !email) {
    const res = NextResponse.json({ error: 'Invalid verification link.' }, { status: 400 });
    setRateLimitHeaders(res, rl);
    return res;
  }
  const verification = await prisma.verificationToken.findFirst({ where: { identifier: email, token } });
  if (!verification || verification.expires < new Date()) {
    const res = NextResponse.json({ error: 'Verification link expired or invalid.' }, { status: 400 });
    setRateLimitHeaders(res, rl);
    return res;
  }
  const verifiedUser = await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  try { getPostHogClient().capture({ distinctId: verifiedUser.id, event: 'email_verified', properties: { email } }); } catch {}
  // Fire-and-forget welcome email
  (async () => {
    try {
      let transportConfig: any;
      if (process.env.EMAIL_HOST) {
        transportConfig = {
          host: process.env.EMAIL_HOST,
          port: Number(process.env.EMAIL_PORT || 587),
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        };
      } else {
        transportConfig = process.env.EMAIL_SERVER;
      }
      if (transportConfig) {
        const transporter = nodemailer.createTransport(transportConfig);
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: email,
          subject: 'Welcome to WokeOrNot!',
          text: `Welcome to WokeOrNot! Your account is now active. Visit https://wokeornot.net to get started.`,
          html: getWelcomeEmailHtml(verifiedUser.name || undefined),
        });
      }
    } catch (e) {
      console.error('[verify] welcome email error:', e);
    }
  })();
  const res = NextResponse.json({ success: true });
  setRateLimitHeaders(res, rl);
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimitCheck(req as any, { limit: 10, windowMs: 60_000, route: 'auth_verify_post' });
    if (!rl.allowed && !rl.shadowed) {
      const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
      setRateLimitHeaders(res, rl);
      return res;
    }
    const { token, email } = await parseJson(req as any, schemas.authVerifyPost);
    const verification = await prisma.verificationToken.findFirst({ where: { identifier: email, token } });
    if (!verification || verification.expires < new Date()) {
      const res = NextResponse.json({ error: 'Verification link expired or invalid.' }, { status: 400 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    const verifiedUserPost = await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    try { getPostHogClient().capture({ distinctId: verifiedUserPost.id, event: 'email_verified', properties: { email } }); } catch {}
    // Fire-and-forget welcome email
    (async () => {
      try {
        let transportConfig: any;
        if (process.env.EMAIL_HOST) {
          transportConfig = {
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT || 587),
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          };
        } else {
          transportConfig = process.env.EMAIL_SERVER;
        }
        if (transportConfig) {
          const transporter = nodemailer.createTransport(transportConfig);
          await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to WokeOrNot!',
            text: `Welcome to WokeOrNot! Your account is now active. Visit https://wokeornot.net to get started.`,
            html: getWelcomeEmailHtml(verifiedUserPost.name || undefined),
          });
        }
      } catch (e) {
        console.error('[verify] welcome email error:', e);
      }
    })();
    const res = NextResponse.json({ success: true });
    setRateLimitHeaders(res, rl);
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

import { z } from 'zod';
import { NextRequest } from 'next/server';

// Create a custom error type with status
export class ValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ValidationError';
    this.status = status;
  }
}

export async function parseJson<T extends z.ZodTypeAny>(req: NextRequest | Request, schema: T) {
  const json = await req.json();
  const result = schema.safeParse(json);
  if (!result.success) {
    const message = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new ValidationError(message, 400);
  }
  return result.data as z.infer<T>;
}

// Very conservative sanitizer that escapes HTML to prevent XSS. Allows no HTML tags.
// For richer formatting, replace with a library like `sanitize-html` and a safe allowlist.
export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// For plain-text fields rendered as React text nodes (reviews, comments, usernames, forum posts).
// React automatically escapes text nodes, so HTML-encoding is not needed and causes &#39; etc.
// to display literally. This function only strips dangerous control characters.
export function sanitizePlainText(input: string): string {
  return input
    .trim()
    // Strip null bytes and non-printable control characters (keep tab \x09, newline \x0A, CR \x0D)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export const schemas = {
  reaction: z.object({ reaction: z.enum(['like', 'dislike']) }),
  reviewCreate: z.object({
    rating: z.number().min(0).max(10),
    text: z.string().max(5000).optional().default(''),
    categoryIds: z.array(z.string()).max(20).optional().default([]),
    guestName: z.string().trim().max(32).optional(),
  }),
  reviewUpdate: z.object({
    rating: z.number().min(0).max(10).optional(),
    text: z.string().max(5000).optional(),
    categoryIds: z.array(z.string()).max(20).optional(),
  }),
  commentCreate: z.object({
    text: z.string().trim().min(1).max(5000),
    parentId: z.string().optional(),
  }),
  commentUpdate: z.object({
    commentId: z.string(),
    text: z.string().trim().min(1).max(5000),
  }),
  commentDelete: z.object({
    commentId: z.string(),
  }),
  authRegister: z.object({
    name: z.string().trim().max(100).optional().default(''),
    email: z.string().trim().email(),
    password: z.string().min(8).max(256).regex(/[A-Z]/, 'Must include an uppercase letter').regex(/[0-9]/, 'Must include a number'),
  }),
  authForgot: z.object({
    email: z.string().trim().email(),
  }),
  authResend: z.object({
    email: z.string().trim().email(),
  }),
  authResendVerification: z.object({
    email: z.string().trim().email(),
  }),
  authReset: z.object({
    token: z.string().min(1),
    email: z.string().trim().email(),
    password: z.string().min(8).max(256).regex(/[A-Z]/, 'Must include an uppercase letter').regex(/[0-9]/, 'Must include a number'),
  }),
  authVerifyPost: z.object({
    token: z.string().min(1),
    email: z.string().trim().email(),
  }),
};

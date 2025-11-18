# Security Measures

## XSS (Cross-Site Scripting) Prevention

### Overview
This application implements comprehensive XSS prevention measures to protect against malicious script injection.

### Defense Layers

#### 1. Server-Side Input Sanitization
All user-generated content is sanitized before being stored in the database using the `sanitizeHTML()` function in `/src/lib/validation.ts`.

**Sanitized Inputs:**
- Review text (create & update)
- Comment text (create & update)
- Forum thread titles and content
- Forum comment text
- User names

**Sanitization Method:**
```typescript
export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')   // Escape ampersands
    .replace(/</g, '&lt;')     // Escape less-than
    .replace(/>/g, '&gt;')     // Escape greater-than
    .replace(/"/g, '&quot;')   // Escape double quotes
    .replace(/'/g, '&#39;');   // Escape single quotes
}
```

This conservative approach escapes all HTML special characters, preventing any HTML or JavaScript injection.

#### 2. React's Built-in XSS Protection
React automatically escapes values embedded in JSX, providing additional protection:
- All text rendered via `{variable}` is automatically escaped
- No use of `dangerouslySetInnerHTML` in the codebase (verified)

#### 3. Input Validation with Zod
All API endpoints use Zod schemas for input validation:
- Type checking
- Length limits (e.g., review text max 5000 chars)
- Format validation (e.g., email format)
- Required field enforcement

**Example Schema:**
```typescript
reviewCreate: z.object({
  rating: z.number().min(0).max(10),
  text: z.string().max(5000).optional().default(''),
  categoryIds: z.array(z.string()).max(20).optional().default([]),
  guestName: z.string().trim().max(32).optional(),
})
```

#### 4. Content Security Policy (CSP)
**Recommendation:** Implement CSP headers in production to further restrict script execution.

Suggested CSP headers:
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://image.tmdb.org data:;
  font-src 'self' data:;
  connect-src 'self' https://api.themoviedb.org;
```

### Protected Endpoints

**User Input Endpoints:**
- ✅ `/api/reviews/[id]` - POST, PATCH (review text sanitized)
- ✅ `/api/comments/[id]` - POST, PATCH (comment text sanitized)
- ✅ `/api/user/name` - POST (name sanitized)
- ✅ `/api/forum` - POST (title & content sanitized)
- ✅ `/api/forum/[threadId]/comments` - POST (text sanitized)
- ✅ `/api/auth/register` - POST (name sanitized)

**Admin Endpoints:**
- `/api/admin/*` - Protected by role-based authentication
- Admin inputs are still sanitized to prevent privilege escalation attacks

### Security Best Practices

1. **Never trust user input** - Always sanitize before storage and display
2. **Principle of least privilege** - Users only access their own data
3. **Rate limiting** - Prevents spam and abuse (enabled in production)
4. **Authentication checks** - All sensitive operations require valid sessions
5. **SQL injection prevention** - Prisma ORM parameterizes all queries
6. **Password hashing** - bcrypt with salt rounds for password storage

### Testing XSS Prevention

To verify XSS protection, attempt to submit:
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
```

These should be rendered as plain text, not executed.

### Security Checklist

- [x] Server-side HTML sanitization
- [x] React automatic escaping
- [x] Zod input validation
- [x] No `dangerouslySetInnerHTML` usage
- [x] Rate limiting enabled
- [x] Password hashing with bcrypt
- [x] Session management with NextAuth
- [ ] CSP headers (recommended for production)
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

### Reporting Security Issues

If you discover a security vulnerability, please email: wokeornot.site@gmail.com

Do NOT create public GitHub issues for security vulnerabilities.

### Additional Resources

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

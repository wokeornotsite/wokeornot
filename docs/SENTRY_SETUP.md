# Sentry Error Tracking Setup

Sentry integration has been scaffolded but requires activation.

## Setup Instructions

### 1. Install Sentry SDK

```bash
npm install @sentry/nextjs
```

### 2. Create Sentry Project

1. Go to [sentry.io](https://sentry.io) and create a free account
2. Create a new project for Next.js
3. Copy your DSN from the project settings

### 3. Add Environment Variables

Add to `.env.local`:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your_client_dsn_here
SENTRY_DSN=your_server_dsn_here

# Optional: Sentry Auth Token for source maps
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=your_org_name
SENTRY_PROJECT=your_project_name
```

### 4. Activate Sentry Code

#### Client-Side (`src/lib/sentry-client.ts`)
Uncomment the initialization code

#### Server-Side (`src/lib/sentry-server.ts`)
Uncomment the initialization code

### 5. Source Maps (Optional)

For better stack traces in production, add to `next.config.js`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // ... existing config
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

## Features Configured

### Client-Side
- Error tracking
- Performance monitoring (10% sample rate in production)
- Session replay (10% of sessions, 100% on error)
- Filtered auth errors

### Server-Side
- Error tracking with context
- Performance monitoring
- Filtered development errors

### Error Boundary
- Automatic error capture
- User-friendly error UI
- Reset functionality

## Testing

### Test Error Tracking

Add a test button to any page:

```tsx
<button onClick={() => {
  throw new Error('Test Sentry Error');
}}>
  Test Error
</button>
```

### Test Performance

Sentry will automatically track:
- Page load times
- API response times
- Database query performance

## Best Practices

1. **Filter Sensitive Data**: Update `beforeSend` in config files
2. **Set Environment**: Automatically set based on `NODE_ENV`
3. **Sample Rates**: Adjust based on traffic and budget
4. **User Context**: Add user IDs in authenticated flows
5. **Release Tracking**: Set release version for better tracking

## Cost Optimization

- Use appropriate sample rates
- Filter noisy errors
- Set alert rules in Sentry dashboard
- Review quota usage monthly

## Support

- [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)

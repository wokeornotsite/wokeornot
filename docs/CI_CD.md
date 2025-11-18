# CI/CD Documentation

Continuous Integration and Deployment setup for WokeOrNot.

## Overview

The project uses GitHub Actions for automated testing, building, and deployment.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request.

#### Jobs:

**Lint**
- Runs ESLint on codebase
- Checks TypeScript compilation
- Currently set to `continue-on-error` during initial setup

**Build**
- Installs dependencies
- Builds Next.js application
- Uploads build artifacts
- Validates production build succeeds

**Test**
- Runs test suite (when implemented)
- Unit tests, integration tests
- Currently set to `continue-on-error` until tests are added

**Security**
- npm audit for dependency vulnerabilities
- Trivy scan for security issues
- Checks for known CVEs

#### Trigger Events:
- Push to `main`, `develop`, `fix/*` branches
- Pull requests to `main`, `develop`

#### Duration:
- Lint: ~1-2 minutes
- Build: ~3-5 minutes
- Test: ~1-2 minutes
- Security: ~2-3 minutes
- **Total: ~7-12 minutes**

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

Deploys to production on main branch pushes.

#### Steps:
1. Checkout code
2. Install dependencies
3. Build application
4. Deploy to Vercel
5. Send notification

#### Requirements:
- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Organization ID
- `VERCEL_PROJECT_ID`: Project ID

#### Trigger Events:
- Push to `main` branch
- Manual workflow dispatch

#### Duration:
- ~5-8 minutes total

### 3. Dependabot (`.github/dependabot.yml`)

Automated dependency updates.

#### Configuration:
- **NPM packages**: Weekly on Mondays at 9 AM
- **GitHub Actions**: Weekly on Mondays
- Groups minor/patch updates
- Ignores major updates for core packages (Next.js, React)

#### Pull Request Limits:
- NPM: 10 concurrent PRs
- GitHub Actions: 5 concurrent PRs

## Setting Up CI/CD

### 1. GitHub Secrets

Add these secrets in repository settings:

```
Settings → Secrets and variables → Actions → New repository secret
```

**Required Secrets:**

```bash
# Vercel Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Optional: For enhanced features
SENTRY_AUTH_TOKEN=your_sentry_token
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
```

### 2. Vercel Setup

Get Vercel credentials:

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Get project details
vercel project ls
vercel env ls
```

### 3. Enable Dependabot

1. Go to repository Settings
2. Navigate to Security → Dependabot
3. Enable "Dependabot alerts"
4. Enable "Dependabot security updates"
5. Enable "Dependabot version updates"

### 4. Branch Protection Rules

Configure branch protection for `main`:

```
Settings → Branches → Add rule
```

**Recommended rules:**
- ✅ Require pull request reviews (1 approver)
- ✅ Require status checks to pass (CI workflow)
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ✅ Include administrators

## Local Development

### Pre-commit Checks

Run these before committing:

```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit

# Build test
npm run build

# Run tests (when implemented)
npm test
```

### Git Hooks (Optional)

Install Husky for automatic pre-commit checks:

```bash
npm install --save-dev husky lint-staged

# Initialize Husky
npx husky init

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

Create `.lintstagedrc.json`:

```json
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

## Monitoring CI/CD

### GitHub Actions Dashboard

View workflow runs:
```
Repository → Actions tab
```

### Status Badges

Add to README.md:

```markdown
![CI](https://github.com/wokeornotsite/wokeornot/workflows/CI/badge.svg)
![Deploy](https://github.com/wokeornotsite/wokeornot/workflows/Deploy/badge.svg)
```

### Notifications

Configure in GitHub settings:
```
Settings → Notifications → Actions
```

Options:
- Email on workflow failure
- Slack/Discord webhooks
- GitHub mobile app notifications

## Troubleshooting

### Build Failures

**Issue**: Build fails due to environment variables
```bash
# Solution: Add SKIP_ENV_VALIDATION=true to workflow
env:
  SKIP_ENV_VALIDATION: true
```

**Issue**: TypeScript errors
```bash
# Solution: Fix errors or temporarily set continue-on-error
continue-on-error: true
```

**Issue**: Memory issues during build
```bash
# Solution: Increase Node memory in workflow
- run: NODE_OPTIONS="--max_old_space_size=4096" npm run build
```

### Deployment Failures

**Issue**: Vercel token invalid
```bash
# Solution: Regenerate token at vercel.com/account/tokens
```

**Issue**: Build exceeds time limit
```bash
# Solution: Optimize build or upgrade Vercel plan
```

**Issue**: Environment variables missing
```bash
# Solution: Add variables in Vercel dashboard
# Project Settings → Environment Variables
```

### Dependabot Issues

**Issue**: Too many PRs
```bash
# Solution: Adjust open-pull-requests-limit in dependabot.yml
```

**Issue**: Breaking updates
```bash
# Solution: Review and test PRs before merging
# Add more to ignore list if needed
```

## Best Practices

### 1. Commit Messages

Follow conventional commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### 2. Pull Request Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit
3. Push branch: `git push origin feature/my-feature`
4. Create PR on GitHub
5. Wait for CI checks to pass
6. Request review
7. Address feedback
8. Merge when approved and green

### 3. Code Review Checklist

- [ ] Code follows project style
- [ ] All tests pass
- [ ] No console.log statements
- [ ] TypeScript types are correct
- [ ] No security vulnerabilities
- [ ] Performance considerations
- [ ] Documentation updated
- [ ] Breaking changes documented

### 4. Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release PR
4. Merge to main
5. Tag release: `git tag v1.0.0`
6. Push tags: `git push --tags`
7. Create GitHub release
8. Automatic deployment to production

## Performance Optimization

### Cache Strategy

- ✅ Node modules cached between runs
- ✅ Next.js build cache
- ✅ Docker layers (if using containers)

### Parallel Jobs

Jobs run in parallel when possible:
- Lint, Test, Security run simultaneously
- Build runs after Lint completes

### Conditional Execution

Skip workflows on specific paths:

```yaml
on:
  push:
    paths-ignore:
      - 'docs/**'
      - '**.md'
```

## Cost Optimization

### GitHub Actions Minutes

- Free tier: 2,000 minutes/month
- Typical usage: ~200-400 minutes/month
- Optimize by:
  - Caching dependencies
  - Parallel jobs
  - Skip unnecessary workflows

### Vercel Deployments

- Free tier: 100 GB-hours/month
- Monitor usage in dashboard
- Preview deployments count toward limit

## Security Considerations

1. **Never commit secrets**: Use GitHub Secrets
2. **Scan dependencies**: Dependabot + npm audit
3. **Review dependency PRs**: Don't auto-merge
4. **Rotate tokens**: Every 6 months
5. **Limit permissions**: Use least privilege

## Future Enhancements

- [ ] Add end-to-end tests (Playwright)
- [ ] Implement visual regression testing
- [ ] Add performance budgets
- [ ] Lighthouse CI integration
- [ ] Automated changelog generation
- [ ] Semantic versioning automation
- [ ] Slack/Discord notifications
- [ ] Deploy preview environments
- [ ] A/B testing infrastructure
- [ ] Blue-green deployments

## Support Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Next.js CI/CD](https://nextjs.org/docs/deployment)
- [Dependabot Config](https://docs.github.com/en/code-security/dependabot)

# 🔒 Yumeo Security Deployment Checklist

Use this checklist before deploying to production.

## ✅ Before Going Live - MANDATORY

### 1. Secrets Management
- [ ] `.env.local` exists but is in `.gitignore` (verify: `git check-ignore .env.local`)
- [ ] All actual API keys have been removed from git history
  ```bash
  # Remove from history:
  git filter-branch --tree-filter 'rm -f .env.local' HEAD
  git push origin --force --all
  ```
- [ ] GitHub Actions secrets configured (Settings → Secrets)
  - [ ] `CLERK_SECRET_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `GITHUB_MODELS_TOKEN`
  - [ ] `ANTHROPIC_API_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] Vercel Environment Variables set (Project Settings → Environment Variables)
  - [ ] All server-side secrets set (not in code)
  - [ ] Use "Sensitive" toggle for all secrets
  - [ ] Different values for Preview/Production

### 2. API Security
- [ ] Rate limiting enabled on all POST/PUT/DELETE endpoints
  - [ ] `/api/checkout` - 5 per hour per user
  - [ ] `/api/agent` - 30 per minute per user
  - [ ] `/api/generate` - 10 per minute per user
- [ ] CSRF protection implemented (tokens validated on state-changing requests)
- [ ] Input validation on all user-provided data
- [ ] All API keys kept server-side only (never in client code)

### 3. Database Security
- [ ] Supabase RLS policies verified for all tables
  - [ ] `projects` - users can only access their own
  - [ ] `materials` - users can only access within their projects
  - [ ] `project_sections` - users can only access within their projects
- [ ] Service role key used ONLY in backend (never in client/browser)
- [ ] Row-level security enabled and tested
- [ ] Sensitive columns encrypted (if storing PII beyond email)

### 4. Dependencies
- [ ] `npm audit` shows 0 critical/high vulnerabilities
  ```bash
  npm audit
  npm audit fix
  npm audit fix --force  # if needed
  ```
- [ ] All dependencies up to date
  ```bash
  npm update
  npm outdated
  ```
- [ ] Next.js updated to latest patch version (14.2.x)
- [ ] Clerk updated to latest stable (5.x+)

### 5. Security Headers
- [ ] Verify headers in browser DevTools (Network tab):
  - [ ] `Strict-Transport-Security: max-age=31536000`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - [ ] `Content-Security-Policy` configured correctly
- [ ] Test with `https://securityheaders.com`

### 6. Authentication & Authorization
- [ ] Clerk session timeout configured (15-30 minutes recommended)
- [ ] JWT validation on all protected routes
- [ ] Password requirements enforced in Clerk settings
  - [ ] Minimum 8 characters
  - [ ] Complexity requirements enabled
- [ ] 2FA recommended for admin users
- [ ] Email verification enabled

### 7. Payment Security (Stripe)
- [ ] Webhook secret configured in `.env`
- [ ] Webhook signature verification enabled
- [ ] PCI compliance verified
- [ ] Test payment flow with Stripe test keys
- [ ] Production keys configured in Vercel before going live

### 8. Logging & Monitoring
- [ ] Error logging configured (Sentry/DataDog/CloudWatch)
- [ ] Security event logging enabled
- [ ] Rate limit events logged
- [ ] Failed auth attempts logged
- [ ] Alerts configured for critical events

### 9. SSL/TLS
- [ ] HTTPS enforced on all pages (no http://)
- [ ] SSL certificate valid (Vercel provides automatically)
- [ ] Redirect http → https configured

### 10. File Upload Security
- [ ] File type validation (only PDF, BIB, TXT, MD, PNG, JPG, SVG allowed)
- [ ] File size limits enforced (10MB per file)
- [ ] Virus scanning enabled (consider for production)
- [ ] Files stored in private S3/Supabase bucket
- [ ] Signed URLs used for downloads (no direct access)

### 11. DDoS Protection
- [ ] Vercel DDoS protection active (automatic)
- [ ] Rate limiting deployed to Vercel Edge
- [ ] Consider Cloudflare (if not using Vercel edge)
- [ ] Bot detection enabled (optional but recommended)

### 12. Data Privacy
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance (if serving EU users)
- [ ] Data retention policy defined
- [ ] User data deletion option available
- [ ] No unnecessary PII collection

### 13. Build & Deployment
- [ ] Build completes without errors
  ```bash
  npm run build
  ```
- [ ] No TypeScript errors
  ```bash
  npm run typecheck
  ```
- [ ] No ESLint errors
  ```bash
  npm run lint
  ```
- [ ] No secrets in build output
  ```bash
  npm run build && grep -r "sk_" .next/ || echo "✓ No secrets found"
  ```
- [ ] Vercel build settings correct (automatic)

### 14. Testing
- [ ] Authentication flow tested (sign up, sign in, sign out)
- [ ] Protected routes require auth (test without token)
- [ ] Rate limiting tested (send rapid requests)
- [ ] CSRF protection tested
- [ ] Input validation tested (try XSS, SQL injection)
- [ ] File upload tested (various file types and sizes)
- [ ] Payment flow tested (use Stripe test card)

### 15. Documentation
- [ ] Security audit completed (SECURITY_AUDIT.md)
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Deployment instructions documented
- [ ] Incident response plan documented

---

## 🔄 Production Monitoring (Ongoing)

### Daily
- [ ] Check error logs for suspicious activity
- [ ] Monitor rate limit hits
- [ ] Review failed auth attempts

### Weekly
- [ ] Review security audit logs
- [ ] Check for dependency updates
- [ ] Verify uptime monitoring working

### Monthly
- [ ] Run security audit (`npm audit`)
- [ ] Review access logs for anomalies
- [ ] Verify backup integrity
- [ ] Test incident response plan

### Quarterly
- [ ] Rotate all API keys
- [ ] Update dependencies comprehensively
- [ ] Run penetration testing
- [ ] Review and update security policies

---

## 🚨 Incident Response

If compromise suspected:
1. **Immediately** (0-5 min):
   - [ ] Disable all API keys in respective dashboards
   - [ ] Force re-auth of all users (Clerk)
   - [ ] Review server logs for unusual access

2. **Within 1 hour**:
   - [ ] Identify what was accessed
   - [ ] Check for data exfiltration
   - [ ] Generate new API keys

3. **Within 24 hours**:
   - [ ] Root cause analysis
   - [ ] Notify affected users
   - [ ] Apply fixes

4. **Within 1 week**:
   - [ ] Conduct security audit
   - [ ] Implement preventive measures
   - [ ] Post-mortem documentation

---

## 📞 Security Contacts

Save these for emergencies:
- **Clerk**: security@clerk.com
- **Stripe**: security@stripe.com
- **Supabase**: security@supabase.io
- **GitHub**: security@github.com
- **Vercel**: security@vercel.com

---

## ✨ Deployment Command

When ready to deploy:

```bash
# 1. Final verification
npm run typecheck
npm run build
npm audit

# 2. Review all changes
git status

# 3. Deploy to Vercel (automatic on push to main)
git add .
git commit -m "Security audit fixes and hardening"
git push origin main

# 4. Verify deployment
# - Check Vercel deployment status
# - Verify security headers: https://securityheaders.com/?q=yumeo.app
# - Test authentication flow
# - Monitor error logs
```

---

**Last Updated**: 2025-05-03
**Security Level**: Production-Ready
**Audit Status**: ✅ COMPLETE

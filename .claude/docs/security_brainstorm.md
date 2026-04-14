# Security Brainstorming Report

## 1. Current Security Posture

- **Overall risk assessment: LOW**
- This is a public client-side PWA with no authentication, no database, no user-generated content, no file uploads, and no sensitive data processing.
- **Attack surface summary:**
  - Number input fields (start, end, draw count) - constrained to integer ranges
  - Boolean toggles (duplicates, sound) - no free-form input
  - localStorage (theme preference only) - trivial data, read-validated
  - External resource: Google Fonts CDN
  - Cloudflare Workers SSR handler (thin passthrough, no custom logic)
  - No API endpoints, no form submissions, no cookies, no sessions

## 2. Input Validation Audit

### Number Input Boundaries
- **NumberInput.tsx** clamps values via `Math.min(Math.max(newValue, min), max)` after `parseInt()` - good.
- **NaN handling:** `parseInt` result is checked with `!isNaN(newValue)` before propagating - NaN inputs are silently ignored. This is correct.
- **SettingsDialog.tsx** constrains: start (1-999), end (1-999), drawCount (1-maxDrawCount).
- **lottery.ts `validateSettings()`** provides a second layer: checks start <= end, drawCount >= 1, range <= MAX_RANGE (10000), drawCount <= range.

### Gaps and Edge Cases
| Case | Status | Notes |
|------|--------|-------|
| NaN | HANDLED | `parseInt` + `isNaN` check in NumberInput |
| Infinity | HANDLED | `parseInt` never returns Infinity for string input |
| Negative numbers | HANDLED | `min=1` clamp prevents negatives |
| Float values | HANDLED | `parseInt` truncates to integer |
| MAX_RANGE=10000 vs UI max=999 | MINOR GAP | UI caps at 999, but `MAX_RANGE` is 10000. If settings are updated programmatically (e.g., via devtools/state manipulation), the `validateSettings()` guard catches ranges up to 10000. This is defense-in-depth and acceptable. |
| Zero drawCount | HANDLED | min=1 in UI, `drawCount < 1` check in validateSettings |
| Empty input field | HANDLED | `parseInt("")` returns NaN, which is filtered out |

### Recommendation
- **LOW priority:** Add `Number.isFinite()` check alongside `isNaN` in NumberInput for extra robustness, though current `parseInt` + `isNaN` is sufficient.
- **LOW priority:** Consider adding `inputMode="numeric"` attribute to the `<input>` element for better mobile keyboard behavior (currently uses `type="number"` which is adequate).

## 3. Client-Side Security

### XSS Vectors Analysis
- **Risk: VERY LOW.** React 19 escapes all rendered content by default.
- No `dangerouslySetInnerHTML` usage found anywhere.
- No URL parameter parsing or query string injection paths.
- Validation error messages in `lottery.ts` are hardcoded Korean strings with template literal number interpolation only (e.g., `${range}`, `${MAX_RANGE.toLocaleString()}`), which are safe.
- The `ErrorBoundary` in `root.tsx` displays `error.message` and `error.stack`, but ONLY when `import.meta.env.DEV` is true. In production, generic messages are shown. This is correct.

### localStorage Handling
- **useTheme.ts** reads from localStorage and validates against `VALID_THEMES` whitelist (`['light', 'dark', 'system']`). Any tampered value falls back to `'system'`. This is well-implemented.
- Only the string theme value is stored; no JSON parsing of localStorage data (avoids prototype pollution).
- No sensitive data in localStorage.

### External Resource Loading (Google Fonts)
- **root.tsx** loads Google Fonts from `fonts.googleapis.com` and `fonts.gstatic.com`.
- Uses `crossOrigin="anonymous"` on the gstatic preconnect - correct.
- **Risk:** Google Fonts is a widely trusted CDN. The risk of supply chain compromise is very low but non-zero.
- **Mitigation option:** Self-host fonts to eliminate the external dependency. This also improves privacy (no Google tracking of font requests).

### Content Security Policy (CSP) Recommendations
Currently, **no CSP headers are set**. This is the most significant security improvement opportunity.

Recommended CSP for this app:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'self';
  media-src 'none';
  object-src 'none';
  frame-src 'none';
  base-uri 'self';
  form-action 'self';
```

If self-hosting fonts, the policy simplifies to remove the Google domains.

**Note:** `'unsafe-inline'` for styles is needed because Tailwind/React may inject inline styles. If using a nonce-based approach with the SSR framework, `'unsafe-inline'` can be replaced.

## 4. Randomness Quality

### Math.random() vs Crypto.getRandomValues()
- **Current:** `Math.random()` used in `lottery.ts` line 36.
- `Math.random()` is a PRNG - it is NOT cryptographically secure. The output can be predicted if the internal state is known.

### Implications for a Lottery App
- For a **fun/casual** lottery app with no real stakes (no money, prizes, or consequential decisions), `Math.random()` is perfectly adequate.
- If users perceive the app as a "fair" randomizer for classroom seat assignments, gift exchanges, or similar low-stakes decisions, `Math.random()` is fine.
- If the app ever evolves to handle anything with real consequences (raffle prizes, team assignments in competitions), cryptographic randomness would be expected.

### Recommendation
- **P2 (MEDIUM priority):** Switch to `crypto.getRandomValues()` for improved randomness quality. The implementation change is minimal:

```typescript
// Replace:
return available[Math.floor(Math.random() * available.length)];

// With:
const array = new Uint32Array(1);
crypto.getRandomValues(array);
return available[array[0] % available.length];
```

Note: `crypto.getRandomValues()` is available in all modern browsers and in Cloudflare Workers. The modulo bias for small ranges (< 1000) is negligible.

This is a trust/perception issue more than a security issue. Users of a "lottery" app may reasonably expect strong randomness.

## 5. Dependency Security

### Current Dependencies (Production)
| Package | Version | Risk Assessment |
|---------|---------|-----------------|
| react / react-dom | ^19.1.1 | Low - major framework, well-maintained |
| react-router | ^7.10.0 | Low - official React routing |
| @radix-ui/* | Various | Low - reputable accessible UI primitives |
| lucide-react | ^0.562.0 | Low - icon library, no runtime logic |
| @hugeicons/react | ^1.1.4 | Low-Medium - less mainstream icon library |
| class-variance-authority | ^0.7.1 | Low - utility, minimal surface |
| clsx / tailwind-merge | Latest | Low - string utilities |
| isbot | ^5.1.31 | Low - user-agent detection |

### Recommendations
- **Run `npm audit` regularly** and integrate into CI/CD pipeline.
- **Pin exact versions** in `package-lock.json` (npm does this by default) and consider using `npm ci` in deployments.
- **Review @hugeicons/react** - less established than lucide-react. Consider consolidating on one icon library to reduce attack surface.
- **Enable Dependabot or Renovate** on the GitHub repository for automated dependency update PRs.
- The dependency count is already minimal for a React app - good.

### Supply Chain Security
- No postinstall scripts from third-party packages (besides the project's own `cf-typegen`).
- Consider adding an `.npmrc` with `ignore-scripts=true` for third-party packages if paranoid, running allowed scripts explicitly.

## 6. Cloudflare Workers Security

### Current State
The worker in `workers/app.ts` is a minimal passthrough to React Router's request handler. There is no custom middleware, no header manipulation, and no error handling beyond what React Router provides.

### Missing Security Headers
The following headers should be added via Cloudflare Workers or `_headers` file:

| Header | Recommended Value | Purpose |
|--------|------------------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restrict browser APIs |
| `Content-Security-Policy` | See Section 3 | Prevent XSS |

**Implementation approach:** Add a response wrapper in `workers/app.ts`:

```typescript
export default {
  async fetch(request, env, ctx) {
    const response = await requestHandler(request, {
      cloudflare: { env, ctx },
    });

    // Clone response to add security headers
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'DENY');
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    newResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return newResponse;
  },
} satisfies ExportedHandler<Env>;
```

### Error Handling
- **root.tsx ErrorBoundary** correctly gates stack trace exposure behind `import.meta.env.DEV`. Production errors show only generic messages. This is good.
- The worker itself has no try/catch - if `requestHandler` throws, Cloudflare Workers returns a generic 500. This is acceptable; adding a try/catch with a generic error page would be a minor improvement.

### Rate Limiting
- Not currently needed (no API endpoints, no form submissions).
- If Supabase integration is added later, Cloudflare's built-in rate limiting should be configured for API routes.

### Environment Variables
- `wrangler.jsonc` exposes `VALUE_FROM_CLOUDFLARE` as a var. This is a placeholder and contains no secrets. When adding Supabase keys, use Wrangler secrets (`wrangler secret put`) instead of `vars`.

## 7. PWA Security

### Service Worker (Not Yet Implemented)
When adding a service worker:
- Use a **network-first** or **stale-while-revalidate** strategy for HTML to ensure security patches reach users quickly.
- Use **cache-first** for static assets (JS, CSS, images) with content-hashed filenames.
- Implement a **cache version** mechanism to force cache invalidation on deployments.
- Scope the service worker to `/` only.
- Never cache API responses containing sensitive data (relevant for future Supabase integration).

### Cache Poisoning Prevention
- Cloudflare's edge caching handles this well by default.
- Ensure `Cache-Control` headers are set correctly: `no-cache` for HTML, long-cache for hashed assets.
- When adding a service worker, validate response integrity before caching.

### HTTPS Enforcement
- Cloudflare Workers enforce HTTPS by default on `*.workers.dev` domains.
- Custom domains should have "Always Use HTTPS" enabled in Cloudflare dashboard.
- HSTS header (recommended in Section 6) provides additional enforcement.

### Manifest Security
- `manifest.json` is well-configured with `display: standalone` and `orientation: portrait`.
- `start_url: "/"` is correct (not pointing to an external URL).
- No `scope` is set - consider adding `"scope": "/"` to explicitly restrict the PWA scope.
- Icons reference local paths (`/images/app_logo.png`) - good, no external dependencies.

## 8. Future Supabase Security Considerations

### API Key Exposure in Client-Side Code
- Supabase `anon` key will be visible in client-side JavaScript. This is by design - it is NOT a secret.
- The `service_role` key must NEVER be exposed to the client. Use it only in Cloudflare Workers (server-side).
- Store the `anon` key as a Wrangler env var, not hardcoded in source. Pass it to the client via SSR loader data.

### Row Level Security (RLS) Requirements
- **MANDATORY:** Enable RLS on ALL tables before any Supabase integration goes live.
- Design RLS policies assuming the `anon` key is public and attackable.
- Test RLS policies by attempting direct Supabase REST API calls with the `anon` key.
- Common pitfall: forgetting to enable RLS on a new table. Use a CI check or Supabase dashboard alerts.

### Auth Flow Security
- If adding user accounts: use Supabase Auth with PKCE flow (default for SPAs).
- Store auth tokens in memory or `httpOnly` cookies (via Workers proxy), NOT in localStorage.
- Implement proper token refresh logic.
- Consider anonymous sessions for non-authenticated features.

### Data Privacy (GDPR / Korean PIPA)
- **Korean PIPA (Personal Information Protection Act)** applies if collecting any personal data from Korean users.
- If adding user accounts: provide clear privacy policy in Korean, data deletion mechanism, and consent flows.
- Minimize data collection - do not store IP addresses or device identifiers unless necessary.
- If storing lottery results per user, clarify data retention policy.
- Consider Supabase's data residency options (currently no Seoul region - closest is Tokyo/Singapore).

## 9. Prioritized Security Recommendations

| Priority | Issue | Severity | Fix Effort | Description |
|----------|-------|----------|------------|-------------|
| P0 | Add security headers in Workers | Medium | Low | Add X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy to all responses |
| P1 | Add Content Security Policy | Medium | Medium | Implement CSP header to prevent any future XSS vectors |
| P1 | Enable Dependabot/Renovate | Low | Low | Automated dependency vulnerability alerts and update PRs |
| P2 | Upgrade to crypto.getRandomValues() | Low | Low | Better randomness quality for user trust; minimal code change |
| P2 | Self-host Google Fonts | Low | Low | Eliminate external dependency, improve privacy |
| P3 | Add `scope` to manifest.json | Informational | Trivial | Explicitly restrict PWA scope to `"/"` |
| P3 | Add error boundary in Workers | Informational | Low | try/catch wrapper in fetch handler for graceful 500 errors |
| P3 | Consolidate icon libraries | Informational | Medium | Use either lucide-react or @hugeicons/react, not both |
| Future | Supabase RLS policies | Critical | Medium | MUST enable before any database integration |
| Future | Supabase key management | High | Low | Use Wrangler secrets for service_role key |
| Future | Auth token storage | High | Medium | Use httpOnly cookies via Workers proxy, not localStorage |
| Future | PIPA compliance | High | High | Privacy policy, consent flows, data deletion if collecting user data |

## File Ownership

This agent owns analysis of:
- Security aspects of all source files listed below
- Dependency vulnerabilities (`package.json`)
- Infrastructure security (Cloudflare Workers `workers/app.ts`, `wrangler.jsonc`)
- Future auth/database security planning (Supabase integration)
- PWA security (`public/manifest.json`, service worker when added)

### Files Audited
- `/app/lib/lottery.ts` - Input validation, randomness
- `/app/hooks/useLotteryMachine.ts` - State machine, defensive validation
- `/app/hooks/useTheme.ts` - localStorage read/write with whitelist validation
- `/app/components/settings/SettingsDialog.tsx` - User input handling, validation display
- `/app/components/settings/NumberInput.tsx` - Number input clamping and NaN filtering
- `/app/lib/sound.ts` - AudioContext singleton, no security concerns
- `/workers/app.ts` - Cloudflare Workers handler (needs security headers)
- `/app/root.tsx` - HTML meta tags, external resources, error boundary
- `/public/manifest.json` - PWA manifest configuration
- `/app/types/lottery.ts` - Type definitions, default values
- `/wrangler.jsonc` - Worker configuration
- `/package.json` - Dependency inventory

# Backend/Infrastructure Brainstorming Report

## 1. Cloudflare Workers Optimization

### Current SSR Setup Assessment
- **workers/app.ts** is minimal and correct -- a thin passthrough from Cloudflare's fetch handler to React Router's `createRequestHandler`.
- SSR via `renderToReadableStream` in entry.server.tsx is well-implemented with bot detection (`isbot`) and streaming for real users.
- The `AppLoadContext` typing exposes `env` and `ctx`, but neither is used by any route loader/action yet. This is fine for now but will be critical for Supabase integration.

### Edge Caching Strategy
- **Problem**: Currently no Cache-Control headers are set on SSR responses. Every request hits the Worker's SSR pipeline.
- **Recommendation**: Since this is a single-page app with no dynamic server data, add aggressive caching headers in `entry.server.tsx`:
  ```
  Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400
  ```
- Use `ctx.waitUntil()` in workers/app.ts for background cache warming or analytics.
- Consider using the Cloudflare Cache API directly in workers/app.ts to cache full HTML responses at the edge, keyed by URL. This avoids SSR entirely for repeat requests:
  ```ts
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await requestHandler(request, ...);
  ctx.waitUntil(cache.put(request, response.clone()));
  return response;
  ```

### Headers Optimization
- Add `ETag` based on build hash (available from Vite's manifest).
- Add `Vary: Accept-Encoding` for proper CDN behavior.
- Consider `X-Robots-Tag` for SEO control.
- Add `Content-Security-Policy` headers (see security-reviewer's scope).

### Static Asset Optimization
- Vite already hashes static assets in the build output. Cloudflare serves these with long cache TTLs automatically via the `@cloudflare/vite-plugin`.
- **Gap**: The `public/` directory files (manifest.json, images) are NOT content-hashed. These need explicit `Cache-Control` headers or should be referenced via Vite's asset pipeline where possible.

### Cold Start Mitigation
- Cloudflare Workers have near-zero cold start (<5ms), unlike Lambda. Not a real concern here.
- **However**, enabling Smart Placement (commented out in wrangler.jsonc) is unnecessary since there's no backend data source to co-locate with. Keep it disabled.

### Wrangler Configuration Improvements
- Current `wrangler.jsonc` has a placeholder `VALUE_FROM_CLOUDFLARE` var -- remove it or replace with real config.
- Add `[env.staging]` and `[env.production]` blocks for environment separation.
- Consider adding `compatibility_flags = ["nodejs_compat"]` if Supabase client needs Node.js APIs.

---

## 2. PWA Service Worker Implementation (HIGH PRIORITY)

### Current State
- Only `manifest.json` exists with basic metadata and icons.
- NO service worker registered anywhere. No `entry.client.tsx` file exists at all.
- The app is NOT installable as a true PWA despite having the manifest, because browsers increasingly require a service worker for the install prompt.

### Service Worker Strategy for React Router 7 + Cloudflare Workers

**Recommended approach: Custom service worker with Workbox libraries** (not the full Workbox CLI/webpack plugin, which doesn't integrate well with Vite).

#### Option A: vite-plugin-pwa (Recommended for speed)
- `vite-plugin-pwa` works with Vite 7 and auto-generates the service worker.
- Handles precaching of Vite build output automatically.
- Provides `registerSW` helper for the client entry.
- **Caveat**: Must verify compatibility with `@cloudflare/vite-plugin` and `@react-router/dev/vite`. Plugin ordering matters -- PWA plugin should come last.

#### Option B: Manual service worker (More control)
- Create `public/sw.js` (or `app/sw.ts` compiled by Vite).
- Register in a new `app/entry.client.tsx`:
  ```ts
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }
  ```

### Cache Strategies

**App Shell (HTML)**: Network-first with cache fallback
- SSR HTML changes on deploy, so always try network first.
- Fall back to cached version when offline.

**JS/CSS bundles**: Cache-first (content-hashed by Vite)
- These files have unique hashes; once cached, they never change.
- Precache the entire Vite build manifest on SW install.

**Static assets (images, fonts)**: Cache-first with expiration
- `/images/app_logo.png`, `/images/eb_icon.png` -- cache for 30 days.
- Google Fonts CSS and font files -- cache-first with 1-year expiry.

**Future API responses (Supabase)**: Stale-while-revalidate
- Return cached data immediately, update cache in background.
- Critical for offline-capable draw history.

### Offline Fallback Page
- Create a minimal `/offline.html` precached by the service worker.
- When network fails and no cached route exists, serve this page.
- The offline page should indicate "You're offline" and still allow the lottery draw (since it's all client-side logic).
- **Key insight**: The lottery functionality is 100% client-side. With proper caching, the entire app should work offline after first visit.

### Service Worker Update Strategy
- Use `skipWaiting()` + `clients.claim()` for immediate activation.
- Show a subtle toast/banner: "New version available. Refresh to update."
- Use the `controllerchange` event to prompt reload.

### Push Notification Infrastructure
- Not needed now, but the service worker provides the foundation.
- Future: Use Web Push API + Supabase Edge Functions for shared draw notifications.
- Requires VAPID keys stored as Cloudflare Worker secrets.

### Manifest.json Improvements
- **Bug**: Single `app_logo.png` is declared as both 192x192 and 512x512. You need actual separate image files at those sizes, or at minimum the actual file should be 512x512 (it will downscale for 192x192).
- Add `"id": "/"` for PWA identity.
- Add `"scope": "/"`.
- Add `"prefer_related_applications": false`.
- Add `"screenshots"` array for richer install UI on Android.
- Change `"purpose": "any maskable"` to separate icon entries -- one `"purpose": "any"` and one `"purpose": "maskable"` (combining them is deprecated).

---

## 3. Build & Bundle Optimization

### Current Bundle Size Analysis
- No bundle analysis tooling is configured.
- **Add**: `rollup-plugin-visualizer` to vite.config.ts (conditionally, via `ANALYZE=true` env var) to generate a treemap of the bundle.
- **Add**: A `"build:analyze"` script to package.json.

### Tree-Shaking Opportunities

**lucide-react (v0.562.0)**:
- This is a large icon library. Verify that only used icons are imported (e.g., `import { Dice5 } from "lucide-react"` not `import * as icons`).
- The library supports tree-shaking, but barrel imports can defeat it.

**@hugeicons/react**:
- Same concern. Two icon libraries is unusual -- consider consolidating to one.

**@radix-ui packages**:
- Already modular (separate packages per component). Good.

**class-variance-authority + clsx + tailwind-merge**:
- Small libraries, no concern. But `clsx` + `tailwind-merge` are sometimes redundant if using `cn()` from shadcn. Verify only `cn()` is used (which combines both).

### Code Splitting Strategy
- Currently a single-route app (`routes/home.tsx`). Code splitting has minimal benefit.
- If settings dialog or history components grow, consider `React.lazy()` for the dialog content.
- The Radix Dialog already loads its content lazily when opened.

### Font Loading Optimization (Noto Sans)
- **Problem**: Google Fonts loaded via `<link rel="stylesheet">` in root.tsx is a render-blocking chain: HTML -> CSS -> Font files.
- **Recommendations**:
  1. Add `&display=swap` (already present in the URL -- good).
  2. Add `<link rel="preload">` for the most critical font weight (e.g., 400, 700).
  3. Consider self-hosting Noto Sans via `@fontsource/noto-sans` to eliminate the Google Fonts round-trip. This would be served from Cloudflare's edge alongside other assets.
  4. Use `font-display: optional` instead of `swap` to avoid FOUT on fast connections.

### Image Optimization
- `app_logo.png` and `eb_icon.png` in `/public/images/` are unoptimized PNGs.
- **Recommendations**:
  1. Convert to WebP (or AVIF) with PNG fallback.
  2. Provide multiple sizes (48, 96, 192, 512) for manifest icons.
  3. Consider using Cloudflare Image Resizing if available on the plan.
  4. Compress existing PNGs with `pngquant` or `oxipng`.

### Vite Build Configuration Improvements
- Current config is minimal (4 plugins, no custom build options).
- **Add**:
  ```ts
  build: {
    target: 'es2022',        // Modern browsers only (matches CF Workers)
    cssMinify: 'lightningcss', // Faster CSS minification
    rollupOptions: {
      output: {
        manualChunks: {
          'radix': ['@radix-ui/react-dialog', '@radix-ui/react-switch', '@radix-ui/react-separator'],
        }
      }
    }
  }
  ```
- Consider `build.reportCompressedSize: false` to speed up builds (Cloudflare handles gzip/brotli).

---

## 4. Supabase Integration - Technical Implementation

### Supabase Client Setup for Cloudflare Workers Edge

**@supabase/supabase-js compatibility**:
- v2.x works in Cloudflare Workers since it uses standard `fetch`.
- Import: `import { createClient } from '@supabase/supabase-js'`
- Create client per-request (Workers are stateless):
  ```ts
  // In a loader or action
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false } // No localStorage in Workers
  });
  ```

**Environment Variable Management**:
- Use `wrangler secret put SUPABASE_URL` and `wrangler secret put SUPABASE_ANON_KEY`.
- Add to wrangler.jsonc `vars` for non-secret values, secrets for keys.
- Update `worker-configuration.d.ts` (via `npm run cf-typegen`) to type `Env`.
- For local dev, use `.dev.vars` file (git-ignored).

### Database Schema

```sql
-- Draw sessions: each time user configures and runs draws
CREATE TABLE draw_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),  -- nullable for anonymous
  device_id TEXT,                           -- fingerprint for anonymous tracking
  start_number INT NOT NULL,
  end_number INT NOT NULL,
  draw_count INT NOT NULL,
  allow_duplicates BOOLEAN NOT NULL DEFAULT false,
  excluded_numbers INT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual draw results within a session
CREATE TABLE draw_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES draw_sessions(id) ON DELETE CASCADE,
  round_number INT NOT NULL,               -- 1st draw, 2nd draw, etc.
  drawn_numbers INT[] NOT NULL,            -- array of numbers drawn
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, round_number)
);

-- User preferences (synced from localStorage)
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  theme TEXT NOT NULL DEFAULT 'system',
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  default_start INT DEFAULT 1,
  default_end INT DEFAULT 45,
  default_count INT DEFAULT 6,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aggregate statistics
CREATE TABLE statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  total_draws INT NOT NULL DEFAULT 0,
  total_sessions INT NOT NULL DEFAULT 0,
  most_drawn_number INT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_draw_sessions_user ON draw_sessions(user_id);
CREATE INDEX idx_draw_sessions_device ON draw_sessions(device_id);
CREATE INDEX idx_draw_results_session ON draw_results(session_id);
CREATE INDEX idx_draw_sessions_created ON draw_sessions(created_at DESC);
```

### Row Level Security (RLS)

```sql
-- draw_sessions: users see only their own
ALTER TABLE draw_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own sessions" ON draw_sessions
  FOR SELECT USING (auth.uid() = user_id OR device_id = current_setting('app.device_id', true));
CREATE POLICY "Users create own sessions" ON draw_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- draw_results: access through session ownership
ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own results" ON draw_results
  FOR SELECT USING (
    session_id IN (SELECT id FROM draw_sessions WHERE user_id = auth.uid())
  );

-- user_settings: strict user-only
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);
```

### Edge Functions vs Cloudflare Workers

**Recommendation: Keep logic in Cloudflare Workers, NOT Supabase Edge Functions.**

Rationale:
- The app already runs on Cloudflare Workers with SSR. Adding Supabase Edge Functions creates a second edge runtime to maintain.
- Use Supabase purely as a database + auth provider (PostgREST API).
- Cloudflare Workers loaders/actions call Supabase client directly.
- Only use Supabase Edge Functions for Supabase-specific triggers (e.g., database webhooks, cron jobs for statistics aggregation).

### Supabase Realtime for Shared Draws

Use case: "Group lottery" where multiple users watch the same draw live.

```ts
// Client-side subscription
const channel = supabase
  .channel(`session:${sessionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'draw_results',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    // Update UI with new draw result
  })
  .subscribe();
```

- This is a future feature. No immediate implementation needed.
- Requires Supabase Realtime enabled on the project (enabled by default).

### Supabase Auth Integration Options

**Option 1: Anonymous auth (Recommended for MVP)**
- Supabase supports anonymous auth. Users get a UUID without sign-up.
- Upgrade to full account later (email/OAuth) preserving data.
- Zero friction for lottery app users.

**Option 2: Social auth (Google, Kakao)**
- Kakao is critical for Korean market.
- Supabase supports custom OAuth providers -- Kakao can be added.

**Option 3: No auth, device-based**
- Use a generated device ID stored in localStorage.
- Pass as a header to Workers, which sets it in Supabase RPC context.
- Simplest but no cross-device sync.

### Migration Strategy from localStorage to Supabase

1. **Phase 1**: Add Supabase client, write new draws to both localStorage AND Supabase.
2. **Phase 2**: On first Supabase connection, migrate existing localStorage history to Supabase.
3. **Phase 3**: Read primarily from Supabase, localStorage as offline fallback.
4. **Phase 4**: Remove localStorage for draw history (keep for theme/sound as instant-access cache).

---

## 5. Utility Logic Improvements

### app/lib/lottery.ts

**Performance issue in `getAvailableNumbers()`**:
- Uses `excluded.includes(i)` inside a loop, making it O(n*m) where n=range, m=excluded count.
- For MAX_RANGE=10000 with 5000 exclusions, this is 50 million comparisons.
- **Fix**: Convert `excluded` to a `Set` for O(1) lookup:
  ```ts
  export function getAvailableNumbers(start: number, end: number, excluded: number[] = []): number[] {
    const excludedSet = new Set(excluded);
    const available: number[] = [];
    for (let i = start; i <= end; i++) {
      if (!excludedSet.has(i)) available.push(i);
    }
    return available;
  }
  ```

**`getRandomNumbers()` is NOT Fisher-Yates**:
- Despite the JSDoc comment, it does NOT use Fisher-Yates shuffle. It calls `getRandomNumber()` in a loop, rebuilding the available array each time.
- For drawing 100 numbers from a range of 10000, it rebuilds and filters the array 100 times.
- **True Fisher-Yates approach**:
  ```ts
  export function getRandomNumbers(start, end, count, excluded, allowDuplicates): number[] {
    const available = getAvailableNumbers(start, end, excluded);
    if (!allowDuplicates) {
      // Fisher-Yates partial shuffle (only shuffle `count` elements)
      for (let i = available.length - 1; i > available.length - 1 - count && i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
      }
      return available.slice(available.length - count);
    }
    // Duplicates allowed: just pick randomly
    return Array.from({ length: count }, () =>
      available[Math.floor(Math.random() * available.length)]
    );
  }
  ```

**Crypto.getRandomValues() for better randomness**:
- `Math.random()` is PRNG-based and predictable. For a lottery app, users may expect cryptographic randomness.
- `crypto.getRandomValues()` is available in both browsers and Cloudflare Workers.
- **Recommendation**: Add a `secureRandom()` helper:
  ```ts
  function secureRandomIndex(max: number): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max; // Note: slight modulo bias for non-power-of-2, acceptable for this use case
  }
  ```
- For zero modulo bias, use rejection sampling, but the bias is negligible for ranges under 10000.

**Missing edge cases in `validateSettings()`**:
- No check for non-integer inputs (e.g., `startNumber = 1.5`).
- No check for negative numbers if that's a valid concern.
- No check for NaN/Infinity.

### app/lib/animation.ts

**Web Animations API consideration**:
- Current implementation uses `requestAnimationFrame` with manual timing -- this is correct and appropriate for coordinating number-change ticks with sound.
- Web Animations API (`element.animate()`) is better for CSS property animations but NOT for this discrete-step animation pattern.
- **Verdict**: Current approach is correct. No change needed.

**Animation schedule optimization**:
- `generateAnimationSchedule()` creates a new array on every call. Since params are usually constant (duration=2000, easing=easeOutQuart), consider memoizing the result.
- The schedule has ~15-20 timestamps. Array creation overhead is negligible. Memoization is optional.

**Potential improvement**:
- Add a `cancelable` AbortController pattern alongside the cleanup function for better integration with React 19's use of AbortSignal.

### app/lib/sound.ts

**AudioContext singleton concern**:
- The module-level `audioContext` singleton works but will accumulate audio nodes over time.
- Oscillator nodes are already auto-disconnected after `stop()`, so no leak. This is fine.

**AudioWorklet consideration**:
- AudioWorklet runs audio processing off the main thread. Overkill for simple oscillator sounds.
- **Verdict**: Not needed. Current OscillatorNode approach is correct.

**Sound preloading strategy**:
- The synthesized approach (no audio files) means no preloading needed. This is actually a strength -- zero network overhead for sounds.
- If custom sound files are added later, use `AudioBuffer` + `decodeAudioData()` with preloading on first user interaction.

**Potential improvements**:
- Add a `playError()` sound for invalid input or failed draw.
- Add haptic feedback via `navigator.vibrate()` alongside sounds for mobile.
- Consider using `AudioContext.close()` when leaving the page to free resources (add to `visibilitychange` event).

---

## 6. Development Infrastructure

### Testing Setup (vitest.config.ts)

**Current state**: Good foundation with 16 test files, jsdom environment, V8 coverage with 80% thresholds.

**Improvements**:
- **Missing test for sound.ts**: Not in coverage includes. Add `app/lib/sound.ts` to coverage includes.
- **Missing integration tests**: No test for the Cloudflare Workers handler (workers/app.ts). Consider `@cloudflare/vitest-pool-workers` for Workers-specific tests.
- **Alias duplication**: Both `~` and `@` resolve to `./app`. Consolidate to just `@` (matches tsconfig.json `paths`).
- **Add test scripts**: `"test:ci": "vitest run --reporter=junit --outputFile=test-results.xml"` for CI integration.

### CI/CD Pipeline (GitHub Actions)

**No CI/CD exists currently.** Recommend creating `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test:coverage
      - run: npm run build
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Preview Deployments
- Use Wrangler's `--env preview` with unique names per PR.
- Or use Cloudflare Pages (which has built-in preview deploys) -- but migrating from Workers would be effort.
- **Simplest**: Add a `deploy:preview` script: `wrangler deploy --name random-number-pr-$PR_NUMBER`.

### Environment Management

**Current state**: Single environment. No dev/staging/prod separation.

**Recommendation**:
- Add to wrangler.jsonc:
  ```jsonc
  "env": {
    "staging": {
      "name": "random-number-staging",
      "vars": { ... }
    },
    "production": {
      "name": "random-number",
      "vars": { ... }
    }
  }
  ```
- Scripts: `"deploy:staging": "npm run build && wrangler deploy --env staging"`
- Use `.dev.vars` for local development secrets (already git-ignored by default).

---

## File Ownership Summary

| File | Key Finding |
|------|-------------|
| `workers/app.ts` | Minimal, correct. Add edge caching logic here. |
| `vite.config.ts` | Add build targets, bundle analysis, PWA plugin. |
| `react-router.config.ts` | Fine as-is. Single SSR route. |
| `app/entry.server.tsx` | Add Cache-Control, ETag headers. |
| `public/manifest.json` | Fix icon purpose split, add scope/id/screenshots. |
| `package.json` | Remove placeholder, add CI scripts, consider consolidating icon libs. |
| `app/lib/lottery.ts` | Performance bug (O(n*m) exclusion), misleading Fisher-Yates comment, use crypto.getRandomValues(). |
| `app/lib/animation.ts` | Solid implementation. Minor: add AbortController pattern. |
| `app/lib/sound.ts` | Good synthesized approach. Add error sound, haptic feedback. |
| `wrangler.jsonc` | Add environment configs, remove placeholder var. |

## Priority Ranking

1. **P0 - Service Worker**: App claims to be a PWA but has no SW. This is the single biggest gap.
2. **P0 - lottery.ts performance**: The `excluded.includes()` O(n*m) bug will cause visible lag at higher ranges.
3. **P1 - CI/CD**: No automated testing or deployment pipeline.
4. **P1 - Edge caching headers**: Free performance win in entry.server.tsx.
5. **P1 - Font self-hosting**: Eliminate Google Fonts dependency for offline + performance.
6. **P2 - Bundle analysis tooling**: Need visibility before optimizing.
7. **P2 - Supabase integration**: Full schema and client setup ready when needed.
8. **P3 - crypto.getRandomValues()**: Nice-to-have for perceived legitimacy.

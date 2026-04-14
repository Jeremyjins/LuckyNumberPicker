# Research Brainstorming Report

## 1. PWA Best Practices 2025-2026

### Key Findings

- **Service workers are no longer required for install prompts** in Chrome and Edge (2025+), but they remain essential for offline functionality and background sync. ([PWAs 2025: Master Service Workers](https://blog.madrigan.com/en/blog/202603030957/))
- **Workbox 7 now integrates natively with Vite**, webpack, and Next.js build pipelines, making service worker setup significantly easier for modern frameworks. ([Progressive Web Apps 2026: PWA Performance Guide](https://www.digitalapplied.com/blog/progressive-web-apps-2026-pwa-performance-guide))
- **Caching strategy best practices remain stable**: Cache-first for static assets (CSS, JS, fonts), Network-first for API responses, and Stale-while-revalidate for semi-dynamic content. ([MDN PWA Best Practices](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices))
- **Business impact is proven**: Pinterest's PWA increased engagement by 60% and ad revenue by 44%. Twitter Lite reduced data usage by 70%. Alibaba's PWA drove 76% more conversions. ([PWA Stats](https://www.pwastats.com/))
- **Desktop PWA installations increased 400%+ since 2021** according to Google, demonstrating continued momentum. ([The State of Progressive Web Apps 2025](https://www.enonic.com/blog/state-of-progressive-web-apps))
- **Lighthouse PWA audit** now provides a comprehensive pass/fail checklist covering installability, offline behavior, and best practices. ([PWA Web Almanac 2025](https://almanac.httparchive.org/en/2025/pwa))
- The manifest.json should specify `display: "standalone"`, multiple icon sizes, `start_url`, `scope`, `theme_color`, and `background_color`. ([Microsoft Edge PWA Best Practices](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/best-practices))

### Recommendations for This App

1. **Add a service worker using Workbox 7 + Vite plugin** (`vite-plugin-pwa` or Workbox directly): Since this app runs on Cloudflare Workers with Vite 7, Workbox integration should be straightforward. Use Cache-first for the app shell and static assets.
2. **Implement offline support**: The lottery drawing is entirely client-side, so the app can work 100% offline with proper caching. This is a major PWA advantage.
3. **Add install promotion**: Show a custom "Add to Home Screen" banner for Korean users who may not be familiar with PWA installation.
4. **Optimize the manifest**: Ensure multiple icon sizes (192x192, 512x512, maskable), proper `theme_color` matching the app's theme system, and `display: "standalone"`.
5. **Background sync for history**: If persistence is added via Supabase, use Background Sync API to queue history saves when offline.

### Service Worker Strategy for This App

```
Static Assets (JS/CSS/fonts/images) -> Cache First (with versioning)
App Shell (HTML)                     -> Stale While Revalidate
API Calls (if Supabase added)        -> Network First with offline fallback
Audio Files                          -> Cache First (sounds are static)
```

---

## 2. Supabase + Cloudflare Workers Integration

### Technical Findings

- **supabase-js works directly in Cloudflare Workers** since it communicates via HTTP using PostgREST (no TCP database connections needed). This is a key advantage over traditional ORMs. ([Supabase + Cloudflare Workers](https://supabase.com/partners/integrations/cloudflare-workers))
- **Cloudflare Workers dashboard has native Supabase integration**: You can authenticate with your Supabase account and automatically inject `SUPABASE_URL` and `SUPABASE_KEY` environment variables. ([Cloudflare Workers Supabase Docs](https://developers.cloudflare.com/workers/databases/third-party-integrations/supabase/))
- **Secrets management**: Use `wrangler secret put SUPABASE_URL` and `wrangler secret put SUPABASE_ANON_KEY` to securely store credentials.
- **Edge caching pattern**: Use Cloudflare KV to cache Supabase data at the edge, with `context.waitUntil()` for async cache updates. ([Cache Supabase data at the Edge](https://egghead.io/courses/cache-supabase-data-at-the-edge-with-cloudflare-workers-and-kv-storage-883c7959))
- **Hyperdrive for lower latency**: Cloudflare Hyperdrive provides connection pooling for direct Postgres connections when PostgREST isn't sufficient. ([LogRocket: Integrating Supabase with Cloudflare Workers](https://blog.logrocket.com/integrating-supabase-cloudflare-workers/))
- **Region placement matters**: Place the Supabase project in a region close to the primary user base (Seoul/Tokyo for Korean users) to minimize edge-to-database latency.

### Connection Pattern (from Supabase Context7 docs)

```javascript
// In Cloudflare Worker
import { createClient } from '@supabase/supabase-js'

export default {
  async fetch(request, env) {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
    const { data } = await supabase.from('draw_history').select('*')
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

### Recommended Architecture

1. **Phase 1 (Current)**: Client-side only, localStorage for history
2. **Phase 2 (Optional persistence)**: Add Supabase for draw history sync
   - Cloudflare Worker acts as API proxy with RLS enforcement
   - Supabase Anon key with Row Level Security policies
   - Client stores draws locally first, syncs to Supabase when online
3. **Phase 3 (Social features)**: Supabase Auth + Realtime for shared draws
   - Supabase Realtime for live group drawing sessions
   - Supabase Auth with Kakao OAuth (popular in Korea)

### Offline-First Sync Strategy

- Store all draw results in IndexedDB (or localStorage) immediately
- Queue sync operations when network is available
- Use service worker Background Sync API to flush queue
- On reconnect, merge local and remote history with timestamp-based conflict resolution

---

## 3. Web APIs Enhancement Opportunities

### Web Share API

- **Browser Support**: Supported in Chrome (Android/Desktop), Safari (iOS/macOS), Edge. NOT supported in Firefox desktop.
- **Value for This App**: HIGH - Users can share their lucky numbers via KakaoTalk, SMS, etc. Korean users heavily use KakaoTalk sharing.
- **Implementation Pattern**:
```javascript
async function shareLotteryResult(numbers: number[]) {
  if (navigator.share) {
    await navigator.share({
      title: '행운번호 추첨 결과',
      text: `오늘의 행운번호: ${numbers.join(', ')}`,
      url: window.location.href
    })
  } else {
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(`행운번호: ${numbers.join(', ')}`)
  }
}
```

### Vibration API

- **Browser Support**: Chrome and Android browsers. NOT supported in Safari/iOS (major limitation for Korean market where iPhone share is ~30%).
- **Value for This App**: MEDIUM - Haptic feedback on number draw adds tactile excitement, but iOS limitation reduces reach.
- **Implementation Pattern**:
```javascript
function vibrateOnDraw() {
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 30, 50]) // short double pulse
  }
}
```

### Screen Wake Lock API

- **Browser Support**: Supported in ALL major browsers as of January 2025 (Chrome, Edge, Firefox, Safari). ([Screen Wake Lock API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API))
- **Value for This App**: MEDIUM - Prevents screen from dimming during the draw animation sequence. Useful for longer draw sequences.
- **Implementation Pattern**:
```javascript
let wakeLock = null
async function keepScreenAwake() {
  if ('wakeLock' in navigator) {
    wakeLock = await navigator.wakeLock.request('screen')
  }
}
async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release()
    wakeLock = null
  }
}
```

### View Transitions API

- **Browser Support**: Chrome 111+, Edge 111+. Safari 18+. Firefox is behind a flag (as of early 2026).
- **Value for This App**: HIGH - Smooth transitions between draw states (idle -> drawing -> results -> history) would significantly enhance the premium feel.
- **Implementation Pattern**: React Router 7 has built-in View Transitions support via `unstable_viewTransition` on `<Link>` and `useViewTransitionState()`.
```javascript
// In React Router 7, use startViewTransition
document.startViewTransition(() => {
  // update DOM / state
})
```

### Web Animations API

- **Browser Support**: Universal support across all modern browsers.
- **Value for This App**: MEDIUM-HIGH - Could replace custom `requestAnimationFrame` loops in `useDrawAnimation.ts` with more declarative, GPU-accelerated animations.
- **Consideration**: The app already has custom RAF-based animation in `app/lib/animation.ts` and `app/hooks/useDrawAnimation.ts`. Migrating may not be worth it if current animations work well.

### Badging API

- **Browser Support**: Chrome 81+, Edge 81+. NOT in Safari or Firefox.
- **Value for This App**: LOW - Could show number of saved results on the app icon, but limited browser support and low utility.

### Clipboard API

- **Browser Support**: Universal.
- **Value for This App**: HIGH - Essential fallback for Web Share API. One-tap copy of lottery results.

### Other Relevant APIs

- **Notification API**: Could remind users of daily draws. Requires service worker + user permission.
- **Web Audio API**: Already implemented in the app (`app/lib/sound.ts`, `app/hooks/useSound.ts`).
- **Fullscreen API**: Could offer immersive draw experience on mobile.

### Priority Ranking for Implementation

| API | Value | Effort | Priority |
|-----|-------|--------|----------|
| Web Share API | HIGH | Low | P0 |
| View Transitions API | HIGH | Medium | P1 |
| Screen Wake Lock API | MEDIUM | Low | P1 |
| Clipboard API | HIGH | Low | P0 |
| Vibration API | MEDIUM | Low | P2 |
| Web Animations API | MEDIUM-HIGH | High | P3 |
| Badging API | LOW | Low | P3 |

---

## 4. Korean Market Insights

### Findings

- **Korean smartphone penetration is among the highest globally** (~97%), with roughly 70% Android / 30% iOS split (Samsung dominance).
- **KakaoTalk is the dominant messaging platform** (93%+ market share in Korea) - any sharing feature MUST prioritize KakaoTalk integration via Web Share API or Kakao JavaScript SDK.
- **Korean users expect polished mobile experiences** comparable to native apps. Attention to micro-interactions, smooth animations, and haptic feedback is important.
- **PWA adoption in Korea is growing but still behind native apps** - major Korean services (Coupang, Naver, Kakao) primarily use native apps, but smaller services increasingly adopt PWAs for cost efficiency.
- **The global PWA market is expected to exceed $15 billion by 2025** with continued growth. ([Straits Research PWA Market Report](https://straitsresearch.com/report/progressive-web-apps-market))
- **Naver and Daum/Kakao search engines** are the primary discovery channels in Korea (not just Google). SEO/meta tags should include Korean-language Open Graph tags.

### UX Recommendations for Korean Market

1. **Korean Typography**: Use system fonts that render Korean well (`-apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif`). Consider line-height and letter-spacing optimized for Hangul.
2. **KakaoTalk Share Button**: Add a dedicated Kakao share button alongside generic Web Share, as Korean users strongly prefer KakaoTalk.
3. **Number Presentation**: Korean lottery (Lotto 6/45) uses colored number balls - users may expect familiar visual patterns.
4. **Dark Mode**: Korean users (especially younger demographics) strongly prefer dark mode options. The app already has theme support.
5. **Fast Load Times**: Korean mobile networks are among the fastest globally (5G penetration ~55%), but users have correspondingly high performance expectations.
6. **Naver/Kakao SEO**: Include proper `og:title`, `og:description`, `og:image` meta tags in Korean for sharing on Korean platforms.
7. **App Install Banner**: Korean users may not know they can "install" a web app. Provide a clear, localized install prompt.

---

## 5. Celebration Effects Research

### Options Compared

| Library | Size (gzipped) | Features | Ease of Use | Framework |
|---------|----------------|----------|-------------|-----------|
| **canvas-confetti** | ~6 KB | Confetti, snow, fireworks, custom shapes | Very easy (imperative API) | Framework-agnostic |
| **react-confetti** | ~8 KB | Full-screen confetti rain | Easy (declarative React component) | React-specific |
| **react-rewards** | ~3 KB | Confetti, emoji, balloons | Very easy | React-specific |
| **@neoconfetti/react** | ~3 KB | High-performance confetti | Easy | React-specific |
| **CSS-only confetti** | 0 KB | Basic confetti with @keyframes | Medium | None |
| **tsParticles** | ~30 KB | Extensive particle effects | Complex | Framework-agnostic |

### Detailed Analysis

**canvas-confetti** (https://github.com/catdad/canvas-confetti)
- Most popular choice (~6K+ GitHub stars)
- Framework-agnostic, works anywhere with a simple function call
- Supports custom colors, shapes, particle count, spread angle
- Uses a dedicated canvas element, minimal performance impact
- Great for a lottery app: can create "burst" effects from the result display area

**@neoconfetti/react** (https://github.com/PuruVJ/neoconfetti)
- Smallest React option (~3 KB)
- Declarative: `<Confetti />` component
- High performance with CSS animations (not canvas)
- Good for simple celebration moments

**react-rewards**
- Provides `useReward()` hook - very React-idiomatic
- Supports confetti, emoji (could use number emojis!), and balloons
- Lightweight at ~3 KB

**CSS-only approach**
- Zero bundle cost
- Can use `@keyframes` with `::before`/`::after` pseudo-elements
- Limited in complexity but sufficient for subtle celebrations
- The app already uses `tw-animate-css` which could be extended

### Recommendation

**Primary: canvas-confetti** (~6 KB) - Best balance of features, size, and flexibility.
- Imperative API works well with the existing animation hook pattern in `useDrawAnimation.ts`
- Can trigger confetti from specific coordinates (e.g., from the result display)
- No React wrapper needed, keeps it simple
- Custom colors can match the app's theme

**Alternative: CSS-only** for a zero-dependency approach using the existing `app.css` and Tailwind animation utilities. Good enough for subtle sparkle effects.

**For this lottery app specifically**: A burst of gold/yellow confetti when all numbers are revealed would be impactful. canvas-confetti's `confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })` is a one-liner that achieves this.

---

## 6. Accessibility Research

### Findings

Based on WCAG 2.1 guidelines and lottery/random number app patterns:

**Screen Reader Considerations**
- Random number results MUST be announced via `aria-live="polite"` (or `"assertive"` for the final result) regions
- Each drawn number should be announced individually during animation, not just the final set
- The draw button state changes (idle -> drawing -> complete) must be communicated via `aria-label` updates
- History items should use semantic list markup (`<ol>` for ordered draw history)

**Motion and Animation**
- **`prefers-reduced-motion`**: The app MUST respect this media query. Users with vestibular disorders can be severely affected by the spinning/bouncing number animations.
- Current `app/lib/animation.ts` and `app/hooks/useDrawAnimation.ts` should check `window.matchMedia('(prefers-reduced-motion: reduce)')` and skip to instant results.
- CSS animations should use `@media (prefers-reduced-motion: reduce) { animation: none; }`.

**Keyboard Navigation**
- All interactive elements (draw button, settings dialog, history items) must be keyboard-accessible
- The draw sequence should be controllable via keyboard (Space/Enter to start)
- Focus management: After draw completes, focus should move to the result display
- Radix UI components (Dialog, Switch) already handle this well

**Color and Contrast**
- Number balls/badges must meet WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Don't rely solely on color to distinguish numbers - also use position/order
- The theme system should ensure all themes meet contrast requirements

**Cognitive Accessibility**
- Clear, simple language for controls (the app is already in Korean, ensure clarity)
- Consistent layout - draw results should always appear in the same location
- Provide clear feedback for all actions (sound + visual + screen reader announcement)

### Implementation Priorities

| Priority | Item | Effort |
|----------|------|--------|
| P0 | `aria-live` regions for draw results | Low |
| P0 | `prefers-reduced-motion` support | Medium |
| P0 | Keyboard navigation for draw flow | Low (Radix helps) |
| P1 | Focus management after draw | Low |
| P1 | Contrast audit across all themes | Medium |
| P1 | Semantic HTML for history list | Low |
| P2 | Skip-to-content link | Low |
| P2 | Screen reader testing with VoiceOver (Korean) | Medium |

### Code Pattern for Accessible Draw Results

```tsx
// Accessible result announcement
<div aria-live="assertive" aria-atomic="true" className="sr-only">
  {isComplete && `추첨 완료. 행운번호: ${numbers.join(', ')}`}
</div>

// Visible results with ARIA
<div role="status" aria-label="추첨 결과">
  {numbers.map((num, i) => (
    <span key={i} aria-label={`${i + 1}번째 번호: ${num}`}>
      {num}
    </span>
  ))}
</div>
```

### Reduced Motion Pattern

```typescript
// In useDrawAnimation.ts
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

if (prefersReducedMotion) {
  // Skip animation, show results immediately
  setNumbers(finalNumbers)
  setIsComplete(true)
  return
}
```

---

## Summary: Top 10 Action Items

1. **Add service worker with Workbox 7** for offline support and installability
2. **Implement Web Share API** with KakaoTalk-optimized sharing text
3. **Add `aria-live` regions** for screen reader announcement of draw results
4. **Support `prefers-reduced-motion`** in all animation hooks
5. **Integrate canvas-confetti** (~6 KB) for celebration effects on draw completion
6. **Add Screen Wake Lock** during draw sequences
7. **Optimize manifest.json** with maskable icons, shortcuts, and proper Korean metadata
8. **Add View Transitions** for smooth state changes (React Router 7 supports this)
9. **Set up Supabase integration path** in Cloudflare Worker for future persistence
10. **Add Korean-optimized Open Graph meta tags** for KakaoTalk/Naver sharing previews

---

## Sources

- [Progressive Web Apps (PWA) Best Practices for 2026](https://wirefuture.com/post/progressive-web-apps-pwa-best-practices-for-2026)
- [PWAs 2025: Master Service Workers, Manifests, and Security](https://blog.madrigan.com/en/blog/202603030957/)
- [PWA | 2025 | The Web Almanac](https://almanac.httparchive.org/en/2025/pwa)
- [Progressive Web Apps 2026: PWA Performance Guide](https://www.digitalapplied.com/blog/progressive-web-apps-2026-pwa-performance-guide)
- [Best practices for PWAs - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices)
- [Best practices for PWAs - Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/best-practices)
- [CloudFlare Workers | Works With Supabase](https://supabase.com/partners/integrations/cloudflare-workers)
- [Supabase - Cloudflare Workers docs](https://developers.cloudflare.com/workers/databases/third-party-integrations/supabase/)
- [Integrating Supabase with Cloudflare Workers - LogRocket](https://blog.logrocket.com/integrating-supabase-cloudflare-workers/)
- [Cache Supabase data at the Edge - egghead.io](https://egghead.io/courses/cache-supabase-data-at-the-edge-with-cloudflare-workers-and-kv-storage-883c7959)
- [Screen Wake Lock API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Screen Wake Lock API supported in all browsers - web.dev](https://web.dev/blog/screen-wake-lock-supported-in-all-browsers)
- [Top 10 Underrated JavaScript APIs 2025 - Growin](https://www.growin.com/blog/top-10-underrated-javascript-apis-in-2025/)
- [Progressive Web Apps Market - Straits Research](https://straitsresearch.com/report/progressive-web-apps-market)
- [The State of Progressive Web Apps 2025 - Enonic](https://www.enonic.com/blog/state-of-progressive-web-apps)
- [PWA Stats](https://www.pwastats.com/)
- [canvas-confetti - GitHub](https://github.com/catdad/canvas-confetti)
- [@neoconfetti/react - GitHub](https://github.com/PuruVJ/neoconfetti)
- [How to Host a Full-Stack App with Cloudflare + Supabase - DEV](https://dev.to/hexshift/how-to-host-a-scalable-full-stack-app-for-free-using-cloudflare-pages-workers-and-supabase-2ke5)
- [Supabase JS on JSR](https://jsr.io/@supabase/supabase-js)

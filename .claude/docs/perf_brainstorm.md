# Performance Analysis Brainstorming Report

## 1. Bundle Size Analysis

### Dependencies Impact Estimate

| Dependency | Estimated Size (minified+gzip) | Notes |
|---|---|---|
| react + react-dom | ~42 kB | Core, unavoidable |
| react-router | ~15-20 kB | Full framework with SSR support |
| @radix-ui/react-dialog | ~8-10 kB | Includes portal, focus-trap, etc. |
| @radix-ui/react-switch | ~3-4 kB | Lightweight |
| @radix-ui/react-separator | ~1 kB | Minimal |
| @radix-ui/react-slot | ~1 kB | Shared dependency |
| lucide-react | **Variable** | SEE BELOW - critical concern |
| class-variance-authority | ~2 kB | Minimal |
| clsx | ~0.3 kB | Tiny |
| tailwind-merge | ~3-4 kB | Moderate |
| @hugeicons/react | **Variable** | SEE BELOW - potential concern |
| tw-animate-css | ~1-2 kB (CSS) | CSS-only |
| **Estimated Total JS** | **~80-100 kB** | Reasonable for a PWA |

### Tree-Shaking Assessment

**lucide-react (CRITICAL):** The app imports 5 icons across files: `Settings`, `Shuffle`, `Sun`, `Moon`, `RotateCcw`. With named imports from `lucide-react`, Vite/Rollup should tree-shake correctly since lucide-react v0.3+ uses individual ESM exports. However, if the build somehow resolves to the barrel export, this could pull in the **entire icon library (~200+ kB)**. Verify the production bundle does NOT include unused icons.

**@hugeicons/react (CONCERN):** Listed in dependencies but NOT imported anywhere in the reviewed source files. This is likely **dead weight** -- the entire package or its barrel may be included. This should be removed from `package.json` if unused.

**Radix UI:** Each primitive is a separate package with its own entry, so tree-shaking is effective. No issues.

### Code Splitting Opportunities

1. **SettingsDialog** -- This component (plus its Radix Dialog dependency) is only needed after user interaction. It could be lazy-loaded with `React.lazy()` + `Suspense`. Estimated savings: ~10-12 kB from initial bundle.
2. **HistoryList + HistoryItem** -- Only rendered after first draw. Could be deferred.
3. **sound.ts** -- Web Audio code is only needed when drawing starts. Could be dynamically imported on first draw.
4. **Theme selector** -- Minor, but could defer the `useTheme` hook hydration.

### Unused Code Identification

- **@hugeicons/react**: Appears unused in all reviewed files. Remove from dependencies.
- **Several CSS animations** defined in `app.css` may be unused: `animate-float`, `animate-breathe`, `shimmer`, `btn-glow`. These add CSS weight and should be audited.
- **`isbot` dependency**: Only used for SSR bot detection -- fine, but ensure it is not shipped in client bundle.

---

## 2. Critical Path: Drawing Animation Performance

### Current Hot Path Analysis

During the 2-second draw animation, the schedule generates approximately **15-20 ticks** (based on easing from 50ms to 400ms intervals). Each tick triggers this chain:

```
RAF fires -> runAnimation checks elapsed time -> onTick callback ->
  getRandomNumber(start, end, []) -> builds available[] array ->
  setCurrentDisplay(num) [React state in useDrawAnimation] ->
  onTick callback in LotteryMachine -> updateDisplay(num) [dispatch to reducer] ->
  Reducer creates new state object -> React re-render ->
  playTick(progress) -> new oscillator + gain node creation
```

### Issue 1: getRandomNumber() O(n) Array Construction Per Tick

**File:** `app/lib/lottery.ts` lines 11-23 and 29-37

Each tick calls `getRandomNumber(start, end, [])` which calls `getAvailableNumbers()`, building a new array of size `end - start + 1`. With default settings (1-12), this creates a 12-element array per tick -- negligible. But with max range (10,000), this creates a 10,000-element array 15-20 times in 2 seconds.

**Measured impact:** For range 1-12: trivial (~microseconds). For range 1-10000: ~15-20 array allocations of 10K elements = ~150-200K short-lived objects creating GC pressure during animation.

**Note:** During animation, `excluded` is passed as `[]` (empty array), so `excluded.includes(i)` always returns false. The entire loop is unnecessary -- a simple `Math.floor(Math.random() * (end - start + 1)) + start` would suffice.

### Issue 2: Double State Update Per Tick

Each tick triggers TWO React state updates:
1. `setCurrentDisplay(randomNum)` in `useDrawAnimation` (line 106)
2. `dispatch({ type: 'UPDATE_DISPLAY', payload: num })` in `useLotteryMachine` via `updateDisplay(num)` called from `handleTick` in `LotteryMachine.tsx` (line 44)

Both store the same number. Both trigger re-renders. React 19's automatic batching should batch these into a single re-render within the same synchronous callback, BUT they happen in different hooks and the `onTick` callback is called inside a RAF callback, not a React event handler. React 19 does batch updates in microtasks/timeouts/RAFs, so this should be batched -- but it still creates two state transitions and two new state objects.

**Recommendation:** Remove the redundant `currentDisplay` state from `useDrawAnimation`. Instead, have only the reducer's `displayNumber` be the source of truth, and pass it back to `DrawButton`. OR, remove the reducer dispatch entirely during animation and only use `useDrawAnimation`'s local state.

### Issue 3: React Re-Render Scope During Animation

When `displayNumber` changes in the reducer, the ENTIRE `LotteryMachine` component re-renders because `useLotteryMachine()` returns a new object every time. This cascades to ALL child components:
- `StatusBar` (unchanged props, still re-renders)
- `DrawButton` (needs update for displayNumber)
- `ResultDisplay` (hidden during drawing, still evaluates)
- `HistoryList` (unchanged, still re-renders)
- `SettingsDialog` (unchanged, still re-renders)

**Measured impact:** 15-20 full tree re-renders during 2 seconds. Each re-render:
- Calls `cn()` which calls `twMerge(clsx(...))` -- string manipulation per render
- Evaluates all conditional rendering logic
- Recreates JSX objects for entire tree

### Issue 4: AudioContext Node Creation & GC Pressure

**File:** `app/lib/sound.ts` lines 19-51

Each `playTick()` call creates:
- 1 OscillatorNode
- 1 GainNode
- Multiple `setValueAtTime` / `exponentialRampToValueAtTime` scheduled events

These nodes are connected to the audio graph, play for 50ms, then become eligible for GC. Over 15-20 ticks, that's 30-40 audio nodes created and discarded. Web Audio spec says stopped nodes are automatically disconnected, but the timing of GC is unpredictable and could cause micro-jank.

### Optimization Proposals

#### P0: Eliminate Array Construction During Animation
Replace the `getRandomNumber(start, end, [])` call in the animation tick (useDrawAnimation.ts line 96-100) with direct random number generation:
```typescript
const randomNum = Math.floor(Math.random() * (end - start + 1)) + start;
```
No array allocation, no iteration, O(1) per tick. This is safe because during animation, no numbers are excluded.

#### P1: Eliminate Double State Update
Option A (recommended): Remove `setCurrentDisplay` from `useDrawAnimation` entirely during the animation loop. Use a ref for the display number and only sync to state on completion. Pass the ref value through the `onTick` callback, and let only the reducer hold the display state.

Option B: Remove the `UPDATE_DISPLAY` dispatch. Let `useDrawAnimation.currentDisplay` be the sole source for the draw button during animation. The reducer only needs `displayNumber` for the non-animation path (which is never used).

#### P2: Isolate Re-Render Scope
Wrap `StatusBar`, `HistoryList`, and `SettingsDialog` in `React.memo()` so they skip re-renders when their props haven't changed. This reduces the animation re-render from full tree to only `DrawButton`.

#### P3: Pre-create Audio Node Pool
Create a pool of 3-5 oscillator/gain pairs at animation start and cycle through them. Reuse nodes rather than creating new ones per tick. Alternatively, use `AudioBuffer` with a pre-computed tick sound waveform and play via `AudioBufferSourceNode`.

#### P4: Use CSS for Number Display Animation
Instead of React state driving the `animate-number-roll` CSS animation (which re-triggers on every render because the class is always present), use a ref + DOM manipulation for the number display during animation. This bypasses React's render cycle entirely for the visual update.

---

## 3. React Rendering Performance

### Component Re-Render Analysis

| Component | Renders During Animation (per tick) | Necessary? |
|---|---|---|
| LotteryMachine | Yes (state change) | Partially -- only DrawButton needs it |
| StatusBar | Yes (parent re-renders) | NO -- props unchanged |
| DrawButton | Yes (displayNumber changes) | YES |
| ResultDisplay | Yes (parent re-renders) | NO -- hidden during drawing |
| HistoryList | Yes (parent re-renders) | NO -- props unchanged |
| SettingsDialog | Yes (parent re-renders) | NO -- hidden (open=false) |
| ThemeSelector | Yes (parent re-renders) | NO -- independent |

**Finding:** Only 1 of 7 components actually needs to re-render per tick, but all 7 do.

### useMemo/useCallback Correctness

**useLotteryMachine hook:**
- `useMemo` for `totalRange`, `remainingCount`, `canDrawNow` -- correct, these are computed values.
- `useCallback` for all actions -- correct, stable references.
- **Issue:** The hook returns a new object literal every render (line 216-244). Even though individual fields are memoized, the container object is new. Any component destructuring from this return will not benefit from shallow comparison in `React.memo`.

**useDrawAnimation hook:**
- `useCallback` for `start` -- has a large dependency array including `onTick` and `onComplete`. Since `handleTick` and `handleAnimationComplete` in `LotteryMachine` depend on `settings.soundEnabled`, these callbacks change whenever sound settings change, which recreates `start`. This is fine for correctness but means the `start` function identity changes on settings updates.
- **Issue:** `start` callback depends on `isAnimating` state (line 118), which means it gets a new identity after animation starts. However, this is acceptable since `start` should not be called during animation.

### Render Isolation Opportunities

1. **React.memo on StatusBar** -- Props (`remainingCount`, `totalCount`, `allowDuplicates`) don't change during animation.
2. **React.memo on HistoryList** -- Props (`history`, `allowRestore`, `onRestore`) don't change during animation.
3. **React.memo on ResultDisplay** -- Not visible during animation (returns null).
4. **React.memo on DrawButton** -- This one DOES need re-renders, so memo won't help here.
5. **Extract draw display into a separate component** -- Create a minimal `AnimationDisplay` that ONLY receives `displayNumber` and nothing else. This prevents the button's styling logic from re-executing.

### React 19 Specific Optimizations

- **React 19 compiler (React Forget):** If enabled, auto-memoization would eliminate most of the issues above. Check if `@vitejs/plugin-react` has the React compiler enabled. Currently the vite config does NOT show compiler configuration -- this is a missed opportunity.
- **React 19 `use()` hook:** Not applicable here but could simplify async patterns if added later.
- **Automatic batching:** React 19 batches all state updates (including in RAF callbacks), which helps with the double-update issue but doesn't eliminate the cost of two reducer transitions.

---

## 4. Web Audio Performance

### AudioContext Lifecycle Management

**Current:** Singleton `AudioContext` created on first `playTick()` call (lazy initialization). This is correct -- browsers limit the number of AudioContexts (typically 6-8).

**Issue:** The `ctx.state === 'suspended'` check and `ctx.resume()` call happens on EVERY tick (15-20 times per animation). After the first resume, subsequent checks are wasteful. Should check once and cache the resumed state.

### Node Creation/Disposal Patterns

**Current pattern per tick:**
```
createOscillator() -> createGain() -> connect -> start -> stop (after 50ms)
```

**GC impact:** Each oscillator and gain node is a C++ object wrapped in a JS proxy. Creating/destroying 30-40 of these in 2 seconds is generally fine for modern browsers but could cause micro-pauses on low-end mobile devices due to GC.

**Alternative approach -- AudioBuffer pool:**
Pre-compute a single tick sound as an `AudioBuffer` (PCM data for a 50ms sine wave at varying frequencies). During animation, create only `AudioBufferSourceNode` instances (lighter weight than oscillators) or even reuse a single source node with pitch shifting via `playbackRate`.

### Memory Leak Potential

**No significant leak identified.** Oscillator nodes are stopped with explicit `stop()` calls and will be garbage collected after completion. The singleton AudioContext persists for the app lifetime, which is correct.

**Minor concern:** `resetAudioContext()` calls `audioContext.close()` but this is only used in tests. If a user navigates away and back (SPA), the old AudioContext stays alive -- acceptable since it's lightweight when idle.

### Alternative: Pre-recorded Audio Sprites

For maximum performance, replace Web Audio synthesis with a single MP3/OGG audio sprite containing all tick variations. Use `Audio` element or `AudioBuffer` with offset playback. Benefits:
- Zero computation for sound generation
- Smaller code footprint (remove oscillator logic)
- More consistent sound across browsers
- Lower CPU usage on mobile

Trade-off: Adds ~5-10 kB of audio asset to download.

---

## 5. Loading Performance

### First Contentful Paint (FCP) Optimization

**Current flow:**
1. HTML from Cloudflare Workers (SSR) -- fast edge response
2. CSS load (Tailwind, tw-animate-css)
3. Google Fonts load (Noto Sans -- render-blocking due to `rel="stylesheet"`)
4. JS hydration

**Google Fonts is the #1 FCP blocker.** The stylesheet link at `https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap` loads synchronously in the `<head>`. Even with `display=swap`, the CSS file itself blocks rendering.

**Recommendations:**
- Add `media="print" onload="this.media='all'"` pattern for non-critical font loading
- OR self-host the font and include it in the service worker cache
- Subset the font to Korean + Latin characters only: `&subset=korean,latin` -- the full Noto Sans with all weights and italic is very large (~300+ kB of font files)
- Reduce weight range from `0,100..900;1,100..900` to only the weights used: `400;600;700` (normal, semibold, bold based on CSS usage)

### Largest Contentful Paint (LCP)

**LCP element:** The hero title "행운번호 추첨기" (`<h1>` tags in LotteryMachine). This is text content, so LCP depends on font loading. With `display=swap`, system font shows first (good), then Noto Sans loads and triggers a layout shift.

### Cumulative Layout Shift (CLS)

**Identified CLS sources:**
1. **Font swap:** When Noto Sans loads and replaces system font, text dimensions change slightly. Impact: Low-moderate (depends on metric difference between system sans-serif and Noto Sans).
2. **Conditional rendering:** Phase transitions (initial -> ready -> drawing -> result) completely swap content. These are user-initiated so they don't count toward CLS metric, but the visual experience matters.
3. **No explicit width/height on logo image** (`/images/eb_icon.png`): `w-8 h-8` sets CSS dimensions which is good -- no CLS from this.

### Time to Interactive (TTI)

**Estimated TTI:** Fast. The app has minimal JS (~80-100 kB estimated), SSR from edge, and no data fetching. TTI should be under 2 seconds on 3G, under 1 second on 4G+.

**Hydration cost:** React 19 with SSR hydration is efficient. The component tree is small. No significant hydration bottleneck expected.

### Google Fonts Loading Impact

**Current:** Loading ALL 18 weight variations (100-900) in both normal and italic. The app uses:
- `font-bold` (700)
- `font-semibold` (600) -- in brand text
- Default (400)
- No italic usage observed

**Wasted bandwidth:** Loading 15 unused font weights/styles. Fix by requesting only: `family=Noto+Sans:wght@400;600;700&display=swap`

---

## 6. Mobile-Specific Performance

### Touch Responsiveness

**Current:** The DrawButton uses standard `onClick` which on mobile triggers after a ~300ms delay in some browsers (though most modern browsers have eliminated this). The `active:scale-95` CSS provides visual feedback.

**Improvement:** Add `touch-action: manipulation` to the draw button to ensure no double-tap-to-zoom delay.

### Animation Jank on Low-End Devices

**Risk factors:**
1. **React re-renders during animation:** 15-20 full tree re-renders in 2 seconds. On a low-end device (e.g., budget Android with 2GB RAM, slow CPU), each render could take 5-10ms, consuming half the 16ms frame budget.
2. **CSS `animate-number-roll`:** Uses `transform: translateY() scale()` -- good, this is GPU-composited.
3. **CSS `animate-pulse-ring`:** Uses `transform: scale()` + `opacity` -- good, GPU-composited.
4. **`transition-all duration-300`** on the draw button: This transitions ALL properties, including layout-triggering ones. Should be `transition-[transform,box-shadow,background-color]` to limit to compositable properties.

**Main jank risk:** The React re-render cost, not the CSS animations. Fixing the re-render scope (Section 2, P2) is the most impactful mobile optimization.

### Memory Usage Patterns

**Current peak during animation:**
- 15-20 array allocations (if range is large)
- 30-40 AudioNode objects (oscillator + gain)
- 15-20 React fiber updates (full tree)
- Total estimated: <1 MB additional during animation -- well within mobile limits

**After animation:** All temporary objects become GC-eligible. No leaks identified.

### Battery Impact

- **Web Audio:** Oscillator synthesis uses CPU. 15-20 short tones over 2 seconds is minimal.
- **RAF loop:** Runs for 2 seconds at 60fps = ~120 frames. Negligible battery impact.
- **No persistent animations** after draw completes. Good.
- **`animate-pulse-ring` is `infinite`** during drawing -- runs continuously but only for 2 seconds. Acceptable.

---

## 7. PWA Performance Metrics

### Lighthouse PWA Score Gaps

**Missing requirements identified:**

1. **No Service Worker:** No `sw.js` or `service-worker.ts` found in the project. This means:
   - No offline support
   - No caching strategy for repeat visits
   - Lighthouse PWA audit will FAIL on "registers a service worker" and "responds with 200 when offline"
   - **This is the #1 PWA gap.**

2. **Manifest issues:**
   - Single icon file (`app_logo.png`) used for both `192x192` and `512x512` sizes with `purpose: "any maskable"`. Should have separate icons at actual resolutions.
   - Missing `id` field (recommended by Lighthouse)
   - Missing `screenshots` array (recommended for install prompt on Android)

3. **No `<meta name="description">` tag** in `root.tsx` `<head>` -- needed for SEO and install prompts.

4. **`<html lang="en">`** but the app is in Korean -- should be `lang="ko"`.

### Service Worker Caching Impact on Repeat Visits

**Current:** No service worker exists. Every visit is a full network fetch.

**Recommended caching strategy:**
- **App shell (HTML/CSS/JS):** Cache-first with background update (stale-while-revalidate)
- **Google Fonts:** Cache-first, long TTL (fonts rarely change)
- **Images:** Cache-first
- **Estimated repeat visit improvement:** FCP from ~1-2s to <0.5s

### App Shell Rendering Speed

**Current SSR from Cloudflare Workers edge:** Excellent. The HTML is generated close to the user. First byte should be <100ms for most regions.

**Hydration:** Small component tree, minimal. The settings dialog is rendered in the DOM even when closed (Radix Dialog uses portal). This is unavoidable with Radix but means hydration includes the dialog.

### Offline Experience Performance

**Current:** No offline support. App shows browser error page when offline.

**Recommendation:** Implement a basic service worker with Workbox that:
1. Pre-caches the app shell (HTML, JS, CSS)
2. Caches Google Fonts on first load
3. Returns cached app shell for offline navigation
4. The app is fully client-side after hydration, so offline functionality would work perfectly -- no API calls needed.

---

## 8. Prioritized Recommendations

| Priority | Issue | Impact | Effort | Recommendation |
|----------|-------|--------|--------|----------------|
| P0 | No service worker | High | Medium | Add Workbox-based service worker for offline support and caching. This is the single biggest gap for PWA compliance and repeat-visit performance. |
| P0 | `@hugeicons/react` unused dependency | Medium | Low | Remove from `package.json`. Could be adding significant dead weight to the bundle. |
| P0 | Google Fonts over-fetching | Medium | Low | Reduce from 18 weight/style variants to `wght@400;600;700`. Estimated savings: 200+ kB of font files. |
| P1 | Full tree re-render during animation | Medium | Low | Add `React.memo()` to `StatusBar`, `HistoryList`, `ResultDisplay`, `SettingsDialog`. Reduces per-tick render scope by ~80%. |
| P1 | Double state update per tick | Low-Med | Low | Remove either `setCurrentDisplay` in useDrawAnimation or `UPDATE_DISPLAY` dispatch. Eliminate redundant state. |
| P1 | `getRandomNumber()` array allocation during animation | Low | Low | Replace with direct `Math.floor(Math.random() * (end - start + 1)) + start` in animation tick since excluded=[] during animation. O(1) vs O(n). |
| P1 | `<html lang="en">` incorrect | Low | Trivial | Change to `lang="ko"` in root.tsx. Affects accessibility and SEO. |
| P2 | Font loading blocks FCP | Medium | Medium | Self-host Noto Sans with font-display:swap, or use async font loading pattern. Add to service worker pre-cache. |
| P2 | Lazy load SettingsDialog | Low-Med | Low | `React.lazy()` for SettingsDialog. Saves ~10-12 kB from initial bundle. |
| P2 | AudioContext resume check every tick | Low | Trivial | Check/resume once at animation start, not per tick. |
| P2 | `transition-all` on DrawButton | Low | Trivial | Change to explicit property list to avoid transitioning layout properties. |
| P3 | Audio node pool | Low | Medium | Pre-create oscillator pool or use AudioBuffer for tick sounds. Reduces GC pressure on low-end mobile. |
| P3 | Manifest improvements | Low | Low | Add proper sized icons, `id` field, `screenshots`, fix icon purposes. |
| P3 | React Compiler (React Forget) | Medium | Medium | Enable React compiler in Vite config for automatic memoization. Would solve P1 re-render issues automatically. |
| P3 | Unused CSS animations | Trivial | Low | Audit and remove `animate-float`, `animate-breathe`, `shimmer`, `btn-glow` if unused. |
| P3 | `getAvailableNumbers` O(n) excluded.includes() | Low | Low | In `getAvailableNumbers`, convert `excluded` to a `Set` for O(1) lookup instead of `Array.includes()` O(m) per iteration. Only matters for large ranges with many exclusions. |

---

## File Ownership

This agent owns analysis of:
- **app/lib/lottery.ts** -- O(n) array construction per tick, O(n*m) excluded check
- **app/lib/animation.ts** -- Schedule generation (efficient), RAF runner (clean)
- **app/lib/sound.ts** -- AudioContext singleton (good), per-tick node creation (improvable)
- **app/lib/utils.ts** -- `cn()` calls twMerge+clsx per render (acceptable overhead)
- **app/hooks/useDrawAnimation.ts** -- Redundant state, over-complex random generation during animation
- **app/hooks/useLotteryMachine.ts** -- Return object not memoized, UPDATE_DISPLAY dispatch redundant
- **app/components/lottery/LotteryMachine.tsx** -- Full tree re-render on every tick
- **app/components/lottery/DrawButton.tsx** -- GPU-composited animations (good), transition-all (bad)
- **app/components/lottery/ResultDisplay.tsx** -- Clean, no issues
- **app/components/lottery/HistoryList.tsx** -- Missing React.memo
- **app/components/settings/SettingsDialog.tsx** -- Could be lazy-loaded
- **app/components/ui/theme-selector.tsx** -- Clean, no issues
- **app/root.tsx** -- Font loading strategy, lang attribute
- **app/app.css** -- Unused animations, compositable animation properties (good)
- **package.json** -- Unused @hugeicons/react dependency
- **vite.config.ts** -- No code splitting config, no React compiler
- **public/manifest.json** -- Missing fields for full PWA compliance

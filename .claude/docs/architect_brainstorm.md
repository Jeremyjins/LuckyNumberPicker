# Architect Brainstorming Report

## 1. Architecture Overview & Current Assessment

### Current Strengths
- **Clean state machine design**: The `useLotteryMachine` hook with `useReducer` implements a well-defined phase-based state machine (`initial -> settings -> ready -> drawing -> result`). Transitions are predictable and testable.
- **Good separation of concerns**: Pure logic (`app/lib/lottery.ts`), animation utilities (`app/lib/animation.ts`), sound (`app/lib/sound.ts`), and UI components are properly decoupled.
- **Solid component composition**: `LotteryMachine` orchestrates child components (`StatusBar`, `DrawButton`, `ResultDisplay`, `HistoryList`) without prop drilling becoming excessive.
- **Modern stack**: React 19.1, React Router 7, Tailwind CSS v4, Vite 7 -- all cutting-edge.
- **Edge deployment**: Cloudflare Workers provides global low-latency delivery.
- **Responsive animation**: RAF-based animation with easing functions produces a polished lottery feel.
- **Web Audio API**: Oscillator-based sounds have zero asset overhead -- no audio files to cache/load.
- **Theme system**: `useTheme` hook with system preference detection, localStorage persistence, and SSR-safe defaults.
- **Accessibility basics**: `aria-label` on interactive elements, focus-visible ring styles.

### Current Weaknesses / Gaps
- **No service worker**: The app has manifest.json but zero offline capability. Not a real PWA yet.
- **No data persistence**: All state is in-memory. Refreshing the page loses everything (settings, history, draw results).
- **No backend integration**: Purely client-side; no analytics, no shared draws, no user accounts.
- **Single route architecture**: Everything lives in one route (`home.tsx`) with one mega-component (`LotteryMachine`). This works for now but limits future growth.
- **No test files**: Despite having vitest configured in package.json, there are zero application test files.
- **Duplicate viewport meta**: `root.tsx` sets viewport in `<meta>` and `home.tsx` also sets it via `meta()`. The one in home.tsx will create a duplicate tag.
- **manifest.json uses same image for all icon sizes**: `app_logo.png` is declared for both 192x192 and 512x512. If the actual image is only one size, this works but isn't ideal for quality.
- **`purpose: "any maskable"` combined**: Should be separate icon entries -- one `any`, one `maskable` -- per Chrome Lighthouse recommendations.
- **No error recovery in animation**: If the animation fails mid-draw, there's no graceful fallback to show the result.
- **`getAvailableNumbers` uses `Array.includes`**: O(n) lookup per number. For large ranges (up to 10,000), this creates O(n^2) behavior. A `Set` would be O(n).
- **AudioContext singleton leak**: `audioContext` module-level variable persists indefinitely. Not an issue for a single-page app, but worth noting.
- **No haptic feedback**: On mobile, haptic feedback during the drawing animation would enhance the physical feel significantly.

---

## 2. PWA Enhancement Strategy (HIGH PRIORITY)

### 2.1 Service Worker Implementation Plan

**Recommended approach**: Use [Workbox](https://developer.chrome.com/docs/workbox/) via `vite-plugin-pwa` or a custom service worker.

Since we're on Cloudflare Workers + React Router 7 with SSR, we need a client-side service worker that handles caching, not the server worker entry. The two workers (Cloudflare Worker for SSR, browser Service Worker for PWA) are independent.

**Implementation steps**:
1. Create `public/sw.js` (or use Workbox to generate it at build time)
2. Register the service worker in `app/root.tsx` via a `useEffect` in `Layout`
3. Configure precache manifest for static assets (JS/CSS bundles, images, fonts)
4. Configure runtime caching for the SSR HTML response

```
sw.js responsibilities:
  - Precache: app shell (HTML skeleton), JS bundles, CSS, images, fonts
  - Runtime cache: Google Fonts (CacheFirst, 30 day TTL)
  - Runtime cache: SSR HTML (NetworkFirst with offline fallback)
  - Offline fallback page
```

**Registration code** (add to root.tsx Layout):
```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

### 2.2 Offline Support Strategy

This app is an ideal candidate for full offline support because:
- The core functionality is 100% client-side (random number generation)
- No API calls needed for basic operation
- Small asset footprint

**Strategy**: **Cache-First for assets, Network-First for HTML**
- Precache all static assets at install time
- The app shell (HTML) uses NetworkFirst -- try network, fall back to cache
- Google Fonts use CacheFirst with long TTL
- Result: app works fully offline after first visit

### 2.3 Install Prompt (A2HS) Implementation

Create a new hook: `app/hooks/useInstallPrompt.ts`

```typescript
// Capture the beforeinstallprompt event
// Provide a custom install button/banner
// Track install state in localStorage
// Show prompt at strategic moments (e.g., after 3rd draw)
```

**UX flow**:
1. User visits app, uses it a few times
2. After 3rd successful draw, show a subtle bottom banner: "Install for quick access"
3. User taps "Install" -> native A2HS prompt fires
4. After install, hide the banner permanently

### 2.4 Push Notification Capability (Future)

Low priority for a utility app, but potential uses:
- "Daily lucky number" notification
- Shared draw notifications (if multiplayer feature added)
- Requires Supabase + Web Push API

### 2.5 App Shell Architecture

Current architecture already approximates an app shell:
- `root.tsx` provides the HTML skeleton
- `LotteryMachine` renders all dynamic content
- Static assets (CSS, JS) can be precached

**Enhancement**: Create a lightweight offline fallback page that shows cached app state.

### 2.6 Cache Strategy

| Resource | Strategy | TTL | Notes |
|---|---|---|---|
| JS/CSS bundles | Precache (revisioned) | Indefinite | Vite adds content hashes |
| Images (`/images/*`) | CacheFirst | 30 days | Logo, icons |
| Google Fonts CSS | StaleWhileRevalidate | 7 days | Font declarations |
| Google Fonts files | CacheFirst | 365 days | WOFF2 files are immutable |
| HTML (SSR) | NetworkFirst | 24 hours fallback | Prefer fresh, cache as backup |
| manifest.json | StaleWhileRevalidate | 7 days | |

### 2.7 Background Sync Possibilities

If Supabase integration is added:
- **Sync draw history**: Queue history entries when offline, sync when reconnected
- **Sync settings**: Push settings changes to Supabase when back online
- Uses Background Sync API (Chrome/Edge only, graceful degradation for Safari)

---

## 3. Supabase Integration Plan

### 3.1 What Supabase Can Provide

| Feature | Value | Priority |
|---|---|---|
| Draw history persistence | Save all draws, survive page refresh/device change | HIGH |
| Settings persistence | Remember settings per user/device | HIGH |
| Anonymous auth | Device-linked identity without login friction | MEDIUM |
| Draw statistics/analytics | "Your most common number", draw frequency charts | MEDIUM |
| Shared draws (Realtime) | Multiple people watch the same draw live | LOW |
| User accounts (OAuth) | Cross-device sync, saved presets | LOW |

### 3.2 Database Schema Design

```sql
-- Anonymous or authenticated users
-- Supabase Auth handles this natively

-- User settings (one per user)
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_number INT NOT NULL DEFAULT 1,
  end_number INT NOT NULL DEFAULT 12,
  draw_count INT NOT NULL DEFAULT 1,
  allow_duplicates BOOLEAN NOT NULL DEFAULT false,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Draw sessions (a group of draws with same settings)
CREATE TABLE draw_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_number INT NOT NULL,
  end_number INT NOT NULL,
  draw_count INT NOT NULL,
  allow_duplicates BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual draw results
CREATE TABLE draw_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES draw_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers INT[] NOT NULL,
  drawn_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions"
  ON draw_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own results"
  ON draw_results FOR ALL
  USING (auth.uid() = user_id);
```

### 3.3 Supabase MCP Integration Approach

Use the Supabase MCP tools available in the development environment to:
1. Create the project and database schema via `mcp__supabase__apply_migration`
2. Generate TypeScript types via `mcp__supabase__generate_typescript_types`
3. Deploy edge functions if needed via `mcp__supabase__deploy_edge_function`

### 3.4 Edge Function Integration with Cloudflare Workers

Two approaches:

**Option A: Direct Supabase Client (Recommended)**
- Install `@supabase/supabase-js` in the app
- Initialize client in a shared utility (`app/lib/supabase.ts`)
- Call Supabase directly from React components/hooks
- Works both client-side and in Cloudflare Workers (SSR loaders)

**Option B: Cloudflare Worker as API proxy**
- Add API routes in the Cloudflare Worker
- Worker proxies requests to Supabase
- More control but more complexity

Recommendation: **Option A** for simplicity. The Supabase JS client works in all environments.

### 3.5 Migration Path (Client-Only to Supabase-Backed)

**Phase 1**: localStorage persistence (no Supabase needed)
- Persist settings to localStorage on change
- Restore settings on mount
- Persist draw history to localStorage

**Phase 2**: Anonymous auth + Supabase sync
- Add `@supabase/supabase-js`
- Create anonymous user on first visit
- Sync settings and history to Supabase
- localStorage serves as offline cache

**Phase 3**: Optional user accounts
- Add Google/Apple OAuth
- Link anonymous data to real account
- Cross-device sync

---

## 4. State Management Evolution

### 4.1 Current useReducer Assessment

**What works well**:
- Clean phase-based transitions
- All state mutations in one reducer function
- Computed values via `useMemo`
- Actions are well-typed with discriminated unions

**Limitations**:
- No persistence -- state resets on refresh
- No middleware support (logging, analytics, sync)
- All state is co-located in one hook -- impossible to subscribe to slices
- `LotteryMachine` component receives ~20 values from the hook, causing re-renders on any state change

### 4.2 Options Analysis

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| Keep `useReducer` | Simple, zero deps, works now | No persistence/middleware | Good for Phase 1 |
| Zustand | Tiny (1KB), middleware (persist, devtools), slice subscriptions | New dependency | Best for Phase 2+ |
| Jotai | Atomic model, great for derived state | Overkill for this app's state shape | Not recommended |
| React Context + useReducer | Built-in, no deps | Performance issues with deep trees | Not recommended |

**Recommendation**:
- **Now**: Add localStorage persistence to current `useReducer` (minimal change)
- **Phase 2**: Migrate to Zustand when adding Supabase sync. Zustand's `persist` middleware handles localStorage + async storage out of the box.

### 4.3 State Persistence Strategy

**Immediate (localStorage)**:
```typescript
// Persist on every state change
useEffect(() => {
  localStorage.setItem('lottery-state', JSON.stringify({
    settings: state.settings,
    history: state.history,
    excludedNumbers: state.excludedNumbers,
  }));
}, [state.settings, state.history, state.excludedNumbers]);

// Restore on mount
const initialState = useMemo(() => {
  const saved = localStorage.getItem('lottery-state');
  if (saved) {
    const parsed = JSON.parse(saved);
    return { ...INITIAL_STATE, ...parsed, phase: 'ready' as Phase };
  }
  return INITIAL_STATE;
}, []);
```

**Future (Supabase + offline)**:
- localStorage as primary (instant)
- Background sync to Supabase
- Conflict resolution: last-write-wins (simple) or per-field merge (complex)

### 4.4 Offline-First State Sync

```
User Action -> Update Local State -> Persist to localStorage -> Queue Supabase Sync
                                                                     |
                                                              [Online?] ----No----> Background Sync Queue
                                                                     |
                                                                    Yes
                                                                     |
                                                              Write to Supabase
```

---

## 5. Component Architecture Improvements

### 5.1 Current Component Tree

```
App (root.tsx)
  └── Home (routes/home.tsx)
      └── LotteryMachine (orchestrator - TOO MUCH RESPONSIBILITY)
          ├── ThemeSelector (fixed position, independent)
          ├── SettingsDialog
          │   └── NumberInput (x3)
          │   └── Switch (x2)
          ├── StatusBar
          ├── DrawButton
          ├── ResultDisplay
          ├── HistoryList
          │   └── HistoryItem (xN)
          └── Footer (inline, not extracted)
```

### 5.2 Issues with Current Structure

1. **`LotteryMachine` is a god component**: It owns all state, all handlers, all rendering logic (~260 lines). Every state change re-renders the entire tree.
2. **Footer is inline**: The "SPONSORED BY" section and reset button are embedded in `LotteryMachine` instead of being their own component.
3. **No layout components**: Safe area padding, sticky headers, viewport height management are handled ad-hoc with utility classes.
4. **ThemeSelector is rendered inside LotteryMachine** but logically belongs at the layout level (root.tsx).

### 5.3 Suggested Refactoring

**Extract layout concerns to root.tsx level**:
```
Layout (root.tsx)
  ├── ThemeSelector (move here, it's app-level)
  ├── Outlet
  │   └── Home
  │       └── LotteryMachine
  └── Footer (extract, it's app-level)
```

**Split LotteryMachine into phase-based views**:
```
LotteryMachine (slim orchestrator, ~80 lines)
  ├── phases/InitialView.tsx     - Hero + setup button
  ├── phases/ReadyView.tsx       - StatusBar + DrawButton
  ├── phases/DrawingView.tsx     - Animation display
  ├── phases/ResultView.tsx      - Result + history + draw again
  └── shared/
      ├── StatusBar.tsx
      ├── DrawButton.tsx
      ├── ResultDisplay.tsx
      └── HistoryList.tsx
```

**Benefits**:
- Each phase component only re-renders when relevant
- Easier to add new phases (e.g., "sharing" phase)
- Better code splitting potential

### 5.4 New Components Needed

| Component | Purpose |
|---|---|
| `InstallPrompt` | PWA install banner/button |
| `OfflineIndicator` | Show when offline (subtle top bar) |
| `Footer` | Extract from LotteryMachine |
| `AppLayout` | Manage safe areas, sticky header, viewport |
| `ShareButton` | Share draw results (Web Share API) |
| `DrawStats` | Statistics view (when Supabase added) |
| `SettingsPresets` | Quick preset buttons (e.g., "Lotto 6/45") |

---

## 6. Feature Roadmap Suggestions

### 6.1 Short-term (Quick Wins) -- 1-2 weeks

1. **localStorage persistence**: Save settings + history. Survive page refresh. (~2 hours)
2. **Service worker + offline**: Implement basic precaching. App works offline. (~4 hours)
3. **Fix duplicate viewport meta**: Remove from `home.tsx` meta function. (~5 minutes)
4. **Fix manifest.json icon purpose**: Split `"any maskable"` into separate entries. (~10 minutes)
5. **Web Share API**: Add a "Share result" button using `navigator.share()`. (~1 hour)
6. **Haptic feedback**: Add `navigator.vibrate()` during animation ticks on mobile. (~30 minutes)
7. **Settings presets**: Add quick buttons like "Lotto 6/45", "1-100", "Coin flip (1-2)". (~2 hours)
8. **Performance: Use Set in getAvailableNumbers**: Replace `Array.includes` with `Set.has`. (~15 minutes)

### 6.2 Medium-term (Significant Improvements) -- 2-4 weeks

1. **Supabase integration (Phase 1)**: Anonymous auth + settings/history sync. (~1 week)
2. **Draw statistics dashboard**: Charts showing frequency, history timeline. (~3 days)
3. **Multi-draw mode**: Draw multiple rounds in sequence with animation. (~2 days)
4. **Custom themes/colors**: Let users pick primary color for the app. (~1 day)
5. **Install prompt UX**: Smart install banner after 3rd draw. (~1 day)
6. **Component refactoring**: Split LotteryMachine into phase views. (~2 days)
7. **Test suite**: Unit tests for lib functions, integration tests for hooks, component tests. (~3 days)
8. **Accessibility audit**: Screen reader testing, keyboard navigation, ARIA live regions for draw results. (~2 days)

### 6.3 Long-term (Major Features) -- 1-3 months

1. **Shared/live draws**: Create a draw room, share link, everyone sees the result in real-time (Supabase Realtime).
2. **User accounts**: Google/Apple OAuth, cross-device sync.
3. **Draw templates marketplace**: Community-shared presets (e.g., "Secret Santa", "Team lunch picker").
4. **Animation customization**: Multiple animation styles (slot machine, wheel spin, card flip).
5. **Widget support**: iOS widget showing last draw result (requires native wrapper or web widget API).
6. **Internationalization (i18n)**: English, Japanese support alongside Korean.
7. **Admin dashboard**: For the app owner -- usage analytics, user counts, popular settings.

---

## 7. Technical Debt Items

### Critical
1. **No tests**: Zero test files despite vitest being configured. The pure functions in `lib/lottery.ts` and `lib/animation.ts` are trivially testable. The reducer in `useLotteryMachine.ts` should have state transition tests.
2. **No service worker**: The app claims PWA status (manifest.json) but fails Lighthouse PWA audit.
3. **Duplicate viewport meta tag**: `home.tsx` exports a viewport meta that conflicts with the one in `root.tsx`.

### High
4. **No state persistence**: Users lose everything on refresh -- this is the #1 UX issue.
5. **manifest.json icon `purpose` issue**: `"any maskable"` should be two separate entries per Lighthouse.
6. **No error boundaries around animation**: If `requestAnimationFrame` or `AudioContext` throws, the app can get stuck in `drawing` phase.
7. **`getAvailableNumbers` O(n^2)**: Uses `Array.includes` in a loop. Should use `Set` for the excluded numbers lookup.

### Medium
8. **God component**: `LotteryMachine` handles too much. Extract phase-specific views.
9. **No loading/skeleton states**: If future data fetching is added, there's no loading UI pattern.
10. **Theme flash on load**: SSR renders with `system` default, then `useEffect` applies the real theme. Users may see a brief flash of wrong theme.
11. **Google Fonts loaded externally**: The `Noto Sans` font is loaded via Google Fonts CDN. Consider self-hosting for offline support and performance.
12. **No CSP headers**: No Content Security Policy configured on the Cloudflare Worker.

### Low
13. **Unused CSS**: Multiple animation keyframes defined (`float`, `breathe`, `shimmer`, `bounce-in`) but not all are used in components.
14. **`resetAudioContext` only for testing**: This function exists but there are no tests that use it.
15. **Single icon file**: Only one image (`app_logo.png`) is used for all icon sizes. Should have properly sized variants.

---

## File Ownership

This agent's analysis scope covers:

| Area | Key Files |
|---|---|
| Overall architecture | `vite.config.ts`, `workers/app.ts`, `app/root.tsx`, `app/routes/home.tsx` |
| Type system | `app/types/lottery.ts` |
| Hook composition | `app/hooks/useLotteryMachine.ts`, `app/hooks/useDrawAnimation.ts`, `app/hooks/useTheme.ts` |
| State machine design | `app/hooks/useLotteryMachine.ts`, `app/types/lottery.ts` |
| PWA architecture | `public/manifest.json`, `app/root.tsx` (meta tags), future `public/sw.js` |
| Supabase integration | Future `app/lib/supabase.ts`, database schema |
| Pure logic | `app/lib/lottery.ts`, `app/lib/animation.ts`, `app/lib/sound.ts` |

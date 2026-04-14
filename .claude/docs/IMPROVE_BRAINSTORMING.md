# IMPROVE_BRAINSTORMING.md
# 행운번호 추첨기 - 전체 프로젝트 개선 브레인스토밍

> **Date**: 2026-03-06
> **Agents**: architect, frontend-dev, backend-dev, perf-analyzer, security-reviewer, code-reviewer, researcher
> **Scope**: Full project improvement & design enhancement for PWA web app
> **App Concept**: 로그인 없이, 기록 저장 없이, 간단하게 사용하는 클라이언트 전용 유틸리티 앱

---

## Executive Summary

The 행운번호 추첨기 is a well-architected client-side lottery PWA (React 19 + React Router 7 + Cloudflare Workers) with solid foundations. **Code quality: 7.5/10**. The core architecture (useReducer state machine, RAF animation, Web Audio API) is clean and well-separated. However, the app has significant gaps in PWA completeness, performance, accessibility, and has zero test coverage despite full test infrastructure.

### Top 5 Critical Findings

| # | Finding | Source Agent(s) | Severity |
|---|---------|-----------------|----------|
| 1 | **No service worker** - PWA in name only, no offline support | architect, backend, perf, researcher | CRITICAL |
| 2 | **O(n*m) performance bug** in `getAvailableNumbers()` using `Array.includes()` | architect, backend, perf, code-reviewer | HIGH |
| 3 | **No `@prefers-reduced-motion` support** - accessibility requirement | frontend, researcher | HIGH |
| 4 | **Missing security headers** in Cloudflare Workers | security-reviewer | HIGH |
| 5 | **`@hugeicons/react` unused dependency** - dead bundle weight | perf-analyzer | MEDIUM |

---

## Part 1: Bugs & Critical Issues

### 1.1 Confirmed Bugs

| Bug | File:Line | Agent | Fix |
|-----|-----------|-------|-----|
| **Duplicate viewport meta tag** | `app/routes/home.tsx:8` + `app/root.tsx:38` | architect | Remove from `home.tsx` meta() |
| **`<html lang="en">`** but app is Korean | `app/root.tsx:35` | perf-analyzer | Change to `lang="ko"` |
| **RESTORE_NUMBER removes ALL occurrences** | `app/hooks/useLotteryMachine.ts:90-91` | code-reviewer | Use `findIndex` + `splice` for first occurrence only |
| **manifest.json `"any maskable"` combined** | `public/manifest.json:13` | architect, backend | Split into separate icon entries |
| **CLOSE_SETTINGS doesn't revert changes** | `app/hooks/useLotteryMachine.ts:23-28` | code-reviewer | Store `pendingSettings` on OPEN, revert on CLOSE |
| **ANIMATION_CONFIG constants not used** | `app/lib/animation.ts:32-33` vs `:101-108` | code-reviewer | Use `ANIMATION_CONFIG.minInterval/maxInterval` in `generateAnimationSchedule` |
| **`getRandomNumbers` is NOT Fisher-Yates** | `app/lib/lottery.ts:42-62` | backend-dev | Implement actual Fisher-Yates partial shuffle |
| **Duplicate state tracking** | `useDrawAnimation` + `useLotteryMachine` both track `isAnimating`/`displayNumber` | code-reviewer | Remove one source of truth |

### 1.2 Dead Code

| Item | File | Agent |
|------|------|-------|
| **`useSound` hook** - defined but never imported | `app/hooks/useSound.ts` | code-reviewer |
| **`@hugeicons/react` dependency** - never imported | `package.json` | perf-analyzer |
| **Unused CSS animations** - `float`, `breathe`, `shimmer` | `app/app.css` | perf-analyzer |

---

## Part 2: Performance Improvements

### 2.1 Critical Hot Path (Drawing Animation)

During the 2-second draw animation (~15-20 ticks), the full rendering chain fires per tick:

```
RAF tick -> getRandomNumber(start, end, []) -> builds array O(n)
  -> setCurrentDisplay() + dispatch(UPDATE_DISPLAY) -> 2x state updates
  -> Full tree re-render (7 components, only DrawButton needs it)
  -> playTick() creates new oscillator + gain node
```

| Priority | Issue | Impact | Fix | Agent |
|----------|-------|--------|-----|-------|
| **P0** | `getRandomNumber()` builds array per tick (excluded=[]) | O(n) wasted | Use `Math.floor(Math.random() * (end-start+1)) + start` directly | perf |
| **P0** | `getAvailableNumbers()` uses `Array.includes()` in loop | O(n*m) | Convert excluded to `Set` for O(1) lookup | architect, backend, perf, code |
| **P1** | Double state update per tick | 2x renders | Remove either `setCurrentDisplay` or `UPDATE_DISPLAY` dispatch | perf, code |
| **P1** | Full tree re-render on every tick | 6/7 components unnecessary | Add `React.memo()` to StatusBar, HistoryList, ResultDisplay, SettingsDialog | perf |
| **P2** | `transition-all` on DrawButton | May animate layout props | Change to `transition-[transform,box-shadow,background-color]` | perf |
| **P2** | AudioContext `resume()` check every tick | Wasteful after first | Check/resume once at animation start | perf |
| **P3** | Audio node creation GC pressure | 30-40 nodes in 2s | Pre-create audio node pool or use AudioBuffer | perf |
| **P3** | React Compiler not enabled | Auto-memoization missed | Enable React Compiler in Vite config | perf |

### 2.2 Bundle & Loading

| Priority | Issue | Impact | Fix | Agent |
|----------|-------|--------|-----|-------|
| **P0** | `@hugeicons/react` never imported | Dead dependency weight | Remove from `package.json` | perf |
| **P0** | Google Fonts loads ALL 18 weight variants | ~200+ kB wasted fonts | Reduce to `wght@400;600;700` only | perf |
| **P1** | Google Fonts is FCP-blocking external CSS | Render-blocking chain | Self-host via `@fontsource/noto-sans` or async load | backend, perf |
| **P2** | SettingsDialog in initial bundle | ~10-12 kB unnecessary on first load | `React.lazy()` for SettingsDialog | perf |
| **P2** | No bundle analysis tooling | Can't measure improvements | Add `rollup-plugin-visualizer` | backend |
| **P3** | Two icon libraries | Redundant dependencies | Consolidate to lucide-react only | backend, security |

---

## Part 3: PWA Enhancement (HIGH PRIORITY)

### 3.1 Service Worker Strategy

**Current State**: manifest.json exists but NO service worker, NO offline support. Lighthouse PWA audit will FAIL.

**Recommended Approach**: Workbox 7 via `vite-plugin-pwa` or custom `public/sw.js`

| Resource | Cache Strategy | TTL |
|----------|---------------|-----|
| JS/CSS bundles | Precache (content-hashed) | Indefinite |
| Images | CacheFirst | 30 days |
| Google Fonts CSS | StaleWhileRevalidate | 7 days |
| Google Fonts WOFF2 | CacheFirst | 365 days |
| HTML (SSR) | NetworkFirst | 24h fallback |

**Implementation Steps**:
1. Create `public/sw.js` or configure `vite-plugin-pwa`
2. Create `app/entry.client.tsx` with SW registration
3. Add offline fallback page
4. Update manifest.json (add `scope`, `id`, `screenshots`, fix icon `purpose`)

### 3.2 Install Prompt

- Create `app/hooks/useInstallPrompt.ts`
- Show custom Korean-language banner after 3rd draw: "홈 화면에 추가하면 더 빠르게 시작할 수 있어요!"
- iOS Safari fallback: show manual instruction tooltip
- Remember dismissal in localStorage

### 3.3 Manifest.json Improvements

```json
{
  "id": "/",
  "scope": "/",
  "prefer_related_applications": false,
  "icons": [
    { "src": "/images/app_logo_192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/images/app_logo_192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/images/app_logo_512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/images/app_logo_512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [...]
}
```

### 3.4 PWA UX Enhancements

| Feature | Priority | Agent |
|---------|----------|-------|
| `overscroll-behavior: none` to disable pull-to-refresh | P1 | frontend |
| Dynamic `theme-color` meta based on current theme | P1 | frontend |
| `apple-mobile-web-app-status-bar-style: black-translucent` | P2 | frontend |
| App shell skeleton for loading state | P2 | frontend |

---

## Part 4: UI/UX Design Improvements

### 4.1 Component Architecture

**LotteryMachine.tsx (262 lines)** is a god component. Split into:

```
LotteryMachine (slim ~80-line orchestrator)
  +-- phases/HeroSection.tsx       (initial phase)
  +-- phases/DrawingSection.tsx     (ready/drawing)
  +-- phases/ResultSection.tsx      (result display)
  +-- LotteryHeader.tsx             (sticky StatusBar wrapper)
  +-- LotteryFooter.tsx             (reset + branding)
```

**Move ThemeSelector to root.tsx** (it's app-level, not page-level)

### 4.2 Visual Design Improvements

| Improvement | Description | Priority | Agent |
|-------------|-------------|----------|-------|
| **Result number color variety** | Assign chart-1 through chart-5 colors to drawn numbers | P1 | frontend |
| **Progress bar in StatusBar** | Visual gauge showing remaining/total ratio | P1 | frontend |
| **Glass morphism sticky StatusBar** | `backdrop-blur-sm bg-background/80` | P2 | frontend |
| **Grouped history by draw round** | "1회차: 7, 23, 45" instead of flat pills | P1 | frontend |
| **Desktop card layout** | `max-w-md mx-auto shadow-2xl rounded-2xl` on desktop | P2 | frontend |
| **Landscape mode fix** | Current `h-dvh` likely breaks in landscape | P1 | frontend |

### 4.3 Interaction Design Improvements

| Improvement | Description | Priority | Agent |
|-------------|-------------|----------|-------|
| **Multi-stage result reveal** | Reveal numbers one at a time for multi-draw (like Korean TV lottery) | P0 | frontend |
| **Settings presets** | "로또 (1~45, 6개)", "주사위 (1~6, 1개)" quick buttons | P0 | frontend |
| **Confetti celebration** | canvas-confetti (~6KB) on result reveal | P1 | frontend, researcher |
| **Confirm dialog on reset** | "정말 다시 설정하시겠습니까?" before resetAll | P1 | frontend |
| **Fix HistoryItem X icon semantics** | X icon means "delete" but action is "restore" - use undo/rotate icon | P1 | frontend |
| **Web Share API** | Share results via KakaoTalk/SMS | P0 | researcher |
| **Haptic feedback** | `navigator.vibrate()` during draw (Android only) | P2 | frontend, researcher |
| **Screen Wake Lock** | Prevent screen dimming during draw | P2 | researcher |
| **Bottom sheet dialog on mobile** | Replace centered Dialog with bottom sheet for settings | P2 | frontend |
| **NumberInput long-press repeat** | Auto-repeat +/- with acceleration | P2 | frontend |

### 4.4 Animation Enhancements

| Enhancement | Description | Priority | Agent |
|-------------|-------------|----------|-------|
| **Phase transition animations** | Fade/slide exit before new content appears | P1 | frontend |
| **Slot machine vertical reel effect** | Numbers scroll vertically and decelerate | P2 | frontend |
| **Final number bounce-in** | Scale 0 -> 1.15 -> 0.95 -> 1 on result | P2 | frontend |
| **View Transitions API** | React Router 7 has built-in support | P2 | researcher |
| **DrawButton breathing animation** | Subtle `animate-breathe` in ready state | P3 | frontend |

---

## Part 5: Accessibility (a11y)

| Issue | Priority | Fix | Agent |
|-------|----------|-----|-------|
| **No `@prefers-reduced-motion` support** | **P0** | Add CSS media query + JS check in useDrawAnimation | frontend, researcher |
| **No `aria-live` for results** | **P0** | Add `aria-live="assertive"` region for draw results | researcher |
| **HistoryItem touch target too small** | **P0** | X button ~16px, WCAG requires 44px minimum | frontend |
| **Focus management after draw** | P1 | Move focus to result or "다시 추첨하기" button | frontend |
| **No `role="status"` on StatusBar** | P1 | Add `role="status"` + `aria-live="polite"` | frontend |
| **Semantic history list** | P1 | Use `<ol>` with `role="list"` for draw history | frontend, researcher |
| **Color contrast audit** | P1 | Check `text-orange-500` on white, muted-foreground ratios | frontend |
| **ThemeSelector/NumberInput touch targets** | P2 | 40px -> 44px minimum | frontend |

---

## Part 6: Security

**Overall Risk: LOW** (no auth, no database, no user-generated content)

| Issue | Priority | Severity | Fix | Agent |
|-------|----------|----------|-----|-------|
| **Missing security headers** | **P0** | Medium | Add HSTS, X-Content-Type, X-Frame-Options, Referrer-Policy, Permissions-Policy in `workers/app.ts` | security |
| **No Content Security Policy** | P1 | Medium | Add CSP header (see security report for full policy) | security |
| **Math.random() for randomness** | P2 | Low | Upgrade to `crypto.getRandomValues()` for user trust | security, backend |
| **Dependabot/Renovate not enabled** | P1 | Low | Enable automated dependency vulnerability alerts | security |
| **No `scope` in manifest.json** | P3 | Info | Add `"scope": "/"` | security |

## Part 7: Local Data Persistence (localStorage)

> **Note**: 이 앱은 로그인 없이, 기록 저장 없이, 간단하게 사용하는 클라이언트 전용 유틸리티 앱입니다. Supabase, Auth, 사용자 계정, 서버 동기화 등은 범위에서 제외합니다.

### 현재 localStorage 사용 현황
- `theme` - 테마 설정 (light/dark/system)
- `sound-enabled` - 사운드 설정 (useSound hook, 미사용)

### 개선 가능 항목 (선택적)
- **설정값 기억**: 마지막 사용한 startNumber/endNumber/drawCount를 localStorage에 저장하여 재방문 시 복원 (사용 편의성)
- **Effort**: ~1 hour
- **주의**: 히스토리/추첨 결과는 저장하지 않음 (앱 컨셉에 맞지 않음)

---

## Part 8: Infrastructure & DevOps

| Item | Priority | Description | Agent |
|------|----------|-------------|-------|
| **No CI/CD pipeline** | **P1** | Create `.github/workflows/ci.yml` (typecheck + test + build + deploy) | backend |
| **No test coverage** | **P1** | Write tests for lib/ functions first, then reducer, then components | code-reviewer |
| **No edge caching headers** | P1 | Add `Cache-Control` to SSR responses in `entry.server.tsx` | backend |
| **No environment separation** | P2 | Add staging/production configs to `wrangler.jsonc` | backend |
| **No bundle analysis** | P2 | Add `rollup-plugin-visualizer` to vite.config.ts | backend |
| **Placeholder var in wrangler.jsonc** | P3 | Remove `VALUE_FROM_CLOUDFLARE` or replace with real config | backend |

### Testing Priority Order
1. **P0**: `app/lib/lottery.ts` - pure functions, highest value
2. **P0**: `app/lib/animation.ts` - pure functions
3. **P1**: `useLotteryMachine` reducer - state transitions
4. **P1**: `SettingsDialog` - form validation
5. **P2**: `LotteryMachine` - integration flow
6. **P2**: `useDrawAnimation` - animation lifecycle (mock RAF)

---

## Part 9: Korean Market Optimization

| Item | Priority | Description | Agent |
|------|----------|-------------|-------|
| **KakaoTalk sharing** | **P0** | Web Share API + Kakao JS SDK for KakaoTalk integration (~93% market share) | researcher |
| **Korean Open Graph tags** | P0 | `og:title`, `og:description`, `og:image` in Korean for Naver/Kakao sharing | researcher |
| **System font fallbacks** | P1 | Add `Apple SD Gothic Neo`, `Malgun Gothic` to font stack | researcher |
| **Korean Lotto color coding** | P2 | Color-code number ranges (1-10: yellow, 11-20: blue) like official Lotto | frontend |
| **Number sorting option** | P2 | Korean users expect lottery numbers in ascending order | frontend |

---

## Part 10: Feature Roadmap

### Short-term (1-2 weeks) - Quick Wins
1. Fix confirmed bugs (duplicate viewport, lang="ko", RESTORE_NUMBER, manifest icons)
2. Remove `@hugeicons/react` dead dependency
3. Service worker + offline support
4. Add `@prefers-reduced-motion` support
5. Add security headers to Workers
6. Web Share API for results
7. Settings presets ("로또 6/45", "주사위")
8. Fix `getAvailableNumbers` to use Set
9. Google Fonts weight 최적화 (400;600;700만 로드)

### Medium-term (2-4 weeks) - Significant Improvements
1. LotteryMachine component decomposition
2. Multi-stage result reveal animation
3. Confetti celebration effects (canvas-confetti)
4. Test suite (lib/ + hooks/ + components)
5. CI/CD pipeline (GitHub Actions)
6. Grouped history by draw round
7. Accessibility audit + fixes (aria-live, focus management)
8. Font optimization (self-host, reduce weights)
9. React.memo on non-animated components
10. 설정값 localStorage 저장 (재방문 시 복원, 선택적)

### Long-term (1-3 months) - Major Features
1. Animation customization (slot machine, wheel spin)
2. Color theme customization (accent color picker)
3. i18n (English, Japanese)
4. Desktop/tablet 최적화 레이아웃

---

## Agent File Ownership Map

| Agent | Owned Files |
|-------|-------------|
| **architect** | Overall architecture, `app/types/`, `app/hooks/` composition, state machine, PWA architecture |
| **frontend-dev** | `app/components/**/*.tsx`, `app/app.css`, animation UX, `app/lib/sound.ts` UX |
| **backend-dev** | `workers/app.ts`, `vite.config.ts`, `react-router.config.ts`, `app/entry.server.tsx`, `public/manifest.json`, `package.json`, `app/lib/*.ts` logic |
| **perf-analyzer** | Performance of all `app/lib/*.ts`, all `app/hooks/*.ts`, rendering performance, bundle size, `vite.config.ts` |
| **security-reviewer** | Security aspects of all files, `workers/app.ts` headers, `wrangler.jsonc`, dependency audit |
| **code-reviewer** | Code quality of all files, patterns, TypeScript quality, testing strategy |
| **researcher** | PWA trends, Web APIs, Korean market, celebration libraries, accessibility patterns |

---

## Individual Agent Reports

Detailed reports available at:
- `.claude/docs/architect_brainstorm.md`
- `.claude/docs/frontend_brainstorm.md`
- `.claude/docs/backend_brainstorm.md`
- `.claude/docs/perf_brainstorm.md`
- `.claude/docs/security_brainstorm.md`
- `.claude/docs/codereview_brainstorm.md`
- `.claude/docs/research_brainstorm.md`

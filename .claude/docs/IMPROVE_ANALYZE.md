# IMPROVE_ANALYZE.md
# 행운번호 추첨기 - Phase 1 검증 및 추가개선 항목 분석

> **Date**: 2026-03-06
> **Based on**: IMPROVE_BRAINSTORMING.md + IMPROVE_IMPLEMENT_PHASE_1.md + 코드 직접 검증
> **Agent Team**: architect(리더), frontend-dev, backend-dev, code-reviewer, perf-analyzer, security-reviewer

---

## Part 1: Phase 1 구현 검증 결과

### 검증 방법
브레인스토밍 문서의 버그/개선 목록 대비 실제 소스코드를 직접 확인.

### 검증 결과: ✅ 17/17 COMPLETE

| Task | 파일 | 구현 증거 | 상태 |
|------|------|-----------|------|
| A-1: lang="ko" | `app/root.tsx:35` | `<html lang="ko">` 확인 | ✅ |
| A-2: 중복 viewport 제거 | `app/routes/home.tsx` | meta()에 viewport 없음 확인 | ✅ |
| A-3: RESTORE_NUMBER 버그 | `app/hooks/useLotteryMachine.ts:129-144` | `indexOf+slice` 패턴 확인 | ✅ |
| A-4: manifest.json 아이콘 분리 | `public/manifest.json:13-37` | 4개 별도 항목 확인 | ✅ |
| A-5: ANIMATION_CONFIG 상수 활용 | `app/lib/animation.ts:42-43` | `ANIMATION_CONFIG.minInterval/maxInterval` 사용 확인 | ✅ |
| B-1: Set 최적화 | `app/lib/lottery.ts:16` | `new Set(excluded)` 확인 | ✅ |
| B-2: @hugeicons/react 제거 | `package.json` | 의존성 목록에 없음 확인 | ✅ |
| B-3: Google Fonts 최적화 | `app/root.tsx:23` | `wght@400;600;700` 확인 | ✅ |
| C-1: 보안 헤더 | `workers/app.ts:12-18` | SECURITY_HEADERS 5종 확인 | ✅ |
| D-1: manifest id/scope | `public/manifest.json:5-7,12` | id, scope, prefer_related_applications 확인 | ✅ |
| D-2: PWA meta 개선 | `app/root.tsx:38,42` | viewport-fit=cover, black-translucent 확인 | ✅ |
| E-1: prefers-reduced-motion CSS | `app/app.css:347-357` | @media 블록 확인 | ✅ |
| E-2: prefers-reduced-motion JS | `app/hooks/useDrawAnimation.ts:87-97` | matchMedia 체크 + effectiveDuration=0 확인 | ✅ |
| E-3: aria-live 결과 영역 | `app/components/lottery/LotteryMachine.tsx:197-209` | aria-live="assertive" role="status" 확인 | ✅ |
| F-1: 설정 프리셋 | `app/components/settings/SettingsDialog.tsx:16-127` | PRESETS 3종 + 활성화 스타일 확인 | ✅ |
| F-2: Web Share API | `app/components/lottery/LotteryMachine.tsx:79-94` | handleShare, navigator.share/clipboard 확인 | ✅ |
| F-3: localStorage 영속성 | `app/hooks/useLotteryMachine.ts:14-257` | loadSavedSettings, useEffect 저장 확인 | ✅ |

---

## Part 2: Phase 1에서 다루지 않은 브레인스토밍 버그

브레인스토밍에서 발견된 버그 중 Phase 1에서 누락된 항목:

### 2.1 미수정 버그

| 버그 | 파일:라인 | 상세 | 심각도 |
|------|-----------|------|--------|
| **CLOSE_SETTINGS 변경사항 미복원** | `useLotteryMachine.ts:64-69` | 설정 다이얼로그에서 값 변경 후 X/backdrop 클릭 시 변경값이 state에 남음. `UPDATE_SETTINGS`가 즉시 state를 변경하기 때문. `CLOSE_SETTINGS`는 settingsOpen만 false로 변경. | HIGH |
| **getRandomNumbers Fisher-Yates 미구현** | `app/lib/lottery.ts:43-63` | 현재 구현은 각 추첨마다 `getAvailableNumbers()`를 호출하는 O(n*k) 방식. 진정한 Fisher-Yates partial shuffle이 아님. | LOW |
| **Duplicate state tracking** | `useDrawAnimation.ts` vs `useLotteryMachine.ts` | `isAnimating`이 두 곳에 존재: useDrawAnimation(로컬 useState)와 useLotteryMachine(reducer). `displayNumber`도 중복. 현재 LotteryMachine은 useDrawAnimation의 값만 사용하여 reducer의 값은 갱신만 되고 실제로 안 쓰임. | MEDIUM |

### 2.2 미제거 Dead Code

| 항목 | 파일 | 상세 | 영향 |
|------|------|------|------|
| **useSound hook** | `app/hooks/useSound.ts` | 완전한 구현체이나 어느 컴포넌트에서도 import되지 않음. sound 기능은 LotteryMachine이 `lib/sound.ts`를 직접 사용. | 번들 크기 무영향 (미import), 코드 혼란 |
| **animate-float CSS** | `app/app.css:294-296` | `.animate-float` 클래스 정의 있으나 어느 컴포넌트에도 사용 없음 | 미미 |
| **animate-breathe CSS** | `app/app.css:298-300` | `.animate-breathe` 클래스 정의 있으나 미사용 | 미미 |
| **@keyframes shimmer** | `app/app.css:247-255` | shimmer 키프레임 정의 있으나 `.animate-shimmer` 클래스 미정의, 미사용 | 미미 |

---

## Part 3: 추가개선 항목 (Phase 2 계획)

### 3.1 누락된 보안 개선 (security-reviewer)

| 항목 | 우선순위 | 파일 | 설명 |
|------|----------|------|------|
| **Content Security Policy 헤더** | P1 | `workers/app.ts` | CSP 미구현. 현재 inline style/script 사용 패턴 고려 필요. |
| **crypto.getRandomValues() 업그레이드** | P2 | `app/lib/lottery.ts` | 현재 `Math.random()` 사용. 사용자 신뢰를 위해 crypto API로 교체. |
| **Dependabot/Renovate 활성화** | P1 | `.github/dependabot.yml` 신규 | 취약점 자동 감지. |

### 3.2 PWA 완성 (architect + backend-dev)

| 항목 | 우선순위 | 파일 | 설명 |
|------|----------|------|------|
| **Service Worker** | **P0 CRITICAL** | `public/sw.js` 또는 vite-plugin-pwa | Lighthouse PWA audit FAIL 중. 오프라인 지원 없음. |
| **Install Prompt** | P1 | `app/hooks/useInstallPrompt.ts` 신규 | 3번째 추첨 후 홈화면 추가 배너 표시. |
| **overscroll-behavior: none** | P1 | `app/app.css` | 모바일 pull-to-refresh 방지. |
| **Dynamic theme-color** | P1 | `app/root.tsx` 또는 테마 훅 | 현재 `#000000` 고정. 다크/라이트 모드 전환 시 동적 변경. |

### 3.3 미구현 접근성 (a11y) (frontend-dev)

| 항목 | 우선순위 | 파일 | 설명 |
|------|----------|------|------|
| **HistoryItem X버튼 터치 타겟** | **P0** | `app/components/lottery/HistoryList.tsx` | ~16px → 44px WCAG 최소 요구사항 위반. |
| **role="status" on StatusBar** | P1 | `app/components/lottery/StatusBar.tsx` | `role="status"` + `aria-live="polite"` 추가 필요. |
| **Focus management after draw** | P1 | `LotteryMachine.tsx` | 추첨 완료 후 "다시 추첨하기" 버튼으로 포커스 이동. |
| **Semantic history list** | P1 | `HistoryList.tsx` | `<ul>/<li>` 구조 또는 `role="list"` 확인. |
| **HistoryItem restore 아이콘 혼란** | P1 | `HistoryList.tsx` | X 아이콘이 "삭제"처럼 보이나 실제 동작은 "복원". Undo/RotateCcw 아이콘으로 변경 필요. |

### 3.4 미구현 성능 최적화 (perf-analyzer)

| 항목 | 우선순위 | 파일 | 설명 |
|------|----------|------|------|
| **React.memo 추가** | P1 | StatusBar, HistoryList, ResultDisplay, SettingsDialog | 애니메이션 틱마다 불필요한 6/7 컴포넌트 재렌더링 방지. |
| **Google Fonts 자체 호스팅** | P1 | `app/root.tsx`, `package.json` | `@fontsource/noto-sans` 패키지로 FCP-blocking external CSS 제거. |
| **SettingsDialog lazy loading** | P2 | `LotteryMachine.tsx` | `React.lazy()` + `Suspense`로 초기 번들에서 제외. |
| **AudioContext resume() 최적화** | P2 | `app/lib/sound.ts` | 애니메이션 시작 시 1회만 resume() 호출. 현재 매 틱 체크. |
| **rollup-plugin-visualizer** | P2 | `vite.config.ts` | 번들 분석 도구 추가. |
| **React Compiler 활성화** | P3 | `vite.config.ts` | 자동 메모이제이션. |

### 3.5 미구현 UX 기능 (frontend-dev)

| 항목 | 우선순위 | 파일 | 설명 |
|------|----------|------|------|
| **Multi-stage result reveal** | P0 | `LotteryMachine.tsx`, `useDrawAnimation.ts` | 복수 추첨 시 번호를 하나씩 순차 공개 (한국 TV 방식). |
| **Confetti celebration** | P1 | `LotteryMachine.tsx` | `canvas-confetti` (~6KB) 결과 공개 시 축하 효과. |
| **Confirm dialog on resetAll** | P1 | `LotteryMachine.tsx` | "다시 설정하기" 클릭 시 확인 다이얼로그. 실수 방지. |
| **Grouped history by draw round** | P1 | `HistoryList.tsx` | 현재 flat 리스트 → "1회차: 7, 23, 45" 그룹 표시. |
| **Result number color variety** | P1 | `ResultDisplay.tsx` | chart-1~5 색상 순환 적용으로 시각적 다양성. |
| **Progress bar in StatusBar** | P1 | `StatusBar.tsx` | 남은/전체 번호 비율 시각화 게이지. |
| **Korean Lotto color coding** | P2 | `ResultDisplay.tsx` | 1-10: yellow, 11-20: blue 등 공식 로또 색상 코딩. |
| **Number sorting option** | P2 | `useLotteryMachine.ts` | 추첨 결과를 오름차순 정렬 옵션 (한국 사용자 기대). |
| **Haptic feedback** | P2 | `useDrawAnimation.ts` | `navigator.vibrate()` 추첨 중 진동 (Android). |

### 3.6 미구현 애니메이션 (frontend-dev)

| 항목 | 우선순위 | 파일 | 설명 |
|------|----------|------|------|
| **Phase transition animations** | P1 | `LotteryMachine.tsx`, `app.css` | 페이즈 전환 시 fade/slide 진입/퇴장 애니메이션. |
| **Final number bounce-in** | P2 | `ResultDisplay.tsx`, `app.css` | 결과 표시 시 scale 0→1.15→0.95→1 bounce 효과. |
| **DrawButton breathing animation** | P3 | `DrawButton.tsx` | ready 상태 미사용 `animate-breathe` 클래스 활용 가능. |

### 3.7 미구현 한국 시장 최적화 (researcher + backend-dev)

| 항목 | 우선순위 | 파일 | 설명 |
|------|----------|------|------|
| **Korean Open Graph meta tags** | P0 | `app/routes/home.tsx` | og:title, og:description, og:image 한국어로 추가. KakaoTalk 공유 미리보기 필수. |
| **System font fallbacks** | P1 | `app/app.css` | `Apple SD Gothic Neo`, `Malgun Gothic` 폰트 스택 추가. |
| **KakaoTalk 공유 개선** | P2 | `LotteryMachine.tsx` | 현재 Web Share API만 있음. Kakao JS SDK로 미리보기 카드 공유 개선. |

### 3.8 미구현 인프라 (backend-dev)

| 항목 | 우선순위 | 파일 | 설명 |
|------|----------|------|------|
| **테스트 작성** | P1 | `app/lib/*.test.ts`, `app/hooks/*.test.ts` | 현재 test infra 구비(vitest, @testing-library)되나 테스트 파일 0개. |
| **CI/CD 파이프라인** | P1 | `.github/workflows/ci.yml` 신규 | typecheck + test + build + deploy 자동화. |
| **Edge 캐싱 헤더** | P1 | `workers/app.ts` | SSR 응답에 Cache-Control 헤더 추가. |
| **Wrangler placeholder 정리** | P3 | `wrangler.jsonc` | `VALUE_FROM_CLOUDFLARE` placeholder 실제 값으로 대체 또는 제거. |

### 3.9 컴포넌트 아키텍처 개선 (architect + frontend-dev)

| 항목 | 우선순위 | 파일 | 설명 |
|------|----------|------|------|
| **LotteryMachine 분리** | P2 | `app/components/lottery/` | 262줄 god component → HeroSection, DrawingSection, ResultSection으로 분리. |
| **Desktop card layout** | P2 | `LotteryMachine.tsx` | `max-w-md mx-auto shadow-2xl rounded-2xl` 데스크탑 카드 레이아웃. |
| **Landscape mode fix** | P1 | `LotteryMachine.tsx`, `app.css` | 현재 `h-dvh`가 landscape에서 컨텐츠 짤림 가능성. |

---

## Part 4: Phase 2 실행 계획

### 우선순위 결정 기준
- P0: 기능 결함 / 규정 위반 / 치명적 UX 문제
- P1: 사용자 경험에 직접적 영향
- P2: 점진적 개선
- P3: 선택적 개선

### Phase 2 Task 목록 (권장 실행 순서)

#### Group A: 버그 수정 (code-reviewer)
| Task | 파일 | 설명 | 우선순위 |
|------|------|------|----------|
| **A-1** | `useLotteryMachine.ts` | CLOSE_SETTINGS 취소 시 변경사항 복원 (`pendingSettings` 패턴) | P0 |
| **A-2** | `HistoryList.tsx` | X 버튼 → RotateCcw/Undo 아이콘으로 의미 명확화 | P1 |

#### Group B: 접근성 수정 (frontend-dev)
| Task | 파일 | 설명 | 우선순위 |
|------|------|------|----------|
| **B-1** | `HistoryList.tsx` | 복원 버튼 터치 타겟 44px 이상으로 확대 | P0 |
| **B-2** | `StatusBar.tsx` | `role="status"` + `aria-live="polite"` 추가 | P1 |
| **B-3** | `LotteryMachine.tsx` | 추첨 완료 후 "다시 추첨하기" 버튼으로 포커스 이동 | P1 |
| **B-4** | `HistoryList.tsx` | 시맨틱 리스트 구조 확인/개선 | P1 |

#### Group C: SEO + 공유 개선 (backend-dev)
| Task | 파일 | 설명 | 우선순위 |
|------|------|------|----------|
| **C-1** | `app/routes/home.tsx` | Korean OG meta tags 추가 (og:title, og:description, og:image) | P0 |
| **C-2** | `app/app.css` | 시스템 폰트 스택에 Apple SD Gothic Neo, Malgun Gothic 추가 | P1 |

#### Group D: PWA 완성 (architect + backend-dev)
| Task | 파일 | 설명 | 우선순위 |
|------|------|------|----------|
| **D-1** | `public/sw.js` 또는 `vite.config.ts` | Service worker 구현 (vite-plugin-pwa 권장) | P0 CRITICAL |
| **D-2** | `app/app.css` | `overscroll-behavior: none` body에 추가 | P1 |
| **D-3** | `app/root.tsx` 또는 `useTheme.ts` | Dynamic theme-color meta tag | P1 |

#### Group E: UX 기능 추가 (frontend-dev)
| Task | 파일 | 설명 | 우선순위 |
|------|------|------|----------|
| **E-1** | `LotteryMachine.tsx` | resetAll 확인 다이얼로그 추가 | P1 |
| **E-2** | `LotteryMachine.tsx`, `ResultDisplay.tsx` | Confetti 효과 (canvas-confetti) | P1 |
| **E-3** | `HistoryList.tsx` | 히스토리 회차별 그룹화 | P1 |
| **E-4** | `ResultDisplay.tsx` | 결과 번호 색상 다양화 (chart-1~5) | P1 |
| **E-5** | `StatusBar.tsx` | 남은 번호 progress bar 추가 | P1 |
| **E-6** | `LotteryMachine.tsx`, `useDrawAnimation.ts` | 복수 추첨 multi-stage 순차 공개 | P0 |

#### Group F: 성능 최적화 (perf-analyzer)
| Task | 파일 | 설명 | 우선순위 |
|------|------|------|----------|
| **F-1** | 각 컴포넌트 | React.memo 추가: StatusBar, HistoryList, ResultDisplay | P1 |
| **F-2** | `app/root.tsx`, `package.json` | @fontsource/noto-sans 자체 호스팅 | P1 |
| **F-3** | `LotteryMachine.tsx` | SettingsDialog React.lazy() 적용 | P2 |

#### Group G: 보안 강화 (security-reviewer)
| Task | 파일 | 설명 | 우선순위 |
|------|------|------|----------|
| **G-1** | `workers/app.ts` | Content-Security-Policy 헤더 추가 | P1 |
| **G-2** | `app/lib/lottery.ts` | Math.random() → crypto.getRandomValues() | P2 |
| **G-3** | `.github/dependabot.yml` | Dependabot 설정 파일 추가 | P1 |

#### Group H: 인프라 (backend-dev)
| Task | 파일 | 설명 | 우선순위 |
|------|------|------|----------|
| **H-1** | `app/lib/lottery.test.ts` 신규 | lottery.ts 순수함수 테스트 | P1 |
| **H-2** | `app/lib/animation.test.ts` 신규 | animation.ts 순수함수 테스트 | P1 |
| **H-3** | `.github/workflows/ci.yml` 신규 | CI/CD 파이프라인 (typecheck + test + build) | P1 |
| **H-4** | `workers/app.ts` | SSR 응답 Cache-Control 헤더 추가 | P1 |

#### Group I: Dead Code 제거 (code-reviewer)
| Task | 파일 | 설명 | 우선순위 |
|------|------|------|----------|
| **I-1** | `app/hooks/useSound.ts` | 미사용 useSound hook 파일 삭제 | P2 |
| **I-2** | `app/app.css` | 미사용 @keyframes shimmer, .animate-float, .animate-breathe 제거 (breathe는 DrawButton 개선 시 활용 가능하므로 보류 검토) | P3 |

---

## Part 5: 진행 현황 요약

| Phase | 완료 | 전체 | 진행률 |
|-------|------|------|--------|
| **Phase 1 (Quick Wins)** | 17 | 17 | **100%** |
| **Phase 2 (Short-term)** | 0 | ~30 | **0%** - 계획 수립 완료 |
| **Phase 3 (Medium-term)** | 0 | ~15 | **0%** - 백로그 |

---

## Part 6: 에이전트 파일 소유권 (Phase 2)

| 에이전트 | 담당 Task | 파일 |
|----------|-----------|------|
| **architect** | D-1 (Service Worker 아키텍처) | `vite.config.ts`, `public/sw.js` |
| **frontend-dev** | B-1~B-4, E-1~E-6 | `app/components/lottery/`, `app/app.css` |
| **backend-dev** | C-1~C-2, D-2~D-3, H-1~H-4 | `workers/app.ts`, `app/routes/home.tsx`, `app/root.tsx`, `.github/` |
| **code-reviewer** | A-1~A-2, I-1~I-2 | `app/hooks/useLotteryMachine.ts`, `app/hooks/useSound.ts`, `app/app.css` |
| **perf-analyzer** | F-1~F-3 | `app/components/**`, `app/root.tsx` |
| **security-reviewer** | G-1~G-3 | `workers/app.ts`, `app/lib/lottery.ts`, `.github/dependabot.yml` |

---

## Part 7: 추가 검토 필요 항목 (Backlog)

아래 항목은 Phase 3(Long-term)에서 검토:
- LotteryMachine god component 분리 (아키텍처 영향 큼)
- Slot machine vertical reel 애니메이션
- Desktop/tablet 레이아웃 최적화 (max-w-md 카드)
- i18n (English, Japanese)
- Landscape mode 전용 레이아웃
- KakaoTalk JS SDK 직접 통합
- View Transitions API (React Router 7 지원)
- Screen Wake Lock API
- NumberInput long-press auto-repeat
- React Compiler (Vite 플러그인, React 19 RC 안정화 후)

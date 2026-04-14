# Phase 1 구현계획 - 행운번호 추첨기 Quick Wins

> **Date**: 2026-03-06
> **Based on**: IMPROVE_BRAINSTORMING.md
> **Scope**: Short-term Quick Wins (1~2주)
> **Status**: ✅ 완료

---

## 에이전트 팀 구성

| 역할 | 담당 파일 | 책임 |
|------|-----------|------|
| **architect** (조율) | - | 전체 계획 조율, 의사결정, 직접 구현 |
| **frontend-dev** | `app/components/**/*.tsx`, `app/app.css`, `app/hooks/useDrawAnimation.ts` | UI/CSS/접근성/UX 기능 |
| **backend-dev** | `workers/app.ts`, `public/manifest.json`, `package.json`, `app/root.tsx` | 인프라, 보안, 번들 최적화 |
| **code-reviewer** | `app/lib/*.ts`, `app/hooks/useLotteryMachine.ts`, `app/routes/home.tsx` | 버그 수정, 성능 최적화 |

> **비고**: 에이전트들이 권한 거부로 인해 작업 불가 → architect(조율자)가 직접 모든 변경사항 구현

---

## Task 목록

### Group A: 버그 수정 (Bug Fixes)

| Task | 파일 | 담당 | 설명 | 상태 |
|------|------|------|------|------|
| **A-1** | `app/root.tsx` | backend-dev | `lang="en"` → `lang="ko"` 수정 | ✅ 완료 |
| **A-2** | `app/routes/home.tsx` | code-reviewer | 중복 viewport 메타태그 제거 | ✅ 완료 |
| **A-3** | `app/hooks/useLotteryMachine.ts` | code-reviewer | RESTORE_NUMBER: `filter` → `indexOf+slice` (첫 번째만 제거) | ✅ 완료 |
| **A-4** | `public/manifest.json` | backend-dev | 아이콘 `"purpose": "any maskable"` → 별도 항목 분리 (4개) | ✅ 완료 |
| **A-5** | `app/lib/animation.ts` | code-reviewer | 하드코딩 `50/400` → `ANIMATION_CONFIG.minInterval/maxInterval` 사용 | ✅ 완료 |

### Group B: 성능 최적화 (Performance)

| Task | 파일 | 담당 | 설명 | 상태 |
|------|------|------|------|------|
| **B-1** | `app/lib/lottery.ts` | code-reviewer | `getAvailableNumbers()` O(n*m) → `Set` 사용 O(n) | ✅ 완료 |
| **B-2** | `package.json` | backend-dev | `@hugeicons/react` 미사용 의존성 제거 | ✅ 완료 |
| **B-3** | `app/root.tsx` | backend-dev | Google Fonts: `0,100..900;1,100..900` → `wght@400;600;700` | ✅ 완료 |

### Group C: 보안 (Security)

| Task | 파일 | 담당 | 설명 | 상태 |
|------|------|------|------|------|
| **C-1** | `workers/app.ts` | backend-dev | 보안 헤더 추가: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy | ✅ 완료 |

### Group D: PWA 개선 (PWA Enhancement)

| Task | 파일 | 담당 | 설명 | 상태 |
|------|------|------|------|------|
| **D-1** | `public/manifest.json` | backend-dev | `id`, `scope`, `prefer_related_applications: false` 추가 (A-4와 통합) | ✅ 완료 |
| **D-2** | `app/root.tsx` | backend-dev | `apple-mobile-web-app-status-bar-style` → `black-translucent`, viewport에 `viewport-fit=cover` 추가 | ✅ 완료 |

### Group E: 접근성 (Accessibility)

| Task | 파일 | 담당 | 설명 | 상태 |
|------|------|------|------|------|
| **E-1** | `app/app.css` | frontend-dev | `@media (prefers-reduced-motion: reduce)` CSS 규칙 추가 | ✅ 완료 |
| **E-2** | `app/hooks/useDrawAnimation.ts` | frontend-dev | JS에서 `prefers-reduced-motion` 체크, 애니메이션 즉시 완료 처리 | ✅ 완료 |
| **E-3** | `app/components/lottery/LotteryMachine.tsx` | frontend-dev | 결과 영역에 `aria-live="assertive"` + `role="status"` + `aria-atomic="true"` 추가 | ✅ 완료 |

### Group F: UX 기능 (UX Features)

| Task | 파일 | 담당 | 설명 | 상태 |
|------|------|------|------|------|
| **F-1** | `app/components/settings/SettingsDialog.tsx` | frontend-dev | 설정 프리셋 버튼: "로또 6/45", "빙고 1/75", "주사위" 퀵셀렉트 | ✅ 완료 |
| **F-2** | `app/components/lottery/LotteryMachine.tsx` | frontend-dev | Web Share API 결과 공유 버튼 추가 (미지원 시 클립보드 복사) | ✅ 완료 |
| **F-3** | `app/hooks/useLotteryMachine.ts` | code-reviewer | localStorage 설정 영속성: 저장/복원 (lazy initializer + useEffect) | ✅ 완료 |

---

## 구현 내용 상세

### A-1: lang="ko" ✅
- `app/root.tsx:35`: `<html lang="en">` → `<html lang="ko">`

### A-2: 중복 viewport 제거 ✅
- `app/routes/home.tsx`: `meta()` 에서 viewport 항목 제거
- root.tsx가 단일 소스로 viewport 관리

### A-3: RESTORE_NUMBER 버그 수정 ✅
- `app/hooks/useLotteryMachine.ts`: `filter()` → `indexOf() + slice()` 로 변경
- 동일 번호 중복 추첨 시에도 첫 번째 발생만 정확히 제거

### A-4 + D-1: manifest.json 개선 ✅
- 아이콘 `"purpose"` 4개로 분리 (192/512 각 any + maskable)
- `"id": "/"`, `"scope": "/"`, `"prefer_related_applications": false` 추가

### A-5: ANIMATION_CONFIG 상수 활용 ✅
- `app/lib/animation.ts`: `ANIMATION_CONFIG`를 `generateAnimationSchedule` 함수 위로 이동
- 함수 내 하드코딩 `50` → `ANIMATION_CONFIG.minInterval`, `400` → `ANIMATION_CONFIG.maxInterval`

### B-1: Set 최적화 ✅
- `app/lib/lottery.ts:getAvailableNumbers()`: `excluded.includes()` O(n*m) → `new Set(excluded).has()` O(n)

### B-2: @hugeicons/react 제거 ✅
- `package.json`: 미사용 `@hugeicons/react` 의존성 제거

### B-3: Google Fonts 최소화 ✅
- `app/root.tsx`: `ital,wght@0,100..900;1,100..900` → `wght@400;600;700`
- 이탤릭 18개 웨이트 → 필요한 3개 웨이트만 로드

### C-1: 보안 헤더 ✅
- `workers/app.ts`: `SECURITY_HEADERS` 상수 + 응답에 자동 주입
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### D-2: PWA Meta 개선 ✅
- `app/root.tsx`: `viewport-fit=cover` 추가, status-bar-style → `black-translucent`

### E-1: prefers-reduced-motion CSS ✅
- `app/app.css`: 파일 끝에 `@media (prefers-reduced-motion: reduce)` 블록 추가
- 모든 `animation-duration`, `transition-duration` → `0.01ms`

### E-2: prefers-reduced-motion JS ✅
- `app/hooks/useDrawAnimation.ts`: 애니메이션 시작 시 미디어 쿼리 확인
- `prefersReducedMotion` true 시 `effectiveDuration = 0` → 즉시 결과 표시

### E-3: aria-live 추가 ✅
- `app/components/lottery/LotteryMachine.tsx`: ResultDisplay 래퍼에 접근성 속성 추가
  ```tsx
  <div aria-live="assertive" role="status" aria-atomic="true" aria-label="추첨 결과">
    {showResult && <ResultDisplay ... />}
  </div>
  ```

### F-1: 설정 프리셋 ✅ (Pencil MCP 디자인 기반)
- `app/components/settings/SettingsDialog.tsx`:
  - `PRESETS` 상수 3개: 로또 6/45, 빙고 1/75, 주사위
  - `isPresetActive()` 헬퍼 함수
  - `handlePresetClick()` 핸들러
  - 다이얼로그 상단 "빠른 설정" 섹션 추가
  - 활성 프리셋: `bg-primary text-primary-foreground`, 비활성: `bg-muted border`

### F-2: Web Share API ✅
- `app/components/lottery/LotteryMachine.tsx`:
  - `handleShare` 비동기 콜백 추가
  - `navigator.share` 지원 시 공유, 미지원 시 `navigator.clipboard` 복사
  - Share2 아이콘 + "공유하기" 버튼 (결과 화면에 표시)

### F-3: localStorage 영속성 ✅
- `app/hooks/useLotteryMachine.ts`:
  - `loadSavedSettings()`: localStorage에서 설정 로드 + 유효성 검증
  - `getInitialState()`: lazy initializer (SSR 안전)
  - `useReducer` → lazy initializer 사용
  - `useEffect`: settings 변경 시 자동 저장

---

## 디자인 작업 (Pencil MCP) ✅

- **파일**: `/Users/jeremy/Documents/3_Resources/Pencil/random_number.pen`
- **프레임**: `Settings Dialog - 설정 프리셋` (390x844)
- **설계 내용**:
  - 다크 오버레이 + 흰색 다이얼로그 카드 (20px 라운드)
  - 헤더: "설정" 제목 + 부제목 수직 스택
  - 프리셋 칩: "로또 6/45" (주황색 활성), "빙고 1/75", "주사위" (회색 비활성)
  - 숫자 입력 행: `−`, 값, `+` 컨트롤
  - 스위치 토글: 중복허용(off), 효과음(on/주황)
  - "설정 완료" 주황 버튼

---

## 진행 현황

| 그룹 | 완료 | 전체 | 진행률 |
|------|------|------|--------|
| A. 버그 수정 | 5 | 5 | 100% |
| B. 성능 최적화 | 3 | 3 | 100% |
| C. 보안 | 1 | 1 | 100% |
| D. PWA | 2 | 2 | 100% |
| E. 접근성 | 3 | 3 | 100% |
| F. UX 기능 | 3 | 3 | 100% |
| **합계** | **17** | **17** | **100%** |

---

## 변경된 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `app/root.tsx` | lang=ko, 폰트 최적화, viewport-fit=cover, status-bar-style=black-translucent |
| `app/routes/home.tsx` | 중복 viewport 메타 제거 |
| `app/hooks/useLotteryMachine.ts` | RESTORE_NUMBER 버그 수정, localStorage 영속성 추가 |
| `app/lib/lottery.ts` | Set 최적화 (O(n*m) → O(n)) |
| `app/lib/animation.ts` | ANIMATION_CONFIG 상수 순서 조정 + 활용 |
| `app/hooks/useDrawAnimation.ts` | prefers-reduced-motion JS 지원 |
| `app/app.css` | prefers-reduced-motion CSS 미디어 쿼리 추가 |
| `app/components/lottery/LotteryMachine.tsx` | aria-live 결과 영역, Web Share API 공유 버튼 |
| `app/components/settings/SettingsDialog.tsx` | 설정 프리셋 버튼 3종 추가 |
| `public/manifest.json` | 아이콘 purpose 분리, id/scope/prefer_related_applications 추가 |
| `workers/app.ts` | 보안 헤더 5종 추가 |
| `package.json` | @hugeicons/react 미사용 의존성 제거 |

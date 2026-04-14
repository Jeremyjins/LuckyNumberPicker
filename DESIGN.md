# 행운번호 추첨기 Design System

## 1. Visual Theme & Atmosphere

행운번호 추첨기는 모바일 퍼스트 유틸리티 앱입니다. 디자인은 **따뜻하고 활기찬 오렌지 톤**을 브랜드 컬러로 사용하며, 미니멀하고 집중된 단일 화면 경험을 제공합니다. 로또 추첨의 설렘과 재미를 전달하면서도 과도한 장식 없이 핵심 기능에 집중합니다.

앱은 상태 머신 기반의 4단계 흐름(initial → ready → drawing → result)을 따르며, 각 단계에서 적절한 애니메이션과 시각적 피드백으로 전환됩니다. 전체적인 톤은 **캐주얼하지만 신뢰감 있는** 느낌입니다.

**Key Characteristics:**
- 오렌지 브랜드 컬러 — 따뜻하고 행운을 상징하는 색상
- shadcn/ui 기반 컴포넌트 — oklch 컬러 시스템
- 모바일 퍼스트 풀스크린 레이아웃 — 사이드바 없음, 단일 화면 앱
- Light/Dark 모드 지원 (class-based `.dark` 토글)
- Noto Sans 한글 최적화 폰트
- 풍부한 마이크로 애니메이션 — 결과 팝, 숫자 롤링, 펄스 링, confetti
- Web Audio API 효과음 — 시각+청각 피드백
- PWA 지원 — 오프라인 동작, 홈 화면 설치
- `prefers-reduced-motion` 존중하는 접근성 고려

## 2. Color Palette & Roles

### Brand
- **Orange** (`oklch(0.65 0.19 41)` / ~`#e87b35`): Primary 브랜드 컬러, CTA 버튼, 추첨 버튼, 포커스 링
- **Orange Dark** (`oklch(0.70 0.19 48)` / ~`#ef8c3a`): 다크모드 Primary, 더 밝은 오렌지

### Semantic Tokens (CSS Variables — oklch format)

모든 색상은 oklch 값으로 정의, Tailwind v4의 `@theme inline` 시스템 사용.

#### Light Mode (`:root`)

| Token | oklch Value | Role |
|-------|-------------|------|
| `--background` | `oklch(1 0 0)` | 페이지 배경 (순백) |
| `--foreground` | `oklch(0.145 0 0)` | 기본 텍스트 (거의 검정) |
| `--card` | `oklch(1 0 0)` | 카드 표면 |
| `--card-foreground` | `oklch(0.145 0 0)` | 카드 텍스트 |
| `--primary` | `oklch(0.65 0.19 41)` | 오렌지 — CTA, 추첨 버튼, 강조 |
| `--primary-foreground` | `oklch(0.98 0.02 74)` | Primary 위 텍스트 (밝은 크림) |
| `--secondary` | `oklch(0.97 0 0)` | 보조 표면 (연한 회색) |
| `--secondary-foreground` | `oklch(0.145 0 0)` | 보조 텍스트 |
| `--muted` | `oklch(0.97 0 0)` | 비활성/음소거 배경 |
| `--muted-foreground` | `oklch(0.556 0 0)` | 플레이스홀더, 도움 텍스트 |
| `--accent` | `oklch(0.76 0.16 56)` | 연한 오렌지 — 호버, 미묘한 강조 |
| `--accent-foreground` | `oklch(0.145 0 0)` | 강조 위 텍스트 |
| `--destructive` | `oklch(0.577 0.245 27.325)` | 에러, 삭제 (빨강) |
| `--border` | `oklch(0.922 0 0)` | 경계선, 구분선 |
| `--input` | `oklch(0.922 0 0)` | 입력 필드 테두리 |
| `--ring` | `oklch(0.65 0.19 41)` | 포커스 링 (오렌지) |
| `--radius` | `0.625rem` (10px) | 기본 border-radius |

#### Dark Mode (`.dark`)

| Token | oklch Value | Role |
|-------|-------------|------|
| `--background` | `oklch(0.145 0 0)` | 페이지 배경 (어두운 회색) |
| `--foreground` | `oklch(0.985 0 0)` | 기본 텍스트 (거의 흰색) |
| `--card` | `oklch(0.205 0 0)` | 카드 표면 (짙은 회색) |
| `--primary` | `oklch(0.70 0.19 48)` | 밝은 오렌지 (다크모드 가독성) |
| `--primary-foreground` | `oklch(0.27 0.08 36)` | Primary 위 텍스트 (어두운 갈색) |
| `--secondary` | `oklch(0.269 0 0)` | 보조 표면 |
| `--muted-foreground` | `oklch(0.708 0 0)` | 음소거 텍스트 (밝은 회색) |
| `--accent` | `oklch(0.76 0.16 56)` | 연한 오렌지 (동일) |
| `--destructive` | `oklch(0.704 0.191 22.216)` | 에러 (다크모드 밝은 빨강) |
| `--border` | `oklch(1 0 0 / 10%)` | 반투명 경계선 |
| `--input` | `oklch(1 0 0 / 15%)` | 반투명 입력 테두리 |
| `--ring` | `oklch(0.70 0.19 48)` | 포커스 링 (밝은 오렌지) |

### Result Ball Colors (Cycling)

추첨 결과 볼은 인덱스 기반으로 순환하는 5가지 색상을 사용:

| Index | Class | Color | Visual |
|-------|-------|-------|--------|
| 0 | `bg-primary text-primary-foreground` | 오렌지 | 브랜드 컬러 |
| 1 | `bg-blue-500 text-white` | 파랑 | |
| 2 | `bg-emerald-500 text-white` | 초록 | |
| 3 | `bg-violet-600 text-white` | 보라 | |
| 4 | `bg-rose-500 text-white` | 빨강/장미 | |

### Status Colors

| State | Light | Dark | Use |
|-------|-------|------|-----|
| Low remaining (<=3) | `text-orange-500` | `text-orange-400` | 잔여 번호 경고 |
| Empty (0) | `text-destructive` | `text-destructive` | 번호 소진 |
| Progress bar normal | `bg-primary` | `bg-primary` | 진행률 |

## 3. Typography Rules

### Font Family
- **Primary**: `Noto Sans` (Latin + Korean)
- **Korean Fallback**: `Apple SD Gothic Neo` (iOS/macOS), `Malgun Gothic` (Windows)
- **System Fallback**: `ui-sans-serif, system-ui, sans-serif`
- **Emoji**: `Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji`

### Hierarchy

| Role | Tailwind Class | Weight | Notes |
|------|---------------|--------|-------|
| Hero Title | `text-4xl sm:text-5xl` | `font-bold` | 초기 화면 "행운번호 추첨기" |
| Dialog Title | `text-xl` | implicit semibold | 설정 다이얼로그 제목 |
| Result Numbers | `text-5xl sm:text-7xl` (1-3개), `text-3xl sm:text-4xl` (4-9개), `text-xl sm:text-2xl` (10+) | `font-bold` | 추첨 결과, 크기 자동 조절 |
| Animation Display | `text-6xl` (lg) | `font-bold` | 추첨 중 숫자 표시 |
| Section Label | `text-xs` | `font-semibold` | 설정 섹션 레이블 (uppercase) |
| Body / Label | `text-sm` | `font-medium` | 설정 항목 레이블 |
| Caption / Helper | `text-xs` | `font-normal` | 부가 설명, 히스토리 회차 표시 |
| Muted Text | `text-sm text-muted-foreground` or `text-base text-muted-foreground` | `font-normal` | 서브타이틀, 결과 메시지 |
| Brand Footer | `text-[10px]` | `font-semibold` | "SPONSORED BY" |
| Preset Chip | `text-sm` | `font-medium` | 빠른 설정 버튼 |

### Number Display
- **`tabular-nums`**: 모든 숫자 표시에 고정 폭 적용 (결과, 히스토리, 애니메이션)
- 숫자 개수에 따른 동적 크기 조절 (1-3개: 초대형, 4-9개: 중형, 10+: 소형)

### Principles
- Korean-first: 모든 UI 텍스트는 한국어
- `text-sm`이 기본 본문 크기
- Hero 텍스트는 초기 화면에만 존재 — 앱 진입 후에는 `text-xl` 이하
- `tabular-nums`로 숫자 정렬 일관성 유지

## 4. Component Stylings

### DrawButton (Primary CTA)

추첨기의 핵심 상호작용 요소. 원형 대형 버튼.

| Variant | Background | Text | Shadow | Use |
|---------|-----------|------|--------|-----|
| `setup` | `bg-secondary` | `text-secondary-foreground` | `shadow-secondary/30` | 초기 "세팅하기" |
| `draw` | `bg-primary` | `text-primary-foreground` | `shadow-primary/30` | "추첨하기" |

**Sizes:** `sm` (96px), `md` (128px), `lg` (160px) — 항상 `rounded-full`

**States:**
- Default: 아이콘 + 텍스트 (Settings / Shuffle 아이콘)
- Hover: `hover:-translate-y-1`, shadow 강화 (`shadow-xl`)
- Active: `active:scale-95 active:translate-y-0`
- Animating: 숫자 표시 (`tabular-nums animate-number-roll`), pulse ring 오버레이
- Disabled: `opacity-50 cursor-not-allowed shadow-none`
- Focus: `focus-visible:ring-4 focus-visible:ring-ring/50`

### Result Ball

둥근 사각형 숫자 볼. 크기는 개수에 따라 자동 조절.

| Count | Container | Text | Gap |
|-------|-----------|------|-----|
| 1-3 | `min-w-32 h-32 px-4 rounded-2xl` (sm: 40/40) | `text-5xl` (sm: 7xl) | `gap-4` |
| 4-9 | `min-w-20 h-20 px-3 rounded-xl` (sm: 24/24) | `text-3xl` (sm: 4xl) | `gap-3` |
| 10+ | `min-w-14 h-14 px-2 rounded-lg` (sm: 16/16) | `text-xl` (sm: 2xl) | `gap-2` |

**Shared:** `shadow-lg`, `font-bold tabular-nums`, 순환 색상 (5색), `animate-result-pop` with staggered delay (80ms/ball)

### Button (shadcn/ui)

| Variant | Background | Text | Use |
|---------|-----------|------|-----|
| `default` | `bg-primary` | `text-primary-foreground` | "다시 추첨하기", "설정 완료" |
| `destructive` | `bg-destructive` | `text-white` | "초기화" |
| `outline` | `bg-background border` | inherits | "취소" |
| `ghost` | transparent | inherits | "다시 설정하기" |
| `secondary` | `bg-secondary` | `text-secondary-foreground` | 대안 액션 |
| `link` | transparent | `text-primary` | 인라인 링크 |

**Sizes:** `default` (h-9), `sm` (h-8), `lg` (h-10), `icon` (9x9), `icon-sm` (8x8), `icon-lg` (10x10)

**Shared:** `rounded-md`, `transition-all`, `focus-visible:ring-[3px]`, disabled: `opacity-50`

### StatusBar

- Container: `bg-muted/50 rounded-lg py-3 px-4`
- Text: `text-md text-muted-foreground` + `font-semibold tabular-nums` for count
- Progress bar: `h-1 bg-border rounded-full` track, `bg-primary` fill with `transition-all duration-500`
- Sticky header in result phase: `sticky top-0 bg-background z-40`
- Accessibility: `role="status" aria-live="polite"`

### HistoryItem (Pill Chip)

- Container: `rounded-full px-3 py-1.5 bg-secondary text-secondary-foreground`
- Text: `text-sm font-medium tabular-nums`
- Restore button: `min-w-[44px] min-h-[44px]` (WCAG touch target), `hover:bg-primary/10 hover:text-primary`
- Icon: `RotateCcw w-3 h-3`

### Preset Chip (SettingsDialog)

- Active: `bg-primary text-primary-foreground rounded-full px-4 py-1.5`
- Inactive: `bg-muted text-muted-foreground border border-border rounded-full`
- Transition: `transition-colors`

### Dialog / Modal (SettingsDialog)

- Max width: `sm:max-w-md`
- Structure: DialogHeader (title + description) → content (`space-y-6 py-4`) → full-width confirm button
- Separator between number inputs and toggle options
- NumberInput: custom stepper component for numeric input
- Switch: shadcn/ui Switch for boolean toggles
- Error: `text-sm text-destructive`

### ThemeSelector

- Shape: `rounded-full w-10 h-10`
- Position: `fixed top-4 right-4 z-50`
- Background: `bg-secondary/50 hover:bg-secondary`
- Icons: Moon (light→dark) / Sun (dark→light) from lucide-react
- Hover: `hover:scale-105 active:scale-95`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

## 5. Layout Principles

### Page Structure

단일 풀스크린 앱. 사이드바 없음. 세로 플로우.

```
+---[Full Width]---+
| [ThemeSelector]  | ← fixed top-4 right-4 z-50
+------------------+
| [StatusBar]      | ← sticky header (result phase)
|   남은 번호: N/M |
|   [Progress Bar] |
+------------------+
|                  |
| [Main Content]   | ← flex-1, centered
|   [Hero / Result]|
|   [DrawButton]   |
|                  |
+------------------+
| [History]        | ← shrink-0, bottom section
|   1회차: 23 45.. |
+------------------+
| [Footer]         | ← mt-auto, shrink-0
|   [Reset Button] |
|   SPONSORED BY   |
+------------------+
```

### Spacing System

Tailwind 기본 4px 단위:

| Token | Value | Common Use |
|-------|-------|-----------|
| `1` | 4px | 미세 간격 |
| `2` | 8px | 인라인 간격, 히스토리 행간 |
| `3` | 12px | 입력 패딩, StatusBar 내부 |
| `4` | 16px | 기본 px/py, 섹션 간격 |
| `6` | 24px | 다이얼로그 내부 spacing |
| `8` | 32px | 큰 컴포넌트 간격 |

### Content Layout
- Main content: `px-4 py-4`, `flex-col items-center`
- Initial/Ready/Drawing phase: `flex-1 justify-center` (수직 중앙 정렬)
- Result phase: `gap-4`, 스크롤 가능
- History: `px-4 py-4 shrink-0`
- Footer: `pb-safe px-4 pb-4 mt-auto shrink-0`

### Safe Areas (PWA/iOS)
- `pt-safe`: 상단 safe area (노치)
- `pb-safe`: 하단 safe area (홈 인디케이터)
- `min-h-dvh` / `h-dvh`: 동적 뷰포트 높이 (iOS Safari)
- `overscroll-behavior: none`: pull-to-refresh 방지

### Border Radius Scale

| Value | Tailwind | Use |
|-------|----------|-----|
| 8px | `--radius-md` | 버튼, 입력 필드 |
| 10px | `--radius` (base) | 기본 border-radius |
| 12px | `rounded-lg` | StatusBar |
| 14px | `--radius-xl` | - |
| 16px | `rounded-2xl` | 큰 Result Ball (1-3개) |
| full | `rounded-full` | DrawButton, ThemeSelector, HistoryItem, Preset chip |

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (L0) | border only, no shadow | 입력 필드, StatusBar |
| Subtle (L1) | `shadow-lg shadow-secondary/30` | Setup DrawButton |
| Standard (L2) | `shadow-lg shadow-primary/30` | Draw DrawButton |
| Result (L3) | `shadow-lg` | Result Ball |
| Dialog (L4) | `shadow-lg` + backdrop | SettingsDialog |
| Hover Boost | `shadow-xl shadow-*/40` | DrawButton hover |

**Shadow Philosophy:** 이 앱에서 shadow는 주로 **DrawButton과 Result Ball에 집중**됩니다. 플랫한 배경 위에 핵심 상호작용 요소만 떠오르게 하여 사용자 시선을 유도합니다. 일반 UI 요소(StatusBar, HistoryItem)는 배경색 대비(`bg-muted/50`, `bg-secondary`)로 깊이감을 표현합니다.

**Glow Effect:** DrawButton에 `btn-glow` 클래스 — `radial-gradient(circle, rgba(255,255,255,0.3), transparent)` hover 시 활성화.

## 7. Do's and Don'ts

### Do
- oklch CSS 변수 토큰 사용 (`bg-primary`, `text-muted-foreground`) — hex 하드코딩 금지
- `tabular-nums` 모든 숫자 표시에 적용 — 레이아웃 점프 방지
- 다크모드 변형 제공: Tailwind 색상 유틸리티 사용 시 `dark:` 변형 포함
- 모든 인터랙티브 요소에 `focus-visible` 스타일 제공
- 모바일 퍼스트 설계 — 단일 컬럼, 터치 친화적
- safe area inset 존중 (`pt-safe`, `pb-safe`)
- `prefers-reduced-motion` 미디어 쿼리로 애니메이션 비활성화 지원
- `aria-live`, `role="status"` 등 접근성 속성 활용
- WCAG 최소 44x44px 터치 영역 보장 (HistoryItem restore 버튼)
- 번호 개수에 따른 동적 크기 조절 (Result Ball)
- 상태 전환 시 적절한 애니메이션으로 피드백 제공

### Don't
- DrawButton 이외의 곳에 `rounded-full` 버튼 사용하지 않기 (HistoryItem, Preset은 칩이므로 예외)
- `font-bold` (700)를 본문에 사용하지 않기 — Hero title과 결과 숫자에만 사용
- 과도한 그림자 사용 금지 — `shadow-xl` 이상은 hover 상태에서만
- 오렌지를 대면적 배경에 사용하지 않기 — CTA 버튼, 포커스 링, 진행률 바에만 사용
- CSS 토큰 외 하드코딩 색상 사용 금지 (Result Ball 색상 배열 제외)
- 임의 값(`p-[13px]`) 사용 지양 — Tailwind 스케일 사용
- 새로운 색상 토큰 추가 시 반드시 light/dark 모두 정의
- 초기 화면 이후에 `text-3xl` 이상 사용하지 않기
- 복잡한 레이아웃(grid, multi-column) 도입하지 않기 — 이 앱은 단일 컬럼 세로 플로우

## 8. Responsive Behavior

### Breakpoints

이 앱은 모바일 중심으로, 주요 반응형 변화가 최소화되어 있습니다.

| Name | Width | Key Changes |
|------|-------|-------------|
| Default | <640px | 모바일 기본, Hero `text-4xl`, Result Ball 소형 |
| `sm` | 640px | Hero `text-5xl`, Result Ball 확대, DrawButton 그대로 |

`md`, `lg`, `xl` 브레이크포인트는 현재 사용하지 않음 — 단일 컬럼 레이아웃이 모든 크기에서 동작.

### Responsive Sizing

| Element | Mobile | sm (640px+) |
|---------|--------|-------------|
| Hero Title | `text-4xl` | `text-5xl` |
| Result Ball (1-3) | `min-w-32 h-32` | `min-w-40 h-40` |
| Result Ball (4-9) | `min-w-20 h-20` | `min-w-24 h-24` |
| Result Ball (10+) | `min-w-14 h-14` | `min-w-16 h-16` |
| Result Text (1-3) | `text-5xl` | `text-7xl` |
| Dialog | full width | `max-w-md` |

### Touch Targets
- DrawButton: 최소 96px (sm), 기본 160px (lg) — 충분한 터치 영역
- ThemeSelector: 40x40px
- HistoryItem restore: 44x44px 최소 (WCAG 2.1)
- Button sm: h-8 (32px), Button default: h-9 (36px), Button lg: h-10 (40px)

### Viewport & PWA
- `100dvh` 사용 — iOS Safari 동적 뷰포트 대응
- `overscroll-behavior: none` — 모바일 pull-to-refresh 방지
- `env(safe-area-inset-*)` — 노치/홈 인디케이터 대응
- Initial phase: `h-dvh overflow-hidden` (스크롤 불가)
- Other phases: `min-h-dvh` (콘텐츠에 따라 스크롤 가능)

## 9. Agent Prompt Guide

### Quick Color Reference

```
Background:       bg-background        (white / near-black)
Text:             text-foreground       (near-black / near-white)
Muted text:       text-muted-foreground (gray)
Primary (orange): bg-primary            (oklch 0.65 0.19 41 / 0.70 0.19 48)
Primary text:     text-primary-foreground
Secondary:        bg-secondary          (light gray / dark gray)
Accent:           bg-accent             (light orange tint)
Destructive:      bg-destructive        (red)
Border:           border-border         (light gray / 10% white)
```

### Ball Color Sequence
```
Index 0: bg-primary text-primary-foreground      (orange)
Index 1: bg-blue-500 text-white                  (blue)
Index 2: bg-emerald-500 text-white               (green)
Index 3: bg-violet-600 text-white                (violet)
Index 4: bg-rose-500 text-white                  (rose)
```

### Example Component Prompts

- "추첨 결과 볼을 만들어라. `rounded-2xl min-w-32 h-32 shadow-lg font-bold tabular-nums`로 구성. 색상은 `BALL_BG_CLASSES` 배열에서 인덱스 순환. `animate-result-pop`에 `animationDelay: ${index * 80}ms` 적용."

- "상태바를 만들어라. `bg-muted/50 rounded-lg py-3 px-4`. 남은 번호는 `font-semibold tabular-nums`로 표시. 잔여 3개 이하일 때 `text-orange-500 dark:text-orange-400`, 0일 때 `text-destructive`. 진행률 바는 `h-1 bg-border rounded-full` 트랙에 `bg-primary` 필."

- "히스토리 칩을 만들어라. `rounded-full px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium tabular-nums`. 복원 버튼은 `min-w-[44px] min-h-[44px]`로 WCAG 터치 타겟 준수."

- "원형 CTA 버튼을 만들어라. `rounded-full w-40 h-40 bg-primary text-primary-foreground font-bold`. hover 시 `shadow-xl shadow-primary/40 -translate-y-1`, active 시 `scale-95`. 포커스: `focus-visible:ring-4 focus-visible:ring-ring/50`. 애니메이션 중 pulse ring 오버레이 표시."

- "설정 다이얼로그를 만들어라. `sm:max-w-md`. 프리셋 칩은 `rounded-full`로 active/inactive 토글. NumberInput + Switch 조합. 하단에 `w-full` 확인 버튼."

### Animation Reference

| Name | Keyframes | Duration | Easing | Use |
|------|-----------|----------|--------|-----|
| `number-roll` | translateY + scale | 100ms | ease-out | 추첨 중 숫자 변경 |
| `result-pop` | scale(0→1.1→1) + opacity | 400ms | spring (0.34, 1.56, 0.64, 1) | 결과 볼 등장 |
| `pulse-ring` | scale(1→1.4) + opacity fadeout | 1s | ease-out, infinite | 추첨 중 버튼 링 |
| `fade-in-up` | translateY(20→0) + opacity | 600ms | spring (0.16, 1, 0.3, 1) | 초기 화면 진입 |
| `fade-in` | opacity(0→1) | 400ms | ease-out | 일반 페이드 |
| `breathe` | scale(1→1.02→1) | 4s | ease-in-out, infinite | Ready 상태 강조 |
| `slide-in-bottom` | translateY(30→0) + opacity | 500ms | spring | 하단 요소 진입 |
| `bounce-in` | scale(0.3→1.05→0.9→1) + opacity | 600ms | bounce (0.68, -0.55, 0.265, 1.55) | 탄성 등장 |

**Staggered Delays:** `delay-100` ~ `delay-500` (100ms 단위), `animate-stagger` (초기 opacity:0)

**Reduced Motion:** `@media (prefers-reduced-motion: reduce)` — 모든 애니메이션을 0.01ms로 축소

### Iteration Guide

1. `bg-background` 표면에서 시작 — light mode가 기본 캔버스
2. 핵심 CTA만 `bg-primary` (오렌지) — 한 화면에 하나
3. 깊이감은 shadow가 아닌 배경색 대비로 (`bg-muted/50`, `bg-secondary`)
4. 숫자는 항상 `tabular-nums font-bold`
5. 상태 전환마다 애니메이션 피드백 제공 (pop, fade, slide)
6. 다크모드는 토큰만 바뀌면 자동 적용 — `dark:` 수동 지정은 최소화
7. 터치 영역 44px 이상 보장 (WCAG 2.1)
8. `dvh` 단위 사용 — `vh` 대신 동적 뷰포트
9. 한국어 UI — 모든 텍스트는 한국어로 작성
10. confetti는 복수 추첨 완료 시에만 (`canvas-confetti` dynamic import)

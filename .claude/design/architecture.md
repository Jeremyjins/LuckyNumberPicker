# 행운번호 추첨기 - 상세 아키텍처 설계

**Version**: 1.0
**Date**: 2026-01-15
**Status**: Approved

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Router 7 Application                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  routes/home.tsx                                                 │
│  └── LotteryMachine (Container Component)                        │
│       │                                                          │
│       ├── State Management Layer                                 │
│       │   └── useLotteryMachine (useReducer-based State Machine) │
│       │                                                          │
│       ├── Animation Layer                                        │
│       │   └── useDrawAnimation (requestAnimationFrame-based)     │
│       │                                                          │
│       └── View Layer                                             │
│           ├── InitialView    → SetupButton                       │
│           ├── SettingsView   → SettingsDialog                    │
│           ├── ReadyView      → DrawButton + StatusBar            │
│           ├── DrawingView    → DrawButton (animating)            │
│           └── ResultView     → ResultDisplay + HistoryList       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  UI Component Library (shadcn/ui - nova style)                   │
│  ├── Dialog, Button, Input, Switch, Badge, Separator            │
│  └── Custom Components: DrawButton, HistoryItem, NumberInput    │
├─────────────────────────────────────────────────────────────────┤
│  Utilities & Types                                               │
│  ├── lib/lottery.ts    → Random number generation               │
│  ├── lib/animation.ts  → Easing functions, timing               │
│  └── types/lottery.ts  → TypeScript interfaces                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. State Machine Design

### 2.1 State Types

```typescript
// types/lottery.ts

export type Phase = 'initial' | 'settings' | 'ready' | 'drawing' | 'result';

export interface Settings {
  startNumber: number;      // default: 1
  endNumber: number;        // default: 12
  drawCount: number;        // default: 1
  allowDuplicates: boolean; // default: false
}

export interface LotteryState {
  phase: Phase;
  settings: Settings;
  settingsOpen: boolean;
  history: number[];
  excludedNumbers: number[];
  currentResult: number[];
  displayNumber: number | null;
  isAnimating: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  startNumber: 1,
  endNumber: 12,
  drawCount: 1,
  allowDuplicates: false,
};

export const INITIAL_STATE: LotteryState = {
  phase: 'initial',
  settings: DEFAULT_SETTINGS,
  settingsOpen: false,
  history: [],
  excludedNumbers: [],
  currentResult: [],
  displayNumber: null,
  isAnimating: false,
};
```

### 2.2 Action Types

```typescript
export type LotteryAction =
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'CONFIRM_SETTINGS' }
  | { type: 'START_DRAW' }
  | { type: 'UPDATE_DISPLAY'; payload: number }
  | { type: 'FINISH_DRAW'; payload: number[] }
  | { type: 'RESTORE_NUMBER'; payload: number }
  | { type: 'DRAW_AGAIN' }
  | { type: 'RESET_ALL' };
```

### 2.3 State Transition Diagram

```
┌─────────┐   OPEN_SETTINGS   ┌──────────┐
│ initial │ ────────────────▶ │ settings │
└─────────┘                   └──────────┘
     ▲                              │
     │                    CONFIRM_SETTINGS
     │                              │
     │                              ▼
     │                        ┌─────────┐
     │     RESET_ALL          │  ready  │◀───────┐
     │◀─────────────────────  └─────────┘        │
     │                              │            │
     │                        START_DRAW         │
     │                              │            │
     │                              ▼            │
     │                        ┌─────────┐   DRAW_AGAIN
     │     RESET_ALL          │ drawing │        │
     │◀─────────────────────  └─────────┘        │
                                    │            │
                             FINISH_DRAW         │
                                    │            │
                                    ▼            │
                              ┌─────────┐        │
                              │ result  │────────┘
                              └─────────┘
```

---

## 3. Component Architecture

### 3.1 File Structure

```
app/
├── routes/
│   └── home.tsx
├── components/
│   ├── lottery/
│   │   ├── LotteryMachine.tsx
│   │   ├── DrawButton.tsx
│   │   ├── ResultDisplay.tsx
│   │   ├── HistoryList.tsx
│   │   ├── HistoryItem.tsx
│   │   └── StatusBar.tsx
│   ├── settings/
│   │   ├── SettingsDialog.tsx
│   │   └── NumberInput.tsx
│   └── ui/
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── switch.tsx
│       ├── badge.tsx
│       └── separator.tsx
├── hooks/
│   ├── useLotteryMachine.ts
│   ├── useDrawAnimation.ts
│   └── useLocalStorage.ts
├── lib/
│   ├── utils.ts
│   ├── lottery.ts
│   └── animation.ts
└── types/
    └── lottery.ts
```

### 3.2 Component Interfaces

```typescript
// components/lottery/DrawButton.tsx
interface DrawButtonProps {
  variant: 'setup' | 'draw';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isAnimating?: boolean;
  displayNumber?: number | null;
  onClick?: () => void;
}

// components/lottery/ResultDisplay.tsx
interface ResultDisplayProps {
  numbers: number[];
  isVisible: boolean;
}

// components/lottery/HistoryList.tsx
interface HistoryListProps {
  history: number[];
  allowRestore: boolean;
  onRestore: (num: number) => void;
}

// components/lottery/StatusBar.tsx
interface StatusBarProps {
  remainingCount: number;
  totalCount: number;
  allowDuplicates: boolean;
}

// components/settings/SettingsDialog.tsx
interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSettingsChange: (settings: Partial<Settings>) => void;
  onConfirm: () => void;
}

// components/settings/NumberInput.tsx
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}
```

---

## 4. Custom Hooks

### 4.1 useLotteryMachine

```typescript
interface UseLotteryMachineReturn {
  // State
  state: LotteryState;
  phase: Phase;
  settings: Settings;

  // Computed
  remainingCount: number;
  canDraw: boolean;
  totalRange: number;

  // Actions
  openSettings: () => void;
  closeSettings: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  confirmSettings: () => void;
  startDraw: () => void;
  finishDraw: (numbers: number[]) => void;
  updateDisplay: (num: number) => void;
  restoreNumber: (num: number) => void;
  drawAgain: () => void;
  resetAll: () => void;
}
```

### 4.2 useDrawAnimation

```typescript
interface UseDrawAnimationOptions {
  startNumber: number;
  endNumber: number;
  excludedNumbers: number[];
  drawCount: number;
  duration?: number;
  onTick?: (currentNumber: number) => void;
  onComplete?: (finalNumbers: number[]) => void;
}

interface UseDrawAnimationReturn {
  isAnimating: boolean;
  currentDisplay: number | null;
  start: () => void;
  stop: () => void;
}
```

---

## 5. Animation System

### 5.1 Timeline Configuration

```typescript
const ANIMATION_CONFIG = {
  totalDuration: 2000,  // 2 seconds
  tickSchedule: [
    // [elapsed_ms, interval_ms]
    [0, 50],      // 0-500ms: fast (50ms interval)
    [500, 100],   // 500-1200ms: medium (100ms)
    [1200, 200],  // 1200-1700ms: slow (200ms)
    [1700, 400],  // 1700-2000ms: slowest (400ms)
  ],
};
```

### 5.2 Easing Functions

```typescript
// lib/animation.ts
export const easings = {
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
};
```

### 5.3 CSS Animations

```css
/* app.css additions */

@keyframes number-roll {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.05); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes result-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 var(--primary); }
  100% { box-shadow: 0 0 0 20px transparent; }
}

.animate-number-roll {
  animation: number-roll 100ms ease-out;
}

.animate-result-pop {
  animation: result-pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-pulse-ring {
  animation: pulse-ring 1s ease-out infinite;
}
```

---

## 6. UI Layout Specification

### 6.1 Mobile Layout (Primary)

```
┌─────────────────────────────────────┐
│         Safe Area Top (env)         │
├─────────────────────────────────────┤
│  StatusBar                    48px  │
│  ┌─────────────────────────────┐    │
│  │ 남은 번호: 10/12개          │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│                                     │
│         Main Area (flex-1)          │
│                                     │
│    ResultDisplay (when visible)     │
│    ┌───────────────────────┐        │
│    │        「 7 」         │        │  72px font
│    └───────────────────────┘        │
│                                     │
│         DrawButton                  │
│    ┌───────────────────────┐        │
│    │                       │        │
│    │      추첨하기          │        │  160x160px
│    │                       │        │
│    └───────────────────────┘        │
│                                     │
├─────────────────────────────────────┤
│  HistoryList               ~100px   │
│  ┌─────────────────────────────┐    │
│  │ [3][7][11]...  (scroll-x)  │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  Footer Actions              64px   │
│  ┌─────────────────────────────┐    │
│  │      [다시설정하기]         │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│       Safe Area Bottom (env)        │
└─────────────────────────────────────┘
```

### 6.2 Responsive Breakpoints

```css
/* Mobile first */
.container {
  @apply w-full px-4;
}

/* Tablet+ */
@screen md {
  .container {
    @apply max-w-md mx-auto;
  }
}
```

---

## 7. Data Flow

```
User Interaction          Action Dispatch         State Update           UI Render
─────────────────────────────────────────────────────────────────────────────────────

[세팅하기 Click]
       │
       └──────────────▶ OPEN_SETTINGS ──────▶ settingsOpen: true ──▶ Dialog opens
                                              phase: 'settings'

[설정 변경]
       │
       └──────────────▶ UPDATE_SETTINGS ────▶ settings: {...} ─────▶ Input updates

[완료 Click]
       │
       └──────────────▶ CONFIRM_SETTINGS ───▶ settingsOpen: false ─▶ Dialog closes
                                              phase: 'ready'         Button ready

[추첨하기 Click]
       │
       └──────────────▶ START_DRAW ─────────▶ isAnimating: true ───▶ Animation starts
                              │               phase: 'drawing'
                              │
                              ▼
                       Animation Loop
                       (2 seconds)
                              │
                              ├──▶ UPDATE_DISPLAY ──▶ displayNumber ──▶ Number rolls
                              │    (repeated)
                              │
                              └──▶ FINISH_DRAW ─────▶ currentResult ──▶ Result shows
                                                      history updated
                                                      phase: 'result'

[다시 추첨하기]
       │
       └──────────────▶ DRAW_AGAIN ─────────▶ phase: 'ready' ──────▶ Ready for draw
                                              currentResult: []

[히스토리 X Click]
       │
       └──────────────▶ RESTORE_NUMBER ─────▶ excludedNumbers ─────▶ Count updates
                                              (number removed)

[다시설정하기]
       │
       └──────────────▶ RESET_ALL ──────────▶ INITIAL_STATE ───────▶ Initial screen
```

---

## 8. Implementation Plan

### Phase 1: Foundation
1. Create `types/lottery.ts` - Type definitions
2. Create `lib/lottery.ts` - Random number utilities
3. Create `lib/animation.ts` - Animation utilities

### Phase 2: State Management
4. Create `hooks/useLotteryMachine.ts` - State machine
5. Create `hooks/useDrawAnimation.ts` - Animation controller

### Phase 3: UI Components (shadcn/ui)
6. Install shadcn/ui: `dialog`, `button`, `input`, `switch`, `badge`
7. Create `components/settings/NumberInput.tsx`
8. Create `components/settings/SettingsDialog.tsx`

### Phase 4: Lottery Components
9. Create `components/lottery/StatusBar.tsx`
10. Create `components/lottery/DrawButton.tsx`
11. Create `components/lottery/ResultDisplay.tsx`
12. Create `components/lottery/HistoryItem.tsx`
13. Create `components/lottery/HistoryList.tsx`
14. Create `components/lottery/LotteryMachine.tsx`

### Phase 5: Integration
15. Update `routes/home.tsx` - Main page
16. Update `app.css` - Custom animations
17. Testing & refinement

---

## 9. Dependencies

### Required (Already Installed)
- react ^19.1.1
- react-dom ^19.1.1
- react-router ^7.10.0
- tailwindcss ^4.1.13
- tw-animate-css ^1.4.0
- lucide-react ^0.562.0
- class-variance-authority ^0.7.1
- clsx ^2.1.1
- tailwind-merge ^3.4.0

### To Install (shadcn/ui components)
```bash
npx shadcn@latest add dialog button input switch badge separator
```

### No Additional Dependencies Required
- Animation: Pure CSS + requestAnimationFrame
- State Management: React useReducer
- Icons: lucide-react (already installed)

---

## 10. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Management | useReducer | Sufficient for app complexity, no external lib needed |
| Animation | CSS + rAF | Performance, no heavy dependencies |
| UI Framework | shadcn/ui | Already configured, consistent design |
| Styling | Tailwind CSS | Already configured, mobile-first |
| Icon Library | hugeicons | Already configured in components.json |

---

## Appendix: Settings Dialog UI

```
┌─────────────────────────────────────┐
│  설정                         [X]   │
├─────────────────────────────────────┤
│                                     │
│  시작 번호                          │
│  ┌─────────────────────────────┐    │
│  │ [-]        1          [+]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  종료 번호                          │
│  ┌─────────────────────────────┐    │
│  │ [-]       12          [+]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  추첨 개수                          │
│  ┌─────────────────────────────┐    │
│  │ [-]        1          [+]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  중복 허용                          │
│  ○ 제외 (기본)    ○ 허용           │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         설정 완료            │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

# 행운번호 추첨기 - 구현 계획

**Version**: 1.0
**Date**: 2026-01-15

---

## Implementation Phases

### Phase 1: Foundation (Types & Utilities)

| # | Task | File | Priority |
|---|------|------|----------|
| 1.1 | Type definitions | `app/types/lottery.ts` | P0 |
| 1.2 | Random number utilities | `app/lib/lottery.ts` | P0 |
| 1.3 | Animation utilities | `app/lib/animation.ts` | P0 |

**Deliverables:**
- All TypeScript interfaces
- `getRandomNumber()`, `getRandomNumbers()` functions
- Easing functions, animation timeline generator

---

### Phase 2: State Management (Hooks)

| # | Task | File | Priority |
|---|------|------|----------|
| 2.1 | Main state machine | `app/hooks/useLotteryMachine.ts` | P0 |
| 2.2 | Animation controller | `app/hooks/useDrawAnimation.ts` | P0 |
| 2.3 | LocalStorage sync (optional) | `app/hooks/useLocalStorage.ts` | P2 |

**Deliverables:**
- `useLotteryMachine` hook with all actions
- `useDrawAnimation` hook with 2s animation logic

---

### Phase 3: UI Components (shadcn/ui)

| # | Task | Command/File | Priority |
|---|------|--------------|----------|
| 3.1 | Install shadcn components | `npx shadcn@latest add dialog button input switch badge separator` | P0 |
| 3.2 | NumberInput component | `app/components/settings/NumberInput.tsx` | P0 |
| 3.3 | SettingsDialog component | `app/components/settings/SettingsDialog.tsx` | P0 |

**Deliverables:**
- shadcn/ui components installed
- Custom NumberInput with +/- buttons
- Settings dialog with all options

---

### Phase 4: Lottery Components

| # | Task | File | Priority |
|---|------|------|----------|
| 4.1 | StatusBar | `app/components/lottery/StatusBar.tsx` | P1 |
| 4.2 | DrawButton | `app/components/lottery/DrawButton.tsx` | P0 |
| 4.3 | ResultDisplay | `app/components/lottery/ResultDisplay.tsx` | P0 |
| 4.4 | HistoryItem | `app/components/lottery/HistoryItem.tsx` | P1 |
| 4.5 | HistoryList | `app/components/lottery/HistoryList.tsx` | P1 |
| 4.6 | LotteryMachine (Container) | `app/components/lottery/LotteryMachine.tsx` | P0 |

**Deliverables:**
- All lottery components with proper interfaces
- DrawButton with animation display
- History with restore functionality

---

### Phase 5: Integration & Polish

| # | Task | File | Priority |
|---|------|------|----------|
| 5.1 | Update main page | `app/routes/home.tsx` | P0 |
| 5.2 | Add custom animations | `app/app.css` | P1 |
| 5.3 | Mobile optimization | Various | P1 |
| 5.4 | Dark mode testing | - | P2 |
| 5.5 | Accessibility audit | - | P2 |

---

## File Creation Order

```
1.  app/types/lottery.ts
2.  app/lib/lottery.ts
3.  app/lib/animation.ts
4.  app/hooks/useLotteryMachine.ts
5.  app/hooks/useDrawAnimation.ts
6.  [shadcn/ui components via CLI]
7.  app/components/settings/NumberInput.tsx
8.  app/components/settings/SettingsDialog.tsx
9.  app/components/lottery/StatusBar.tsx
10. app/components/lottery/DrawButton.tsx
11. app/components/lottery/ResultDisplay.tsx
12. app/components/lottery/HistoryItem.tsx
13. app/components/lottery/HistoryList.tsx
14. app/components/lottery/LotteryMachine.tsx
15. app/routes/home.tsx (update)
16. app/app.css (update)
```

---

## Code Templates

### 1. types/lottery.ts

```typescript
export type Phase = 'initial' | 'settings' | 'ready' | 'drawing' | 'result';

export interface Settings {
  startNumber: number;
  endNumber: number;
  drawCount: number;
  allowDuplicates: boolean;
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

### 2. lib/lottery.ts

```typescript
export function getAvailableNumbers(
  start: number,
  end: number,
  excluded: number[] = []
): number[] {
  const available: number[] = [];
  for (let i = start; i <= end; i++) {
    if (!excluded.includes(i)) {
      available.push(i);
    }
  }
  return available;
}

export function getRandomNumber(
  start: number,
  end: number,
  excluded: number[] = []
): number | null {
  const available = getAvailableNumbers(start, end, excluded);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function getRandomNumbers(
  start: number,
  end: number,
  count: number,
  excluded: number[] = [],
  allowDuplicates: boolean = false
): number[] {
  const result: number[] = [];
  const tempExcluded = [...excluded];

  for (let i = 0; i < count; i++) {
    const num = getRandomNumber(start, end, allowDuplicates ? [] : tempExcluded);
    if (num === null) break;
    result.push(num);
    if (!allowDuplicates) {
      tempExcluded.push(num);
    }
  }

  return result;
}
```

### 3. lib/animation.ts

```typescript
export const easings = {
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
  easeOutExpo: (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  linear: (t: number): number => t,
};

export interface AnimationSchedule {
  timestamps: number[];
  totalDuration: number;
}

export function generateAnimationSchedule(
  duration: number = 2000,
  easing: (t: number) => number = easings.easeOutQuart
): AnimationSchedule {
  const timestamps: number[] = [];
  const minInterval = 50;
  const maxInterval = 400;
  let elapsed = 0;

  while (elapsed < duration) {
    timestamps.push(elapsed);
    const progress = elapsed / duration;
    const easedProgress = easing(progress);
    const interval = minInterval + (maxInterval - minInterval) * easedProgress;
    elapsed += interval;
  }

  timestamps.push(duration);
  return { timestamps, totalDuration: duration };
}
```

---

## Validation Checklist

### Functional Requirements
- [ ] Settings dialog opens on initial button click
- [ ] All settings inputs work correctly
- [ ] Draw animation runs for ~2 seconds
- [ ] Random numbers are correctly generated
- [ ] History shows all drawn numbers
- [ ] X button restores numbers (when duplicates excluded)
- [ ] Remaining count updates correctly
- [ ] Reset clears all state

### UI/UX Requirements
- [ ] Mobile-first responsive design
- [ ] Touch-friendly button sizes (min 44px)
- [ ] Smooth animations
- [ ] Dark mode support
- [ ] Safe area handling

### Edge Cases
- [ ] Start > End validation
- [ ] Draw count > available numbers
- [ ] Zero remaining numbers
- [ ] Multiple rapid clicks prevention

---

## Commands Reference

```bash
# Install shadcn/ui components
npx shadcn@latest add dialog button input switch badge separator

# Run development server
npm run dev

# Type checking
npm run typecheck

# Build
npm run build
```

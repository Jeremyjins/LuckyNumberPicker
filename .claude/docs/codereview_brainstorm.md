# Code Review Brainstorming Report

## 1. Overall Code Quality Assessment
- **Score: 7.5/10**
- **Strengths:**
  - Clean separation of concerns: pure logic in `lib/`, state in `hooks/`, rendering in `components/`
  - Well-typed with TypeScript throughout; zero `any` usage detected
  - Consistent Korean-language JSDoc comments on all interfaces and key functions
  - useReducer-based state machine is a solid architectural choice for this complexity level
  - Good use of `useCallback` and `useMemo` in the state machine hook
  - Accessible: `aria-label` props on interactive elements, `type="button"` on buttons
  - SSR-safe guards (`typeof window === 'undefined'`) in theme and sound hooks

- **Weaknesses:**
  - `useSound` hook is defined but never imported/used anywhere in the app; sound is managed via direct `lib/sound` imports in `LotteryMachine.tsx`
  - `LotteryMachine.tsx` is a 262-line orchestrator that handles too many concerns
  - `useDrawAnimation` has a stale closure risk in `start` callback
  - No tests exist despite full Vitest + RTL infrastructure being configured
  - Performance concern in `lib/lottery.ts` with `Array.includes()` on excluded numbers
  - `onOpenChange` prop type mismatch between SettingsDialog signature and usage

## 2. Architecture & Patterns

### State Machine Pattern Review
The `useLotteryMachine` hook implements a clean reducer-based state machine with 10 action types covering the full lifecycle: `OPEN_SETTINGS -> CONFIRM_SETTINGS -> START_DRAW -> UPDATE_DISPLAY -> FINISH_DRAW -> DRAW_AGAIN` (and `RESET_ALL`). State transitions are predictable and well-guarded (e.g., `CONFIRM_SETTINGS` validates before transitioning).

**Issue:** The reducer's `default` case (line 108 of `useLotteryMachine.ts`) silently returns current state. This is fine but could mask typos in action types. A discriminated union + exhaustive switch with `never` would be stronger.

### Hook Composition Quality
- **Good:** `useLotteryMachine` -> `useDrawAnimation` composition in `LotteryMachine.tsx` is clean
- **Issue:** `useSound` hook exists (`app/hooks/useSound.ts`) but is completely unused. `LotteryMachine.tsx` imports `playTick` and `playSuccess` directly from `lib/sound.ts` (lines 13, 46, 56). The `settings.soundEnabled` check is done manually instead of leveraging the hook's built-in gating. This is dead code and an architectural inconsistency.

### Pure Logic Separation Assessment
Excellent. `lib/lottery.ts` contains all randomization logic, `lib/animation.ts` handles scheduling, `lib/sound.ts` handles Web Audio API. None of these depend on React.

### Component Hierarchy Analysis
```
Home (route) -> LotteryMachine (orchestrator)
  -> ThemeSelector
  -> SettingsDialog -> NumberInput
  -> StatusBar
  -> DrawButton
  -> ResultDisplay
  -> HistoryList -> HistoryItem
```
The hierarchy is flat and reasonable. No deep nesting. `LotteryMachine` acts as a single orchestrator, which keeps things simple but makes it the largest file.

## 3. React Best Practices

### useCallback/useMemo Usage
- **useLotteryMachine.ts:** All 10 action dispatchers are wrapped in `useCallback` with empty deps (correct, since `dispatch` is stable). Three computed values use `useMemo` with correct dependency arrays. This is textbook.
- **LotteryMachine.tsx:** `handleTick` and `handleAnimationComplete` are correctly memoized.
- **handleSetupClick** (line 85-87): Wrapping `openSettings` in another `useCallback` is unnecessary since `openSettings` is already a stable callback. Minor over-memoization.

### Effect Usage Correctness
- **useDrawAnimation.ts line 140-146:** Cleanup effect for animation cancellation on unmount is correct.
- **useTheme.ts line 105-111:** Mount-time sync effect is correct. System theme media query listener (line 114-130) properly cleans up.
- **useSound.ts line 37-39:** `enabledRef` sync effect is correct but could be simplified by assigning ref directly in the callback body rather than using an effect.

### Ref Patterns
- **useDrawAnimation.ts lines 63-64:** `optionsRef.current = options` pattern for avoiding stale closures is a known pattern, but it's assigned during render which is technically a side effect during render. In React 19 strict mode this should be fine but is worth noting.

### Key Prop Usage
- **ResultDisplay.tsx line 77:** `key={`${num}-${index}`}` - Uses number+index as key. If duplicates are allowed, two identical numbers would get different keys (correct due to index). Acceptable.
- **HistoryList.tsx line 42:** Same `key={`${num}-${index}`}` pattern. However, when `RESTORE_NUMBER` removes a number from history (line 92 of useLotteryMachine.ts), it uses `filter(n => n !== action.payload)` which removes ALL occurrences of that number. If the same number appears twice in history (duplicates mode off shouldn't allow this, but still), this could remove more than intended.

### Stale Closure Risks
- **useDrawAnimation.ts `start` callback (line 66-128):** This has `isAnimating` in the dependency array (line 119), and also captures `startNumber`, `endNumber`, `excludedNumbers`, `drawCount`, `allowDuplicates`, `onTick`, `onComplete` as deps. The `onTick` and `onComplete` callbacks are accessed via `optionsRef.current` inside the animation (lines 107, 115), which avoids stale closures for those. However, the `start` function itself captures `startNumber`, `endNumber`, etc. at call time for `getRandomNumbers` (line 71-77), while the animation ticks use `optionsRef.current` (lines 97-98). This means the final numbers are calculated with the values at `start()` invocation time, but animation display numbers use potentially updated values. This is likely intentional but creates a subtle inconsistency.

## 4. TypeScript Quality

### Type Safety Assessment
- **Excellent:** All interfaces are properly defined with JSDoc. Union types for `Phase` and `LotteryAction` are well-structured.
- **No `any` or `unknown` usage** detected across the entire codebase.
- The discriminated union `LotteryAction` properly covers all action types.

### Generic Usage Opportunities
- `getAvailableNumbers` and `getRandomNumbers` could potentially be generic over the number type, but given this is specifically a number lottery app, the concrete types are appropriate.

### Minor Type Issues
- **SettingsDialog.tsx line 19:** `onOpenChange: (open: boolean) => void` accepts a boolean, but in `LotteryMachine.tsx` line 118, it's passed `closeSettings` which is `() => void`. The Dialog component calls `onOpenChange(false)`, which calls `closeSettings()` - the boolean argument is silently ignored. This works in JavaScript/TypeScript but is a type-level lie. The `closeSettings` function signature doesn't match the expected `(open: boolean) => void`.
- **validateSettings** (line 103 of `lottery.ts`): Uses an inline object type `{ startNumber: number; endNumber: number; drawCount: number }` rather than `Pick<Settings, 'startNumber' | 'endNumber' | 'drawCount'>`. The inline type works but duplicates the Settings shape.

## 5. Component-by-Component Review

### LotteryMachine.tsx (Orchestrator)
- **Complexity:** 262 lines. Manages state machine, animation, sound, and phase-based rendering. This is the "god component" risk.
- **Decomposition opportunities:**
  1. Extract a `useDrawWithSound` hook that composes `useDrawAnimation` + sound logic (lines 42-76)
  2. Extract the hero/initial section (lines 152-176) into a `HeroSection` component
  3. Extract the footer (lines 231-258) into a `Footer` component
- **Sound management inconsistency:** Directly imports from `lib/sound.ts` (line 13) instead of using the `useSound` hook. The `settings.soundEnabled` check (lines 45, 55) duplicates what `useSound` already handles internally via `enabledRef`.

### useLotteryMachine.ts (State Machine)
- **Reducer completeness:** All 10 action types are handled. The `RESTORE_NUMBER` action (line 87-92) uses `filter` which removes ALL matching numbers, not just one occurrence. This could be a bug if the same number appears multiple times in history.
- **State transition correctness:** Generally correct. One concern: `CLOSE_SETTINGS` (line 23-28) transitions to `'result'` if `history.length > 0`, but doesn't check if settings were actually changed. If settings were changed and then the dialog closed (without confirming), the old settings remain but the phase goes to 'result' with potentially stale history.
- **Return type:** `UseLotteryMachineReturn` (line 116-144) is explicitly defined and comprehensive. Good practice.

### useDrawAnimation.ts
- **Animation lifecycle:** Clean start/stop with `cancelRef`. Final numbers are pre-computed before animation starts (line 71-77), which is correct.
- **Cleanup:** Proper unmount cleanup (line 140-146).
- **Duplicate state:** Both `useDrawAnimation` and `useLotteryMachine` track `isAnimating` and `displayNumber` independently. The animation hook has its own `isAnimating` state (line 56), while the machine has `state.isAnimating` set via `START_DRAW`/`FINISH_DRAW`. These could drift out of sync.

### useTheme.ts
- **SSR safety:** Properly handles SSR with `typeof window === 'undefined'` checks.
- **Hydration:** Initial state is `'system'`/`'light'` (lines 82-83), then synced in useEffect. This means a brief flash of light theme before the stored theme kicks in. Consider using a `<script>` tag in the HTML head to set the class before React hydrates.
- **System theme listener:** Properly adds/removes event listener with cleanup.

### useSound.ts (DEAD CODE)
- This hook is never imported anywhere in the app. It's well-written (ref-based gating to avoid stale closures, localStorage persistence), but it duplicates functionality that `LotteryMachine.tsx` does manually.

### SettingsDialog.tsx
- **Auto-swap logic** (lines 47-61): Nice UX - when start > end, they swap. However, the swap is unidirectional; there's no clamping of `drawCount` when the range shrinks after a swap.
- **Validation:** Runs `validateSettings` on every render (line 38). This is fine for the current settings shape, but could memoize if validation becomes expensive.
- **onOpenAutoFocus prevention** (line 70): Good mobile UX consideration.

### DrawButton.tsx
- Clean component with clear variant/size patterns.
- **Accessibility:** Has `aria-label` for both variants.

### ResultDisplay.tsx
- **Responsive sizing:** `getResultSize` function (line 18-43) handles 1-3, 4-9, 10+ numbers with different sizes. Good responsive design.
- **Animation delay** (line 87-88): Per-item stagger delay is a nice touch.

### NumberInput.tsx
- **Input validation** (line 51-57): Clamps value to min/max range. Good.
- **Spin button removal** (line 92): CSS to hide native number input spinners. Good cross-browser approach.

### StatusBar.tsx, HistoryList.tsx, HistoryItem.tsx
- Small, focused components. No issues.

## 6. Code Smells & Technical Debt

| Severity | Location | Issue |
|----------|----------|-------|
| **High** | `app/hooks/useSound.ts` | Dead code - hook is defined but never used anywhere |
| **High** | `app/lib/lottery.ts:18` | `excluded.includes(i)` is O(n) per iteration; for large ranges with many exclusions, `getAvailableNumbers` becomes O(n*m). Should use a `Set` for excluded numbers |
| **Medium** | `LotteryMachine.tsx:13` | Direct `lib/sound` import bypasses the `useSound` hook pattern; sound enabled check duplicated manually |
| **Medium** | `useDrawAnimation.ts` + `useLotteryMachine.ts` | Duplicate `isAnimating`/`displayNumber` state tracked in both hooks independently |
| **Medium** | `useLotteryMachine.ts:87-92` | `RESTORE_NUMBER` uses `filter(n => n !== payload)` removing ALL occurrences, not just one |
| **Medium** | `useLotteryMachine.ts:23-28` | `CLOSE_SETTINGS` doesn't revert uncommitted setting changes; partial settings edits persist in state |
| **Low** | `LotteryMachine.tsx:85-87` | `handleSetupClick` is an unnecessary wrapper around the already-stable `openSettings` callback |
| **Low** | `home.tsx:8` | Viewport meta tag in `meta()` function is deprecated; should be in root layout or HTML head |
| **Low** | `lottery.ts:103` | `validateSettings` uses inline type instead of `Pick<Settings, ...>` |
| **Low** | `useTheme.ts` | Potential flash of incorrect theme on hydration (SSR renders 'light', then effect switches) |

### Missing Error Handling
- `getRandomNumbers` silently returns fewer numbers than requested if the pool is exhausted (line 54 of `lottery.ts`). Callers don't check for partial results.
- `useDrawAnimation.ts` line 79-82: If `finalNumbers` is empty, `onComplete?.([])` is called but `isAnimating` is never set to `true` then `false`, so the machine's `START_DRAW` action may already have set `isAnimating: true` without a corresponding `FINISH_DRAW`.

### Inconsistencies
- `useSound` hook manages its own `localStorage` key `'sound-enabled'`, but the sound enabled state is also part of `Settings` in the reducer (`settings.soundEnabled`). Two sources of truth for the same concept.
- `ANIMATION_CONFIG.minInterval` and `maxInterval` are defined but not used by `generateAnimationSchedule`, which has its own hardcoded values (lines 32-33 of `animation.ts`).

## 7. Testing Strategy Recommendations

### Priority Order (What to Test First)

1. **P0 - `app/lib/lottery.ts`** (Pure functions, highest value, easiest to test)
   - `getAvailableNumbers`: edge cases (empty range, all excluded, overlapping)
   - `getRandomNumbers`: count accuracy, duplicate handling, exhaustion
   - `validateSettings`: all validation branches
   - `canDraw` and `getRemainingCount`: with/without duplicates

2. **P0 - `app/lib/animation.ts`** (Pure functions)
   - `generateAnimationSchedule`: timestamp generation, easing effects
   - `runAnimation`: tick ordering, completion callback, cancellation

3. **P1 - `app/hooks/useLotteryMachine.ts`** (Reducer logic)
   - Test `lotteryReducer` directly (export it or test via hook)
   - All state transitions: OPEN_SETTINGS, CONFIRM_SETTINGS, START_DRAW, FINISH_DRAW, etc.
   - Edge cases: RESTORE_NUMBER with duplicate values, CLOSE_SETTINGS with/without history

4. **P1 - `app/components/settings/SettingsDialog.tsx`**
   - Number swap behavior
   - Validation error display
   - Confirm button disabled state

5. **P2 - `app/components/lottery/LotteryMachine.tsx`**
   - Integration test: full flow from initial -> settings -> ready -> draw -> result
   - Phase-based rendering (what's visible in each phase)

6. **P2 - `app/hooks/useDrawAnimation.ts`**
   - Mock `requestAnimationFrame` to test animation lifecycle
   - Cancellation behavior

7. **P3 - Remaining components** (ResultDisplay, HistoryList, etc.)
   - Snapshot/render tests
   - Interaction tests (restore button click)

### Test Patterns for This Codebase
- **Pure lib functions:** Direct unit tests with `describe`/`it` blocks
- **Reducer:** Import reducer function, test `(state, action) => newState` directly
- **Hooks:** Use `@testing-library/react`'s `renderHook`
- **Components:** Use RTL's `render` + `screen` queries + `userEvent`
- **Animation:** Mock `requestAnimationFrame` with `vi.useFakeTimers()`

### Coverage Targets
The `vitest.config.ts` already sets thresholds at 80% lines/functions/statements and 70% branches. These are reasonable starting targets. Focus on lib/ and hooks/ first since they contain all business logic.

## 8. Refactoring Suggestions

| Priority | File | Issue | Suggestion |
|----------|------|-------|------------|
| P0 | `app/hooks/useSound.ts` | Dead code, never imported | Either integrate `useSound` into `LotteryMachine.tsx` replacing direct `lib/sound` imports, or delete the hook entirely |
| P0 | `app/lib/lottery.ts:18` | O(n*m) performance with `Array.includes` in loop | Convert `excluded` to a `Set<number>` for O(1) lookups: `const excludedSet = new Set(excluded)` |
| P1 | `app/components/lottery/LotteryMachine.tsx` | 262 lines, manages sound + animation + state + rendering | Extract `useDrawWithSound` hook composing `useDrawAnimation` + sound; extract `HeroSection` and `Footer` sub-components |
| P1 | `useLotteryMachine.ts:87-92` | `RESTORE_NUMBER` removes ALL occurrences of a number | Use `findIndex` + `splice` pattern to remove only the first occurrence |
| P1 | Duplicate `isAnimating` state | Both `useDrawAnimation` and `useLotteryMachine` track animation state independently | Remove `isAnimating` from the reducer state; use the animation hook's `isAnimating` as single source of truth |
| P2 | `app/lib/animation.ts:32-33` | `minInterval`/`maxInterval` hardcoded, duplicating `ANIMATION_CONFIG` constants | Use `ANIMATION_CONFIG.minInterval` and `.maxInterval` inside `generateAnimationSchedule` |
| P2 | `useLotteryMachine.ts:23-28` | `CLOSE_SETTINGS` doesn't revert uncommitted edits | Store a `pendingSettings` copy on `OPEN_SETTINGS`; revert to it on `CLOSE_SETTINGS` |
| P2 | `app/hooks/useTheme.ts` | Flash of light theme before stored theme applies | Add inline `<script>` in document head to apply theme class before hydration |
| P3 | `home.tsx:8` | Viewport meta in route `meta()` | Move viewport meta to root `<head>` in the document layout |
| P3 | `app/components/lottery/LotteryMachine.tsx:85-87` | Unnecessary `handleSetupClick` wrapper | Replace with direct `onClick={openSettings}` |

## File Ownership
This agent owns analysis of:
- Code quality of all source files
- Pattern consistency across codebase
- TypeScript type quality
- Testing strategy

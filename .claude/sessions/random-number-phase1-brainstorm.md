# Session: random-number-phase1-brainstorm

**Date**: 2026-01-15
**Description**: 브레인스토밍 완료 - 행운번호 추첨기 프로젝트 기획

---

## Project Context

### Tech Stack
- **Framework**: React 19.1 + React Router 7.10
- **Styling**: Tailwind CSS 4.1 + tw-animate-css
- **UI Library**: shadcn/ui (nova style, orange theme, hugeicons)
- **Deployment**: Cloudflare Workers
- **Utilities**: clsx, tailwind-merge, class-variance-authority

### Project Structure
```
app/
├── routes/home.tsx       # Main page
├── welcome/welcome.tsx   # Welcome component
├── lib/utils.ts          # Utilities
└── app.css               # Global styles (dark mode ready)
```

---

## Brainstorm Summary

### Core Features
1. **Number Input**
   - Start number (default: 1)
   - End number (default: 12)
   - Draw count (default: 1)

2. **Options**
   - Exclude duplicates (default: ON)
   - Include duplicates
   - History with X button for restoration

3. **UI Flow**
   - Initial → Settings Dialog → Ready → Drawing (2s animation) → Result

### State Machine Design
```typescript
type Phase = 'initial' | 'settings' | 'ready' | 'drawing' | 'result';

interface LotteryState {
  phase: Phase;
  settings: {
    startNumber: number;
    endNumber: number;
    drawCount: number;
    allowDuplicates: boolean;
  };
  history: number[];
  excludedSet: Set<number>;
  currentResult: number[];
}
```

### Component Architecture
```
components/
├── lottery/
│   ├── LotteryMachine.tsx
│   ├── DrawButton.tsx
│   ├── ResultDisplay.tsx
│   └── HistoryList.tsx
├── settings/
│   ├── SettingsDialog.tsx
│   └── NumberInput.tsx
└── ui/ (shadcn components)
```

### Animation Strategy
- 0-500ms: Fast rolling (50ms interval)
- 500-1500ms: Gradual slowdown (100-200ms)
- 1500-2000ms: Final tension (300ms)
- easeOutQuart curve for natural feel

### Edge Cases
- Start > End: Auto-swap or error
- Draw count > range: Warning + auto-adjust
- Remaining = 0: Disable draw button
- History restoration: Remove from excludedSet

### Implementation Priority
**MVP**: State machine, Settings dialog, 2s animation, History, Counter
**Recommended**: Haptic feedback, localStorage, Dark mode
**Optional**: Sound effects, Confetti, PWA

---

## Required shadcn/ui Components
- Dialog
- Button
- Input
- Switch / ToggleGroup
- Badge
- Separator

---

## Next Steps
1. Install required shadcn/ui components
2. Implement state machine hook (useLotteryMachine)
3. Build Settings Dialog
4. Create Draw Button with animation
5. Implement History List with restoration

---

## Session Metadata
- **Confidence Level**: 0.95 (requirements clear, tech stack confirmed)
- **Blockers**: None
- **Dependencies**: shadcn/ui components need to be added

# 행운번호 추첨기

A modern, animated lottery number picker built with React 19, React Router 7, and Tailwind CSS 4. Deployable to Cloudflare Workers.

## Features

- **Customizable Range**: Set start and end numbers (1-999)
- **Multiple Draws**: Draw 1 or more numbers at once
- **Duplicate Control**: Allow or prevent repeated numbers
- **Smooth Animation**: requestAnimationFrame-based draw animation with easing
- **History Tracking**: View and restore previously drawn numbers
- **Mobile-First Design**: Responsive UI with safe area support
- **Dark Mode**: Automatic theme switching support

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run deploy` | Build and deploy to Cloudflare |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | Type check the project |

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19.1 |
| **Router** | React Router 7.10 |
| **Language** | TypeScript 5.9 |
| **Styling** | Tailwind CSS 4.1 |
| **UI Components** | Radix UI + shadcn/ui |
| **Testing** | Vitest + Testing Library |
| **Deployment** | Cloudflare Workers |

## Architecture

### State Machine

The app uses a 5-phase state machine pattern:

```
┌─────────┐     ┌──────────┐     ┌───────┐     ┌─────────┐     ┌────────┐
│ initial │ ──► │ settings │ ──► │ ready │ ──► │ drawing │ ──► │ result │
└─────────┘     └──────────┘     └───────┘     └─────────┘     └────────┘
     │                                              │               │
     └──────────────────────────────────────────────┴───────────────┘
                              RESET_ALL
```

| Phase | Description |
|-------|-------------|
| `initial` | App startup, shows setup button |
| `settings` | Settings dialog open |
| `ready` | Ready to draw, shows draw button |
| `drawing` | Animation in progress |
| `result` | Shows drawn number(s) |

### Project Structure

```
app/
├── components/
│   ├── lottery/           # Core lottery components
│   │   ├── DrawButton.tsx     # Main action button (setup/draw)
│   │   ├── HistoryItem.tsx    # Single history entry
│   │   ├── HistoryList.tsx    # History container
│   │   ├── LotteryMachine.tsx # Main container component
│   │   ├── ResultDisplay.tsx  # Result presentation
│   │   └── StatusBar.tsx      # Remaining count display
│   ├── settings/          # Settings components
│   │   ├── NumberInput.tsx    # Number input with +/- buttons
│   │   └── SettingsDialog.tsx # Settings modal
│   └── ui/                # Base UI components (shadcn)
├── hooks/
│   ├── useDrawAnimation.ts    # Animation logic
│   └── useLotteryMachine.ts   # State machine
├── lib/
│   ├── animation.ts       # Animation utilities & easing
│   ├── lottery.ts         # Core lottery logic
│   └── utils.ts           # Utility functions
├── types/
│   └── lottery.ts         # TypeScript types
└── routes/
    └── home.tsx           # Main route
```

## Component API

### LotteryMachine

The main container component. No props required.

```tsx
import { LotteryMachine } from '~/components/lottery/LotteryMachine';

export default function Home() {
  return <LotteryMachine />;
}
```

### Settings Interface

```typescript
interface Settings {
  startNumber: number;    // Range start (default: 1)
  endNumber: number;      // Range end (default: 12)
  drawCount: number;      // Numbers per draw (default: 1)
  allowDuplicates: boolean; // Allow repeats (default: false)
}
```

### Hooks

#### useLotteryMachine

State machine hook for lottery logic.

```typescript
const {
  // State
  phase,           // Current phase
  settings,        // Current settings
  history,         // Draw history
  currentResult,   // Latest draw result

  // Computed
  remainingCount,  // Available numbers
  canDrawNow,      // Can perform draw

  // Actions
  openSettings,    // Open settings dialog
  confirmSettings, // Confirm and start
  startDraw,       // Begin draw
  finishDraw,      // Complete with result
  resetAll,        // Reset everything
} = useLotteryMachine();
```

#### useDrawAnimation

Animation hook for the draw sequence.

```typescript
const {
  isAnimating,     // Animation in progress
  currentDisplay,  // Current display number
  start,           // Start animation
  stop,            // Stop animation
} = useDrawAnimation({
  startNumber: 1,
  endNumber: 45,
  excludedNumbers: [],
  drawCount: 1,
  allowDuplicates: false,
  duration: 2000,
  onComplete: (numbers) => console.log(numbers),
});
```

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Coverage

| Metric | Coverage |
|--------|----------|
| Statements | 98.7% |
| Branches | 89.65% |
| Functions | 98.38% |
| Lines | 99.08% |

## Configuration

### Environment Variables

No environment variables required for basic usage.

### Tailwind Configuration

The project uses Tailwind CSS 4 with:
- Custom animations (`pulse-ring`, `number-roll`, `result-pop`)
- Orange primary color theme
- Dark mode support via `class` strategy

### TypeScript Paths

```json
{
  "paths": {
    "~/*": ["./app/*"],
    "@/*": ["./app/*"]
  }
}
```

## Deployment

### Cloudflare Workers

```bash
# Deploy to Cloudflare
npm run deploy
```

Requires `wrangler` CLI authentication:

```bash
npx wrangler login
```

## Security

- Input validation with range limits (1-999)
- Maximum range protection (10,000 numbers)
- XSS prevention via React's built-in escaping
- No external data dependencies

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Private project.

---

Built with React Router starter template and enhanced with shadcn/ui components.

# Frontend Developer Brainstorming Report

## 1. Current UI/UX Assessment

### Visual Design Strengths
- **Warm, cohesive color system**: The oklch-based theme with warm orange/amber primary (hue 41-48) creates a friendly, approachable feel perfect for a "lucky number" app. The dark mode variant is equally well-tuned.
- **Clean typography**: Noto Sans as the base font ensures excellent Korean glyph rendering. `tabular-nums` is correctly applied to all numeric displays for visual stability during animation.
- **Purposeful animation library**: The custom keyframes (number-roll, result-pop, pulse-ring, fade-in-up) each serve a distinct UX purpose. The cubic-bezier curves (e.g., `0.34, 1.56, 0.64, 1` on result-pop) add satisfying overshoot.
- **Progressive disclosure**: The phase-based UI (initial -> settings -> ready -> drawing -> result) naturally guides users through a clear flow. The hero screen is uncluttered and inviting.
- **Mobile-first discipline**: `dvh` units, safe area insets, and fixed viewport handling for the initial state show strong iOS Safari awareness.

### Visual Design Weaknesses
- **Monotone result cards**: The result numbers all use `bg-primary` with no visual differentiation. When multiple numbers are drawn, they look identical -- there is no visual ranking, ordering cue, or color variation.
- **Flat StatusBar**: `bg-muted/50 rounded-lg` is functional but visually uninteresting. It does not communicate the "remaining pool" metaphor effectively. A progress bar or visual gauge would be more intuitive.
- **History section lacks hierarchy**: HistoryList uses simple pill chips with no timestamp, round number, or grouping. After several draws, it becomes a flat sea of identical-looking pills.
- **No visual feedback on phase transitions**: Transitions between phases (e.g., ready -> drawing -> result) happen without intermediate animation. The content simply appears/disappears based on conditional rendering.
- **Footer branding is visually disconnected**: The "SPONSORED BY" + logo block feels tacked on. At 10px font size it is borderline unreadable and the opacity treatment (0.4) makes it look like a rendering bug in some contexts.
- **DrawButton setup vs draw distinction is subtle**: Both use the same circular shape with only color and icon difference. First-time users may not immediately understand the "setup" button opens settings.

### Interaction Design Assessment
- **Sound design is solid**: Web Audio API with progressive pitch (440Hz -> 880Hz) during the tick animation builds tension effectively. The C-E-G arpeggio on success is a nice celebratory touch.
- **Missing haptic feedback**: No Vibration API usage. On mobile devices, haptic feedback during the drawing animation and on result reveal would significantly enhance the physical "lottery machine" feel.
- **NumberInput UX gap**: The +/- stepper buttons work but are slow for large range changes (e.g., setting endNumber to 999). There is no long-press repeat, no 10x step shortcut, and direct input requires careful typing.
- **No confirmation on reset**: `resetAll` immediately wipes all history and returns to initial. This is destructive with no undo or confirmation.
- **Restore semantics are confusing**: The X button on HistoryItem means "restore this number to the pool" but the X icon universally means "delete/remove." This is a semantic mismatch.

---

## 2. Design Improvements

### 2.1 Visual Design

#### Color Scheme Enhancements
- **Result number color variety**: Assign each drawn number a color from the chart palette (chart-1 through chart-5) or use a gradient background. This makes multi-number results visually scannable and more exciting.
- **Numbered badge approach**: Consider using circular badges with gradient backgrounds (like Korean TV lottery shows) instead of rounded rectangles for result display.
- **Ambient background gradient**: Add a subtle radial gradient or gradient mesh to the background that shifts based on phase -- neutral on initial, warm/energetic during drawing, celebratory gold on result.
- **Glass morphism for StatusBar**: Use `backdrop-blur-sm bg-background/80` on the sticky StatusBar to create a frosted glass effect when content scrolls beneath it.

#### Typography Improvements
- **Hero title weight variation**: Use a lighter weight for "행운번호" and a bolder/wider weight for "추첨기" to create visual hierarchy within the title. Consider adding a subtle text-shadow or gradient fill.
- **Result number font**: Consider using a display/mono font for the result numbers to give them a more "lottery board" aesthetic. A font like "Black Han Sans" (Google Fonts, Korean-optimized) would add character.
- **Increase history item font size**: Current `text-sm` (14px) is small for numbers that users might want to reference. Bumping to `text-base` (16px) improves scanability.

#### Spacing/Layout Refinements
- **Increase vertical rhythm**: The `gap-4` (16px) between main content sections feels tight on larger phones. Consider `gap-6` (24px) for the main content area.
- **Result display breathing room**: Add more top/bottom padding around ResultDisplay. Currently it transitions from StatusBar to results with only 16px gap, feeling cramped.
- **History section separator**: Add a subtle `Separator` or border-top above the history section to clearly delineate it from the main content area.

#### Card/Container Design
- **Result cards with inner shadow**: Add `shadow-inner` or a subtle inner gradient to result number containers to give them depth, resembling physical lottery balls.
- **History section card wrapper**: Wrap the entire HistoryList in a `bg-card rounded-xl p-4` container to give it visual containment and importance.
- **DrawButton ring enhancement**: Add a decorative outer ring (border with gradient) around the DrawButton to make it feel more like a physical button. Consider a subtle rotating border animation in the ready state.

#### Micro-interactions
- **Number hover/tap feedback on result**: Each result number should subtly scale on tap (for copying or sharing individual numbers).
- **History item entrance animation**: New history items should slide in or fade in when added, rather than appearing instantly. Use `animate-slide-in-bottom` on new items.
- **Settings toggle haptic-like visual feedback**: When switches toggle, add a brief color flash or ripple effect on the switch track.
- **Button press depth effect**: The current `active:scale-95` is good but could be enhanced with a brief shadow reduction to simulate physical press depth.

### 2.2 Animation Enhancements

#### Drawing Animation Improvements
- **Multi-stage reveal**: For multi-number draws (drawCount > 1), reveal results one at a time with staggered delays rather than all at once. Each number gets its own mini animation cycle -- this builds suspense and is standard in Korean TV lottery shows.
- **Slot machine effect**: Instead of random number flashing in the button, consider a vertical "slot machine" reel effect using CSS `translateY` transitions. Numbers scroll vertically and decelerate to land on the final number.
- **Speed curve refinement**: The current animation schedule uses `generateAnimationSchedule` -- consider an exponential deceleration curve (fast start, dramatic slowdown) rather than linear. The last 3-5 ticks should be noticeably slower to build suspense.
- **Final number bounce**: When the animation completes and transitions to the result, the number should do a bounce-in (scale 0 -> 1.15 -> 0.95 -> 1) rather than a simple pop.

#### Page Transition Animations
- **Phase transition orchestration**: Implement `AnimatePresence`-style exit animations (or manual CSS transitions) so elements fade/slide out before new elements fade/slide in. Currently, conditional rendering causes instant mount/unmount.
- **Hero exit animation**: When leaving initial phase, the hero title and setup button should animate out (fade + scale down) before the ready phase content animates in.
- **Shared layout animation**: The DrawButton exists in both ready and drawing phases -- consider keeping it mounted and animating its content changes rather than re-rendering.

#### Result Celebration Effects
- **Confetti burst**: On result reveal, trigger a lightweight CSS/canvas confetti animation. Libraries like `canvas-confetti` (3KB gzipped) would work, or implement a pure CSS particle burst using pseudo-elements.
- **Glow pulse on result numbers**: After the initial pop animation, add a subtle glow pulse (box-shadow animation) on the result containers that fades out after 2-3 seconds.
- **Background flash**: A brief full-screen radial gradient flash (from primary color, 200ms) on result reveal adds drama.
- **Number counter animation**: Instead of immediately showing the final number, count up/down from the last displayed animation number to the final number with easing.

#### Haptic Feedback (Vibration API)
- **Drawing tick vibration**: `navigator.vibrate(10)` on each tick during the animation -- short, subtle pulses that increase in intensity (duration) as the animation slows.
- **Result reveal vibration**: `navigator.vibrate([50, 30, 100])` pattern on result -- a distinctive "da-da-DAH" pattern.
- **Button press vibration**: `navigator.vibrate(5)` on DrawButton press for tactile confirmation.
- **Implementation note**: Wrap in feature detection: `if ('vibrate' in navigator)`. iOS Safari does not support Vibration API, so this is Android-only but still worth adding.

#### Reduced Motion Support (@prefers-reduced-motion)
- **Critical gap**: There is currently NO `@prefers-reduced-motion` media query anywhere in app.css. This is an accessibility requirement.
- **Implementation**: Add a global rule that disables all custom animations:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .animate-number-roll,
    .animate-result-pop,
    .animate-pulse-ring,
    .animate-fade-in-up,
    .animate-fade-in,
    .animate-float,
    .animate-breathe,
    .animate-slide-in-bottom,
    .animate-bounce-in {
      animation: none !important;
      transition: none !important;
    }
    .animate-stagger {
      opacity: 1 !important;
    }
  }
  ```
- **In JavaScript**: Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in `useDrawAnimation` to skip the tick animation and immediately show the result.

### 2.3 Component Improvements

#### LotteryMachine Decomposition (260 lines)
The component is a monolith that handles all phase rendering. Recommended split:
- **`HeroSection.tsx`**: Extract lines 152-175 (initial phase hero + setup button). Props: `onSetupClick`.
- **`DrawingSection.tsx`**: Extract the ready/drawing phase content (DrawButton + animation display). Props: `canDrawNow`, `isAnimating`, `displayNumber`, `onDraw`.
- **`ResultSection.tsx`**: Extract lines 179-216 (ResultDisplay + draw again button + exhausted message). Props: `currentResult`, `canDrawNow`, `allowDuplicates`, `onDrawAgain`.
- **`LotteryFooter.tsx`**: Extract lines 230-258 (reset button + branding). Props: `showFooter`, `onReset`.
- **`LotteryHeader.tsx`**: Extract lines 124-139 (sticky StatusBar wrapper). Props: `showStatusBar`, `isResult`, status bar props.
- **Benefit**: Each section becomes independently testable, and the main LotteryMachine becomes a ~80-line orchestrator.

#### DrawButton Visual Enhancements
- **Idle breathing animation**: In the `ready` phase, add a subtle `animate-breathe` class to the draw button to draw attention and communicate interactivity.
- **Gradient background**: Replace flat `bg-primary` with a radial gradient (`bg-gradient-to-br from-primary to-primary/80`) for more visual depth.
- **Icon animation**: The Shuffle icon in draw mode could have a continuous subtle rotation animation while in ready state.
- **Loading state**: During animation, show a more visually rich state -- consider a circular progress ring around the button perimeter that fills as the animation progresses.
- **Size responsiveness**: On very small screens (< 360px width), the `w-40 h-40` large size may crowd the layout. Add a responsive size: `lg: 'w-32 h-32 sm:w-40 sm:h-40'`.

#### ResultDisplay Improvements
- **Staggered individual number animation**: Each number should animate in sequence with `animationDelay` (already partially implemented with `${index * 50}ms` but needs a corresponding animation class per item, not just on the container).
- **Number sorting option**: Offer sorted vs. draw-order display toggle. Korean users expect lottery numbers to be shown in ascending order (like Lotto 6/45).
- **Copy to clipboard**: Tap on the result area to copy numbers to clipboard. Show a brief toast: "번호가 복사되었습니다."
- **Visual weight for special numbers**: If the app is used for Korean Lotto-style draws, consider color-coding number ranges (1-10: yellow, 11-20: blue, etc.) like the official Korean Lotto.

#### SettingsDialog UX Improvements
- **Quick preset buttons**: Add preset configurations at the top of the dialog:
  - "로또 (1~45, 6개)" -- Korean Lotto 6/45
  - "제비뽑기 (1~30, 1개)" -- Simple draw
  - "주사위 (1~6, 1개)" -- Dice roll
  - "연회비 (1~12, 1개)" -- Monthly (current default)
- **Long-press repeat on NumberInput**: Holding +/- should auto-repeat with acceleration. Start at 200ms interval, accelerate to 50ms after 1 second.
- **Slider alternative**: For the number range, consider adding a dual-thumb range slider below the number inputs for visual/intuitive range selection.
- **Validation inline**: Show validation errors next to the relevant field, not just at the bottom. Highlight the offending input border in destructive color.
- **Bottom sheet on mobile**: Replace the centered Dialog with a bottom sheet (`vaul` drawer) on mobile for more natural mobile interaction. The current Dialog requires reaching the top of the screen.
- **Animated number transitions**: When +/- buttons change values, the number should do a brief slide-up/slide-down transition rather than an instant change.

#### HistoryList Improvements
- **Grouped by draw round**: Instead of a flat list of individual numbers, group history by draw round. Show "1회차: 7, 23, 45" style grouping with round numbers.
- **Timestamp display**: Show relative time ("방금", "2분 전") for each draw round.
- **Swipe-to-restore**: On mobile, allow swiping a history item to restore it, instead of tapping the small X button.
- **Empty state**: When history is cleared, show a subtle empty state message instead of just hiding the section.
- **Scrollable container**: If history grows long, contain it in a max-height scrollable area rather than growing the page indefinitely.
- **Reverse chronological order**: Ensure newest draws appear at the top/start. Current implementation appends to the array -- verify rendering order.

#### StatusBar Enhancements
- **Visual progress bar**: Add a thin progress bar below the text showing the ratio of drawn/remaining numbers. Use a gradient from primary to destructive as it depletes.
- **Animated count transitions**: When the remaining count changes, animate the number transition (count down effect).
- **Icon indicators**: Add an icon (e.g., a small circle/dot grid) that visually represents remaining numbers, shrinking as numbers are drawn.
- **Contextual color transition**: Smoothly transition the background color from neutral to warm (warning) to destructive as numbers deplete, rather than abrupt color changes at threshold.

#### New Components to Add
- **`Toast/Snackbar`**: For feedback messages (copy confirmation, restore confirmation, error states). Use shadcn/ui's `sonner` or `toast` component.
- **`ConfirmDialog`**: For destructive actions like reset. A simple "정말 다시 설정하시겠습니까?" confirmation.
- **`ShareButton`**: Web Share API integration to share results. Renders as a share icon button in the result phase.
- **`ConfettiOverlay`**: Lightweight confetti animation component triggered on result reveal.
- **`NumberBadge`**: Reusable component for displaying a styled number (used in both ResultDisplay and HistoryItem) with consistent styling and optional color variants.
- **`ProgressRing`**: SVG-based circular progress indicator that can be overlaid on the DrawButton during animation.

---

## 3. PWA UX Considerations

### App-like Navigation Patterns
- **No browser chrome feel**: The app already uses `h-dvh` and safe area handling, which is excellent. Consider adding `overscroll-behavior: none` on the root to prevent pull-to-refresh bounce in Chrome Android and elastic scrolling in Safari.
- **Gesture navigation safety**: Ensure no horizontal swipe gestures conflict with iOS back-swipe. All interactive elements should use vertical or tap gestures only.
- **Bottom-anchored actions**: The primary action (draw button) is well-centered. Consider moving the "다시 설정하기" action to a fixed bottom bar in the result phase for easier thumb reach.

### Splash Screen Design
- **Themed splash**: Ensure the PWA manifest splash screen matches the app's warm color scheme. The splash should show the "행운번호 추첨기" title and a simple icon.
- **Loading skeleton**: If the app has any loading time, show a skeleton screen that matches the initial hero layout rather than a blank screen.

### Install Banner / Prompt UX
- **Custom install prompt**: Intercept the `beforeinstallprompt` event and show a Korean-language custom banner: "홈 화면에 추가하면 더 빠르게 시작할 수 있어요!" at an appropriate moment (e.g., after the first successful draw, not immediately).
- **Dismissible and non-intrusive**: Show as a bottom toast/banner, not a modal. Remember dismissal in localStorage.
- **iOS Add to Home Screen**: Since iOS doesn't fire `beforeinstallprompt`, show a manual instruction tooltip for Safari users: "공유 버튼 > 홈 화면에 추가".

### Offline State UX
- **The app should work fully offline** since all logic is client-side. Ensure the service worker caches all assets.
- **No visible offline indicator needed**: Since this is a standalone calculator-style app with no server dependency, offline mode should be seamless with no indicator needed.
- **Cache font files**: Ensure Noto Sans font files are cached in the service worker for offline use. Consider using `font-display: swap` with a system font fallback.

### Pull-to-Refresh Consideration
- **Disable native pull-to-refresh**: Add `overscroll-behavior-y: contain` to the root to prevent Chrome's pull-to-refresh gesture, which is confusing in a standalone PWA.
- **Custom pull-to-refresh**: Not needed for this app since there is no server data to refresh. Disable it entirely.

### Status Bar Theming
- **`theme-color` meta tag**: Dynamically update the `<meta name="theme-color">` based on the current theme (light: white/light background, dark: the dark background color). This colors the browser/PWA status bar.
- **Phase-based theme color**: Consider changing the theme-color to the primary color during the drawing phase for an immersive effect.
- **Apple status bar**: Add `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` for iOS PWA mode to extend content under the status bar.

---

## 4. Responsive Design

### Current Responsive Approach Assessment
- **Strengths**: Mobile-first with `sm:` breakpoints on ResultDisplay sizes. `dvh` and safe area handling are properly implemented. `flex-wrap` on result display handles multi-number layouts.
- **Gaps**: Only one breakpoint (`sm:`) is used. No `md:`, `lg:`, or `xl:` considerations. The app renders identically on a tablet and a 27" monitor as it does on a phone (just centered with lots of white space).

### Tablet Layout Considerations
- **Max-width container**: Wrap the entire LotteryMachine in a `max-w-lg mx-auto` (or `max-w-md`) container on tablet+ to prevent the layout from stretching too wide. The circular DrawButton and centered layout work well in a constrained column.
- **Larger touch targets**: On tablets, increase DrawButton size to `xl` (e.g., `w-48 h-48`) and increase result number sizes proportionally.
- **Two-column layout option**: On wider tablets, the HistoryList could render beside the main content area rather than below it, reducing vertical scroll.

### Desktop Layout Considerations
- **Centered card layout**: On desktop, render the app as a centered card (`max-w-md mx-auto shadow-2xl rounded-2xl`) with a decorative background pattern or gradient behind it. This "phone frame" approach maintains the mobile-first design while feeling intentional on desktop.
- **Keyboard shortcuts**: On desktop, support `Space` or `Enter` to trigger the draw, `Escape` to close settings. Add `R` for reset.
- **Hover states**: All hover states are already well-implemented (translate-y, shadow changes). The `hover:-translate-y-1` on DrawButton is a nice touch.

### Landscape Mode Handling
- **Critical issue**: In landscape mode on phones, `h-dvh` with centered content may not leave enough room for the DrawButton + footer. The button could be cut off.
- **Solution**: In landscape orientation, reduce vertical padding and button size. Use a media query: `@media (orientation: landscape) and (max-height: 500px)` to apply compact styling.
- **Alternative layout**: In landscape, consider a horizontal layout with DrawButton on one side and StatusBar/results on the other.

---

## 5. Accessibility (a11y) Improvements

### Screen Reader Support
- **Live region for results**: The ResultDisplay should be wrapped in an `aria-live="assertive"` region so screen readers announce drawn numbers immediately: "행운의 번호 7번이 선택되었습니다."
- **Drawing animation announcements**: During animation, use `aria-live="polite"` to periodically announce: "추첨 중..." to keep screen reader users informed.
- **StatusBar as status role**: Add `role="status"` and `aria-live="polite"` to StatusBar so remaining count changes are announced.
- **History list semantics**: The HistoryList should use `role="list"` with `role="listitem"` on each HistoryItem. The restore button needs clearer aria-label: `${number}번을 추첨 풀에 복원` instead of just `${number} 번호 복원`.
- **Phase change announcements**: Use a visually hidden live region to announce phase transitions: "설정이 완료되었습니다. 추첨 준비가 되었습니다."

### Focus Management
- **Post-settings focus**: After closing the settings dialog and entering ready phase, focus should move to the DrawButton. Currently, focus likely returns to the trigger or is lost.
- **Post-result focus**: After draw completes, focus should move to the result display area or the "다시 추첨하기" button.
- **Focus trap in dialog**: Verify that the shadcn Dialog properly traps focus. The `onOpenAutoFocus` prevention may interfere with expected dialog focus behavior.
- **Skip to main content**: Not strictly needed for a single-page app, but ensure tab order is logical: ThemeSelector -> StatusBar -> Main content -> History -> Footer.

### Color Contrast
- **Check muted-foreground contrast**: `oklch(0.556 0 0)` against `oklch(1 0 0)` background -- verify this meets WCAA AA (4.5:1 for normal text). The muted foreground is used for descriptions and labels.
- **Orange warning state**: `text-orange-500` on white background may not meet AA contrast. Use `text-orange-600` or `text-amber-700` for better contrast.
- **Primary foreground on primary**: Verify `oklch(0.98 0.02 74)` on `oklch(0.65 0.19 41)` has sufficient contrast for the large numbers in DrawButton and ResultDisplay.
- **Dark mode verification**: The dark mode muted-foreground `oklch(0.708 0 0)` on `oklch(0.145 0 0)` should be checked as well.

### Touch Target Sizes
- **HistoryItem restore button is too small**: The X button inside HistoryItem uses `p-0.5` (2px padding) around a `w-3 h-3` (12px) icon, resulting in roughly a 16px touch target. WCAG requires minimum 44x44px. Increase to at least `p-2` with `w-4 h-4` icon, or make the entire HistoryItem tappable for restore.
- **NumberInput +/- buttons**: At `h-10 w-10` (40px), these are close to the 44px minimum but technically under. Consider `h-11 w-11` (44px).
- **ThemeSelector**: At `w-10 h-10` (40px), this is also slightly under the 44px recommendation.

### Animation Accessibility
- **(Covered in 2.2)**: The missing `@prefers-reduced-motion` support is the most critical accessibility gap. All animations, including the drawing animation tick cycle, must respect this preference.

---

## 6. New Feature UI Proposals

### Share Results Feature (Web Share API)
- **Implementation**: Add a share button (lucide `Share2` icon) that appears in the result phase next to the "다시 추첨하기" button.
- **Share content format**:
  ```
  [행운번호 추첨기]
  추첨 결과: 7, 23, 45
  범위: 1 ~ 45
  ```
- **Fallback**: On browsers without Web Share API, copy to clipboard with toast notification.
- **Share image**: Consider using html2canvas to generate a shareable image of the result display for social media sharing.

### Statistics/Analytics Dashboard
- **Draw frequency chart**: A simple bar chart showing how often each number has been drawn across all sessions. Use the existing chart color variables.
- **Session history**: Store full draw history (with timestamps) in localStorage. Show a collapsible "전체 기록" section.
- **Lucky number highlight**: Show the most/least frequently drawn numbers as "행운의 번호" / "숨은 번호".
- **Access**: Add a small chart/stats icon next to the ThemeSelector.

### Preset Configurations
- **(Covered in 2.3 SettingsDialog improvements)**
- **Custom preset saving**: Allow users to save their own presets with custom names (e.g., "우리반 번호 뽑기"). Store in localStorage.
- **Quick-start from presets**: On the initial hero screen, show 2-3 popular presets as quick-start cards below the setup button, allowing users to skip settings entirely.

### Theme Customization Beyond Light/Dark
- **Color accent picker**: Allow users to choose the primary accent color from a preset palette (warm orange, cool blue, forest green, royal purple, cherry red). This changes the oklch hue of primary/accent/ring variables.
- **UI**: Show as a row of color circles in settings or in an expanded theme selector dropdown.
- **Persistence**: Store chosen accent in localStorage alongside the light/dark preference.

### Sound Customization UI
- **Volume slider**: Add a volume control (0-100%) in the settings dialog that scales the gain values in the Web Audio API.
- **Sound theme selection**: Offer 2-3 sound themes:
  - "기본" (current sine wave)
  - "카지노" (richer, casino-machine-like with harmonics)
  - "부드러운" (softer, lower frequency)
- **Preview button**: A small play icon next to each sound option that plays a sample.
- **Mute toggle in header**: Add a small speaker icon next to the ThemeSelector for quick mute toggle without opening settings.

---

## File Ownership

This agent owns analysis of:
- `app/components/lottery/LotteryMachine.tsx`
- `app/components/lottery/DrawButton.tsx`
- `app/components/lottery/ResultDisplay.tsx`
- `app/components/lottery/StatusBar.tsx`
- `app/components/lottery/HistoryList.tsx`
- `app/components/lottery/HistoryItem.tsx`
- `app/components/settings/SettingsDialog.tsx`
- `app/components/settings/NumberInput.tsx`
- `app/components/ui/theme-selector.tsx`
- `app/app.css` (animations, styling)
- `app/hooks/useDrawAnimation.ts` (animation UX)
- `app/lib/sound.ts` (audio UX)

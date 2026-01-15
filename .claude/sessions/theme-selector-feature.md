# Session: theme-selector-feature

**Date**: 2026-01-15
**Description**: 테마변경버튼 브레인스토밍
**Status**: 브레인스토밍 완료, 구현 대기

## Summary

ThemeSelector 컴포넌트 추가를 위한 브레인스토밍 세션. 라이트/다크 모드 전환 UI 설계 완료.

## Design Decisions

### Position
- **Location**: 모든 화면 우상단 (절대 위치)
- **Rationale**: 앱 진입 시 바로 접근 가능, 모든 Phase에서 일관된 위치

### UI Style
- **Type**: 아이콘 토글 버튼
- **Icons**: Sun (라이트) / Moon (다크) - lucide-react
- **Button Style**: ghost variant, 원형, w-10 h-10
- **Animation**: 아이콘 전환 시 회전 또는 스케일 트랜지션

### Behavior
- **States**: 2-state (Light ↔ Dark)
- **Default**: 시스템 설정 따르기 (prefers-color-scheme)
- **Persistence**: localStorage

## Planned Implementation

### New Files
```
app/
├── hooks/
│   └── useTheme.ts           ← 테마 상태 관리 훅
└── components/
    └── ui/
        └── theme-selector.tsx ← UI 컴포넌트
```

### Modified Files
```
app/components/lottery/LotteryMachine.tsx ← ThemeSelector 배치
```

### useTheme Hook Specification
```typescript
type Theme = 'light' | 'dark' | 'system';

interface UseThemeReturn {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function useTheme(): UseThemeReturn;
```

**Key Features**:
1. 마운트 시 localStorage에서 초기값 로드
2. system 설정 시 matchMedia 리스너 등록
3. document.documentElement.classList 관리 ('dark' 클래스)
4. SSR 호환성 (hydration mismatch 방지)

### ThemeSelector Component Specification
```typescript
interface ThemeSelectorProps {
  className?: string;
}

function ThemeSelector({ className }: ThemeSelectorProps): JSX.Element;
```

**Rendering**:
- Ghost button with rounded-full
- Sun icon when dark mode (click to switch to light)
- Moon icon when light mode (click to switch to dark)

### LotteryMachine Integration
```tsx
<div className="min-h-screen flex flex-col bg-background relative">
  {/* Theme Selector - 우상단 고정 */}
  <div className="absolute top-4 right-4 z-50">
    <ThemeSelector />
  </div>

  {/* 기존 콘텐츠 */}
</div>
```

## Visual Reference

```
┌─────────────────────────────┐
│                      [🌙]  │  ← ThemeSelector (dark mode icon)
│                             │
│      행운번호               │
│      추첨기                 │
│                             │
│        [ 세팅하기 ]         │
│                             │
│          (eb logo)          │
└─────────────────────────────┘
```

## Technical Notes

- 현재 app.css에 `.dark` 클래스 기반 다크모드 스타일 완비
- `prefers-color-scheme: dark` 미디어 쿼리도 이미 설정됨
- lucide-react 아이콘 라이브러리 이미 프로젝트에 포함
- Button 컴포넌트 (ghost variant) 이미 존재

## Next Steps

1. [ ] useTheme 훅 생성 (`app/hooks/useTheme.ts`)
2. [ ] ThemeSelector 컴포넌트 생성 (`app/components/ui/theme-selector.tsx`)
3. [ ] LotteryMachine.tsx에 ThemeSelector 배치
4. [ ] 라이트/다크 전환 테스트
5. [ ] localStorage 저장 확인

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '~/hooks/useTheme';
import { cn } from '~/lib/utils';

interface ThemeSelectorProps {
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 테마 선택 버튼 컴포넌트
 *
 * 라이트/다크 모드를 토글하는 버튼입니다.
 * - 라이트 모드: Moon 아이콘 표시 (클릭 시 다크로)
 * - 다크 모드: Sun 아이콘 표시 (클릭 시 라이트로)
 *
 * @example
 * ```tsx
 * <ThemeSelector className="absolute top-4 right-4" />
 * ```
 */
export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center',
        'w-10 h-10 rounded-full',
        'transition-all duration-300',

        // Colors
        'bg-secondary/50 hover:bg-secondary',
        'text-secondary-foreground',

        // Focus
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',

        // Hover effect
        'hover:scale-105 active:scale-95',

        className
      )}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {isDark ? (
        <Sun
          className="w-5 h-5 transition-transform duration-300 rotate-0 hover:rotate-90"
          data-testid="sun-icon"
        />
      ) : (
        <Moon
          className="w-5 h-5 transition-transform duration-300 rotate-0 hover:-rotate-12"
          data-testid="moon-icon"
        />
      )}
    </button>
  );
}

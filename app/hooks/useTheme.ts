import { useState, useEffect, useCallback } from 'react';

/** 테마 타입 */
export type Theme = 'light' | 'dark' | 'system';

/** useTheme 훅 반환 타입 */
export interface UseThemeReturn {
  /** 현재 설정된 테마 (light | dark | system) */
  theme: Theme;
  /** 실제 적용된 테마 (light | dark) - system 설정 시 시스템 값으로 resolve */
  resolvedTheme: 'light' | 'dark';
  /** 테마 설정 함수 */
  setTheme: (theme: Theme) => void;
  /** light ↔ dark 토글 함수 */
  toggleTheme: () => void;
}

const STORAGE_KEY = 'theme';
const VALID_THEMES: Theme[] = ['light', 'dark', 'system'];

/**
 * 시스템 다크모드 설정 확인
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * localStorage에서 테마 로드
 */
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_THEMES.includes(stored as Theme)) {
    return stored as Theme;
  }
  return 'system';
}

/**
 * 테마에 따른 실제 적용 테마 계산
 */
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * document.documentElement에 다크 클래스 적용
 */
function applyThemeToDOM(resolvedTheme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;

  if (resolvedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * 테마 관리 훅
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, toggleTheme, resolvedTheme } = useTheme();
 *   return (
 *     <button onClick={toggleTheme}>
 *       {resolvedTheme === 'dark' ? '🌙' : '☀️'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(getStoredTheme())
  );

  // 테마 변경 시 localStorage 저장 및 DOM 업데이트
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newTheme);
    }

    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved);
  }, []);

  // light ↔ dark 토글
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // 초기 마운트 시 DOM에 테마 적용
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, []);

  // system 테마일 때 시스템 설정 변경 감지
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolved);
      applyThemeToDOM(newResolved);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}

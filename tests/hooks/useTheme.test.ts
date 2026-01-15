import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTheme, type Theme } from '~/hooks/useTheme';

describe('useTheme', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Reset document class
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('초기화', () => {
    it('localStorage에 저장된 테마가 없으면 system을 기본값으로 사용한다', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
    });

    it('localStorage에 저장된 테마가 있으면 해당 테마를 사용한다', () => {
      localStorageMock.setItem('theme', 'dark');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
    });

    it('유효하지 않은 localStorage 값은 system으로 폴백한다', () => {
      localStorageMock.setItem('theme', 'invalid-theme');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
    });
  });

  describe('테마 변경', () => {
    it('setTheme으로 테마를 변경할 수 있다', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('테마 변경 시 localStorage에 저장된다', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('toggleTheme으로 light와 dark를 토글할 수 있다', () => {
      const { result } = renderHook(() => useTheme());

      // 초기 상태에서 토글 (system -> dark로 가정)
      act(() => {
        result.current.setTheme('light');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('resolvedTheme', () => {
    it('theme이 light이면 resolvedTheme도 light이다', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.resolvedTheme).toBe('light');
    });

    it('theme이 dark이면 resolvedTheme도 dark이다', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('theme이 system이면 시스템 설정에 따라 resolvedTheme이 결정된다', () => {
      // matchMedia가 dark를 반환하도록 설정
      vi.mocked(window.matchMedia).mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.resolvedTheme).toBe('dark');
    });
  });

  describe('DOM 클래스 관리', () => {
    it('dark 테마일 때 document에 dark 클래스가 추가된다', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('light 테마일 때 document에서 dark 클래스가 제거된다', () => {
      document.documentElement.classList.add('dark');

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});

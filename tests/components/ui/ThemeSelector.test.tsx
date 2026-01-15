import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeSelector } from '~/components/ui/theme-selector';

describe('ThemeSelector', () => {
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
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    document.documentElement.classList.remove('dark');
  });

  describe('렌더링', () => {
    it('버튼이 렌더링된다', () => {
      render(<ThemeSelector />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('접근성 레이블이 있다', () => {
      render(<ThemeSelector />);

      expect(screen.getByRole('button', { name: /모드로 전환/i })).toBeInTheDocument();
    });

    it('커스텀 className이 적용된다', () => {
      render(<ThemeSelector className="custom-class" />);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('테마 전환', () => {
    it('버튼 클릭 시 테마가 토글된다', () => {
      render(<ThemeSelector />);

      const button = screen.getByRole('button');

      // 초기 상태 (light)
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // 클릭하여 dark로 전환
      fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // 다시 클릭하여 light로 전환
      fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('테마 전환 시 localStorage에 저장된다', () => {
      render(<ThemeSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  describe('아이콘 표시', () => {
    it('라이트 모드일 때 Moon 아이콘이 표시된다', () => {
      localStorageMock.setItem('theme', 'light');
      render(<ThemeSelector />);

      // Moon 아이콘 (클릭하면 다크로 전환)
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });

    it('다크 모드일 때 Sun 아이콘이 표시된다', () => {
      localStorageMock.setItem('theme', 'dark');
      render(<ThemeSelector />);

      // Sun 아이콘 (클릭하면 라이트로 전환)
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    });
  });
});

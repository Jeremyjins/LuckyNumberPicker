import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSound } from '~/hooks/useSound';

// Mock the sound module
vi.mock('~/lib/sound', () => ({
  playTick: vi.fn(),
  playSuccess: vi.fn(),
  resetAudioContext: vi.fn(),
}));

import { playTick, playSuccess } from '~/lib/sound';

describe('useSound', () => {
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
    vi.clearAllMocks();
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  describe('초기화', () => {
    it('기본적으로 enabled가 true이다', () => {
      const { result } = renderHook(() => useSound());

      expect(result.current.enabled).toBe(true);
    });

    it('localStorage에서 enabled 상태를 로드한다', () => {
      localStorageMock.setItem('sound-enabled', 'false');

      const { result } = renderHook(() => useSound());

      expect(result.current.enabled).toBe(false);
    });

    it('localStorage에 저장된 값이 true이면 enabled가 true이다', () => {
      localStorageMock.setItem('sound-enabled', 'true');

      const { result } = renderHook(() => useSound());

      expect(result.current.enabled).toBe(true);
    });
  });

  describe('setEnabled', () => {
    it('enabled 상태를 변경할 수 있다', () => {
      const { result } = renderHook(() => useSound());

      act(() => {
        result.current.setEnabled(false);
      });

      expect(result.current.enabled).toBe(false);
    });

    it('enabled 변경 시 localStorage에 저장된다', () => {
      const { result } = renderHook(() => useSound());

      act(() => {
        result.current.setEnabled(false);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('sound-enabled', 'false');
    });
  });

  describe('playTick', () => {
    it('enabled가 true일 때 사운드를 재생한다', () => {
      const { result } = renderHook(() => useSound());

      act(() => {
        result.current.playTick(0.5);
      });

      expect(playTick).toHaveBeenCalledWith(0.5);
    });

    it('enabled가 false일 때 사운드를 재생하지 않는다', () => {
      localStorageMock.setItem('sound-enabled', 'false');
      const { result } = renderHook(() => useSound());

      act(() => {
        result.current.playTick(0.5);
      });

      expect(playTick).not.toHaveBeenCalled();
    });

    it('progress 없이 호출할 수 있다', () => {
      const { result } = renderHook(() => useSound());

      act(() => {
        result.current.playTick();
      });

      expect(playTick).toHaveBeenCalledWith(0);
    });
  });

  describe('playSuccess', () => {
    it('enabled가 true일 때 성공 사운드를 재생한다', () => {
      const { result } = renderHook(() => useSound());

      act(() => {
        result.current.playSuccess();
      });

      expect(playSuccess).toHaveBeenCalled();
    });

    it('enabled가 false일 때 성공 사운드를 재생하지 않는다', () => {
      localStorageMock.setItem('sound-enabled', 'false');
      const { result } = renderHook(() => useSound());

      act(() => {
        result.current.playSuccess();
      });

      expect(playSuccess).not.toHaveBeenCalled();
    });
  });

  describe('동적 상태 변경', () => {
    it('enabled 상태 변경 후 사운드 재생 여부가 바뀐다', () => {
      const { result } = renderHook(() => useSound());

      // Initially enabled
      act(() => {
        result.current.playTick();
      });
      expect(playTick).toHaveBeenCalledTimes(1);

      // Disable
      act(() => {
        result.current.setEnabled(false);
      });

      // Should not play
      act(() => {
        result.current.playTick();
      });
      expect(playTick).toHaveBeenCalledTimes(1); // Still 1

      // Enable again
      act(() => {
        result.current.setEnabled(true);
      });

      // Should play
      act(() => {
        result.current.playTick();
      });
      expect(playTick).toHaveBeenCalledTimes(2);
    });
  });
});

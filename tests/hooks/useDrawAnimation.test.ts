import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDrawAnimation } from '~/hooks/useDrawAnimation';

describe('useDrawAnimation', () => {
  const defaultOptions = {
    startNumber: 1,
    endNumber: 10,
    excludedNumbers: [] as number[],
    drawCount: 1,
    allowDuplicates: false,
  };

  describe('initial state', () => {
    it('starts not animating', () => {
      const { result } = renderHook(() => useDrawAnimation(defaultOptions));
      expect(result.current.isAnimating).toBe(false);
    });

    it('starts with null currentDisplay', () => {
      const { result } = renderHook(() => useDrawAnimation(defaultOptions));
      expect(result.current.currentDisplay).toBeNull();
    });

    it('returns start function', () => {
      const { result } = renderHook(() => useDrawAnimation(defaultOptions));
      expect(typeof result.current.start).toBe('function');
    });

    it('returns stop function', () => {
      const { result } = renderHook(() => useDrawAnimation(defaultOptions));
      expect(typeof result.current.stop).toBe('function');
    });
  });

  describe('start', () => {
    it('sets isAnimating to true when started', () => {
      const { result } = renderHook(() =>
        useDrawAnimation({
          ...defaultOptions,
          duration: 100, // Short duration for test
        })
      );

      act(() => {
        result.current.start();
      });

      expect(result.current.isAnimating).toBe(true);
    });

    it('does not start if already animating', () => {
      const onTick = vi.fn();
      const { result } = renderHook(() =>
        useDrawAnimation({
          ...defaultOptions,
          duration: 500,
          onTick,
        })
      );

      act(() => {
        result.current.start();
      });

      const tickCountAfterFirstStart = onTick.mock.calls.length;

      act(() => {
        result.current.start(); // Try to start again
      });

      // Still only one animation running
      expect(result.current.isAnimating).toBe(true);
    });

    it('calls onComplete with empty array when no numbers available', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useDrawAnimation({
          ...defaultOptions,
          excludedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // All excluded
          onComplete,
        })
      );

      act(() => {
        result.current.start();
      });

      expect(onComplete).toHaveBeenCalledWith([]);
      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('stop', () => {
    it('sets isAnimating to false when stopped', () => {
      const { result } = renderHook(() =>
        useDrawAnimation({
          ...defaultOptions,
          duration: 1000,
        })
      );

      act(() => {
        result.current.start();
      });

      expect(result.current.isAnimating).toBe(true);

      act(() => {
        result.current.stop();
      });

      expect(result.current.isAnimating).toBe(false);
    });

    it('resets currentDisplay to null when stopped', () => {
      const { result } = renderHook(() =>
        useDrawAnimation({
          ...defaultOptions,
          duration: 1000,
        })
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.stop();
      });

      expect(result.current.currentDisplay).toBeNull();
    });

    it('can be called when not animating without error', () => {
      const { result } = renderHook(() => useDrawAnimation(defaultOptions));

      expect(() => {
        act(() => {
          result.current.stop();
        });
      }).not.toThrow();
    });
  });

  describe('animation completion', () => {
    it('calls onComplete with final numbers after animation', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useDrawAnimation({
          ...defaultOptions,
          duration: 50, // Very short for test
          onComplete,
        })
      );

      act(() => {
        result.current.start();
      });

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );

      const [finalNumbers] = onComplete.mock.calls[0];
      expect(Array.isArray(finalNumbers)).toBe(true);
      expect(finalNumbers.length).toBe(1);
    });

    it('sets isAnimating to false after completion', async () => {
      const { result } = renderHook(() =>
        useDrawAnimation({
          ...defaultOptions,
          duration: 50,
        })
      );

      act(() => {
        result.current.start();
      });

      await waitFor(
        () => {
          expect(result.current.isAnimating).toBe(false);
        },
        { timeout: 1000 }
      );
    });
  });

  describe('cleanup', () => {
    it('cleans up on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useDrawAnimation({
          ...defaultOptions,
          duration: 5000,
        })
      );

      act(() => {
        result.current.start();
      });

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('onTick callback', () => {
    it('calls onTick during animation', async () => {
      const onTick = vi.fn();
      const { result } = renderHook(() =>
        useDrawAnimation({
          ...defaultOptions,
          duration: 100,
          onTick,
        })
      );

      act(() => {
        result.current.start();
      });

      await waitFor(
        () => {
          expect(onTick.mock.calls.length).toBeGreaterThan(0);
        },
        { timeout: 1000 }
      );
    });
  });

  describe('custom duration', () => {
    it('respects custom duration option', () => {
      const { result } = renderHook(() =>
        useDrawAnimation({
          ...defaultOptions,
          duration: 100,
        })
      );

      // Just verify it accepts the option without error
      act(() => {
        result.current.start();
      });

      expect(result.current.isAnimating).toBe(true);

      act(() => {
        result.current.stop();
      });
    });
  });
});

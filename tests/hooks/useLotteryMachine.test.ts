import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLotteryMachine } from '~/hooks/useLotteryMachine';
import { DEFAULT_SETTINGS } from '~/types/lottery';

describe('useLotteryMachine', () => {
  describe('initial state', () => {
    it('starts in initial phase', () => {
      const { result } = renderHook(() => useLotteryMachine());
      expect(result.current.phase).toBe('initial');
    });

    it('has default settings', () => {
      const { result } = renderHook(() => useLotteryMachine());
      expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('settings dialog is closed initially', () => {
      const { result } = renderHook(() => useLotteryMachine());
      expect(result.current.settingsOpen).toBe(false);
    });

    it('has empty history', () => {
      const { result } = renderHook(() => useLotteryMachine());
      expect(result.current.history).toEqual([]);
    });

    it('is not animating', () => {
      const { result } = renderHook(() => useLotteryMachine());
      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('openSettings', () => {
    it('opens settings dialog', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      expect(result.current.settingsOpen).toBe(true);
    });

    it('changes phase to settings', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      expect(result.current.phase).toBe('settings');
    });
  });

  describe('closeSettings', () => {
    it('closes settings dialog', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.closeSettings());
      expect(result.current.settingsOpen).toBe(false);
    });

    it('returns to initial phase when no history', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.closeSettings());
      expect(result.current.phase).toBe('initial');
    });
  });

  describe('updateSettings', () => {
    it('updates partial settings', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.updateSettings({ startNumber: 10 }));
      expect(result.current.settings.startNumber).toBe(10);
      expect(result.current.settings.endNumber).toBe(DEFAULT_SETTINGS.endNumber);
    });

    it('updates multiple settings at once', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.updateSettings({ startNumber: 5, endNumber: 50 }));
      expect(result.current.settings.startNumber).toBe(5);
      expect(result.current.settings.endNumber).toBe(50);
    });
  });

  describe('confirmSettings', () => {
    it('closes settings dialog', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      expect(result.current.settingsOpen).toBe(false);
    });

    it('transitions to ready phase', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      expect(result.current.phase).toBe('ready');
    });

    it('clears history on confirm', () => {
      const { result } = renderHook(() => useLotteryMachine());

      // Setup: do a draw first
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([5]));

      // Reopen settings and confirm
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());

      expect(result.current.history).toEqual([]);
    });

    it('does not confirm invalid settings', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      // Set invalid settings (start > end)
      act(() => result.current.updateSettings({ startNumber: 100, endNumber: 1 }));
      act(() => result.current.confirmSettings());
      // Should stay in settings phase due to validation failure
      expect(result.current.phase).toBe('settings');
    });
  });

  describe('startDraw', () => {
    it('transitions to drawing phase', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      expect(result.current.phase).toBe('drawing');
    });

    it('sets isAnimating to true', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      expect(result.current.isAnimating).toBe(true);
    });
  });

  describe('updateDisplay', () => {
    it('updates displayNumber', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.updateDisplay(42));
      expect(result.current.displayNumber).toBe(42);
    });
  });

  describe('finishDraw', () => {
    it('transitions to result phase', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([7]));
      expect(result.current.phase).toBe('result');
    });

    it('sets isAnimating to false', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([7]));
      expect(result.current.isAnimating).toBe(false);
    });

    it('adds to history', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([7]));
      expect(result.current.history).toContain(7);
    });

    it('sets currentResult', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([7, 8, 9]));
      expect(result.current.currentResult).toEqual([7, 8, 9]);
    });

    it('adds to excludedNumbers when duplicates not allowed', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([5]));
      expect(result.current.excludedNumbers).toContain(5);
    });
  });

  describe('restoreNumber', () => {
    it('removes number from excludedNumbers', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([5]));

      expect(result.current.excludedNumbers).toContain(5);

      act(() => result.current.restoreNumber(5));
      expect(result.current.excludedNumbers).not.toContain(5);
    });

    it('removes number from history', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([5]));

      act(() => result.current.restoreNumber(5));
      expect(result.current.history).not.toContain(5);
    });
  });

  describe('drawAgain', () => {
    it('transitions to ready phase', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([5]));

      act(() => result.current.drawAgain());
      expect(result.current.phase).toBe('ready');
    });

    it('clears currentResult', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([5]));

      act(() => result.current.drawAgain());
      expect(result.current.currentResult).toEqual([]);
    });
  });

  describe('resetAll', () => {
    it('returns to initial state', () => {
      const { result } = renderHook(() => useLotteryMachine());

      // Do some operations
      act(() => result.current.openSettings());
      act(() => result.current.updateSettings({ startNumber: 10, endNumber: 100 }));
      act(() => result.current.confirmSettings());
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([42]));

      // Reset
      act(() => result.current.resetAll());

      expect(result.current.phase).toBe('initial');
      expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
      expect(result.current.history).toEqual([]);
    });
  });

  describe('computed values', () => {
    it('calculates totalRange correctly', () => {
      const { result } = renderHook(() => useLotteryMachine());
      // Default: 1-12 = 12
      expect(result.current.totalRange).toBe(12);

      act(() => result.current.updateSettings({ startNumber: 1, endNumber: 100 }));
      expect(result.current.totalRange).toBe(100);
    });

    it('calculates remainingCount correctly', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());

      // Initially all 12 available
      expect(result.current.remainingCount).toBe(12);

      // After drawing one
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([5]));
      expect(result.current.remainingCount).toBe(11);
    });

    it('calculates canDrawNow correctly', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.confirmSettings());

      expect(result.current.canDrawNow).toBe(true);
    });

    it('canDrawNow returns false when not enough numbers', () => {
      const { result } = renderHook(() => useLotteryMachine());
      act(() => result.current.openSettings());
      act(() => result.current.updateSettings({ startNumber: 1, endNumber: 2, drawCount: 1 }));
      act(() => result.current.confirmSettings());

      // Draw first number
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([1]));
      act(() => result.current.drawAgain());

      // Draw second number
      act(() => result.current.startDraw());
      act(() => result.current.finishDraw([2]));
      act(() => result.current.drawAgain());

      // No more numbers left
      expect(result.current.canDrawNow).toBe(false);
    });
  });
});

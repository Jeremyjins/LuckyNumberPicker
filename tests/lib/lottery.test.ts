import { describe, it, expect } from 'vitest';
import {
  getAvailableNumbers,
  getRandomNumber,
  getRandomNumbers,
  getTotalRange,
  getRemainingCount,
  canDraw,
  validateSettings,
  MAX_RANGE,
} from '~/lib/lottery';

describe('lottery utilities', () => {
  describe('MAX_RANGE constant', () => {
    it('should be 10000', () => {
      expect(MAX_RANGE).toBe(10000);
    });
  });

  describe('getAvailableNumbers', () => {
    it('returns all numbers in range when no exclusions', () => {
      const result = getAvailableNumbers(1, 5, []);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('excludes specified numbers', () => {
      const result = getAvailableNumbers(1, 5, [2, 4]);
      expect(result).toEqual([1, 3, 5]);
    });

    it('returns empty array when all excluded', () => {
      const result = getAvailableNumbers(1, 3, [1, 2, 3]);
      expect(result).toEqual([]);
    });

    it('handles single number range', () => {
      const result = getAvailableNumbers(5, 5, []);
      expect(result).toEqual([5]);
    });

    it('works with default empty exclusion', () => {
      const result = getAvailableNumbers(1, 3);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('getRandomNumber', () => {
    it('returns number within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = getRandomNumber(1, 10);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(10);
      }
    });

    it('handles single value range', () => {
      expect(getRandomNumber(5, 5)).toBe(5);
    });

    it('returns null when all numbers excluded', () => {
      expect(getRandomNumber(1, 3, [1, 2, 3])).toBeNull();
    });

    it('respects exclusions', () => {
      for (let i = 0; i < 50; i++) {
        const result = getRandomNumber(1, 5, [1, 2, 3, 4]);
        expect(result).toBe(5);
      }
    });

    it('works with default empty exclusion', () => {
      const result = getRandomNumber(1, 10);
      expect(result).not.toBeNull();
    });
  });

  describe('getRandomNumbers', () => {
    it('returns correct count of numbers', () => {
      const result = getRandomNumbers(1, 100, 5, []);
      expect(result).toHaveLength(5);
    });

    it('returns unique numbers when no duplicates allowed', () => {
      const result = getRandomNumbers(1, 10, 5, [], false);
      const unique = new Set(result);
      expect(unique.size).toBe(5);
    });

    it('respects exclusion list', () => {
      const excluded = [1, 2, 3];
      const result = getRandomNumbers(1, 10, 3, excluded, false);
      result.forEach((n) => expect(excluded).not.toContain(n));
    });

    it('can return duplicates when allowed', () => {
      // With a small range and many draws, duplicates should appear
      const result = getRandomNumbers(1, 3, 10, [], true);
      expect(result).toHaveLength(10);
      // All numbers should be in range
      result.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(3);
      });
    });

    it('returns fewer numbers if range exhausted without duplicates', () => {
      const result = getRandomNumbers(1, 3, 10, [], false);
      expect(result).toHaveLength(3); // Can only get 3 unique numbers from 1-3
    });

    it('returns empty array when all excluded', () => {
      const result = getRandomNumbers(1, 3, 5, [1, 2, 3], false);
      expect(result).toEqual([]);
    });
  });

  describe('getTotalRange', () => {
    it('calculates correct range', () => {
      expect(getTotalRange(1, 10)).toBe(10);
      expect(getTotalRange(1, 45)).toBe(45);
      expect(getTotalRange(5, 5)).toBe(1);
    });

    it('returns 0 for invalid range', () => {
      expect(getTotalRange(10, 1)).toBe(0);
    });
  });

  describe('getRemainingCount', () => {
    it('returns total range when duplicates allowed', () => {
      expect(getRemainingCount(1, 10, [1, 2, 3], true)).toBe(10);
    });

    it('returns available count when duplicates not allowed', () => {
      expect(getRemainingCount(1, 10, [1, 2, 3], false)).toBe(7);
    });

    it('returns 0 when all excluded', () => {
      expect(getRemainingCount(1, 3, [1, 2, 3], false)).toBe(0);
    });
  });

  describe('canDraw', () => {
    it('returns true when enough numbers available', () => {
      expect(canDraw(1, 10, 5, [], false)).toBe(true);
    });

    it('returns false when not enough numbers', () => {
      expect(canDraw(1, 3, 5, [], false)).toBe(false);
    });

    it('returns true with duplicates even with exclusions', () => {
      expect(canDraw(1, 10, 5, [1, 2, 3, 4, 5, 6], true)).toBe(true);
    });

    it('returns false when remaining count less than draw count', () => {
      expect(canDraw(1, 5, 3, [1, 2, 3], false)).toBe(false);
    });
  });

  describe('validateSettings', () => {
    it('validates correct settings', () => {
      const result = validateSettings({
        startNumber: 1,
        endNumber: 45,
        drawCount: 6,
      });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('fails when start > end', () => {
      const result = validateSettings({
        startNumber: 45,
        endNumber: 1,
        drawCount: 6,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('시작 번호');
    });

    it('fails when drawCount < 1', () => {
      const result = validateSettings({
        startNumber: 1,
        endNumber: 10,
        drawCount: 0,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('1 이상');
    });

    it('fails when drawCount exceeds range', () => {
      const result = validateSettings({
        startNumber: 1,
        endNumber: 5,
        drawCount: 10,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('초과');
    });

    it('fails when range exceeds MAX_RANGE', () => {
      const result = validateSettings({
        startNumber: 1,
        endNumber: 20000,
        drawCount: 1,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('범위가 너무 큽니다');
    });

    it('passes when range equals MAX_RANGE', () => {
      const result = validateSettings({
        startNumber: 1,
        endNumber: 10000,
        drawCount: 1,
      });
      expect(result.valid).toBe(true);
    });
  });
});

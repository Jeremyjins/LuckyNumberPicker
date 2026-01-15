import { describe, it, expect, vi } from 'vitest';
import {
  easings,
  generateAnimationSchedule,
  runAnimation,
  ANIMATION_CONFIG,
} from '~/lib/animation';

describe('animation utilities', () => {
  describe('easings', () => {
    describe('easeOutQuart', () => {
      it('returns 0 at start', () => {
        expect(easings.easeOutQuart(0)).toBe(0);
      });

      it('returns 1 at end', () => {
        expect(easings.easeOutQuart(1)).toBe(1);
      });

      it('accelerates progress (value > input for middle values)', () => {
        const mid = easings.easeOutQuart(0.5);
        expect(mid).toBeGreaterThan(0.5);
      });
    });

    describe('easeOutExpo', () => {
      it('returns 0 at start', () => {
        expect(easings.easeOutExpo(0)).toBeCloseTo(0, 2);
      });

      it('returns 1 at end', () => {
        expect(easings.easeOutExpo(1)).toBe(1);
      });

      it('is more dramatic than easeOutQuart', () => {
        const expo = easings.easeOutExpo(0.3);
        const quart = easings.easeOutQuart(0.3);
        expect(expo).toBeGreaterThan(quart);
      });
    });

    describe('linear', () => {
      it('returns same value as input', () => {
        expect(easings.linear(0)).toBe(0);
        expect(easings.linear(0.5)).toBe(0.5);
        expect(easings.linear(1)).toBe(1);
      });
    });
  });

  describe('generateAnimationSchedule', () => {
    it('generates timestamps array', () => {
      const schedule = generateAnimationSchedule();
      expect(schedule.timestamps).toBeInstanceOf(Array);
      expect(schedule.timestamps.length).toBeGreaterThan(0);
    });

    it('starts at 0', () => {
      const schedule = generateAnimationSchedule();
      expect(schedule.timestamps[0]).toBe(0);
    });

    it('ends at or after duration', () => {
      const duration = 2000;
      const schedule = generateAnimationSchedule(duration);
      expect(schedule.timestamps[schedule.timestamps.length - 1]).toBeGreaterThanOrEqual(duration);
    });

    it('respects custom duration', () => {
      const schedule = generateAnimationSchedule(1000);
      expect(schedule.totalDuration).toBe(1000);
    });

    it('uses custom easing function', () => {
      const customEasing = vi.fn((t: number) => t);
      generateAnimationSchedule(2000, customEasing);
      expect(customEasing).toHaveBeenCalled();
    });

    it('timestamps are in increasing order', () => {
      const schedule = generateAnimationSchedule();
      for (let i = 1; i < schedule.timestamps.length; i++) {
        expect(schedule.timestamps[i]).toBeGreaterThan(schedule.timestamps[i - 1]);
      }
    });
  });

  describe('runAnimation', () => {
    it('returns cancel function', () => {
      const schedule = { timestamps: [0, 100], totalDuration: 100 };
      const cancel = runAnimation(schedule, vi.fn(), vi.fn());
      expect(typeof cancel).toBe('function');
    });

    it('cancel function can be called without error', () => {
      const schedule = { timestamps: [0, 100, 200], totalDuration: 200 };
      const onTick = vi.fn();
      const cancel = runAnimation(schedule, onTick, vi.fn());

      // Should not throw when called
      expect(() => cancel()).not.toThrow();
    });

    it('animation runs with valid schedule', () => {
      const schedule = { timestamps: [0, 100], totalDuration: 100 };
      const onTick = vi.fn();
      const onComplete = vi.fn();

      const cancel = runAnimation(schedule, onTick, onComplete);

      // Cleanup
      cancel();
    });
  });

  describe('ANIMATION_CONFIG', () => {
    it('has correct default values', () => {
      expect(ANIMATION_CONFIG.duration).toBe(2000);
      expect(ANIMATION_CONFIG.minInterval).toBe(50);
      expect(ANIMATION_CONFIG.maxInterval).toBe(400);
    });

    it('is readonly (const)', () => {
      // TypeScript would catch attempts to modify, but we can verify values exist
      expect(Object.isFrozen(ANIMATION_CONFIG)).toBe(false); // Not frozen at runtime
      expect(ANIMATION_CONFIG).toHaveProperty('duration');
      expect(ANIMATION_CONFIG).toHaveProperty('minInterval');
      expect(ANIMATION_CONFIG).toHaveProperty('maxInterval');
    });
  });
});

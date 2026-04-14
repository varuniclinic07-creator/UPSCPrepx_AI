import {
  sm2Calculate,
  accuracyToQuality,
  calculateMasteryLevel,
} from '@/lib/mastery/mastery-service';

describe('Mastery Service — SM-2 Algorithm', () => {
  describe('accuracyToQuality', () => {
    it('maps 0% to quality 0', () => {
      expect(accuracyToQuality(0)).toBe(0);
    });

    it('maps 20% to quality 0', () => {
      expect(accuracyToQuality(0.2)).toBe(0);
    });

    it('maps 40% to quality 1', () => {
      expect(accuracyToQuality(0.4)).toBe(1);
    });

    it('maps 55% to quality 2', () => {
      expect(accuracyToQuality(0.55)).toBe(2);
    });

    it('maps 70% to quality 3', () => {
      expect(accuracyToQuality(0.7)).toBe(3);
    });

    it('maps 85% to quality 4', () => {
      expect(accuracyToQuality(0.85)).toBe(4);
    });

    it('maps 100% to quality 5', () => {
      expect(accuracyToQuality(1.0)).toBe(5);
    });
  });

  describe('sm2Calculate', () => {
    it('resets on failure (quality < 3)', () => {
      const result = sm2Calculate(10, 2.5, 5, 2);
      expect(result.interval_days).toBe(1);
      expect(result.repetitions).toBe(0);
      expect(result.ease_factor).toBe(2.3);
    });

    it('first success gives 1-day interval', () => {
      const result = sm2Calculate(0, 2.5, 0, 4);
      expect(result.interval_days).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('second success gives 6-day interval', () => {
      const result = sm2Calculate(1, 2.5, 1, 4);
      expect(result.interval_days).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('subsequent success multiplies by ease factor', () => {
      const result = sm2Calculate(6, 2.5, 2, 4);
      expect(result.interval_days).toBe(15); // ceil(6 * 2.5)
      expect(result.repetitions).toBe(3);
    });

    it('easy quality gives bonus interval', () => {
      const result = sm2Calculate(6, 2.5, 2, 5);
      expect(result.interval_days).toBe(Math.ceil(Math.ceil(6 * 2.5) * 1.5));
    });

    it('hard quality (3) applies 1.2x modifier', () => {
      const result = sm2Calculate(6, 2.5, 2, 3);
      // ceil(6 * 2.5) = 15, then ceil(15 * 1.2) = 18
      expect(result.interval_days).toBe(18);
    });

    it('never goes below ease 1.3', () => {
      let result = { interval_days: 1, ease_factor: 1.5, repetitions: 0 };
      // Fail multiple times
      for (let i = 0; i < 5; i++) {
        result = sm2Calculate(result.interval_days, result.ease_factor, result.repetitions, 0);
      }
      expect(result.ease_factor).toBe(1.3);
    });
  });

  describe('calculateMasteryLevel', () => {
    it('returns not_started for 0 attempts', () => {
      expect(calculateMasteryLevel(0, 0)).toBe('not_started');
    });

    it('returns weak for < 50% accuracy', () => {
      expect(calculateMasteryLevel(0.2, 10)).toBe('weak');
      expect(calculateMasteryLevel(0.4, 10)).toBe('weak');
      expect(calculateMasteryLevel(0.49, 10)).toBe('weak');
    });

    it('returns developing for 50-65% accuracy', () => {
      expect(calculateMasteryLevel(0.5, 10)).toBe('developing');
      expect(calculateMasteryLevel(0.6, 10)).toBe('developing');
    });

    it('returns strong for 65-80% accuracy', () => {
      expect(calculateMasteryLevel(0.7, 10)).toBe('strong');
    });

    it('returns mastered for >= 80% accuracy', () => {
      expect(calculateMasteryLevel(0.85, 20)).toBe('mastered');
    });
  });
});

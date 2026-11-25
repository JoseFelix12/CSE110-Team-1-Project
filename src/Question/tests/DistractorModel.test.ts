import { describe, it, expect } from "vitest";
import {
  OPERATIONS,
  SIGNS,
  DEFAULT_STRATEGIES,
  wrongOperation,
  offByRandom,
  squared,
  isValidDistractor,
} from "../DistractorModel";
import type { Operation } from "../DistractorModel";
import {
  AdditionQuestion,
  SubtractionQuestion,
  MultiplicationQuestion,
  DivisionQuestion,
} from "../QuestionModel";

/** rng that always returns the same value */
const constant = (v: number) => () => v;

/** rng that returns the given values in order, then repeats the last one */
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

/** Small seeded PRNG (mulberry32) so "random" tests are reproducible */
const seeded = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

describe("DistractorModel", () => {
  describe("OPERATIONS", () => {
    it("contains exactly the four arithmetic operations", () => {
      expect(Object.keys(OPERATIONS).sort()).toEqual(["*", "+", "-", "/"]);
    });

    it("computes addition", () => {
      expect(OPERATIONS["+"](7, 5)).toBe(12);
    });

    it("computes subtraction", () => {
      expect(OPERATIONS["-"](7, 5)).toBe(2);
      expect(OPERATIONS["-"](5, 7)).toBe(-2);
    });

    it("computes multiplication", () => {
      expect(OPERATIONS["*"](7, 5)).toBe(35);
    });

    it("computes division, including non-integer results", () => {
      expect(OPERATIONS["/"](10, 5)).toBe(2);
      expect(OPERATIONS["/"](7, 2)).toBe(3.5);
    });
  });

  describe("SIGNS", () => {
    it("is '+' and '-'", () => {
      expect([...SIGNS]).toEqual(["+", "-"]);
    });

    it("only contains keys of OPERATIONS", () => {
      SIGNS.forEach((s: Operation) => expect(OPERATIONS).toHaveProperty(s));
    });
  });

  describe("wrongOperation", () => {
    it("applies all four operations to the operands", () => {
      expect(wrongOperation(new AdditionQuestion(6, 3), constant(0))).toEqual([9, 3, 18, 2]);
    });

    it("includes the correct answer among its raw candidates (filtered later)", () => {
      const q = new MultiplicationQuestion(4, 5);
      expect(wrongOperation(q, constant(0))).toContain(q.answer);
    });

    it("can produce negative and non-integer candidates", () => {
      const result = wrongOperation(new SubtractionQuestion(3, 4), constant(0));
      expect(result).toContain(-1);
      expect(result).toContain(0.75);
    });

    it("works for division questions", () => {
      expect(wrongOperation(new DivisionQuestion(8, 2), constant(0))).toEqual([10, 6, 16, 4]);
    });
  });

  describe("offByRandom", () => {
    // rng is called twice: first for the "+" step, then for the "-" step
    it("uses the smallest step (25%) when rng is 0", () => {
      // answer 8 -> steps 2..6
      expect(offByRandom(new AdditionQuestion(4, 4), constant(0))).toEqual([10, 6]);
    });

    it("uses the largest step (75%) when rng is just under 1", () => {
      expect(offByRandom(new AdditionQuestion(4, 4), constant(0.9999))).toEqual([14, 2]);
    });

    it("picks the + and - steps independently", () => {
      expect(offByRandom(new AdditionQuestion(4, 4), sequence(0, 0.9999))).toEqual([10, 2]);
      expect(offByRandom(new AdditionQuestion(4, 4), sequence(0.9999, 0))).toEqual([14, 6]);
    });

    it("rounds the range inward to whole numbers", () => {
      // answer 10 -> 2.5..7.5 -> steps 3..7
      expect(offByRandom(new AdditionQuestion(5, 5), constant(0))).toEqual([13, 7]);
      expect(offByRandom(new AdditionQuestion(5, 5), constant(0.9999))).toEqual([17, 3]);
    });

    it("stays within 25%-75% of the answer", () => {
      const q = new MultiplicationQuestion(12, 10); // answer 120 -> steps 30..90
      expect(offByRandom(q, constant(0))).toEqual([150, 90]);
      expect(offByRandom(q, constant(0.9999))).toEqual([210, 30]);
      const rng = seeded(1);
      for (let i = 0; i < 100; i++) {
        offByRandom(q, rng).forEach(n => {
          expect(Math.abs(n - 120)).toBeGreaterThanOrEqual(30);
          expect(Math.abs(n - 120)).toBeLessThanOrEqual(90);
        });
      }
    });

    it("never includes the answer, or an off-by-one value for answers of 8 or more", () => {
      const rng = seeded(2);
      for (let answer = 4; answer <= 100; answer++) {
        for (let i = 0; i < 10; i++) {
          const result = offByRandom(new AdditionQuestion(answer, 0), rng);
          expect(result).not.toContain(answer);
          if (answer >= 8) result.forEach(n => expect(Math.abs(n - answer)).toBeGreaterThan(1));
        }
      }
    });

    it("falls back to a step of 1 for very small answers", () => {
      expect(offByRandom(new DivisionQuestion(1, 1), constant(0.9999))).toEqual([2, 0]);
      expect(offByRandom(new SubtractionQuestion(5, 5), constant(0.9999))).toEqual([1, -1]);
    });

    it("is reproducible with the same seed", () => {
      const q = new AdditionQuestion(40, 25);
      expect(offByRandom(q, seeded(7))).toEqual(offByRandom(q, seeded(7)));
    });
  });

  describe("squared", () => {
    it("returns the square of the answer", () => {
      expect(squared(new MultiplicationQuestion(2, 3), constant(0))).toEqual([36]);
    });

    it("doubles the answer instead when the square would exceed 100", () => {
      expect(squared(new AdditionQuestion(5, 6), constant(0))).toEqual([22]); // 11^2 = 121 > 100
    });

    it("keeps the square when it is exactly 100", () => {
      expect(squared(new AdditionQuestion(5, 5), constant(0))).toEqual([100]);
    });

    it("returns the answer itself for 0 and 1 (filtered later)", () => {
      expect(squared(new SubtractionQuestion(5, 5), constant(0))).toEqual([0]);
      expect(squared(new DivisionQuestion(1, 1), constant(0))).toEqual([1]);
    });
  });

  describe("DEFAULT_STRATEGIES", () => {
    it("is wrongOperation, squared, offByRandom in that order", () => {
      expect(DEFAULT_STRATEGIES).toEqual([wrongOperation, squared, offByRandom]);
    });

    it("every strategy returns an array of numbers", () => {
      const q = new AdditionQuestion(12, 34);
      DEFAULT_STRATEGIES.forEach(strategy => {
        const result = strategy(q, seeded(3));
        expect(Array.isArray(result)).toBe(true);
        result.forEach(n => expect(typeof n).toBe("number"));
      });
    });

    it("strategies do not mutate the question", () => {
      const q = new AdditionQuestion(12, 34);
      const snapshot = { ...q };
      DEFAULT_STRATEGIES.forEach(strategy => strategy(q, seeded(4)));
      expect({ ...q }).toEqual(snapshot);
    });
  });

  describe("isValidDistractor", () => {
    const q = new AdditionQuestion(10, 5); // answer 15

    it("accepts a positive integer that differs from the answer", () => {
      expect(isValidDistractor(14, q, new Set())).toBe(true);
    });

    it("accepts zero when the answer is not zero", () => {
      expect(isValidDistractor(0, q, new Set())).toBe(true);
    });

    it("rejects the correct answer", () => {
      expect(isValidDistractor(15, q, new Set())).toBe(false);
    });

    it("rejects zero when zero is the correct answer", () => {
      expect(isValidDistractor(0, new SubtractionQuestion(5, 5), new Set())).toBe(false);
    });

    it("rejects negative numbers", () => {
      expect(isValidDistractor(-1, q, new Set())).toBe(false);
    });

    it("rejects non-integers", () => {
      expect(isValidDistractor(14.5, q, new Set())).toBe(false);
    });

    it("rejects NaN and Infinity", () => {
      expect(isValidDistractor(NaN, q, new Set())).toBe(false);
      expect(isValidDistractor(Infinity, q, new Set())).toBe(false);
    });

    it("rejects values already chosen", () => {
      expect(isValidDistractor(14, q, new Set([14]))).toBe(false);
    });

    it("accepts a value not yet in a non-empty set", () => {
      expect(isValidDistractor(16, q, new Set([14]))).toBe(true);
    });

    it("does not modify the existing set", () => {
      const existing = new Set([14]);
      isValidDistractor(16, q, existing);
      expect([...existing]).toEqual([14]);
    });
  });
});

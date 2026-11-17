import { describe, it, expect } from "vitest";
import {
  OPERATIONS,
  SIGNS,
  DEFAULT_STRATEGIES,
  wrongOperation,
  offByOne,
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
      expect(wrongOperation(new AdditionQuestion(6, 3))).toEqual([9, 3, 18, 2]);
    });

    it("includes the correct answer among its raw candidates (filtered later)", () => {
      const q = new MultiplicationQuestion(4, 5);
      expect(wrongOperation(q)).toContain(q.answer);
    });

    it("can produce negative and non-integer candidates", () => {
      const result = wrongOperation(new SubtractionQuestion(3, 4));
      expect(result).toContain(-1);
      expect(result).toContain(0.75);
    });

    it("works for division questions", () => {
      expect(wrongOperation(new DivisionQuestion(8, 2))).toEqual([10, 6, 16, 4]);
    });
  });

  describe("offByOne", () => {
    it("returns answer + 1 and answer - 1", () => {
      expect(offByOne(new AdditionQuestion(10, 5))).toEqual([16, 14]);
    });

    it("returns -1 for a zero answer (filtered later)", () => {
      expect(offByOne(new SubtractionQuestion(5, 5))).toEqual([1, -1]);
    });
  });

  describe("squared", () => {
    it("returns the square of the answer", () => {
      expect(squared(new MultiplicationQuestion(2, 3))).toEqual([36]);
    });

    it("returns the answer itself for 0 and 1 (filtered later)", () => {
      expect(squared(new SubtractionQuestion(5, 5))).toEqual([0]);
      expect(squared(new DivisionQuestion(1, 1))).toEqual([1]);
    });
  });

  describe("DEFAULT_STRATEGIES", () => {
    it("contains wrongOperation, offByOne and squared", () => {
      expect(DEFAULT_STRATEGIES).toEqual([wrongOperation, offByOne, squared]);
    });

    it("every strategy returns an array of numbers", () => {
      const q = new AdditionQuestion(12, 34);
      DEFAULT_STRATEGIES.forEach(strategy => {
        const result = strategy(q);
        expect(Array.isArray(result)).toBe(true);
        result.forEach(n => expect(typeof n).toBe("number"));
      });
    });

    it("strategies do not mutate the question", () => {
      const q = new AdditionQuestion(12, 34);
      const snapshot = { ...q };
      DEFAULT_STRATEGIES.forEach(strategy => strategy(q));
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

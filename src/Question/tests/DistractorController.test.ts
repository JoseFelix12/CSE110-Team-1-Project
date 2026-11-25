import { describe, it, expect, vi } from "vitest";
import { DistractorController } from "../DistractorController";
import type { DistractorStrategy } from "../DistractorModel";
import { QuestionController, WordProblemAdapter } from "../QuestionController";
import type { Question } from "../QuestionModel";
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

/** Shared checks every set of distractors must pass */
const expectValidDistractors = (result: number[], q: Question, count: number) => {
  expect(result).toHaveLength(count);
  expect(new Set(result).size).toBe(count);
  result.forEach(n => {
    expect(Number.isInteger(n)).toBe(true);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).not.toBe(q.answer);
  });
};

describe("DistractorController", () => {
  describe("constructor", () => {
    it("works with no arguments", () => {
      const dc = new DistractorController();
      expectValidDistractors(dc.genIncorrectAnswers(new AdditionQuestion(20, 22), 3), new AdditionQuestion(20, 22), 3);
    });

    it("uses the injected rng", () => {
      const rng = vi.fn(() => 0);
      new DistractorController(rng).randomSign();
      expect(rng).toHaveBeenCalled();
    });

    it("uses the injected strategies", () => {
      const strategy = vi.fn<DistractorStrategy>(() => [100, 200]);
      const q = new AdditionQuestion(1, 2);
      const result = new DistractorController(constant(0), [strategy]).genIncorrectAnswers(q, 2);
      expect(strategy).toHaveBeenCalledWith(q, expect.any(Function));
      expect(result.sort((a, b) => a - b)).toEqual([100, 200]);
    });
  });

  describe("shuffle", () => {
    it("returns the same elements", () => {
      const dc = new DistractorController(seeded(1));
      const input = [1, 2, 3, 4, 5, 6];
      expect([...dc.shuffle(input)].sort((a, b) => a - b)).toEqual(input);
    });

    it("does not mutate the input", () => {
      const dc = new DistractorController(seeded(1));
      const input = [1, 2, 3, 4];
      dc.shuffle(input);
      expect(input).toEqual([1, 2, 3, 4]);
    });

    it("returns a new array", () => {
      const input = [1, 2, 3];
      expect(new DistractorController().shuffle(input)).not.toBe(input);
    });

    it("keeps the order when rng is always just under 1", () => {
      expect(new DistractorController(constant(0.9999)).shuffle([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
    });

    it("produces the expected Fisher-Yates order when rng is always 0", () => {
      // i=3 swap(3,0) -> [4,2,3,1]; i=2 swap(2,0) -> [3,2,4,1]; i=1 swap(1,0) -> [2,3,4,1]
      expect(new DistractorController(constant(0)).shuffle([1, 2, 3, 4])).toEqual([2, 3, 4, 1]);
    });

    it("handles empty and single-element arrays", () => {
      const dc = new DistractorController();
      expect(dc.shuffle([])).toEqual([]);
      expect(dc.shuffle([42])).toEqual([42]);
    });

    it("works with non-number items", () => {
      expect(new DistractorController(seeded(3)).shuffle(["a", "b", "c"]).sort()).toEqual(["a", "b", "c"]);
    });

    it("is reproducible with the same seed", () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8];
      expect(new DistractorController(seeded(9)).shuffle(input))
        .toEqual(new DistractorController(seeded(9)).shuffle(input));
    });
  });

  describe("randomOperation", () => {
    it("picks the first operation when rng is 0", () => {
      expect(new DistractorController(constant(0)).randomOperation(["*", "/"])).toBe("*");
    });

    it("picks the last operation when rng is just under 1", () => {
      expect(new DistractorController(constant(0.9999)).randomOperation(["*", "/"])).toBe("/");
    });

    it("chooses from all four operations by default", () => {
      const dc = new DistractorController(seeded(5));
      const seen = new Set<string>();
      for (let i = 0; i < 200; i++) seen.add(dc.randomOperation());
      expect([...seen].sort()).toEqual(["*", "+", "-", "/"]);
    });

    it("only returns operations from the given list", () => {
      const dc = new DistractorController(seeded(6));
      for (let i = 0; i < 100; i++) {
        expect(["+", "*"]).toContain(dc.randomOperation(["+", "*"]));
      }
    });
  });

  describe("randomSign", () => {
    it("returns '+' when rng < 0.5", () => {
      expect(new DistractorController(constant(0)).randomSign()).toBe("+");
      expect(new DistractorController(constant(0.49)).randomSign()).toBe("+");
    });

    it("returns '-' when rng >= 0.5", () => {
      expect(new DistractorController(constant(0.5)).randomSign()).toBe("-");
      expect(new DistractorController(constant(0.9999)).randomSign()).toBe("-");
    });

    it("produces both signs over many calls", () => {
      const dc = new DistractorController(seeded(7));
      const seen = new Set<string>();
      for (let i = 0; i < 50; i++) seen.add(dc.randomSign());
      expect([...seen].sort()).toEqual(["+", "-"]);
    });
  });

  describe("randomOffset", () => {
    // rng is called twice: first for the sign, then for the step size
    it("adds the smallest step (+1)", () => {
      expect(new DistractorController(sequence(0, 0)).randomOffset(50)).toBe(51);
    });

    it("adds the largest step (20% of 50 = +10)", () => {
      expect(new DistractorController(sequence(0, 0.9999)).randomOffset(50)).toBe(60);
    });

    it("subtracts the smallest step (-1)", () => {
      expect(new DistractorController(sequence(0.5, 0)).randomOffset(50)).toBe(49);
    });

    it("subtracts the largest step (-10)", () => {
      expect(new DistractorController(sequence(0.5, 0.9999)).randomOffset(50)).toBe(40);
    });

    it("uses a step of 1 for small answers", () => {
      expect(new DistractorController(sequence(0, 0.9999)).randomOffset(2)).toBe(3);
      expect(new DistractorController(sequence(0.5, 0.9999)).randomOffset(0)).toBe(-1);
    });

    it("respects a custom maxOffset", () => {
      // 50% of 10 -> steps 1..5
      expect(new DistractorController(sequence(0, 0.9999), undefined, 0.5).randomOffset(10)).toBe(15);
    });

    it("never returns the answer itself", () => {
      const dc = new DistractorController(seeded(11));
      for (const answer of [0, 1, 5, 18, 99, 625]) {
        for (let i = 0; i < 100; i++) expect(dc.randomOffset(answer)).not.toBe(answer);
      }
    });

    it("always stays within maxOffset of the answer", () => {
      const dc = new DistractorController(seeded(12));
      for (let i = 0; i < 200; i++) {
        expect(Math.abs(dc.randomOffset(100) - 100)).toBeLessThanOrEqual(20);
      }
    });
  });

  describe("genIncorrectAnswers", () => {
    it("returns an empty array when count is 0", () => {
      expect(new DistractorController().genIncorrectAnswers(new AdditionQuestion(3, 4), 0)).toEqual([]);
    });

    it.each([1, 2, 3, 5])("returns exactly %i valid distractors", count => {
      const q = new AdditionQuestion(45, 37);
      expectValidDistractors(new DistractorController(seeded(count)).genIncorrectAnswers(q, count), q, count);
    });

    it("prefers strategy candidates over random offsets", () => {
      const q = new AdditionQuestion(10, 10);
      const result = new DistractorController(seeded(1), [() => [7, 8, 9]]).genIncorrectAnswers(q, 2);
      result.forEach(n => expect([7, 8, 9]).toContain(n));
    });

    it("takes one distractor from each strategy before reusing any", () => {
      const q = new AdditionQuestion(10, 10); // answer 20
      const a: DistractorStrategy = () => [1, 2, 3];
      const b: DistractorStrategy = () => [4, 5, 6];
      const c: DistractorStrategy = () => [7, 8, 9];
      for (let seed = 0; seed < 20; seed++) {
        const result = new DistractorController(seeded(seed), [a, b, c]).genIncorrectAnswers(q, 3);
        expect([1, 2, 3]).toContain(result[0]);
        expect([4, 5, 6]).toContain(result[1]);
        expect([7, 8, 9]).toContain(result[2]);
      }
    });

    it("cycles back to the first strategy when more distractors are needed", () => {
      const q = new AdditionQuestion(10, 10);
      const result = new DistractorController(constant(0.9999), [() => [1, 2], () => [3]])
        .genIncorrectAnswers(q, 3);
      expect(result).toEqual([1, 3, 2]);
    });

    it("skips an invalid candidate and tries the strategy's next one", () => {
      const q = new AdditionQuestion(10, 5); // answer 15
      const result = new DistractorController(constant(0.9999), [() => [15, -1, 9], () => [4]])
        .genIncorrectAnswers(q, 2);
      expect(result).toEqual([9, 4]);
    });

    it("uses wrongOperation, squared, then offByRandom for 2 x 2", () => {
      const q = new MultiplicationQuestion(2, 2); // answer 4
      for (let seed = 0; seed < 50; seed++) {
        const [wrongOp, sq, off] = new DistractorController(seeded(seed)).genIncorrectAnswers(q, 3);
        expect([0, 1]).toContain(wrongOp); // 2+2 and 2*2 equal the answer; 2-2=0 or 2/2=1
        expect(sq).toBe(16);
        expect([1, 2, 3, 5, 6, 7]).toContain(off);
        expect([wrongOp, sq]).not.toContain(off);
      }
    });

    it("filters out invalid strategy candidates", () => {
      const q = new AdditionQuestion(10, 5); // answer 15
      const strategy: DistractorStrategy = () => [-1, 2.5, 15, NaN, 7, 7];
      // rng 0.9999 -> random offsets go down from 15, so only 7 can come from the strategy
      const result = new DistractorController(constant(0.9999), [strategy]).genIncorrectAnswers(q, 1);
      expect(result).toEqual([7]);
    });

    it("tops up with random offsets when strategies are not enough", () => {
      const q = new AdditionQuestion(25, 25); // answer 50
      const result = new DistractorController(seeded(2), []).genIncorrectAnswers(q, 3);
      expectValidDistractors(result, q, 3);
      result.forEach(n => expect(Math.abs(n - 50)).toBeLessThanOrEqual(10));
    });

    it("falls back to counting up when random offsets keep failing", () => {
      // answer 0, rng 0.9999 -> every offset is -1 (invalid), so the fallback runs
      const q = new SubtractionQuestion(5, 5);
      const result = new DistractorController(constant(0.9999), []).genIncorrectAnswers(q, 3);
      expect(result).toEqual([1, 2, 3]);
    });

    it("fallback skips values already chosen", () => {
      const q = new SubtractionQuestion(5, 5); // answer 0
      const result = new DistractorController(constant(0.9999), [() => [2]]).genIncorrectAnswers(q, 3);
      expect(result).toEqual([2, 1, 3]);
    });

    it("can produce many distractors without repeating", () => {
      const q = new DivisionQuestion(1, 1);
      expectValidDistractors(new DistractorController(seeded(4)).genIncorrectAnswers(q, 50), q, 50);
    });

    it.each([
      ["answer 0", new SubtractionQuestion(10, 10)],
      ["answer 1", new DivisionQuestion(1, 1)],
      ["small multiplication", new MultiplicationQuestion(1, 1)],
      ["large multiplication", new MultiplicationQuestion(25, 25)],
      ["2-digit addition", new AdditionQuestion(99, 99)],
      ["2-digit subtraction", new SubtractionQuestion(99, 10)],
      ["2-digit division", new DivisionQuestion(90, 9)],
    ])("handles %s", (_label, q) => {
      for (let seed = 0; seed < 50; seed++) {
        expectValidDistractors(new DistractorController(seeded(seed)).genIncorrectAnswers(q, 3), q, 3);
      }
    });

    it("works for every question level from QuestionController", () => {
      const qc = new QuestionController();
      const dc = new DistractorController(seeded(8));
      for (let level = 1; level <= 5; level++) {
        for (let i = 0; i < 100; i++) {
          const q = qc.generateQuestion(level);
          expectValidDistractors(dc.genIncorrectAnswers(q, 3), q, 3);
        }
      }
    });

    it("does not mutate the question", () => {
      const q = new AdditionQuestion(12, 30);
      const snapshot = { ...q };
      new DistractorController().genIncorrectAnswers(q, 3);
      expect({ ...q }).toEqual(snapshot);
    });

    it("is reproducible with the same seed", () => {
      const q = new MultiplicationQuestion(7, 8);
      expect(new DistractorController(seeded(42)).genIncorrectAnswers(q, 3))
        .toEqual(new DistractorController(seeded(42)).genIncorrectAnswers(q, 3));
    });
  });

  describe("genAnswerChoices", () => {
    it.each([1, 2, 3, 4, 6])("returns %i unique choices", numChoices => {
      const q = new AdditionQuestion(20, 15);
      const { choices } = new DistractorController(seeded(numChoices)).genAnswerChoices(q, numChoices);
      expect(choices).toHaveLength(numChoices);
      expect(new Set(choices).size).toBe(numChoices);
    });

    it("contains the correct answer exactly once, at correctIndex", () => {
      const dc = new DistractorController(seeded(13));
      const qc = new QuestionController();
      for (let level = 1; level <= 5; level++) {
        for (let i = 0; i < 50; i++) {
          const q = qc.generateQuestion(level);
          const { choices, correctIndex } = dc.genAnswerChoices(q, 4);
          expect(choices[correctIndex]).toBe(q.answer);
          expect(choices.filter(c => c === q.answer)).toHaveLength(1);
        }
      }
    });

    it("returns only the answer when numChoices is 1", () => {
      const q = new MultiplicationQuestion(3, 4);
      expect(new DistractorController().genAnswerChoices(q, 1)).toEqual({ choices: [12], correctIndex: 0 });
    });

    it("places the correct answer in different positions", () => {
      const dc = new DistractorController(seeded(14));
      const q = new AdditionQuestion(30, 12);
      const positions = new Set<number>();
      for (let i = 0; i < 100; i++) positions.add(dc.genAnswerChoices(q, 4).correctIndex);
      expect([...positions].sort()).toEqual([0, 1, 2, 3]);
    });

    it("works with word problems from the WordProblemAdapter", () => {
      const adapter = new WordProblemAdapter(new QuestionController());
      const dc = new DistractorController(seeded(15));
      for (let i = 0; i < 20; i++) {
        const q = adapter.generateWordProblem(1);
        const { choices, correctIndex } = dc.genAnswerChoices(q, 4);
        expect(choices[correctIndex]).toBe(q.answer);
      }
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  QuestionController,
  WordProblemAdapter,
  fillTemplate,
} from "../QuestionController.ts";
import type { Question } from "../QuestionModel.ts";
import { WORD_PROBLEM_TEMPLATES } from "../../constants.ts";

describe("WordProblemAdapter", () => {
  let adaptee: QuestionController;
  let adapter: WordProblemAdapter;

  // Creates a predictable question for testing
  const createQuestion = (
    a: number,
    b: number,
    operator: Question["operator"],
  ): Question => {
    let answer: number;

    switch (operator) {
      case "addition":
        answer = a + b;
        break;
      case "subtraction":
        answer = a - b;
        break;
      case "multiplication":
        answer = a * b;
        break;
      case "division":
        answer = a / b;
        break;
    }

    return {
      a,
      b,
      answer,
      text: `${a} + ${b}`,
      operator,
    };
  };

  beforeEach(() => {
    adaptee = {
      generateQuestion: vi.fn(),
    } as unknown as QuestionController;

    adapter = new WordProblemAdapter(adaptee);

    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1: Generates a word problem using a level ID
  it("generates a word problem for the specified level", () => {
    const question = createQuestion(3, 4, "addition");

    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    const result = adapter.generateWordProblem(1);

    expect(adaptee.generateQuestion).toHaveBeenCalledWith(1);
    expect(result).toBe(question);
  });

  // Test 2: Replaces placeholders with actual numbers
  it("replaces {a} and {b} in the word problem template", () => {
    const question = createQuestion(3, 4, "addition");

    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    const result = adapter.generateWordProblem(1);

    const template = WORD_PROBLEM_TEMPLATES.addition[0];
    const expectedText = fillTemplate(template, { a: 3, b: 4 });

    expect(result.text).toBe(expectedText);
    expect(result.text).not.toContain("{a}");
    expect(result.text).not.toContain("{b}");
  });

  // Test 3: Selects the correct template based on generated operator
  it("uses the generated question's operator to select a template", () => {
    const question = createQuestion(3, 4, "multiplication");

    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    const result = adapter.generateWordProblem(2);

    const expectedText = fillTemplate(WORD_PROBLEM_TEMPLATES.multiplication[0], { a: 3, b: 4 });

    expect(adaptee.generateQuestion).toHaveBeenCalledWith(2);
    expect(result.text).toBe(expectedText);
  });

  // Test 4: Preserves the original question's answer
  it("preserves the original question's answer", () => {
    const question = createQuestion(5, 6, "addition");

    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    const result = adapter.generateWordProblem(1);

    expect(result.answer).toBe(11);
  });

  // Test 5: Generates multiple word problems
  it("generates the requested number of word problems", () => {
    const question1 = createQuestion(2, 3, "addition");
    const question2 = createQuestion(4, 5, "addition");
    const question3 = createQuestion(6, 7, "addition");

    vi.mocked(adaptee.generateQuestion)
      .mockReturnValueOnce(question1)
      .mockReturnValueOnce(question2)
      .mockReturnValueOnce(question3);

    const results = adapter.generateMultipleWordProblems(1, 3);

    expect(results).toHaveLength(3);
    expect(adaptee.generateQuestion).toHaveBeenCalledTimes(3);
    expect(adaptee.generateQuestion).toHaveBeenCalledWith(1);
  });

  // Test 6: Throws an error when no templates exist
  it("throws an error when no templates exist for the operator", () => {
    const question = {
      a: 3,
      b: 4,
      answer: 7,
      text: "3 + 4",
      operator: "invalid",
    } as unknown as Question;

    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    expect(() => adapter.generateWordProblem(1)).toThrow(
      "No templates available for: invalid",
    );
  });

  describe("generateMultipleWordProblems", () => {
    it("generates multiple addition word problems with correct text", () => {
      const question1 = createQuestion(2, 3, "addition");
      const question2 = createQuestion(4, 5, "addition");
      const question3 = createQuestion(6, 7, "addition");

      vi.mocked(adaptee.generateQuestion)
        .mockReturnValueOnce(question1)
        .mockReturnValueOnce(question2)
        .mockReturnValueOnce(question3);

      const results = adapter.generateMultipleWordProblems(1, 3);

      expect(results).toHaveLength(3);

      expect(results[0].text).toBe(
        fillTemplate(WORD_PROBLEM_TEMPLATES.addition[0], { a: 2, b: 3 }),
      );

      expect(results[1].text).toBe(
        fillTemplate(WORD_PROBLEM_TEMPLATES.addition[1], { a: 4, b: 5 }),
      );

      expect(results[2].text).toBe(
        fillTemplate(WORD_PROBLEM_TEMPLATES.addition[2], { a: 6, b: 7 }),
      );
    });

    it("generates multiple multiplication word problems with correct text", () => {
      const question1 = createQuestion(3, 4, "multiplication");
      const question2 = createQuestion(5, 6, "multiplication");

      vi.mocked(adaptee.generateQuestion)
        .mockReturnValueOnce(question1)
        .mockReturnValueOnce(question2);

      const results = adapter.generateMultipleWordProblems(2, 2);

      expect(results).toHaveLength(2);

      expect(results[0].text).toBe(
        fillTemplate(WORD_PROBLEM_TEMPLATES.multiplication[0], { a: 3, b: 4 }),
      );

      expect(results[1].text).toBe(
        fillTemplate(WORD_PROBLEM_TEMPLATES.multiplication[1], { a: 5, b: 6 }),
      );
    });

    it("returns an empty array when count is zero", () => {
      const results = adapter.generateMultipleWordProblems(1, 0);

      expect(results).toEqual([]);
      expect(adaptee.generateQuestion).not.toHaveBeenCalled();
    });
  });

  it("generates a subtraction word problem", () => {
    const question = createQuestion(8, 3, "subtraction");
    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    const result = adapter.generateWordProblem(1);

    expect(result.text).toBe(
      fillTemplate(WORD_PROBLEM_TEMPLATES.subtraction[0], { a: 8, b: 3 }),
    );
  });

  it("generates a division word problem", () => {
    const question = createQuestion(12, 3, "division");
    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    const result = adapter.generateWordProblem(3);

    expect(result.text).toBe(
      fillTemplate(WORD_PROBLEM_TEMPLATES.division[0], { a: 12, b: 3 }),
    );
  });

  it("generates a word problem for level 4", () => {
    const question = createQuestion(5, 6, "multiplication");
    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    adapter.generateWordProblem(4);

    expect(adaptee.generateQuestion).toHaveBeenCalledWith(4);
  });

  it("generates a word problem for level 5", () => {
    const question = createQuestion(12, 3, "division");
    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    adapter.generateWordProblem(5);

    expect(adaptee.generateQuestion).toHaveBeenCalledWith(5);
  });

  it("throws an error when an invalid level ID is provided", () => {
    vi.mocked(adaptee.generateQuestion).mockImplementation(() => {
      throw new Error("Invalid Id");
    });

    expect(() => adapter.generateWordProblem(99)).toThrow("Invalid Id");
  });

  describe("fillTemplate", () => {
    it("uses the singular form when the number is 1", () => {
      expect(
        fillTemplate("{a} {a:liter|liters} among {b} {b:car|cars}", { a: 1, b: 1 }),
      ).toBe("1 liter among 1 car");
    });

    it("uses the plural form for any other number, including 0", () => {
      expect(
        fillTemplate("{a} {a:liter|liters} among {b} {b:car|cars}", { a: 0, b: 3 }),
      ).toBe("0 liters among 3 cars");
    });

    it("handles verb agreement with multi-word forms", () => {
      expect(fillTemplate("{b} {b:car pulls|cars pull} in", { b: 1 })).toBe("1 car pulls in");
      expect(fillTemplate("{b} {b:car pulls|cars pull} in", { b: 2 })).toBe("2 cars pull in");
    });

    it("fills every template with no braces left over, for 1 and for many", () => {
      for (const templates of Object.values(WORD_PROBLEM_TEMPLATES)) {
        for (const t of templates) {
          for (const n of [1, 5]) {
            const text = fillTemplate(t, { a: n, b: n });
            expect(text).not.toMatch(/[{}|]/);
          }
        }
      }
    });

    it("never pairs the number 1 with a plural noun in any template", () => {
      const pluralAfterOne = /\b1 (?:\w+ )?(?:liters|cars|coins|stickers|kilometers|trophies|laps|boosts|wrenches|cones|tires|shelves|rows|hours|stops|seconds|races|cans|upgrades|bolts)\b/;
      for (const templates of Object.values(WORD_PROBLEM_TEMPLATES)) {
        for (const t of templates) {
          for (const [a, b] of [[1, 1], [1, 7], [7, 1]]) {
            expect(fillTemplate(t, { a, b })).not.toMatch(pluralAfterOne);
          }
        }
      }
    });
  });

  describe("template rotation", () => {
    const templateIndex = (op: string, text: string, a: number, b: number) =>
      WORD_PROBLEM_TEMPLATES[op].findIndex(t => fillTemplate(t, { a, b }) === text);

    beforeEach(() => {
      vi.mocked(Math.random).mockRestore();
    });

    it.each(["addition", "subtraction", "multiplication", "division"] as const)(
      "uses every %s template once before any repeats",
      op => {
        const n = WORD_PROBLEM_TEMPLATES[op].length;
        vi.mocked(adaptee.generateQuestion).mockImplementation(() => createQuestion(6, 2, op));
        const seen = new Set<number>();
        for (let i = 0; i < n; i++) {
          seen.add(templateIndex(op, adapter.generateWordProblem(1).text, 6, 2));
        }
        expect(seen.size).toBe(n);
        expect(seen.has(-1)).toBe(false);
      },
    );

    it("keeps separate pools for each operator", () => {
      const n = WORD_PROBLEM_TEMPLATES.addition.length;
      const seen = new Set<number>();
      for (let i = 0; i < n; i++) {
        vi.mocked(adaptee.generateQuestion).mockReturnValueOnce(createQuestion(3, 4, "addition"));
        seen.add(templateIndex("addition", adapter.generateWordProblem(1).text, 3, 4));
        // interleave other operators; they must not use up addition templates
        vi.mocked(adaptee.generateQuestion).mockReturnValueOnce(createQuestion(3, 4, "multiplication"));
        adapter.generateWordProblem(2);
      }
      expect(seen.size).toBe(n);
    });

    it("never repeats a template back to back, even after the pool refills", () => {
      vi.mocked(adaptee.generateQuestion).mockImplementation(() => createQuestion(6, 2, "addition"));
      let prev = -1;
      for (let i = 0; i < 200; i++) {
        const idx = templateIndex("addition", adapter.generateWordProblem(1).text, 6, 2);
        expect(idx).not.toBe(prev);
        prev = idx;
      }
    });

    it("handles 20 division word problems in a row", () => {
      const templates = WORD_PROBLEM_TEMPLATES.division;
      const n = templates.length;
      vi.mocked(adaptee.generateQuestion).mockImplementation(() => createQuestion(6, 2, "division"));

      const picks: number[] = [];
      for (let i = 0; i < 20; i++) {
        const q = adapter.generateWordProblem(3);
        expect(q.answer).toBe(3);
        picks.push(templateIndex("division", q.text, 6, 2));
      }

      // every question is a real division template
      expect(picks).not.toContain(-1);
      // each full round (first n, next n) uses every template exactly once
      expect(new Set(picks.slice(0, n)).size).toBe(n);
      expect(new Set(picks.slice(n, 2 * n)).size).toBe(n);
      // the partial last round has no repeats either
      const rest = picks.slice(2 * n);
      expect(new Set(rest).size).toBe(rest.length);
      // never the same template twice in a row, including across refills
      for (let i = 1; i < picks.length; i++) {
        expect(picks[i]).not.toBe(picks[i - 1]);
      }
      // usage stays balanced: no template used more than one extra time
      const counts = templates.map((_, t) => picks.filter(p => p === t).length);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    });

    it("a new adapter starts with a fresh pool", () => {
      vi.mocked(adaptee.generateQuestion).mockImplementation(() => createQuestion(6, 2, "addition"));
      const n = WORD_PROBLEM_TEMPLATES.addition.length;
      for (let i = 0; i < n; i++) adapter.generateWordProblem(1);
      const fresh = new WordProblemAdapter(adaptee);
      const seen = new Set<number>();
      for (let i = 0; i < n; i++) {
        seen.add(templateIndex("addition", fresh.generateWordProblem(1).text, 6, 2));
      }
      expect(seen.size).toBe(n);
    });
  });
});

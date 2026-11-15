import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  QuestionController,
  WordProblemAdapter,
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
    const expectedText = template.replace("{a}", "3").replace("{b}", "4");

    expect(result.text).toBe(expectedText);
    expect(result.text).not.toContain("{a}");
    expect(result.text).not.toContain("{b}");
  });

  // Test 3: Selects the correct template based on generated operator
  it("uses the generated question's operator to select a template", () => {
    const question = createQuestion(3, 4, "multiplication");

    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    const result = adapter.generateWordProblem(2);

    const expectedText = WORD_PROBLEM_TEMPLATES.multiplication[0]
      .replace("{a}", "3")
      .replace("{b}", "4");

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
        WORD_PROBLEM_TEMPLATES.addition[0]
          .replace("{a}", "2")
          .replace("{b}", "3"),
      );

      expect(results[1].text).toBe(
        WORD_PROBLEM_TEMPLATES.addition[0]
          .replace("{a}", "4")
          .replace("{b}", "5"),
      );

      expect(results[2].text).toBe(
        WORD_PROBLEM_TEMPLATES.addition[0]
          .replace("{a}", "6")
          .replace("{b}", "7"),
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
        WORD_PROBLEM_TEMPLATES.multiplication[0]
          .replace("{a}", "3")
          .replace("{b}", "4"),
      );

      expect(results[1].text).toBe(
        WORD_PROBLEM_TEMPLATES.multiplication[0]
          .replace("{a}", "5")
          .replace("{b}", "6"),
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
      WORD_PROBLEM_TEMPLATES.subtraction[0]
        .replace("{a}", "8")
        .replace("{b}", "3"),
    );
  });

  it("generates a division word problem", () => {
    const question = createQuestion(12, 3, "division");
    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    const result = adapter.generateWordProblem(3);

    expect(result.text).toBe(
      WORD_PROBLEM_TEMPLATES.division[0]
        .replace("{a}", "12")
        .replace("{b}", "3"),
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
});

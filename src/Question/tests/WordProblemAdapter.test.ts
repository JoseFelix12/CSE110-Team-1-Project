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

  //* Creates a predictable question for testing
  const createQuestion = (a: number, b: number): Question => {
    return {
      a,
      b,
      answer: a + b,
      text: `${a} + ${b}`,
      type: "addition",
    } as unknown as Question;
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

  //* Test 1: Generates a word problem with a specified type
  it("generates a word problem with the specified question type", () => {
    const question = createQuestion(3, 4);

    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    const result = adapter.generateWordProblem("addition");

    expect(adaptee.generateQuestion).toHaveBeenCalledWith("addition");
    expect(result).toBe(question);
  });

  //* Test 2: Replaces placeholders with actual numbers
  it("replaces {a} and {b} in the word problem template", () => {
    const question = createQuestion(3, 4);

    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    const result = adapter.generateWordProblem("addition");

    const template = WORD_PROBLEM_TEMPLATES.addition[0];
    const expectedText = template.replace("{a}", "3").replace("{b}", "4");

    expect(result.text).toBe(expectedText);
    expect(result.text).not.toContain("{a}");
    expect(result.text).not.toContain("{b}");
  });

  //* Test 3: Randomly selects a question type if none is provided
  it("randomly selects a question type when none is specified", () => {
    const question = createQuestion(3, 4);

    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    adapter.generateWordProblem();

    //* Math.random() returns 0, so addition is selected
    expect(adaptee.generateQuestion).toHaveBeenCalledWith("addition");
  });

  //* Test 4: Preserves the original question's answer
  it("preserves the original question's answer", () => {
    const question = createQuestion(5, 6);

    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    const result = adapter.generateWordProblem("addition");

    expect(result.answer).toBe(11);
  });

  //* Test 5: Generates multiple word problems
  it("generates the requested number of word problems", () => {
    const question1 = createQuestion(2, 3);
    const question2 = createQuestion(4, 5);
    const question3 = createQuestion(6, 7);

    vi.mocked(adaptee.generateQuestion)
      .mockReturnValueOnce(question1)
      .mockReturnValueOnce(question2)
      .mockReturnValueOnce(question3);

    const results = adapter.generateMultipleWordProblems("addition", 3);

    expect(results).toHaveLength(3);
    expect(adaptee.generateQuestion).toHaveBeenCalledTimes(3);
  });

  //* Test 6: Throws an error when no templates exist
  it("throws an error when no templates exist for the question type", () => {
    const question = createQuestion(3, 4);

    vi.mocked(adaptee.generateQuestion).mockReturnValue(question);

    expect(() => adapter.generateWordProblem("invalid")).toThrow(
      "No templates available for question type: invalid",
    );
  });

  describe("generateMultipleWordProblems", () => {
    it("generates multiple addition word problems with correct text", () => {
      const question1 = createQuestion(2, 3);
      const question2 = createQuestion(4, 5);
      const question3 = createQuestion(6, 7);

      vi.mocked(adaptee.generateQuestion)
        .mockReturnValueOnce(question1)
        .mockReturnValueOnce(question2)
        .mockReturnValueOnce(question3);

      const results = adapter.generateMultipleWordProblems("addition", 3);

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
      const question1 = createQuestion(3, 4);
      const question2 = createQuestion(5, 6);

      vi.mocked(adaptee.generateQuestion)
        .mockReturnValueOnce(question1)
        .mockReturnValueOnce(question2);

      const results = adapter.generateMultipleWordProblems("multiplication", 2);

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
      const results = adapter.generateMultipleWordProblems("addition", 0);

      expect(results).toEqual([]);
      expect(adaptee.generateQuestion).not.toHaveBeenCalled();
    });
  });
});

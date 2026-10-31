import { describe, it, expect } from "vitest";
import {
  QuestionGenerator,
  createQuestionGenerator,
} from "../questionGenerator";
import type { Question } from "../questionGenerator";

describe("QuestionGenerator", () => {
  it("creates a multiplication question", () => {
    const generator = new QuestionGenerator({
      operators: ["*"],
      min: 1,
      max: 10,
    });

    const question = generator.nextQuestion();
    expect(question.operator).toBe("*");
    expect(question.type).toBe("plain");
    expect(question.text).toContain("×");
    expect(question.a).toBeGreaterThanOrEqual(1);
    expect(question.a).toBeLessThanOrEqual(10);
    expect(question.b).toBeGreaterThanOrEqual(1);
    expect(question.b).toBeLessThanOrEqual(10);
  });

  it("generates division questions with whole-number answers", () => {
    const generator = new QuestionGenerator({
      operators: ["/"],
      min: 1,
      max: 10,
    });

    const questions = generator.generate(20);

    for (const question of questions) {
      expect(question.operator).toBe("/");
      expect(question.b).toBeGreaterThan(0);
      expect(question.a % question.b).toBe(0);
      expect(question.text).toContain("÷");
    }
  });

  it("Different ID assigned to each question", () => {
    const generator = new QuestionGenerator({
      operators: ["*"],
      min: 1,
      max: 10,
    });

    const questions = generator.generate(3);

    expect(questions.map((q: Question) => q.id)).toEqual([1, 2, 3]);
  });


  it("generates plain questions", () => {
    const generator = new QuestionGenerator({
      operators: ["*"],
      min: 1,
      max: 10,
    });

    const question = generator.nextQuestion();

    expect(question.type).toBe("plain");
  });

  it.todo("generates word questions", () => {
    // const generator = new QuestionGenerator({
    //   operators: ["*"],
    //   min: 1,
    //   max: 10,
    // });

    // const question = generator.nextQuestion();

    // expect(question.type).toBe("word");

  });

  it("Generates the right number of questions", () => {
    const generator = new QuestionGenerator({
      operators: ["*", "/"],
      min: 1,
      max: 10,
    });

    expect(generator.generate(5)).toHaveLength(5);
  });

  it("rejects an empty operator list", () => {
    expect(
      () =>
        new QuestionGenerator({
          operators: [],
          min: 1,
          max: 10,
        }),
    ).toThrow();
  });

  it("rejects invalid operator", () => {
    expect(() => new QuestionGenerator({
          operators: ["+"],
          min: 1,
          max: 10,
        }),
    ).toThrow();
  });

  it("rejects non-integer bounds", () => {
    expect(
      () =>
        new QuestionGenerator({
          operators: ["*"],
          min: 1.5,
          max: 10,
        }),
    ).toThrow();
  });


  it("rejects a negative minimum", () => {
    expect(
      () =>
        new QuestionGenerator({
          operators: ["*"],
          min: -1,
          max: 10,
        }),
    ).toThrow();
  });

  it("rejects a maximum smaller than the minimum", () => {
    expect(
      () =>
        new QuestionGenerator({
          operators: ["*"],
          min: 5,
          max: 3,
        }),
    ).toThrow();
  });

  it("rejects zero as the maximum", () => {
    expect(
      () =>
        new QuestionGenerator({
          operators: ["*"],
          min: 0,
          max: 0,
        }),
    ).toThrow();
  });


  it("rejects a zero question count", () => {
    const generator = new QuestionGenerator({
      operators: ["*"],
      min: 1,
      max: 10,
    });

    expect(() => generator.generate(0)).toThrow();
  });


  it("rejects a negative question count", () => {
    const generator = new QuestionGenerator({
      operators: ["*"],
      min: 1,
      max: 10,
    });

    expect(() => generator.generate(-1)).toThrow();
  });

  it("creates a generator using the factory function", () => {
    const generator = createQuestionGenerator({
      operators: ["*"],
      min: 1,
      max: 10,
    });

    expect(generator).toBeInstanceOf(QuestionGenerator);
    expect(generator.nextQuestion().operator).toBe("*");
  });



});

import { describe, it, expect, beforeEach } from "vitest";
import { QuestionController } from "../QuestionController";
import {
  MultiplicationQuestion,
  DivisionQuestion,
  AdditionQuestion,
  SubtractionQuestion,
} from "../QuestionModel";

describe("QuestionController", () => {
  let questionController: QuestionController;

  beforeEach(() => {
    questionController = new QuestionController();
  });

  //Question Generation Tests
  describe("generateQuestion", () => {
    it("should generate a level one question", () => {
      const question = questionController.generateQuestion(1);
      expect(
        question instanceof AdditionQuestion ||
          question instanceof SubtractionQuestion,
      ).toBe(true);
    });
    it("should generate a level two question", () => {
      const question = questionController.generateQuestion(2);
      expect(question).toBeInstanceOf(MultiplicationQuestion);
    });

    it("should generate a level three question", () => {
      const question = questionController.generateQuestion(3);
      expect(question).toBeInstanceOf(DivisionQuestion);
    });

    it("should generate a level four question", () => {
      const question = questionController.generateQuestion(4);
      expect(question).toBeInstanceOf(MultiplicationQuestion);
    });

    it("should generate a level five question", () => {
      const question = questionController.generateQuestion(5);
      expect(question).toBeInstanceOf(DivisionQuestion);
    });

    it("Level one generates a question with numbers within the allowed ranges", () => {
      const question = questionController.generateQuestion(1);
      expect(question.a).toBeGreaterThanOrEqual(10);
      expect(question.a).toBeLessThanOrEqual(99);
      expect(question.b).toBeGreaterThanOrEqual(10);
      expect(question.b).toBeLessThanOrEqual(99);
    });

    it("Level two generates a question with numbers within the allowed ranges", () => {
      const question = questionController.generateQuestion(2);
      expect(question.a).toBeGreaterThanOrEqual(1);
      expect(question.a).toBeLessThanOrEqual(9);
      expect(question.b).toBeGreaterThanOrEqual(1);
      expect(question.b).toBeLessThanOrEqual(9);
    });

    it("Level three generates a question with numbers within the allowed ranges", () => {
      const question = questionController.generateQuestion(3);
      expect(question.a).toBeGreaterThanOrEqual(1);
      expect(question.a).toBeLessThanOrEqual(81);
      expect(question.b).toBeGreaterThanOrEqual(1);
      expect(question.b).toBeLessThanOrEqual(9);
    });

    it("Level four generates a question with numbers within the allowed ranges", () => {
      const question = questionController.generateQuestion(4);
      expect(question.a).toBeGreaterThanOrEqual(1);
      expect(question.a).toBeLessThanOrEqual(25);
      expect(question.b).toBeGreaterThanOrEqual(1);
      expect(question.b).toBeLessThanOrEqual(25);
    });

    it("Level five generates a question with numbers within the allowed ranges", () => {
      const question = questionController.generateQuestion(5);
      expect(question.a).toBeGreaterThanOrEqual(10);
      expect(question.a).toBeLessThanOrEqual(100);
      expect(question.b).toBeGreaterThanOrEqual(1);
      expect(question.b).toBeLessThanOrEqual(10);
    });

    it("Level three generates a division question with a non-zero divisors", () => {
      const question = questionController.generateQuestion(3);
      expect(question.b).not.toBe(0);
    });

    it("Level five generates a division question with a non-zero divisors", () => {
      const question = questionController.generateQuestion(5);
      expect(question.b).not.toBe(0);
    });

    it("Level three generates a division question with integer answers", () => {
      const question = questionController.generateQuestion(3);
      expect(question.a % question.b).toBe(0);
    });
    it("stores the generated Questions as the current Question", () => {
      const question = questionController.generateQuestion(1);
      expect(questionController.getCurrentQuestion()).toBe(question);
    });
    it("replaces the currentQuestion with a new question when generateQuestion is called again", () => {
      const firstQuestion = questionController.generateQuestion(1);
      const secondQuestion = questionController.generateQuestion(1);
      expect(questionController.getCurrentQuestion()).toBe(secondQuestion);
      expect(questionController.getCurrentQuestion()).not.toBe(firstQuestion);
    });
    it("throws an error if no question has been generated", () => {
      expect(() => {
        questionController.submitAnswer("10");
      }).toThrow("No current question to submit an answer for.");
    });

    it("throws an error for an invalid question type", () => {
      expect(() => {
        questionController.generateQuestion(10);
      }).toThrow("Invalid Id");
    });
    
  });

  describe("Answer Checking", () => {
    it("accepts a correct level 3 answer", () => {
      const question = questionController.generateQuestion(3);
      expect(questionController.submitAnswer(String(question.answer))).toBe(
        true,
      );
    });
    it("rejects an incorrect level one answer", () => {
      questionController.generateQuestion(1);
      expect(questionController.submitAnswer("999999")).toBe(false);
    });
    it("rejects an incorrect division answer", () => {
      questionController.generateQuestion(5);
      expect(questionController.submitAnswer("999999")).toBe(false);
    });
    it("rejects an incorrect level one answer", () => {
      questionController.generateQuestion(1);
      expect(questionController.submitAnswer("999999")).toBe(false);
    });
    it("rejects a non-numeric answer", () => {
      questionController.generateQuestion(1);
      expect(questionController.submitAnswer("hello")).toBe(false);
    });
    it("rejects an empty answer", () => {
      questionController.generateQuestion(1);
      expect(questionController.submitAnswer("")).toBe(false);
    });
    it("rejects a whitespace only answer", () => {
      questionController.generateQuestion(1);
      expect(questionController.submitAnswer("   ")).toBe(false);
    });
    it("rejects a input containing numbers and letters", () => {
      questionController.generateQuestion(1);
      expect(questionController.submitAnswer("123abc")).toBe(false);
    });
    it("rejects Infinity", () => {
      questionController.generateQuestion(1);
      expect(questionController.submitAnswer("Infinity")).toBe(false);
    });
    it("accepts a valid numeric answer surrounded by whitespace", () => {
      questionController.generateQuestion(1);
      expect(
        questionController.submitAnswer(
          `   ${questionController.getCurrentQuestion()!.answer}   `,
        ),
      ).toBe(true);
    });
    it("throws an error if no question has been generated", () => {
      expect(() => {
        questionController.submitAnswer("10");
      }).toThrow();
    });
  });

  describe("wrong question tracking", () => {
    it("does not record a correctly answered question", () => {
      const question = questionController.generateQuestion(1);

      questionController.submitAnswer(String(question.answer));

      expect(questionController.getWrongQuestions()).toHaveLength(0);
    });

    it("records an incorrectly answered question", () => {
      const question = questionController.generateQuestion(1);

      questionController.submitAnswer("999999");

      expect(questionController.getWrongQuestions()).toContain(question);
    });

    it("records an invalid answer as an incorrectly answered question", () => {
      const question = questionController.generateQuestion(1);

      questionController.submitAnswer("hello");

      expect(questionController.getWrongQuestions()).toContain(question);
    });

    it("does not remove previously missed questions when a new question is generated", () => {
      const firstQuestion = questionController.generateQuestion(2);

      questionController.submitAnswer("999999");

      questionController.generateQuestion(3);

      expect(questionController.getWrongQuestions()).toContain(firstQuestion);
    });

    it("returns a copy of the wrong questions list", () => {
      questionController.generateQuestion(3);

      const wrongQuestions = questionController.getWrongQuestions();

      wrongQuestions.push({
        text: "Fake question",
        a: 1,
        b: 1,
        answer: 2,
        operator: "addition",
      });

      expect(questionController.getWrongQuestions()).toHaveLength(0);
    });
  });

  it("generates the requested number of level one questions", () => {
    const questions = questionController.generateMultipleQuestions(1, 3);

    expect(questions).toHaveLength(3);

    questions.forEach((question) => {
      if (question.operator === "addition") {
        expect(question.text).toBe(`${question.a} + ${question.b} = ?`);
      } else {
        expect(question.operator).toBe("subtraction");
        expect(question.text).toBe(`${question.a} − ${question.b} = ?`);
      }
    });
  });

  it("generates the requested number of level two questions", () => {
    const questions = questionController.generateMultipleQuestions(2, 3);

    expect(questions).toHaveLength(3);

    questions.forEach((question) => {
      expect(question.text).toBe(
        `${(question as any).a} × ${(question as any).b} = ?`,
      );
    });
  });

  it("generates the requested number of level three questions", () => {
    const questions = questionController.generateMultipleQuestions(3, 3);

    expect(questions).toHaveLength(3);

    questions.forEach((question) => {
      const a = (question as any).a;
      const b = (question as any).b;

      expect(question.text).toBe(`${a} ÷ ${b} = ?`);
      expect(a % b).toBe(0);
    });
  });

  it("returns an empty array when count is zero", () => {
    const questions = questionController.generateMultipleQuestions(1, 0);

    expect(questions).toEqual([]);
  });

  it("throws an error when an invalid question type is provided", () => {
    expect(() => {
      questionController.generateMultipleQuestions(10, 3);
    }).toThrow("Invalid Id");
  });

  describe("generateQuestion with a question type (used by the race)", () => {
    it("makes each type of question", () => {
      expect(questionController.generateQuestion("addition")).toBeInstanceOf(AdditionQuestion);
      expect(questionController.generateQuestion("subtraction")).toBeInstanceOf(SubtractionQuestion);
      expect(questionController.generateQuestion("multiplication")).toBeInstanceOf(MultiplicationQuestion);
      expect(questionController.generateQuestion("division")).toBeInstanceOf(DivisionQuestion);
    });

    it("uses numbers from 1 to 10 by default", () => {
      const question = questionController.generateQuestion("multiplication");
      for (const n of [question.a, question.b]) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(10);
      }
    });

    it("uses the given number range, e.g. 2 digit numbers", () => {
      for (const type of ["addition", "subtraction", "multiplication"]) {
        for (let i = 0; i < 50; i++) {
          const question = questionController.generateQuestion(type, 10, 99);
          for (const n of [question.a, question.b]) {
            expect(n).toBeGreaterThanOrEqual(10);
            expect(n).toBeLessThanOrEqual(99);
          }
        }
      }
    });

    it("never makes a subtraction question with a negative answer", () => {
      for (let i = 0; i < 50; i++) {
        const question = questionController.generateQuestion("subtraction", 10, 99);
        expect(question.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it("gives the second number its own range when one is passed", () => {
      for (let i = 0; i < 50; i++) {
        const question = questionController.generateQuestion("addition", 10, 70, 1, 9);
        expect(question.a).toBeGreaterThanOrEqual(10);
        expect(question.a).toBeLessThanOrEqual(70);
        expect(question.b).toBeGreaterThanOrEqual(1);
        expect(question.b).toBeLessThanOrEqual(9);
      }
    });

    it("keeps division answers whole with a custom range", () => {
      for (let i = 0; i < 50; i++) {
        const question = questionController.generateQuestion("division", 1, 12);
        expect(Number.isInteger(question.answer)).toBe(true);
        expect(question.b).toBeGreaterThanOrEqual(1);
      }
    });

    it("stores the question as the current question", () => {
      const question = questionController.generateQuestion("addition");
      expect(questionController.getCurrentQuestion()).toBe(question);
    });

    it("writes question text the way the race shows it", () => {
      expect(new AdditionQuestion(12, 34).text).toBe("12 + 34 = ?");
      expect(new SubtractionQuestion(34, 12).text).toBe("34 − 12 = ?");
      expect(new MultiplicationQuestion(3, 4).text).toBe("3 × 4 = ?");
      expect(new DivisionQuestion(12, 4).text).toBe("12 ÷ 4 = ?");
    });

    it("throws an error for an invalid question type", () => {
      expect(() => {
        questionController.generateQuestion("invalidType");
      }).toThrow("Invalid question type");
    });

    it("markWrong records the current question without an answer", () => {
      const question = questionController.generateQuestion("addition");
      questionController.markWrong();
      expect(questionController.getWrongQuestions()).toEqual([question]);
    });

    it("checkAnswer checks the question it is given", () => {
      questionController.generateQuestion("addition");
      expect(questionController.checkAnswer(new AdditionQuestion(2, 3), "5")).toBe(true);
    });
  });
});

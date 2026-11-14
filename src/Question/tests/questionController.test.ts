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
                question instanceof SubtractionQuestion
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
            expect(question.a).toBeLessThanOrEqual(9);
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

        it("Level three generates a division question with integer answers", ()=>{
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
            expect (() => {
                questionController.generateQuestion(10);
            }).toThrow("Invalid Id");
        });

    });

    describe("Answer Checking", () => {
        it("accepts a correct level 3 answer", () => {
            const question = questionController.generateQuestion(3);
            expect(questionController.submitAnswer(String(question.answer))).toBe(true);
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
            expect(questionController.submitAnswer(`   ${questionController.getCurrentQuestion()!.answer}   `)).toBe(true);
        });
        it("throws an error if no question has been generated", () => {
            expect(() => {
                questionController.submitAnswer("10");
            }).toThrow();
        });
    });



    describe("wrong question tracking", () => {
        it("does not record a correctly answered question", () => {
            const question =
              questionController.generateQuestion(1);

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

            expect(questionController.getWrongQuestions()).toContain(
              firstQuestion,
            );
        });

        it("returns a copy of the wrong questions list", () => {
            questionController.generateQuestion(3);

            const wrongQuestions = questionController.getWrongQuestions();

            wrongQuestions.push({
            text: "Fake question",
            a: 1,
            b: 1,
            answer: 2,
            });

            expect(questionController.getWrongQuestions()).toHaveLength(0);
        });
    });

    it("generates the requested number of subtraction questions", () => {
      const questions = questionController.generateMultipleQuestions(
        "subtraction",
        3,
      );

      expect(questions).toHaveLength(3);

      questions.forEach((question) => {
        expect(question.text).toBe(
          `${(question as any).a} - ${(question as any).b}?`,
        );
      });
    });

    it("generates the requested number of multiplication questions", () => {
      const questions = questionController.generateMultipleQuestions(
        "multiplication",
        3,
      );

      expect(questions).toHaveLength(3);

      questions.forEach((question) => {
        expect(question.text).toBe(
          `${(question as any).a} x ${(question as any).b}?`,
        );
      });
    });

    it("generates the requested number of division questions", () => {
      const questions = questionController.generateMultipleQuestions(
        "division",
        3,
      );

      expect(questions).toHaveLength(3);

      questions.forEach((question) => {
        const a = (question as any).a;
        const b = (question as any).b;

        expect(question.text).toBe(`${a} ÷ ${b}?`);
        expect(a % b).toBe(0);
      });
    });

    it("returns an empty array when count is zero", () => {
      const questions = questionController.generateMultipleQuestions(
        "addition",
        0,
      );

      expect(questions).toEqual([]);
    });

    it("throws an error when an invalid question type is provided", () => {
      expect(() => {
        questionController.generateMultipleQuestions("invalid", 3);
      }).toThrow("Invalid question type");
    });
  });
});

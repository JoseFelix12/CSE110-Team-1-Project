import { describe, it, expect, beforeEach } from "vitest";
import { QuestionController } from "../QuestionController";
import { MultiplicationQuestion, DivisionQuestion, AdditionQuestion, SubtractionQuestion } from "../QuestionModel";

describe("QuestionController", () => {
    let questionController: QuestionController;

    beforeEach(() => {
        questionController = new QuestionController();
    });

  //Question Generation Tests
    describe("generateQuestion", () => {
        it("should generate an addition question", () => {
            const question = questionController.generateQuestion("addition");
            expect(question).toBeInstanceOf(AdditionQuestion);
        });

        it("should generate a subtraction question", () => {
            const question = questionController.generateQuestion("subtraction");
            expect(question).toBeInstanceOf(SubtractionQuestion);
        });

        it("should generate a multiplication question", () => {
            const question = questionController.generateQuestion("multiplication");
            expect(question).toBeInstanceOf(MultiplicationQuestion);
        });

        it("should generate a division question", () => {
            const question = questionController.generateQuestion("division");
            expect(question).toBeInstanceOf(DivisionQuestion);
        });

        it("it generates a question with numbers within the allowed ranges", () => {
            const question = questionController.generateQuestion("multiplication");
            expect(question.a).toBeGreaterThanOrEqual(1);
            expect(question.a).toBeLessThanOrEqual(10);
            expect(question.b).toBeGreaterThanOrEqual(1);
            expect(question.b).toBeLessThanOrEqual(10);
        });

        it("generates a division question with a non-zero divisors", () => {
            const question = questionController.generateQuestion("division");
            expect(question.b).not.toBe(0);

        });

        it("generates a division question with integer answers", ()=>{
            const question = questionController.generateQuestion("division");
            expect(question.a % question.b).toBe(0);
        });
        it("stores the generated Questions as the current Question", () => {
            const question = questionController.generateQuestion("addition");
            expect(questionController.getCurrentQuestion()).toBe(question);
        });
        it("replaces the currentQuestion with a new question when generateQuestion is called again", () => {
            const firstQuestion = questionController.generateQuestion("addition");
            const secondQuestion = questionController.generateQuestion("subtraction");
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
                questionController.generateQuestion("invalidType");
            }).toThrow("Invalid question type");
        });

    });

    describe("Answer Checking", () => {
        it("accepts a correct multiplication answer", () => {
            const question = questionController.generateQuestion("multiplication");
            expect(questionController.submitAnswer(String(question.answer))).toBe(true);
        });
        it("rejects an incorrect multiplication answer", () => {
            questionController.generateQuestion("multiplication");
            expect(questionController.submitAnswer("999999")).toBe(false);
        });
        it("rejects an incorrect division answer", () => {
            questionController.generateQuestion("division");
            expect(questionController.submitAnswer("999999")).toBe(false);
        });
        it("rejects an incorrect addition answer", () => {
            questionController.generateQuestion("addition");
            expect(questionController.submitAnswer("999999")).toBe(false);
        });
        it("rejects an incorrect subtraction answer", () => {
            questionController.generateQuestion("subtraction");
            expect(questionController.submitAnswer("999999")).toBe(false);
        });
        it("rejects a non-numeric answer", () => {
            questionController.generateQuestion("multiplication");
            expect(questionController.submitAnswer("hello")).toBe(false);
        });
        it("rejects an empty answer", () => {
            questionController.generateQuestion("multiplication");
            expect(questionController.submitAnswer("")).toBe(false);
        });
        it("rejects a whitespace only answer", () => {
            questionController.generateQuestion("multiplication");
            expect(questionController.submitAnswer("   ")).toBe(false);
        });
        it("rejects a input containing numbers and letters", () => {
            questionController.generateQuestion("multiplication");
            expect(questionController.submitAnswer("123abc")).toBe(false);

        });
        it("rejects Infinity", () => {
            questionController.generateQuestion("multiplication");
            expect(questionController.submitAnswer("Infinity")).toBe(false);
        });
        it("accepts a valid numeric answer surrounded by whitespace", () => {
            questionController.generateQuestion("multiplication");
            expect(questionController.submitAnswer("   123   ")).toBe(true);
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
              questionController.generateQuestion("multiplication");

            questionController.submitAnswer(String(question.answer));

            expect(questionController.getWrongQuestions()).toHaveLength(0);
        });

        it("records an incorrectly answered question", () => {
            const question = questionController.generateQuestion("multiplication");

            questionController.submitAnswer("999999");

            expect(questionController.getWrongQuestions()).toContain(question);
        });

        it("records an invalid answer as an incorrectly answered question", () => {
            const question = questionController.generateQuestion("division");

            questionController.submitAnswer("hello");

            expect(questionController.getWrongQuestions()).toContain(question);
        });

        it("does not remove previously missed questions when a new question is generated", () => {
            const firstQuestion = questionController.generateQuestion("multiplication");

            questionController.submitAnswer("999999");

            questionController.generateQuestion("division");

            expect(questionController.getWrongQuestions()).toContain(
              firstQuestion,
            );
        });

        it("returns a copy of the wrong questions list", () => {
            questionController.generateQuestion("multiplication");

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

});

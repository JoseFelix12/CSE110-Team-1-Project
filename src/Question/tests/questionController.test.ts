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

        it("keeps division answers whole with a custom range", () => {
            for (let i = 0; i < 50; i++) {
                const question = questionController.generateQuestion("division", 1, 12);
                expect(Number.isInteger(question.answer)).toBe(true);
                expect(question.b).toBeGreaterThanOrEqual(1);
            }
        });

        it("writes question text the way the race shows it", () => {
            expect(new AdditionQuestion(12, 34).text).toBe("12 + 34 = ?");
            expect(new SubtractionQuestion(34, 12).text).toBe("34 − 12 = ?");
            expect(new MultiplicationQuestion(3, 4).text).toBe("3 × 4 = ?");
            expect(new DivisionQuestion(12, 4).text).toBe("12 ÷ 4 = ?");
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

        it("markWrong records the current question without an answer", () => {
            const question = questionController.generateQuestion("addition");

            questionController.markWrong();

            expect(questionController.getWrongQuestions()).toEqual([question]);
        });

        it("checkAnswer checks the question it is given", () => {
            questionController.generateQuestion("addition");

            expect(questionController.checkAnswer(new AdditionQuestion(2, 3), "5")).toBe(true);
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

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RepairMinigame } from './RepairMinigame.ts';
import { Car } from './Car.ts';
import { MAX_HEALTH } from './gameConfig.ts';
import { HEALTH_REPAIR, WORD_PROBLEM_TEMPLATES } from '../constants.ts';
import { DistractorController } from '../Question/DistractorController.ts';
import { WordProblemAdapter } from '../Question/QuestionController.ts';
import type { Question } from '../Question/QuestionModel.ts';
import {
    AdditionQuestion,
    SubtractionQuestion,
    MultiplicationQuestion,
    DivisionQuestion,
} from '../Question/QuestionModel.ts';

/** Small seeded PRNG */
const seeded = (seed: number) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** The text a question would have if template were filled in with its operands */
const fill = (template: string, q: Question) =>
    template.replace("{a}", String(q.a)).replace("{b}", String(q.b));

/** Car at a specific health */
const carWithHealth = (health: number): Car => {
    const car = new Car();
    car.inflictDamage(MAX_HEALTH - health);
    return car;
};

const EXPECTED_OPERATORS: Record<number, string[]> = {
    1: ["addition", "subtraction"],
    2: ["multiplication"],
    3: ["division"],
    4: ["multiplication"],
    5: ["multiplication", "division"],
};

describe("RepairMinigame", () => {
    let game: RepairMinigame;

    beforeEach(() => {
        game = new RepairMinigame();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ---------- constructor ----------
    describe("constructor", () => {
        it("creates a full-health car when none is given", () => {
            expect(game.getCarStatus()).toBe(MAX_HEALTH);
        });

        it("uses the car that is passed in", () => {
            const car = carWithHealth(40);
            expect(new RepairMinigame(car).getCarStatus()).toBe(40);
        });

        it("repairs the same car instance it was given (no copy)", () => {
            const car = carWithHealth(40);
            new RepairMinigame(car).fixCar(10);
            expect(car.getHealth()).toBe(50);
        });

        it("sees damage done to the car from outside", () => {
            const car = new Car();
            const repair = new RepairMinigame(car);
            car.inflictDamage(30);
            expect(repair.getCarStatus()).toBe(MAX_HEALTH - 30);
        });

        it("uses the injected DistractorController", () => {
            const distractors = new DistractorController();
            const spy = vi.spyOn(distractors, "genAnswerChoices");
            const repair = new RepairMinigame(new Car(), distractors);
            repair.generateAnswerChoices(new AdditionQuestion(2, 3));
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    // ---------- getCarStatus ----------
    describe("getCarStatus", () => {
        it("returns the car's current health", () => {
            expect(new RepairMinigame(carWithHealth(73)).getCarStatus()).toBe(73);
        });

        it("returns 0 for a fully damaged car", () => {
            expect(new RepairMinigame(carWithHealth(0)).getCarStatus()).toBe(0);
        });

        it("does not change the car's health", () => {
            const repair = new RepairMinigame(carWithHealth(55));
            repair.getCarStatus();
            repair.getCarStatus();
            expect(repair.getCarStatus()).toBe(55);
        });
    });

    // ---------- fixCar ----------
    describe("fixCar", () => {
        it(`repairs HEALTH_REPAIR (${HEALTH_REPAIR}) by default`, () => {
            const repair = new RepairMinigame(carWithHealth(50));
            repair.fixCar();
            expect(repair.getCarStatus()).toBe(50 + HEALTH_REPAIR);
        });

        it("repairs a custom amount", () => {
            const repair = new RepairMinigame(carWithHealth(50));
            repair.fixCar(20);
            expect(repair.getCarStatus()).toBe(70);
        });

        it("repairs a car at 0 health", () => {
            const repair = new RepairMinigame(carWithHealth(0));
            repair.fixCar(20);
            expect(repair.getCarStatus()).toBe(20);
        });

        it("adds up across several repairs", () => {
            const repair = new RepairMinigame(carWithHealth(10));
            repair.fixCar(20);
            repair.fixCar(20);
            repair.fixCar();
            expect(repair.getCarStatus()).toBe(10 + 40 + HEALTH_REPAIR);
        });

        it("caps health at MAX_HEALTH", () => {
            const repair = new RepairMinigame(carWithHealth(95));
            repair.fixCar(20);
            expect(repair.getCarStatus()).toBe(MAX_HEALTH);
        });

        it("leaves a full-health car at MAX_HEALTH", () => {
            game.fixCar(50);
            expect(game.getCarStatus()).toBe(MAX_HEALTH);
        });

        it("does nothing with an amount of 0", () => {
            const repair = new RepairMinigame(carWithHealth(50));
            repair.fixCar(0);
            expect(repair.getCarStatus()).toBe(50);
        });

        it("throws on a negative amount and leaves health unchanged", () => {
            const repair = new RepairMinigame(carWithHealth(50));
            expect(() => repair.fixCar(-10)).toThrow(RangeError);
            expect(repair.getCarStatus()).toBe(50);
        });

        it("throws on NaN", () => {
            expect(() => game.fixCar(NaN)).toThrow(RangeError);
        });
    });

    // ---------- generateQuestion ----------
    describe("generateQuestion", () => {
        it.each([1, 2, 3, 4, 5])("level %i produces the expected operator", level => {
            for (let i = 0; i < 30; i++) {
                expect(EXPECTED_OPERATORS[level]).toContain(game.generateQuestion(level).operator);
            }
        });

        it.each([1, 2, 3, 4, 5])("level %i text is a filled-in word problem template", level => {
            for (let i = 0; i < 30; i++) {
                const q = game.generateQuestion(level);
                const options = WORD_PROBLEM_TEMPLATES[q.operator].map(t => fill(t, q));
                expect(options).toContain(q.text);
            }
        });

        it("never leaves {a} or {b} placeholders in the text", () => {
            for (let i = 0; i < 100; i++) {
                expect(game.generateQuestion().text).not.toMatch(/\{[ab]\}/);
            }
        });

        it("returns a question with a whole, non-negative answer that matches its operands", () => {
            const compute: Record<string, (a: number, b: number) => number> = {
                addition: (a, b) => a + b,
                subtraction: (a, b) => a - b,
                multiplication: (a, b) => a * b,
                division: (a, b) => a / b,
            };
            for (let i = 0; i < 200; i++) {
                const q = game.generateQuestion();
                expect(q.answer).toBe(compute[q.operator](q.a, q.b));
                expect(Number.isInteger(q.answer)).toBe(true);
                expect(q.answer).toBeGreaterThanOrEqual(0);
            }
        });

        it("throws for an invalid level", () => {
            expect(() => game.generateQuestion(0)).toThrow("Invalid Id");
            expect(() => game.generateQuestion(6)).toThrow("Invalid Id");
        });

        describe("random level (no argument)", () => {
            it("passes the explicit level straight to the adapter", () => {
                const spy = vi.spyOn(WordProblemAdapter.prototype, "generateWordProblem");
                game.generateQuestion(4);
                expect(spy).toHaveBeenCalledWith(4);
            });

            it("picks level 1 when Math.random returns 0", () => {
                const spy = vi.spyOn(WordProblemAdapter.prototype, "generateWordProblem");
                vi.spyOn(Math, "random").mockReturnValueOnce(0);
                game.generateQuestion();
                expect(spy).toHaveBeenCalledWith(1);
            });

            it("picks level 5 when Math.random is just under 1", () => {
                const spy = vi.spyOn(WordProblemAdapter.prototype, "generateWordProblem");
                vi.spyOn(Math, "random").mockReturnValueOnce(0.9999);
                game.generateQuestion();
                expect(spy).toHaveBeenCalledWith(5);
            });

            it("only ever picks levels 1 through 5, and eventually all of them", () => {
                const spy = vi.spyOn(WordProblemAdapter.prototype, "generateWordProblem");
                for (let i = 0; i < 300; i++) game.generateQuestion();
                const levels = new Set(spy.mock.calls.map(([level]) => level));
                expect([...levels].sort()).toEqual([1, 2, 3, 4, 5]);
            });

            it("eventually produces all four operators", () => {
                const operators = new Set<string>();
                for (let i = 0; i < 300; i++) operators.add(game.generateQuestion().operator);
                expect([...operators].sort()).toEqual(["addition", "division", "multiplication", "subtraction"]);
            });
        });
    });

    // ---------- checkAnswer ----------
    describe("checkAnswer", () => {
        const q = new AdditionQuestion(12, 30); // answer 42

        it("accepts the correct answer", () => {
            expect(game.checkAnswer(q, "42")).toBe(true);
        });

        it("rejects a wrong answer", () => {
            expect(game.checkAnswer(q, "41")).toBe(false);
        });

        it("ignores surrounding whitespace", () => {
            expect(game.checkAnswer(q, "  42 ")).toBe(true);
        });

        it("accepts an equivalent numeric form", () => {
            expect(game.checkAnswer(q, "42.0")).toBe(true);
        });

        it("rejects empty and blank input", () => {
            expect(game.checkAnswer(q, "")).toBe(false);
            expect(game.checkAnswer(q, "   ")).toBe(false);
        });

        it("rejects non-numeric input", () => {
            expect(game.checkAnswer(q, "forty-two")).toBe(false);
            expect(game.checkAnswer(q, "42abc")).toBe(false);
        });

        it("handles an answer of 0", () => {
            const zero = new SubtractionQuestion(7, 7);
            expect(game.checkAnswer(zero, "0")).toBe(true);
            expect(game.checkAnswer(zero, "")).toBe(false);
        });

        it("works with generated word problems", () => {
            for (let i = 0; i < 50; i++) {
                const wp = game.generateQuestion();
                expect(game.checkAnswer(wp, String(wp.answer))).toBe(true);
                expect(game.checkAnswer(wp, String(wp.answer + 1))).toBe(false);
            }
        });

        it("does not change the car's health", () => {
            game.checkAnswer(q, "0");
            expect(game.getCarStatus()).toBe(MAX_HEALTH);
        });
    });

    // ---------- generateAnswerChoices ----------
    describe("generateAnswerChoices", () => {
        it("returns 4 choices by default", () => {
            expect(game.generateAnswerChoices(new AdditionQuestion(20, 22)).choices).toHaveLength(4);
        });

        it.each([2, 3, 5])("returns %i choices when asked", n => {
            expect(game.generateAnswerChoices(new AdditionQuestion(20, 22), n).choices).toHaveLength(n);
        });

        it("forwards the question and count to the DistractorController", () => {
            const distractors = new DistractorController();
            const spy = vi.spyOn(distractors, "genAnswerChoices");
            const repair = new RepairMinigame(new Car(), distractors);
            const q = new MultiplicationQuestion(6, 7);

            repair.generateAnswerChoices(q);
            repair.generateAnswerChoices(q, 3);

            expect(spy).toHaveBeenNthCalledWith(1, q, 4);
            expect(spy).toHaveBeenNthCalledWith(2, q, 3);
        });

        it("returns exactly what the DistractorController returns", () => {
            const distractors = new DistractorController();
            const fake = { choices: [9, 8, 7, 6], correctIndex: 2 };
            vi.spyOn(distractors, "genAnswerChoices").mockReturnValue(fake);
            expect(new RepairMinigame(new Car(), distractors).generateAnswerChoices(new AdditionQuestion(3, 4))).toBe(fake);
        });

        it("has unique, valid choices with the answer exactly once at correctIndex", () => {
            for (let i = 0; i < 200; i++) {
                const q = game.generateQuestion();
                const { choices, correctIndex } = game.generateAnswerChoices(q);

                expect(new Set(choices).size).toBe(4);
                expect(choices[correctIndex]).toBe(q.answer);
                expect(choices.filter(c => c === q.answer)).toHaveLength(1);
                choices.forEach(c => {
                    expect(Number.isInteger(c)).toBe(true);
                    expect(c).toBeGreaterThanOrEqual(0);
                });
            }
        });

        it.each([
            ["answer 0", new SubtractionQuestion(10, 10)],
            ["answer 1", new DivisionQuestion(1, 1)],
            ["large product", new MultiplicationQuestion(25, 25)],
        ])("handles %s", (_label, q) => {
            const { choices, correctIndex } = game.generateAnswerChoices(q);
            expect(new Set(choices).size).toBe(4);
            expect(choices[correctIndex]).toBe(q.answer);
        });

        it("is reproducible with a seeded DistractorController", () => {
            const q = new AdditionQuestion(45, 37);
            const a = new RepairMinigame(new Car(), new DistractorController(seeded(1))).generateAnswerChoices(q);
            const b = new RepairMinigame(new Car(), new DistractorController(seeded(1))).generateAnswerChoices(q);
            expect(a).toEqual(b);
        });

        it("does not modify the question", () => {
            const q = game.generateQuestion();
            const snapshot = { ...q };
            game.generateAnswerChoices(q);
            expect({ ...q }).toEqual(snapshot);
        });
    });

    // ---------- full round ----------
    describe("a full repair round", () => {
        it("only the choice at correctIndex passes checkAnswer", () => {
            for (let i = 0; i < 50; i++) {
                const q = game.generateQuestion();
                const { choices, correctIndex } = game.generateAnswerChoices(q);
                choices.forEach((c, idx) => {
                    expect(game.checkAnswer(q, String(c))).toBe(idx === correctIndex);
                });
            }
        });

        it("answering correctly and repairing raises the car's health", () => {
            const repair = new RepairMinigame(carWithHealth(30));
            const q = repair.generateQuestion();
            const { choices, correctIndex } = repair.generateAnswerChoices(q);

            if (repair.checkAnswer(q, String(choices[correctIndex]))) repair.fixCar();

            expect(repair.getCarStatus()).toBe(30 + HEALTH_REPAIR);
        });

        it("ten correct answers from low health end at MAX_HEALTH", () => {
            const repair = new RepairMinigame(carWithHealth(5));
            for (let i = 0; i < 10; i++) {
                const q = repair.generateQuestion();
                const { choices, correctIndex } = repair.generateAnswerChoices(q);
                if (repair.checkAnswer(q, String(choices[correctIndex]))) repair.fixCar(20);
            }
            expect(repair.getCarStatus()).toBe(MAX_HEALTH);
        });
    });
});

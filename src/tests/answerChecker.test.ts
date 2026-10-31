import { describe, it, expect } from "vitest";
import {
  computeCorrectAnswer,
  parseInput,
  checkAnswer,
} from "../answerChecker";


describe("computeCorrectAnswer", () => {

    it("multiplies two numbers", () => {
    expect(
        computeCorrectAnswer({
        a: 5,
        b: 3,
        operator: "*",
        }),
    ).toBe(15);
    });

    it("divides two numbers", () => {
    expect(
        computeCorrectAnswer({
        a: 12,
        b: 3,
        operator: "/",
        }),
    ).toBe(4);
    });

    it("throws an error when dividing by zero", () => {
    expect(() =>
        computeCorrectAnswer({
        a: 12,
        b: 0,
        operator: "/",
        }),
    ).toThrow("Division by zero");
    });

    it("throws an error for non-integer division", () => {
    expect(() =>
        computeCorrectAnswer({
        a: 10,
        b: 3,
        operator: "/",
        }),
    ).toThrow("Non-integer division");
    });

    it("throws an error for an invalid operator", () => {
    expect(() =>
        computeCorrectAnswer({
        a: 5,
        b: 3,
        operator: "+",
        }),
    ).toThrow("Invalid operator");
    });
});



describe("parseInput", () => {
    it("accepts a number", () => {
        expect(parseInput(42)).toBe(42);
    });

    it("parses a numeric string", () => {
        expect(parseInput("42")).toBe(42);
    });

    it("returns null for a non-numeric string", () => {
        expect(parseInput("hello")).toBeNull();
    });

    it("returns null for an empty string", () => {
        expect(parseInput("")).toBeNull();
    });

    it("returns null for unsupported input types", () => {
        expect(parseInput(null)).toBeNull();
        expect(parseInput(undefined)).toBeNull();
        expect(parseInput(true)).toBeNull();
    });
    it("rejects strings with extra characters", () => {
        expect(parseInput("32abc")).toBeNull();
    });

    it("rejects whitespace-only input", () => {
        expect(parseInput("   ")).toBeNull();
    });

    it("accepts negative numbers", () => {
        expect(parseInput("-5")).toBe(-5);
    });

    it("accepts decimal numbers", () => {
        expect(parseInput("32.5")).toBe(32.5);
    });

    it("rejects Infinity and NaN", () => {
        expect(parseInput(Infinity)).toBeNull();
        expect(parseInput(NaN)).toBeNull();
    });
});

describe("checkAnswer", () => {
    const question = {
        a: 8,
        b: 4,
        operator: "*"
    };

    it("returns true for a correct numeric answer", () => {
        expect(checkAnswer(question, 32)).toBe(true);
    });

    it("returns true for a correct string answer", () => {
        expect(checkAnswer(question, "32")).toBe(true);
    });

    it("returns false for an incorrect answer", () => {
        expect(checkAnswer(question, 30)).toBe(false);
    });

    it("returns false for invalid input", () => {
        expect(checkAnswer(question, "hello")).toBe(false);
    });

    it("returns false for null input", () => {
        expect(checkAnswer(question, null)).toBe(false);
    });

    it("rejects an answer with extra characters", () => {
        expect(checkAnswer(question, "32abc")).toBe(false);
    });

    it("rejects an empty answer", () => {
        expect(checkAnswer(question, "")).toBe(false);
    });

    it("rejects a decimal answer when the answer is a whole number", () => {
        expect(checkAnswer(question, 32.5)).toBe(false);
    });

    it("checks a correct division answer", () => {
        const divisionQuestion = {
        a: 12,
        b: 3,
        operator: "/",
    };

        expect(checkAnswer(divisionQuestion, 4)).toBe(true);
    });

    
    });

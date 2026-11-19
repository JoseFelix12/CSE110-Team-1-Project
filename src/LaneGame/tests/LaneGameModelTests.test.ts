
import { describe, it, expect, beforeEach } from "vitest";
import { LaneGameModel } from "../LaneGameModel";

describe("LaneGameModel", () => {
    let model: LaneGameModel;

    beforeEach(() => {
        model = new LaneGameModel();
    });

    describe("constructor", () => {
        it("should initialize three lanes", () => {
            expect(model.getLanes().length).toBe(3);
        });

        it("should initialize the current lane to lane 1", () => {
            expect(model.getCurrentLaneNumber()).toBe(1);
        });

        it("should initialize the score to 0", () => {
            expect(model.getScore()).toBe(0);
        });

        it("should initialize the correct count to 0", () => {
            expect(model.getCorrectCount()).toBe(0);
        });
    });

    describe("incrementScore", () => {
        it("should increase the score by 10", () => {
            model.incrementScore();

            expect(model.getScore()).toBe(10);
        });

        it("should increase the score by 10 each time it is called", () => {
            model.incrementScore();
            model.incrementScore();
            model.incrementScore();

            expect(model.getScore()).toBe(30);
        });
    });

    describe("incrementCorrectCount", () => {
        it("should increase the correct count by 1", () => {
            model.incrementCorrectCount();

            expect(model.getCorrectCount()).toBe(1);
        });
    });

    describe("setCurrentLane", () => {
        it("should change the current lane", () => {
            const secondLane = model.getLanes()[1];

            model.setCurrentLane(secondLane);

            expect(model.getCurrentLane()).toBe(secondLane);
            expect(model.getCurrentLaneNumber()).toBe(2);
        });
    });

    describe("getLanes", () => {
        it("should return three lanes numbered 1, 2, and 3", () => {
            const lanes = model.getLanes();

            expect(lanes.map(lane => lane.getLaneNumber()))
                .toEqual([1, 2, 3]);
        });
    });

    describe("setAnswer and getTargetAnswer", () => {
        it("should update the target answer", () => {
            model.setAnswer(25);

            expect(model.getTargetAnswer()).toBe(25);
        });

        it("should allow the target answer to be zero", () => {
            model.setAnswer(0);

            expect(model.getTargetAnswer()).toBe(0);
        });
    });

    describe("reset", () => {
        it("should reset the score and correct count", () => {
            model.incrementScore();
            model.incrementScore();
            model.incrementCorrectCount();

            model.reset();

            expect(model.getScore()).toBe(0);
            expect(model.getCorrectCount()).toBe(0);
        });

        it("should reset the current lane to lane 1", () => {
            model.setCurrentLane(model.getLanes()[2]);

            model.reset();

            expect(model.getCurrentLaneNumber()).toBe(1);
        });
    });
});


import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LaneGameController } from "../LaneGameController.ts";
import type { Game } from "../../Game/Game.ts";

// Mock question generation so tests use predictable answers.
vi.mock("../Question/QuestionController.ts", () => {
    return {
        QuestionController: class {
            private count = 0;

            generateQuestion() {
                const answers = [10, 20, 30];
                const answer = answers[this.count++ % 3];

                return {
                    text: `${answer} question`,
                    a: answer,
                    b: 0,
                    answer
                };
            }
        }
    };
});

// Mock the game state.
vi.mock("../Game/GameState.ts", () => {
    return {
        GameState: class {
            getCurrentLevelId() {
                return "level1";
            }
        }
    };
});

// Mock the view so we don't need to render the actual game screen.
vi.mock("../UI/LaneGameScreen.ts", () => {
    return {
        CatchTheAnswer: class {
            updateScore = vi.fn();
            showFeedback = vi.fn();
        }
    };
});

describe("LaneGameController", () => {
    let controller: LaneGameController;

    // Access the private model for setting up and checking test state.
    let model: {
        getLanes: () => any[];
        getCurrentLane: () => any;
        getCurrentLaneNumber: () => number;
        setCurrentLane: (lane: any) => void;
        setAnswer: (answer: number) => void;
        getTargetAnswer: () => number;
        getScore: () => number;
        getCorrectCount: () => number;
        incrementScore: () => void;
        incrementCorrectCount: () => void;
    };

    let view: {
        updateScore: () => void;
        showFeedback: (correct: boolean) => void;
    };

    beforeEach(() => {
        controller = new LaneGameController({} as Game);

        const internals = controller as unknown as {
            model: typeof model;
            catchTheAnswer: typeof view;
        };

        model = internals.model;
        view = internals.catchTheAnswer;

        vi.spyOn(view, "updateScore");
        vi.spyOn(view, "showFeedback");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("startGame", () => {
        it("should reset the score and correct count", () => {
            model.incrementScore();
            model.incrementCorrectCount();

            controller.startGame();

            expect(model.getScore()).toBe(0);
            expect(model.getCorrectCount()).toBe(0);
        });

        it("should reset the current lane to lane 1", () => {
            model.setCurrentLane(model.getLanes()[2]);

            controller.startGame();

            expect(model.getCurrentLaneNumber()).toBe(1);
        });
    });

    describe("generateRound", () => {
        it("should generate a question for each lane", () => {
            controller.generateRound();

            const lanes = model.getLanes();

            expect(lanes.length).toBe(3);

            for (const lane of lanes) {
                expect(lane.getQuestion()).toBeDefined();
            }
        });

        it("should set the target answer to a randomly selected lane's answer", () => {
            vi.spyOn(Math, "random").mockReturnValue(0.4);

            controller.generateRound();

            const lanes = model.getLanes();

            expect(model.getTargetAnswer()).toBe(
                lanes[1].getQuestion().answer
            );
        });
    });

    describe("handleCarMovement", () => {
        it("should move one lane to the right", () => {
            controller.handleCarMovement("ArrowRight");

            expect(model.getCurrentLaneNumber()).toBe(2);
        });

        it("should move one lane to the left", () => {
            model.setCurrentLane(model.getLanes()[1]);

            controller.handleCarMovement("ArrowLeft");

            expect(model.getCurrentLaneNumber()).toBe(1);
        });

        it("should not move left past lane 1", () => {
            controller.handleCarMovement("ArrowLeft");

            expect(model.getCurrentLaneNumber()).toBe(1);
        });

        it("should not move right past lane 3", () => {
            model.setCurrentLane(model.getLanes()[2]);

            controller.handleCarMovement("ArrowRight");

            expect(model.getCurrentLaneNumber()).toBe(3);
        });
    });

    describe("handleLaneSelection", () => {
        beforeEach(() => {
            controller.generateRound();
        });

        it("should increase the score when the selected answer is correct", () => {
            const currentLane = model.getCurrentLane();

            model.setAnswer(currentLane.getQuestion().answer);

            controller.handleLaneSelection();

            expect(model.getScore()).toBe(10);
            expect(model.getCorrectCount()).toBe(1);
        });

        it("should not increase the score when the selected answer is incorrect", () => {
            const currentLane = model.getCurrentLane();

            model.setAnswer(currentLane.getQuestion().answer + 100);

            controller.handleLaneSelection();

            expect(model.getScore()).toBe(0);
            expect(model.getCorrectCount()).toBe(0);
        });

        it("should update the view with correct feedback", () => {
            const currentLane = model.getCurrentLane();

            model.setAnswer(currentLane.getQuestion().answer);

            controller.handleLaneSelection();

            expect(view.updateScore).toHaveBeenCalled();
            expect(view.showFeedback).toHaveBeenCalledWith(true);
        });

        it("should update the view with incorrect feedback", () => {
            const currentLane = model.getCurrentLane();

            model.setAnswer(currentLane.getQuestion().answer + 100);

            controller.handleLaneSelection();

            expect(view.updateScore).toHaveBeenCalled();
            expect(view.showFeedback).toHaveBeenCalledWith(false);
        });

        it("should not update the score if the current lane has no question", () => {
            model.getCurrentLane().setQuestion(undefined);

            controller.handleLaneSelection();

            expect(model.getScore()).toBe(0);
            expect(model.getCorrectCount()).toBe(0);
            expect(view.updateScore).not.toHaveBeenCalled();
            expect(view.showFeedback).not.toHaveBeenCalled();
        });
    });

    describe("getFinalScore", () => {
        it("should return the current score", () => {
            model.incrementScore();
            model.incrementScore();

            expect(controller.getFinalScore()).toBe(20);
        });
    });
});

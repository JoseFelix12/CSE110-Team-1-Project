import { beforeEach, describe, expect, it } from 'vitest';
import { RaceClassModel } from './RaceClassModel.ts';
import {
    AMOUNT_OF_QUESTIONS_IN_LEVEL_1,
    CORRECT_ANSWERS_FOR_NITRO,
    NITRO_SECONDS,
} from '../constants.ts';

/** Fills the nitro bar by answering enough questions correctly */
function fillNitro(model: RaceClassModel): void {
    for (let i = 0; i < CORRECT_ANSWERS_FOR_NITRO; i++) {
        model.chargeNitro();
    }
}

describe('RaceClassModel', () => {
    let model: RaceClassModel;

    beforeEach(() => {
        model = new RaceClassModel();
    });

    describe('initial state', () => {
        it('starts with no answers, no streak, no progress and no nitro', () => {
            expect(model['correct_answers']).toBe(0);
            expect(model['incorrect_answers']).toBe(0);
            expect(model['incorrectAnswerStreak']).toBe(0);
            expect(model.currentProgess()).toBe(0);
            expect(model.getNitroLevel()).toBe(0);
            expect(model.isNitroActive()).toBe(false);
        });
    });

    describe('answer counts', () => {
        it('incrementCorrect_Answers only changes the correct count', () => {
            model.incrementCorrect_Answers();
            model.incrementCorrect_Answers();
            expect(model['correct_answers']).toBe(2);
            expect(model['incorrect_answers']).toBe(0);
        });

        it('incrementIncorrect_Answers only changes the incorrect count', () => {
            model.incrementIncorrect_Answers();
            expect(model['incorrect_answers']).toBe(1);
            expect(model['correct_answers']).toBe(0);
        });
    });

    describe('currentProgess', () => {
        it('counts correct and incorrect answers together', () => {
            model.incrementCorrect_Answers();
            model.incrementIncorrect_Answers();
            expect(model.currentProgess()).toBe(2 / AMOUNT_OF_QUESTIONS_IN_LEVEL_1);
        });

        it('reaches exactly 1 after the last question', () => {
            for (let i = 0; i < AMOUNT_OF_QUESTIONS_IN_LEVEL_1; i++) {
                model.incrementCorrect_Answers();
            }
            expect(model.currentProgess()).toBe(1);
        });
    });

    describe('incorrect streak', () => {
        it('incrementIncorrectStreak builds the streak', () => {
            model.incrementIncorrectStreak();
            model.incrementIncorrectStreak();
            expect(model['incorrectAnswerStreak']).toBe(2);
        });

        it('resetIncorrectStreak clears the streak', () => {
            model.incrementIncorrectStreak();
            model.resetIncorrectStreak();
            expect(model['incorrectAnswerStreak']).toBe(0);
        });
    });

    describe('shouldDamageCar', () => {
        it('is false below 3 wrong answers in a row', () => {
            model.incrementIncorrectStreak();
            model.incrementIncorrectStreak();
            expect(model.shouldDamageCar()).toBe(false);
        });

        it('is true at 3 wrong answers in a row', () => {
            for (let i = 0; i < 3; i++) {
                model.incrementIncorrectStreak();
            }
            expect(model.shouldDamageCar()).toBe(true);
        });

        it('stays true until the controller resets the streak', () => {
            for (let i = 0; i < 3; i++) {
                model.incrementIncorrectStreak();
            }
            model.shouldDamageCar();
            expect(model.shouldDamageCar()).toBe(true);
            model.resetIncorrectStreak();
            expect(model.shouldDamageCar()).toBe(false);
        });
    });

    describe('nitro charging', () => {
        it('chargeNitro adds one step per call', () => {
            model.chargeNitro();
            expect(model.getNitroLevel()).toBeCloseTo(1 / CORRECT_ANSWERS_FOR_NITRO);
        });

        it('is exactly full after CORRECT_ANSWERS_FOR_NITRO charges', () => {
            fillNitro(model);
            expect(model.getNitroLevel()).toBe(1);
        });

        it('never goes above 1', () => {
            fillNitro(model);
            model.chargeNitro();
            expect(model.getNitroLevel()).toBe(1);
        });

        it('resetNitro empties the bar', () => {
            fillNitro(model);
            model.resetNitro();
            expect(model.getNitroLevel()).toBe(0);
        });
    });

    describe('handleNitro', () => {
        it('does nothing and returns false when the bar is not full', () => {
            model.chargeNitro();
            expect(model.handleNitro()).toBe(false);
            expect(model.isNitroActive()).toBe(false);
        });

        it('activates nitro and returns true when the bar is full', () => {
            fillNitro(model);
            expect(model.handleNitro()).toBe(true);
            expect(model.isNitroActive()).toBe(true);
        });

        it('spends the charge so the next nitro needs a full bar again', () => {
            fillNitro(model);
            model.handleNitro();
            expect(model['nitroLevel']).toBe(0);
        });

        it('cannot start a second nitro while one is running', () => {
            fillNitro(model);
            model.handleNitro();
            fillNitro(model);
            expect(model.handleNitro()).toBe(false);
        });
    });

    describe('updateNitro', () => {
        it('does nothing when nitro is not active', () => {
            model.updateNitro(1);
            expect(model.isNitroActive()).toBe(false);
            expect(model.getNitroLevel()).toBe(0);
        });

        it('drains the bar while nitro is active', () => {
            fillNitro(model);
            model.handleNitro();
            expect(model.getNitroLevel()).toBe(1);
            model.updateNitro(NITRO_SECONDS / 2);
            expect(model.getNitroLevel()).toBeCloseTo(0.5);
            expect(model.isNitroActive()).toBe(true);
        });

        it('ends nitro when the time runs out', () => {
            fillNitro(model);
            model.handleNitro();
            model.updateNitro(NITRO_SECONDS);
            expect(model.isNitroActive()).toBe(false);
            expect(model.getNitroLevel()).toBe(0);
        });

        it('keeps charge earned during nitro', () => {
            fillNitro(model);
            model.handleNitro();
            model.chargeNitro();
            model.updateNitro(NITRO_SECONDS);
            expect(model.getNitroLevel()).toBeCloseTo(1 / CORRECT_ANSWERS_FOR_NITRO);
        });
    });

    describe('reset', () => {
        it('returns every value to its starting state', () => {
            model.incrementCorrect_Answers();
            model.incrementIncorrect_Answers();
            for (let i = 0; i < 3; i++) {
                model.incrementIncorrectStreak();
            }
            fillNitro(model);
            model.handleNitro();

            model.reset();

            expect(model['correct_answers']).toBe(0);
            expect(model['incorrect_answers']).toBe(0);
            expect(model['incorrectAnswerStreak']).toBe(0);
            expect(model.currentProgess()).toBe(0);
            expect(model.getNitroLevel()).toBe(0);
            expect(model.isNitroActive()).toBe(false);
        });
    });
});
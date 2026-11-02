import { beforeEach, describe, expect, it} from 'vitest';
import { RaceClassModel } from './RaceClassModel.ts';
import { AMOUNT_OF_QUESTIONS_IN_LEVEL_1} from '../constants.ts';


describe('RaceClassModel', () => {
    let model: RaceClassModel;

    beforeEach(() => {
        model = new RaceClassModel();
    });

    describe('initial state', () => {
        it('starts with no answers, no streaks and full health', () => {
            expect(model['correct_answers']).toBe(0);
            expect(model['incorrect_answers']).toBe(0);
            expect(model['correctAnswerStreak']).toBe(0);
            expect(model['incorrectAnswerStreak']).toBe(0);
            expect(model['health']).toBe(100);
            expect(model.currentProgess()).toBe(0);
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
            expect(model.currentProgess()).toBe(2/ AMOUNT_OF_QUESTIONS_IN_LEVEL_1);
        });

        it('reaches exactly 1 after the last question', () => {
            for (let i = 0; i < 2; i++) {
                model.incrementCorrect_Answers();
            }
            expect(model.currentProgess()).toBe(1);
        });
    });

    describe('streaks', () => {
        it('incrementStreak builds the correct streak', () => {
            model.incrementStreak();
            model.incrementStreak();
            expect(model['correctAnswerStreak']).toBe(2);
        });

        it('resetcorrectStreak clears only the correct streak', () => {
            model.incrementStreak();
            model.incrementIncorrectStreak();
            model.resetcorrectStreak();
            expect(model['correctAnswerStreak']).toBe(0);
            expect(model['incorrectAnswerStreak']).toBe(1);
        });

        it('incrementIncorrectStreak builds the incorrect streak', () => {
            model.incrementIncorrectStreak();
            model.incrementIncorrectStreak();
            expect(model['incorrectAnswerStreak']).toBe(2);
        });

        it('resetIncorrectStreak clears only the incorrect streak', () => {
            model.incrementIncorrectStreak();
            model.incrementStreak();
            model.resetIncorrectStreak();
            expect(model['incorrectAnswerStreak']).toBe(0);
            expect(model['correctAnswerStreak']).toBe(1);
        });
    });

    describe('reset', () => {
        it('returns every value to its starting state', () => {
            model.incrementCorrect_Answers();
            model.incrementIncorrect_Answers();
            model.incrementStreak();
            model.incrementIncorrectStreak();
            model.incrementIncorrectStreak();
            model.incrementIncorrectStreak();

            model.reset();

            expect(model['correct_answers']).toBe(0);
            expect(model['incorrect_answers']).toBe(0);
            expect(model['correctAnswerStreak']).toBe(0);
            expect(model['incorrectAnswerStreak']).toBe(0);
            expect(model.currentProgess()).toBe(0);
        });
    });
});
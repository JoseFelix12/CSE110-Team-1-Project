import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { GameState } from '../Game/GameState.ts';
import { SceneIds } from '../Game/Scene.ts';
import type { SceneId } from '../Game/Scene.ts';
import { RaceClassController } from './RaceClassController.ts';
import type { RaceViewHandlers } from './RaceClassView.ts';

const fake = vi.hoisted(() => ({
    view: null as null | Record<string, ReturnType<typeof vi.fn>> & { handlers: RaceViewHandlers },
}));

// The real view needs a browser, so these tests watch what the controller asks of it
vi.mock('./RaceClassView.ts', () => ({
    RaceClassView: class {
        handlers: unknown;
        mount = vi.fn();
        destroy = vi.fn();
        update = vi.fn();
        setCar = vi.fn();
        showCountdown = vi.fn();
        startRace = vi.fn();
        setQuestion = vi.fn();
        updateTimer = vi.fn();
        setProgress = vi.fn();
        showAnswerFeedback = vi.fn();
        setNitroLevel = vi.fn();
        setNitroActive = vi.fn();
        constructor(handlers: unknown) {
            this.handlers = handlers;
            fake.view = this as never;
        }
    },
}));

// Long enough to answer several questions before the race ends
vi.mock('../constants.ts', async (original) => ({
    ...(await original<typeof import('../constants.ts')>()),
    AMOUNT_OF_QUESTIONS_IN_LEVEL_1: 4,
}));

describe('RaceClassController', () => {
    let switchToScreen: Mock<(id: SceneId) => void>;
    let controller: RaceClassController;

    const view = () => fake.view!;
    const lastAnswer = (): string => {
        const text = view().setQuestion.mock.lastCall![0] as string;
        const [a, b] = text.split(' = ')[0].split(' × ').map(Number);
        return String(a * b);
    };
    const startRacing = () => {
        controller.enter({ levelId: 1 });
        vi.advanceTimersByTime(3000);
    };

    beforeEach(() => {
        vi.useFakeTimers();
        switchToScreen = vi.fn<(id: SceneId) => void>();
        controller = new RaceClassController({ switchToScreen }, new GameState(null), {
            parent: {} as HTMLElement,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('places the car, then counts down 3, 2, 1 before starting', () => {
        controller.enter({ levelId: 1 });
        expect(view().setCar).toHaveBeenCalledOnce();
        expect(view().showCountdown.mock.calls.flat()).toEqual([3]);

        vi.advanceTimersByTime(2000);
        expect(view().showCountdown.mock.calls.flat()).toEqual([3, 2, 1]);
        expect(view().startRace).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000);
        expect(view().startRace).toHaveBeenCalledOnce();
        expect(view().setQuestion).toHaveBeenCalledOnce();
    });

    it('moves on after a correct answer', () => {
        startRacing();
        view().handlers.onAnswerSubmit(lastAnswer());
        expect(view().showAnswerFeedback).toHaveBeenCalledWith(true);
        expect(view().setProgress).toHaveBeenCalledWith(0.25);
        expect(view().setQuestion).toHaveBeenCalledTimes(2);
    });

    it('marks a wrong answer as wrong', () => {
        startRacing();
        view().handlers.onAnswerSubmit('99999');
        expect(view().showAnswerFeedback).toHaveBeenCalledWith(false);
    });

    it('counts a timed out question as wrong and restarts the timer', () => {
        startRacing();
        vi.advanceTimersByTime(10000);
        expect(view().showAnswerFeedback).toHaveBeenCalledWith(false);
        expect(view().setQuestion).toHaveBeenCalledTimes(2);
        expect(view().updateTimer).toHaveBeenLastCalledWith(10);
    });

    it('freezes the question timer while paused', () => {
        startRacing();
        vi.advanceTimersByTime(4000);
        view().handlers.onPause();
        view().updateTimer.mockClear();
        vi.advanceTimersByTime(60000);
        expect(view().updateTimer).not.toHaveBeenCalled();

        view().handlers.onResume();
        vi.advanceTimersByTime(1000);
        expect(view().updateTimer).toHaveBeenLastCalledWith(5);
    });

    it('freezes the countdown while paused', () => {
        controller.enter({ levelId: 1 });
        view().handlers.onPause();
        vi.advanceTimersByTime(60000);
        expect(view().startRace).not.toHaveBeenCalled();

        view().handlers.onResume();
        vi.advanceTimersByTime(3000);
        expect(view().startRace).toHaveBeenCalledOnce();
    });

    it('stops asking at full progress and leaves after the finish line', () => {
        startRacing();
        for (let i = 0; i < 4; i++) {
            view().handlers.onAnswerSubmit(lastAnswer());
        }
        expect(view().setProgress).toHaveBeenLastCalledWith(1);
        expect(view().setQuestion).toHaveBeenCalledTimes(4);

        // No timeout may fire while the car drives to the line
        vi.advanceTimersByTime(30000);
        expect(view().showAnswerFeedback).toHaveBeenCalledTimes(4);
        expect(switchToScreen).not.toHaveBeenCalled();

        view().handlers.onFinishLineCrossed();
        vi.advanceTimersByTime(1500);
        expect(switchToScreen).toHaveBeenCalledWith(SceneIds.LevelSelect);
    });

    it('fills nitro from correct answers, then burns it off', () => {
        startRacing();
        view().handlers.onNitro();
        expect(view().setNitroActive).not.toHaveBeenCalled();

        view().handlers.onAnswerSubmit(lastAnswer());
        view().handlers.onAnswerSubmit(lastAnswer());
        expect(view().setNitroLevel).toHaveBeenLastCalledWith(1);

        view().handlers.onNitro();
        expect(view().setNitroActive).toHaveBeenLastCalledWith(true);

        controller.update(1);
        expect(view().setNitroLevel).toHaveBeenLastCalledWith(0.5);
        controller.update(1);
        expect(view().setNitroActive).toHaveBeenLastCalledWith(false);
        expect(view().setNitroLevel).toHaveBeenLastCalledWith(0);
    });

    it('does not burn nitro while paused', () => {
        startRacing();
        view().handlers.onAnswerSubmit(lastAnswer());
        view().handlers.onAnswerSubmit(lastAnswer());
        view().handlers.onNitro();
        view().handlers.onPause();
        controller.update(5);
        expect(view().setNitroActive).toHaveBeenCalledTimes(1);
    });

    it('quits to the level screen', () => {
        startRacing();
        view().handlers.onQuit();
        expect(switchToScreen).toHaveBeenCalledWith(SceneIds.LevelSelect);
    });

    it('stops every timer and removes the view on exit', () => {
        startRacing();
        controller.exit();
        expect(view().destroy).toHaveBeenCalledOnce();
        view().updateTimer.mockClear();
        vi.advanceTimersByTime(60000);
        expect(view().updateTimer).not.toHaveBeenCalled();
    });
});

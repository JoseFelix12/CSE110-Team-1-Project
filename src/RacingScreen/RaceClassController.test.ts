import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { GameState } from '../Game/GameState.ts';
import { SceneIds } from '../Game/Scene.ts';
import type { SceneId } from '../Game/Scene.ts';
import { COINS_PER_CORRECT_ANSWER, COINS_PER_STAR, MAX_HEALTH, SKIN_PRICES, UPGRADE_PRICES } from '../Game/gameConfig.ts';
import type { Upgrade } from '../Game/gameConfig.ts';
import { DAMAGE_PER_STREAK, QUESTION_TIMER } from '../constants.ts';
import { RaceClassController } from './RaceClassController.ts';
import type { RaceClassModel } from './RaceClassModel.ts';
import type { RaceViewHandlers } from './RaceClassView.ts';

const fake = vi.hoisted(() => ({
    view: null as null | Record<string, ReturnType<typeof vi.fn>> & { handlers: RaceViewHandlers },
}));

vi.stubGlobal('Audio', class {
    loop = false;
    muted = false;
    currentTime = 0;
    volume = 1;
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
});

// The real view needs a browser, so these tests watch what the controller asks of it
vi.mock('./RaceClassView.ts', () => ({
    RaceClassView: class {
        handlers: unknown;
        mount = vi.fn();
        destroy = vi.fn();
        update = vi.fn();
        setCar = vi.fn();
        setUpgrades = vi.fn();
        showCountdown = vi.fn();
        startRace = vi.fn();
        setQuestion = vi.fn();
        updateTimer = vi.fn();
        setProgress = vi.fn();
        showAnswerFeedback = vi.fn();
        setNitroLevel = vi.fn();
        setNitroActive = vi.fn();
        setTheme = vi.fn();
        setOpponentProgress = vi.fn();
        setPlacement = vi.fn();
        options: unknown;
        constructor(handlers: unknown, options: unknown) {
            this.handlers = handlers;
            this.options = options;
            fake.view = this as never;
        }
    },
}));

// Long enough to answer several questions, and a small nitro requirement so
// the bar can be filled within one race
vi.mock('../constants.ts', async (original) => ({
    ...(await original<typeof import('../constants.ts')>()),
    CORRECT_ANSWERS_FOR_NITRO: 2, 
}));

describe('RaceClassController', () => {
    let switchToScreen: Mock<(id: SceneId) => void>;
    let gameState: GameState;
    let controller: RaceClassController;

    const view = () => fake.view!;
    const lastAnswer = (): string => {
        const text = view().setQuestion.mock.lastCall![0] as string;
        const [a, symbol, b] = text.split(' = ')[0].split(' ');
        const [x, y] = [Number(a), Number(b)];
        const answers: Record<string, number> = { '+': x + y, '−': x - y, '×': x * y, '÷': x / y };
        return String(answers[symbol]);
    };
    const startRacing = () => {
        controller.enter({ levelId: 1 });
        vi.advanceTimersByTime(3000);
    };
    const answerCorrectly = () => view().handlers.onAnswerSubmit(lastAnswer());
    const answerWrong = () => view().handlers.onAnswerSubmit('99999');
    /** Fills the nitro bar, then simulates one frame so the view hears about it */
    const fillNitro = () => {
        answerCorrectly();
        answerCorrectly();
        controller.update(0);
    };
    const giveUpgrade = (upgrade: Upgrade) => {
        gameState.addCoins(UPGRADE_PRICES[upgrade]);
        expect(gameState.buyUpgrade(upgrade)).toBe(true);
    };

    beforeEach(() => {
        vi.useFakeTimers();
        switchToScreen = vi.fn<(id: SceneId) => void>();
        gameState = new GameState(null);
        const realGetLevel = gameState.getLevel.bind(gameState);
        vi.spyOn(gameState, 'getLevel').mockImplementation((id) => ({
            ...realGetLevel(id),
            questionCount: 4,
        }));
        controller = new RaceClassController({ switchToScreen }, gameState, {
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
        answerCorrectly();
        expect(view().showAnswerFeedback).toHaveBeenCalledWith(true);
        expect(view().setProgress).toHaveBeenCalledWith(0.25);
        expect(view().setQuestion).toHaveBeenCalledTimes(2);
    });

    it('marks a wrong answer as wrong', () => {
        startRacing();
        answerWrong();
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
            answerCorrectly();
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

    describe('nitro', () => {
        it('ignores the nitro button until the bar is full', () => {
            startRacing();
            view().handlers.onNitro();
            expect(view().setNitroActive).not.toHaveBeenCalled();
            expect(view().showAnswerFeedback).not.toHaveBeenCalled();
        });

        it('ignores the nitro button when the car has no health left', () => {
            startRacing();
            fillNitro();
            gameState.getMutableCar().inflictDamage(MAX_HEALTH);
            view().handlers.onNitro();
            expect(view().setNitroActive).not.toHaveBeenCalled();
            expect(view().showAnswerFeedback).toHaveBeenCalledTimes(2);
        });

        it('fills nitro from correct answers, then burns it off', () => {
            startRacing();
            fillNitro();
            expect(view().setNitroLevel).toHaveBeenLastCalledWith(1);

            view().handlers.onNitro();
            expect(view().setNitroActive).toHaveBeenLastCalledWith(true);

            controller.update(1);
            expect(view().setNitroLevel).toHaveBeenLastCalledWith(0.5);
            controller.update(1);
            expect(view().setNitroActive).toHaveBeenLastCalledWith(false);
            expect(view().setNitroLevel).toHaveBeenLastCalledWith(0);
        });

        it('counts a nitro press as a correct answer and moves to the next question', () => {
            startRacing();
            fillNitro();
            view().handlers.onNitro();
            expect(view().showAnswerFeedback).toHaveBeenLastCalledWith(true);
            expect(view().setProgress).toHaveBeenLastCalledWith(0.75);
            expect(view().setQuestion).toHaveBeenCalledTimes(4);
        });

        it('a wrong answer empties the nitro bar', () => {
            startRacing();
            answerCorrectly();
            controller.update(0);
            expect(view().setNitroLevel).toHaveBeenLastCalledWith(0.5);

            answerWrong();
            controller.update(0);
            expect(view().setNitroLevel).toHaveBeenLastCalledWith(0);
        });

        it('does not burn nitro while paused', () => {
            startRacing();
            fillNitro();
            view().handlers.onNitro();
            view().handlers.onPause();
            controller.update(5);
            expect(view().setNitroActive).toHaveBeenCalledTimes(1);
        });
    });

    describe('health', () => {
        it('uses one Shield per damage event and updates the race badge', () => {
            gameState.addCoins(2 * UPGRADE_PRICES.Shield);
            gameState.buyUpgrade('Shield');
            gameState.buyUpgrade('Shield');
            vi.mocked(gameState.getLevel).mockReturnValue({
                ...gameState.getLevel(1),
                questionCount: 10,
            });
            controller = new RaceClassController({ switchToScreen }, gameState, {
                parent: {} as HTMLElement,
                showUpgradeHud: true,
            });
            startRacing();
            expect(view().options).toMatchObject({ upgrades: ['Shield', 'Shield'] });

            answerWrong();
            answerWrong();
            expect(gameState.getShieldCount()).toBe(2);
            answerWrong();
            expect(gameState.getCar().getHealth()).toBe(MAX_HEALTH);
            expect(view().setUpgrades).toHaveBeenLastCalledWith(['Shield']);

            for (let i = 0; i < 3; i++) answerWrong();
            expect(gameState.getCar().getHealth()).toBe(MAX_HEALTH);
            expect(gameState.getShieldCount()).toBe(0);
            expect(view().setUpgrades).toHaveBeenLastCalledWith([]);

            for (let i = 0; i < 3; i++) answerWrong();
            expect(gameState.getCar().getHealth()).toBe(MAX_HEALTH - DAMAGE_PER_STREAK);
        });

        it('does not damage the car before 3 wrong answers in a row', () => {
            startRacing();
            answerWrong();
            answerWrong();
            expect(gameState.getCar().getHealth()).toBe(MAX_HEALTH);
        });

        it('damages the car after 3 wrong answers in a row', () => {
            startRacing();
            answerWrong();
            answerWrong();
            answerWrong();
            expect(gameState.getCar().getHealth()).toBe(MAX_HEALTH - DAMAGE_PER_STREAK);
        });

        it('a correct answer breaks the streak', () => {
            startRacing();
            answerWrong();
            answerWrong();
            answerCorrectly();
            answerWrong();
            expect(gameState.getCar().getHealth()).toBe(MAX_HEALTH);
        });

        it('counts timed out questions toward the streak', () => {
            startRacing();
            vi.advanceTimersByTime(30000); // three questions time out
            expect(gameState.getCar().getHealth()).toBe(MAX_HEALTH - DAMAGE_PER_STREAK);
        });
    });

    describe('shield upgrade', () => {
        it('blocks the damage from 3 wrong answers in a row', () => {
            giveUpgrade('Shield');
            startRacing();
            answerWrong(); answerWrong(); answerWrong();
            expect(gameState.getCar().getHealth()).toBe(MAX_HEALTH);
        });
    
        it('is used up by the block', () => {
            giveUpgrade('Shield');
            startRacing();
            answerWrong(); answerWrong(); answerWrong();
            expect(gameState.ownsUpgrade('Shield')).toBe(false);
        });
    
        it('lets the next hit through once it is used up', () => {
            giveUpgrade('Shield');
            startRacing();
            answerWrong(); answerWrong(); answerWrong();
            startRacing(); // fresh race, since the first has only 4 questions
            answerWrong(); answerWrong(); answerWrong();
            expect(gameState.getCar().getHealth()).toBe(MAX_HEALTH - DAMAGE_PER_STREAK);
        });
    
        it('is not used by wrong answers that do not reach a hit', () => {
            giveUpgrade('Shield');
            startRacing();
            answerWrong(); answerWrong();
            expect(gameState.ownsUpgrade('Shield')).toBe(true);
        });
    
        it('can be bought again after it is used up', () => {
            giveUpgrade('Shield');
            startRacing();
            answerWrong(); answerWrong(); answerWrong();
            giveUpgrade('Shield');
            expect(gameState.ownsUpgrade('Shield')).toBe(true);
        });
    });
    
    describe('speed boost upgrade', () => {
        it('fills nitro one answer sooner', () => {
            giveUpgrade('Speed Boost');
            startRacing();
            answerCorrectly();
            controller.update(0);
            expect(view().setNitroLevel).toHaveBeenLastCalledWith(1);
        });
    
        it('charges at the normal rate without it', () => {
            startRacing();
            answerCorrectly();
            controller.update(0);
            expect(view().setNitroLevel).toHaveBeenLastCalledWith(0.5);
        });
    });
    
    describe('extra time upgrade', () => {
        it('gives each question 5 more seconds', () => {
            giveUpgrade('Extra Time');
            startRacing();
            expect(view().updateTimer).toHaveBeenLastCalledWith(QUESTION_TIMER + 5);
        });
    
        it('uses the normal time without it', () => {
            startRacing();
            expect(view().updateTimer).toHaveBeenLastCalledWith(QUESTION_TIMER);
        });
    
        it('does not time out until the extra seconds are gone', () => {
            giveUpgrade('Extra Time');
            startRacing();
            vi.advanceTimersByTime((QUESTION_TIMER + 4) * 1000);
            expect(view().showAnswerFeedback).not.toHaveBeenCalled();
            vi.advanceTimersByTime(1000);
            expect(view().showAnswerFeedback).toHaveBeenCalledWith(false);
        });
    });

    describe('opponents', () => {
        it('gives the view a yellow, blue and green bot', () => {
            expect(view().options).toMatchObject({ opponentColors: ['yellow', 'blue', 'green'] });
        });

        it('recolors a bot that matches the player skin', () => {
            gameState.addCoins(SKIN_PRICES.blue);
            gameState.buySkin('blue');
            controller.enter({ levelId: 1 });
            const options = view().options as unknown as { skin: string; opponentColors: string[] };
            expect(options.skin).toBe('blue');
            expect(options.opponentColors).toEqual(['yellow', 'purple', 'green']);
        });

        it('keeps the bots at the start until GO', () => {
            controller.enter({ levelId: 1 });
            controller.update(0.1);
            expect(view().setOpponentProgress).not.toHaveBeenCalled();

            vi.advanceTimersByTime(3000);
            controller.update(0.1);
            expect(view().setOpponentProgress).toHaveBeenCalledWith([0, 0, 0]);
        });

        it('moves the bots forward as time passes, but not while paused', () => {
            startRacing();
            // 40 seconds is far longer than even the easy bot needs for 4 questions
            for (let i = 0; i < 400; i++) {
                controller.update(0.1);
            }
            expect(view().setOpponentProgress).toHaveBeenLastCalledWith([1, 1, 1]);
            expect(view().setPlacement).toHaveBeenLastCalledWith(4);

            controller.enter({ levelId: 1 });
            vi.advanceTimersByTime(3000);
            view().handlers.onPause();
            view().setOpponentProgress.mockClear();
            controller.update(5);
            expect(view().setOpponentProgress).not.toHaveBeenCalled();
        });

        it('places the player first when they finish before the bots', () => {
            startRacing();
            for (let i = 0; i < 4; i++) {
                answerCorrectly();
            }
            expect(view().setPlacement).toHaveBeenLastCalledWith(1);

            // The place stays locked while the bots catch up
            for (let i = 0; i < 400; i++) {
                controller.update(0.1);
            }
            expect(view().setPlacement).toHaveBeenLastCalledWith(1);
        });
    });

    it.each([
        [1, 'dirt'],
        [2, 'raceTrack'],
        [3, 'street'],
    ])('races level %i on the %s theme', (levelId, theme) => {
        controller.enter({ levelId });
        expect(view().setTheme).toHaveBeenCalledWith(theme);
    });

    describe('questions', () => {
        const questionParts = () => {
            const text = view().setQuestion.mock.lastCall![0] as string;
            const [a, symbol, b] = text.split(' = ')[0].split(' ');
            return { a: Number(a), symbol, b: Number(b) };
        };

        it('asks level 1 a 2 digit number up to 70 plus a 1 digit number', () => {
            startRacing();
            for (let i = 0; i < 4; i++) {
                const { a, symbol, b } = questionParts();
                expect(symbol).toBe('+');
                expect(a).toBeGreaterThanOrEqual(10);
                expect(a).toBeLessThanOrEqual(70);
                expect(b).toBeGreaterThanOrEqual(1);
                expect(b).toBeLessThanOrEqual(9);
                answerCorrectly();
            }
        });

        it('asks the operators of the level being raced', () => {
            controller.enter({ levelId: 4 });
            vi.advanceTimersByTime(3000);
            expect(questionParts().symbol).toBe('÷');
        });

        it('keeps wrong and timed out questions, but not right ones', () => {
            startRacing();
            answerCorrectly();
            const wrong = view().setQuestion.mock.lastCall![0];
            answerWrong();
            const timedOut = view().setQuestion.mock.lastCall![0];
            vi.advanceTimersByTime(10000);

            expect(controller.getWrongQuestions().map((question) => question.text)).toEqual([wrong, timedOut]);
        });

        it('starts each race with no missed questions', () => {
            startRacing();
            answerWrong();
            controller.enter({ levelId: 1 });
            expect(controller.getWrongQuestions()).toEqual([]);
        });
    });

    it('uses the theme option over the level theme when one is given', () => {
        controller = new RaceClassController({ switchToScreen }, gameState, {
            parent: {} as HTMLElement,
            theme: 'street',
        });
        controller.enter({ levelId: 1 });
        expect(view().setTheme).toHaveBeenCalledWith('street');
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

    describe('coins', () => {
        it('awards coins and 3 stars for beating every opponent', () => {
            startRacing();
            for (let i = 0; i < 4; i++) answerCorrectly();
            view().handlers.onFinishLineCrossed();
            expect(gameState.getCoins()).toBe(4 * COINS_PER_CORRECT_ANSWER + 3 * COINS_PER_STAR);
            expect(gameState.getStars(1)).toBe(3);
        });

        it('gives no stars when every opponent finishes first', () => {
            startRacing();
            // Far longer than any bot needs to finish
            controller.update(1000);
            for (let i = 0; i < 4; i++) answerCorrectly();
            view().handlers.onFinishLineCrossed();
            expect(gameState.getStars(1)).toBe(0);
            expect(gameState.getCoins()).toBe(4 * COINS_PER_CORRECT_ANSWER);
        });

        it('gives 1 star per opponent beaten', () => {
            startRacing();
            // Only the hard bot finishes before the player
            const model = (controller as unknown as { model: RaceClassModel }).model;
            const [, , hard] = model.getOpponents();
            expect(hard.profile.difficulty).toBe('hard');
            hard.update(1000);
            for (let i = 0; i < 4; i++) answerCorrectly();
            view().handlers.onFinishLineCrossed();
            expect(gameState.getStars(1)).toBe(2);
            expect(gameState.getCoins()).toBe(4 * COINS_PER_CORRECT_ANSWER + 2 * COINS_PER_STAR);
        });

        it('only pays for correct answers', () => {
            startRacing();
            answerCorrectly();
            answerCorrectly();
            answerWrong();
            answerWrong();
            view().handlers.onFinishLineCrossed();
            // Beat all 3 bots, but 50% accuracy earns no stars
            expect(gameState.getCoins()).toBe(2 * COINS_PER_CORRECT_ANSWER);
        });
    
        it('gives nothing if the player quits mid-race', () => {
            startRacing();
            answerCorrectly();
            view().handlers.onQuit();
            expect(gameState.getCoins()).toBe(0);
        });

        it('only records the race once if the finish line fires twice', () => {
            startRacing();
            for (let i = 0; i < 4; i++) answerCorrectly();
            view().handlers.onFinishLineCrossed();
            view().handlers.onFinishLineCrossed();
            expect(gameState.getCoins()).toBe(4 * COINS_PER_CORRECT_ANSWER + 3 * COINS_PER_STAR);
        });

        it('records the result on the level that was played', () => {
            startRacing();
            for (let i = 0; i < 4; i++) answerCorrectly();
            view().handlers.onFinishLineCrossed();
            vi.advanceTimersByTime(1500);
            controller.exit();
        
            controller = new RaceClassController({ switchToScreen }, gameState, {
                parent: {} as HTMLElement,
            });
            controller.enter({ levelId: 2 });
            vi.advanceTimersByTime(3000);
            for (let i = 0; i < 4; i++) answerCorrectly();
            view().handlers.onFinishLineCrossed();
        
            expect(gameState.getStars(2)).toBe(3);
        });
    });
    describe('onRaceComplete', () => {
        let onRaceComplete: Mock<(params: Record<string, unknown>) => void>;
    
        beforeEach(() => {
            onRaceComplete = vi.fn();
            controller = new RaceClassController({ switchToScreen }, gameState, {
                parent: {} as HTMLElement,
                onRaceComplete,
            });
        });
    
        it('reports the race summary instead of switching screens', () => {
            startRacing();
            answerCorrectly();
            answerCorrectly();
            answerWrong();
            answerWrong();
            view().handlers.onFinishLineCrossed();
            vi.advanceTimersByTime(1500);
    
            expect(onRaceComplete).toHaveBeenCalledOnce();
            expect(onRaceComplete).toHaveBeenCalledWith(expect.objectContaining({
                mode: 'race',
                levelId: 1,
                correct: 2,
                incorrect: 2,
                total: 4,
                accuracy: 50,
                placement: 1,
                opponentsBeaten: 3,
                // 50% accuracy is below 75%, so no stars
                stars: 0,
                coinsEarned: 2 * COINS_PER_CORRECT_ANSWER,
            }));
            expect(switchToScreen).not.toHaveBeenCalled();
        });

        it('gives stars at 75% accuracy', () => {
            startRacing();
            answerCorrectly();
            answerCorrectly();
            answerCorrectly();
            answerWrong();
            view().handlers.onFinishLineCrossed();
            vi.advanceTimersByTime(1500);

            expect(onRaceComplete).toHaveBeenCalledWith(expect.objectContaining({
                accuracy: 75,
                stars: 3,
                coinsEarned: 3 * COINS_PER_CORRECT_ANSWER + 3 * COINS_PER_STAR,
            }));
        });
    
        it('reports the level that was actually played', () => {
            gameState.recordRaceResult(1, 4, 3, 4); // earn stars so level 2 unlocks
            controller.enter({ levelId: 2 });
            vi.advanceTimersByTime(3000);
            for (let i = 0; i < 4; i++) answerCorrectly();
            view().handlers.onFinishLineCrossed();
            vi.advanceTimersByTime(1500);
    
            expect(onRaceComplete).toHaveBeenCalledWith(expect.objectContaining({ levelId: 2 }));
        });
    
        it('waits for the finish screen delay before reporting', () => {
            startRacing();
            for (let i = 0; i < 4; i++) answerCorrectly();
            view().handlers.onFinishLineCrossed();
            expect(onRaceComplete).not.toHaveBeenCalled();
            vi.advanceTimersByTime(1500);
            expect(onRaceComplete).toHaveBeenCalledOnce();
        });
    });
});

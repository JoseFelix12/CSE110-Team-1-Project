export interface QuestionBarHandlers {
    onSubmit(answer: string): void;
    onNitro(): void;
}

const FEEDBACK_MS = 350;
const LOW_TIME_SECONDS = 3;

/**
 * QuestionBar - The panel under the road with the math question, the answer
 * textbox, the question timer and the nitro boost bar.
 */
export class QuestionBar {
    readonly element: HTMLElement;

    private handlers: QuestionBarHandlers;
    private question: HTMLElement;
    private timer: HTMLElement;
    private input: HTMLInputElement;
    private nitroMeter: HTMLElement;
    private nitroFill: HTMLElement;
    private nitroButton: HTMLButtonElement;
    private enabled = false;
    private nitroLevel = 0;
    private nitroActive = false;
    private feedbackTimeout: number | null = null;

    constructor(handlers: QuestionBarHandlers) {
        this.handlers = handlers;

        this.element = document.createElement('div');
        this.element.className = 'race-bar';
        this.element.innerHTML = `
            <div class="race-bar__question-area">
                <div class="race-bar__question" aria-live="polite"></div>
                <div class="race-bar__timer"></div>
            </div>
            <input class="race-bar__input" type="text" inputmode="numeric" autocomplete="off"
                maxlength="6" placeholder="Answer" aria-label="Your answer" />
            <div class="race-bar__nitro">
                <div class="race-bar__nitro-meter" role="progressbar" aria-label="Nitro boost"
                    aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                    <div class="race-bar__nitro-fill"></div>
                </div>
                <button class="race-button race-bar__nitro-button" type="button">NITRO</button>
            </div>
        `;

        this.question = this.find('.race-bar__question');
        this.timer = this.find('.race-bar__timer');
        this.input = this.find<HTMLInputElement>('.race-bar__input');
        this.nitroMeter = this.find('.race-bar__nitro-meter');
        this.nitroFill = this.find('.race-bar__nitro-fill');
        this.nitroButton = this.find<HTMLButtonElement>('.race-bar__nitro-button');

        this.input.addEventListener('input', this.keepDigitsOnly);
        this.input.addEventListener('keydown', this.handleKeyDown);
        this.nitroButton.addEventListener('click', this.fireNitro);
        this.setEnabled(false);
    }

    setQuestion(text: string): void {
        this.question.textContent = text;
        this.input.value = '';
        this.focus();
    }

    /**
     * Shows the seconds left on the current question
     */
    setTimer(seconds: number): void {
        this.timer.textContent = `${seconds}s`;
        this.timer.classList.toggle('race-bar__timer--low', seconds <= LOW_TIME_SECONDS);
    }

    /**
     * Flashes the textbox green or red and clears it for the next answer
     */
    showFeedback(correct: boolean): void {
        this.input.value = '';
        this.clearFeedback();
        this.input.classList.add(correct ? 'race-bar__input--correct' : 'race-bar__input--wrong');
        this.feedbackTimeout = window.setTimeout(() => this.clearFeedback(), FEEDBACK_MS);
    }

    /**
     * Sets how full the nitro bar is, from 0 to 1
     */
    setNitroLevel(level: number): void {
        this.nitroLevel = Math.min(1, Math.max(0, level));
        const percent = Math.round(this.nitroLevel * 100);
        this.nitroFill.style.width = `${percent}%`;
        this.nitroMeter.setAttribute('aria-valuenow', String(percent));
        this.refreshNitro();
    }

    setNitroActive(active: boolean): void {
        this.nitroActive = active;
        this.refreshNitro();
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.input.disabled = !enabled;
        this.refreshNitro();
        this.focus();
    }

    /**
     * Empties the bar and locks the textbox until the next race starts
     */
    reset(): void {
        this.question.textContent = '';
        this.timer.textContent = '';
        this.timer.classList.remove('race-bar__timer--low');
        this.input.value = '';
        this.clearFeedback();
        this.nitroActive = false;
        this.setNitroLevel(0);
        this.setEnabled(false);
    }

    focus(): void {
        if (this.enabled) {
            this.input.focus();
        }
    }

    destroy(): void {
        this.clearFeedback();
        this.element.remove();
    }

    private find<T extends HTMLElement>(selector: string): T {
        return this.element.querySelector(selector) as T;
    }

    private refreshNitro(): void {
        const ready = this.isNitroReady();
        this.nitroButton.disabled = !ready;
        this.nitroButton.classList.toggle('race-bar__nitro-button--ready', ready);
        this.nitroFill.classList.toggle('race-bar__nitro-fill--active', this.nitroActive);
    }

    private isNitroReady(): boolean {
        return this.enabled && this.nitroLevel >= 1 && !this.nitroActive;
    }

    private clearFeedback(): void {
        if (this.feedbackTimeout !== null) {
            window.clearTimeout(this.feedbackTimeout);
            this.feedbackTimeout = null;
        }
        this.input.classList.remove('race-bar__input--correct', 'race-bar__input--wrong');
    }

    private keepDigitsOnly = (): void => {
        this.input.value = this.input.value.replace(/\D/g, '');
    };

    private handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Enter' && this.input.value !== '') {
            this.handlers.onSubmit(this.input.value);
        } else if (event.key === ' ') {
            event.preventDefault();
            this.fireNitro();
        }
    };

    private fireNitro = (): void => {
        if (this.isNitroReady()) {
            this.handlers.onNitro();
        }
        this.focus();
    };
}

export interface PauseMenuHandlers {
    onResume(): void;
    onMuteToggle(): void;
    onQuit(): void;
}

/**
 * PauseMenu - Overlay with the resume, mute audio and quit buttons.
 */
export class PauseMenu {
    readonly element: HTMLElement;

    private resumeButton: HTMLButtonElement;
    private muteButton: HTMLButtonElement;

    constructor(handlers: PauseMenuHandlers) {
        this.element = document.createElement('div');
        this.element.className = 'race-pause';
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-label', 'Paused');
        this.element.hidden = true;
        this.element.innerHTML = `
            <div class="race-pause__panel">
                <h2 class="race-pause__title">PAUSED</h2>
                <button class="race-button race-pause__resume" type="button">Resume</button>
                <button class="race-button race-pause__mute" type="button"></button>
                <button class="race-button race-pause__quit" type="button">Quit</button>
            </div>
        `;

        this.resumeButton = this.element.querySelector('.race-pause__resume') as HTMLButtonElement;
        this.muteButton = this.element.querySelector('.race-pause__mute') as HTMLButtonElement;
        const quitButton = this.element.querySelector('.race-pause__quit') as HTMLButtonElement;

        this.resumeButton.addEventListener('click', () => handlers.onResume());
        this.muteButton.addEventListener('click', () => handlers.onMuteToggle());
        quitButton.addEventListener('click', () => handlers.onQuit());
    }

    show(): void {
        this.element.hidden = false;
        this.resumeButton.focus();
    }

    hide(): void {
        this.element.hidden = true;
    }

    setMuted(muted: boolean): void {
        this.muteButton.textContent = muted ? 'Unmute Audio' : 'Mute Audio';
    }
}

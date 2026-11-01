export class InputState {
    static BUTTONS = ["left", "right", "up", "down", "rotateCw", "rotateCcw", "start", "select"];

    constructor() {
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
        this.rotateCw = false;   // A
        this.rotateCcw = false;  // B
        this.start = false;
        this.select = false;
    }

    copyFrom(other) {
        for (const button of InputState.BUTTONS) {
            this[button] = other[button];
        }
    }

    /**
     * Buttons held now that were not held in `previous` (newlyPressedButtons).
     * @param {InputState} previous
     */
    pressedSince(previous) {
        const pressed = new InputState();
        for (const button of InputState.BUTTONS) {
            pressed[button] = this[button] && !previous[button];
        }
        return pressed;
    }
}

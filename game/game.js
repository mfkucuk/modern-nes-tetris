import { InputState } from "./input.js";
import { Board } from "./board.js";
import { NesRng } from "./rng.js";
import { Piece } from "./piece.js";

// Frames per gravity drop for levels 0-28 (framesPerDropTable). Level 29+ drops every frame.
const FRAMES_PER_DROP = [
    48, 43, 38, 33, 28, 23, 18, 13, 8, 6,
    5, 5, 5, 4, 4, 4, 3, 3, 3, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2
];

const LINE_CLEAR_POINTS = [0, 40, 100, 300, 1200];
const MAX_SCORE = 999999;

// Delayed auto shift: first repeat after 16 frames, then every 6 frames.
const DAS_DELAY = 16;
const DAS_RESET = 10;

// The first piece of a game hangs for 96 frames unless down is pressed.
const START_DROP_DELAY = -96;

const SPAWN_X = 5;
const SPAWN_Y = 0;
const CLEAR_ANIMATION_STEPS = 5;

export const GameMode = Object.freeze({
    MENU: 0,
    PLAYING: 1,
    GAME_OVER: 2
});

export const PlayState = Object.freeze({
    ACTIVE: 0,
    LINE_CLEAR: 1,
    ENTRY_DELAY: 2
});

export class TetrisGame {
    constructor() {
        this.board = new Board();
        this.rng = new NesRng();
        this.previousInput = new InputState();

        this.mode = GameMode.MENU;
        this.frameCounter = 0;
        this.menuLevel = 0;
        this.topScore = 10000;

        this.currentPiece = null;
        this.nextPiece = null;
        this.statistics = new Array(8).fill(0);

        this.score = 0;
        this.lines = 0;
        this.level = 0;

        this.paused = false;
        this.showNext = true;
        this.curtainRow = 0;
    }

    /**
     * Runs one NES frame (1/60.0988 s).
     * @param {InputState} input 
     */
    step(input) {
        const pressed = input.pressedSince(this.previousInput);
        this.previousInput.copyFrom(input);

        // The NMI handler steps the RNG every frame, menus included.
        this.rng.step();
        this.frameCounter = (this.frameCounter + 1) & 0xFF;

        switch (this.mode) {
            case GameMode.MENU:
                this.stepMenu(input, pressed);
                break;

            case GameMode.PLAYING:
                this.stepPlaying(input, pressed);
                break;

            case GameMode.GAME_OVER:
                this.stepGameOver(pressed);
                break;
        }
    }

    stepMenu(input, pressed) {
        if (pressed.left && this.menuLevel % 5 > 0) {
            this.menuLevel--;
        }
        else if (pressed.right && this.menuLevel % 5 < 4) {
            this.menuLevel++;
        }
        else if (pressed.up && this.menuLevel >= 5) {
            this.menuLevel -= 5;
        }
        else if (pressed.down && this.menuLevel < 5) {
            this.menuLevel += 5;
        }

        if (pressed.start) {
            // Holding A while pressing start begins 10 levels higher.
            this.startGame(this.menuLevel + (input.rotateCw ? 10 : 0));
        }
    }

    startGame(level) {
        this.board.clear();
        this.statistics.fill(0);
        this.score = 0;
        this.lines = 0;
        this.level = level;

        this.currentPiece = new Piece(this.rng.getPiece(), SPAWN_X, SPAWN_Y);
        this.nextPiece = new Piece(this.rng.getPiece(), SPAWN_X, SPAWN_Y);
        this.statistics[this.currentPiece.type]++;

        this.fallTimer = 0;
        this.autorepeatX = 0;
        this.autorepeatY = START_DROP_DELAY;
        this.holdDownPoints = 0;

        this.playState = PlayState.ACTIVE;
        this.clearingRows = [];
        this.clearStep = 0;
        this.entryDelay = 0;

        this.paused = false;
        this.showNext = true;
        this.mode = GameMode.PLAYING;
    }

    stepPlaying(input, pressed) {
        if (pressed.start) {
            this.paused = !this.paused;
        }

        if (this.paused) {
            return;
        }

        if (pressed.select) {
            this.showNext = !this.showNext;
        }

        this.fallTimer++;

        switch (this.playState) {
            case PlayState.ACTIVE:
                this.shift(input, pressed);
                this.rotate(pressed);
                this.drop(input, pressed);
                break;

            case PlayState.LINE_CLEAR:
                this.animateLineClear();
                break;

            case PlayState.ENTRY_DELAY:
                if (--this.entryDelay <= 0) {
                    this.spawn();
                }
                break;
        }
    }

    stepGameOver(pressed) {
        if (this.curtainRow < Board.HEIGHT) {
            if ((this.frameCounter & 3) === 0) {
                this.curtainRow++;
            }
            return;
        }

        if (pressed.start) {
            this.mode = GameMode.MENU;
        }
    }

    // shift_tetrimino
    shift(input, pressed) {
        if (input.down) {
            return;
        }

        if (!pressed.left && !pressed.right) {
            if (!input.left && !input.right) {
                return;
            }

            this.autorepeatX++;
            if (this.autorepeatX < DAS_DELAY) {
                return;
            }

            this.autorepeatX = DAS_RESET;
        }
        else {
            this.autorepeatX = 0;
        }

        // Right takes priority when both directions are held.
        const dx = input.right ? 1 : input.left ? -1 : 0;
        if (dx !== 0 && !this.board.tryMove(this.currentPiece, dx, 0)) {
            // Pushing against a wall keeps DAS fully charged.
            this.autorepeatX = DAS_DELAY;
        }
    }

    // rotate_tetrimino: A rotates clockwise and wins over B.
    rotate(pressed) {
        if (pressed.rotateCw) {
            this.board.tryRotate(this.currentPiece, true);
        }
        else if (pressed.rotateCcw) {
            this.board.tryRotate(this.currentPiece, false);
        }
    }

    // drop_tetrimino
    drop(input, pressed) {
        if (this.autorepeatY < 0) {
            if (!pressed.down) {
                this.autorepeatY++;
                return;
            }

            this.autorepeatY = 0;
        }

        if (this.autorepeatY === 0) {
            // Soft drop only starts on a fresh press of down alone.
            const onlyDownPressed = pressed.down && !pressed.left && !pressed.right && !pressed.up;
            if (!input.left && !input.right && onlyDownPressed) {
                this.autorepeatY = 1;
            }
        }
        else if (input.down && !input.left && !input.right && !input.up) {
            this.autorepeatY++;
            if (this.autorepeatY >= 3) {
                this.autorepeatY = 1;
                this.holdDownPoints++;
                this.dropOneRow();
                return;
            }
        }
        else {
            this.autorepeatY = 0;
            this.holdDownPoints = 0;
        }

        const dropSpeed = this.level < FRAMES_PER_DROP.length ? FRAMES_PER_DROP[this.level] : 1;
        if (this.fallTimer >= dropSpeed) {
            this.dropOneRow();
        }
    }

    dropOneRow() {
        this.fallTimer = 0;
        if (!this.board.tryMove(this.currentPiece, 0, 1)) {
            this.lock();
        }
    }

    lock() {
        const piece = this.currentPiece;

        // A piece that locks while overlapping the stack means it spawned into it.
        if (this.board.collides(piece)) {
            this.gameOver();
            return;
        }

        this.board.placePiece(piece);

        // Entry delay is 10-18 frames depending on how high the piece locked.
        this.entryDelay = 8 + 2 * Math.ceil((Board.HEIGHT - Math.max(0, piece.y - 2)) / 4);

        this.clearingRows = this.board.fullRows();
        this.clearStep = 0;

        if (this.clearingRows.length > 0) {
            this.playState = PlayState.LINE_CLEAR;
        }
        else {
            this.updateScore(0);
            this.playState = PlayState.ENTRY_DELAY;
        }
    }

    // Blocks vanish from the middle outwards, one column pair every 4 frames.
    animateLineClear() {
        if ((this.frameCounter & 3) !== 0) {
            return;
        }

        this.clearStep++;
        if (this.clearStep < CLEAR_ANIMATION_STEPS) {
            return;
        }

        const cleared = this.clearingRows.length;
        this.board.removeRows(this.clearingRows);
        this.clearingRows = [];
        this.clearStep = 0;

        this.updateScore(cleared);
        this.playState = PlayState.ENTRY_DELAY;
    }

    // playState_updateLinesAndStatistics
    updateScore(cleared) {
        for (let i = 0; i < cleared; i++) {
            this.lines++;

            if (this.lines % 10 === 0) {
                // The ROM compares the level against the BCD lines/10 read as hex,
                // which is why high starting levels take longer to transition.
                const bcdTens = (Math.floor(this.lines / 100) % 10) * 16 + Math.floor(this.lines / 10) % 10;
                if (this.level < bcdTens) {
                    this.level++;
                }
            }
        }

        if (this.holdDownPoints >= 2) {
            this.addScore(this.holdDownPoints - 1);
        }

        // Points use the level after any level up from this clear.
        this.addScore(LINE_CLEAR_POINTS[cleared] * (this.level + 1));
    }

    addScore(points) {
        this.score = Math.min(MAX_SCORE, this.score + points);
    }

    spawn() {
        this.currentPiece = new Piece(this.nextPiece.type, SPAWN_X, SPAWN_Y);
        this.nextPiece = new Piece(this.rng.getPiece(), SPAWN_X, SPAWN_Y);
        this.statistics[this.currentPiece.type]++;

        this.fallTimer = 0;
        this.autorepeatY = 0;
        this.holdDownPoints = 0;
        this.playState = PlayState.ACTIVE;
    }

    gameOver() {
        this.topScore = Math.max(this.topScore, this.score);
        this.curtainRow = 0;
        this.mode = GameMode.GAME_OVER;
    }

    // Tetris clears flash the background every fourth frame.
    get flash() {
        return this.mode === GameMode.PLAYING
            && this.playState === PlayState.LINE_CLEAR
            && this.clearingRows.length === 4
            && (this.frameCounter & 3) === 0;
    }
}

import { InputState } from "./input.js";
import { Board } from "./board.js";
import { NesRng, RandomRng } from "./rng.js";
import { Piece } from "./piece.js";

export class TetrisGame {
    constructor(seed) {
        this.board = new Board();
        this.rng = new RandomRng();

        this.currentPiece = null;
        this.nextPiece = null;

        this.frame = 0;
        this.score = 0;
        this.lines = 0;
        this.level = 0;

        this.gameOver = false;

        this.start();
    }

    start() {
        this.currentPiece = new Piece(this.rng.getPiece(), 5, 0);
        this.nextPiece = new Piece(this.rng.getPiece(), 5, 0);
    }

    /**
     * @param {InputState} input 
     */
    step(input) {
        if (this.gameOver) {
            return;
        }

        this.frame++;

        if (this.frame < 10) {
            return;
        }

        this.frame = 0;

        this.handleGravity();
        this.handleInput(input);
    }

    next() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = new Piece(this.rng.getPiece(), 5, 0);

        if (this.board.collides(this.currentPiece)) {
            this.gameOver = true;
        }
    }

    handleGravity() {
        if (!this.board.tryMove(this.currentPiece, 0, 1)) {
            this.board.placePiece(this.currentPiece);
            this.next();
        }
    }

    /**
     * @param {InputState} input 
     */
    handleInput(input) {
        if (input.left) {
            console.log('asd');
            this.board.tryMove(this.currentPiece, -1, 0);
        }
        else if (input.right) {
            this.board.tryMove(this.currentPiece, 1, 0);
        }
    }
}
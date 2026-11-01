import { Piece } from "./piece.js";

export class Board {
    static WIDTH = 10;
    static HEIGHT = 20;
    // The NES lets a piece poke up to two rows above the visible playfield.
    static TOP_MARGIN = 2;

    constructor() {
        this.cells = new Uint8Array(Board.WIDTH * Board.HEIGHT);
    }

    get(x, y) {
        return this.cells[y * Board.WIDTH + x];
    }

    set(x, y, value) {
        this.cells[y * Board.WIDTH + x] = value;
    }

    isEmpty(x, y) {
        return this.get(x, y) === 0;
    }

    isOccupied(x, y) {
        return this.get(x, y) !== 0;
    }

    clear() {
        this.cells.fill(0);
    }

    /**
     * @param {Piece} piece 
     */
    collides(piece) {
        for (const [dx, dy] of piece.blocks()) {
            const x = piece.x + dx;
            const y = piece.y + dy;

            if (x < 0 || x >= Board.WIDTH) {
                return true;
            }

            if (y >= Board.HEIGHT || y < -Board.TOP_MARGIN) {
                return true;
            }

            if (y >= 0 && this.isOccupied(x, y)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param {Piece} piece 
     */
    tryMove(piece, x, y) {
        piece.move(x, y);
        if (this.collides(piece)) {
            piece.move(-x, -y);
            return false;
        }

        return true;
    }

    /**
     * NES rotation has no wall kicks: the rotation simply fails if blocked.
     * @param {Piece} piece 
     */
    tryRotate(piece, clockwise) {
        const original = piece.rotation;
        clockwise ? piece.rotateCW() : piece.rotateCCW();

        if (this.collides(piece)) {
            piece.rotation = original;
            return false;
        }

        return true;
    }

    /**
     * @param {Piece} piece 
     */
    placePiece(piece) {
        for (const [dx, dy] of piece.blocks()) {
            const x = piece.x + dx;
            const y = piece.y + dy;

            if (y >= 0) {
                this.set(x, y, piece.type);
            }
        }
    }

    fullRows() {
        const rows = [];
        for (let y = 0; y < Board.HEIGHT; y++) {
            let full = true;
            for (let x = 0; x < Board.WIDTH; x++) {
                if (this.isEmpty(x, y)) {
                    full = false;
                    break;
                }
            }

            if (full) {
                rows.push(y);
            }
        }

        return rows;
    }

    removeRows(rows) {
        let target = Board.HEIGHT - 1;
        for (let y = Board.HEIGHT - 1; y >= 0; y--) {
            if (rows.includes(y)) {
                continue;
            }

            this.cells.copyWithin(target * Board.WIDTH, y * Board.WIDTH, (y + 1) * Board.WIDTH);
            target--;
        }

        this.cells.fill(0, 0, (target + 1) * Board.WIDTH);
    }
}

import { Piece } from "./piece.js";

export class Board {
    static WIDTH = 10;
    static HEIGHT = 22;
    static BUFFER_HEIGHT = 2;
    
    constructor() {
        this.cells = new Uint8Array(Board.WIDTH * Board.HEIGHT);
    }

    get(x, y) {
        return this.cells[(y + Board.BUFFER_HEIGHT) * Board.WIDTH + x];
    }

    set(x, y, value) {
        this.cells[(y + Board.BUFFER_HEIGHT) * Board.WIDTH + x] = value;
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

            if (y >= Board.HEIGHT) {
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
        const temp = new Piece(piece.type, piece.x + x, piece.y + y);
        if (this.collides(temp)) {
            return false;
        }

        piece.move(x, y);
        return true;
    }

    /**
     * @param {Piece} piece 
     */
    placePiece(piece) {
        for (const [dx, dy] of piece.blocks()) {
            const x = piece.x + dx;
            const y = piece.y + dy;

            this.set(x, y, piece.type);
        }
    }
}
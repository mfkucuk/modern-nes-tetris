import { mod } from "./utils.js";

export const PieceType = Object.freeze({
    T: 1,
    J: 2,
    Z: 3,
    O: 4,
    S: 5,
    L: 6,
    I: 7
});

export const PIECE_DEFINITIONS = {
    [PieceType.T]: {
        rotations: [
            //   []
            // [][][]
            [ [-1, 0], [0, 0], [1, 0], [0, -1] ], 
            
            // []
            // [][]
            // []
            [ [0, -1], [0, 0], [1, 0], [0, 1] ],

            // [][][]
            //   []
            [ [-1, 0], [0, 0], [1, 0], [0, 1] ],

            //   []
            // [][]
            //   []
            [ [0, -1], [-1, 0], [0, 0], [0, 1] ]
        ]
    },

    [PieceType.J]: {
        rotations: [
            //   []
            //   []
            // [][]
            [ [0, -1], [0, 0], [-1, 1], [0, 1] ],

            // []
            // [][][]
            [ [-1, -1], [-1, 0], [0, 0], [1, 0] ],

            // [][]
            // []
            // []
            [ [0, -1], [1, -1], [0, 0], [0, 1] ],

            // [][][]
            //     []
            [ [-1, 0], [0, 0], [1, 0], [1, 1] ]
        ]
    },

    [PieceType.Z]: {
        rotations: [
            // [][]
            //   [][]
            [ [-1, 0], [0, 0], [0, 1], [1, 1] ],

            //   []
            // [][]
            // []
            [ [1, -1], [0, 0], [1, 0], [0, 1] ]
        ]
    },

    [PieceType.O]:  {
        rotations: [
            // [][]
            // [][]
            [ [-1, 0], [0, 0], [-1, 1], [0, 1] ]
        ]
    },

    [PieceType.S]: {
        rotations: [
            //   [][]
            // [][]
            [ [0, 0], [1, 0], [-1, 1], [0, 1] ],

            // []
            // [][]
            //   []
            [ [0, -1], [0, 0], [1, 0], [1, 1] ]
        ]
    },

    [PieceType.L]: {
        rotations: [
            // []
            // []
            // [][]
            [ [0, -1], [0, 0], [0, 1], [1, 1] ],

            // [][][]
            // []
            [ [-1, 0], [0, 0], [1, 0], [-1, 1] ],

            // [][]
            //   []
            //   []
            [ [-1, -1], [0, -1], [0, 0], [0, 1] ],

            //     []
            // [][][]
            [ [1, -1], [-1, 0], [0, 0], [1, 0] ]
        ]
    },

    [PieceType.I]: {
        rotations: [
            // []
            // []
            // []
            // []
            [ [0, -2], [0, -1], [0, 0], [0, 1] ],

            // [][][][]
            [ [-2, 0], [-1, 0], [0, 0], [1, 0] ]
        ]
    }
}

export class Piece {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.setInitialRotation();
    }

    setInitialRotation() {
        switch (this.type) {
            case 1:
                this.rotation = 2;
                break;

            case 2:
                this.rotation = 3;
                break;

            case 3:
                this.rotation = 0;
                break;

            case 4:
                this.rotation = 0;
                break;

            case 5:
                this.rotation = 0;
                break;

            case 6:
                this.rotation = 1;
                break;

            case 7:
                this.rotation = 1;
                break;
        }
    }

    blocks() {
        return PIECE_DEFINITIONS[this.type].rotations[this.rotation];
    }

    rotateCW() {
        this.rotation = mod(this.rotation + 1, 4);
    }

    rotateCCW() {
        this.rotation = mod(this.rotation - 1, 4);
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
}
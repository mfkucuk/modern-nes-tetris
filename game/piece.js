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

// Offsets are [dx, dy] taken from the ROM's orientation table, listed in clockwise order.
// spawnRotation is the orientation each piece appears in.
export const PIECE_DEFINITIONS = {
    [PieceType.T]: {
        spawnRotation: 2,
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
        spawnRotation: 3,
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
        spawnRotation: 0,
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

    [PieceType.O]: {
        spawnRotation: 0,
        rotations: [
            // [][]
            // [][]
            [ [-1, 0], [0, 0], [-1, 1], [0, 1] ]
        ]
    },

    [PieceType.S]: {
        spawnRotation: 0,
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
        spawnRotation: 1,
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
        spawnRotation: 1,
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
        this.rotation = PIECE_DEFINITIONS[this.type].spawnRotation;
    }

    blocks() {
        return PIECE_DEFINITIONS[this.type].rotations[this.rotation];
    }

    rotateCW() {
        this.rotation = mod(this.rotation + 1, PIECE_DEFINITIONS[this.type].rotations.length);
    }

    rotateCCW() {
        this.rotation = mod(this.rotation - 1, PIECE_DEFINITIONS[this.type].rotations.length);
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
}
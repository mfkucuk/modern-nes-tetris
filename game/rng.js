import { PieceType } from "./piece.js";

// Orientation IDs the ROM spawns each piece with, indexed in T J Z O S L I order.
const SPAWN_TABLE = [0x02, 0x07, 0x08, 0x0A, 0x0B, 0x0E, 0x12];

/**
 * The NES 16-bit LFSR and piece picker (pickRandomTetrimino).
 * The seed is stepped once every frame by the NMI handler, so the pieces
 * you get depend on exactly which frame you start the game on.
 */
export class NesRng {
    constructor(seed = 0x8988) {
        this.seed = seed & 0xFFFF;
        this.spawnId = 0;
        this.spawnCount = 0;
    }

    step() {
        const bit = ((this.seed >> 9) ^ (this.seed >> 1)) & 1;
        this.seed = ((bit << 15) | (this.seed >> 1)) & 0xFFFF;
    }

    getPiece() {
        this.spawnCount = (this.spawnCount + 1) & 0xFF;

        let index = ((this.seed >> 8) + this.spawnCount) & 7;

        // Reroll once if the index is out of range or repeats the last piece.
        // The reroll adds the previous orientation ID (not its index), just like the ROM.
        if (index === 7 || SPAWN_TABLE[index] === this.spawnId) {
            this.step();
            index = (((this.seed >> 8) & 7) + this.spawnId) % 7;
        }

        this.spawnId = SPAWN_TABLE[index];
        return PieceType.T + index;
    }
}

export class RandomRng {

    getPiece() {
        return Math.floor(Math.random() * 7 + 1);
    }

}

export class NesRng {
    constructor(seed) {

    }
}
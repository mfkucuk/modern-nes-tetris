import { TetrisGame, GameMode, PlayState } from "../game/game.js";
import { InputState } from "../game/input.js";
import { Board } from "../game/board.js";
import { PIECE_DEFINITIONS, PieceType } from "../game/piece.js";

const game = new TetrisGame();
const keyboard = new InputState();
// Keys pressed since the last frame, so taps shorter than a frame still register.
const latched = new InputState();
const input = new InputState();
let canvas;
let ctx;
let scale = 1;

// Everything is drawn in NES pixel coordinates and scaled up.
const NES_WIDTH = 256;
const NES_HEIGHT = 240;

const FPS = 60.0988;
const FRAME_TIME = 1000 / FPS;
const MAX_FRAMES_PER_TICK = 5;

let lastTime = performance.now();
let accumulator = 0;

const TOP_SCORE_KEY = "modern-nes-tetris.topScore";

const NES_PALETTE = {
    0x00: "#7C7C7C", 0x05: "#A80020", 0x12: "#0058F8", 0x13: "#6844FC",
    0x14: "#D800CC", 0x15: "#E40058", 0x16: "#F83800", 0x1A: "#00A800",
    0x21: "#3CBCFC", 0x22: "#6888FC", 0x24: "#F878F8", 0x27: "#FCA044",
    0x29: "#B8F818", 0x2A: "#58D854", 0x2B: "#58F898", 0x30: "#FCFCFC"
};

// Light and dark block colors per level, from the ROM's color table (repeats every 10 levels).
const LEVEL_COLORS = [
    [0x21, 0x12], [0x29, 0x1A], [0x24, 0x14], [0x2A, 0x12], [0x2B, 0x15],
    [0x22, 0x2B], [0x00, 0x16], [0x05, 0x13], [0x16, 0x12], [0x27, 0x16]
];

const BlockStyle = Object.freeze({ WHITE: 0, LIGHT: 1, DARK: 2 });

const BLOCK_STYLES = {
    [PieceType.T]: BlockStyle.WHITE,
    [PieceType.J]: BlockStyle.DARK,
    [PieceType.Z]: BlockStyle.LIGHT,
    [PieceType.O]: BlockStyle.WHITE,
    [PieceType.S]: BlockStyle.DARK,
    [PieceType.L]: BlockStyle.LIGHT,
    [PieceType.I]: BlockStyle.WHITE
};

const WHITE = NES_PALETTE[0x30];
const BLACK = "#000000";
const TEXT_RED = NES_PALETTE[0x16];
const FRAME_LIGHT = "#BCBCBC";
const FRAME_DARK = "#585870";

const FIELD_X = 96;
const FIELD_Y = 48;
const CELL = 8;

const backgroundCanvas = createBackground();

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    accumulator = Math.min(accumulator + deltaTime, FRAME_TIME * MAX_FRAMES_PER_TICK);

    while (accumulator >= FRAME_TIME) {
        pollInput();
        game.step(input);
        accumulator -= FRAME_TIME;
    }

    saveTopScore();
    draw(ctx, game);

    requestAnimationFrame(gameLoop);
}

window.onload = () => {
    canvas = document.getElementById("tetrisGameCanvas");
    ctx = canvas.getContext("2d");

    game.topScore = loadTopScore();

    resize();
    window.addEventListener("resize", resize);

    requestAnimationFrame(gameLoop);
}

function resize() {
    const dpr = window.devicePixelRatio || 1;
    const availableWidth = window.innerWidth * 0.94 * dpr;
    const availableHeight = (window.innerHeight - 64) * dpr;

    scale = Math.max(1, Math.floor(Math.min(availableWidth / NES_WIDTH, availableHeight / NES_HEIGHT)));

    canvas.width = NES_WIDTH * scale;
    canvas.height = NES_HEIGHT * scale;
    canvas.style.width = `${canvas.width / dpr}px`;
    canvas.style.height = `${canvas.height / dpr}px`;
}

// ---------------------------------------------------------------------------
// Input

const KEY_BINDINGS = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    KeyX: "rotateCw",
    KeyZ: "rotateCcw",
    Enter: "start",
    ShiftRight: "select",
    ShiftLeft: "select"
};

// Standard gamepad mapping: face buttons on the right act as A/B like an NES pad.
const PAD_BINDINGS = {
    12: "up", 13: "down", 14: "left", 15: "right",
    1: "rotateCw", 0: "rotateCcw", 9: "start", 8: "select"
};

window.addEventListener("keydown", (event) => {
    const button = KEY_BINDINGS[event.code];
    if (button) {
        keyboard[button] = true;
        latched[button] = true;
        event.preventDefault();
    }
});

window.addEventListener("keyup", (event) => {
    const button = KEY_BINDINGS[event.code];
    if (button) {
        keyboard[button] = false;
        event.preventDefault();
    }
});

window.addEventListener("blur", () => {
    keyboard.copyFrom(new InputState());
});

function pollInput() {
    input.copyFrom(keyboard);
    for (const button of InputState.BUTTONS) {
        input[button] ||= latched[button];
    }
    latched.copyFrom(new InputState());

    for (const pad of navigator.getGamepads?.() ?? []) {
        if (!pad) {
            continue;
        }

        for (const [index, button] of Object.entries(PAD_BINDINGS)) {
            if (pad.buttons[index]?.pressed) {
                input[button] = true;
            }
        }
    }
}

function loadTopScore() {
    try {
        return Number(localStorage.getItem(TOP_SCORE_KEY)) || game.topScore;
    }
    catch {
        return game.topScore;
    }
}

let savedTopScore = 0;
function saveTopScore() {
    if (game.topScore === savedTopScore) {
        return;
    }

    savedTopScore = game.topScore;
    try {
        localStorage.setItem(TOP_SCORE_KEY, String(game.topScore));
    }
    catch {
        // Storage can be unavailable (private mode); the score just won't persist.
    }
}

// ---------------------------------------------------------------------------
// Drawing primitives

function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function text(ctx, str, x, y, color = WHITE, size = 8) {
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
}

function textCentered(ctx, str, cx, y, color = WHITE, size = 8) {
    text(ctx, str, cx - (str.length * size) / 2, y, color, size);
}

function number(value, digits) {
    return String(value).padStart(digits, "0");
}

// A black panel with the NES-style double rounded border.
function panel(ctx, x, y, w, h) {
    rect(ctx, x + 1, y, w - 2, h, FRAME_LIGHT);
    rect(ctx, x, y + 1, w, h - 2, FRAME_LIGHT);
    rect(ctx, x + 1, y + 1, w - 2, h - 2, FRAME_DARK);
    rect(ctx, x + 2, y + 2, w - 4, h - 4, BLACK);
}

function levelColors(level) {
    const [light, dark] = LEVEL_COLORS[level % LEVEL_COLORS.length];
    return { light: NES_PALETTE[light], dark: NES_PALETTE[dark] };
}

// Recreates the three block tiles from the NES CHR ROM, `size` includes the 1px gap.
function drawBlock(ctx, x, y, style, colors, size = CELL) {
    const n = size - 1;

    if (style === BlockStyle.WHITE) {
        rect(ctx, x, y, n, n, colors.dark);
        rect(ctx, x + 1, y + 1, n - 2, n - 2, WHITE);
        rect(ctx, x, y, 1, 1, WHITE);
        return;
    }

    rect(ctx, x, y, n, n, style === BlockStyle.LIGHT ? colors.light : colors.dark);
    rect(ctx, x, y, 1, 1, WHITE);
    rect(ctx, x + 1, y + 1, 2, 1, WHITE);
    rect(ctx, x + 1, y + 2, 1, 1, WHITE);
}

// Draws a piece in its spawn orientation centered on (cx, cy).
function drawPieceCentered(ctx, type, cx, cy, colors, size = CELL) {
    const definition = PIECE_DEFINITIONS[type];
    const blocks = definition.rotations[definition.spawnRotation];

    const xs = blocks.map(([dx]) => dx);
    const ys = blocks.map(([, dy]) => dy);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const width = (Math.max(...xs) - minX + 1) * size;
    const height = (Math.max(...ys) - minY + 1) * size;

    const originX = Math.round(cx - width / 2);
    const originY = Math.round(cy - height / 2);

    for (const [dx, dy] of blocks) {
        drawBlock(ctx, originX + (dx - minX) * size, originY + (dy - minY) * size, BLOCK_STYLES[type], colors, size);
    }
}

// A dark brick wall, rendered once at NES resolution.
function createBackground() {
    const bg = document.createElement("canvas");
    bg.width = NES_WIDTH;
    bg.height = NES_HEIGHT;
    const b = bg.getContext("2d");

    rect(b, 0, 0, NES_WIDTH, NES_HEIGHT, "#2E2E3A");

    for (let row = 0; row * 8 < NES_HEIGHT; row++) {
        const offset = (row % 2) * 8;
        const y = row * 8;

        rect(b, 0, y, NES_WIDTH, 1, "#3C3C4C");
        rect(b, 0, y + 7, NES_WIDTH, 1, "#1E1E28");

        for (let x = -offset; x < NES_WIDTH; x += 16) {
            rect(b, x + 15, y, 1, 8, "#1E1E28");
            rect(b, x, y + 1, 1, 6, "#3C3C4C");
        }
    }

    return bg;
}

// ---------------------------------------------------------------------------
// Screens

function draw(ctx, game) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;

    if (game.flash) {
        rect(ctx, 0, 0, NES_WIDTH, NES_HEIGHT, WHITE);
    }
    else {
        ctx.drawImage(backgroundCanvas, 0, 0);
    }

    if (game.mode === GameMode.MENU) {
        drawMenu(ctx, game);
    }
    else {
        drawGame(ctx, game);
    }
}

const TITLE_COLORS = ["#F83800", "#FCA044", "#F8D878", "#58D854", "#3CBCFC", "#B884FC"];

function drawMenu(ctx, game) {
    panel(ctx, 32, 24, 192, 64);
    const title = "TETRIS";
    for (let i = 0; i < title.length; i++) {
        const x = 56 + i * 24;
        text(ctx, title[i], x + 2, 40 + 2, "#20202C", 24);
        text(ctx, title[i], x, 40, TITLE_COLORS[i], 24);
    }
    textCentered(ctx, "NES RULES", 128, 72, FRAME_LIGHT);

    panel(ctx, 64, 100, 128, 72);
    textCentered(ctx, "LEVEL", 128, 108);

    const boost = game.previousInput.rotateCw ? 10 : 0;
    for (let level = 0; level < 10; level++) {
        const x = 84 + (level % 5) * 18;
        const y = 126 + Math.floor(level / 5) * 20;
        const selected = level === game.menuLevel;

        if (selected && (game.frameCounter & 4) === 0) {
            rect(ctx, x - 3, y - 4, 16, 16, NES_PALETTE[0x27]);
        }
        rect(ctx, x - 2, y - 3, 14, 14, selected ? BLACK : "#181820");
        text(ctx, String(level), x + 1, y, selected ? NES_PALETTE[0x27] : WHITE);
    }

    if (boost) {
        textCentered(ctx, `+10  (${game.menuLevel + boost})`, 128, 180, NES_PALETTE[0x27]);
    }
    else if ((game.frameCounter & 32) === 0) {
        textCentered(ctx, "PUSH START", 128, 180);
    }

    panel(ctx, 64, 196, 128, 28);
    text(ctx, "TOP", 76, 206, FRAME_LIGHT);
    text(ctx, number(game.topScore, 6), 132, 206);
}

function drawGame(ctx, game) {
    const colors = levelColors(game.level);

    panel(ctx, 20, 16, 64, 24);
    text(ctx, "A-TYPE", 28, 24);

    panel(ctx, 92, 16, 88, 24);
    text(ctx, `LINES-${number(game.lines, 3)}`, 100, 24);

    drawStatistics(ctx, game, colors);

    panel(ctx, 93, 45, 86, 166);
    drawField(ctx, game, colors);

    panel(ctx, 186, 16, 64, 64);
    text(ctx, "TOP", 194, 24);
    text(ctx, number(game.topScore, 6), 194, 34);
    text(ctx, "SCORE", 194, 52);
    text(ctx, number(game.score, 6), 194, 62);

    panel(ctx, 186, 92, 48, 52);
    text(ctx, "NEXT", 194, 100);
    if (game.showNext && !game.paused) {
        drawPieceCentered(ctx, game.nextPiece.type, 210, 125, colors);
    }

    panel(ctx, 186, 156, 48, 36);
    text(ctx, "LEVEL", 190, 164);
    text(ctx, number(game.level, 2), 202, 176);
}

function drawStatistics(ctx, game, colors) {
    panel(ctx, 4, 52, 86, 160);
    text(ctx, "STATISTICS", 6, 60, WHITE);
    rect(ctx, 6, 70, 80, 1, FRAME_DARK);

    const order = [PieceType.T, PieceType.J, PieceType.Z, PieceType.O, PieceType.S, PieceType.L, PieceType.I];
    order.forEach((type, i) => {
        const y = 84 + i * 18;
        drawPieceCentered(ctx, type, 30, y, colors, 6);
        text(ctx, number(game.statistics[type], 3), 56, y - 4, TEXT_RED);
    });
}

function drawField(ctx, game, colors) {
    rect(ctx, FIELD_X, FIELD_Y, Board.WIDTH * CELL, Board.HEIGHT * CELL, BLACK);

    // The NES hides the playfield while paused.
    if (game.paused) {
        textCentered(ctx, "PAUSE", FIELD_X + 40, FIELD_Y + 76);
        return;
    }

    const board = game.board;
    for (let y = 0; y < Board.HEIGHT; y++) {
        const clearing = game.clearingRows?.includes(y);

        for (let x = 0; x < Board.WIDTH; x++) {
            const value = board.get(x, y);
            if (value === 0) {
                continue;
            }

            if (clearing && x >= 5 - game.clearStep && x <= 4 + game.clearStep) {
                continue;
            }

            drawBlock(ctx, FIELD_X + x * CELL, FIELD_Y + y * CELL, BLOCK_STYLES[value], colors);
        }
    }

    if (game.mode === GameMode.PLAYING && game.playState === PlayState.ACTIVE) {
        drawCurrentPiece(ctx, game.currentPiece, colors);
    }

    if (game.mode === GameMode.GAME_OVER) {
        drawCurtain(ctx, game, colors);
    }
}

function drawCurrentPiece(ctx, piece, colors) {
    for (const [dx, dy] of piece.blocks()) {
        const x = piece.x + dx;
        const y = piece.y + dy;

        if (y < 0) {
            continue;
        }

        drawBlock(ctx, FIELD_X + x * CELL, FIELD_Y + y * CELL, BLOCK_STYLES[piece.type], colors);
    }
}

function drawCurtain(ctx, game, colors) {
    for (let y = 0; y < game.curtainRow; y++) {
        for (let x = 0; x < Board.WIDTH; x++) {
            drawBlock(ctx, FIELD_X + x * CELL, FIELD_Y + y * CELL, BlockStyle.DARK, colors);
        }
    }

    if (game.curtainRow < Board.HEIGHT) {
        return;
    }

    panel(ctx, FIELD_X + 4, FIELD_Y + 56, 72, 48);
    textCentered(ctx, "GAME", FIELD_X + 40, FIELD_Y + 64);
    textCentered(ctx, "OVER", FIELD_X + 40, FIELD_Y + 76);
    if ((game.frameCounter & 32) === 0) {
        textCentered(ctx, "START", FIELD_X + 40, FIELD_Y + 90, NES_PALETTE[0x27]);
    }
}

import { TetrisGame } from "../game/game.js";
import { InputState } from "../game/input.js";
import { Piece } from "../game/piece.js";

const game = new TetrisGame();
const input = new InputState();
let ctx;

const FPS = 60;
const FRAME_TIME = 1000 / FPS;

let lastTime = performance.now();
let accumulator = 0;

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    accumulator += deltaTime;

    while (accumulator >= FRAME_TIME) {
        game.step(input);
        accumulator -= FRAME_TIME;
    }

    draw(ctx, game);

    requestAnimationFrame(gameLoop);
}

window.onload = () => {
    const canvas = document.getElementById("tetrisGameCanvas");
    canvas.style.backgroundColor = "#AAAAAA";

    ctx = canvas.getContext("2d");
    draw(ctx, game);
    
    requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
    switch (event.code) {
        case "ArrowLeft":
            input.left = true;
            break;

        case "ArrowRight":
            input.right = true;
            break;
    }
});

window.addEventListener("keyup", (event) => {
    switch (event.code) {
        case "ArrowLeft":
            input.left = false;
            break;

        case "ArrowRight":
            input.right = false;
            break;
    }
});

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function drawCurrentPiece(ctx, game, cellSize) {
    let p = game.currentPiece;
    for (const [dx, dy] of p.blocks()) {
        const x = p.x + dx;
        const y = p.y + dy;

        setColorByPiece(ctx, p.type);
        ctx.fillRect(
            x * cellSize,
            y * cellSize,
            cellSize,
            cellSize
        );
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function drawBoard(ctx, board, cellSize) {
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            const value = board.get(x, y);

            if (value === 0) {
                continue;
            }

            setColorByPiece(ctx, value);
            ctx.fillRect(
                x * cellSize,
                y * cellSize,
                cellSize,
                cellSize
            );
        }
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx 
 */
function setColorByPiece(ctx, type) {
    switch (type) {
        case 1:
            ctx.fillStyle = "#FF0000";
            break;

        case 2:
            ctx.fillStyle = "#FFFF00";
            break;

        case 3:
            ctx.fillStyle = "#00FF00";
            break;

        case 4:
            ctx.fillStyle = "#00ff95";
            break;

        case 5:
            ctx.fillStyle = "#0016df";
            break;

        case 6:
            ctx.fillStyle = "#5800cc";
            break;

        case 7:
            ctx.fillStyle = "#ff00d4";
            break;
    }
}

function draw(ctx, game) {
    ctx.clearRect(0, 0, 400, 800);
    drawBoard(ctx, game.board, 40);
    drawCurrentPiece(ctx, game, 40);
}
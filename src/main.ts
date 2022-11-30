import { Keyboard } from './utils/keyboard';
import { CellType, CityMapConfig } from './objects/City';
import { setup } from './setup';
import { defaultVehicleConfig } from './objects/Vehicle';
import { Game } from './Game';

Keyboard.initialize();

// Initialization
const { scene, renderer } = setup();

enum PaintMode {
    Street,
    Building,
    StartPoint,
}

class MapMaker {
    cols: number = 10;
    rows: number = 10;
    sqSize: number = 30;
    mousePos: { x: number; y: number } | undefined;
    startPoint: { x: number; y: number } | undefined;
    canvas: HTMLCanvasElement;
    paintMode: PaintMode = PaintMode.Street;
    finished: boolean = false;
    painting: boolean = false;
    mapConfig: string[][] = [];

    constructor(cols: number, rows: number) {
        this.cols = cols;
        this.rows = rows;
        this.mapConfig = new Array(rows)
            .fill(null)
            .map((_) => new Array(cols).fill('.'));
        // @ts-ignore
        this.canvas = document.getElementById('mapmaker')!;
        this.canvas.addEventListener('mousemove', (ev) => {
            this.mousePos = this.getMousePos(this.canvas, ev);
        });
        this.canvas.addEventListener('mousedown', (_) => {
            this.painting = true;
        });
        this.canvas.addEventListener('mouseup', (_) => {
            this.painting = false;
        });
        document
            .getElementById('paint-street')!
            .addEventListener('click', () => {
                this.paintMode = PaintMode.Street;
            });
        document
            .getElementById('paint-building')!
            .addEventListener('click', () => {
                this.paintMode = PaintMode.Building;
            });
        document
            .getElementById('paint-start')!
            .addEventListener('click', () => {
                this.paintMode = PaintMode.StartPoint;
            });
        document.getElementById('finish-map')!.addEventListener('click', () => {
            this.finish();
        });
    }

    finish() {
        if (this.startPoint) {
            this.finished = true;
        } else {
            alert('debes definir un punto de inicio!');
        }
    }

    drawGrid(ctx: CanvasRenderingContext2D) {
        this.mapConfig.forEach((_, y) => {
            ctx.moveTo(0, y * this.sqSize);
            ctx.lineTo(this.cols * this.sqSize, y * this.sqSize);
        });

        this.mapConfig[0].forEach((_, x) => {
            ctx.moveTo(x * this.sqSize, 0);
            ctx.lineTo(x * this.sqSize, this.rows * this.sqSize);
        });

        ctx.strokeStyle = 'black';
        ctx.stroke();
    }

    getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
        var rect = canvas.getBoundingClientRect(),
            scaleX = canvas.width / rect.width,
            scaleY = canvas.height / rect.height;

        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY,
        };
    }

    update() {
        const ctx = this.canvas.getContext('2d')!;

        const mouseX = this.mousePos
            ? Math.floor(this.mousePos.x / this.sqSize)
            : null;
        const mouseY = this.mousePos
            ? Math.floor(this.mousePos.y / this.sqSize)
            : null;
        console.log(mouseX, mouseY);
        this.mapConfig.forEach((row, y) =>
            row.forEach((cell, x) => {
                if (cell == CellType.Street) {
                    ctx!.fillStyle = '#00aa00';
                } else if (cell == CellType.Building) {
                    ctx!.fillStyle = '#aa0000';
                } else {
                    ctx!.fillStyle = '#0000aa';
                }

                if (mouseX && mouseY && mouseX == x && mouseY == y) {
                    if (this.painting) {
                        if (this.paintMode == PaintMode.Building) {
                            this.mapConfig[y][x] = CellType.Building;
                        } else if (this.paintMode == PaintMode.Street) {
                            this.mapConfig[y][x] = CellType.Street;
                        } else if (cell == CellType.Street) {
                            if (this.startPoint) {
                                this.mapConfig[this.startPoint.y][
                                    this.startPoint.x
                                ] = CellType.Street;
                            }
                            this.startPoint = { x, y };
                            this.mapConfig[y][x] = CellType.StartPoint;
                        }
                    }
                }

                ctx?.fillRect(
                    x * this.sqSize,
                    y * this.sqSize,
                    this.sqSize,
                    this.sqSize
                );
            })
        );

        this.drawGrid(ctx);
    }
}

const mapMaker = new MapMaker(15, 15);

function animateMapMaker() {
    if (mapMaker.finished) {
        document.getElementById('mapmaker-helper')!.hidden = true;
        document.getElementById('mapmaker')!.hidden = true;
        document.getElementById('tutorial')!.hidden = false;

        startGame(mapMaker.mapConfig);
    } else {
        requestAnimationFrame(() => animateMapMaker());
        mapMaker.update();
    }
}

animateMapMaker();

function animateGame(game: Game) {
    requestAnimationFrame(() => animateGame(game));
    game.update();
}

const startGame = (cityMapConfig: CityMapConfig) => {
    const game = new Game(scene, renderer, {
        busConfig: defaultVehicleConfig,
        cityMapConfig,
        envConfig: {
            dayDuration: 10,
        },
        debug: false,
    });

    game.init().then(() => {
        animateGame(game);

        document.getElementById('start')?.addEventListener('click', (_) => {
            document.getElementById('tutorial')!.hidden = true;
            document.getElementById('info-container')!.hidden = false;
            game.startGame();
        });
    });
};

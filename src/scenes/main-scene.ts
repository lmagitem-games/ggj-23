import { parse, ParseResult } from 'papaparse';

export const TILE_WIDTH = 128;
export const TILE_HEIGHT = 128;

export class MainScene extends Phaser.Scene {
    // Génère une map plus ou moins grande
    private tileMultiplier: number = 1;
    private levelToLoad = 'example-s' + this.tileMultiplier;
    private backgroundTiles: (number | null)[][] = [];
    private foregroundTiles: (number | null)[][] = [];
    private loadCount = 0;
    private loadNeeded = 3;
    private loaded = false;

    constructor() {
        super({ key: "MainScene" });
    }

    public preload(): void {
        // Load background
        parse(`assets/levels/${this.levelToLoad}-l0.csv`, {
            download: true,
            header: false,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results: ParseResult<Record<string, unknown>>) => {
                this.backgroundTiles = (results.data as unknown as (number | null)[][])
                    .map((arr: (number | null)[]) => arr.filter((val: number | null) => val !== null && val !== undefined))
                    .filter(arr => arr.length > 0);
                this.tick('background');
            }
        });
        // Load foreground
        parse(`assets/levels/${this.levelToLoad}-l1.csv`, {
            download: true,
            header: false,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results: ParseResult<Record<string, unknown>>) => {
                this.foregroundTiles = (results.data as unknown as (number | null)[][])
                    .map((arr: (number | null)[]) => arr.filter((val: number | null) => val !== null && val !== undefined))
                    .filter(arr => arr.length > 0)
                    .map((arr: (number | null)[]) => arr.map(val => val === -1 ? null : val))
                this.tick('foreground');
            }
        });

        this.load.image("tiles", "assets/tilemaps/medievalTiles.png");
        this.tick('tiles');
    }

    public create(): void {
        const mapWidth = this.tileMultiplier * 16; // 64
        const mapHeight = this.tileMultiplier * 9; // 36
        const failsafe = Date.now() + 3000;

        // Wait until everything is loaded
        while (!this.loaded && failsafe > Date.now()) { }

        console.log('background tiles are: ', this.backgroundTiles);
        console.log('foreground tiles are: ', this.foregroundTiles);

        if (!!this.backgroundTiles) {
            const background = this.make.tilemap({ data: this.backgroundTiles, tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT });
            background.addTilesetImage("tiles");
            const layerZero = background.createLayer(0, "tiles", 0, 0);
        }
        if (!!this.foregroundTiles) {
            const foreground = this.make.tilemap({ data: this.foregroundTiles, tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT });
            foreground.addTilesetImage("tiles");
            const layerOne = foreground.createLayer(1, "tiles", 0, 0);
        }

        this.cameras.main.setBounds(0, 0, TILE_WIDTH * mapWidth, TILE_HEIGHT * mapHeight);
        this.cameras.main.centerOn(TILE_WIDTH * mapWidth / 2, TILE_HEIGHT * mapHeight / 2);

        switch (this.tileMultiplier) {
            case 1:
                this.cameras.main.setZoom(0.417);
                break;
            case 2:
                this.cameras.main.setZoom(0.209);
                break;
            case 3:
                this.cameras.main.setZoom(0.139);
                break;
            case 4:
                this.cameras.main.setZoom(0.1042);
                break;
            case 5:
                this.cameras.main.setZoom(0.0834);
                break;
            default:
                this.cameras.main.setZoom(0.1042);
                break;
        }
    }

    public update(): void {

    }

    private tick(name: string): void {
        this.loadCount++;
        console.log(`${name} loaded! ${this.loadCount}/${this.loadNeeded}`);
        if (this.loadCount >= this.loadNeeded) {
            console.log(`loading done!`);
            this.loaded = true;
        }
    }
}

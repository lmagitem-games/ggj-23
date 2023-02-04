import { parse, ParseResult } from 'papaparse';
import { Coord } from '../objects/coord';
import { Tile, TileAsset } from '../objects/tile';

export const TILE_WIDTH = 128;
export const TILE_HEIGHT = 128;

export class MainScene extends Phaser.Scene {
    // Génère une map plus ou moins grande
    private tileMultiplier: number = 1;
    private levelToLoad = 'example-s' + this.tileMultiplier;
    private backgroundTiles: (number | null)[][] = [];
    private foregroundTiles: (number | null)[][] = [];
    private map: Tile[][] = [];
    // private roots;
    private loadCount = 0;
    private loadNeeded = 3;
    private loaded = false;

    constructor() {
        super({ key: "MainScene" });
    }

    public preload(): void {
        this.loadLevel();
        this.loadSpritesheet();
    }

    public create(): void {
        const mapWidth = this.tileMultiplier * 16; // 64
        const mapHeight = this.tileMultiplier * 9; // 36
        const failsafe = Date.now() + 3000;

        // Wait until everything is loaded
        while (!this.loaded && failsafe > Date.now()) { }

        this.initTileAnimations();
        this.initMap();
        this.initCamera(mapWidth, mapHeight);

        console.log('Initialized Map:', this.map);
    }

    public update(): void {
        // Pour chaque tile, regarder la tile qui arrive dans la direction où elle va au prochain tour

        // Appliquer le comportement prévu pour ce type de tile


    }

    private initMap() {
        for (let y = 0; y < this.backgroundTiles.length; y++) {
            const backgroundRow = this.backgroundTiles[y];
            const foregroundRow = this.foregroundTiles[y];
            const mapRow = [];
            for (let x = 0; x < backgroundRow.length; x++) {
                const csvBackground = backgroundRow[x];
                const csvForeground = foregroundRow[x];
                const tile = new Tile({
                    coords: new Coord(x, y),
                    csvBackground,
                    csvForeground
                });

                if (tile.getBackground() !== TileAsset.EMPTY) {
                    const backgroundSprite = this.add.sprite(x * TILE_WIDTH, y * TILE_HEIGHT, 'tiles');
                    backgroundSprite.setOrigin(0, 0);
                    backgroundSprite.setScale(1);
                    backgroundSprite.play(`${tile.getBackground()}`);
                    tile.setBackgroundSprite(backgroundSprite);
                }

                if (tile.getForeground() !== TileAsset.EMPTY) {
                    const foregroundSprite = this.add.sprite(x * TILE_WIDTH, y * TILE_HEIGHT, 'tiles');
                    foregroundSprite.setOrigin(0, 0);
                    foregroundSprite.setScale(1);
                    foregroundSprite.play(`${tile.getForeground()}`);
                    foregroundSprite.setDepth(1);
                    tile.setForegroundSprite(foregroundSprite);
                }


                mapRow.push(tile);
            }
            this.map.push(mapRow);
        }
    }

    private initCamera(mapWidth: number, mapHeight: number) {
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

    private tick(name: string): void {
        this.loadCount++;
        console.log(`|${'='.repeat(this.loadCount)}${' '.repeat(this.loadNeeded - this.loadCount)}| ${name} loaded!`);
        if (this.loadCount >= this.loadNeeded) {
            console.log(`Scene loaded!`);
            this.loaded = true;
        }
    }

    private loadSpritesheet() {
        this.load.spritesheet('tiles', 'assets/tilemaps/medievalTiles.png', { frameWidth: 128, frameHeight: 128 });
        this.tick('Tiles');
    }

    private loadLevel() {
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
                this.tick('Background');
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
                    .map((arr: (number | null)[]) => arr.map(val => val === -1 ? null : val));
                this.tick('Foreground');
            }
        });
    }

    private initTileAnimations() {
        this.anims.create({
            key: `${TileAsset.WATER1}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.WATER1, TileAsset.WATER2] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.GRASS1}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.GRASS1] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.GRASS2}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.GRASS2] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.SOIL1}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.SOIL1] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.SOIL2}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.SOIL2] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.SAND1}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.SAND1] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.SAND2}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.SAND2] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.TREE}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.TREE] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROCK1}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROCK1] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROCK2}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROCK2] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROCK3}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROCK3] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROCK4}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROCK4] }),
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: `${TileAsset.ROOTS_TD}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROOTS_TD] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROOTS_LR}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROOTS_LR] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROOTS_TR}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROOTS_TR] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROOTS_TL}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROOTS_TL] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROOTS_DR}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROOTS_DR] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROOTS_DL}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROOTS_DL] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROOTS_TC}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROOTS_TC] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROOTS_RC}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROOTS_RC] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROOTS_DC}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROOTS_DC] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: `${TileAsset.ROOTS_LC}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames: [TileAsset.ROOTS_LC] }),
            frameRate: 3,
            repeat: -1
        });
    }
}

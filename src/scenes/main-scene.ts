import { parse, ParseResult } from 'papaparse';
import { Coord } from '../objects/coord';
import { Behavior, Direction, Root } from '../objects/root';
import { Tile, TileAsset, TileContents, TileType, TileTypeForBehavior } from '../objects/tile';

export const TILE_WIDTH = 128;
export const TILE_HEIGHT = 128;

export class MainScene extends Phaser.Scene {
    // Génère une map plus ou moins grande
    private tileMultiplier: number = 1;
    private levelToLoad = 'example-s' + this.tileMultiplier;
    private mapWidth = this.tileMultiplier * 16;
    private mapHeight = this.tileMultiplier * 9;
    private backgroundTiles: (number | null)[][] = [];
    private foregroundTiles: (number | null)[][] = [];
    private map: Tile[][] = [];
    private roots: Root[] = [];
    private loadCount = 0;
    private loadNeeded = 5;
    private loaded = false;
    private behaviorSelected = false;
    private rootsBehavior: Map<TileTypeForBehavior, Behavior> = new Map([
        [TileTypeForBehavior.GRASS, Behavior.AHEAD],
        [TileTypeForBehavior.SOIL, Behavior.AHEAD],
        [TileTypeForBehavior.SAND, Behavior.AHEAD],
        [TileTypeForBehavior.WATER, Behavior.AHEAD],
        [TileTypeForBehavior.TREE, Behavior.LEFT],
        [TileTypeForBehavior.ROCK, Behavior.RIGHT],
        [TileTypeForBehavior.ROOTS, Behavior.LEFT],
    ]);
    private gameloopTimer: Phaser.Time.TimerEvent;
    private ambianceAudio: Phaser.Sound.BaseSound;
    private rootDirtSound: Phaser.Sound.BaseSound;
    private rootSandSound: Phaser.Sound.BaseSound;
    private rootGrassSound: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: "MainScene" });
    }

    public preload(): void {
        this.loadLevel();
        this.loadSpritesheet();
        this.loadAudio();
    }

    public create(): void {
        const failsafe = Date.now() + 3000;

        // Wait until everything is loaded
        while (!this.loaded && failsafe > Date.now()) { }

        this.initTileAnimations();
        this.initMap();
        this.initCamera();
        this.initAudio();

        // create button to choice direction
        this.add.text(100, 1000, 'Down', { font: "65px", align: "center" })
            .setOrigin(0.5)
            .setPadding(10)
            .setDepth(50)
            .setStyle({ backgroundColor: '#111' })
            .setInteractive()
            .on('pointerdown', () => console.log('pressed down'));
        this.add.text(900, 1000, 'Launch simulation', { font: "65px", align: "center" })
            .setOrigin(0.5)
            .setPadding(10)
            .setDepth(50)
            .setStyle({ backgroundColor: '#111' })
            .setInteractive()
            .on('pointerdown', () => this.behaviorSelected = true);


        console.log('Initialized Map:', this.map);
        console.log('Initialized Roots:', this.roots);

        this.gameloopTimer = this.time.addEvent({
            delay: 450,                // ms
            callback: () => this.simulationloop(),
            args: [],
            loop: true,
            repeat: 0,
            startAt: 0,
            timeScale: 1,
            paused: false
        });
    }

    private simulationloop() {
        if (this.loaded && this.behaviorSelected) {
            for (let i = 0; i < this.roots?.length; i++) {
                const root = this.roots[i];

                // Check where root will go if it goes straight ahead
                const currentTile = root.getCurrentTile();
                let currentCoord = currentTile.getCoord();
                let direction = root.getDirection();
                let nextTile: Tile | undefined = this.getNextTile(currentCoord, direction, true);

                // If there was a valid tile next
                if (!!nextTile) {
                    // Then if next tile is different that current one check where root should go according to its behavior
                    if (currentTile.getTileTypeForBehavior() !== nextTile.getTileTypeForBehavior()) {
                        const behavior = root.getBehaviorFor(nextTile.getTileTypeForBehavior());
                        direction = direction + behavior >= 0 && direction + behavior <= 3 ? direction + behavior : direction + behavior >= 4 ? 0 : 3;
                        nextTile = this.getNextTile(currentCoord, direction, false);
                    }

                    // Then move the root by updating the appropriate tiles
                    if (!!nextTile) {
                        const coord = nextTile.getCoord();
                        const oldSprite = nextTile.getForegroundSprite();
                        nextTile = new Tile({ coords: coord, csvBackground: nextTile.getTileType(), csvForeground: TileContents.ROOTS_L });
                        root.setDirection(direction);
                        root.setCurrentTile(nextTile);

                        this.map[coord.y][coord.x] = nextTile;

                        oldSprite?.destroy();
                        this.setBackgroundSprite(coord.x, coord.y, nextTile);
                        this.setForegroundSprite(coord.x, coord.y, nextTile);

                        const previousTileNewAsset =
                            // Same column but next row (down)
                            currentCoord.x === coord.x && currentCoord.y > coord.y ?
                                // Old one went from up
                                currentTile.getTileContents() === TileContents.ROOTS_T ? TileAsset.ROOTS_TD
                                    // Old one went from right
                                    : currentTile.getTileContents() === TileContents.ROOTS_R ? TileAsset.ROOTS_DR
                                        // Old one went from left
                                        : TileAsset.ROOTS_DL
                                // Same column but previous row (up)
                                : currentCoord.x === coord.x && currentCoord.y > coord.y ?
                                    // Old one went from down
                                    currentTile.getTileContents() === TileContents.ROOTS_D ? TileAsset.ROOTS_TD
                                        // Old one went from right
                                        : currentTile.getTileContents() === TileContents.ROOTS_R ? TileAsset.ROOTS_TR
                                            // Old one went from left
                                            : TileAsset.ROOTS_TL
                                    // Same row but next column (right)
                                    : currentCoord.x > coord.x && currentCoord.y === coord.y ?
                                        // Old one went from down
                                        currentTile.getTileContents() === TileContents.ROOTS_D ? TileAsset.ROOTS_DR
                                            // Old one went from up
                                            : currentTile.getTileContents() === TileContents.ROOTS_T ? TileAsset.ROOTS_TR
                                                // Old one went from left
                                                : TileAsset.ROOTS_LR
                                        // Same row but previous column (left)
                                        :
                                        // Old one went from down
                                        currentTile.getTileContents() === TileContents.ROOTS_D ? TileAsset.ROOTS_DL
                                            // Old one went from up
                                            : currentTile.getTileContents() === TileContents.ROOTS_T ? TileAsset.ROOTS_TL
                                                // Old one went from right
                                                : TileAsset.ROOTS_LR;



                        currentTile.updateForeground(previousTileNewAsset);
                        currentTile.getForegroundSprite()?.destroy();
                        this.setForegroundSprite(currentCoord.x, currentCoord.y, currentTile);

                        switch (nextTile.getTileType()) {
                            case TileType.GRASS:
                                this.rootGrassSound.play();
                                break;
                            case TileType.SAND:
                                this.rootSandSound.play();
                                break;
                            case TileType.SOIL:
                                this.rootDirtSound.play();
                                break;
                            default:
                                this.rootSandSound.play();
                                break;
                        }
                    }
                }
            }
        };
    }

    private getNextTile(currentCoord: Coord, direction: Direction, allowObstacle: boolean) {
        let nextCoord: Coord | undefined;
        let nextTile: Tile | undefined;
        let turn = 0;
        while ((nextTile === undefined || (!allowObstacle && nextTile.getTileContents() !== TileContents.NOTHING)) && turn < 4) {
            switch (direction) {
                case Direction.NORTH:
                    nextCoord = currentCoord.y > 0 ? new Coord(currentCoord.x, currentCoord.y - 1) : undefined;
                    break;
                case Direction.EAST:
                    nextCoord = currentCoord.x > 0 ? new Coord(currentCoord.x + 1, currentCoord.y) : undefined;
                    break;
                case Direction.SOUTH:
                    nextCoord = currentCoord.y < this.mapHeight - 1 ? new Coord(currentCoord.x, currentCoord.y + 1) : undefined;
                    break;
                case Direction.WEST:
                    nextCoord = currentCoord.x < this.mapWidth - 1 ? new Coord(currentCoord.x - 1, currentCoord.y) : undefined;
                    break;
            }
            nextTile = !!nextCoord ? this.map[nextCoord.x][nextCoord.y] : undefined;
            direction = direction + 1 <= 3 ? direction + 1 : 0;
            turn++;
        }
        return nextTile;
    }

    public update(): void {
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
                    this.setBackgroundSprite(x, y, tile);
                }

                if (tile.getForeground() !== TileAsset.EMPTY) {
                    this.setForegroundSprite(x, y, tile);

                    const contents = tile.getTileContents();
                    if (contents >= TileContents.ROOTS_T && contents <= TileContents.ROOTS_L) {
                        const direction = contents === TileContents.ROOTS_T ? Direction.NORTH
                            : contents === TileContents.ROOTS_R ? Direction.EAST
                                : contents === TileContents.ROOTS_D ? Direction.SOUTH
                                    : Direction.WEST;
                        this.roots.push(new Root(tile, direction, this.rootsBehavior));
                    }
                }

                mapRow.push(tile);
            }
            this.map.push(mapRow);
        }
    }

    private setBackgroundSprite(x: number, y: number, tile: Tile) {
        const backgroundSprite = this.add.sprite(x * TILE_WIDTH, y * TILE_HEIGHT, 'tiles');
        backgroundSprite.setOrigin(0, 0);
        backgroundSprite.setScale(1);
        backgroundSprite.play(`${tile.getBackground()}`);
        tile.setBackgroundSprite(backgroundSprite);
    }

    private setForegroundSprite(x: number, y: number, tile: Tile) {
        const foregroundSprite = this.add.sprite(x * TILE_WIDTH, y * TILE_HEIGHT, 'tiles');
        foregroundSprite.setOrigin(0, 0);
        foregroundSprite.setScale(1);
        foregroundSprite.play(`${tile.getForeground()}`);
        foregroundSprite.setDepth(1);
        tile.setForegroundSprite(foregroundSprite);
    }

    private initAudio() {
        this.ambianceAudio = this.sound.add('ambiance');
        this.ambianceAudio.play({ loop: true });
        this.rootDirtSound = this.sound.add('rootDirt');
        this.rootSandSound = this.sound.add('rootSand');
        this.rootGrassSound = this.sound.add('rootGrass');
    }

    private initCamera() {
        this.cameras.main.setBounds(0, 0, TILE_WIDTH * this.mapWidth, TILE_HEIGHT * this.mapHeight);
        this.cameras.main.centerOn(TILE_WIDTH * this.mapWidth / 2, TILE_HEIGHT * this.mapHeight / 2);

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

    private loadAudio() {
        this.load.audio('ambiance', 'assets/audio/AMB.mp3');
        this.tick('Ambiance track');
        this.load.audio('rootDirt', 'assets/audio/Roots_Dirt_1.mp3');
        this.load.audio('rootGrass', 'assets/audio/Roots_Grass_1.mp3');
        this.load.audio('rootSand', 'assets/audio/Roots_Sand_1.mp3');
        this.tick('Roots sounds');
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

import { parse, ParseResult } from 'papaparse';
import { Coord } from '../objects/coord';
import { Behavior, Direction, Root } from '../objects/root';
import { Tile, TileAsset, TileContents, TileType, TileTypeForBehavior } from '../objects/tile';

export const TILE_WIDTH = 128;
export const TILE_HEIGHT = 128;

export class MainScene extends Phaser.Scene {
    private initialized = false;
    private loaded = false;
    private behaviorSelected = false;

    private turn = 0;

    private tileMultiplier = 1;
    private soundParam = 0;
    private levelToLoad = 'example-s' + this.tileMultiplier;
    private mapWidth = this.tileMultiplier * 16;
    private mapHeight = this.tileMultiplier * 9;
    private backgroundTiles: (number | null)[][] = [];
    private foregroundTiles: (number | null)[][] = [];
    private map: Tile[][] = [];
    private roots: Root[] = [];
    private loadCount = 0;
    private loadNeeded = 5;
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
    private rootDirtSound1: Phaser.Sound.BaseSound;
    private rootDirtSound2: Phaser.Sound.BaseSound;
    private rootDirtSound3: Phaser.Sound.BaseSound;
    private dirtSoundTurn = 0;
    private rootSandSound1: Phaser.Sound.BaseSound;
    private rootSandSound2: Phaser.Sound.BaseSound;
    private rootSandSound3: Phaser.Sound.BaseSound;
    private sandSoundTurn = 0;
    private rootGrassSound1: Phaser.Sound.BaseSound;
    private rootGrassSound2: Phaser.Sound.BaseSound;
    private rootGrassSound3: Phaser.Sound.BaseSound;
    private grassSoundTurn = 0;
    private rootWaterSound1: Phaser.Sound.BaseSound;
    private rootWaterSound2: Phaser.Sound.BaseSound;
    private rootWaterSound3: Phaser.Sound.BaseSound;
    private waterSoundTurn = 0;

    constructor() {
        super({ key: "MainScene" });
    }

    public init(data: { tileMultiplier: number, soundParam: number }): void {
        this.tileMultiplier = data.tileMultiplier;
        this.levelToLoad = 'example-s' + this.tileMultiplier;
        this.mapWidth = this.tileMultiplier * 16;
        this.mapHeight = this.tileMultiplier * 9;
        this.soundParam = data.soundParam ?? this.soundParam;
        this.initialized = true;
    }

    public preload(): void {
        const failsafe = Date.now() + 3000;
        while (!this.initialized && failsafe > Date.now()) { }

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
        this.buildMenu();


        console.log('Initialized Map:', this.map);
        console.log('Initialized Roots:', this.roots);

        this.gameloopTimer = this.time.addEvent({
            delay: 150,
            callback: () => this.simulationloop(),
            args: [],
            loop: true,
            repeat: 0,
            startAt: 0,
            timeScale: 1,
            paused: false
        });
    }

    private buildMenu() {
        this.add.text(this.mapWidth, this.mapHeight, 'Down', { font: "65px", align: "center" })
            .setOrigin(0)
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
    }

    private simulationloop() {
        if (this.loaded && this.behaviorSelected) {
            for (let i = 0; i < this.roots?.length; i++) {
                const root = this.roots[i];

                if (this.turn % 2 === 0) {
                    // Check where root will go if it goes straight ahead
                    const currentTile = root.getCurrentTile();
                    let currentCoord = currentTile.getCoord();
                    let direction = root.getDirection();
                    let nextTile: Tile | undefined = this.getNextTile(currentCoord, direction, false);

                    // If there was a valid tile next
                    if (!!nextTile && currentTile.getTileType() !== TileType.WATER) {
                        // Then if next tile is different that current one check where root should go according to its behavior
                        if (currentTile.getTileTypeForBehaviorWithoutRoots() !== nextTile.getTileTypeForBehavior()) {
                            const behavior = root.getBehaviorFor(nextTile.getTileTypeForBehavior());
                            direction = direction + behavior >= 0 && direction + behavior <= 3 ? direction + behavior : direction + behavior >= 4 ? 0 : 3;
                            nextTile = this.getNextTile(currentCoord, direction, true);
                        }

                        // Then move the root by updating the appropriate tiles
                        if (!!nextTile && !nextTile.isObstacle()) {
                            const nextCoord = nextTile.getCoord();
                            nextTile = new Tile({
                                coords: nextCoord,
                                csvBackground: nextTile.getTileType(),
                                csvForeground:
                                    // Same column but next row (down)
                                    currentCoord.x === nextCoord.x && currentCoord.y < nextCoord.y ? TileContents.ROOTS_D
                                        // Same column but previous row (up)
                                        : currentCoord.x === nextCoord.x && currentCoord.y > nextCoord.y ? TileContents.ROOTS_T
                                            // Same row but next column (right)
                                            : currentCoord.x > nextCoord.x && currentCoord.y === nextCoord.y ? TileContents.ROOTS_L
                                                // Same row but previous column (left)
                                                : TileContents.ROOTS_R
                            });
                            nextTile.setIsObstacle(true);
                            root.setNextDirection(direction);
                            root.setNextTile(nextTile);

                            this.playMovementSound(nextTile);
                        }
                    }
                } else {
                    const currentTile = root.getCurrentTile();
                    const currentCoord = currentTile.getCoord();
                    const nextTile = root.getNextTile();
                    const oldBackgroundSprite = nextTile?.getBackgroundSprite();
                    const oldForegroundSprite = nextTile?.getForegroundSprite();
                    const nextCoord = nextTile?.getCoord();
                    const direction = root.getNextDirection();

                    if (!!nextTile && currentTile.getTileType() !== TileType.WATER) {
                        root.setNextTile(undefined);
                        root.setDirection(direction);
                        root.setPreviousTile(currentTile);
                        root.setCurrentTile(nextTile);

                        this.map[currentCoord.y][currentCoord.x] = currentTile;
                        this.map[nextCoord.y][nextCoord.x] = nextTile;

                        oldForegroundSprite?.destroy();
                        nextTile.setBackgroundSprite(oldBackgroundSprite);
                        this.setForegroundSprite(nextCoord.x, nextCoord.y, nextTile);

                        const previousTileNewAsset =
                            // Same column but down
                            currentCoord.x === nextCoord.x && currentCoord.y < nextCoord.y ?
                                // Old one went from up
                                currentTile.getTileContents() === TileContents.ROOTS_D ? TileAsset.ROOTS_TD
                                    // Old one went from right
                                    : currentTile.getTileContents() === TileContents.ROOTS_L ? TileAsset.ROOTS_DR
                                        // Old one went from left
                                        : TileAsset.ROOTS_DL
                                // Same column but up
                                : currentCoord.x === nextCoord.x && currentCoord.y > nextCoord.y ?
                                    // Old one went from down
                                    currentTile.getTileContents() === TileContents.ROOTS_T ? TileAsset.ROOTS_TD
                                        // Old one went from right
                                        : currentTile.getTileContents() === TileContents.ROOTS_L ? TileAsset.ROOTS_TR
                                            // Old one went from left
                                            : TileAsset.ROOTS_TL
                                    // Same row but right
                                    : currentCoord.x < nextCoord.x && currentCoord.y === nextCoord.y ?
                                        // Old one went from down
                                        currentTile.getTileContents() === TileContents.ROOTS_T ? TileAsset.ROOTS_DR
                                            // Old one went from up
                                            : currentTile.getTileContents() === TileContents.ROOTS_D ? TileAsset.ROOTS_TR
                                                // Old one went from left
                                                : TileAsset.ROOTS_LR
                                        // Same row but left
                                        :
                                        // Old one went from down
                                        currentTile.getTileContents() === TileContents.ROOTS_T ? TileAsset.ROOTS_DL
                                            // Old one went from up
                                            : currentTile.getTileContents() === TileContents.ROOTS_D ? TileAsset.ROOTS_TL
                                                // Old one went from right
                                                : TileAsset.ROOTS_LR;



                        currentTile.updateForeground(previousTileNewAsset);
                        currentTile.getForegroundSprite()?.destroy();
                        this.setForegroundSprite(currentCoord.x, currentCoord.y, currentTile);
                    }
                }
            }
        };
        this.turn++;
    }

    private playMovementSound(nextTile: Tile) {
        const wait = Math.floor(Math.random() * 10);

        let soundsPlaying = 1;
        if (this.rootGrassSound1?.isPlaying) soundsPlaying++;
        if (this.rootGrassSound2?.isPlaying) soundsPlaying++;
        if (this.rootGrassSound3?.isPlaying) soundsPlaying++;
        if (this.rootSandSound1?.isPlaying) soundsPlaying++;
        if (this.rootSandSound2?.isPlaying) soundsPlaying++;
        if (this.rootSandSound3?.isPlaying) soundsPlaying++;
        if (this.rootDirtSound1?.isPlaying) soundsPlaying++;
        if (this.rootDirtSound2?.isPlaying) soundsPlaying++;
        if (this.rootDirtSound3?.isPlaying) soundsPlaying++;
        if (this.rootWaterSound1?.isPlaying) soundsPlaying++;
        if (this.rootWaterSound2?.isPlaying) soundsPlaying++;
        if (this.rootWaterSound3?.isPlaying) soundsPlaying++;
        let volume = this.soundParam === 1 ? Math.random() * 0.2 + 0.7 - 0.1 * soundsPlaying
            : this.soundParam === 2 ? 1 - 0.1 * soundsPlaying : 1;
        if (volume > 1) volume = 1;
        if (this.soundParam === 1 && volume > 0.8) volume = 0.8;
        if (this.soundParam === 1 && volume < 0.33) volume = 0.33;
        if (this.soundParam === 2 && volume < 0.5) volume = 0.5;
        console.log(volume)

        setTimeout(() => {
            switch (nextTile.getTileType()) {
                case TileType.GRASS:
                    switch (this.grassSoundTurn) {
                        case 0:
                            this.rootGrassSound1 = this.sound.add('rootGrass1', { volume });
                            this.rootGrassSound1.play();
                            break;
                        case 1:
                            this.rootGrassSound2 = this.sound.add('rootGrass2', { volume });
                            this.rootGrassSound2.play();
                            break;
                        default:
                            this.rootGrassSound3 = this.sound.add('rootGrass3', { volume });
                            this.rootGrassSound3.play();
                            break;
                    }
                    this.grassSoundTurn = this.grassSoundTurn + 1 < 3 ? this.grassSoundTurn + 1 : 0;
                    break;
                case TileType.SAND:
                    switch (this.sandSoundTurn) {
                        case 0:
                            this.rootSandSound1 = this.sound.add('rootSand1', { volume });
                            this.rootSandSound1.play();
                            break;
                        case 1:
                            this.rootSandSound2 = this.sound.add('rootSand2', { volume });
                            this.rootSandSound2.play();
                            break;
                        default:
                            this.rootSandSound3 = this.sound.add('rootSand3', { volume });
                            this.rootSandSound3.play();
                            break;
                    }
                    this.sandSoundTurn = this.sandSoundTurn + 1 < 3 ? this.sandSoundTurn + 1 : 0;
                    break;
                case TileType.SOIL:
                    switch (this.dirtSoundTurn) {
                        case 0:
                            this.rootDirtSound1 = this.sound.add('rootDirt1', { volume });
                            this.rootDirtSound1.play();
                            break;
                        case 1:
                            this.rootDirtSound2 = this.sound.add('rootDirt2', { volume });
                            this.rootDirtSound2.play();
                            break;
                        default:
                            this.rootDirtSound3 = this.sound.add('rootDirt3', { volume });
                            this.rootDirtSound3.play();
                            break;
                    }
                    this.dirtSoundTurn = this.dirtSoundTurn + 1 < 3 ? this.dirtSoundTurn + 1 : 0;
                    break;
                default:
                    switch (this.waterSoundTurn) {
                        case 0:
                            this.rootWaterSound1 = this.sound.add('rootWater1');
                            this.rootWaterSound1.play();
                            break;
                        case 1:
                            this.rootWaterSound2 = this.sound.add('rootWater2');
                            this.rootWaterSound2.play();
                            break;
                        default:
                            this.rootWaterSound3 = this.sound.add('rootWater3');
                            this.rootWaterSound3.play();
                            break;
                    }
                    this.waterSoundTurn = this.waterSoundTurn + 1 < 3 ? this.waterSoundTurn + 1 : 0;
                    break;
            }
        }, wait);
    }

    private getNextTile(currentCoord: Coord, direction: Direction, doObstacleBlockPath: boolean) {
        let nextCoord: Coord | undefined;
        let nextTile: Tile | undefined;
        let turn = 0;
        while ((nextTile === undefined || (doObstacleBlockPath && nextTile.isObstacle())) && turn < 4) {
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
            nextTile = !!nextCoord ? this.map[nextCoord.y][nextCoord.x] : undefined;
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
                        tile.setIsObstacle(true);
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
        this.load.audio('rootDirt1', this.soundParam === 3 ? 'assets/audio/Roots_dirt_v2bis-001.mp3' : 'assets/audio/Roots_dirt_v2-001.mp3');
        this.load.audio('rootDirt2', this.soundParam === 3 ? 'assets/audio/Roots_dirt_v2bis-002.mp3' : 'assets/audio/Roots_dirt_v2-002.mp3');
        this.load.audio('rootDirt3', this.soundParam === 3 ? 'assets/audio/Roots_dirt_v2bis-003.mp3' : 'assets/audio/Roots_dirt_v2-003.mp3');
        this.load.audio('rootGrass1', 'assets/audio/Roots_grass_v1-001.mp3');
        this.load.audio('rootGrass2', 'assets/audio/Roots_grass_v1-002.mp3');
        this.load.audio('rootGrass3', 'assets/audio/Roots_grass_v1-003.mp3');
        this.load.audio('rootSand1', 'assets/audio/Roots_sand_v1-001.mp3');
        this.load.audio('rootSand2', 'assets/audio/Roots_sand_v1-002.mp3');
        this.load.audio('rootSand3', 'assets/audio/Roots_sand_v1-003.mp3');
        this.load.audio('rootWater1', 'assets/audio/Roots_water_v1-001.mp3');
        this.load.audio('rootWater2', 'assets/audio/Roots_water_v1-002.mp3');
        this.load.audio('rootWater3', 'assets/audio/Roots_water_v1-003.mp3');
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

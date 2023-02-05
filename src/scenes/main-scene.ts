import { parse, ParseResult } from 'papaparse';
import { CONST, initialLoadCount, initialLoadingString, initialLoadNeeded } from '../const/const';
import { Coord } from '../objects/coord';
import { Behavior, Direction, Root } from '../objects/root';
import { Tile, TileAsset, TileContents, TileType, TileTypeForBehavior } from '../objects/tile';

export class MainScene extends Phaser.Scene {
    private loaded = false;
    private initialized = false;
    private behaviorSelected = false;

    private turn = 0;

    private tileMultiplier = 1;
    private soundParam = 0;
    private levelToLoad = 'example-s' + this.tileMultiplier;
    private mapTileWidth = this.tileMultiplier * 16;
    private mapPixelWidth = this.tileMultiplier * 16 * CONST.TILE_WIDTH;
    private mapTileHeight = this.tileMultiplier * 9;
    private mapPixelHeight = this.tileMultiplier * 9 * CONST.TILE_HEIGHT;
    private backgroundTiles: (number | null)[][] = [];
    private foregroundTiles: (number | null)[][] = [];
    private map: Tile[][] = [];
    private roots: Root[] = [];
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

    public init(data: { tileMultiplier: number, soundParam: number } = { tileMultiplier: 1, soundParam: 0 }): void {
        this.tileMultiplier = data.tileMultiplier;
        this.levelToLoad = 'example-s' + this.tileMultiplier;
        this.mapTileWidth = this.tileMultiplier * 16;
        this.mapPixelWidth = this.tileMultiplier * 16 * CONST.TILE_WIDTH;
        this.mapTileHeight = this.tileMultiplier * 9;
        this.mapPixelHeight = this.tileMultiplier * 9 * CONST.TILE_HEIGHT;
        this.soundParam = data.soundParam ?? this.soundParam;
        this.initialized = true;
    }

    public preload(): void {
        this.waitUntilInitialized();
        this.loadLevel();
        this.loadSpritesheet();
        this.loadUI();
        this.loadAudio();
    }

    public create(): void {
        this.waitUntilEverythingLoaded();
        this.initTileAnimations();
        this.initMap();
        this.initCamera();
        this.initAudio();
        this.buildMenu();
        this.launchGameLoop();
    }

    public update(time: number, delta: number): void {

    }

    private buildMenu() {
        const text = this.add.text(this.mapPixelWidth / 2, this.mapPixelHeight - 12, 'Launch simulation', { font: "12px", align: "center" })
            .setOrigin(0.5)
            .setPadding(4)
            .setDepth(50)
            .setStyle({ backgroundColor: '#111' })
            .setInteractive()
            .on('pointerdown', () => {
                this.behaviorSelected = true;
                text.destroy();
            });
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
                                csvForeground: this.calculateNextTileContents(currentCoord, nextCoord)
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

                        const previousTileNewAsset = this.calculateNewRootAssetForPreviousTile(currentCoord, nextCoord, currentTile);
                        currentTile.updateForeground(previousTileNewAsset);
                        currentTile.getForegroundSprite()?.destroy();
                        this.setForegroundSprite(currentCoord.x, currentCoord.y, currentTile);

                        this.checkAndIncreaseScore(nextTile);
                    }
                }
            }
        };
        this.turn++;
    }

    private checkAndIncreaseScore(nextTile: Tile): void {
        if (nextTile.getTileType() === TileType.WATER) {
            CONST.SCORE++;
            if (CONST.SCORE > CONST.HIGHSCORE)
                CONST.HIGHSCORE = CONST.SCORE;
            console.log(`${CONST.SCORE} of ${CONST.ROOTS} made it to the river!`)
        }
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
        let volume = 1 - 0.1 * soundsPlaying;
        if (volume > 1) volume = 1;
        if (volume < 0.5) volume = 0.5;

        setTimeout(() => {
            switch (nextTile.getTileType()) {
                case TileType.GRASS:
                    switch (this.grassSoundTurn) {
                        case 0:
                            this.rootGrassSound1 = this.sound.add('rootGrass1', { volume, rate: 0.8 });
                            this.rootGrassSound1.play();
                            break;
                        case 1:
                            this.rootGrassSound2 = this.sound.add('rootGrass2', { volume, rate: 0.9 });
                            this.rootGrassSound2.play();
                            break;
                        default:
                            this.rootGrassSound3 = this.sound.add('rootGrass3', { volume, rate: 1 });
                            this.rootGrassSound3.play();
                            break;
                    }
                    this.grassSoundTurn = this.grassSoundTurn + 1 < 3 ? this.grassSoundTurn + 1 : 0;
                    break;
                case TileType.SAND:
                    switch (this.sandSoundTurn) {
                        case 0:
                            this.rootSandSound1 = this.sound.add('rootSand1', { volume, rate: 1.1 });
                            this.rootSandSound1.play();
                            break;
                        case 1:
                            this.rootSandSound2 = this.sound.add('rootSand2', { volume, rate: 1.2 });
                            this.rootSandSound2.play();
                            break;
                        default:
                            this.rootSandSound3 = this.sound.add('rootSand3', { volume, rate: 0.95 });
                            this.rootSandSound3.play();
                            break;
                    }
                    this.sandSoundTurn = this.sandSoundTurn + 1 < 3 ? this.sandSoundTurn + 1 : 0;
                    break;
                case TileType.SOIL:
                    switch (this.dirtSoundTurn) {
                        case 0:
                            this.rootDirtSound1 = this.sound.add('rootDirt1', { volume, rate: 1.05 });
                            this.rootDirtSound1.play();
                            break;
                        case 1:
                            this.rootDirtSound2 = this.sound.add('rootDirt2', { volume, rate: 0.85 });
                            this.rootDirtSound2.play();
                            break;
                        default:
                            this.rootDirtSound3 = this.sound.add('rootDirt3', { volume, rate: 1.15 });
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

    private launchGameLoop() {
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
                        CONST.ROOTS++;
                        tile.setIsObstacle(true);
                    }
                }

                mapRow.push(tile);
            }
            this.map.push(mapRow);
        }
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
                    nextCoord = currentCoord.y < this.mapTileHeight - 1 ? new Coord(currentCoord.x, currentCoord.y + 1) : undefined;
                    break;
                case Direction.WEST:
                    nextCoord = currentCoord.x < this.mapTileWidth - 1 ? new Coord(currentCoord.x - 1, currentCoord.y) : undefined;
                    break;
            }
            nextTile = !!nextCoord ? this.map[nextCoord.y][nextCoord.x] : undefined;
            direction = direction + 1 <= 3 ? direction + 1 : 0;
            turn++;
        }
        return nextTile;
    }

    private setBackgroundSprite(x: number, y: number, tile: Tile) {
        const backgroundSprite = this.add.sprite(x * CONST.TILE_WIDTH, y * CONST.TILE_HEIGHT, 'tiles');
        backgroundSprite.setOrigin(0, 0);
        backgroundSprite.setScale(1);
        backgroundSprite.play(`${tile.getBackground()}`);
        tile.setBackgroundSprite(backgroundSprite);
    }

    private setForegroundSprite(x: number, y: number, tile: Tile) {
        const foregroundSprite = this.add.sprite(x * CONST.TILE_WIDTH, y * CONST.TILE_HEIGHT, 'tiles');
        foregroundSprite.setOrigin(0, 0);
        foregroundSprite.setScale(1);
        foregroundSprite.play(`${tile.getForeground()}`);
        foregroundSprite.setDepth(1);
        tile.setForegroundSprite(foregroundSprite);
    }

    private calculateNewRootAssetForPreviousTile(currentCoord: Coord, nextCoord: Coord, currentTile: Tile) {
        // Same column but down
        return currentCoord.x === nextCoord.x && currentCoord.y < nextCoord.y ?
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
    }

    private calculateNextTileContents(currentCoord: Coord, nextCoord: Coord): number {
        // Same column but next row (down)
        return currentCoord.x === nextCoord.x && currentCoord.y < nextCoord.y ? TileContents.ROOTS_D
            // Same column but previous row (up)
            : currentCoord.x === nextCoord.x && currentCoord.y > nextCoord.y ? TileContents.ROOTS_T
                // Same row but next column (right)
                : currentCoord.x > nextCoord.x && currentCoord.y === nextCoord.y ? TileContents.ROOTS_L
                    // Same row but previous column (left)
                    : TileContents.ROOTS_R;
    }

    private tick(sentence: string): void {
        CONST.LOAD_COUNT++;
        CONST.LOADING_STRING = `|${'='.repeat(CONST.LOAD_COUNT)}${' '.repeat(CONST.LOAD_NEEDED - CONST.LOAD_COUNT + 1)}|\n${sentence}...`;
        console.log(CONST.LOADING_STRING);
        if (CONST.LOAD_COUNT >= CONST.LOAD_NEEDED && !this.loaded) {
            console.log(`Scene loaded!`);
            this.loaded = true;
            CONST.LOAD_COUNT = initialLoadCount;
            CONST.LOAD_NEEDED = initialLoadNeeded;
            CONST.LOADING_STRING = initialLoadingString;
        }
    }

    private initCamera() {
        this.cameras.main.setBounds(0, 0, CONST.TILE_WIDTH * this.mapTileWidth, CONST.TILE_HEIGHT * this.mapTileHeight);
        this.cameras.main.centerOn(CONST.TILE_WIDTH * this.mapTileWidth / 2, CONST.TILE_HEIGHT * this.mapTileHeight / 2);

        switch (this.tileMultiplier) {
            case 1:
                this.cameras.main.setZoom(3.3333);
                break;
            case 2:
                this.cameras.main.setZoom(1.6666);
                break;
            case 3:
                this.cameras.main.setZoom(1.1111);
                break;
            case 4:
                this.cameras.main.setZoom(0.8333);
                break;
            case 5:
                this.cameras.main.setZoom(0.6666);
                break;
            default:
                this.cameras.main.setZoom(1.1111);
                break;
        }
    }

    private initAudio() {
        this.ambianceAudio = this.sound.add('ambiance');
        this.ambianceAudio.play({ loop: true });
    }

    private loadSpritesheet() {
        this.load.spritesheet('tiles', 'assets/tilemaps/pixelArtTiles.png', { frameWidth: CONST.TILE_WIDTH, frameHeight: CONST.TILE_HEIGHT });
        this.tick('Loading map tiles');
    }

    private loadUI() {
        this.load.image('grey-left-arrow', 'assets/ui/grey_sliderLeft.png');
        this.load.image('grey-right-arrow', 'assets/ui/grey_sliderRight.png');
        this.load.image('grey-panel', 'assets/ui/grey_sliderRight.png');
        this.load.image('green-left-arrow', 'assets/ui/green_sliderLeft.png');
        this.load.image('green-right-arrow', 'assets/ui/green_sliderRight.png');
        this.load.image('green-button', 'assets/ui/green_button03.png');
        this.tick('Generating the UI');
    }

    private loadAudio() {
        this.load.audio('ambiance', 'assets/audio/AMB.mp3');
        this.tick('Loading forest ambiance');
        this.load.audio('rootDirt1', 'assets/audio/Roots_dirt_v2-001.mp3');
        this.load.audio('rootDirt2', 'assets/audio/Roots_dirt_v2-002.mp3');
        this.load.audio('rootDirt3', 'assets/audio/Roots_dirt_v2-003.mp3');
        this.load.audio('rootGrass1', 'assets/audio/Roots_grass_v1-001.mp3');
        this.load.audio('rootGrass2', 'assets/audio/Roots_grass_v1-002.mp3');
        this.load.audio('rootGrass3', 'assets/audio/Roots_grass_v1-003.mp3');
        this.load.audio('rootSand1', 'assets/audio/Roots_sand_v2-001.mp3');
        this.load.audio('rootSand2', 'assets/audio/Roots_sand_v2-002.mp3');
        this.load.audio('rootSand3', 'assets/audio/Roots_sand_v2-003.mp3');
        this.load.audio('rootWater1', 'assets/audio/Roots_water_v1-001.mp3');
        this.load.audio('rootWater2', 'assets/audio/Roots_water_v1-002.mp3');
        this.load.audio('rootWater3', 'assets/audio/Roots_water_v1-003.mp3');
        this.tick('Loading roots audio');
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
                this.tick('Processing background');
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
                this.tick('Processing foreground');
            }
        });
    }

    private initTileAnimations() {
        this.createTileAnim(TileAsset.WATER1, [TileAsset.WATER1, TileAsset.WATER2]);
        this.createTileAnim(TileAsset.GRASS1, [TileAsset.GRASS1]);
        this.createTileAnim(TileAsset.GRASS2, [TileAsset.GRASS2]);
        this.createTileAnim(TileAsset.SOIL1, [TileAsset.SOIL1]);
        this.createTileAnim(TileAsset.SOIL2, [TileAsset.SOIL2]);
        this.createTileAnim(TileAsset.SAND1, [TileAsset.SAND1]);
        this.createTileAnim(TileAsset.SAND2, [TileAsset.SAND2]);
        this.createTileAnim(TileAsset.TREE1, [TileAsset.TREE1]);
        this.createTileAnim(TileAsset.TREE2, [TileAsset.TREE2]);
        this.createTileAnim(TileAsset.TREE3, [TileAsset.TREE3]);
        this.createTileAnim(TileAsset.TREE4, [TileAsset.TREE4]);
        this.createTileAnim(TileAsset.ROCK1, [TileAsset.ROCK1]);
        this.createTileAnim(TileAsset.ROCK2, [TileAsset.ROCK2]);
        this.createTileAnim(TileAsset.ROCK3, [TileAsset.ROCK3]);
        this.createTileAnim(TileAsset.ROCK4, [TileAsset.ROCK4]);

        this.createTileAnim(TileAsset.ROOTS_TD, [TileAsset.ROOTS_TD]);
        this.createTileAnim(TileAsset.ROOTS_LR, [TileAsset.ROOTS_LR]);
        this.createTileAnim(TileAsset.ROOTS_TR, [TileAsset.ROOTS_TR]);
        this.createTileAnim(TileAsset.ROOTS_TL, [TileAsset.ROOTS_TL]);
        this.createTileAnim(TileAsset.ROOTS_DR, [TileAsset.ROOTS_DR]);
        this.createTileAnim(TileAsset.ROOTS_DL, [TileAsset.ROOTS_DL]);
        this.createTileAnim(TileAsset.ROOTS_TC, [TileAsset.ROOTS_TC]);
        this.createTileAnim(TileAsset.ROOTS_RC, [TileAsset.ROOTS_RC]);
        this.createTileAnim(TileAsset.ROOTS_DC, [TileAsset.ROOTS_DC]);
        this.createTileAnim(TileAsset.ROOTS_LC, [TileAsset.ROOTS_LC]);
    }

    private createTileAnim(key: number, frames: number[]) {
        this.anims.create({
            key: `${key}`,
            frames: this.anims.generateFrameNumbers('tiles', { frames }),
            frameRate: 3,
            repeat: -1
        });
    }

    private waitUntilInitialized() {
        const failsafe = Date.now() + 3000;
        while (!this.initialized && failsafe > Date.now()) { }
    }

    private waitUntilEverythingLoaded() {
        const failsafe = Date.now() + 3000;
        while (!this.loaded && failsafe > Date.now()) { }
    }
}

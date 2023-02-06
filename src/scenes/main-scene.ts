import { parse, ParseResult } from 'papaparse';
import { CONST, initialLoadCount, initialLoadingString, initialLoadNeeded } from '../const/const';
import { Coord } from '../objects/coord';
import { Behavior, Direction, Root } from '../objects/root';
import { Tile, TileAsset, TileContents, TileType, TileTypeForBehavior } from '../objects/tile';

export class MainScene extends Phaser.Scene {
    private loaded: boolean;
    private initialized: boolean;
    private behaviorSelected: boolean;
    private turn: number;
    private tileMultiplier: number;
    private soundParam: number;
    private mapLevel: number;
    private levelToLoad: string;
    private mapTileWidth: number;
    private mapPixelWidth: number;
    private mapTileHeight: number;
    private mapPixelHeight: number;
    private backgroundTiles: (number | null)[][];
    private foregroundTiles: (number | null)[][];
    private map: Tile[][];
    private roots: Root[];
    private rootsToRemove: number[];
    private rootsBehavior: Map<TileTypeForBehavior, Behavior>;
    private behaviorInputs: {
        grass: {
            leftArrow?: Phaser.GameObjects.Sprite,
            topArrow?: Phaser.GameObjects.Sprite,
            rightArrow?: Phaser.GameObjects.Sprite,
            panel?: Phaser.GameObjects.Sprite,
            tile?: Phaser.GameObjects.Sprite,
            selected: Behavior
        },
        soil: {
            leftArrow?: Phaser.GameObjects.Sprite,
            topArrow?: Phaser.GameObjects.Sprite,
            rightArrow?: Phaser.GameObjects.Sprite,
            panel?: Phaser.GameObjects.Sprite,
            tile?: Phaser.GameObjects.Sprite,
            selected: Behavior
        },
        sand: {
            leftArrow?: Phaser.GameObjects.Sprite,
            topArrow?: Phaser.GameObjects.Sprite,
            rightArrow?: Phaser.GameObjects.Sprite,
            panel?: Phaser.GameObjects.Sprite,
            tile?: Phaser.GameObjects.Sprite,
            selected: Behavior
        },
        trees: {
            leftArrow?: Phaser.GameObjects.Sprite,
            topArrow?: Phaser.GameObjects.Sprite,
            rightArrow?: Phaser.GameObjects.Sprite,
            panel?: Phaser.GameObjects.Sprite,
            tile?: Phaser.GameObjects.Sprite,
            selected: Behavior
        },
        rocks: {
            leftArrow?: Phaser.GameObjects.Sprite,
            topArrow?: Phaser.GameObjects.Sprite,
            rightArrow?: Phaser.GameObjects.Sprite,
            panel?: Phaser.GameObjects.Sprite,
            tile?: Phaser.GameObjects.Sprite,
            selected: Behavior
        },
        roots: {
            leftArrow?: Phaser.GameObjects.Sprite,
            topArrow?: Phaser.GameObjects.Sprite,
            rightArrow?: Phaser.GameObjects.Sprite,
            panel?: Phaser.GameObjects.Sprite,
            tile?: Phaser.GameObjects.Sprite,
            selected: Behavior
        }
    };

    private waterBarContainer: Phaser.GameObjects.Graphics;
    private waterBarFill: Phaser.GameObjects.Graphics;
    private gameloopTimer: Phaser.Time.TimerEvent;
    private ambianceAudio: Phaser.Sound.BaseSound;
    private sound1: Phaser.Sound.BaseSound;
    private sound2: Phaser.Sound.BaseSound;
    private sound3: Phaser.Sound.BaseSound;
    private sound4: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: "MainScene" });
        this.clearConfig();
    }

    public init(data: { tileMultiplier: number, map: number, soundParam: number } = { tileMultiplier: 1, map: 1, soundParam: 0 }): void {
        this.mapLevel = data.map;
        this.tileMultiplier = data.tileMultiplier;
        this.levelToLoad = this.mapLevel + '-s' + this.tileMultiplier;
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
        setTimeout(() => {
        this.waitUntilEverythingLoaded(); // doesn't appear to be of any use?
        this.initTileAnimations();
        this.initMap();
        this.initCamera();
        this.initAudio();
        this.buildMenu();
        this.launchGameLoop();
        this.addWaterBar();
        }, 50);
    }

    public update(time: number, delta: number): void {
        if (this.behaviorSelected) {
            if (CONST.SCORE > 0) {
                this.waterBarFill.fillStyle(0x0000FF);
                this.waterBarFill.fillRect(this.mapPixelWidth - 15, this.mapPixelHeight - 106 - CONST.SCORE / CONST.ROOTS * 32, 10, CONST.SCORE / CONST.ROOTS * 32);
            }
        }
    }

    private buildMenu() {
        const scale = this.tileMultiplier * 0.33;
        const centerWidth = this.mapPixelWidth / 2;
        const centerHeight = this.mapPixelHeight / 2;
        const thirdHeight = this.mapPixelHeight / 10;
        const leftColumn = centerWidth / 2 + 70 * scale;
        const rightColumn = centerWidth + centerWidth / 2 - 70 * scale;
        const firstRow = thirdHeight * 2;
        const secondRow = thirdHeight * 4.5;
        const thirdRow = thirdHeight * 7;

        const layer = this.add.layer();
        layer.setDepth(100);

        // COL 1 ROW 1
        layer.add(this.behaviorInputs.grass.leftArrow = this.add.sprite(leftColumn - 50 * scale, firstRow, 'grey-left-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.LEFT, TileTypeForBehavior.GRASS, this.behaviorInputs.grass)));
        layer.add(this.behaviorInputs.grass.topArrow = this.add.sprite(leftColumn, firstRow - 50 * scale, 'grey-top-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.AHEAD, TileTypeForBehavior.GRASS, this.behaviorInputs.grass)));
        layer.add(this.behaviorInputs.grass.rightArrow = this.add.sprite(leftColumn + 50 * scale, firstRow, 'grey-right-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.RIGHT, TileTypeForBehavior.GRASS, this.behaviorInputs.grass)));
        layer.add(this.behaviorInputs.grass.panel = this.add.sprite(leftColumn, firstRow, 'grey-panel')
            .setScale(scale * 0.8)
            .setDepth(50));
        layer.add(this.behaviorInputs.grass.tile = this.add.sprite(leftColumn, firstRow, 'tiles')
            .setScale(this.tileMultiplier)
            .setDepth(75)
            .play(`${TileAsset.GRASS1}`));

        // COL 1 ROW 2
        layer.add(this.behaviorInputs.soil.leftArrow = this.add.sprite(leftColumn - 50 * scale, secondRow, 'grey-left-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.LEFT, TileTypeForBehavior.SOIL, this.behaviorInputs.soil)));
        layer.add(this.behaviorInputs.soil.topArrow = this.add.sprite(leftColumn, secondRow - 50 * scale, 'grey-top-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.AHEAD, TileTypeForBehavior.SOIL, this.behaviorInputs.soil)));
        layer.add(this.behaviorInputs.soil.rightArrow = this.add.sprite(leftColumn + 50 * scale, secondRow, 'grey-right-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.RIGHT, TileTypeForBehavior.SOIL, this.behaviorInputs.soil)));
        layer.add(this.behaviorInputs.soil.panel = this.add.sprite(leftColumn, secondRow, 'grey-panel')
            .setScale(scale * 0.8)
            .setDepth(50));
        layer.add(this.behaviorInputs.soil.tile = this.add.sprite(leftColumn, secondRow, 'tiles')
            .setScale(this.tileMultiplier)
            .setDepth(75)
            .play(`${TileAsset.SOIL1}`));

        // COL 1 ROW 3
        layer.add(this.behaviorInputs.sand.leftArrow = this.add.sprite(leftColumn - 50 * scale, thirdRow, 'grey-left-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.LEFT, TileTypeForBehavior.SAND, this.behaviorInputs.sand)));
        layer.add(this.behaviorInputs.sand.topArrow = this.add.sprite(leftColumn, thirdRow - 50 * scale, 'grey-top-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.AHEAD, TileTypeForBehavior.SAND, this.behaviorInputs.sand)));
        layer.add(this.behaviorInputs.sand.rightArrow = this.add.sprite(leftColumn + 50 * scale, thirdRow, 'grey-right-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.RIGHT, TileTypeForBehavior.SAND, this.behaviorInputs.sand)));
        layer.add(this.behaviorInputs.sand.panel = this.add.sprite(leftColumn, thirdRow, 'grey-panel')
            .setScale(scale * 0.8)
            .setDepth(50));
        layer.add(this.behaviorInputs.sand.tile = this.add.sprite(leftColumn, thirdRow, 'tiles')
            .setScale(this.tileMultiplier)
            .setDepth(75)
            .play(`${TileAsset.SAND1}`));

        // COL 2 ROW 1
        layer.add(this.behaviorInputs.rocks.leftArrow = this.add.sprite(rightColumn - 50 * scale, firstRow, 'grey-left-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.LEFT, TileTypeForBehavior.ROCK, this.behaviorInputs.rocks)));
        layer.add(this.behaviorInputs.rocks.rightArrow = this.add.sprite(rightColumn + 50 * scale, firstRow, 'grey-right-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.RIGHT, TileTypeForBehavior.ROCK, this.behaviorInputs.rocks)));
        layer.add(this.behaviorInputs.rocks.panel = this.add.sprite(rightColumn, firstRow, 'grey-panel')
            .setScale(scale * 0.8)
            .setDepth(50));
        layer.add(this.behaviorInputs.rocks.tile = this.add.sprite(rightColumn, firstRow, 'tiles')
            .setScale(this.tileMultiplier)
            .setDepth(75)
            .play(`${TileAsset.ROCK2}`));

        // COL 2 ROW 2
        layer.add(this.behaviorInputs.trees.leftArrow = this.add.sprite(rightColumn - 50 * scale, secondRow, 'grey-left-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.LEFT, TileTypeForBehavior.TREE, this.behaviorInputs.trees)));
        layer.add(this.behaviorInputs.trees.rightArrow = this.add.sprite(rightColumn + 50 * scale, secondRow, 'grey-right-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.RIGHT, TileTypeForBehavior.TREE, this.behaviorInputs.trees)));
        layer.add(this.behaviorInputs.trees.panel = this.add.sprite(rightColumn, secondRow, 'grey-panel')
            .setScale(scale * 0.8)
            .setDepth(50));
        layer.add(this.behaviorInputs.trees.tile = this.add.sprite(rightColumn, secondRow, 'tiles')
            .setScale(this.tileMultiplier)
            .setDepth(75)
            .play(`${TileAsset.TREE1}`));

        // COL 2 ROW 3
        layer.add(this.behaviorInputs.roots.leftArrow = this.add.sprite(rightColumn - 50 * scale, thirdRow, 'grey-left-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.LEFT, TileTypeForBehavior.ROOTS, this.behaviorInputs.roots)));
        layer.add(this.behaviorInputs.roots.rightArrow = this.add.sprite(rightColumn + 50 * scale, thirdRow, 'grey-right-arrow')
            .setScale(scale)
            .setDepth(55)
            .setInteractive()
            .on('pointerdown', () => this.setSelected(Behavior.RIGHT, TileTypeForBehavior.ROOTS, this.behaviorInputs.roots)));
        layer.add(this.behaviorInputs.roots.panel = this.add.sprite(rightColumn, thirdRow, 'grey-panel')
            .setScale(scale * 0.8)
            .setDepth(50));
        layer.add(this.behaviorInputs.roots.tile = this.add.sprite(rightColumn, thirdRow, 'tiles')
            .setScale(this.tileMultiplier)
            .setDepth(75)
            .play(`${TileAsset.ROOTS_DC}`));

        const hideText = 'Hide menu';
        const showText = 'Show Menu';
        const hideMenu = this.add.text(100 * scale, this.mapPixelHeight - 40 * scale, hideText, { font: "14px", align: "center" })
            .setOrigin(0, 0)
            .setPadding(4)
            .setScale(scale)
            .setDepth(100)
            .setStyle({ backgroundColor: '#111' })
            .setInteractive()
            .on('pointerdown', () => {
                if (hideMenu.text === hideText) {
                    hideMenu.setText(showText);
                    layer.setAlpha(0);
                } else {
                    hideMenu.setText(hideText);
                    layer.setAlpha(1);
                }
            });

        this.add.text(12, 12, 'Back', { font: "14px", align: "center" })
            .setOrigin(0)
            .setPadding(4)
            .setScale(scale)
            .setDepth(50)
            .setStyle({ backgroundColor: '#111' })
            .setInteractive()
            .on('pointerdown', () => {
                layer.destroy();
                this.clearScene();
            });

        const text = this.add.text(this.mapPixelWidth - 100 * scale, this.mapPixelHeight - 40 * scale, 'Launch simulation', { font: "14px", align: "center" })
            .setOrigin(1, 0)
            .setPadding(4)
            .setScale(scale)
            .setDepth(100)
            .setStyle({ backgroundColor: '#111' })
            .setInteractive()
            .on('pointerdown', () => {
                this.behaviorSelected = true;
                text.destroy();
                hideMenu.destroy();
                layer.destroy();
            });

        this.setSelected(this.behaviorInputs.grass.selected, TileTypeForBehavior.GRASS, this.behaviorInputs.grass);
        this.setSelected(this.behaviorInputs.soil.selected, TileTypeForBehavior.SOIL, this.behaviorInputs.soil);
        this.setSelected(this.behaviorInputs.sand.selected, TileTypeForBehavior.SAND, this.behaviorInputs.sand);
        this.setSelected(this.behaviorInputs.trees.selected, TileTypeForBehavior.TREE, this.behaviorInputs.trees);
        this.setSelected(this.behaviorInputs.rocks.selected, TileTypeForBehavior.ROCK, this.behaviorInputs.rocks);
        this.setSelected(this.behaviorInputs.roots.selected, TileTypeForBehavior.ROOTS, this.behaviorInputs.roots);
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
                        this.playMovementSound(nextTile.getTileTypeForBehavior(), i);

                        // Then if next tile is different that current one check where root should go according to its behavior
                        if (currentTile.getTileTypeForBehaviorWithoutRoots() !== nextTile.getTileTypeForBehavior()) {
                            let behavior = root.getBehaviorFor(nextTile.getTileTypeForBehavior());
                            direction = direction + behavior >= 0 && direction + behavior <= 3 ? direction + behavior : direction + behavior >= 4 ? 0 : 3;
                            nextTile = this.getNextTile(currentCoord, direction, true);
                            behavior = root.getBehaviorFor(nextTile?.getTileTypeForBehavior()) || 0;
                            direction = direction + behavior >= 0 && direction + behavior <= 3 ? direction + behavior : direction + behavior >= 4 ? 0 : 3;
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
                        } else {
                            // There is nowhere to go.
                            this.endRoot(root);
                        }
                    } else {
                        // There is nowhere to go.
                        this.endRoot(root);
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

                        this.checkAndIncreaseScore(root, nextTile);
                    }
                }
            }
        };
        this.turn++;

        if (this.rootsToRemove.length > 0) {
            this.roots = this.roots.filter(r => !this.rootsToRemove.includes(r.id));
            this.rootsToRemove = [];
        }
    }

    private endRoot(root: Root): void {
        console.log(`Root n°${root.id} (${root.getCurrentTile().getCoord().x}:${root.getCurrentTile().getCoord().y}, dir: ${root.getDirection()}) has ended its journey`);
        this.rootsToRemove.push(root.id);
        setTimeout(() => {
            if (this.roots.length < 1) {
                this.gameOver();
            }
        });
    }

    private gameOver(): void {
        setTimeout(() => {
            this.gameloopTimer.remove();
            if (CONST.SCORE / CONST.ROOTS <= 0.666) {
                this.add.text(this.mapPixelWidth / 2, this.mapPixelHeight / 2, 'The tree`s going to die of thirst :(', { font: "12px", align: "center" })
                    .setOrigin(0.5)
                    .setPadding(4)
                    .setDepth(50)
            } else {
                this.add.text(this.mapPixelWidth / 2, this.mapPixelHeight / 2, 'The tree drinks plenty of water! :)', { font: "12px", align: "center" })
                    .setOrigin(0.5)
                    .setPadding(4)
                    .setDepth(50)
            }
        }, 500);
    }

    private checkAndIncreaseScore(root: Root, nextTile: Tile): void {
        if (nextTile.getTileType() === TileType.WATER) {
            CONST.SCORE++;
            if (CONST.SCORE > CONST.HIGHSCORE)
                CONST.HIGHSCORE = CONST.SCORE;
            console.log(`🎉🎉🎉 Root n°${root.id} (${root.getCurrentTile().getCoord().x}:${root.getCurrentTile().getCoord().y}, dir: ${root.getDirection()}) made it to the river! (${CONST.SCORE}/${CONST.ROOTS})`)
        }
    }

    private playMovementSound(nextTile: TileTypeForBehavior, i: number) {
        if (i < 4 || nextTile === TileTypeForBehavior.WATER || nextTile === TileTypeForBehavior.ROCK) {
            const randTime = (Math.floor(Math.random() * 110) + 10);
            setTimeout(() => {
                let soundsPlaying = 0;
                if (this.sound1?.isPlaying) soundsPlaying++;
                if (this.sound2?.isPlaying) soundsPlaying++;
                if (this.sound3?.isPlaying) soundsPlaying++;
                if (this.sound4?.isPlaying) soundsPlaying++;
                let volume = 0.7 - Math.random() * 0.15 * (soundsPlaying + 1);
                if (volume > 0.7) volume = 0.7;
                if (volume < 0.4) volume = 0.4;

                switch (nextTile) {
                    case TileTypeForBehavior.GRASS:
                        switch (i) {
                            case 0:
                                this.sound1?.stop();
                                this.sound1 = this.sound.add('rootGrass1', { volume });
                                this.sound1?.play();
                                break;
                            case 1:
                                this.sound2?.stop();
                                this.sound2 = this.sound.add('rootGrass2', { volume });
                                this.sound2?.play();
                                break;
                            case 2:
                                this.sound3?.stop();
                                this.sound3 = this.sound.add('rootGrass3', { volume });
                                this.sound3?.play();
                                break;
                            default:
                                this.sound4?.stop();
                                this.sound4 = this.sound.add('rootGrass2', { volume });
                                this.sound4?.play();
                                break;
                        }
                        break;
                    case TileTypeForBehavior.SAND:
                        switch (i) {
                            case 0:
                                this.sound1?.stop();
                                this.sound1 = this.sound.add('rootSand-p1-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound1?.play();
                                break;
                            case 1:
                                this.sound2?.stop();
                                this.sound2 = this.sound.add('rootSand-p2-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound2?.play();
                                break;
                            case 2:
                                this.sound3?.stop();
                                this.sound3 = this.sound.add('rootSand-p3-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound3?.play();
                                break;
                            default:
                                this.sound4?.stop();
                                this.sound4 = this.sound.add('rootSand-p4-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound4?.play();
                                break;
                        }
                        break;
                    case TileTypeForBehavior.SOIL:
                        switch (i) {
                            case 0:
                                this.sound1?.stop();
                                this.sound1 = this.sound.add('rootDirt-p1-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound1?.play();
                                break;
                            case 1:
                                this.sound2?.stop();
                                this.sound2 = this.sound.add('rootDirt-p2-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound2?.play();
                                break;
                            case 2:
                                this.sound3?.stop();
                                this.sound3 = this.sound.add('rootDirt-p3-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound3?.play();
                                break;
                            default:
                                this.sound4?.stop();
                                this.sound4 = this.sound.add('rootDirt-p4-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound4?.play();
                                break;
                        }
                        break;
                    case TileTypeForBehavior.WATER:
                        switch (i % 4) {
                            case 0:
                                this.sound1?.stop();
                                this.sound1 = this.sound.add('rootWater1', { volume });
                                this.sound1?.play();
                                break;
                            case 1:
                                this.sound2?.stop();
                                this.sound2 = this.sound.add('rootWater2', { volume });
                                this.sound2?.play();
                                break;
                            case 2:
                                this.sound3?.stop();
                                this.sound3 = this.sound.add('rootWater3', { volume });
                                this.sound3?.play();
                                break;
                            default:
                                this.sound4?.stop();
                                this.sound4 = this.sound.add('rootWater2', { volume });
                                this.sound4?.play();
                                break;
                        }
                        break;
                    case TileTypeForBehavior.ROCK:
                        switch (i % 4) {
                            case 0:
                                this.sound1?.stop();
                                this.sound1 = this.sound.add('rootRock1', { volume: volume - 0.1 });
                                this.sound1?.play();
                                break;
                            case 1:
                                this.sound2?.stop();
                                this.sound2 = this.sound.add('rootRock2', { volume: volume - 0.1 });
                                this.sound2?.play();
                                break;
                            case 2:
                                this.sound3?.stop();
                                this.sound3 = this.sound.add('rootRock3', { volume: volume - 0.1 });
                                this.sound3?.play();
                                break;
                            default:
                                this.sound4?.stop();
                                this.sound4 = this.sound.add('rootRock4', { volume: volume - 0.1 });
                                this.sound4?.play();
                                break;
                        }
                        break;
                    default:
                        switch (i) {
                            case 0:
                                this.sound1?.stop();
                                this.sound1 = this.sound.add('rootDirt-p1-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound1?.play();
                                break;
                            case 1:
                                this.sound2?.stop();
                                this.sound2 = this.sound.add('rootDirt-p2-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound2?.play();
                                break;
                            case 2:
                                this.sound3?.stop();
                                this.sound3 = this.sound.add('rootDirt-p3-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound3?.play();
                                break;
                            default:
                                this.sound4?.stop();
                                this.sound4 = this.sound.add('rootDirt-p4-' + (Math.floor(Math.random() * 4) + 1), { volume });
                                this.sound4?.play();
                                break;
                        }
                        break;
                }
            }, randTime);
        }
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

    private setSelected(
        direction: Behavior,
        tile: TileTypeForBehavior,
        obj: {
            leftArrow?: Phaser.GameObjects.Sprite,
            topArrow?: Phaser.GameObjects.Sprite,
            rightArrow?: Phaser.GameObjects.Sprite,
            panel?: Phaser.GameObjects.Sprite,
            tile?: Phaser.GameObjects.Sprite,
            selected: Behavior
        }): void {
        obj.selected = direction;
        this.rootsBehavior.set(tile, direction);

        obj.leftArrow.setTexture(`${direction === Behavior.LEFT ? 'green' : 'grey'}-left-arrow`);
        obj.topArrow?.setTexture(`${direction === Behavior.AHEAD ? 'green' : 'grey'}-top-arrow`);
        obj.rightArrow.setTexture(`${direction === Behavior.RIGHT ? 'green' : 'grey'}-right-arrow`);
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
                        this.roots.push(new Root(CONST.ROOTS++, tile, direction, this.rootsBehavior));
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
        this.load.image('grey-top-arrow', 'assets/ui/grey_sliderUp.png');
        this.load.image('grey-right-arrow', 'assets/ui/grey_sliderRight.png');
        this.load.image('grey-panel', 'assets/ui/grey_panel.png');
        this.load.image('green-left-arrow', 'assets/ui/green_sliderLeft.png');
        this.load.image('green-top-arrow', 'assets/ui/green_sliderUp.png');
        this.load.image('green-right-arrow', 'assets/ui/green_sliderRight.png');
        this.load.image('green-button', 'assets/ui/green_button03.png');
        this.tick('Generating the UI');
    }

    private loadAudio() {
        this.load.audio('ambiance', 'assets/audio/AMB.mp3');
        this.tick('Loading forest ambiance');
        this.load.audio('rootDirt-p1-1', 'assets/audio/Roots_dirt_v2-1-001.mp3');
        this.load.audio('rootDirt-p1-2', 'assets/audio/Roots_dirt_v2-1-002.mp3');
        this.load.audio('rootDirt-p1-3', 'assets/audio/Roots_dirt_v2-1-003.mp3');
        this.load.audio('rootDirt-p1-4', 'assets/audio/Roots_dirt_v2-1-004.mp3');
        this.load.audio('rootDirt-p2-1', 'assets/audio/Roots_dirt_v2-2-001.mp3');
        this.load.audio('rootDirt-p2-2', 'assets/audio/Roots_dirt_v2-2-002.mp3');
        this.load.audio('rootDirt-p2-3', 'assets/audio/Roots_dirt_v2-2-003.mp3');
        this.load.audio('rootDirt-p2-4', 'assets/audio/Roots_dirt_v2-2-004.mp3');
        this.load.audio('rootDirt-p3-1', 'assets/audio/Roots_dirt_v2-3-001.mp3');
        this.load.audio('rootDirt-p3-2', 'assets/audio/Roots_dirt_v2-3-002.mp3');
        this.load.audio('rootDirt-p3-3', 'assets/audio/Roots_dirt_v2-3-003.mp3');
        this.load.audio('rootDirt-p3-4', 'assets/audio/Roots_dirt_v2-3-004.mp3');
        this.load.audio('rootDirt-p4-1', 'assets/audio/Roots_dirt_v2-4-001.mp3');
        this.load.audio('rootDirt-p4-2', 'assets/audio/Roots_dirt_v2-4-002.mp3');
        this.load.audio('rootDirt-p4-3', 'assets/audio/Roots_dirt_v2-4-003.mp3');
        this.load.audio('rootDirt-p4-4', 'assets/audio/Roots_dirt_v2-4-004.mp3');
        this.load.audio('rootGrass1', 'assets/audio/Roots_grass_v1-001.mp3');
        this.load.audio('rootGrass2', 'assets/audio/Roots_grass_v1-002.mp3');
        this.load.audio('rootGrass3', 'assets/audio/Roots_grass_v1-003.mp3');
        this.load.audio('rootSand-p1-1', 'assets/audio/Roots_sand_v2-1-001.mp3');
        this.load.audio('rootSand-p1-2', 'assets/audio/Roots_sand_v2-1-002.mp3');
        this.load.audio('rootSand-p1-3', 'assets/audio/Roots_sand_v2-1-003.mp3');
        this.load.audio('rootSand-p1-4', 'assets/audio/Roots_sand_v2-1-004.mp3');
        this.load.audio('rootSand-p2-1', 'assets/audio/Roots_sand_v2-2-001.mp3');
        this.load.audio('rootSand-p2-2', 'assets/audio/Roots_sand_v2-2-002.mp3');
        this.load.audio('rootSand-p2-3', 'assets/audio/Roots_sand_v2-2-003.mp3');
        this.load.audio('rootSand-p2-4', 'assets/audio/Roots_sand_v2-2-004.mp3');
        this.load.audio('rootSand-p3-1', 'assets/audio/Roots_sand_v2-3-001.mp3');
        this.load.audio('rootSand-p3-2', 'assets/audio/Roots_sand_v2-3-002.mp3');
        this.load.audio('rootSand-p3-3', 'assets/audio/Roots_sand_v2-3-003.mp3');
        this.load.audio('rootSand-p3-4', 'assets/audio/Roots_sand_v2-3-004.mp3');
        this.load.audio('rootSand-p4-1', 'assets/audio/Roots_sand_v2-4-001.mp3');
        this.load.audio('rootSand-p4-2', 'assets/audio/Roots_sand_v2-4-002.mp3');
        this.load.audio('rootSand-p4-3', 'assets/audio/Roots_sand_v2-4-003.mp3');
        this.load.audio('rootSand-p4-4', 'assets/audio/Roots_sand_v2-4-004.mp3');
        this.load.audio('rootWater1', 'assets/audio/Roots_water_v1-001.mp3');
        this.load.audio('rootWater2', 'assets/audio/Roots_water_v1-002.mp3');
        this.load.audio('rootWater3', 'assets/audio/Roots_water_v1-003.mp3');
        this.load.audio('rootRock1', 'assets/audio/Obs_rock_v1-001.mp3');
        this.load.audio('rootRock2', 'assets/audio/Obs_rock_v1-002.mp3');
        this.load.audio('rootRock3', 'assets/audio/Obs_rock_v1-003.mp3');
        this.load.audio('rootRock4', 'assets/audio/Obs_rock_v1-004.mp3');
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

    private addWaterBar() {
        this.waterBarContainer = this.add.graphics();
        this.waterBarFill = this.add.graphics();
        this.waterBarContainer.fillStyle(0xffffff)
        this.waterBarContainer.fillRect(this.mapPixelWidth - 16, this.mapPixelHeight - 140, 12, 35)
    }

    private clearScene() {
        this.destroyGameObjects();
        this.clearConfig();
        this.scene.start("MainMenuScene");
    }

    private clearConfig() { 
        CONST.LOAD_COUNT = 0;
        CONST.SCORE = 0;
        CONST.ROOTS = 0;
        this.loaded = false;
        this.initialized = false;
        this.behaviorSelected = false;
        this.turn = 0;
        this.tileMultiplier = 1;
        this.soundParam = 0;
        this.mapLevel = 1;
        this.levelToLoad = this.mapLevel + '-s' + this.tileMultiplier;
        this.mapTileWidth = this.tileMultiplier * 16;
        this.mapPixelWidth = this.tileMultiplier * 16 * CONST.TILE_WIDTH;
        this.mapTileHeight = this.tileMultiplier * 9;
        this.mapPixelHeight = this.tileMultiplier * 9 * CONST.TILE_HEIGHT;
        this.backgroundTiles = [];
        this.foregroundTiles = [];
        this.map = [];
        this.roots = [];
        this.rootsToRemove = [];
        this.rootsBehavior = new Map([
            [TileTypeForBehavior.GRASS, Behavior.AHEAD],
            [TileTypeForBehavior.SOIL, Behavior.AHEAD],
            [TileTypeForBehavior.SAND, Behavior.AHEAD],
            [TileTypeForBehavior.WATER, Behavior.AHEAD],
            [TileTypeForBehavior.TREE, Behavior.LEFT],
            [TileTypeForBehavior.ROCK, Behavior.RIGHT],
            [TileTypeForBehavior.ROOTS, Behavior.LEFT],
        ]);
        this.behaviorInputs = {
            grass: { selected: Behavior.AHEAD },
            soil: { selected: Behavior.AHEAD },
            sand: { selected: Behavior.AHEAD },
            trees: { selected: Behavior.LEFT },
            rocks: { selected: Behavior.RIGHT },
            roots: { selected: Behavior.LEFT }
        };
    }

    private destroyGameObjects() {
        Object.values(this.behaviorInputs).forEach(value =>
        {
            value.leftArrow?.destroy();
            value.topArrow?.destroy();
            value.rightArrow?.destroy();
            value.panel?.destroy();
            value.tile?.destroy();
        });

        this.gameloopTimer?.destroy();
        this.ambianceAudio?.destroy();
        this.sound1?.destroy();
        this.sound2?.destroy();
        this.sound3?.destroy();
        this.sound4?.destroy();
        this.waterBarContainer?.destroy();
        this.waterBarFill?.destroy();
    }
}

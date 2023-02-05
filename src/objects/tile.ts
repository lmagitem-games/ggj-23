import { Coord } from "./coord";

export enum TileType {
    GRASS = 0,
    SOIL = 1,
    SAND = 2,
    WATER = 3,
}

export enum TileContents {
    NOTHING = -1,
    TREE = 0,
    ROCK = 1,
    ROOTS_T = 10,
    ROOTS_R = 11,
    ROOTS_D = 12,
    ROOTS_L = 13
}

export enum TileTypeForBehavior {
    GRASS = "GRASS",
    SOIL = "SOIL",
    SAND = "SAND",
    WATER = "WATER",
    TREE = "TREE",
    ROCK = "ROCK",
    ROOTS = "ROOTS",
}

export enum TileAsset {
    GRASS1 = 0,
    GRASS2 = 1,
    SOIL1 = 13,
    SOIL2 = 14,
    SAND1 = 2,
    SAND2 = 3,
    WATER1 = 26,
    WATER2 = 27,
    TREE1 = 22,
    TREE2 = 23,
    TREE3 = 24,
    TREE4 = 25,
    ROCK1 = 9,
    ROCK2 = 10,
    ROCK3 = 11,
    ROCK4 = 12,
    ROOTS_TD = 4,
    ROOTS_LR = 5,
    ROOTS_TR = 30,
    ROOTS_TL = 31,
    ROOTS_DR = 17,
    ROOTS_DL = 18,
    ROOTS_TC = 33,
    ROOTS_RC = 32,
    ROOTS_DC = 34,
    ROOTS_LC = 19,
    EMPTY = null
}

export class Tile {
    private coord: Coord;
    private tile: TileType;
    private contents: TileContents;
    private background: TileAsset;
    private foreground: TileAsset;
    private typeForBehavior: TileTypeForBehavior;
    private typeForBehaviorWithoutRoots: TileTypeForBehavior;
    private backgroundSprite: Phaser.GameObjects.Sprite;
    private foregroundSprite: Phaser.GameObjects.Sprite;
    private obstacle: boolean;

    constructor(settings: {
        coords: Coord,
        csvBackground: number,
        csvForeground: number,
    }) {
        this.coord = settings.coords;
        this.initTileTypeFromCSV(settings.csvBackground);
        this.initTileContentsFromCSV(settings.csvForeground);
        this.obstacle = false;
        switch (this.tile) {
            case TileType.GRASS:
                this.typeForBehavior = TileTypeForBehavior.GRASS;
                this.typeForBehaviorWithoutRoots = TileTypeForBehavior.GRASS;
                break;
            case TileType.SOIL:
                this.typeForBehavior = TileTypeForBehavior.SOIL;
                this.typeForBehaviorWithoutRoots = TileTypeForBehavior.SOIL;
                break;
            case TileType.SAND:
                this.typeForBehavior = TileTypeForBehavior.SAND;
                this.typeForBehaviorWithoutRoots = TileTypeForBehavior.SAND;
                break;
            default:
                this.typeForBehavior = TileTypeForBehavior.WATER;
                this.typeForBehaviorWithoutRoots = TileTypeForBehavior.WATER;
                break;
        }
        if (this.contents !== TileContents.NOTHING) {
            this.obstacle = true;
            switch (this.contents) {
                case TileContents.TREE:
                    this.typeForBehavior = TileTypeForBehavior.TREE;
                    break;
                case TileContents.ROCK:
                    this.typeForBehavior = TileTypeForBehavior.ROCK;
                    break;
                default:
                    this.typeForBehavior = TileTypeForBehavior.ROOTS;
                    break;
            }
        }
    }

    public isObstacle(): boolean {
        return this.obstacle;
    }

    public getCoord(): Coord {
        return this.coord;
    }

    public getTileType(): TileType {
        return this.tile;
    }

    public getTileContents(): TileContents {
        return this.contents;
    }

    public getBackground(): TileAsset {
        return this.background;
    }

    public getForeground(): TileAsset {
        return this.foreground;
    }

    public getBackgroundSprite(): Phaser.GameObjects.Sprite {
        return this.backgroundSprite;
    }

    public getForegroundSprite(): Phaser.GameObjects.Sprite {
        return this.foregroundSprite;
    }

    public getTileTypeForBehavior(): TileTypeForBehavior {
        return this.typeForBehavior;
    }

    public getTileTypeForBehaviorWithoutRoots(): TileTypeForBehavior {
        return this.typeForBehaviorWithoutRoots;
    }

    public setIsObstacle(obstacle: boolean): void {
        this.obstacle = obstacle;
    }

    public setBackgroundSprite(sprite: Phaser.GameObjects.Sprite): void {
        this.backgroundSprite = sprite;
    }

    public setForegroundSprite(sprite: Phaser.GameObjects.Sprite): void {
        this.foregroundSprite = sprite;
    }

    public updateForeground(asset: TileAsset): void {
        this.foreground = asset;
    }

    private initTileTypeFromCSV(csvCell: number) {
        switch (csvCell) {
            case 1:
                this.tile = TileType.SOIL
                this.background = Math.floor(Math.random() * 4) === 0 ? TileAsset.SOIL1 : TileAsset.SOIL2;
                break;
            case 2:
                this.tile = TileType.SAND
                this.background = Math.floor(Math.random() * 4) === 0 ? TileAsset.SAND1 : TileAsset.SAND2;
                break;
            case 3:
                this.tile = TileType.WATER
                this.background = TileAsset.WATER1
                break;
            default:
                this.tile = TileType.GRASS
                this.background = Math.floor(Math.random() * 4) === 0 ? TileAsset.GRASS1 : TileAsset.GRASS2;
                break;
        }
    }

    private initTileContentsFromCSV(csvCell: number) {
        this.contents = TileContents.NOTHING;
        this.foreground = TileAsset.EMPTY;
        const random = Math.floor(Math.random() * 4);
        switch (csvCell) {
            case 0:
                this.obstacle = true;
                this.contents = TileContents.TREE
                switch (random) {
                    case 0:
                        this.foreground = TileAsset.TREE1
                        break;
                    case 1:
                        this.foreground = TileAsset.TREE2
                        break;
                    case 2:
                        this.foreground = TileAsset.TREE3
                        break;
                    default:
                        this.foreground = TileAsset.TREE4
                        break;
                }
                break;
            case 1:
                this.obstacle = true;
                this.contents = TileContents.ROCK
                switch (random) {
                    case 0:
                        this.foreground = TileAsset.ROCK1
                        break;
                    case 1:
                        this.foreground = TileAsset.ROCK2
                        break;
                    case 2:
                        this.foreground = TileAsset.ROCK3
                        break;
                    default:
                        this.foreground = TileAsset.ROCK4
                        break;
                }
                break;
            case 2:
                this.obstacle = true;
                this.contents = TileContents.ROCK
                this.foreground = TileAsset.ROCK1
                break;
            case 3:
                this.obstacle = true;
                this.contents = TileContents.ROCK
                this.foreground = TileAsset.ROCK2
                break;
            case 4:
                this.obstacle = true;
                this.contents = TileContents.ROCK
                this.foreground = TileAsset.ROCK3
                break;
            case 5:
                this.obstacle = true;
                this.contents = TileContents.ROCK
                this.foreground = TileAsset.ROCK4
                break;
            case 10:
                this.obstacle = true;
                this.contents = TileContents.ROOTS_T
                this.foreground = TileAsset.ROOTS_DC
                break;
            case 11:
                this.obstacle = true;
                this.contents = TileContents.ROOTS_R
                this.foreground = TileAsset.ROOTS_LC
                break;
            case 12:
                this.obstacle = true;
                this.contents = TileContents.ROOTS_D
                this.foreground = TileAsset.ROOTS_TC
                break;
            case 13:
                this.obstacle = true;
                this.contents = TileContents.ROOTS_L
                this.foreground = TileAsset.ROOTS_RC
                break;
        }
    }
}
